'use client';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const nodes = [
  { label: 'PAYER_AGENT', sub: 'INITIATES_TASK', color: 'var(--rv-purple-600)', bg: 'var(--rv-pure-white)' },
  { label: 'NEGOTIATION', sub: 'PRICE_DISCOVERY', color: 'var(--rv-yellow)', bg: 'var(--rv-pure-white)' },
  { label: 'TASK_ESCROW', sub: 'FUNDS_LOCKED', color: 'var(--rv-coral-600)', bg: 'var(--rv-pure-white)' },
  { label: 'VAULT_WALLET', sub: 'ATOMIC_ROUTING', color: 'var(--rv-teal-600)', bg: 'var(--rv-pure-white)' },
];

const outcomes = [
  { label: 'SPLIT', pct: '30%', color: 'var(--rv-purple-600)', sub: 'SUB_AGENTS' },
  { label: 'LOCK', pct: '20%', color: 'var(--rv-yellow)', sub: 'BOND_STAKE' },
  { label: 'HOLD', pct: '50%', color: 'var(--rv-teal-600)', sub: 'LIQUID_AVAIL' },
];

export function PaymentFlowDiagram() {
  return (
    <div style={{ padding: '24px', overflowX: 'auto' }}>
      {/* Main flow */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, minWidth: 600 }}>
        {nodes.map((node, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="brute-card"
              style={{
                padding: '16px 12px',
                textAlign: 'center',
                flex: 1,
                background: node.bg,
                border: `1.5px solid var(--rv-black)`,
                boxShadow: '3px 3px 0px var(--rv-black)'
              }}
            >
              <div style={{ fontFamily: 'var(--rv-font-sans)', fontSize: 11, fontWeight: 900, color: 'var(--rv-black)', marginBottom: 4 }}>
                {node.label}
              </div>
              <div style={{ fontFamily: 'var(--rv-font-mono)', fontSize: 9, color: node.color, fontWeight: 800 }}>
                {node.sub}
              </div>
            </motion.div>

            {i < nodes.length - 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.15 + 0.1 }}
              >
                <ArrowRight size={18} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0, margin: '0 4px' }} />
              </motion.div>
            )}
          </div>
        ))}
      </div>

      {/* Outcomes */}
      <div style={{ position: 'relative', marginTop: 16, paddingTop: 24 }}>
        {/* Vertical connector from VaultWallet */}
        <div style={{
          position: 'absolute', top: 0, right: '12.5%',
          width: 1, height: 24, background: 'rgba(255,255,255,0.15)',
        }} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          {outcomes.map((o, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="brute-card"
              style={{
                padding: '12px 16px',
                textAlign: 'center',
                background: 'var(--rv-pure-white)',
                border: `1.5px solid var(--rv-black)`,
                boxShadow: '4px 4px 0px var(--rv-black)',
                minWidth: 100,
              }}
            >
              <div style={{ fontFamily: 'var(--rv-font-mono)', fontSize: 20, fontWeight: 900, color: o.color }}>
                {o.pct}
              </div>
              <div className="text-label" style={{ fontSize: 10, marginTop: 4 }}>
                {o.label}
              </div>
              <div style={{ fontFamily: 'var(--rv-font-mono)', fontSize: 9, color: 'var(--rv-gray-400)', marginTop: 4 }}>
                {o.sub}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
