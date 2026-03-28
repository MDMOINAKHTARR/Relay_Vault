'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { VaultCard } from '@/components/VaultCard';
import { PaymentFlowDiagram } from '@/components/PaymentFlow';
import { VAULT_ROUTING, MY_AGENT } from '@/lib/mockData';
import { Plus, Trash2, Save, Info, Zap } from 'lucide-react';

type SplitRecipient = { address: string; name: string; bps: number; amount?: number };

export default function VaultPage() {
  const [recipients, setRecipients] = useState<SplitRecipient[]>(VAULT_ROUTING.splitRecipients);
  const [lockPercent, setLockPercent] = useState(20);
  const [simAmount, setSimAmount] = useState(1000);
  const [saved, setSaved] = useState(false);

  const splitTotal = recipients.reduce((s, r) => s + r.bps, 0);
  const holdPct = 100 - lockPercent - splitTotal / 100;

  const addRecipient = () => setRecipients(r => [...r, { address: '', name: 'New Agent', bps: 500, amount: 0 }]);
  const removeRecipient = (i: number) => setRecipients(r => r.filter((_, idx) => idx !== i));
  const updateBps = (i: number, bps: number) => setRecipients(r => r.map((rec, idx) => idx === i ? { ...rec, bps } : rec));
  const updateAddress = (i: number, address: string) => setRecipients(r => r.map((rec, idx) => idx === i ? { ...rec, address } : rec));

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div>
      <Navbar />
      <main style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '40px 40px 120px' }}>

        <div style={{ marginBottom: 48, borderBottom: '1.5px solid var(--rv-black)', paddingBottom: 24 }}>
          <div className="text-label" style={{ color: 'var(--rv-purple-600)', marginBottom: 8 }}>// VaultWallet.sol</div>
          <h1 className="text-h1" style={{ marginBottom: 12 }}>
            VAULT CONFIGURATION
          </h1>
          <p className="text-mono" style={{ fontSize: 13, color: 'var(--rv-gray-400)' }}>
            CONFIGURE AUTO-SPLIT, TIME-LOCK, AND HOLD ROUTING — EXECUTES ATOMICALLY ON INCOMING PAYMENT.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 32, alignItems: 'start' }}>

          {/* Left: config */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Auto-Split config */}
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
                  {(splitTotal / 100).toFixed(0)}% TOTAL
                </span>
              </div>

              {recipients.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px 40px', gap: 12, alignItems: 'center', marginBottom: 16 }}
                >
                  <input
                    style={{ border: 'var(--rv-border-hard)', padding: '8px 12px', fontSize: 12, fontFamily: 'var(--rv-font-mono)', width: '100%', outline: 'none', background: 'var(--rv-pure-white)' }}
                    placeholder="0x address..."
                    value={r.address}
                    onChange={e => updateAddress(i, e.target.value)}
                  />
                  <input
                    style={{ border: 'var(--rv-border-hard)', padding: '8px 12px', fontSize: 12, fontFamily: 'var(--rv-font-mono)', width: '100%', outline: 'none', background: 'var(--rv-pure-white)' }}
                    placeholder="Agent name"
                    defaultValue={r.name}
                  />
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      min={0} max={5000}
                      value={r.bps}
                      onChange={e => updateBps(i, +e.target.value)}
                      style={{ border: 'var(--rv-border-hard)', padding: '8px 36px 8px 12px', fontSize: 12, fontFamily: 'var(--rv-font-mono)', width: '100%', outline: 'none', background: 'var(--rv-pure-white)' }}
                    />
                    <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--rv-gray-400)', fontFamily: 'var(--rv-font-mono)' }}>
                      %
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

            {/* Time-Lock config */}
            <div className="brute-card" style={{ padding: 32 }}>
              <div style={{ marginBottom: 24 }}>
                <div className="text-h3" style={{ fontWeight: 800, marginBottom: 4 }}>TIME-LOCK (REPUTATION BOND)</div>
                <div className="text-mono" style={{ fontSize: 12, color: 'var(--rv-gray-400)' }}>PORTION LOCKED AS COLLATERAL; AUTO-UNLOCKS LATER</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span className="text-label" style={{ color: 'var(--rv-gray-700)' }}>LOCK PERCENTAGE</span>
                    <span className="text-mono" style={{ color: 'var(--rv-yellow)', fontWeight: 800 }}>{lockPercent}%</span>
                  </div>
                  <input
                    type="range" min={0} max={50} value={lockPercent}
                    onChange={e => setLockPercent(+e.target.value)}
                    style={{ width: '100%', accentColor: 'var(--rv-yellow)' }}
                  />
                </div>
                <div style={{ textAlign: 'center', padding: '16px 24px', border: 'var(--rv-border-hard)', background: 'rgba(245, 200, 66, 0.1)' }}>
                  <div style={{ fontFamily: 'var(--rv-font-mono)', fontSize: 24, fontWeight: 900, color: '#7A5C00' }}>{lockPercent}%</div>
                  <div className="text-label" style={{ fontSize: 10, color: '#7A5C00' }}>LOCKED</div>
                </div>
              </div>
            </div>

            {/* Simulation */}
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
                    <span className="text-mono" style={{ fontSize: 13, color: 'var(--rv-purple-900)' }}>{r.name}</span>
                    <span className="text-mono" style={{ fontSize: 13, fontWeight: 800, color: 'var(--rv-purple-600)' }}>
                      ${((simAmount * r.bps) / 10000).toFixed(2)}
                    </span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', border: 'var(--rv-border-hard)', background: 'rgba(245, 200, 66, 0.1)' }}>
                  <span className="text-mono" style={{ fontSize: 13, color: '#7A5C00' }}>🔒 TIME-LOCKED</span>
                  <span className="text-mono" style={{ fontSize: 13, fontWeight: 800, color: '#7A5C00' }}>${(simAmount * lockPercent / 100).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', border: 'var(--rv-border-hard)', background: 'var(--rv-teal-50)' }}>
                  <span className="text-mono" style={{ fontSize: 13, color: 'var(--rv-teal-900)' }}>💰 AVAILABLE (HOLD)</span>
                  <span className="text-mono" style={{ fontSize: 13, fontWeight: 800, color: 'var(--rv-teal-600)' }}>
                    ${Math.max(0, simAmount - (simAmount * lockPercent / 100) - recipients.reduce((s, r) => s + (simAmount * r.bps / 10000), 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <button className="brute-btn brute-btn-primary w-full" onClick={handleSave} style={{ height: 56, fontSize: 16 }}>
              {saved ? '✓ SAVED!' : <><Save size={18} /> SAVE ROUTING CONFIG</>}
            </button>
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
