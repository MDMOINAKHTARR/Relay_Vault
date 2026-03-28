'use client';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, RefreshCw, XCircle, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { type OnChainBid } from '@/lib/useNegotiations';
import { useToast } from './ToastProvider';

import { useWriteContract, useAccount, usePublicClient } from 'wagmi';
import { NEGOTIATION_ABI, CONTRACT_ADDRESSES } from '@/lib/contracts';
import { parseEther } from 'viem';

type LocalHistoryEntry = OnChainBid['counterHistory'][number] & { _mock?: boolean };

interface NegotiationCardProps {
  bid: OnChainBid;
  onRefresh?: () => void;
}

const STATE_COLORS: Record<string, string> = {
  OPEN: 'var(--rv-teal-600)',
  COUNTERED: 'var(--rv-yellow)',
  ACCEPTED: 'var(--rv-purple-600)',
  EXPIRED: 'var(--rv-gray-400)',
  CANCELLED: 'var(--rv-coral-600)',
};

const STATE_TEXT_COLORS: Record<string, string> = {
  OPEN: 'var(--rv-white)',
  COUNTERED: 'var(--rv-black)',
  ACCEPTED: 'var(--rv-white)',
  EXPIRED: 'var(--rv-white)',
  CANCELLED: 'var(--rv-white)',
};

export function NegotiationCard({ bid, onRefresh }: NegotiationCardProps) {
  const [counterPrice, setCounterPrice] = useState('');
  const [showCounter, setShowCounter] = useState(false);
  const { showToast } = useToast();
  const { address } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();
  const client = usePublicClient();
  const [isConfirming, setIsConfirming] = useState(false);
  const [localAccepted, setLocalAccepted] = useState(false);
  const lastProcessedRef = useRef<number | null>(null);
  const hasSimulatedRef = useRef(false);

  // Local mock history injected after user counters
  const [mockHistory, setMockHistory] = useState<LocalHistoryEntry[]>([]);
  const [agentTyping, setAgentTyping] = useState(false);
  const mockFiredRef = useRef(false);

  const shortId = `${bid.bidId.slice(0, 10)}...${bid.bidId.slice(-6)}`;
  const shortInitiator = `${bid.initiator.slice(0, 6)}...${bid.initiator.slice(-4)}`;
  const shortTarget = `${bid.targetAgent.slice(0, 6)}...${bid.targetAgent.slice(-4)}`;
  const isInitiator = address?.toLowerCase() === bid.initiator.toLowerCase();
  const isSelfNegotiation = bid.initiator.toLowerCase() === bid.targetAgent.toLowerCase();
  const lastActor = bid.counterHistory.length > 0 
    ? bid.counterHistory[bid.counterHistory.length - 1].by 
    : bid.initiator;
  const canAccept = isSelfNegotiation || (address && address.toLowerCase() !== lastActor.toLowerCase());

  // After mock agent counter: derive latest displayed price and whether agent just countered
  const latestMockEntry = mockHistory.length > 0 ? mockHistory[mockHistory.length - 1] : null;
  const mockAgentCountered = latestMockEntry !== null && !agentTyping;
  const displayPrice = latestMockEntry ? latestMockEntry.price : bid.price;

  const handleAccept = async () => {
    try {
      showToast(`Accepting bid on-chain...`, 'info');
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.NEGOTIATION,
        abi: NEGOTIATION_ABI,
        functionName: 'acceptBid',
        args: [bid.bidId as `0x${string}`],
      });
      setIsConfirming(true);
      if (client) await client.waitForTransactionReceipt({ hash: txHash });
      showToast('✅ Bid accepted! Escrow locked on Monad.', 'success');
      setLocalAccepted(true);
      setMockHistory([]);
      onRefresh?.();
    } catch (err: any) {
      showToast(`Failed: ${err.shortMessage || err.message}`, 'error');
    } finally {
      setIsConfirming(false);
    }
  };

  const triggerAgentCounterBack = useCallback((userCounterPrice: number) => {
    if (mockFiredRef.current) return;
    mockFiredRef.current = true;

    // Agent analyses and picks a price: splits the difference, nudging ~55% toward user
    const originalPrice = parseFloat(bid.price);
    const midpoint = (originalPrice + userCounterPrice) / 2;
    const agentPrice = parseFloat((midpoint + (userCounterPrice - midpoint) * 0.15).toFixed(4));
    const agentAddr = bid.targetAgent;

    // Show typing indicator after 2s
    const typingTimer = setTimeout(() => {
      setAgentTyping(true);
      showToast('⚡ Agent is analyzing your offer...', 'info');
    }, 2200);

    // Reveal counter after 4.5s
    const counterTimer = setTimeout(() => {
      setAgentTyping(false);
      setMockHistory(prev => [
        ...prev,
        {
          price: String(agentPrice),
          by: agentAddr,
          at: Date.now(),
          _mock: true,
        },
      ]);
      showToast(`🤖 Agent countered with ${agentPrice} MON`, 'success');
    }, 4500);

    return () => { clearTimeout(typingTimer); clearTimeout(counterTimer); };
  }, [bid.price, bid.targetAgent, showToast]);

  const handleCounter = async () => {
    if (!counterPrice) return;
    try {
      showToast(`Sending counter-bid...`, 'info');
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.NEGOTIATION,
        abi: NEGOTIATION_ABI,
        functionName: 'counterBid',
        args: [bid.bidId as `0x${string}`, parseEther(counterPrice)],
      });
      setIsConfirming(true);
      if (client) await client.waitForTransactionReceipt({ hash: txHash });
      showToast('Counter-bid confirmed!', 'success');
      setShowCounter(false);
      const userPriceNum = parseFloat(counterPrice);
      setCounterPrice('');
      onRefresh?.();
      // Trigger the agent's mock counter-back
      triggerAgentCounterBack(userPriceNum);
    } catch (err: any) {
      showToast(`Failed: ${err.shortMessage || err.message}`, 'error');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancel = async () => {
    try {
      showToast(`Cancelling bid...`, 'info');
      const txHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.NEGOTIATION,
        abi: NEGOTIATION_ABI,
        functionName: 'cancelBid',
        args: [bid.bidId as `0x${string}`],
      });
      setIsConfirming(true);
      if (client) await client.waitForTransactionReceipt({ hash: txHash });
      showToast('Bid cancelled.', 'success');
      onRefresh?.();
    } catch (err: any) {
      showToast(`Failed: ${err.shortMessage || err.message}`, 'error');
    } finally {
      setIsConfirming(false);
    }
  };

  // Reset mock state when the on-chain bid updates (e.g. after a real refresh)
  useEffect(() => {
    mockFiredRef.current = false;
  }, [bid.counterHistory.length]);

  return (
    <div className="brute-card" style={{ padding: 24, background: 'var(--rv-pure-white)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div className="text-h3" style={{ fontWeight: 700, fontSize: 14 }}>
            {shortInitiator} <span style={{ color: 'var(--rv-gray-300)' }}>→</span> {shortTarget}
          </div>
          <div style={{ fontFamily: 'var(--rv-font-mono)', fontSize: 10, color: 'var(--rv-gray-400)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 700, color: 'var(--rv-black)' }}>{shortId}</span>
            <span>·</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
              <Clock size={10} /> TTL_{bid.ttlBlocks}_BLOCKS
            </span>
          </div>
          {bid.taskSpecCID && bid.taskSpecCID !== 'QmTaskSpecPlaceholder' && (
            <div style={{ fontSize: 10, color: 'var(--rv-gray-400)', marginTop: 4, fontFamily: 'var(--rv-font-mono)' }}>
              CID: {bid.taskSpecCID.slice(0, 20)}...
            </div>
          )}
        </div>
        <span
          className="brute-badge"
          style={{
            background: STATE_COLORS[bid.state],
            color: STATE_TEXT_COLORS[bid.state],
            borderColor: 'var(--rv-black)',
            fontWeight: 800,
            fontSize: 10,
          }}
        >
          {bid.state}
        </span>
      </div>

      {/* Current price — updates when agent mock-counters */}
      <motion.div
        key={displayPrice}
        initial={{ opacity: 0.6, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        style={{ padding: '12px 16px', border: '1.5px solid var(--rv-black)', background: 'var(--rv-white)', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <span className="text-label" style={{ fontSize: 10 }}>CURRENT PRICE</span>
        <span style={{ fontFamily: 'var(--rv-font-mono)', fontSize: 20, fontWeight: 900 }}>
          {displayPrice} MON
        </span>
      </motion.div>

      {/* Counter history (on-chain + local mock) */}
      {(bid.counterHistory.length > 0 || mockHistory.length > 0 || agentTyping) && (
        <div style={{ position: 'relative', paddingLeft: 28, display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16 }}>
          <div style={{ position: 'absolute', left: 7, top: 0, bottom: 0, width: '1.5px', background: 'var(--rv-gray-200)' }} />
          {[...bid.counterHistory, ...mockHistory].map((event, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', left: -28, top: 4,
                width: 14, height: 14,
                background: i === 0 ? 'var(--rv-purple-600)' : 'var(--rv-yellow)',
                border: '1.5px solid var(--rv-black)',
              }} />
              <div className="text-label" style={{ fontSize: 9, color: 'var(--rv-gray-400)', marginBottom: 2 }}>
                BY_{event.by.slice(0, 6)}...{event.by.slice(-4)}
              </div>
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                style={{ fontFamily: 'var(--rv-font-mono)', fontSize: 16, fontWeight: 800 }}
              >
                {event.price} MON
              </motion.div>
              <div style={{ fontSize: 9, color: 'var(--rv-gray-400)', marginTop: 2, fontFamily: 'var(--rv-font-mono)' }}>
                {new Date(event.at).toLocaleTimeString()}
              </div>
            </div>
          ))}

          {/* Agent typing indicator */}
          {agentTyping && (
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', left: -28, top: 4,
                width: 14, height: 14,
                background: 'var(--rv-yellow)',
                border: '1.5px solid var(--rv-black)',
              }} />
              <div className="text-label" style={{ fontSize: 9, color: 'var(--rv-gray-400)', marginBottom: 4 }}>
                BY_{bid.targetAgent.slice(0, 6)}...{bid.targetAgent.slice(-4)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Loader2 size={12} className="animate-spin" style={{ color: 'var(--rv-gray-400)' }} />
                <span style={{ fontFamily: 'var(--rv-font-mono)', fontSize: 12, color: 'var(--rv-gray-400)', fontStyle: 'italic' }}>analyzing offer...</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Counter input */}
      {showCounter && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            className="brute-input"
            type="number"
            placeholder="Counter price in MON..."
            value={counterPrice}
            onChange={(e) => setCounterPrice(e.target.value)}
            style={{ flex: 1, height: 40 }}
          />
          <button onClick={handleCounter} disabled={isPending || isConfirming} className="brute-btn brute-btn-purple" style={{ height: 40, padding: '0 16px' }}>
            {(isPending || isConfirming) ? <Loader2 size={14} className="animate-spin" /> : 'SEND'}
          </button>
          <button onClick={() => setShowCounter(false)} className="brute-btn" style={{ height: 40, padding: '0 12px' }}>✕</button>
        </div>
      )}

      {/* Actions */}
      {(bid.state === 'OPEN' || bid.state === 'COUNTERED') && (
        mockAgentCountered ? (
          // Agent just countered — show ACCEPT / REJECT / COUNTER BACK
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{ display: 'flex', gap: 10 }}
          >
            <button
              onClick={handleAccept}
              disabled={isPending || isConfirming}
              className="brute-btn brute-btn-teal"
              style={{ flex: 2 }}
            >
              {(isPending || isConfirming)
                ? <Loader2 size={14} className="animate-spin" />
                : <><CheckCircle size={14} /> ACCEPT {latestMockEntry?.price} MON</>}
            </button>
            <button
              onClick={() => setShowCounter(!showCounter)}
              disabled={isPending || isConfirming}
              className="brute-btn"
              style={{ flex: 1 }}
            >
              <RefreshCw size={14} /> COUNTER
            </button>
            <button
              onClick={handleCancel}
              disabled={isPending || isConfirming}
              className="brute-btn"
              style={{ color: 'var(--rv-coral-600)', borderColor: 'var(--rv-coral-600)', flex: 1 }}
            >
              {(isPending || isConfirming)
                ? <Loader2 size={14} className="animate-spin" />
                : <><XCircle size={14} /> REJECT</>}
            </button>
          </motion.div>
        ) : (
          // Normal state — user's turn to initiate / counter / cancel
          <div style={{ display: 'flex', gap: 10 }}>
            {canAccept && (
              <button onClick={handleAccept} disabled={isPending || isConfirming} className="brute-btn brute-btn-teal" style={{ flex: 2 }}>
                {(isPending || isConfirming) ? <Loader2 size={14} className="animate-spin" /> : <><CheckCircle size={14} /> ACCEPT</>}
              </button>
            )}
            <button onClick={() => setShowCounter(!showCounter)} disabled={isPending || isConfirming} className="brute-btn" style={{ flex: 1 }}>
              <RefreshCw size={14} /> COUNTER
            </button>
            {isInitiator && (
              <button onClick={handleCancel} disabled={isPending || isConfirming} className="brute-btn" style={{ color: 'var(--rv-coral-600)', borderColor: 'var(--rv-coral-600)' }}>
                {(isPending || isConfirming) ? <Loader2 size={14} className="animate-spin" /> : <><XCircle size={14} /> {isSelfNegotiation ? 'DECLINE' : 'CANCEL'}</>}
              </button>
            )}
          </div>
        )
      )}

      {(bid.state === 'ACCEPTED' || localAccepted) && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ padding: '14px 16px', background: 'rgba(93,202,165,0.10)', border: '1.5px solid var(--rv-teal-600)', textAlign: 'center' }}
        >
          <span style={{ color: 'var(--rv-teal-600)', fontFamily: 'var(--rv-font-mono)', fontWeight: 800, fontSize: 13 }}>
            ✅ DEAL ACCEPTED · ESCROW LOCKED ON MONAD
          </span>
        </motion.div>
      )}
    </div>
  );
}
