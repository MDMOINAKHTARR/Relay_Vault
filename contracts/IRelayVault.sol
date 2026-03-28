// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IAgentRegistry {
    enum PricingType { FIXED, AUCTION, DYNAMIC }
    enum AgentStatus { ACTIVE, SUSPENDED, INACTIVE }

    struct PricingModel {
        uint256 basePrice;
        address currency;
        PricingType pricingType;
    }

    struct AgentInfo {
        address agentId;
        bytes32[] capabilities;
        PricingModel pricingModel;
        uint256 reputationScore;
        address vaultAddress;
        AgentStatus status;
        uint256 registeredAt;
        uint256 totalTasksCompleted;
    }

    function register(bytes32[] calldata capabilities, PricingModel calldata pricingModel, bytes calldata routingConfig) external;
    function updateCapabilities(address agentId, bytes32[] calldata capabilities) external;
    function updatePricing(address agentId, PricingModel calldata pricingModel) external;
    function updateReputation(address agentId, int256 deltaScore, bytes32 taskId) external;
    function getAgent(address agentId) external view returns (AgentInfo memory);
    function getVaultAddress(address agentId) external view returns (address);
    function suspend(address agentId, string calldata reason) external;
    function deregister(address agentId) external;
}

interface IVaultWallet {
    struct SplitRecipient {
        address recipient;
        uint16 bps;
    }

    function initialize(address _owner, address _taskEscrow, address _currency) external;
    function setRouting(SplitRecipient[] calldata splits, uint16 lockBps, uint16 holdBps) external;
    function receivePayment(uint256 amount, bytes32 taskId, address payer) external;
    function withdraw(uint256 amount, address recipient) external;
    function claimUnlocked() external;
    function getBalance() external view returns (uint256 available, uint256 locked, uint256 total);
}

interface INegotiationEngine {
    enum BidState { OPEN, COUNTERED, ACCEPTED, EXPIRED, CANCELLED }

    struct CounterBid {
        uint256 price;
        address by;
        uint256 at;
    }

    struct Bid {
        bytes32 bidId;
        string taskSpecCID;
        address initiator;
        address targetAgent;
        uint256 price;
        uint256 ttlBlocks;
        BidState state;
        CounterBid[] counterHistory;
        uint256 createdAt;
    }

    function submitBid(string calldata taskSpecCID, address targetAgent, uint256 price, uint256 ttlBlocks) external returns (bytes32);
    function counterBid(bytes32 bidId, uint256 newPrice) external;
    function acceptBid(bytes32 bidId) external;
    function cancelBid(bytes32 bidId) external;
    function getBid(bytes32 bidId) external view returns (Bid memory);
}

interface ITaskEscrow {
    enum EscrowState { PENDING_LOCK, LOCKED, COMPLETED, RELEASED, DISPUTED, REFUNDED, EXPIRED }
    enum VerificationMethod { ORACLE, AUTOMATED, OPTIMISTIC, HUMAN, SELF_REPORT }

    struct Escrow {
        bytes32 escrowId;
        bytes32 bidId;
        address payer;
        address receiver;
        uint256 amount;
        uint256 deadlineBlock;
        EscrowState state;
        VerificationMethod verificationMethod;
    }

    function lockFunds(bytes32 bidId, uint256 amount, uint256 deadlineBlocks) external;
    function verifyAndRelease(bytes32 escrowId, string calldata completionProof) external;
    function openDispute(bytes32 escrowId, string calldata evidenceCID) external;
    function resolveDispute(bytes32 escrowId, uint8 resolutionOutcome) external;
}
