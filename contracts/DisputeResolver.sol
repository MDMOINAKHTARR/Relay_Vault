// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IRelayVault.sol";

interface ITaskEscrowDispute {
    function resolveDispute(bytes32 escrowId, uint8 resolutionOutcome) external;
}

contract DisputeResolver {
    address public owner;
    address public taskEscrow;
    IAgentRegistry public registry;

    enum DisputeState { OPEN, EVIDENCE_GATHERING, VOTING, RESOLVED, APPEALED }
    enum Resolution { NONE, FULL_PAYER, FULL_RECEIVER, SPLIT }

    struct Dispute {
        bytes32 disputeId;
        bytes32 escrowId;
        address claimant;
        address respondent;
        string[] evidenceCIDs;
        address[] arbitrators;
        mapping(address => Resolution) votes;
        Resolution finalResolution;
        DisputeState state;
        uint256 voteDeadlineBlock;
    }

    mapping(bytes32 => Dispute) public disputes;

    event DisputeCreated(bytes32 indexed disputeId, bytes32 indexed escrowId, address claimant);
    event EvidenceSubmitted(bytes32 indexed disputeId, address by, string evidenceCID);
    event ArbitratorVoted(bytes32 indexed disputeId, address arbitrator, Resolution resolution);
    event DisputeResolved(bytes32 indexed disputeId, Resolution finalResolution);

    constructor(address _registry) {
        owner = msg.sender;
        registry = IAgentRegistry(_registry);
    }

    function setTaskEscrow(address _taskEscrow) external {
        require(msg.sender == owner, "Only owner");
        taskEscrow = _taskEscrow;
    }

    function openDispute(bytes32 escrowId, string calldata evidenceCID, address respondent) external returns (bytes32) {
        require(msg.sender == address(taskEscrow), "Only TaskEscrow");

        bytes32 disputeId = keccak256(abi.encodePacked(escrowId, block.timestamp));
        Dispute storage d = disputes[disputeId];
        d.disputeId = disputeId;
        d.escrowId = escrowId;
        d.claimant = msg.sender;
        d.respondent = respondent;
        d.state = DisputeState.EVIDENCE_GATHERING;
        d.voteDeadlineBlock = block.number + 86400; // 24 hours voting window (1 block/sec)

        d.evidenceCIDs.push(evidenceCID);

        emit DisputeCreated(disputeId, escrowId, msg.sender);
        return disputeId;
    }

    function submitEvidence(bytes32 disputeId, string calldata evidenceCID) external {
        Dispute storage d = disputes[disputeId];
        require(d.state == DisputeState.EVIDENCE_GATHERING, "Not gathering evidence");
        require(msg.sender == d.claimant || msg.sender == d.respondent, "Not involved");

        d.evidenceCIDs.push(evidenceCID);
        emit EvidenceSubmitted(disputeId, msg.sender, evidenceCID);
    }

    function assignArbitrators(bytes32 disputeId, address[] calldata arbitratorsList) external {
        // Simplified selection mechanism restricted to owner (In real-world would use VRF)
        require(msg.sender == owner, "Only owner");
        Dispute storage d = disputes[disputeId];
        require(d.state == DisputeState.EVIDENCE_GATHERING, "Invalid state");

        d.arbitrators = arbitratorsList;
        d.state = DisputeState.VOTING;
    }

    function voteResolution(bytes32 disputeId, Resolution resolution) external {
        Dispute storage d = disputes[disputeId];
        require(d.state == DisputeState.VOTING, "Not voting Phase");
        require(block.number <= d.voteDeadlineBlock, "Voting ended");
        
        bool isArbitrator = false;
        for (uint i = 0; i < d.arbitrators.length; i++) {
            if (d.arbitrators[i] == msg.sender) {
                isArbitrator = true;
                break;
            }
        }
        require(isArbitrator, "Not an arbitrator");
        require(d.votes[msg.sender] == Resolution.NONE, "Already voted");

        d.votes[msg.sender] = resolution;
        emit ArbitratorVoted(disputeId, msg.sender, resolution);
    }

    function finalizeResolution(bytes32 disputeId) external {
        Dispute storage d = disputes[disputeId];
        require(d.state == DisputeState.VOTING, "Not in voting phase");
        require(block.number > d.voteDeadlineBlock, "Voting not yet finished");

        // Simplified tally logic: majority wins 
        uint256 countsPayer = 0;
        uint256 countsReceiver = 0;
        uint256 countsSplit = 0;

        for (uint i = 0; i < d.arbitrators.length; i++) {
            Resolution v = d.votes[d.arbitrators[i]];
            if (v == Resolution.FULL_PAYER) countsPayer++;
            else if (v == Resolution.FULL_RECEIVER) countsReceiver++;
            else if (v == Resolution.SPLIT) countsSplit++;
        }

        if (countsPayer > countsReceiver && countsPayer > countsSplit) {
            d.finalResolution = Resolution.FULL_PAYER;
        } else if (countsReceiver > countsPayer && countsReceiver > countsSplit) {
            d.finalResolution = Resolution.FULL_RECEIVER;
        } else {
            d.finalResolution = Resolution.SPLIT;
        }

        d.state = DisputeState.RESOLVED;

        ITaskEscrowDispute(taskEscrow).resolveDispute(d.escrowId, uint8(d.finalResolution));
        emit DisputeResolved(disputeId, d.finalResolution);
    }
}
