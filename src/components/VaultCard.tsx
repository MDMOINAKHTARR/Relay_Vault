'use client';
import { motion } from 'framer-motion';
import { VAULT_ROUTING, MY_AGENT } from '@/lib/mockData';
import { Lock, TrendingUp, Wallet, Clock, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { useToast } from './ToastProvider';
import { useReadContract, useWriteContract, useAccount } from 'wagmi';
import { VAULT_ABI, CONTRACT_ADDRESSES } from '@/lib/contracts';
import { formatUnits, parseUnits } from 'viem';

export function VaultCard() {
  const { showToast } = useToast();
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();

  // Fetch real on-chain vault balance
  const { data: vaultBalanceData } = useReadContract({
    address: MY_AGENT.vaultAddress as `0x${string}`,
    abi: VAULT_ABI,
    functionName: 'getBalance',
  });

  let totalBalance = MY_AGENT.totalEarnings;
  let available   = totalBalance * VAULT_ROUTING.holdFraction;
  let locked      = totalBalance * VAULT_ROUTING.lockFraction;

  if (vaultBalanceData) {
    const v = vaultBalanceData as any;
    if (v.available !== undefined) {
      available = Number(formatUnits(v.available, 6));
      locked = Number(formatUnits(v.locked, 6));
      totalBalance = Number(formatUnits(v.total, 6));
    } else if (Array.isArray(v)) {
      available = Number(formatUnits(v[0], 6));
      locked = Number(formatUnits(v[1], 6));
      totalBalance = Number(formatUnits(v[2], 6));
    }
  }

  const handleWithdraw = async () => {
    if (!isConnected) {
      showToast("Please connect your wallet first.", "error");
      return;
    }

    const contractsDeployed = !!process.env.NEXT_PUBLIC_REGISTRY_ADDRESS;
    if (!contractsDeployed) {
      showToast(`Contracts not deployed yet.`, 'error');
      return;
    }

    try {
      showToast('Initiating withdrawal from Vault...', 'info');
      await writeContractAsync({
        address: MY_AGENT.vaultAddress as `0x${string}`,
        abi: VAULT_ABI,
        functionName: 'withdraw',
        args: [parseUnits(available.toString(), 6), address as `0x${string}`],
      });
      showToast('Withdrawal successful!', 'success');
    } catch (err: any) {
      showToast(`Withdrawal failed: ${err.shortMessage || err.message}`, 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Info */}
      <div className="brute-card" style={{ background: 'var(--rv-black)', color: 'var(--rv-white)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="text-label" style={{ color: 'var(--rv-gray-400)', marginBottom: 4 }}>Connected Vault</div>
            <div className="text-mono" style={{ fontSize: 18, fontWeight: 700 }}>{MY_AGENT.name}</div>
            <div className="text-mono" style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>{MY_AGENT.vaultAddress}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="text-label" style={{ color: 'var(--rv-gray-400)', marginBottom: 4 }}>Net Earned</div>
            <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--rv-font-mono)' }}>${totalBalance.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Balance Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
        {/* Available */}
        <motion.div 
          whileHover={{ y: -4, boxShadow: '6px 6px 0px var(--rv-teal-600)' }}
          className="brute-card" 
          style={{ borderLeft: '6px solid var(--rv-teal-600)' }}
        >
          <div className="text-label" style={{ color: 'var(--rv-teal-600)', marginBottom: 8 }}>Available</div>
          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--rv-font-mono)', marginBottom: 16 }}>
            ${available.toLocaleString()}
          </div>
          <button 
            onClick={handleWithdraw}
            className="brute-btn brute-btn-teal w-full"
          >
            <ArrowUpRight size={14} /> WITHDRAW
          </button>
        </motion.div>

        {/* Locked */}
        <motion.div 
          whileHover={{ y: -4, boxShadow: '6px 6px 0px var(--rv-yellow)' }}
          className="brute-card" 
          style={{ borderLeft: '6px solid var(--rv-yellow)', background: 'rgba(245, 200, 66, 0.05)' }}
        >
          <div className="text-label" style={{ color: '#7A5C00', marginBottom: 8 }}>Time-Locked</div>
          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--rv-font-mono)', marginBottom: 16 }}>
            ${locked.toLocaleString()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#7A5C00', fontWeight: 600, marginBottom: 12 }}>
            <Clock size={12} /> UNLOCKS IN 1,420 BLOCKS
          </div>
          <button 
            onClick={() => showToast('No funds currently available for release.', 'error')}
            className="brute-btn w-full" 
            style={{ borderColor: 'var(--rv-yellow)', color: '#7A5C00' }}
          >
            CLAIM UNLOCKED
          </button>
        </motion.div>

        {/* Escrow */}
        <motion.div 
          whileHover={{ y: -4, boxShadow: '6px 6px 0px var(--rv-black)' }}
          className="brute-card" 
          style={{ borderStyle: 'dashed' }}
        >
          <div className="text-label" style={{ color: 'var(--rv-gray-700)', marginBottom: 8 }}>In Escrow Flow</div>
          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--rv-font-mono)', marginBottom: 16 }}>
            $0.00
          </div>
          <p style={{ fontSize: 11, color: 'var(--rv-gray-400)', marginBottom: 12 }}>No active tasks awaiting verification.</p>
          <button 
            onClick={() => showToast('Routing to task management console...', 'info')}
            className="brute-btn brute-btn-primary w-full"
          >
            VIEW ESCROWS
          </button>
        </motion.div>
      </div>

      {/* Global Actions */}
      <div className="brute-card" style={{ display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'space-between', borderStyle: 'dashed' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ShieldCheck size={24} style={{ color: 'var(--rv-purple-600)' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Security Status: Level 3 Approved</div>
            <div style={{ fontSize: 12, color: 'var(--rv-gray-400)' }}>Governance quorum met for external withdrawals.</div>
          </div>
        </div>
        <button 
          onClick={() => showToast('Vault re-verification initiated.', 'info')}
          className="brute-btn brute-btn-purple"
        >
          RE-VERIFY
        </button>
      </div>
    </div>
  );
}
