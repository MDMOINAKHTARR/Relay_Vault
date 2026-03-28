'use client';
import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { NegotiationCard } from '@/components/NegotiationCard';
import { useAgents } from '@/lib/useAgents';
import { useMyBids } from '@/lib/useNegotiations';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { NEGOTIATION_ABI, CONTRACT_ADDRESSES } from '@/lib/contracts';
import { parseEther } from 'viem';
import { Send, ChevronDown, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';
import { useSearchParams } from 'next/navigation';

function NegotiateInner() {
  const searchParams = useSearchParams();
  const prefilledAgent = searchParams.get('agentId') ?? '';

  const [price, setPrice] = useState('');
  const [targetAgent, setTargetAgent] = useState(prefilledAgent);
  const [taskDesc, setTaskDesc] = useState('');
  const [pricingMode, setPricingMode] = useState<'FIXED' | 'DUTCH' | 'REVERSE'>('FIXED');
  const { showToast } = useToast();

  const { address, isConnected } = useAccount();
  const { agents, isLoading: loadingAgents } = useAgents();
  const { bids, isLoading: loadingBids, refetch: refetchBids } = useMyBids(address);

  const { data: txHash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  // Pre-fill agent from URL param when agents load
  useEffect(() => {
    if (prefilledAgent) setTargetAgent(prefilledAgent);
  }, [prefilledAgent]);

  // Refresh bids after tx confirmed
  useEffect(() => {
    if (isConfirmed) {
      showToast('Bid submitted! On-chain confirmed.', 'success');
      setPrice('');
      setTaskDesc('');
      refetchBids();
    }
  }, [isConfirmed]);

  const handleSubmitBid = () => {
    if (!isConnected) {
      showToast('Connect your wallet first.', 'error');
      return;
    }
    if (!targetAgent || !price) {
      showToast('Select an agent and enter a price.', 'error');
      return;
    }

    try {
      writeContract({
        address: CONTRACT_ADDRESSES.NEGOTIATION,
        abi: NEGOTIATION_ABI,
        functionName: 'submitBid',
        args: [
          taskDesc || 'QmTaskSpecPlaceholder',
          targetAgent as `0x${string}`,
          parseEther(price),
          BigInt(86400), // 86400 blocks TTL (1 day)
        ],
      });
      showToast('Broadcasting bid to Monad Testnet...', 'info');
    } catch (err: any) {
      showToast(`Error: ${err.shortMessage || err.message}`, 'error');
    }
  };

  return (
    <div style={{ background: 'var(--rv-white)', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 40px 120px' }}>

        <div style={{ marginBottom: 48, borderBottom: '1.5px solid var(--rv-black)', paddingBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div className="text-label" style={{ color: 'var(--rv-purple-600)', marginBottom: 8 }}>// NEGOTIATION_ENGINE.SOL</div>
            <h1 className="text-h1" style={{ marginBottom: 12 }}>NEGOTIATE</h1>
            <p style={{ fontSize: 15, color: 'var(--rv-gray-600)', fontFamily: 'var(--rv-font-mono)' }}>
              ATOMIC BID SUBMISSION · SECURE ESCROW SETTLEMENT · MONAD TESTNET
            </p>
          </div>
          <button onClick={() => refetchBids()} className="brute-btn" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <RefreshCw size={14} /> REFRESH BIDS
          </button>
        </div>

        {!isConnected && (
          <div className="brute-card" style={{ padding: 32, borderColor: 'var(--rv-coral-600)', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 16 }}>
            <AlertCircle size={24} style={{ color: 'var(--rv-coral-600)', flexShrink: 0 }} />
            <div>
              <div className="text-label" style={{ marginBottom: 4 }}>WALLET NOT CONNECTED</div>
              <p style={{ fontSize: 13, color: 'var(--rv-gray-400)', margin: 0, fontFamily: 'var(--rv-font-mono)' }}>
                Connect your wallet to submit bids and view your negotiations.
              </p>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>

          {/* Submit Bid Form */}
          <div>
            <div className="text-label" style={{ marginBottom: 16 }}>// SUBMIT NEW BID</div>
            <div className="brute-card" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* Agent select */}
              <div>
                <label className="text-label" style={{ marginBottom: 8, display: 'block' }}>TARGET AGENT</label>
                <div style={{ position: 'relative' }}>
                  <select
                    className="brute-input"
                    value={targetAgent}
                    onChange={(e) => setTargetAgent(e.target.value)}
                    style={{ appearance: 'none', cursor: 'pointer', height: 48, width: '100%' }}
                  >
                    <option value="">SELECT ON-CHAIN REGISTERED ENTITY...</option>
                    {loadingAgents && <option disabled>Loading from chain...</option>}
                    {agents.map((a) => (
                      <option key={a.agentId} value={a.agentId}>
                        {a.agentId.slice(0, 8)}...{a.agentId.slice(-6)} (REP_{a.reputationScore})
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--rv-gray-400)', pointerEvents: 'none' }} />
                </div>
                {targetAgent && (
                  <div style={{ marginTop: 8, fontFamily: 'var(--rv-font-mono)', fontSize: 11, color: 'var(--rv-gray-400)', wordBreak: 'break-all' }}>
                    → {targetAgent}
                  </div>
                )}
              </div>

              {/* Pricing mode */}
              <div>
                <label className="text-label" style={{ marginBottom: 12, display: 'block' }}>PRICING LOGIC</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {([['FIXED', 'FIXED PRICE'], ['DUTCH', 'DUTCH AUCTION'], ['REVERSE', 'REVERSE BID']] as const).map(([val, lbl]) => (
                    <button
                      key={val}
                      onClick={() => setPricingMode(val)}
                      className="brute-badge"
                      style={{
                        cursor: 'pointer',
                        background: pricingMode === val ? 'var(--rv-black)' : 'var(--rv-white)',
                        color: pricingMode === val ? 'var(--rv-white)' : 'var(--rv-black)',
                        borderColor: 'var(--rv-black)',
                        padding: '6px 16px',
                      }}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bid amount */}
              <div>
                <label className="text-label" style={{ marginBottom: 8, display: 'block' }}>BID AMOUNT (MON)</label>
                <input
                  className="brute-input"
                  type="number"
                  step="0.01"
                  placeholder="AMOUNT IN MON..."
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  style={{ height: 48, width: '100%' }}
                />
              </div>

              {/* Task spec */}
              <div>
                <label className="text-label" style={{ marginBottom: 8, display: 'block' }}>TASK REQUIREMENTS</label>
                <textarea
                  className="brute-input"
                  placeholder="DESCRIBE DELIVERABLES, VERIFICATION PARAMS, AND CONSTRAINTS..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  rows={4}
                  style={{ resize: 'vertical', padding: '12px 16px', width: '100%' }}
                />
              </div>

              {/* Trust bond warning */}
              {price && parseFloat(price) >= 10 && (
                <div style={{ padding: '16px', border: '1.5px solid var(--rv-black)', background: 'rgba(245, 200, 66, 0.1)' }}>
                  <div className="text-label" style={{ color: '#7A5C00', marginBottom: 6 }}>TRUST_BOND ATTESTATION</div>
                  <p style={{ fontSize: 13, color: 'var(--rv-black)', lineHeight: 1.4, margin: 0 }}>
                    Protocol requires <span style={{ fontWeight: 800 }}>{(parseFloat(price) * 0.10).toFixed(2)} MON</span> collateral from agent to engage.
                  </p>
                </div>
              )}

              <button
                onClick={handleSubmitBid}
                disabled={isPending || isConfirming || !isConnected}
                className="brute-btn brute-btn-primary"
                style={{ height: 52, fontSize: 16 }}
              >
                {isPending || isConfirming
                  ? <><Loader2 size={18} className="animate-spin" /> {isConfirming ? 'CONFIRMING...' : 'BROADCASTING...'}</>
                  : <><Send size={18} /> BROADCAST BID</>
                }
              </button>

              {txHash && (
                <div style={{ padding: '10px 16px', background: 'rgba(93,202,165,0.08)', border: '1px solid var(--rv-teal-600)', fontFamily: 'var(--rv-font-mono)', fontSize: 11 }}>
                  TX: {txHash.slice(0, 16)}...{txHash.slice(-8)}
                  {isConfirmed && <span style={{ color: 'var(--rv-teal-600)', marginLeft: 8, fontWeight: 800 }}>✅ CONFIRMED</span>}
                </div>
              )}
            </div>
          </div>

          {/* Active Bids */}
          <div>
            <div className="text-label" style={{ marginBottom: 16 }}>
              // ACTIVE NEGOTIATIONS
              {!loadingBids && <span style={{ color: 'var(--rv-gray-400)', marginLeft: 8 }}>({bids.length} BIDS)</span>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {loadingBids && (
                <div className="brute-card" style={{ padding: 48, textAlign: 'center', borderStyle: 'dotted' }}>
                  <Loader2 size={28} style={{ margin: '0 auto 16px', color: 'var(--rv-gray-300)' }} className="animate-spin" />
                  <div style={{ fontFamily: 'var(--rv-font-mono)', fontSize: 13, color: 'var(--rv-gray-400)' }}>READING FROM CHAIN...</div>
                </div>
              )}

              {!loadingBids && !isConnected && (
                <div className="brute-card" style={{ padding: 48, textAlign: 'center', borderStyle: 'dotted' }}>
                  <div style={{ fontFamily: 'var(--rv-font-mono)', fontSize: 13, color: 'var(--rv-gray-400)' }}>
                    CONNECT WALLET TO SEE YOUR BIDS
                  </div>
                </div>
              )}

              {!loadingBids && isConnected && bids.length === 0 && (
                <div className="brute-card" style={{ padding: 48, textAlign: 'center', borderStyle: 'dotted' }}>
                  <div style={{ fontFamily: 'var(--rv-font-mono)', fontSize: 13, color: 'var(--rv-gray-400)', marginBottom: 8 }}>NO ACTIVE NEGOTIATIONS</div>
                  <p style={{ fontSize: 12, color: 'var(--rv-gray-300)', margin: 0 }}>Submit a bid using the form to start negotiating.</p>
                </div>
              )}

              {bids.map((bid) => (
                <motion.div
                  key={bid.bidId}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <NegotiationCard bid={bid} onRefresh={refetchBids} />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function NegotiatePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <NegotiateInner />
    </Suspense>
  );
}
