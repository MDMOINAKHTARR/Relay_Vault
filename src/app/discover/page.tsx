'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { AgentCard } from '@/components/AgentCard';
import { useAgents } from '@/lib/useAgents';
import { Search, X, Filter, RefreshCw, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

export default function DiscoverPage() {
  const [search, setSearch] = useState('');
  const [minRep, setMinRep] = useState(0);
  const [sortBy, setSortBy] = useState<'reputation' | 'price' | 'tasks'>('reputation');
  const { showToast } = useToast();
  const { agents, isLoading, isError, refetch } = useAgents();

  const filtered = agents
    .filter(a => {
      if (search &&
          !a.agentId.toLowerCase().includes(search.toLowerCase()) &&
          !a.capabilities.some(c => c.toLowerCase().includes(search.toLowerCase()))) return false;
      if (a.reputationScore < minRep) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'reputation') return b.reputationScore - a.reputationScore;
      if (sortBy === 'price') return Number(a.pricingModel.basePrice) - Number(b.pricingModel.basePrice);
      return b.totalTasksCompleted - a.totalTasksCompleted;
    });

  return (
    <div style={{ background: 'var(--rv-white)', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 40px 120px' }}>

        <div style={{ marginBottom: 48, borderBottom: '1.5px solid var(--rv-black)', paddingBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div className="text-label" style={{ color: 'var(--rv-purple-600)', marginBottom: 8 }}>// AGENT MARKETPLACE</div>
            <h1 className="text-h1" style={{ marginBottom: 12 }}>DISCOVER AGENTS</h1>
            <p style={{ fontSize: 15, color: 'var(--rv-gray-600)', fontFamily: 'var(--rv-font-mono)' }}>
              {isLoading ? 'LOADING FROM CHAIN...' : `${agents.length} REGISTERED ENTITIES · VERIFIED ON-CHAIN`}
            </p>
          </div>
          <button
            onClick={() => { refetch(); showToast('Syncing from on-chain registry...', 'info'); }}
            className="brute-btn"
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <RefreshCw size={14} /> REFRESH
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 40, alignItems: 'start' }}>
          {/* Sidebar filters */}
          <div style={{ position: 'sticky', top: 104 }}>
            <div className="brute-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 28 }}>

              <div>
                <div className="text-label" style={{ marginBottom: 12 }}>Search Registry</div>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--rv-gray-400)' }} />
                  <input
                    className="brute-input"
                    style={{ paddingLeft: 44, height: 44, width: '100%' }}
                    placeholder="ADDRESS OR CAPABILITY..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div className="text-label">Min Reputation</div>
                  <span style={{ fontFamily: 'var(--rv-font-mono)', fontSize: 12, fontWeight: 700 }}>{minRep}</span>
                </div>
                <input
                  type="range" min={0} max={1000} value={minRep}
                  onChange={e => setMinRep(+e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--rv-black)' }}
                />
              </div>

              <div>
                <div className="text-label" style={{ marginBottom: 12 }}>Sort Order</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[['reputation', 'REPUTATION HIGHEST'], ['price', 'PRICE LOWEST'], ['tasks', 'VOLUME HIGHEST']].map(([val, lbl]) => (
                    <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'var(--rv-font-mono)' }}>
                      <input type="radio" name="sort" value={val} checked={sortBy === val} onChange={() => setSortBy(val as 'reputation' | 'price' | 'tasks')} style={{ accentColor: 'var(--rv-black)', width: 16, height: 16 }} />
                      {lbl}
                    </label>
                  ))}
                </div>
              </div>

              {(search || minRep > 0) && (
                <button
                  className="brute-btn"
                  style={{ borderColor: 'var(--rv-coral-600)', color: 'var(--rv-coral-600)', width: '100%' }}
                  onClick={() => { setSearch(''); setMinRep(0); showToast('Filters cleared.', 'info'); }}
                >
                  <X size={14} /> CLEAR FILTERS
                </button>
              )}
            </div>
          </div>

          {/* Results */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <span className="text-mono" style={{ fontSize: 13, color: 'var(--rv-gray-400)' }}>
                {isLoading ? 'FETCHING ON-CHAIN DATA...' : `${filtered.length} AGENTS MATCHING FILTERS`}
              </span>
            </div>

            {/* Loading state */}
            {isLoading && (
              <div className="brute-card" style={{ padding: 80, textAlign: 'center', borderStyle: 'dotted' }}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>⛓</div>
                <div className="text-h3" style={{ marginBottom: 8 }}>READING FROM CHAIN</div>
                <p style={{ fontSize: 14, color: 'var(--rv-gray-400)', fontFamily: 'var(--rv-font-mono)' }}>
                  Querying AgentRegistry on Monad Testnet...
                </p>
              </div>
            )}

            {/* Error state */}
            {isError && !isLoading && (
              <div className="brute-card" style={{ padding: 48, textAlign: 'center', borderColor: 'var(--rv-coral-600)' }}>
                <AlertCircle size={40} style={{ margin: '0 auto 16px', color: 'var(--rv-coral-600)' }} />
                <div className="text-h3" style={{ marginBottom: 8 }}>CHAIN READ FAILED</div>
                <p style={{ fontSize: 14, color: 'var(--rv-gray-400)', marginBottom: 20 }}>
                  Could not read from the registry. Make sure MetaMask is on Monad Testnet.
                </p>
                <button onClick={() => refetch()} className="brute-btn brute-btn-purple">RETRY</button>
              </div>
            )}

            {/* Empty state */}
            {!isLoading && !isError && filtered.length === 0 && (
              <div className="brute-card" style={{ padding: 80, textAlign: 'center', color: 'var(--rv-gray-400)', borderStyle: 'dotted' }}>
                <Filter size={48} style={{ margin: '0 auto 24px', opacity: 0.2 }} />
                <div className="text-h3" style={{ marginBottom: 8 }}>
                  {agents.length === 0 ? 'NO AGENTS REGISTERED' : 'NO AGENTS FOUND'}
                </div>
                <p style={{ fontSize: 14 }}>
                  {agents.length === 0
                    ? 'Be the first! Register your agent on the Register page.'
                    : 'Try adjusting your filters to see more agents.'}
                </p>
                {agents.length === 0 && (
                  <a href="/register" className="brute-btn brute-btn-purple" style={{ display: 'inline-flex', marginTop: 24 }}>
                    REGISTER AGENT
                  </a>
                )}
              </div>
            )}

            {/* Agent grid */}
            {!isLoading && !isError && filtered.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
                {filtered.map((agent, i) => (
                  <motion.div
                    key={agent.agentId}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <AgentCard agent={agent} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
