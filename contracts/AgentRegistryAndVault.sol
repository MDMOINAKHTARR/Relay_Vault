// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IRelayVault.sol";

/**
 * @title MinimalProxyFactory
 * @dev EIP-1167 minimal proxy cloner — inlined so we have zero external deps.
 *      Cloning costs ~45k gas vs ~900k gas for `new VaultWallet()`.
 */
library MinimalProxyFactory {
    function clone(address implementation) internal returns (address instance) {
        /// @solidity memory-safe-assembly
        assembly {
            // EIP-1167 minimal proxy bytecode constructor
            let ptr := mload(0x40)
            mstore(ptr,         0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000)
            mstore(add(ptr, 0x14), shl(0x60, implementation))
            mstore(add(ptr, 0x28), 0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000)
            instance := create(0, ptr, 0x37)
        }
        require(instance != address(0), "Clone failed");
    }
}

contract AgentRegistry is IAgentRegistry {
    address public owner;
    address public taskEscrow;
    address public disputeResolver;

    /// @dev Single VaultWallet implementation — deployed once, cloned per agent.
    address public vaultImplementation;

    uint256 public agentCount;
    mapping(address => AgentInfo) public agents;
    mapping(address => address) public agentVaults;
    address[] public agentAddresses;

    // Reverse mapping from vault to agent
    mapping(address => address) public vaultToAgent;

    event AgentRegistered(address indexed agentId, address vaultAddress, bytes32[] capabilities, uint256 timestamp);
    event CapabilitiesUpdated(address indexed agentId, bytes32[] capabilities);
    event ReputationUpdated(address indexed agentId, uint256 previousScore, uint256 newScore, bytes32 trigger);
    event AgentSuspended(address indexed agentId, string reason);
    event AgentDeregistered(address indexed agentId);
    event VaultImplementationSet(address implementation);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyEscrowOrResolver() {
        require(msg.sender == taskEscrow || msg.sender == disputeResolver, "Unauthorized");
        _;
    }

    modifier onlyAgent(address agentId) {
        require(msg.sender == agentId, "Not the agent");
        _;
    }

    constructor(address _vaultImplementation) {
        owner = msg.sender;
        vaultImplementation = _vaultImplementation;
        emit VaultImplementationSet(_vaultImplementation);
    }

    function setRoles(address _taskEscrow, address _disputeResolver) external onlyOwner {
        taskEscrow = _taskEscrow;
        disputeResolver = _disputeResolver;
    }

    /// @notice Update vault implementation (owner only). Existing vaults are unaffected.
    function setVaultImplementation(address _impl) external onlyOwner {
        require(_impl != address(0), "Zero address");
        vaultImplementation = _impl;
        emit VaultImplementationSet(_impl);
    }

    /**
     * @notice Register as an agent.
     * @dev Now uses EIP-1167 clone instead of `new VaultWallet()`.
     *      Gas reduced from ~1.25M → ~150k.
     */
    function register(
        bytes32[] calldata capabilities,
        PricingModel calldata pricingModel,
        bytes calldata /* routingConfig */
    ) external override {
        require(agents[msg.sender].agentId == address(0), "Already registered");
        require(capabilities.length <= 32, "Max 32 capabilities");
        require(vaultImplementation != address(0), "Vault impl not set");

        // ── EIP-1167 clone: ~45k gas instead of ~900k ──────────────────────
        address newVaultAddr = MinimalProxyFactory.clone(vaultImplementation);
        IVaultWallet(newVaultAddr).initialize(msg.sender, taskEscrow, pricingModel.currency);

        AgentInfo memory newAgent = AgentInfo({
            agentId: msg.sender,
            capabilities: capabilities,
            pricingModel: pricingModel,
            reputationScore: 500,
            vaultAddress: newVaultAddr,
            status: AgentStatus.ACTIVE,
            registeredAt: block.timestamp,
            totalTasksCompleted: 0
        });

        agents[msg.sender] = newAgent;
        agentVaults[msg.sender] = newVaultAddr;
        vaultToAgent[newVaultAddr] = msg.sender;
        agentAddresses.push(msg.sender);
        agentCount++;

        emit AgentRegistered(msg.sender, newVaultAddr, capabilities, block.timestamp);
    }

    function updateCapabilities(address agentId, bytes32[] calldata capabilities) external override onlyAgent(agentId) {
        require(capabilities.length <= 32, "Max 32 capabilities");
        agents[agentId].capabilities = capabilities;
        emit CapabilitiesUpdated(agentId, capabilities);
    }

    function updatePricing(address agentId, PricingModel calldata pricingModel) external override onlyAgent(agentId) {
        agents[agentId].pricingModel = pricingModel;
    }

    function updateReputation(address agentId, int256 deltaScore, bytes32 taskId) external override onlyEscrowOrResolver {
        AgentInfo storage agent = agents[agentId];
        uint256 prevScore = agent.reputationScore;

        int256 newScoreRaw = int256(prevScore) + deltaScore;
        if (newScoreRaw < 0) newScoreRaw = 0;
        if (newScoreRaw > 1000) newScoreRaw = 1000;

        agent.reputationScore = uint256(newScoreRaw);
        if (deltaScore > 0) {
            agent.totalTasksCompleted++;
        }

        emit ReputationUpdated(agentId, prevScore, agent.reputationScore, taskId);
    }

    function getAgent(address agentId) external view override returns (AgentInfo memory) {
        return agents[agentId];
    }

    function getVaultAddress(address agentId) external view override returns (address) {
        return agentVaults[agentId];
    }

    function getAllAgents() external view returns (AgentInfo[] memory) {
        AgentInfo[] memory result = new AgentInfo[](agentAddresses.length);
        for (uint256 i = 0; i < agentAddresses.length; i++) {
            result[i] = agents[agentAddresses[i]];
        }
        return result;
    }

    function suspend(address agentId, string calldata reason) external override onlyOwner {
        agents[agentId].status = AgentStatus.SUSPENDED;
        emit AgentSuspended(agentId, reason);
    }

    function deregister(address agentId) external override onlyAgent(agentId) {
        agents[agentId].status = AgentStatus.INACTIVE;
        emit AgentDeregistered(agentId);
    }
}

/**
 * @title VaultWallet
 * @dev Deployed ONCE as an implementation contract — never called directly.
 *      All per-agent instances are EIP-1167 clones pointing here.
 *
 *      Gas savings per registration:
 *        Before: ~900k gas (full bytecode deployment)
 *        After:  ~45k gas  (45-byte proxy deployment)
 */
contract VaultWallet is IVaultWallet {
    address public owner;
    address public taskEscrow;
    address public currency;

    uint256 public availableBalance;
    uint256 public lockedBalance;

    struct LockEntry {
        uint256 amount;
        uint256 unlockBlock;
        bytes32 taskId;
    }

    LockEntry[] public timeLocks;

    SplitRecipient[] public currentSplits;
    uint16 public currentLockBps;
    uint16 public currentHoldBps;

    bool public initialized;

    event RoutingUpdated(address vault, uint16 lockBps, uint16 holdBps);
    event PaymentProcessed(bytes32 taskId, uint256 totalAmount, uint256 lockAmount, uint256 holdAmount);
    event Withdrawal(address vault, address recipient, uint256 amount);

    /// @dev Prevent the implementation contract itself from being initialized
    constructor() {
        initialized = true; // lock the implementation
    }

    function initialize(address _owner, address _taskEscrow, address _currency) external override {
        require(!initialized, "Already init");
        owner = _owner;
        taskEscrow = _taskEscrow;
        currency = _currency;

        // Default routing: 50% hold, 20% lock, 30% unallocated (user configures split later)
        currentHoldBps = 5000;
        currentLockBps = 2000;

        initialized = true;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyEscrow() {
        require(msg.sender == taskEscrow, "Not TaskEscrow");
        _;
    }

    function setRouting(SplitRecipient[] calldata splits, uint16 lockBps, uint16 holdBps) external override onlyOwner {
        uint256 totalSplitBps = 0;
        for (uint i = 0; i < splits.length; i++) {
            totalSplitBps += splits[i].bps;
        }
        require(totalSplitBps + lockBps + holdBps == 10000, "Must sum to 10000 BPS");

        delete currentSplits;
        for (uint i = 0; i < splits.length; i++) {
            currentSplits.push(splits[i]);
        }
        currentLockBps = lockBps;
        currentHoldBps = holdBps;

        emit RoutingUpdated(address(this), lockBps, holdBps);
    }

    function receivePayment(uint256 amount, bytes32 taskId, address /* payer */) external override onlyEscrow {
        uint256 lockAmt = (amount * currentLockBps) / 10000;
        uint256 holdAmt = (amount * currentHoldBps) / 10000;

        if (lockAmt > 0) {
            lockedBalance += lockAmt;
            timeLocks.push(LockEntry({
                amount: lockAmt,
                unlockBlock: block.number + (30 days / 12),
                taskId: taskId
            }));
        }

        if (holdAmt > 0) {
            availableBalance += holdAmt;
        }

        for (uint i = 0; i < currentSplits.length; i++) {
            uint256 splitAmt = (amount * currentSplits[i].bps) / 10000;
            // Transfer splitAmt to currentSplits[i].recipient (IERC20 call omitted)
            (splitAmt); // silence unused warning
        }

        emit PaymentProcessed(taskId, amount, lockAmt, holdAmt);
    }

    function withdraw(uint256 amount, address recipient) external override onlyOwner {
        require(availableBalance >= amount, "Insufficient available balance");
        availableBalance -= amount;
        // Transfer currency to recipient (IERC20 call omitted)
        emit Withdrawal(address(this), recipient, amount);
    }

    function claimUnlocked() external override {
        uint256 newlyUnlocked = 0;
        for (uint i = 0; i < timeLocks.length; i++) {
            if (timeLocks[i].amount > 0 && block.number >= timeLocks[i].unlockBlock) {
                newlyUnlocked += timeLocks[i].amount;
                timeLocks[i].amount = 0;
            }
        }
        require(newlyUnlocked > 0, "No unlocked funds");
        lockedBalance -= newlyUnlocked;
        availableBalance += newlyUnlocked;
    }

    function getBalance() external view override returns (uint256 available, uint256 locked, uint256 total) {
        return (availableBalance, lockedBalance, availableBalance + lockedBalance);
    }
}
