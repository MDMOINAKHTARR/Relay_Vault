'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { Activity, BarChart3, BookOpen, Home, Search, Settings, Wallet } from 'lucide-react';

const navLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/discover', label: 'Discover', icon: Search },
  { href: '/negotiate', label: 'Negotiate', icon: Activity },
  { href: '/vault', label: 'Vault', icon: Wallet },
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/history', label: 'History', icon: BookOpen },
  { href: '/register', label: 'Register', icon: Settings },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'var(--rv-black)',
      borderBottom: 'var(--rv-border-hard)',
      padding: '0 30px',
      height: 64,
      display: 'flex',
      alignItems: 'center'
    }}>
      <div style={{
        minWidth: '100%',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64,
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{
            fontFamily: 'var(--rv-font-sans)',
            fontWeight: 800,
            fontSize: 22,
            letterSpacing: '-0.03em',
            color: 'var(--rv-white)',
            textTransform: 'uppercase'
          }}>
            RelayVault
          </span>
        </Link>

        <div style={{ display: 'flex', gap: 4 }}>
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: 0,
                  textDecoration: 'none',
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: 'var(--rv-font-sans)',
                  color: active ? '#fff' : 'rgba(255,255,255,0.6)',
                  background: active ? 'var(--rv-purple-600)' : 'transparent',
                  border: active ? '1.5px solid #fff' : '1.5px solid transparent',
                  transition: 'all 0.1s ease-out',
                }}
              >
                <Icon size={14} />
                {label}
              </Link>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span className="brute-badge badge-success" style={{ fontFamily: 'var(--rv-font-mono)', fontSize: 10 }}>
            • MONAD TESTNET
          </span>
          <appkit-button balance="hide" />
        </div>
      </div>
    </nav>
  );
}
