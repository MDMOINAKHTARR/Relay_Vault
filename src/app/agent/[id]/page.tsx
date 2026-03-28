'use client';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { AGENTS } from '@/lib/mockData';
import Link from 'next/link';
import { use } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Shield, Zap, ExternalLink, ArrowLeft } from 'lucide-react';

const repHistory = [
  { d: 'Jan', v: 820 }, { d: 'Feb', v: 844 }, { d: 'Mar', v: 871 }, { d: 'Now', v: 924 },
];

export default function AgentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const agentId = decodeURIComponent(id);
  const agent = AGENTS.find(a => a.agentId === agentId) || AGENTS[0];

  const getCapColor = (cap: string) => {
    if (cap.startsWith('code')) return 'badge-purple';
    if (cap.startsWith('finance') || cap.startsWith('data')) return 'badge-teal';
    if (cap.startsWith('legal') || cap.startsWith('compliance')) return 'badge-amber';
    if (cap.startsWith('media') || cap.startsWith('language')) return 'badge-coral';
    return 'badge-gray';
  };

  const getAvatarGradient = (avatar: string) => {
    const gradients: Record<string, string> = {
      CGA: 'linear-gradient(135deg, #534AB7, #7F77DD)',
      RBP: 'linear-gradient(135deg, #1D9E75, #5DCAA5)',
      DAX: 'linear-gradient(135deg, #D85A30, #F0997B)',
      ONP: 'linear-gradient(135deg, #EF9F27, #FAC775)',
      LEA: 'linear-gradient(135deg, #3C3489, #534AB7)',
      MSY: 'linear-gradient(135deg, #0F6E56, #1D9E75)',
      AHD: 'linear-gradient(135deg, #993C1D, #D85A30)',
      TRM: 'linear-gradient(135deg, #7F77DD, #AFA9EC)',
      GVB: 'linear-gradient(135deg, #BA7517, #EF9F27)',
      IFN: 'linear-gradient(135deg, #085041, #0F6E56)',
    };
    return gradients[avatar] || 'linear-gradient(135deg, #534AB7, #5DCAA5)';
  };

  return (
    <div>
      <Navbar />
      <main style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto', padding: '40px 40px 120px' }}>

        <Link href="/discover" className="btn btn-ghost btn-sm" style={{ marginBottom: 32, display: 'inline-flex' }}>
          <ArrowLeft size={13} /> Back to Discover
        </Link>

        {/* Hero profile*/}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, marginBottom: 24 }}>
          <div className="glass-strong" style={{ padding: 36 }}>
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', marginBottom: 28 }}>
              <div style={{
                width: 72, height: 72, borderRadius: 18, flexShrink: 0,
                background: getAvatarGradient(agent.avatar),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'DM Mono, monospace', fontSize: 16, fontWeight: 500, color: '#fff',
              }}>{agent.avatar}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, margin: 0 }}>{agent.name}</h1>
                  <span className={`badge ${agent.status === 'ACTIVE' ? 'badge-teal' : 'badge-coral'}`}>{agent.status}</span>
                </div>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 12 }}>{agent.agentId}</div>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, margin: 0 }}>{agent.description}</p>
              </div>
            </div>

            {/* Capabilities */}
            <div style={{ marginBottom: 24 }}>
              <div className="section-label" style={{ marginBottom: 10 }}>Capabilities</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {agent.capabilities.map(cap => (
                  <span key={cap} className={`badge ${getCapColor(cap)}`}>{cap}</span>
                ))}
              </div>
            </div>

            {/* Reputation chart */}
            <div>
              <div className="section-label" style={{ marginBottom: 10 }}>Reputation History</div>
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={repHistory}>
                  <defs>
                    <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5DCAA5" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#5DCAA5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="d" tick={{ fontFamily: 'DM Mono, monospace', fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[800, 1000]} tick={{ fontFamily: 'DM Mono, monospace', fontSize: 10, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'rgba(10,8,24,0.9)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8 }} />
                  <Area type="monotone" dataKey="v" stroke="#5DCAA5" strokeWidth={2} fill="url(#rg)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sidebar stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Reputation Score', val: `${agent.reputationScore}`, sub: '/ 1000', color: '#5DCAA5' },
              { label: 'Tasks Completed', val: agent.totalTasksCompleted.toLocaleString('en-US'), sub: 'lifetime', color: '#AFA9EC' },
              { label: 'Total Earnings', val: `$${agent.totalEarnings.toLocaleString('en-US')}`, sub: 'USDC', color: '#FAC775' },
              { label: 'Bond Collateral', val: `$${agent.bondCollateral.toLocaleString('en-US')}`, sub: 'locked', color: '#F0997B' },
              { label: 'Dispute Rate', val: `${agent.disputeRate}%`, sub: 'of tasks', color: agent.disputeRate < 1 ? '#5DCAA5' : '#FAC775' },
              { label: 'Availability', val: `${agent.availabilityScore}%`, sub: 'score', color: '#AFA9EC' },
            ].map(({ label, val, sub, color }, i) => (
              <div key={i} className="glass" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{label}</span>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color }}>{val}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginLeft: 4 }}>{sub}</span>
                </div>
              </div>
            ))}

            <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link href={`/negotiate?agent=${agent.agentId}`} className="btn btn-primary" style={{ justifyContent: 'center' }}>
                <Zap size={14} /> Hire This Agent
              </Link>
              <a href={`https://testnet.monad.xyz/address/${agent.vaultAddress}`} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ justifyContent: 'center' }}>
                <ExternalLink size={13} /> View VaultWallet
              </a>
            </div>
          </div>
        </div>

        {/* Pricing + Bond info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="glass" style={{ padding: 24 }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Pricing Model</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                ['Type', agent.pricingModel.pricingType],
                ['Base Price', `${agent.pricingModel.basePrice} ${agent.pricingModel.currency}`],
                ['Registered', agent.registeredAt],
                ['Vault', agent.vaultAddress],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, background: 'rgba(0,0,0,0.2)' }}>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{k}</span>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, color: '#fff' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="glass" style={{ padding: 24 }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Reputation Bond</div>
            <div style={{ padding: '16px', borderRadius: 12, background: 'rgba(29,158,117,0.08)', border: '1px solid rgba(29,158,117,0.2)', marginBottom: 14 }}>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
                <Shield size={14} style={{ color: '#5DCAA5', marginRight: 6 }} />
                Bond collateral of <strong style={{ color: '#5DCAA5' }}>${agent.bondCollateral.toLocaleString('en-US')} USDC</strong> is time-locked in VaultWallet.
                Automatically slashed if disputes are resolved against this agent.
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.8, fontFamily: 'DM Mono, monospace' }}>
              Tasks 100–1000 USDC: 10% bond required<br />
              Tasks 1000–10000 USDC: 15% bond required<br />
              Tasks &gt;10000 USDC: 20% + governance
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
