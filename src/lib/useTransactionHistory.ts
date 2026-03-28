'use client';
import { useEffect, useState, useCallback } from 'react';
import { usePublicClient } from 'wagmi';
import { parseAbiItem, formatUnits } from 'viem';
import { CONTRACT_ADDRESSES } from './contracts';

export type LiveTxEvent = {
  id: string;
  type: 'FundsReleased' | 'FundsLocked' | 'TaskCompleted' | 'DisputeOpened' | 'EscrowRefunded' | 'ReputationUpdated' | 'AgentRegistered' | 'BondSlashed';
  escrowId?: string;
  amount?: number;
  from?: string;
  to?: string;
  agentId?: string;
  blockNumber: number;
  txHash: string;
  ipfsCID?: string;
};

// Inline event signatures so we don't depend on indexed ABI arrays
const FUNDSRELEASED_SIG  = parseAbiItem('event FundsReleased(bytes32 indexed escrowId, uint256 amount, address vaultAddress)');
const FUNDSLOCKED_SIG    = parseAbiItem('event FundsLocked(bytes32 indexed escrowId, bytes32 bidId, address payer, address receiver, uint256 amount, uint256 deadline)');
const TASKCOMPLETED_SIG  = parseAbiItem('event TaskCompleted(bytes32 indexed escrowId, string completionProof, uint8 method)');
const DISPUTEOPENED_SIG  = parseAbiItem('event DisputeOpened(bytes32 indexed escrowId, string evidenceCID)');
const ESCROWREFUNDED_SIG = parseAbiItem('event EscrowRefunded(bytes32 indexed escrowId, uint256 amount)');
const REPUTATION_SIG     = parseAbiItem('event ReputationUpdated(address indexed agentId, uint256 previousScore, uint256 newScore, bytes32 trigger)');
const AGENTREGISTERED_SIG= parseAbiItem('event AgentRegistered(address indexed agentId, address vaultAddress, bytes32[] capabilities, uint256 timestamp)');

export function useTransactionHistory() {
  const client = usePublicClient();
  const [events, setEvents] = useState<LiveTxEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const fetchEvents = useCallback(async () => {
    if (!client) return;
    setIsLoading(true);
    setIsError(false);

    try {
      const escrowAddr  = CONTRACT_ADDRESSES.ESCROW;
      const registryAddr = CONTRACT_ADDRESSES.REGISTRY;

      // Fetch from block 0 to latest (reasonable for testnet / local)
      const fromBlock = 0n;

      const [
        releasedLogs,
        lockedLogs,
        completedLogs,
        disputeLogs,
        refundLogs,
        repLogs,
        registeredLogs,
      ] = await Promise.all([
        client.getLogs({ address: escrowAddr, event: FUNDSRELEASED_SIG,  fromBlock, toBlock: 'latest' }),
        client.getLogs({ address: escrowAddr, event: FUNDSLOCKED_SIG,    fromBlock, toBlock: 'latest' }),
        client.getLogs({ address: escrowAddr, event: TASKCOMPLETED_SIG,  fromBlock, toBlock: 'latest' }),
        client.getLogs({ address: escrowAddr, event: DISPUTEOPENED_SIG,  fromBlock, toBlock: 'latest' }),
        client.getLogs({ address: escrowAddr, event: ESCROWREFUNDED_SIG, fromBlock, toBlock: 'latest' }),
        client.getLogs({ address: registryAddr, event: REPUTATION_SIG,    fromBlock, toBlock: 'latest' }),
        client.getLogs({ address: registryAddr, event: AGENTREGISTERED_SIG, fromBlock, toBlock: 'latest' }),
      ]);

      const all: LiveTxEvent[] = [];

      for (const log of releasedLogs) {
        const { escrowId, amount, vaultAddress } = log.args as any;
        all.push({
          id: `${log.transactionHash}-released`,
          type: 'FundsReleased',
          escrowId: escrowId ? `${(escrowId as string).slice(0, 10)}...` : undefined,
          amount: amount ? Number(formatUnits(amount as bigint, 6)) : undefined,
          to: vaultAddress as string,
          blockNumber: Number(log.blockNumber ?? 0n),
          txHash: log.transactionHash ?? '',
          ipfsCID: undefined,
        });
      }

      for (const log of lockedLogs) {
        const { escrowId, payer, receiver, amount } = log.args as any;
        all.push({
          id: `${log.transactionHash}-locked`,
          type: 'FundsLocked',
          escrowId: escrowId ? `${(escrowId as string).slice(0, 10)}...` : undefined,
          amount: amount ? Number(formatUnits(amount as bigint, 6)) : undefined,
          from: payer as string,
          to: receiver as string,
          blockNumber: Number(log.blockNumber ?? 0n),
          txHash: log.transactionHash ?? '',
        });
      }

      for (const log of completedLogs) {
        const { escrowId, completionProof } = log.args as any;
        all.push({
          id: `${log.transactionHash}-completed`,
          type: 'TaskCompleted',
          escrowId: escrowId ? `${(escrowId as string).slice(0, 10)}...` : undefined,
          blockNumber: Number(log.blockNumber ?? 0n),
          txHash: log.transactionHash ?? '',
          ipfsCID: completionProof as string,
        });
      }

      for (const log of disputeLogs) {
        const { escrowId, evidenceCID } = log.args as any;
        all.push({
          id: `${log.transactionHash}-dispute`,
          type: 'DisputeOpened',
          escrowId: escrowId ? `${(escrowId as string).slice(0, 10)}...` : undefined,
          blockNumber: Number(log.blockNumber ?? 0n),
          txHash: log.transactionHash ?? '',
          ipfsCID: evidenceCID as string,
        });
      }

      for (const log of refundLogs) {
        const { escrowId, amount } = log.args as any;
        all.push({
          id: `${log.transactionHash}-refund`,
          type: 'EscrowRefunded',
          escrowId: escrowId ? `${(escrowId as string).slice(0, 10)}...` : undefined,
          amount: amount ? Number(formatUnits(amount as bigint, 6)) : undefined,
          blockNumber: Number(log.blockNumber ?? 0n),
          txHash: log.transactionHash ?? '',
        });
      }

      for (const log of repLogs) {
        const { agentId, newScore, trigger } = log.args as any;
        all.push({
          id: `${log.transactionHash}-rep`,
          type: 'ReputationUpdated',
          agentId: agentId as string,
          amount: newScore ? Number(newScore) : undefined,
          ipfsCID: trigger ? trigger as string : undefined,
          blockNumber: Number(log.blockNumber ?? 0n),
          txHash: log.transactionHash ?? '',
        });
      }

      for (const log of registeredLogs) {
        const { agentId } = log.args as any;
        all.push({
          id: `${log.transactionHash}-registered`,
          type: 'AgentRegistered',
          agentId: agentId as string,
          blockNumber: Number(log.blockNumber ?? 0n),
          txHash: log.transactionHash ?? '',
        });
      }

      // Sort descending by block number
      all.sort((a, b) => b.blockNumber - a.blockNumber);
      setEvents(all);
    } catch (err) {
      console.error('[useTransactionHistory] getLogs failed:', err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { events, isLoading, isError, refetch: fetchEvents };
}
