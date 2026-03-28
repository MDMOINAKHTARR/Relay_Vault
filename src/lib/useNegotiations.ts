'use client';
import { useReadContract, useReadContracts } from 'wagmi';
import { CONTRACT_ADDRESSES, NEGOTIATION_ABI } from './contracts';
import { useMemo } from 'react';
import { formatEther } from 'viem';

export type OnChainBid = {
  bidId: string;
  taskSpecCID: string;
  initiator: string;
  targetAgent: string;
  price: number;       // human-readable (formatEther)
  priceRaw: bigint;    // raw for contract calls
  ttlBlocks: number;
  state: 'OPEN' | 'COUNTERED' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';
  counterHistory: { price: number; by: string; at: number }[];
  createdAt: number;
};

const STATE_MAP: Record<number, OnChainBid['state']> = {
  0: 'OPEN',
  1: 'COUNTERED',
  2: 'ACCEPTED',
  3: 'EXPIRED',
  4: 'CANCELLED',
};

function mapBid(raw: any): OnChainBid | null {
  if (!raw || raw.initiator === '0x0000000000000000000000000000000000000000') return null;
  return {
    bidId: raw.bidId as string,
    taskSpecCID: raw.taskSpecCID as string,
    initiator: raw.initiator as string,
    targetAgent: raw.targetAgent as string,
    price: Number(formatEther(raw.price as bigint)),
    priceRaw: raw.price as bigint,
    ttlBlocks: Number(raw.ttlBlocks),
    state: STATE_MAP[Number(raw.state)] ?? 'EXPIRED',
    counterHistory: (raw.counterHistory as any[]).map((c) => ({
      price: Number(formatEther(c.price as bigint)),
      by: c.by as string,
      at: Number(c.at) * 1000, // convert to ms for Date
    })),
    createdAt: Number(raw.createdAt),
  };
}

/** Get all bid IDs involving a specific address (as initiator or target) */
export function useMyBidIds(address?: string) {
  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.NEGOTIATION,
    abi: NEGOTIATION_ABI,
    functionName: 'getAgentBids',
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address },
  });

  return {
    bidIds: (data as `0x${string}`[] | undefined) ?? [],
    isLoading,
    refetch,
  };
}

/** Given a list of bidIds, fetch all bid details */
export function useBids(bidIds: `0x${string}`[]) {
  const contracts = bidIds.map((bidId) => ({
    address: CONTRACT_ADDRESSES.NEGOTIATION as `0x${string}`,
    abi: NEGOTIATION_ABI,
    functionName: 'getBid' as const,
    args: [bidId] as const,
  }));

  const { data, isLoading, refetch } = useReadContracts({
    contracts,
    query: { enabled: bidIds.length > 0 },
  });

  const bids: OnChainBid[] = useMemo(() => {
    if (!data) return [];
    return data
      .map((result) => (result.status === 'success' ? mapBid(result.result) : null))
      .filter((b): b is OnChainBid => b !== null);
  }, [data]);

  return { bids, isLoading, refetch };
}

/** Combined hook: get all bids for address */
export function useMyBids(address?: string) {
  const { bidIds, isLoading: loadingIds, refetch: refetchIds } = useMyBidIds(address);
  const { bids, isLoading: loadingBids, refetch: refetchBids } = useBids(bidIds);

  return {
    bids,
    isLoading: loadingIds || loadingBids,
    refetch: () => { refetchIds(); refetchBids(); },
  };
}
