'use client';
import { useReadContracts, useWriteContract, useAccount } from 'wagmi';
import { VAULT_ABI } from './contracts';
import { formatUnits } from 'viem';
import { useMemo } from 'react';

export type VaultBalances = {
  available: number;
  locked: number;
  total: number;
};

export type VaultRouting = {
  lockBps: number;   // e.g. 2000 = 20%
  holdBps: number;   // e.g. 5000 = 50%
  splitBps: number;  // 10000 - lockBps - holdBps
};

/**
 * Reads balance + BPS config from VaultWallet for a given vault address.
 * Returns numbers in USDC (6 decimals) and BPS (basis points out of 10000).
 */
export function useVaultState(vaultAddress?: string) {
  const contracts = vaultAddress
    ? [
        {
          address: vaultAddress as `0x${string}`,
          abi: VAULT_ABI,
          functionName: 'getBalance' as const,
        },
        {
          address: vaultAddress as `0x${string}`,
          abi: VAULT_ABI,
          functionName: 'currentLockBps' as const,
        },
        {
          address: vaultAddress as `0x${string}`,
          abi: VAULT_ABI,
          functionName: 'currentHoldBps' as const,
        },
      ]
    : [];

  const { data, isLoading, isError, refetch } = useReadContracts({
    contracts,
    query: { enabled: !!vaultAddress },
  });

  const balances: VaultBalances = useMemo(() => {
    const defaults = { available: 0, locked: 0, total: 0 };
    if (!data || data.length < 1 || data[0].status !== 'success') return defaults;
    const v = data[0].result as any;
    if (Array.isArray(v)) {
      return {
        available: Number(formatUnits(v[0] as bigint, 6)),
        locked:    Number(formatUnits(v[1] as bigint, 6)),
        total:     Number(formatUnits(v[2] as bigint, 6)),
      };
    }
    if (v && v.available !== undefined) {
      return {
        available: Number(formatUnits(v.available as bigint, 6)),
        locked:    Number(formatUnits(v.locked as bigint, 6)),
        total:     Number(formatUnits(v.total as bigint, 6)),
      };
    }
    return defaults;
  }, [data]);

  const routing: VaultRouting = useMemo(() => {
    const defaults = { lockBps: 2000, holdBps: 5000, splitBps: 3000 };
    if (!data || data.length < 3) return defaults;
    const lockResult = data[1];
    const holdResult = data[2];
    if (lockResult.status !== 'success' || holdResult.status !== 'success') return defaults;
    const lockBps = Number(lockResult.result as bigint);
    const holdBps = Number(holdResult.result as bigint);
    return { lockBps, holdBps, splitBps: 10000 - lockBps - holdBps };
  }, [data]);

  return { balances, routing, isLoading, isError, refetch };
}

/** Write setRouting to the VaultWallet */
export function useSetRouting() {
  const { writeContractAsync, isPending } = useWriteContract();

  const setRouting = async (
    vaultAddress: string,
    splits: { recipient: `0x${string}`; bps: number }[],
    lockBps: number,
    holdBps: number
  ) => {
    return writeContractAsync({
      address: vaultAddress as `0x${string}`,
      abi: VAULT_ABI,
      functionName: 'setRouting',
      args: [
        splits.map((s) => ({ recipient: s.recipient, bps: s.bps })),
        lockBps,
        holdBps,
      ],
    });
  };

  return { setRouting, isPending };
}

/** Write claimUnlocked to the VaultWallet */
export function useClaimUnlocked() {
  const { writeContractAsync, isPending } = useWriteContract();

  const claimUnlocked = async (vaultAddress: string) => {
    return writeContractAsync({
      address: vaultAddress as `0x${string}`,
      abi: VAULT_ABI,
      functionName: 'claimUnlocked',
      args: [],
    });
  };

  return { claimUnlocked, isPending };
}
