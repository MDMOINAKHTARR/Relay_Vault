'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { ExternalLink, Filter, Download, RefreshCw, Loader2, AlertTriangle, InboxIcon } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';
import { useTransactionHistory, type LiveTxEvent } from '@/lib/useTransactionHistory';
import { CONTRACT_ADDRESSES } from '@/lib/contracts';

const EVENT_COLORS: Record<string, { cls: string; accent: string }> = {
  FundsReleased:     { cls: 'badge-success', accent: 'var(--rv-teal-600)' },
  FundsLocked:       { cls: 'badge-primary', accent: 'var(--rv-purple-600)' },
  TaskCompleted:     { cls: 'badge-success', accent: 'var(--rv-teal-600)' },
  DisputeOpened:     { cls: 'badge-error',   accent: 'var(--rv-coral-600)' },
  EscrowRefunded:    { cls: 'badge-error',   accent: 'var(--rv-coral-600)' },
  ReputationUpdated: { cls: 'badge-info',    accent: 'var(--rv-purple-600)' },
  AgentRegistered:   { cls: 'badge-primary', accent: 'var(--rv-purple-600)' },
  BondSlashed:       { cls: 'badge-error',   accent: 'var(--rv-coral-600)' },
};

const ALL_EVENT_TYPES: LiveTxEvent['type'][] = [
  'FundsReleased', 'FundsLocked', 'TaskCompleted', 'DisputeOpened',
  'EscrowRefunded', 'ReputationUpdated', 'AgentRegistered',
];

function shortAddr(addr?: string) {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function explorerUrl(txHash: string) {
  // Monad testnet explorer (update if you have a custom one)
  return `https://testnet.monadexplorer.com/tx/${txHash}`;
}

export default function HistoryPage() {
  const [filter, setFilter] = useState<string | null>(null);
  const { showToast } = useToast();
  const { events, isLoading, isError, refetch } = useTransactionHistory();

  const filtered = filter ? events.filter(t => t.type === filter) : events;

  const handleExport = () => {
    if (events.length === 0) {
      showToast('No events to export.', 'error');
      return;
    }
    const header = 'Type,Escrow/Agent,Amount,Block,TxHash\n';
    const rows = events.map(e =>
      `${e.type},${e.escrowId || e.agentId || ''},${e.amount ?? ''},${e.blockNumber},${e.txHash}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `relayvault-audit-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Audit log exported!', 'success');
  };

  return (
    <div style={{ background: 'var(--rv-white)', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 40px 120px' }}>

        {/* Header */}
        <div style={{ marginBottom: 48, borderBottom: '1.5px solid var(--rv-black)', paddingBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div className="text-label" style={{ color: 'var(--rv-purple-600)', marginBottom: 8 }}>// AUDIT TRAIL</div>
            <h1 className="text-h1" style={{ marginBottom: 12 }}>TRANSACTION LOG</h1>
            <p style={{ fontSize: 15, color: 'var(--rv-gray-600)', fontFamily: 'var(--rv-font-mono)' }}>
              LIVE ON-CHAIN EVENT STREAM • RECONSTRUCTABLE STATE
            </p>
            <div className="text-mono" style={{ fontSize: 11, color: 'var(--rv-gray-400)', marginTop: 8 }}>
              ESCROW: {CONTRACT_ADDRESSES.ESCROW} &nbsp;|&nbsp; REGISTRY: {CONTRACT_ADDRESSES.REGISTRY}
            </div>
          </div>
          <button
            className="brute-btn"
            onClick={() => { refetch(); showToast('Refreshing event log...', 'info'); }}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            disabled={isLoading}
          >
            <RefreshCw size={14} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
            REFRESH
          </button>
        </div>

        {/* Stats bar */}
        {!isLoading && !isError && (
          <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
            {ALL_EVENT_TYPES.map(type => {
              const count = events.filter(e => e.type === type).length;
              if (count === 0) return null;
              const style = EVENT_COLORS[type] || { cls: 'badge-info', accent: 'var(--rv-purple-600)' };
              return (
                <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', border: '1.5px solid var(--rv-black)', background: 'var(--rv-white)' }}>
                  <span className={`brute-badge ${style.cls}`} style={{ fontSize: 9, marginRight: 4 }}>{type.toUpperCase()}</span>
                  <span className="text-mono" style={{ fontSize: 13, fontWeight: 800 }}>{count}</span>
                </div>
              );
            })}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', border: '1.5px solid var(--rv-black)', background: 'var(--rv-black)', color: 'var(--rv-white)' }}>
              <span className="text-label" style={{ fontSize: 9 }}>TOTAL</span>
              <span className="text-mono" style={{ fontSize: 13, fontWeight: 800 }}>{events.length}</span>
            </div>
          </div>
        )}

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
              borderColor: 'var(--rv-black)',
            }}
            onClick={() => { setFilter(null); showToast('Showing all events.', 'info'); }}
          >
            ALL EVENTS
          </button>
          {ALL_EVENT_TYPES.map(t => (
            events.some(e => e.type === t) && (
              <button
                key={t}
                className="brute-badge"
                style={{
                  cursor: 'pointer',
                  background: filter === t ? 'var(--rv-black)' : 'var(--rv-white)',
                  color: filter === t ? 'var(--rv-white)' : 'var(--rv-black)',
                  borderColor: 'var(--rv-black)',
                }}
                onClick={() => { setFilter(filter === t ? null : t); showToast(`Filtered by ${t.toUpperCase()}`, 'info'); }}
              >
                {t.toUpperCase()}
              </button>
            )
          ))}
        </div>

        {/* Loading state */}
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '80px 40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
              <Loader2 size={32} style={{ color: 'var(--rv-purple-600)', animation: 'spin 1s linear infinite' }} />
              <div className="text-h3" style={{ fontWeight: 800 }}>READING FROM CHAIN</div>
            </div>
            <p style={{ fontFamily: 'var(--rv-font-mono)', fontSize: 13, color: 'var(--rv-gray-400)' }}>
              Fetching all contract events from blocks 0 → latest...
            </p>
          </div>
        )}

        {/* Error state */}
        {!isLoading && isError && (
          <div className="brute-card" style={{ padding: 48, textAlign: 'center', borderColor: 'var(--rv-coral-600)' }}>
            <AlertTriangle size={40} style={{ color: 'var(--rv-coral-600)', margin: '0 auto 16px' }} />
            <div className="text-h3" style={{ fontWeight: 800, marginBottom: 8 }}>FAILED TO FETCH EVENTS</div>
            <p style={{ fontFamily: 'var(--rv-font-mono)', fontSize: 13, color: 'var(--rv-gray-400)', marginBottom: 24 }}>
              Could not read logs from the chain. Check your RPC connection.
            </p>
            <button className="brute-btn brute-btn-primary" onClick={() => refetch()}>
              <RefreshCw size={14} /> RETRY
            </button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && events.length === 0 && (
          <div className="brute-card" style={{ padding: 64, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <div className="text-h3" style={{ fontWeight: 800, marginBottom: 8 }}>NO EVENTS FOUND</div>
            <p style={{ fontFamily: 'var(--rv-font-mono)', fontSize: 13, color: 'var(--rv-gray-400)' }}>
              No on-chain events found. Try registering an agent or initiating a bid/escrow.
            </p>
          </div>
        )}

        {/* No filtered results */}
        {!isLoading && !isError && events.length > 0 && filtered.length === 0 && (
          <div className="brute-card" style={{ padding: 40, textAlign: 'center' }}>
            <div className="text-h3" style={{ fontWeight: 800, marginBottom: 8 }}>NO EVENTS FOR THIS FILTER</div>
            <button className="brute-btn" onClick={() => setFilter(null)}>CLEAR FILTER</button>
          </div>
        )}

        {/* Events table */}
        {!isLoading && !isError && filtered.length > 0 && (
          <div className="brute-card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--rv-black)', color: 'var(--rv-white)' }}>
                  {['Event', 'Entity / Escrow', 'Amount', 'Block', 'Tx Hash', 'Proof'].map(h => (
                    <th key={h} style={{
                      fontFamily: 'var(--rv-font-mono)', fontSize: 11, fontWeight: 700,
                      textAlign: 'left', padding: '16px 20px',
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((tx, i) => {
                    const evStyle = EVENT_COLORS[tx.type] || { cls: 'badge-info', accent: 'var(--rv-purple-600)' };
                    return (
                      <motion.tr
                        key={tx.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: Math.min(i * 0.02, 0.4) }}
                        style={{ borderBottom: '1.2px solid var(--rv-black)' }}
                      >
                        {/* Event type */}
                        <td style={{ padding: '16px 20px' }}>
                          <span className={`brute-badge ${evStyle.cls}`} style={{ fontSize: 10 }}>
                            {tx.type.replace(/([A-Z])/g, ' $1').trim().toUpperCase()}
                          </span>
                        </td>

                        {/* Entity */}
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {tx.escrowId && (
                              <span className="text-mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--rv-purple-600)' }}>
                                ESC_{tx.escrowId}
                              </span>
                            )}
                            {tx.agentId && (
                              <span className="text-mono" style={{ fontSize: 12, fontWeight: 700, color: evStyle.accent }}>
                                {shortAddr(tx.agentId)}
                              </span>
                            )}
                            {(tx.from || tx.to) && (
                              <div style={{ fontSize: 11, color: 'var(--rv-gray-500)', fontFamily: 'var(--rv-font-mono)' }}>
                                {tx.from && <span>{shortAddr(tx.from)}</span>}
                                {tx.to   && <span> → {shortAddr(tx.to)}</span>}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Amount */}
                        <td style={{ padding: '16px 20px', fontFamily: 'var(--rv-font-mono)', fontSize: 15, fontWeight: 800 }}>
                          {tx.amount != null
                            ? tx.type === 'ReputationUpdated'
                              ? `${tx.amount} /1000`
                              : `$${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : '—'}
                        </td>

                        {/* Block */}
                        <td style={{ padding: '16px 20px', fontFamily: 'var(--rv-font-mono)', fontSize: 12, color: 'var(--rv-gray-400)' }}>
                          #{tx.blockNumber.toLocaleString('en-US')}
                        </td>

                        {/* Tx hash */}
                        <td style={{ padding: '16px 20px' }}>
                          {tx.txHash ? (
                            <a
                              href={explorerUrl(tx.txHash)}
                              target="_blank"
                              rel="noreferrer"
                              style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--rv-purple-600)', fontSize: 11, fontWeight: 700, fontFamily: 'var(--rv-font-mono)', textDecoration: 'none' }}
                            >
                              {shortAddr(tx.txHash)} <ExternalLink size={11} />
                            </a>
                          ) : '—'}
                        </td>

                        {/* Proof / CID */}
                        <td style={{ padding: '16px 20px' }}>
                          {tx.ipfsCID ? (
                            <button
                              onClick={() => showToast(`IPFS CID: ${tx.ipfsCID}`, 'info')}
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
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}

        {/* Export footer */}
        {!isLoading && events.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 32 }}>
            <button className="brute-btn" style={{ padding: '0 24px', height: 44 }} onClick={handleExport}>
              <Download size={16} /> EXPORT AUDIT LOG ({events.length} events)
            </button>
          </div>
        )}

      </main>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
