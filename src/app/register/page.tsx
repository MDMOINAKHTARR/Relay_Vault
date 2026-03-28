'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { Plus, Trash2, ChevronDown, CheckCircle, Zap, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { stringToHex, pad, parseEther } from 'viem';
import { REGISTRY_ABI, CONTRACT_ADDRESSES } from '@/lib/contracts';

const CAPABILITY_DOMAINS = ['code', 'data', 'finance', 'legal', 'media', 'language', 'ai', 'governance', 'compliance'];

export default function RegisterPage() {
  const { address: userAddress, isConnected } = useAccount();
  const { showToast } = useToast();

  // Form State
  const [agentName, setAgentName] = useState('ALPHA_GEN_V1');
  const [description, setDescription] = useState('');
  const [ownerAddr, setOwnerAddr] = useState('');
  const [capabilities, setCapabilities] = useState<string[]>(['code:generation:solidity']);
  const [pricingType, setPricingType] = useState('FIXED');
  const [basePrice, setBasePrice] = useState('50');
  
  const [newCap, setNewCap] = useState('');
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  // Wagmi Hooks
  const { data: hash, writeContract, isPending: isWritePending, error: writeError } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Effect to handle transaction completion
  useEffect(() => {
    if (isConfirmed) {
      setSubmitted(true);
      showToast('Vault Wallet deployed successfully!', 'success');
    }
    if (writeError) {
      showToast(writeError.message || 'Registration failed', 'error');
    }
  }, [isConfirmed, writeError, showToast]);

  useEffect(() => {
    if (userAddress) {
        setOwnerAddr(userAddress);
    }
  }, [userAddress]);

  const addCap = () => {
    if (newCap && !capabilities.includes(newCap) && capabilities.length < 32) {
      setCapabilities(c => [...c, newCap]);
      setNewCap('');
      showToast(`Added capability: ${newCap}`, 'success');
    }
  };

  const steps = [
    { n: 1, label: 'IDENTITY' },
    { n: 2, label: 'CAPABILITIES' },
    { n: 3, label: 'PRICING' },
    { n: 4, label: 'ROUTING' },
  ];

  if (submitted) {
    return (
      <div style={{ background: 'var(--rv-white)', minHeight: '100vh' }}>
        <Navbar />
        <main style={{ maxWidth: 640, margin: '0 auto', padding: '120px 40px', textAlign: 'center' }}>
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="brute-card" style={{ padding: '80px 40px', borderColor: 'var(--rv-teal-600)' }}>
            <div style={{ fontSize: 64, marginBottom: 32 }}>⚡</div>
            <h1 className="text-h1" style={{ marginBottom: 16 }}>VAULT_DEPLOYED</h1>
            <p className="text-mono" style={{ color: 'var(--rv-gray-600)', marginBottom: 40, fontSize: 14 }}>
              TRANSACTION_HASH: <span style={{ color: 'var(--rv-black)', fontWeight: 800 }}>{hash?.slice(0, 10)}...{hash?.slice(-8)}</span><br/>
              STATUS: REGISTERED_ON_CHAIN_MONAD
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
              <button onClick={() => window.location.href='/dashboard'} className="brute-btn brute-btn-primary" style={{ padding: '0 32px' }}>
                GO_DASHBOARD
              </button>
              <button onClick={() => window.location.href='/vault'} className="brute-btn" style={{ padding: '0 32px' }}>
                CONFIG_VAULT
              </button>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--rv-white)', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '40px 40px 120px' }}>

        <div style={{ marginBottom: 48, borderBottom: '1.5px solid var(--rv-black)', paddingBottom: 24 }}>
          <div className="text-label" style={{ color: 'var(--rv-purple-600)', marginBottom: 8 }}>// AGENT_REGISTRY.SOL</div>
          <h1 className="text-h1" style={{ marginBottom: 12 }}>REGISTER AGENT</h1>
          <p style={{ fontSize: 15, color: 'var(--rv-gray-600)', fontFamily: 'var(--rv-font-mono)' }}>
            DEPLOY_VAULT_CONTRACT • ATOMIC_ONBOARDING
          </p>
        </div>

        {/* Step progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 48 }}>
          {steps.map(({ n, label }, i) => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}
                onClick={() => {
                   if (n < step) {
                       setStep(n);
                       showToast(`Returning to ${label} step.`, 'info');
                   }
                }}
              >
                <div style={{
                  width: 44, height: 44,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: step > n ? 'var(--rv-teal-600)' : step === n ? 'var(--rv-black)' : 'var(--rv-white)',
                  color: step >= n ? 'var(--rv-white)' : 'var(--rv-gray-300)',
                  border: '1.5px solid var(--rv-black)',
                  fontFamily: 'var(--rv-font-mono)', fontSize: 13, fontWeight: 900,
                  marginBottom: 10,
                  boxShadow: step >= n ? '3px 3px 0px var(--rv-black)' : 'none',
                }}>
                  {step > n ? <CheckCircle size={20} /> : n}
                </div>
                <span className="text-label" style={{ fontSize: 10, color: step >= n ? 'var(--rv-black)' : 'var(--rv-gray-400)' }}>
                  {label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div style={{ flex: 1, height: '1.5px', background: 'var(--rv-black)', margin: '0 12px', marginBottom: 30, opacity: step > n ? 1 : 0.1 }} />
              )}
            </div>
          ))}
        </div>

        <div className="brute-card" style={{ padding: 48, background: 'var(--rv-pure-white)' }}>
          {/* Step 1: Identity */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div className="text-h3" style={{ fontWeight: 800 }}>IDENTITY_CONFIGURATION</div>
              <div>
                <label className="text-label" style={{ marginBottom: 10, display: 'block' }}>AGENT_NAME</label>
                <input className="brute-input" placeholder="NAME_OF_ENTITY..." value={agentName} onChange={e => setAgentName(e.target.value)} />
              </div>
              <div>
                <label className="text-label" style={{ marginBottom: 10, display: 'block' }}>DESCRIPTION</label>
                <textarea className="brute-input" rows={8} placeholder="SPECIFY_SPECIALIZATION_DATA..." value={description} onChange={e => setDescription(e.target.value)} style={{ resize: 'vertical' }} />
              </div>
              <div>
                <label className="text-label" style={{ marginBottom: 10, display: 'block' }}>OWNER_ADDRESS (EDDSA/ECDSA)</label>
                <input className="brute-input" placeholder="0x..." value={ownerAddr} onChange={e => setOwnerAddr(e.target.value)} />
              </div>
            </motion.div>
          )}

          {/* Step 2: Capabilities */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <div className="text-h3" style={{ fontWeight: 800 }}>CAPABILITY_REGISTRY</div>
                <p className="text-mono" style={{ fontSize: 12, color: 'var(--rv-gray-400)', marginTop: 4 }}>FORMAT: DOMAIN:SUBDOMAIN:SPEC | MAX_CAP: 32</p>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <input className="brute-input" placeholder="E.G. FINANCE:STAKING:AUTO" value={newCap} onChange={e => setNewCap(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCap()} />
                <button className="brute-btn brute-btn-purple" onClick={addCap} style={{ width: 56 }}><Plus size={20} /></button>
              </div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {capabilities.map(cap => (
                  <div key={cap} className="brute-badge" style={{ padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--rv-pure-white)' }}>
                    <span className="text-mono" style={{ fontWeight: 800, fontSize: 12 }}>{cap}</span>
                    <button onClick={() => setCapabilities(c => c.filter(x => x !== cap))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--rv-coral-600)', padding: 0 }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="text-mono" style={{ fontSize: 12, color: 'var(--rv-gray-400)' }}>{capabilities.length}/32_SLOTS_ACTIVE</div>
            </motion.div>
          )}

          {/* Step 3: Pricing */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div className="text-h3" style={{ fontWeight: 800 }}>PRICING_STRUCTURE</div>
              <div>
                <label className="text-label" style={{ marginBottom: 12, display: 'block' }}>SETTLEMENT_LOGIC</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  {['FIXED', 'AUCTION', 'DYNAMIC'].map(pt => (
                    <button 
                      key={pt} 
                      className="brute-badge" 
                      onClick={() => setPricingType(pt)}
                      style={{ 
                        padding: '8px 24px', 
                        cursor: 'pointer', 
                        background: pt === pricingType ? 'var(--rv-black)' : 'var(--rv-white)', 
                        color: pt === pricingType ? 'var(--rv-white)' : 'var(--rv-black)' 
                      }}
                    >
                      {pt}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-label" style={{ marginBottom: 10, display: 'block' }}>BASE_VALUATION (USDC)</label>
                <input className="brute-input" type="number" value={basePrice} onChange={e => setBasePrice(e.target.value)} />
              </div>
              <div>
                <label className="text-label" style={{ marginBottom: 12, display: 'block' }}>STABLE_TOKENS_ACCEPTED</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {['USDC', 'WETH', 'USDT'].map(c => <span key={c} className="brute-badge badge-success" style={{ padding: '6px 16px' }}>{c}</span>)}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Routing */}
          {step === 4 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div className="text-h3" style={{ fontWeight: 800 }}>VAULT_SETTLEMENT_RULES</div>
              <div style={{ padding: '20px', border: '1.5px solid var(--rv-black)', background: 'rgba(93, 202, 165, 0.05)' }}>
                <p className="text-mono" style={{ fontSize: 13, color: 'var(--rv-black)', lineHeight: 1.6, margin: 0 }}>
                  PROTOCOL_DEFAULT_DISTRIBUTION:<br/>
                  <span style={{ fontWeight: 800 }}>50%_LIQUID_HOLD</span> • <span style={{ fontWeight: 800 }}>20%_REPUTATION_STAKE</span> • <span style={{ fontWeight: 800 }}>30%_AUTO_SPLIT</span>
                </p>
              </div>
              <div>
                <label className="text-label" style={{ marginBottom: 10, display: 'block' }}>CONCURRENT_TASK_CAPACITY</label>
                <input className="brute-input" type="number" defaultValue={5} />
                <p className="text-mono" style={{ fontSize: 11, color: 'var(--rv-gray-400)', marginTop: 8 }}>AFFECTS_AVAILABILITY_V_SCORE</p>
              </div>
              <div style={{ padding: '20px', border: '1.5px dashed var(--rv-black)', background: 'var(--rv-gray-50)' }}>
                <div className="text-label" style={{ marginBottom: 12 }}>TRANSACTION_MANIFEST:</div>
                <div className="text-mono" style={{ fontSize: 12, color: 'var(--rv-gray-600)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                   <div>1. CLONE_VAULT_PROXY (EIP-1167 • ~45 bytes • cheap)</div>
                   <div>2. INITIALIZE_VAULT_OWNER + ROUTING_DEFAULTS</div>
                   <div>3. REGISTER_AGENT_ID + EMIT_ATTESTATION_EVENT</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 48, paddingTop: 32, borderTop: '1.5px solid var(--rv-black)' }}>
            <button 
                className="brute-btn" 
                onClick={() => setStep(s => Math.max(1, s - 1))} 
                style={{ visibility: step === 1 ? 'hidden' : 'visible', background: 'none' }}
            >
              <ArrowLeft size={16} /> BACK
            </button>
            {step < 4 ? (
              <button 
                className="brute-btn brute-btn-primary" 
                onClick={() => {
                    setStep(s => s + 1);
                    showToast(`Moving to step ${step + 1}`, 'info');
                }}
                style={{ padding: '0 32px' }}
              >
                CONTINUE <ArrowRight size={16} />
              </button>
            ) : (
              <button 
                className="brute-btn brute-btn-teal" 
                disabled={isWritePending || isConfirming || !isConnected}
                onClick={() => {
                   if (!isConnected) {
                       showToast('Please connect your wallet first.', 'error');
                       return;
                   }

                   const capsBytes = capabilities.map(c => pad(stringToHex(c.slice(0, 31)), { size: 32 })) as readonly `0x${string}`[];
                   const pType = pricingType === 'FIXED' ? 0 : pricingType === 'AUCTION' ? 1 : 2;
                   
                   writeContract({
                       abi: REGISTRY_ABI,
                       address: CONTRACT_ADDRESSES.REGISTRY,
                       functionName: 'register',
                       args: [
                           capsBytes,
                           {
                               basePrice: parseEther(basePrice),
                               currency: CONTRACT_ADDRESSES.USDC,
                               pricingType: pType,
                           },
                           '0x'
                       ]
                   });
                   
                   showToast('Broadcasting VaultWallet deployment...', 'info');
                }}
                style={{ padding: '0 40px', fontSize: 16 }}
              >
                {isWritePending || isConfirming ? (
                    <><Loader2 className="animate-spin" size={18} /> PROCESSING...</>
                ) : (
                    <><Zap size={18} /> DEPLOY_VAULT_WALLETS</>
                )}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
