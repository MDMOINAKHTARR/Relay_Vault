'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { VaultCard } from '@/components/VaultCard';
import { PaymentFlowDiagram } from '@/components/PaymentFlow';
import { Plus, Trash2, Save, RefreshCw, AlertCircle, Shield, Zap, Lock, Wallet } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useMyAgent } from '@/lib/useAgents';
import { useVaultState, useSetRouting, useClaimUnlocked } from '@/lib/useVault';
import { useToast } from '@/components/ToastProvider';

type SplitRecipient = { address: string; name: string; bps: number };

export default function VaultPage() {
  const { address, isConnected } = useAccount();
  const { agent, isLoading: agentLoading } = useMyAgent(address);
  const { showToast } = useToast();

  const vaultAddress = agent?.vaultAddress;

  const { balances, routing, isLoading: vaultLoading, refetch } = useVaultState(vaultAddress);
  const { setRouting, isPending: isSaving } = useSetRouting();
  const { claimUnlocked, isPending: isClaiming } = useClaimUnlocked();

  // Local editable state — seeded from on-chain values when they load
  const [lockBps, setLockBps]     = useState(2000);
  const [holdBps, setHoldBps]     = useState(5000);
  const [recipients, setRecipients] = useState<SplitRecipient[]>([]);
  const [seeded, setSeeded]        = useState(false);
  const [simAmount, setSimAmount]  = useState(1000);

  // Seed local state from on-chain routing once loaded
  useEffect(() => {
    if (!vaultLoading && routing && !seeded) {
      setLockBps(routing.lockBps);
      setHoldBps(routing.holdBps);
      // We can't read split recipients from chain without extra indexing,
      // so start with empty and let the user configure
      setRecipients([]);
      setSeeded(true);
    }
  }, [vaultLoading, routing, seeded]);

  const splitTotal = recipients.reduce((s, r) => s + r.bps, 0);
  const remaining  = 10000 - lockBps - holdBps - splitTotal; // BPS remaining after all buckets

  const addRecipient = () =>
    setRecipients(r => [...r, { address: '', name: 'New Agent', bps: 500 }]);
  const removeRecipient = (i: number) =>
    setRecipients(r => r.filter((_, idx) => idx !== i));
  const updateBps = (i: number, bps: number) =>
    setRecipients(r => r.map((rec, idx) => (idx === i ? { ...rec, bps } : rec)));
  const updateAddress = (i: number, addr: string) =>
    setRecipients(r => r.map((rec, idx) => (idx === i ? { ...rec, address: addr } : rec)));
  const updateName = (i: number, name: string) =>
    setRecipients(r => r.map((rec, idx) => (idx === i ? { ...rec, name } : rec)));

  const lockPct  = lockBps / 100;
  const holdPct  = holdBps / 100;
  const splitPct = splitTotal / 100;

  const handleSave = async () => {
    if (!vaultAddress) {
      showToast('No vault address — register your agent first.', 'error');
      return;
    }

    const totalBps = lockBps + holdBps + splitTotal;
    if (totalBps !== 10000) {
      showToast(`BPS must sum to 10000. Currently: ${totalBps}`, 'error');
      return;
    }

    const invalidAddresses = recipients.filter(r => !r.address.startsWith('0x') || r.address.length !== 42);
    if (invalidAddresses.length > 0) {
      showToast('All recipient addresses must be valid 0x addresses.', 'error');
      return;
    }

    try {
      showToast('Sending setRouting transaction...', 'info');
      await setRouting(
        vaultAddress,
        recipients.map(r => ({ recipient: r.address as `0x${string}`, bps: r.bps })),
        lockBps,
        holdBps,
      );
      showToast('Routing config saved on-chain!', 'success');
      refetch();
    } catch (err: any) {
      showToast(`Save failed: ${err.shortMessage || err.message}`, 'error');
    }
  };

  const handleClaimUnlocked = async () => {
    if (!vaultAddress) return;
    try {
      showToast('Claiming unlocked funds...', 'info');
      await claimUnlocked(vaultAddress);
      showToast('Unlocked funds moved to available balance!', 'success');
      refetch();
    } catch (err: any) {
      showToast(`Claim failed: ${err.shortMessage || err.message}`, 'error');
    }
  };

  // ── Guard: not connected ──────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div style={{ background: 'var(--rv-white)', minHeight: '100vh' }}>
        <Navbar />
        <main style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 40px', textAlign: 'center' }}>
          <AlertCircle size={48} style={{ margin: '0 auto 24px', color: 'var(--rv-coral-600)' }} />
          <div className="text-h2" style={{ marginBottom: 12 }}>WALLET NOT CONNECTED</div>
          <p style={{ color: 'var(--rv-gray-400)', fontFamily: 'var(--rv-font-mono)', fontSize: 14 }}>
            Connect your wallet to manage your vault configuration.
          </p>
        </main>
      </div>
    );
  }

  // ── Guard: loading agent ──────────────────────────────────────────────────
  if (agentLoading) {
    return (
      <div style={{ background: 'var(--rv-white)', minHeight: '100vh' }}>
        <Navbar />
        <main style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 40px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 24 }}>⛓</div>
          <div className="text-h2" style={{ marginBottom: 12 }}>READING FROM CHAIN</div>
          <p style={{ color: 'var(--rv-gray-400)', fontFamily: 'var(--rv-font-mono)', fontSize: 14 }}>
            Fetching your agent registry data...
          </p>
        </main>
      </div>
    );
  }

  // ── Guard: not registered ─────────────────────────────────────────────────
  if (!agent) {
    return (
      <div style={{ background: 'var(--rv-white)', minHeight: '100vh' }}>
        <Navbar />
        <main style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 40px', textAlign: 'center' }}>
          <Shield size={48} style={{ margin: '0 auto 24px', opacity: 0.3 }} />
          <div className="text-h2" style={{ marginBottom: 12 }}>NO VAULT FOUND</div>
          <p style={{ color: 'var(--rv-gray-400)', fontFamily: 'var(--rv-font-mono)', fontSize: 14, marginBottom: 32 }}>
            Your wallet <code style={{ fontSize: 12 }}>{address}</code> is not registered.<br/>
            Register your agent to get a VaultWallet deployed for you.
          </p>
          <a href="/register" className="brute-btn brute-btn-purple" style={{ display: 'inline-flex' }}>
            <Zap size={14} /> REGISTER NOW
          </a>
        </main>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <main style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '40px 40px 120px' }}>

        {/* Header */}
        <div style={{ marginBottom: 48, borderBottom: '1.5px solid var(--rv-black)', paddingBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div className="text-label" style={{ color: 'var(--rv-purple-600)', marginBottom: 8 }}>// VaultWallet.sol</div>
            <h1 className="text-h1" style={{ marginBottom: 12 }}>VAULT CONFIGURATION</h1>
            <p className="text-mono" style={{ fontSize: 13, color: 'var(--rv-gray-400)' }}>
              CONFIGURE AUTO-SPLIT, TIME-LOCK, AND HOLD ROUTING — EXECUTES ATOMICALLY ON INCOMING PAYMENT.
            </p>
            <div className="text-mono" style={{ fontSize: 11, color: 'var(--rv-gray-500)', marginTop: 8 }}>
              VAULT: {vaultAddress}
            </div>
          </div>
          <button
            className="brute-btn"
            onClick={() => { refetch(); showToast('Syncing vault state...', 'info'); }}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <RefreshCw size={14} /> REFRESH
          </button>
        </div>

        {/* Live balance summary */}
        {!vaultLoading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
            {[
              { label: 'AVAILABLE',   value: balances.available, color: 'var(--rv-teal-600)',   bg: 'var(--rv-teal-50)' },
              { label: 'TIME-LOCKED', value: balances.locked,    color: '#7A5C00',              bg: 'rgba(245,200,66,0.1)' },
              { label: 'TOTAL VAULT', value: balances.total,     color: 'var(--rv-purple-600)', bg: 'var(--rv-purple-50)' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className="brute-card" style={{ padding: '16px 20px', background: bg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-label" style={{ fontSize: 10, color }}>{label}</span>
                <span className="text-mono" style={{ fontSize: 20, fontWeight: 900, color }}>
                  ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 32, alignItems: 'start' }}>

          {/* Left: config */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Lock + Hold BPS sliders */}
            <div className="brute-card" style={{ padding: 32 }}>
              <div className="text-h3" style={{ fontWeight: 800, marginBottom: 4 }}>ROUTING PERCENTAGES</div>
              <div className="text-mono" style={{ fontSize: 12, color: 'var(--rv-gray-400)', marginBottom: 24 }}>
                ALL VALUES IN BASIS POINTS (100 BPS = 1%). MUST SUM TO 10000 WITH SPLIT TOTAL.
              </div>

              {/* Lock slider */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span className="text-label" style={{ color: 'var(--rv-gray-700)' }}>🔒 TIME-LOCK (BOND)</span>
                  <span className="text-mono" style={{ color: '#7A5C00', fontWeight: 800 }}>{lockPct.toFixed(1)}%</span>
                </div>
                <input
                  type="range" min={0} max={5000} step={100} value={lockBps}
                  onChange={e => setLockBps(+e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--rv-yellow)' }}
                />
              </div>

              {/* Hold slider */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span className="text-label" style={{ color: 'var(--rv-gray-700)' }}>💰 HOLD (LIQUID)</span>
                  <span className="text-mono" style={{ color: 'var(--rv-teal-600)', fontWeight: 800 }}>{holdPct.toFixed(1)}%</span>
                </div>
                <input
                  type="range" min={0} max={10000} step={100} value={holdBps}
                  onChange={e => setHoldBps(+e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--rv-teal-600)' }}
                />
              </div>

              {/* BPS summary */}
              <div style={{ display: 'flex', gap: 12 }}>
                {[
                  { label: 'LOCK',  pct: lockPct,  color: '#7A5C00',              bg: 'rgba(245,200,66,0.1)' },
                  { label: 'HOLD',  pct: holdPct,  color: 'var(--rv-teal-600)',   bg: 'var(--rv-teal-50)' },
                  { label: 'SPLIT', pct: splitPct, color: 'var(--rv-purple-600)', bg: 'var(--rv-purple-50)' },
                  { label: 'FREE',  pct: remaining / 100, color: remaining < 0 ? 'var(--rv-coral-600)' : 'var(--rv-gray-400)', bg: remaining < 0 ? 'var(--rv-coral-50)' : 'var(--rv-gray-50)' },
                ].map(({ label, pct, color, bg }) => (
                  <div key={label} style={{ flex: 1, textAlign: 'center', padding: '12px 8px', background: bg, border: '1.5px solid var(--rv-black)' }}>
                    <div className="text-mono" style={{ fontSize: 18, fontWeight: 900, color }}>{pct.toFixed(0)}%</div>
                    <div className="text-label" style={{ fontSize: 9, marginTop: 4 }}>{label}</div>
                  </div>
                ))}
              </div>
              {remaining < 0 && (
                <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--rv-coral-50)', border: '1.5px solid var(--rv-coral-600)', fontSize: 12, fontFamily: 'var(--rv-font-mono)', color: 'var(--rv-coral-600)' }}>
                  ⚠ OVER-ALLOCATED BY {Math.abs(remaining / 100).toFixed(1)}% — REDUCE LOCK, HOLD, OR SPLITS BEFORE SAVING.
                </div>
              )}
            </div>

            {/* Auto-Split recipients */}
            <div className="brute-card" style={{ padding: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                  <div className="text-h3" style={{ fontWeight: 800, marginBottom: 4 }}>AUTO-SPLIT RECIPIENTS</div>
                  <div className="text-mono" style={{ fontSize: 12, color: 'var(--rv-gray-400)' }}>FUNDS ROUTED ATOMICALLY ON PAYMENT</div>
                </div>
                <span className="brute-badge" style={{
                  background: splitTotal > 7000 ? 'var(--rv-coral-50)' : 'var(--rv-teal-50)',
                  color: splitTotal > 7000 ? 'var(--rv-coral-600)' : 'var(--rv-teal-600)',
                  borderColor: splitTotal > 7000 ? 'var(--rv-coral-600)' : 'var(--rv-teal-600)',
                }}>
                  {splitPct.toFixed(0)}% TOTAL
                </span>
              </div>

              {recipients.length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--rv-gray-400)', fontFamily: 'var(--rv-font-mono)', fontSize: 12, border: '1.5px dashed var(--rv-gray-300)', marginBottom: 16 }}>
                  No split recipients configured. Add one below.
                </div>
              )}

              {recipients.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 110px 40px', gap: 12, alignItems: 'center', marginBottom: 16 }}
                >
                  <input
                    style={{ border: 'var(--rv-border-hard)', padding: '8px 12px', fontSize: 12, fontFamily: 'var(--rv-font-mono)', width: '100%', outline: 'none', background: 'var(--rv-pure-white)' }}
                    placeholder="0x address..."
                    value={r.address}
                    onChange={e => updateAddress(i, e.target.value)}
                  />
                  <input
                    style={{ border: 'var(--rv-border-hard)', padding: '8px 12px', fontSize: 12, fontFamily: 'var(--rv-font-mono)', width: '100%', outline: 'none', background: 'var(--rv-pure-white)' }}
                    placeholder="Label (optional)"
                    value={r.name}
                    onChange={e => updateName(i, e.target.value)}
                  />
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      min={0} max={9000}
                      value={r.bps}
                      onChange={e => updateBps(i, +e.target.value)}
                      style={{ border: 'var(--rv-border-hard)', padding: '8px 36px 8px 12px', fontSize: 12, fontFamily: 'var(--rv-font-mono)', width: '100%', outline: 'none', background: 'var(--rv-pure-white)' }}
                    />
                    <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: 'var(--rv-gray-400)', fontFamily: 'var(--rv-font-mono)' }}>
                      BPS
                    </span>
                  </div>
                  <button className="brute-btn brute-btn-destructive" style={{ padding: 0, width: '100%' }} onClick={() => removeRecipient(i)}>
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))}

              <button className="brute-btn w-full" onClick={addRecipient} style={{ marginTop: 8 }}>
                <Plus size={16} /> ADD RECIPIENT
              </button>
            </div>

            {/* Payment simulation */}
            <div className="brute-card" style={{ padding: 32 }}>
              <div className="text-h3" style={{ fontWeight: 800, marginBottom: 4 }}>PAYMENT SIMULATION</div>
              <div className="text-mono" style={{ fontSize: 12, color: 'var(--rv-gray-400)', marginBottom: 24 }}>PREVIEW ROUTING OUTCOME FOR INCOMING PAYMENT</div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <input
                  type="number"
                  value={simAmount}
                  onChange={e => setSimAmount(+e.target.value)}
                  style={{ border: 'var(--rv-border-hard)', padding: '8px 12px', fontSize: 16, fontFamily: 'var(--rv-font-mono)', width: 160, outline: 'none', background: 'var(--rv-pure-white)' }}
                />
                <span className="text-mono" style={{ color: 'var(--rv-gray-400)' }}>USDC INCOMING</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {recipients.map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', border: 'var(--rv-border-hard)', background: 'var(--rv-purple-50)' }}>
                    <span className="text-mono" style={{ fontSize: 13, color: 'var(--rv-purple-900)' }}>{r.name || r.address.slice(0, 10) + '...'}</span>
                    <span className="text-mono" style={{ fontSize: 13, fontWeight: 800, color: 'var(--rv-purple-600)' }}>
                      ${((simAmount * r.bps) / 10000).toFixed(2)}
                    </span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', border: 'var(--rv-border-hard)', background: 'rgba(245,200,66,0.1)' }}>
                  <span className="text-mono" style={{ fontSize: 13, color: '#7A5C00' }}>🔒 TIME-LOCKED</span>
                  <span className="text-mono" style={{ fontSize: 13, fontWeight: 800, color: '#7A5C00' }}>
                    ${(simAmount * lockBps / 10000).toFixed(2)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', border: 'var(--rv-border-hard)', background: 'var(--rv-teal-50)' }}>
                  <span className="text-mono" style={{ fontSize: 13, color: 'var(--rv-teal-900)' }}>💰 AVAILABLE (HOLD)</span>
                  <span className="text-mono" style={{ fontSize: 13, fontWeight: 800, color: 'var(--rv-teal-600)' }}>
                    ${(simAmount * holdBps / 10000).toFixed(2)}
                  </span>
                </div>
                {remaining !== 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', border: '1.5px dashed var(--rv-black)', background: 'var(--rv-gray-50)' }}>
                    <span className="text-mono" style={{ fontSize: 13, color: 'var(--rv-gray-500)' }}>⚡ UNALLOCATED</span>
                    <span className="text-mono" style={{ fontSize: 13, fontWeight: 800, color: remaining < 0 ? 'var(--rv-coral-600)' : 'var(--rv-gray-500)' }}>
                      ${(simAmount * remaining / 10000).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Claim unlocked + save row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
              <button
                className="brute-btn w-full"
                onClick={handleClaimUnlocked}
                disabled={isClaiming}
                style={{ height: 56, fontSize: 14, borderColor: 'var(--rv-yellow)', color: '#7A5C00' }}
              >
                <Lock size={16} /> {isClaiming ? 'CLAIMING...' : 'CLAIM UNLOCKED'}
              </button>
              <button
                className="brute-btn brute-btn-primary w-full"
                onClick={handleSave}
                disabled={isSaving || remaining < 0}
                style={{ height: 56, fontSize: 15 }}
              >
                {isSaving ? <><RefreshCw size={16} /> SAVING...</> : <><Save size={18} /> SAVE ROUTING ON-CHAIN</>}
              </button>
            </div>
          </div>

          {/* Right: live vault card */}
          <div style={{ position: 'sticky', top: 80 }}>
            <div className="text-label" style={{ marginBottom: 16, color: 'var(--rv-purple-600)' }}>// LIVE_VAULT_PREVIEW</div>
            <VaultCard />
            <div className="brute-card" style={{ padding: 24, marginTop: 24 }}>
              <div className="text-label" style={{ marginBottom: 16 }}>// PAYMENT_FLOW_DIAGRAM</div>
              <PaymentFlowDiagram />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
