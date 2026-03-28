'use client';
import { motion } from 'framer-motion';
import { type OnChainAgent } from '@/lib/useAgents';
import { Zap, User } from 'lucide-react';
import { useToast } from './ToastProvider';
import { useRouter } from 'next/navigation';
import { useWriteContract, useAccount } from 'wagmi';
import { NEGOTIATION_ABI, CONTRACT_ADDRESSES } from '@/lib/contracts';
import { parseUnits } from 'viem';

function getReputationColor(score: number) {
  if (score >= 900) return 'var(--rv-teal-600)';
  if (score >= 700) return 'var(--rv-purple-600)';
  if (score >= 500) return 'var(--rv-yellow)';
  return 'var(--rv-coral-600)';
}

const PRICING_LABELS = ['FIXED', 'DUTCH', 'REVERSE'];

interface AgentCardProps {
  agent: OnChainAgent;
  compact?: boolean;
}

export function AgentCard({ agent, compact = false }: AgentCardProps) {
  const { showToast } = useToast();
  const router = useRouter();
  const { isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const repColor = getReputationColor(agent.reputationScore);
  const shortId = `${agent.agentId.slice(0, 6)}...${agent.agentId.slice(-4)}`;
  const statusLabel = agent.status === 'active' ? 'ACTIVE' : agent.status === 'suspended' ? 'SUSPENDED' : 'INACTIVE';

  const handleHire = async () => {
    if (!isConnected) {
      showToast('Please connect your wallet first.', 'error');
      return;
    }
    try {
      showToast(`Broadcasting bid for ${shortId}...`, 'info');
      await writeContractAsync({
        address: CONTRACT_ADDRESSES.NEGOTIATION,
        abi: NEGOTIATION_ABI,
        functionName: 'submitBid',
        args: [
          'QmTaskSpecPlaceholder',
          agent.agentId as `0x${string}`,
          parseUnits(agent.pricingModel.basePrice.toString(), 6),
          BigInt(86400), // 24 hours TTL on Monad Testnet (1 block/sec)
        ],
      });
      showToast('Bid broadcasted successfully!', 'success');
      setTimeout(() => router.push(`/negotiate?agentId=${agent.agentId}`), 1200);
    } catch (err: any) {
      showToast(`Transaction failed: ${err.shortMessage || err.message}`, 'error');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ transform: 'translate(-3px, -3px)', boxShadow: '7px 7px 0px var(--rv-black)' }}
      className="brute-card"
      style={{ padding: compact ? '16px' : '24px', cursor: 'pointer', background: 'var(--rv-pure-white)' }}
    >
      {/* Avatar + Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{
          width: 48, height: 48,
          background: 'var(--rv-black)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--rv-font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--rv-white)',
          border: '1.5px solid var(--rv-black)'
        }}>
          {shortId.slice(0, 2).toUpperCase()}
        </div>
        <span className={`brute-badge ${statusLabel === 'ACTIVE' ? 'badge-success' : 'badge-error'}`}>
          {statusLabel}
        </span>
      </div>

      {/* ID + pricing type */}
      <div className="text-h2" style={{ marginBottom: 2, fontSize: 15 }}>{shortId}</div>
      <div style={{ fontSize: 11, color: 'var(--rv-gray-400)', marginBottom: 14, fontFamily: 'var(--rv-font-mono)', textTransform: 'uppercase' }}>
        {PRICING_LABELS[agent.pricingModel.pricingType] ?? 'FIXED'} · ON-CHAIN AGENT
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 14 }}>
        {[
          { val: `${agent.pricingModel.basePrice > 0 ? agent.pricingModel.basePrice : '—'}`, lbl: 'BASE USDC' },
          { val: agent.totalTasksCompleted.toLocaleString(), lbl: 'TASKS' },
        ].map(({ val, lbl }) => (
          <div key={lbl} style={{ textAlign: 'center', padding: '10px 4px', border: '1px solid var(--rv-gray-100)', background: 'var(--rv-white)' }}>
            <div style={{ fontFamily: 'var(--rv-font-mono)', fontSize: 15, fontWeight: 700 }}>{val}</div>
            <div className="text-label" style={{ fontSize: 9, marginTop: 2 }}>{lbl}</div>
          </div>
        ))}
      </div>

      {/* Reputation bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span className="text-label" style={{ color: 'var(--rv-gray-700)' }}>Reputation</span>
        <span style={{ fontFamily: 'var(--rv-font-mono)', fontSize: 11, color: repColor, fontWeight: 700 }}>
          {agent.reputationScore}/1000
        </span>
      </div>
      <div style={{ height: 12, border: '1.5px solid var(--rv-black)', background: 'var(--rv-white)', position: 'relative' }}>
        <div style={{ height: '100%', width: `${agent.reputationScore / 10}%`, background: repColor }} />
      </div>

      {!compact && (
        <>
          {/* Capabilities */}
          <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {agent.capabilities.length > 0
              ? agent.capabilities.slice(0, 4).map((cap, i) => (
                  <span key={i} className="brute-badge" style={{ fontSize: 9, background: 'var(--rv-white)', borderColor: 'var(--rv-black)', color: 'var(--rv-black)' }}>
                    {cap.split(':').pop()?.toUpperCase() ?? cap.toUpperCase()}
                  </span>
                ))
              : <span className="brute-badge" style={{ fontSize: 9, color: 'var(--rv-gray-400)' }}>NO CAPS SET</span>
            }
          </div>

          {/* Actions */}
          <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
            <button onClick={handleHire} className="brute-btn brute-btn-purple" style={{ flex: 1 }}>
              <Zap size={14} /> HIRE
            </button>
            <button
              onClick={() => showToast(`Agent: ${agent.agentId}`, 'info')}
              className="brute-btn"
              style={{ padding: '0 12px' }}
            >
              <User size={14} />
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
}
