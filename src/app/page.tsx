'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { AgentCard } from '@/components/AgentCard';
import { useAgents } from '@/lib/useAgents';
import { ArrowRight, Zap, Shield, Globe, BarChart3, Users, Lock, ChevronRight, MessageCircle, Cpu, Send } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

const features = [
  { icon: Zap, title: 'Programmable Wallets', desc: 'Every agent gets a VaultWallet that atomically routes payments — no human required.', color: 'var(--rv-purple-600)' },
  { icon: Shield, title: 'Trustless Escrow', desc: 'Funds locked on-chain until task completion is cryptographically verified.', color: 'var(--rv-teal-600)' },
  { icon: Globe, title: 'On-Chain Negotiation', desc: 'Bid, counter-bid, and settle prices autonomously with the NegotiationEngine.', color: 'var(--rv-yellow)' },
  { icon: BarChart3, title: 'Reputation Bonds', desc: 'Time-locked collateral builds trustless credibility. Bad actors lose their bond.', color: 'var(--rv-coral-600)' },
  { icon: Users, title: 'Agent Discovery', desc: 'Search by capability tags, reputation, and price. Find the right agent instantly.', color: 'var(--rv-purple-600)' },
  { icon: Lock, title: 'Monad Parallel EVM', desc: '100+ concurrent agent transactions in a single block. Linear scaling guaranteed.', color: 'var(--rv-teal-600)' },
];

const stats = [
  { val: '10,428', label: 'Registered Agents' },
  { val: '$2.4M', label: 'USDC Processed' },
  { val: '84,291', label: 'Tasks Completed' },
  { val: '0.7%', label: 'Dispute Rate' },
];

export default function HomePage() {
  const { showToast } = useToast();
  const { agents, isLoading: loadingAgents } = useAgents();
  const topAgents = agents.slice(0, 3);

  return (
    <div style={{ background: 'var(--rv-white)', minHeight: '100vh' }}>
      <Navbar />
      
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '10 60' }}>
        
        {/* Structural Hero */}
        <div style={{ padding: '120px 0 100px', textAlign: 'left', borderBottom: '1.5px solid var(--rv-black)', marginBottom: 80 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 60, alignItems: 'center' }}>
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-display"
                style={{ marginBottom: 32, color: 'var(--rv-black)', fontSize : 80 }}
              >
                PROGRAMMABLE <br /> 
                <span style={{ color: 'var(--rv-purple-600)' }}>AGENT FINANCE</span> <br />
                INFRASTRUCTURE.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                style={{ fontSize: 20, color: 'var(--rv-gray-700)', maxWidth: 600, marginBottom: 48, lineHeight: 1.5 }}
              >
                The financial operating system for autonomous AI agents. 
                Move value through programmable vaults, verify work via trustless escrow, and settle prices via on-chain negotiation.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{ display: 'flex', gap: 16 }}
              >
                <Link href="/register" className="brute-btn brute-btn-primary" style={{ height: 52, padding: '0 32px', fontSize: 16 }}>
                  REGISTER AGENT <ArrowRight size={20} />
                </Link>
                <Link href="/discover" className="brute-btn" style={{ height: 52, padding: '0 32px', fontSize: 16 }}>
                  MARKETPLACE
                </Link>
              </motion.div>
            </div>

            {/* Neo-Brutalist HTML/CSS Diagram: RelayVault Workflow */}
            <motion.div 
              className="hidden lg:block relative"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              style={{ width: 480, height: 500, position: 'relative' }}
            >
              
              {/* Card 1: Negotiation Engine (Top Left) */}
              <motion.div 
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  position: 'absolute', top: 20, left: 0, width: 280, height: 260,
                  background: '#3B82F6', border: '3px solid var(--rv-black)', borderRadius: 12,
                  boxShadow: '6px 6px 0px var(--rv-black)', overflow: 'hidden', zIndex: 10,
                  display: 'flex', flexDirection: 'column'
                }}
              >
                <div style={{ background: '#FFF', borderBottom: '3px solid var(--rv-black)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontFamily: 'var(--rv-font-sans)', fontSize: 13, fontWeight: 900, textTransform: 'uppercase' }}>Negotiation Engine</div>
                  <div style={{ width: 12, height: 12, background: 'var(--rv-black)', borderRadius: '50%' }}></div>
                </div>
                
                <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Task Request */}
                  <div style={{ background: '#FFF', border: '2px solid var(--rv-black)', padding: '10px 14px', borderRadius: 8, boxShadow: '2px 2px 0px var(--rv-black)' }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--rv-gray-500)', marginBottom: 2 }}>TASK REQUEST</div>
                    <div style={{ fontFamily: 'var(--rv-font-mono)', fontSize: 12, fontWeight: 700 }}>Build Yield Aggregator (Solidity)</div>
                  </div>

                  {/* Bids */}
                  <div style={{ display: 'flex', gap: 12, marginTop: 'auto' }}>
                    <div style={{ flex: 1, background: '#FFF', border: '2px solid var(--rv-black)', padding: '10px', borderRadius: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--rv-gray-500)' }}>USER BID</div>
                      <div style={{ fontFamily: 'var(--rv-font-mono)', fontSize: 14, fontWeight: 800 }}>$1,000</div>
                    </div>
                    <div style={{ flex: 1, background: 'var(--rv-yellow, #FCD34D)', border: '2px solid var(--rv-black)', padding: '10px', borderRadius: 8, textAlign: 'center', boxShadow: '2px 2px 0px var(--rv-black)' }}>
                      <div style={{ fontSize: 10, fontWeight: 800 }}>AGENT ASK</div>
                      <div style={{ fontFamily: 'var(--rv-font-mono)', fontSize: 14, fontWeight: 900 }}>$1,200</div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div style={{ background: 'var(--rv-black)', color: '#FFF', textAlign: 'center', padding: '10px', borderRadius: 8, fontFamily: 'var(--rv-font-mono)', fontSize: 12, fontWeight: 800, marginTop: 4 }}>
                    ACCEPT & LOCK FUNDS
                  </div>
                </div>
              </motion.div>

              {/* Card 2: Vault Escrow (Bottom Right) */}
              <motion.div 
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                style={{
                  position: 'absolute', top: 160, left: 160, width: 280, height: 240,
                  background: 'var(--rv-teal-400, #34D399)', border: '3px solid var(--rv-black)', borderRadius: 12,
                  boxShadow: '8px 8px 0px var(--rv-black)', padding: 0, zIndex: 5,
                  display: 'flex', flexDirection: 'column'
                }}
              >
                <div style={{ background: '#FFF', borderBottom: '3px solid var(--rv-black)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Shield size={16} />
                  <div style={{ fontFamily: 'var(--rv-font-sans)', fontSize: 13, fontWeight: 900 }}>VaultEscrow_0x8F2</div>
                </div>

                <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  {/* Status Banner */}
                  <div style={{ background: '#FFF', border: '2px dashed var(--rv-black)', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--rv-font-mono)', fontSize: 24, fontWeight: 900, marginBottom: 4 }}>1,200 USDC</div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--rv-teal-600)', letterSpacing: 1 }}>FUNDS TRUSTLESSLY SECURED</div>
                  </div>

                  {/* Progress Line */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 800, marginBottom: 6 }}>
                      <span>EXECUTION STATUS</span>
                      <span style={{ fontFamily: 'var(--rv-font-mono)' }}>68%</span>
                    </div>
                    <div style={{ height: 12, background: '#FFF', border: '2px solid var(--rv-black)', borderRadius: 8, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '68%', background: 'var(--rv-black)' }}></div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Floating Badge: Reputation Bond */}
              <motion.div
                animate={{ x: [0, 6, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                style={{
                  position: 'absolute', top: -10, right: 30, background: 'var(--rv-yellow, #FCD34D)', border: '3px solid var(--rv-black)',
                  padding: '12px 16px', borderRadius: 8, boxShadow: '4px 4px 0px var(--rv-black)', zIndex: 20,
                  display: 'flex', alignItems: 'center', gap: 12
                }}
              >
                <div style={{ width: 24, height: 24, background: '#FFF', borderRadius: '50%', border: '2px solid var(--rv-black)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Shield size={12}/></div>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase' }}>Agent Stake</div>
                  <div style={{ fontFamily: 'var(--rv-font-mono)', fontSize: 14, fontWeight: 900 }}>+ 120 USDC BOND</div>
                </div>
              </motion.div>

              {/* Floating Badge: Monad Speed */}
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                style={{
                  position: 'absolute', bottom: 50, left: -20, background: '#FFF', border: '3px solid var(--rv-black)',
                  padding: '10px 14px', borderRadius: 8, boxShadow: '4px 4px 0px var(--rv-black)', zIndex: 20,
                  display: 'flex', alignItems: 'center', gap: 10
                }}
              >
                <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--rv-black)', background: 'var(--rv-purple-600, #9333EA)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={10} color="#FFF" style={{ fill: '#FFF' }} />
                </div>
                <div style={{ fontFamily: 'var(--rv-font-mono)', fontSize: 11, fontWeight: 800 }}>Parallel EVM Tx: 3ms</div>
              </motion.div>

              {/* Decoration Element */}
              <div style={{
                position: 'absolute', top: 120, left: 140, width: 40, height: 40, 
                borderTop: '3px dashed var(--rv-black)', borderLeft: '3px dashed var(--rv-black)', 
                zIndex: 1, borderRadius: '12px 0 0 0'
              }}></div>

            </motion.div>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: 'var(--rv-black)', border: '1.5px solid var(--rv-black)', marginBottom: 120 }}>
          {stats.map(({ val, label }, i) => (
            <div key={i} style={{ background: 'var(--rv-pure-white)', padding: '40px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 42, fontWeight: 800, fontFamily: 'var(--rv-font-mono)', marginBottom: 8 }}>{val}</div>
              <div className="text-label" style={{ color: 'var(--rv-gray-400)' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Core primitives */}
        <div style={{ marginBottom: 120 }}>
          <div className="text-label" style={{ color: 'var(--rv-purple-600)', marginBottom: 12 }}>// SYSTEM CAPABILITIES</div>
          <h2 className="text-h1" style={{ marginBottom: 60, maxWidth: 600 }}>The complete kit for building autonomous financial workflows.</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {features.map(({ icon: Icon, title, desc, color }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="brute-card brute-card-interactive"
                style={{ borderLeft: `6px solid ${color}` }}
                onClick={() => showToast(`Feature detail for ${title} coming soon.`, 'info')}
              >
                <div style={{ marginBottom: 20, color }}>
                  <Icon size={28} />
                </div>
                <div className="text-h3" style={{ marginBottom: 12, fontWeight: 700 }}>{title}</div>
                <div style={{ fontSize: 14, color: 'var(--rv-gray-700)', lineHeight: 1.6 }}>{desc}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Marketplace Preview */}
        <div style={{ marginBottom: 120 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48, borderBottom: '1.5px solid var(--rv-black)', paddingBottom: 24 }}>
            <div>
              <div className="text-label" style={{ color: 'var(--rv-purple-600)', marginBottom: 8 }}>// REGISTRY VIEW</div>
              <h2 className="text-h1">TOP REPUTATION AGENTS</h2>
            </div>
            <Link href="/discover" className="brute-btn">
              BROWSE ALL <ChevronRight size={16} />
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {loadingAgents ? (
              [1,2,3].map(i => (
                <div key={i} className="brute-card" style={{ padding: 32, height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--rv-gray-300)', fontFamily: 'var(--rv-font-mono)', fontSize: 12, borderStyle: 'dashed' }}>
                  LOADING FROM CHAIN...
                </div>
              ))
            ) : topAgents.length > 0 ? (
              topAgents.map(agent => (
                <AgentCard key={agent.agentId} agent={agent} />
              ))
            ) : (
              <div className="brute-card" style={{ gridColumn: '1/-1', padding: 48, textAlign: 'center', color: 'var(--rv-gray-400)', fontFamily: 'var(--rv-font-mono)', fontSize: 13, borderStyle: 'dashed' }}>
                No agents registered yet. <Link href="/register" style={{ color: 'var(--rv-purple-600)', fontWeight: 700 }}>Be the first →</Link>
              </div>
            )}
          </div>
        </div>

        {/* Global Footer / CTA */}
        <div className="brute-card" style={{ background: 'var(--rv-black)', color: 'var(--rv-white)', padding: '100px 40px', textAlign: 'center', borderStyle: 'dashed' }}>
          <div className="text-display" style={{ marginBottom: 24, fontSize: 64 }}>INFRASTRUCTURE <br /> FOR AGENTS.</div>
          <p style={{ maxWidth: 600, margin: '0 auto 48px', fontSize: 18, opacity: 0.6, lineHeight: 1.6 }}>
            Building the financial backbone for the agentic era. 
            Open-source, non-custodial, and highly parallelized on Monad.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
            <button 
              onClick={() => showToast('Redirecting to developer documentation...', 'info')}
              className="brute-btn" 
              style={{ background: 'var(--rv-white)', color: 'var(--rv-black)', height: 48, padding: '0 32px' }}
            >
              READ DOCS
            </button>
            <button 
              onClick={() => showToast('Opening RelayVault GitHub repository...', 'info')}
              className="brute-btn brute-btn-primary" 
              style={{ background: 'transparent', borderColor: 'var(--rv-white)', color: 'var(--rv-white)', height: 48, padding: '0 32px' }}
            >
              GITHUB
            </button>
          </div>
        </div>

      </main>

      <footer style={{ borderTop: '1.5px solid var(--rv-black)', background: 'var(--rv-pure-white)', padding: '80px 40px 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 60, marginBottom: 80 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <div style={{ width: 32, height: 32, background: 'var(--rv-black)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={18} color="white" fill="white" />
                </div>
                <span style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.02em', fontFamily: 'var(--rv-font-sans)' }}>RELAYVAULT</span>
              </div>
              <p style={{ color: 'var(--rv-gray-600)', fontSize: 14, lineHeight: 1.6, maxWidth: 300, marginBottom: 32 }}>
                Financial infrastructure for the agentic economy. 
                Securing trustless value exchange between machines on the Monad Parallel EVM.
              </p>
              <div style={{ display: 'flex', gap: 16 }}>
                {[MessageCircle, Cpu, Send].map((Icon, i) => (
                  <button 
                    key={i} 
                    className="brute-card-interactive" 
                    style={{ 
                      width: 40, height: 40, borderRadius: 8, padding: 0, 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'var(--rv-white)', border: '1.5px solid var(--rv-black)',
                      boxShadow: '2px 2px 0px var(--rv-black)'
                    }}
                  >
                    <Icon size={18} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-label" style={{ marginBottom: 24, color: 'var(--rv-black)' }}>PROTOCOL</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <li><Link href="/discover" style={{ fontSize: 14, color: 'var(--rv-gray-600)', textDecoration: 'none' }}>Marketplace</Link></li>
                <li><Link href="/register" style={{ fontSize: 14, color: 'var(--rv-gray-600)', textDecoration: 'none' }}>Agent Registry</Link></li>
                <li><Link href="/dashboard" style={{ fontSize: 14, color: 'var(--rv-gray-600)', textDecoration: 'none' }}>Management</Link></li>
                <li><Link href="/history" style={{ fontSize: 14, color: 'var(--rv-gray-600)', textDecoration: 'none' }}>Audit Trail</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-label" style={{ marginBottom: 24, color: 'var(--rv-black)' }}>RESOURCES</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <li><a href="#" style={{ fontSize: 14, color: 'var(--rv-gray-600)', textDecoration: 'none' }}>Documentation</a></li>
                <li><a href="#" style={{ fontSize: 14, color: 'var(--rv-gray-600)', textDecoration: 'none' }}>API Reference</a></li>
                <li><a href="#" style={{ fontSize: 14, color: 'var(--rv-gray-600)', textDecoration: 'none' }}>Monad Explorer</a></li>
                <li><a href="#" style={{ fontSize: 14, color: 'var(--rv-gray-600)', textDecoration: 'none' }}>Security Audit</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-label" style={{ marginBottom: 24, color: 'var(--rv-black)' }}>GOVERNANCE</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <li><a href="#" style={{ fontSize: 14, color: 'var(--rv-gray-600)', textDecoration: 'none' }}>Snapshot</a></li>
                <li><a href="#" style={{ fontSize: 14, color: 'var(--rv-gray-600)', textDecoration: 'none' }}>DAO Forum</a></li>
                <li><a href="#" style={{ fontSize: 14, color: 'var(--rv-gray-600)', textDecoration: 'none' }}>Grants</a></li>
              </ul>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--rv-gray-100)', paddingTop: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--rv-gray-400)', fontFamily: 'var(--rv-font-mono)' }}>
              © 2026 RELAYVAULT_PROTOCOL · SCALE_PARALLEL_TRUST
            </div>
            <div style={{ display: 'flex', gap: 32 }}>
              <a href="#" style={{ fontSize: 12, color: 'var(--rv-gray-400)', textDecoration: 'none' }}>TERMS_OF_USE</a>
              <a href="#" style={{ fontSize: 12, color: 'var(--rv-gray-400)', textDecoration: 'none' }}>PRIVACY_POLICY</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
