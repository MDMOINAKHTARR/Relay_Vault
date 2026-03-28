'use client';
import { motion } from 'framer-motion';
import { Lock, ArrowUpRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { useToast } from './ToastProvider';
import { useWriteContract, useAccount } from 'wagmi';
import { VAULT_ABI } from '@/lib/contracts';
import { parseUnits } from 'viem';
import { useMyAgent } from '@/lib/useAgents';
import { useVaultState } from '@/lib/useVault';

export function VaultCard() {
  const { showToast } = useToast();
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();

  // Get the connected wallet's on-chain agent
  const { agent, isLoading: agentLoading } = useMyAgent(address);
  const vaultAddress = agent?.vaultAddress;

  // Read live vault balances + routing config from chain
  const { balances, routing, isLoading: vaultLoading, refetch } = useVaultState(vaultAddress);

  const handleWithdraw = async () => {
    if (!isConnected) {
      showToast('Please connect your wallet first.', 'error');
      return;
    }
    if (!vaultAddress || !agent) {
      showToast('No vault found — register your agent first.', 'error');
      return;
    }
    if (balances.available <= 0) {
      showToast('No available balance to withdraw.', 'error');
      return;
    }

    try {
      showToast('Initiating withdrawal from Vault...', 'info');
      await writeContractAsync({
        address: vaultAddress as `0x${string}`,
        abi: VAULT_ABI,
        functionName: 'withdraw',
        args: [parseUnits(balances.available.toString(), 6), address as `0x${string}`],
      });
      showToast('Withdrawal successful!', 'success');
      refetch();
    } catch (err: any) {
      showToast(`Withdrawal failed: ${err.shortMessage || err.message}`, 'error');
    }
  };

  // ── Not connected ────────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div className="brute-card" style={{ padding: 32, textAlign: 'center', color: 'var(--rv-gray-400)' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔌</div>
        <div className="text-label" style={{ marginBottom: 8 }}>WALLET NOT CONNECTED</div>
        <p style={{ fontSize: 12, fontFamily: 'var(--rv-font-mono)' }}>Connect your wallet to view vault balances.</p>
      </div>
    );
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (agentLoading || vaultLoading) {
    return (
      <div className="brute-card" style={{ padding: 32, textAlign: 'center', color: 'var(--rv-gray-400)' }}>
        <RefreshCw size={28} style={{ margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
        <div className="text-label">READING VAULT...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── No agent registered ──────────────────────────────────────────────────
  if (!agent || !vaultAddress) {
    return (
      <div className="brute-card" style={{ padding: 32, textAlign: 'center', color: 'var(--rv-gray-400)' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
        <div className="text-label" style={{ marginBottom: 8 }}>NO VAULT FOUND</div>
        <p style={{ fontSize: 12, fontFamily: 'var(--rv-font-mono)', marginBottom: 16 }}>
          Register your agent to deploy a VaultWallet.
        </p>
        <a href="/register" className="brute-btn brute-btn-purple" style={{ display: 'inline-flex', fontSize: 12 }}>
          REGISTER AGENT
        </a>
      </div>
    );
  }

  const lockPct = routing.lockBps / 100;
  const holdPct = routing.holdBps / 100;
  const splitPct = routing.splitBps / 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div className="brute-card" style={{ background: 'var(--rv-black)', color: 'var(--rv-white)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="text-label" style={{ color: 'var(--rv-gray-400)', marginBottom: 4 }}>Connected Vault</div>
            <div className="text-mono" style={{ fontSize: 16, fontWeight: 700 }}>
              {agent.agentId.slice(0, 6)}...{agent.agentId.slice(-4)}
            </div>
            <div className="text-mono" style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>
              {vaultAddress.slice(0, 10)}...{vaultAddress.slice(-8)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="text-label" style={{ color: 'var(--rv-gray-400)', marginBottom: 4 }}>Vault Total</div>
            <div style={{ fontSize: 30, fontWeight: 800, fontFamily: 'var(--rv-font-mono)' }}>
              ${balances.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
        {/* Routing bar */}
        <div style={{ marginTop: 20, display: 'flex', height: 6, borderRadius: 0, overflow: 'hidden', gap: 2 }}>
          <div style={{ flex: holdPct, background: 'var(--rv-teal-600)' }} title={`Hold: ${holdPct}%`} />
          <div style={{ flex: lockPct, background: 'var(--rv-yellow)' }} title={`Lock: ${lockPct}%`} />
          <div style={{ flex: splitPct, background: 'var(--rv-purple-600)' }} title={`Split: ${splitPct}%`} />
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
          {[
            { label: `HOLD ${holdPct.toFixed(0)}%`, color: 'var(--rv-teal-600)' },
            { label: `LOCK ${lockPct.toFixed(0)}%`, color: 'var(--rv-yellow)' },
            { label: `SPLIT ${splitPct.toFixed(0)}%`, color: 'var(--rv-purple-400)' },
          ].map(({ label, color }) => (
            <span key={label} className="text-mono" style={{ fontSize: 9, color, fontWeight: 700 }}>{label}</span>
          ))}
        </div>
      </div>

      {/* Balance Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {/* Available */}
        <motion.div
          whileHover={{ y: -4, boxShadow: '6px 6px 0px var(--rv-teal-600)' }}
          className="brute-card"
          style={{ borderLeft: '6px solid var(--rv-teal-600)' }}
        >
          <div className="text-label" style={{ color: 'var(--rv-teal-600)', marginBottom: 8 }}>Available</div>
          <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--rv-font-mono)', marginBottom: 16 }}>
            ${balances.available.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <button onClick={handleWithdraw} className="brute-btn brute-btn-teal w-full">
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
          <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--rv-font-mono)', marginBottom: 16 }}>
            ${balances.locked.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <a href="/vault" className="brute-btn w-full" style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', borderColor: 'var(--rv-yellow)', color: '#7A5C00', fontSize: 11 }}>
            CLAIM UNLOCKED
          </a>
        </motion.div>

        {/* In Escrow (computed from routing) */}
        <motion.div
          whileHover={{ y: -4, boxShadow: '6px 6px 0px var(--rv-black)' }}
          className="brute-card"
          style={{ borderStyle: 'dashed' }}
        >
          <div className="text-label" style={{ color: 'var(--rv-gray-700)', marginBottom: 8 }}>Split %</div>
          <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--rv-font-mono)', marginBottom: 16 }}>
            {splitPct.toFixed(0)}%
          </div>
          <a href="/vault" className="brute-btn brute-btn-primary w-full" style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', fontSize: 11 }}>
            EDIT ROUTING
          </a>
        </motion.div>
      </div>

      {/* Security status */}
      <div className="brute-card" style={{ display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'space-between', borderStyle: 'dashed' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ShieldCheck size={24} style={{ color: 'var(--rv-purple-600)' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>On-Chain Vault</div>
            <div style={{ fontSize: 12, color: 'var(--rv-gray-400)', fontFamily: 'var(--rv-font-mono)' }}>
              Rep Score: {agent.reputationScore} / 1000
            </div>
          </div>
        </div>
        <button
          onClick={() => { refetch(); showToast('Vault synced.', 'success'); }}
          className="brute-btn"
          style={{ fontSize: 12 }}
        >
          <RefreshCw size={13} /> SYNC
        </button>
      </div>
    </div>
  );
}
