import { ethers } from "ethers";

// ABI fragments needed to fetch the success metrics
const registryAbi = [
  "function agentCount() external view returns (uint256)",
  "event AgentRegistered(address indexed agentId, address vaultAddress, bytes32[] capabilities, uint256 timestamp)"
];

const escrowAbi = [
  "event FundsLocked(bytes32 indexed escrowId, bytes32 bidId, address payer, address receiver, uint256 amount, uint256 deadline)",
  "event TaskCompleted(bytes32 indexed escrowId, string completionProof, uint8 method)",
  "event DisputeOpened(bytes32 indexed escrowId, string evidenceCID)"
];

async function collectMetrics(rpcUrl: string, registryAddress: string, escrowAddress: string) {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const registry = new ethers.Contract(registryAddress, registryAbi, provider);
  const escrow = new ethers.Contract(escrowAddress, escrowAbi, provider);

  console.log("Fetching RelayVault KPI Metrics...\n");

  // 1. Registered Agents
  const agentCount = await registry.agentCount();
  console.log(`[Metric] Total Registered Agents: ${agentCount.toString()}`);

  // 2. Tasks Executed (Querying past 10000 blocks for TaskCompleted events)
  const currentBlock = await provider.getBlockNumber();
  const startBlock = Math.max(0, currentBlock - 10000); // Look back ~2 days on fast chains
  
  const completedFilter = escrow.filters.TaskCompleted();
  const completedEvents = await escrow.queryFilter(completedFilter, startBlock, "latest");
  console.log(`[Metric] Tasks Completed (last 10k blocks): ${completedEvents.length}`);

  // 3. Total USDC Volume & Average Task Value
  const lockedFilter = escrow.filters.FundsLocked();
  const lockedEvents = await escrow.queryFilter(lockedFilter, startBlock, "latest");
  
  let totalVolume = 0n;
  for (const event of lockedEvents) {
    if ('args' in event) {
        totalVolume += event.args[4]; // Amount is 5th arg
    }
  }
  
  const volumeFormatted = ethers.formatUnits(totalVolume, 6); // Assuming USDC (6 decimals)
  console.log(`[Metric] Total Task Volume Locked (last 10k blocks): $${volumeFormatted} USDC`);
  
  if (lockedEvents.length > 0) {
      const avg = totalVolume / BigInt(lockedEvents.length);
      console.log(`[Metric] Average Task Size: $${ethers.formatUnits(avg, 6)} USDC`);
  }

  // 4. Dispute Rate
  const disputeFilter = escrow.filters.DisputeOpened();
  const disputeEvents = await escrow.queryFilter(disputeFilter, startBlock, "latest");
  
  if (lockedEvents.length > 0) {
      const disputeRate = (disputeEvents.length / lockedEvents.length) * 100;
      console.log(`[Metric] Dispute Rate: ${disputeRate.toFixed(2)}%`);
  } else {
      console.log(`[Metric] Dispute Rate: N/A (no tasks)`);
  }

  console.log("\nMetrics collection complete.");
}

// Example Execution
// collectMetrics("https://rpc.mainnet.monad.xyz", "0x...", "0x...")
//   .catch(console.error);
