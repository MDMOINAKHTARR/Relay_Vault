'use client';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, RefreshCw, XCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { type OnChainBid } from '@/lib/useNegotiations';
import { useToast } from './ToastProvider';
import { useRouter } from 'next/navigation';
import { useWriteContract, useAccount } from 'wagmi';
import { NEGOTIATION_ABI, CONTRACT_ADDRESSES } from '@/lib/contracts';
import { parseEther } from 'viem';

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
  const router = useRouter();
  const { address } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();

  const shortId = `${bid.bidId.slice(0, 10)}...${bid.bidId.slice(-6)}`;
  const shortInitiator = `${bid.initiator.slice(0, 6)}...${bid.initiator.slice(-4)}`;
  const shortTarget = `${bid.targetAgent.slice(0, 6)}...${bid.targetAgent.slice(-4)}`;
  const isInitiator = address?.toLowerCase() === bid.initiator.toLowerCase();

  const handleAccept = async () => {
    try {
      showToast(`Accepting bid on-chain...`, 'info');
      await writeContractAsync({
        address: CONTRACT_ADDRESSES.NEGOTIATION,
        abi: NEGOTIATION_ABI,
        functionName: 'acceptBid',
        args: [bid.bidId as `0x${string}`],
      });
      showToast('Bid accepted! Escrow locked on Monad.', 'success');
      onRefresh?.();
      setTimeout(() => router.push('/history'), 1500);
    } catch (err: any) {
      showToast(`Failed: ${err.shortMessage || err.message}`, 'error');
    }
  };

  const handleCounter = async () => {
    if (!counterPrice) return;
    try {
      showToast(`Sending counter-bid...`, 'info');
      await writeContractAsync({
        address: CONTRACT_ADDRESSES.NEGOTIATION,
        abi: NEGOTIATION_ABI,
        functionName: 'counterBid',
        args: [bid.bidId as `0x${string}`, parseEther(counterPrice)],
      });
      showToast('Counter-bid submitted!', 'success');
      setShowCounter(false);
      onRefresh?.();
    } catch (err: any) {
      showToast(`Failed: ${err.shortMessage || err.message}`, 'error');
    }
  };

  const handleCancel = async () => {
    try {
      showToast(`Cancelling bid...`, 'info');
      await writeContractAsync({
        address: CONTRACT_ADDRESSES.NEGOTIATION,
        abi: NEGOTIATION_ABI,
        functionName: 'cancelBid',
        args: [bid.bidId as `0x${string}`],
      });
      showToast('Bid cancelled.', 'success');
      onRefresh?.();
    } catch (err: any) {
      showToast(`Failed: ${err.shortMessage || err.message}`, 'error');
    }
  };

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

      {/* Current price */}
      <div style={{ padding: '12px 16px', border: '1.5px solid var(--rv-black)', background: 'var(--rv-white)', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="text-label" style={{ fontSize: 10 }}>CURRENT PRICE</span>
        <span style={{ fontFamily: 'var(--rv-font-mono)', fontSize: 20, fontWeight: 900 }}>
          {bid.price} MON
        </span>
      </div>

      {/* Counter history */}
      {bid.counterHistory.length > 0 && (
        <div style={{ position: 'relative', paddingLeft: 28, display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16 }}>
          <div style={{ position: 'absolute', left: 7, top: 0, bottom: 0, width: '1.5px', background: 'var(--rv-gray-200)' }} />
          {bid.counterHistory.map((event, i) => (
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
              <div style={{ fontFamily: 'var(--rv-font-mono)', fontSize: 16, fontWeight: 800 }}>
                {event.price} MON
              </div>
              <div style={{ fontSize: 9, color: 'var(--rv-gray-400)', marginTop: 2, fontFamily: 'var(--rv-font-mono)' }}>
                {new Date(event.at).toLocaleTimeString()}
              </div>
            </div>
          ))}
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
          <button onClick={handleCounter} disabled={isPending} className="brute-btn brute-btn-purple" style={{ height: 40, padding: '0 16px' }}>
            {isPending ? <Loader2 size={14} className="animate-spin" /> : 'SEND'}
          </button>
          <button onClick={() => setShowCounter(false)} className="brute-btn" style={{ height: 40, padding: '0 12px' }}>✕</button>
        </div>
      )}

      {/* Actions */}
      {(bid.state === 'OPEN' || bid.state === 'COUNTERED') && (
        <div style={{ display: 'flex', gap: 10 }}>
          {!isInitiator && (
            <button onClick={handleAccept} disabled={isPending} className="brute-btn brute-btn-teal" style={{ flex: 2 }}>
              {isPending ? <Loader2 size={14} className="animate-spin" /> : <><CheckCircle size={14} /> ACCEPT</>}
            </button>
          )}
          <button onClick={() => setShowCounter(!showCounter)} disabled={isPending} className="brute-btn" style={{ flex: 1 }}>
            <RefreshCw size={14} /> COUNTER
          </button>
          {isInitiator && (
            <button onClick={handleCancel} disabled={isPending} className="brute-btn" style={{ color: 'var(--rv-coral-600)', borderColor: 'var(--rv-coral-600)' }}>
              <XCircle size={14} />
            </button>
          )}
        </div>
      )}

      {bid.state === 'ACCEPTED' && (
        <div style={{ padding: '12px 16px', background: 'rgba(93,202,165,0.08)', border: '1.5px solid var(--rv-teal-600)', textAlign: 'center' }}>
          <span style={{ color: 'var(--rv-teal-600)', fontFamily: 'var(--rv-font-mono)', fontWeight: 800, fontSize: 13 }}>
            ✅ SETTLED ON-CHAIN · ESCROW LOCKED
          </span>
        </div>
      )}
    </div>
  );
}
