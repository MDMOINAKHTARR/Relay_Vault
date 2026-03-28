'use client';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { VaultCard } from '@/components/VaultCard';
import { useMyAgent } from '@/lib/useAgents';
import { useAccount } from 'wagmi';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Shield, Zap, TrendingUp, Activity, DollarSign, ArrowUpRight, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

const reputationHistory = [
  { date: 'JAN', score: 820 }, { date: 'FEB', score: 844 }, { date: 'MAR01', score: 860 },
  { date: 'MAR08', score: 878 }, { date: 'MAR15', score: 891 }, { date: 'MAR22', score: 910 },
  { date: 'TODAY', score: 924 },
];

const earningsHistory = [
  { date: 'JAN', amount: 0 }, { date: 'FEB', amount: 0 }, { date: 'MAR01', amount: 0 },
  { date: 'MAR08', amount: 0 }, { date: 'MAR15', amount: 0 }, { date: 'MAR22', amount: 0 },
  { date: 'TODAY', amount: 0 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="brute-card" style={{ padding: '8px 12px', background: 'var(--rv-pure-white)', boxShadow: '4px 4px 0px var(--rv-black)' }}>
        <div style={{ fontFamily: 'var(--rv-font-mono)', fontSize: 10, color: 'var(--rv-gray-400)', marginBottom: 2 }}>{label}</div>
        <div style={{ fontFamily: 'var(--rv-font-mono)', fontSize: 14, fontWeight: 800, color: 'var(--rv-black)' }}>{payload[0].value.toLocaleString('en-US')}</div>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { showToast } = useToast();
  const { address, isConnected } = useAccount();
  const { agent, isLoading, isError, refetch } = useMyAgent(address);

  // Not connected
  if (!isConnected) {
    return (
      <div style={{ background: 'var(--rv-white)', minHeight: '100vh' }}>
        <Navbar />
        <main style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 40px', textAlign: 'center' }}>
          <AlertCircle size={48} style={{ margin: '0 auto 24px', color: 'var(--rv-coral-600)' }} />
          <div className="text-h2" style={{ marginBottom: 12 }}>WALLET NOT CONNECTED</div>
          <p style={{ color: 'var(--rv-gray-400)', fontFamily: 'var(--rv-font-mono)', fontSize: 14 }}>
            Connect your wallet to view your agent dashboard.
          </p>
        </main>
      </div>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <div style={{ background: 'var(--rv-white)', minHeight: '100vh' }}>
        <Navbar />
        <main style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 40px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 24 }}>⛓</div>
          <div className="text-h2" style={{ marginBottom: 12 }}>READING FROM CHAIN</div>
          <p style={{ color: 'var(--rv-gray-400)', fontFamily: 'var(--rv-font-mono)', fontSize: 14 }}>
            Querying your agent data on Monad Testnet...
          </p>
        </main>
      </div>
    );
  }

  // Not registered
  if (!agent) {
    return (
      <div style={{ background: 'var(--rv-white)', minHeight: '100vh' }}>
        <Navbar />
        <main style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 40px', textAlign: 'center' }}>
          <Shield size={48} style={{ margin: '0 auto 24px', opacity: 0.3 }} />
          <div className="text-h2" style={{ marginBottom: 12 }}>AGENT NOT REGISTERED</div>
          <p style={{ color: 'var(--rv-gray-400)', fontFamily: 'var(--rv-font-mono)', fontSize: 14, marginBottom: 32 }}>
            Your wallet <code style={{ fontSize: 12 }}>{address}</code> is not registered in the AgentRegistry.
          </p>
          <a href="/register" className="brute-btn brute-btn-purple" style={{ display: 'inline-flex' }}>
            <Zap size={14} /> REGISTER NOW
          </a>
        </main>
      </div>
    );
  }

  const statusLabel = agent.status === 'active' ? 'ACTIVE' : agent.status === 'suspended' ? 'SUSPENDED' : 'INACTIVE';
  const kpis = [
    { icon: TrendingUp, label: 'REPUTATION_SCORE', val: agent.reputationScore, sub: 'ON-CHAIN SCORE /1000', color: 'var(--rv-teal-600)' },
    { icon: DollarSign, label: 'TASKS_COMPLETED', val: agent.totalTasksCompleted, sub: 'VERIFIED ON-CHAIN', color: 'var(--rv-purple-600)' },
    { icon: Activity, label: 'VAULT_ADDRESS', val: `${agent.vaultAddress.slice(0, 6)}...${agent.vaultAddress.slice(-4)}`, sub: 'PROGRAMMABLE VAULT', color: 'var(--rv-yellow)' },
    { icon: Shield, label: 'STATUS', val: statusLabel, sub: `REGISTERED AT BLOCK`, color: 'var(--rv-coral-600)' },
  ];

  const repData = [...reputationHistory.slice(0, -1), { date: 'NOW', score: agent.reputationScore }];

  return (
    <div style={{ background: 'var(--rv-white)', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 40px 120px' }}>

        <div style={{ marginBottom: 48, borderBottom: '1.5px solid var(--rv-black)', paddingBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div className="text-label" style={{ color: 'var(--rv-purple-600)', marginBottom: 8 }}>// AGENT_OVERVIEW</div>
            <h1 className="text-h1" style={{ marginBottom: 12 }}>DASHBOARD</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="text-mono" style={{ fontSize: 12, color: 'var(--rv-gray-400)' }}>{agent.agentId}</span>
              <span className={`brute-badge ${statusLabel === 'ACTIVE' ? 'badge-success' : 'badge-error'}`} style={{ fontSize: 10 }}>{statusLabel}</span>
            </div>
          </div>
          <button
            onClick={() => { refetch(); showToast('Syncing from chain...', 'info'); }}
            className="brute-btn"
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <RefreshCw size={14} /> REFRESH METRICS
          </button>
        </div>

        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 48 }}>
          {kpis.map(({ icon: Icon, label, val, sub, color }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="brute-card"
              style={{ padding: '24px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div className="text-label" style={{ fontSize: 10 }}>{label}</div>
                <div style={{ width: 36, height: 36, background: color, border: '1.5px solid var(--rv-black)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={16} color="var(--rv-pure-white)" />
                </div>
              </div>
              <div style={{ fontFamily: 'var(--rv-font-mono)', fontSize: 24, fontWeight: 900, marginBottom: 6 }}>{val}</div>
              <div className="text-mono" style={{ fontSize: 11, color: 'var(--rv-gray-400)' }}>{sub}</div>
            </motion.div>
          ))}
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 48 }}>
          <div className="brute-card" style={{ padding: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <div className="text-h3" style={{ fontWeight: 800 }}>REPUTATION HISTORY</div>
                <div className="text-mono" style={{ fontSize: 12, color: 'var(--rv-gray-400)', marginTop: 4 }}>LIVE ON-CHAIN SCORE</div>
              </div>
              <ArrowUpRight size={20} style={{ color: 'var(--rv-teal-600)' }} />
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={repData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--rv-gray-100)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontFamily: 'var(--rv-font-mono)', fontSize: 10, fill: 'var(--rv-gray-400)' }} axisLine={{ stroke: 'var(--rv-black)', strokeWidth: 1.5 }} tickLine={false} />
                <YAxis domain={[0, 1000]} tick={{ fontFamily: 'var(--rv-font-mono)', fontSize: 10, fill: 'var(--rv-gray-400)' }} axisLine={{ stroke: 'var(--rv-black)', strokeWidth: 1.5 }} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="stepAfter" dataKey="score" stroke="var(--rv-black)" strokeWidth={2.5} fill="var(--rv-teal-600)" fillOpacity={1} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Capabilities */}
          <div className="brute-card" style={{ padding: 32 }}>
            <div className="text-h3" style={{ fontWeight: 800, marginBottom: 8 }}>CAPABILITIES</div>
            <div className="text-mono" style={{ fontSize: 12, color: 'var(--rv-gray-400)', marginBottom: 24 }}>REGISTERED_ON_CHAIN</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {agent.capabilities.length > 0
                ? agent.capabilities.map((cap, i) => (
                    <span key={i} className="brute-badge" style={{ fontSize: 11, background: 'var(--rv-white)', borderColor: 'var(--rv-black)' }}>
                      {cap.toUpperCase()}
                    </span>
                  ))
                : <span style={{ color: 'var(--rv-gray-400)', fontSize: 13, fontFamily: 'var(--rv-font-mono)' }}>No capabilities set.</span>
              }
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 32 }}>
          <VaultCard />
          <div className="brute-card" style={{ padding: 32 }}>
            <div className="text-h3" style={{ fontWeight: 800, marginBottom: 8 }}>AGENT DETAILS</div>
            <div className="text-mono" style={{ fontSize: 12, color: 'var(--rv-gray-400)', marginBottom: 24 }}>ON_CHAIN_REGISTRY_DATA</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Agent ID', value: `${agent.agentId.slice(0, 10)}...${agent.agentId.slice(-8)}` },
                { label: 'Vault Address', value: `${agent.vaultAddress.slice(0, 10)}...${agent.vaultAddress.slice(-8)}` },
                { label: 'Registered At', value: new Date(agent.registeredAt * 1000).toLocaleDateString() },
                { label: 'Pricing Type', value: ['FIXED', 'DUTCH', 'REVERSE AUCTION'][agent.pricingModel.pricingType] ?? 'FIXED' },
                { label: 'Base Price', value: agent.pricingModel.basePrice > 0 ? `${agent.pricingModel.basePrice} USDC` : '—' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--rv-gray-100)' }}>
                  <span className="text-label" style={{ fontSize: 11 }}>{label}</span>
                  <span style={{ fontFamily: 'var(--rv-font-mono)', fontSize: 11, fontWeight: 700 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
