// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IRelayVault.sol";

contract AgentRegistry is IAgentRegistry {
    address public owner;
    address public taskEscrow;
    address public disputeResolver;

    uint256 public agentCount;
    mapping(address => AgentInfo) public agents;
    mapping(address => address) public agentVaults;
    address[] public agentAddresses; // track all agent addresses for enumeration
    
    // Reverse mapping from vault to agent
    mapping(address => address) public vaultToAgent;

    event AgentRegistered(address indexed agentId, address vaultAddress, bytes32[] capabilities, uint256 timestamp);
    event CapabilitiesUpdated(address indexed agentId, bytes32[] capabilities);
    event ReputationUpdated(address indexed agentId, uint256 previousScore, uint256 newScore, bytes32 trigger);
    event AgentSuspended(address indexed agentId, string reason);
    event AgentDeregistered(address indexed agentId);

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

    constructor() {
        owner = msg.sender;
    }

    function setRoles(address _taskEscrow, address _disputeResolver) external onlyOwner {
        taskEscrow = _taskEscrow;
        disputeResolver = _disputeResolver;
    }

    function register(
        bytes32[] calldata capabilities, 
        PricingModel calldata pricingModel, 
        bytes calldata routingConfig
    ) external override {
        require(agents[msg.sender].agentId == address(0), "Already registered");
        require(capabilities.length <= 32, "Max 32 capabilities");

        // Deploy VaultWallet (Using a mock deployment for simplicity here, 
        // in production this would use CREATE2 and a proxy factory)
        VaultWallet newVault = new VaultWallet();
        newVault.initialize(msg.sender, taskEscrow, pricingModel.currency);

        AgentInfo memory newAgent = AgentInfo({
            agentId: msg.sender,
            capabilities: capabilities,
            pricingModel: pricingModel,
            reputationScore: 500, // Starts at 500
            vaultAddress: address(newVault),
            status: AgentStatus.ACTIVE,
            registeredAt: block.timestamp,
            totalTasksCompleted: 0
        });

        agents[msg.sender] = newAgent;
        agentVaults[msg.sender] = address(newVault);
        vaultToAgent[address(newVault)] = msg.sender;
        agentAddresses.push(msg.sender);
        agentCount++;

        emit AgentRegistered(msg.sender, address(newVault), capabilities, block.timestamp);
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

contract VaultWallet is IVaultWallet {
    address public owner;
    address public taskEscrow;
    address public currency; // e.g., USDC or WETH address

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

    function initialize(address _owner, address _taskEscrow, address _currency) external override {
        require(!initialized, "Already init");
        owner = _owner;
        taskEscrow = _taskEscrow;
        currency = _currency;
        
        // Default routing: 50% hold, 20% lock, 30% split (placeholder config)
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

    function receivePayment(uint256 amount, bytes32 taskId, address payer) external override onlyEscrow {
        // Atomic Routing Executed Here. 
        // Assume USDC was transferred to this contract before this call.

        uint256 lockAmt = (amount * currentLockBps) / 10000;
        uint256 holdAmt = (amount * currentHoldBps) / 10000;

        if (lockAmt > 0) {
            lockedBalance += lockAmt;
            timeLocks.push(LockEntry({
                amount: lockAmt,
                unlockBlock: block.number + (30 days / 12), // rough blocks for 30 days
                taskId: taskId
            }));
        }

        if (holdAmt > 0) {
            availableBalance += holdAmt;
        }

        // Process splits
        for (uint i = 0; i < currentSplits.length; i++) {
            uint256 splitAmt = (amount * currentSplits[i].bps) / 10000;
            // Transfer splitAmt to currentSplits[i].recipient... (Skipped IERC20 for brevity)
        }

        emit PaymentProcessed(taskId, amount, lockAmt, holdAmt);
    }

    function withdraw(uint256 amount, address recipient) external override onlyOwner {
        require(availableBalance >= amount, "Insufficient available balance");
        availableBalance -= amount;
        // Transfer currency to recipient...
        emit Withdrawal(address(this), recipient, amount);
    }

    function claimUnlocked() external override {
        uint256 newlyUnlocked = 0;
        for (uint i = 0; i < timeLocks.length; i++) {
            if (timeLocks[i].amount > 0 && block.number >= timeLocks[i].unlockBlock) {
                newlyUnlocked += timeLocks[i].amount;
                timeLocks[i].amount = 0; // Mark claimed
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
