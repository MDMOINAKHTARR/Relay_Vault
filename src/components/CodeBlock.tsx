'use client';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language = 'javascript' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: 'relative',
      background: 'var(--rv-pure-white)',
      border: '1.5px solid var(--rv-black)',
      boxShadow: '4px 4px 0px var(--rv-black)',
      overflow: 'hidden'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 16px',
        background: 'var(--rv-black)',
        borderBottom: '1.5px solid var(--rv-black)'
      }}>
        <div style={{
          fontFamily: 'var(--rv-font-mono)',
          fontSize: '11px',
          color: 'var(--rv-white)',
          fontWeight: 700,
          textTransform: 'uppercase'
        }}>
          {language}
        </div>
        <button
          onClick={handleCopy}
          style={{
            background: 'none',
            border: 'none',
            color: copied ? '#5DCAA5' : 'rgba(255, 255, 255, 0.5)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.2s'
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
      <pre style={{
        margin: 0,
        padding: '16px',
        overflowX: 'auto',
        fontFamily: 'var(--rv-font-mono)',
        fontSize: '13px',
        lineHeight: '1.6',
        color: 'var(--rv-black)',
        background: 'var(--rv-pure-white)'
      }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}
