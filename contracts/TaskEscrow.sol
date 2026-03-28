// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IRelayVault.sol";

interface IDisputeResolver {
    function resolveDispute(bytes32 escrowId) external;
}

contract TaskEscrow is ITaskEscrow {
    address public owner;
    IAgentRegistry public registry;
    INegotiationEngine public negotiation;
    address public disputeResolver;
    address public governance;

    mapping(bytes32 => Escrow) public escrows;
    mapping(bytes32 => bool) public largeTaskApproved;
    bytes32[] public activeEscrows;

    event FundsLocked(bytes32 indexed escrowId, bytes32 bidId, address payer, address receiver, uint256 amount, uint256 deadline);
    event TaskCompleted(bytes32 indexed escrowId, string completionProof, VerificationMethod method);
    event FundsReleased(bytes32 indexed escrowId, uint256 amount, address vaultAddress);
    event DisputeOpened(bytes32 indexed escrowId, string evidenceCID);
    event EscrowRefunded(bytes32 indexed escrowId, uint256 amount);

    constructor(address _registry) {
        owner = msg.sender;
        registry = IAgentRegistry(_registry);
    }

    function setEngines(address _negotiation, address _disputeResolver, address _governance) external {
        require(msg.sender == owner, "Only owner");
        negotiation = INegotiationEngine(_negotiation);
        disputeResolver = _disputeResolver;
        governance = _governance;
    }

    function approveLargeTask(bytes32 escrowId) external {
        require(msg.sender == governance, "Only governance");
        require(escrows[escrowId].amount > 10000 * 1e6, "Not a large task");
        largeTaskApproved[escrowId] = true;
    }

    modifier onlyNegotiation() {
        require(msg.sender == address(negotiation), "Only negotiation engine");
        _;
    }

    function lockFunds(bytes32 bidId, uint256 amount, uint256 deadlineBlocks) external override onlyNegotiation {
        // Assume USDC transferred here from payer
        INegotiationEngine.Bid memory bid = negotiation.getBid(bidId);
        require(bid.state == INegotiationEngine.BidState.ACCEPTED, "Bid not accepted");

        bytes32 escrowId = keccak256(abi.encodePacked(bidId, block.number));
        require(escrows[escrowId].payer == address(0), "Escrow exists");

        Escrow storage newEscrow = escrows[escrowId];
        newEscrow.escrowId = escrowId;
        newEscrow.bidId = bidId;
        newEscrow.payer = bid.initiator;
        newEscrow.receiver = bid.targetAgent;
        newEscrow.amount = amount;
        newEscrow.deadlineBlock = block.number + deadlineBlocks;
        newEscrow.state = EscrowState.LOCKED;
        
        // Mock method for now
        newEscrow.verificationMethod = VerificationMethod.HUMAN;

        activeEscrows.push(escrowId);

        emit FundsLocked(escrowId, bidId, bid.initiator, bid.targetAgent, amount, newEscrow.deadlineBlock);
    }

    function verifyAndRelease(bytes32 escrowId, string calldata completionProof) external override {
        Escrow storage escrow = escrows[escrowId];
        require(escrow.state == EscrowState.LOCKED, "Not locked");
        require(msg.sender == escrow.payer || msg.sender == escrow.receiver, "Unauthorized");

        if (escrow.amount > 10000 * 1e6) {
            require(largeTaskApproved[escrowId], "Governance approval required");
        }

        escrow.state = EscrowState.RELEASED;

        // Routing payment to VaultWallet of receiver
        address vault = registry.getVaultAddress(escrow.receiver);
        require(vault != address(0), "Vault missing");

        // Forward payment to receiver's VaultWallet (USDC assumed)
        IVaultWallet(vault).receivePayment(escrow.amount, escrow.bidId, escrow.payer);
        
        // Update reputation in registry (successful task)
        registry.updateReputation(escrow.receiver, 10, escrow.bidId); // Base positive score increase

        emit TaskCompleted(escrowId, completionProof, escrow.verificationMethod);
        emit FundsReleased(escrowId, escrow.amount, vault);
    }

    function openDispute(bytes32 escrowId, string calldata evidenceCID) external override {
        Escrow storage escrow = escrows[escrowId];
        require(escrow.state == EscrowState.LOCKED || escrow.state == EscrowState.COMPLETED, "Invalid state for dispute");
        require(msg.sender == escrow.payer || msg.sender == escrow.receiver, "Unauthorized");

        escrow.state = EscrowState.DISPUTED;
        emit DisputeOpened(escrowId, evidenceCID);
    }

    function resolveDispute(bytes32 escrowId, uint8 resolutionOutcome) external override {
        require(msg.sender == disputeResolver, "Only DisputeResolver");
        Escrow storage escrow = escrows[escrowId];
        require(escrow.state == EscrowState.DISPUTED, "Not disputed");

        if (resolutionOutcome == 1) { // FULL_PAYER
            escrow.state = EscrowState.REFUNDED;
            // Refund to payer logic...
            registry.updateReputation(escrow.receiver, -20, escrow.bidId);
            emit EscrowRefunded(escrowId, escrow.amount);
        } else if (resolutionOutcome == 2) { // FULL_RECEIVER
            escrow.state = EscrowState.RELEASED;
            address vault = registry.getVaultAddress(escrow.receiver);
            IVaultWallet(vault).receivePayment(escrow.amount, escrow.bidId, escrow.payer);
            registry.updateReputation(escrow.receiver, 5, escrow.bidId);
            emit FundsReleased(escrowId, escrow.amount, vault);
        } else { // SPLIT (e.g., 50/50 block)
            uint256 split = escrow.amount / 2;
            escrow.state = EscrowState.REFUNDED;
            // Refund split to payer
            emit EscrowRefunded(escrowId, split);
            // Send split to VaultWallet
            address vault = registry.getVaultAddress(escrow.receiver);
            IVaultWallet(vault).receivePayment(split, escrow.bidId, escrow.payer);
            registry.updateReputation(escrow.receiver, -5, escrow.bidId);
            emit FundsReleased(escrowId, split, vault);
        }
    }
}
