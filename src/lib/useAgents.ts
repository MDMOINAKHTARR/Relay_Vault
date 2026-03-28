'use client';
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES, REGISTRY_ABI } from './contracts';
import { useMemo } from 'react';
import { formatEther } from 'viem';

export type OnChainAgent = {
  agentId: string;
  name: string;
  capabilities: string[];
  reputationScore: number;
  pricingModel: {
    basePrice: number;
    currency: string;
    pricingType: number;
  };
  vaultAddress: string;
  status: 'active' | 'inactive' | 'suspended';
  registeredAt: number;
  totalTasksCompleted: number;
};

const PRICING_TYPE_LABELS = ['FIXED', 'DUTCH', 'REVERSE_AUCTION'];
const STATUS_MAP: Record<number, 'active' | 'inactive' | 'suspended'> = {
  0: 'active',
  1: 'inactive',
  2: 'suspended',
};

// Convert bytes32 to readable string capability label
function bytes32ToString(hex: string): string {
  try {
    // Remove 0x prefix and trailing zeros, then decode as utf-8
    const bytes = hex.slice(2).replace(/0+$/, '');
    let str = '';
    for (let i = 0; i < bytes.length; i += 2) {
      const charCode = parseInt(bytes.slice(i, i + 2), 16);
      if (charCode > 0) str += String.fromCharCode(charCode);
    }
    return str || hex.slice(0, 10) + '...';
  } catch {
    return hex.slice(0, 10) + '...';
  }
}

export function useAgents() {
  const { data, isLoading, isError, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.REGISTRY,
    abi: REGISTRY_ABI,
    functionName: 'getAllAgents',
  });

  const agents: OnChainAgent[] = useMemo(() => {
    if (!data) return [];
    return (data as any[])
      .filter((a) => a.agentId !== '0x0000000000000000000000000000000000000000')
      .map((a) => ({
        agentId: a.agentId as string,
        name: `Agent ${(a.agentId as string).slice(0, 6)}...${(a.agentId as string).slice(-4)}`,
        capabilities: (a.capabilities as string[]).map(bytes32ToString),
        reputationScore: Number(a.reputationScore),
        pricingModel: {
          basePrice: Number(formatEther(a.pricingModel.basePrice as bigint)), // stored via parseEther on register
          currency: a.pricingModel.currency as string,
          pricingType: Number(a.pricingModel.pricingType),
        },
        vaultAddress: a.vaultAddress as string,
        status: STATUS_MAP[Number(a.status)] ?? 'inactive',
        registeredAt: Number(a.registeredAt),
        totalTasksCompleted: Number(a.totalTasksCompleted),
      }));
  }, [data]);

  return { agents, isLoading, isError, refetch };
}

export function useMyAgent(address?: string) {
  const { data, isLoading, isError, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.REGISTRY,
    abi: REGISTRY_ABI,
    functionName: 'getAgent',
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address },
  });

  const agent: OnChainAgent | null = useMemo(() => {
    if (!data || !(data as any).agentId || (data as any).agentId === '0x0000000000000000000000000000000000000000') return null;
    const a = data as any;
    return {
      agentId: a.agentId as string,
      name: `Agent ${(a.agentId as string).slice(0, 6)}...${(a.agentId as string).slice(-4)}`,
      capabilities: (a.capabilities as string[]).map(bytes32ToString),
      reputationScore: Number(a.reputationScore),
      pricingModel: {
        basePrice: Number(formatEther(a.pricingModel.basePrice as bigint)), // stored via parseEther on register
        currency: a.pricingModel.currency as string,
        pricingType: Number(a.pricingModel.pricingType),
      },
      vaultAddress: a.vaultAddress as string,
      status: STATUS_MAP[Number(a.status)] ?? 'inactive',
      registeredAt: Number(a.registeredAt),
      totalTasksCompleted: Number(a.totalTasksCompleted),
    };
  }, [data]);

  return { agent, isLoading, isError, refetch };
}
