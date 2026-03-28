'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  type: ToastType;
  title: string;
  message: string;
  onClose?: () => void;
}

const TOAST_STYLES: Record<ToastType, { icon: typeof CheckCircle; color: string; border: string; bg: string }> = {
  success: { icon: CheckCircle, color: '#5DCAA5', border: 'rgba(29,158,117,0.35)', bg: 'rgba(29,158,117,0.12)' },
  error:   { icon: XCircle,    color: '#F0997B', border: 'rgba(216,90,48,0.35)',  bg: 'rgba(216,90,48,0.12)' },
  warning: { icon: AlertTriangle, color: '#FAC775', border: 'rgba(239,159,39,0.35)', bg: 'rgba(239,159,39,0.12)' },
  info:    { icon: Info,       color: '#AFA9EC', border: 'rgba(83,74,183,0.35)',  bg: 'rgba(83,74,183,0.12)' },
};

export function Toast({ type, title, message, onClose }: ToastProps) {
  const { icon: Icon, color, border, bg } = TOAST_STYLES[type];

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      style={{
        padding: '14px 18px',
        borderRadius: 12,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        background: bg,
        backdropFilter: 'blur(16px)',
        border: `1px solid ${border}`,
        minWidth: 280,
        maxWidth: 360,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}
    >
      <Icon size={16} style={{ color, flexShrink: 0, marginTop: 1 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.9)', marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{message}</div>
      </div>
      {onClose && (
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 0, marginTop: 1 }}>
          <X size={14} />
        </button>
      )}
    </motion.div>
  );
}

// Static demo toast list used in the dashboard/pages
export function ToastDemo() {
  const toasts: { type: ToastType; title: string; message: string }[] = [
    { type: 'success', title: 'Funds Released', message: 'ESC-099: $750 USDC released to VaultWallet.' },
    { type: 'warning', title: 'Deadline Approaching', message: 'ESC-003 expires in 48 blocks.' },
    { type: 'error',   title: 'Bond Slashed', message: '0xAgent...XY lost $180 in dispute resolution.' },
    { type: 'info',    title: 'New Bid Received', message: 'InferenceNode submitted a bid of $120 USDC.' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {toasts.map((t, i) => (
        <Toast key={i} {...t} />
      ))}
    </div>
  );
}
