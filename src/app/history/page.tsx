'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { TRANSACTIONS } from '@/lib/mockData';
import { ExternalLink, Filter, Download } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

const EVENT_COLORS: Record<string, { cls: string; accent: string }> = {
  FundsReleased: { cls: 'badge-success', accent: 'var(--rv-teal-600)' },
  FundsLocked:   { cls: 'badge-primary', accent: 'var(--rv-purple-600)' },
  BidAccepted:   { cls: 'badge-success', accent: 'var(--rv-teal-600)' },
  BondSlashed:   { cls: 'badge-error', accent: 'var(--rv-coral-600)' },
  ReputationUpdated: { cls: 'badge-info', accent: 'var(--rv-purple-600)' },
};

const EVENT_TYPES = Array.from(new Set(TRANSACTIONS.map(t => t.type)));

export default function HistoryPage() {
  const [filter, setFilter] = useState<string | null>(null);
  const { showToast } = useToast();

  const filtered = filter ? TRANSACTIONS.filter(t => t.type === filter) : TRANSACTIONS;

  return (
    <div style={{ background: 'var(--rv-white)', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 40px 120px' }}>

        <div style={{ marginBottom: 48, borderBottom: '1.5px solid var(--rv-black)', paddingBottom: 24 }}>
          <div className="text-label" style={{ color: 'var(--rv-purple-600)', marginBottom: 8 }}>// AUDIT TRAIL</div>
          <h1 className="text-h1" style={{ marginBottom: 12 }}>
            TRANSACTION LOG
          </h1>
          <p style={{ fontSize: 15, color: 'var(--rv-gray-600)', fontFamily: 'var(--rv-font-mono)' }}>
            DETERMINISTIC EVENT STREAM • RECONSTRUCTABLE ON-CHAIN STATE
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 32, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 8, color: 'var(--rv-gray-400)' }}>
            <Filter size={16} /> <span className="text-label">FILTER:</span>
          </div>
          <button
            className="brute-badge"
            style={{ 
                cursor: 'pointer', 
                background: !filter ? 'var(--rv-black)' : 'var(--rv-white)', 
                color: !filter ? 'var(--rv-white)' : 'var(--rv-black)',
                borderColor: 'var(--rv-black)'
            }}
            onClick={() => {
                setFilter(null);
                showToast('Showing all events.', 'info');
            }}
          >
            ALL EVENTS
          </button>
          {EVENT_TYPES.map(t => (
              <button
                key={t}
                className="brute-badge"
                style={{ 
                    cursor: 'pointer', 
                    background: filter === t ? 'var(--rv-black)' : 'var(--rv-white)', 
                    color: filter === t ? 'var(--rv-white)' : 'var(--rv-black)',
                    borderColor: 'var(--rv-black)'
                }}
                onClick={() => {
                    setFilter(filter === t ? null : t);
                    showToast(`Filtered by ${t.toUpperCase()}`, 'info');
                }}
              >
                {t.toUpperCase()}
              </button>
          ))}
        </div>

        {/* Table Container */}
        <div className="brute-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--rv-black)', color: 'var(--rv-white)' }}>
                {['Event', 'Entity/Escrow', 'Amount', 'Block', 'Proof'].map(h => (
                  <th key={h} style={{
                    fontFamily: 'var(--rv-font-mono)', fontSize: 11, fontWeight: 700,
                    textAlign: 'left', padding: '16px 24px',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx, i) => {
                const style = EVENT_COLORS[tx.type] || { cls: 'badge-info', accent: 'var(--rv-purple-600)' };
                return (
                  <motion.tr
                    key={tx.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    style={{ borderBottom: '1.2px solid var(--rv-black)' }}
                  >
                    <td style={{ padding: '18px 24px' }}>
                      <span className={`brute-badge ${style.cls}`} style={{ fontSize: 10 }}>{tx.type.toUpperCase()}</span>
                    </td>
                    <td style={{ padding: '18px 24px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {tx.escrowId && <span className="text-mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--rv-purple-600)' }}>ESCROW_{tx.escrowId}</span>}
                        {(tx.from || tx.to) && (
                          <div style={{ fontSize: 11, color: 'var(--rv-gray-500)', fontFamily: 'var(--rv-font-mono)' }}>
                            {tx.from && <span>{tx.from}</span>}
                            {tx.to && <span> → {tx.to}</span>}
                          </div>
                        )}
                        {tx.agentId && <span className="text-mono" style={{ fontSize: 12, fontWeight: 700 }}>AGENT_{tx.agentId}</span>}
                      </div>
                    </td>
                    <td style={{ padding: '18px 24px', fontFamily: 'var(--rv-font-mono)', fontSize: 15, fontWeight: 800 }}>
                      {tx.amount ? `$${tx.amount.toLocaleString('en-US')}` : '—'}
                    </td>
                    <td style={{ padding: '18px 24px', fontFamily: 'var(--rv-font-mono)', fontSize: 12, color: 'var(--rv-gray-400)' }}>
                      #{tx.blockNumber.toLocaleString('en-US')}
                    </td>
                    <td style={{ padding: '18px 24px' }}>
                      {tx.ipfsCID ? (
                        <button 
                            onClick={() => showToast('Opening IPFS proof window...', 'info')}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--rv-teal-600)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'var(--rv-font-mono)' }}
                        >
                          VERIFY <ExternalLink size={12} />
                        </button>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--rv-gray-300)', fontFamily: 'var(--rv-font-mono)' }}>NO_PROOFS</span>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Export Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 32 }}>
          <button 
            className="brute-btn"
            style={{ padding: '0 24px', height: 44 }}
            onClick={() => {
              showToast('Exporting audit trail to CSV...', 'success');
              // (MOCK CSV EXPORT LOGIC)
            }}
          >
            <Download size={16} /> EXPORT AUDIT LOG
          </button>
        </div>
      </main>
    </div>
  );
}
