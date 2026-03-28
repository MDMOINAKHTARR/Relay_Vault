// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IRelayVault.sol";

contract NegotiationEngine is INegotiationEngine {
    address public owner;
    address public taskEscrow;
    IAgentRegistry public registry;

    mapping(bytes32 => Bid) public bids;
    bytes32[] public allBidIds;
    
    // Mapping target agent to their open bids
    mapping(address => bytes32[]) public agentBids;

    event BidSubmitted(bytes32 indexed bidId, address initiator, address targetAgent, string taskSpecCID, uint256 price, uint256 ttl);
    event BidCountered(bytes32 indexed bidId, address by, uint256 newPrice);
    event BidAccepted(bytes32 indexed bidId, uint256 agreedPrice, bytes32 escrowId);
    event BidCancelled(bytes32 indexed bidId);

    constructor(address _registry) {
        owner = msg.sender;
        registry = IAgentRegistry(_registry);
    }

    function setTaskEscrow(address _taskEscrow) external {
        require(msg.sender == owner, "Only owner");
        taskEscrow = _taskEscrow;
    }

    function submitBid(string calldata taskSpecCID, address targetAgent, uint256 price, uint256 ttlBlocks) external override returns (bytes32) {
        require(registry.getVaultAddress(targetAgent) != address(0), "Target agent not found");

        bytes32 bidId = keccak256(abi.encodePacked(msg.sender, targetAgent, taskSpecCID, block.timestamp));
        require(bids[bidId].initiator == address(0), "Bid exists");

        Bid storage newBid = bids[bidId];
        newBid.bidId = bidId;
        newBid.taskSpecCID = taskSpecCID;
        newBid.initiator = msg.sender;
        newBid.targetAgent = targetAgent;
        newBid.price = price;
        newBid.ttlBlocks = block.number + ttlBlocks;
        newBid.state = BidState.OPEN;
        newBid.createdAt = block.timestamp;

        allBidIds.push(bidId);
        agentBids[targetAgent].push(bidId);
        agentBids[msg.sender].push(bidId);

        emit BidSubmitted(bidId, msg.sender, targetAgent, taskSpecCID, price, ttlBlocks);
        return bidId;
    }

    function counterBid(bytes32 bidId, uint256 newPrice) external override {
        Bid storage bid = bids[bidId];
        require(bid.state == BidState.OPEN || bid.state == BidState.COUNTERED, "Not open");
        require(block.number <= bid.ttlBlocks, "Bid expired");
        require(msg.sender == bid.initiator || msg.sender == bid.targetAgent, "Unauthorized");

        bid.price = newPrice;
        bid.state = BidState.COUNTERED;
        bid.ttlBlocks = block.number + 100; // Reset TTL on counter

        bid.counterHistory.push(CounterBid({
            price: newPrice,
            by: msg.sender,
            at: block.timestamp
        }));

        emit BidCountered(bidId, msg.sender, newPrice);
    }

    function acceptBid(bytes32 bidId) external override {
        Bid storage bid = bids[bidId];
        require(bid.state == BidState.OPEN || bid.state == BidState.COUNTERED, "Not open");
        require(block.number <= bid.ttlBlocks, "Bid expired");
        require(msg.sender == bid.initiator || msg.sender == bid.targetAgent, "Unauthorized");

        bid.state = BidState.ACCEPTED;

        // Auto lock funds in TaskEscrow (Skipped USDC allowance check for brevity)
        bytes32 escrowId = keccak256(abi.encodePacked(bidId, block.timestamp));
        
        // Ensure taskEscrow has the lockFunds method and call it.
        // In a complete implementation, this would require approval from payer.
        ITaskEscrow(taskEscrow).lockFunds(bidId, bid.price, 100);

        emit BidAccepted(bidId, bid.price, escrowId);
    }

    function cancelBid(bytes32 bidId) external override {
        Bid storage bid = bids[bidId];
        require(bid.state == BidState.OPEN || bid.state == BidState.COUNTERED, "Not open");
        require(msg.sender == bid.initiator, "Only initiator can cancel");

        bid.state = BidState.CANCELLED;
        emit BidCancelled(bidId);
    }

    function getBid(bytes32 bidId) external view override returns (Bid memory) {
        return bids[bidId];
    }

    function getAgentBids(address agent) external view returns (bytes32[] memory) {
        return agentBids[agent];
    }

    function getAllBidIds() external view returns (bytes32[] memory) {
        return allBidIds;
    }
}
