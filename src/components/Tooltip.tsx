'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
  content: string | React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const getPositionStyles = () => {
    switch (position) {
      case 'top':
        return { bottom: '100%', left: '50%', transform: 'translate(-50%, -8px)' };
      case 'bottom':
        return { top: '100%', left: '50%', transform: 'translate(-50%, 8px)' };
      case 'left':
        return { right: '100%', top: '50%', transform: 'translate(-8px, -50%)' };
      case 'right':
        return { left: '100%', top: '50%', transform: 'translate(8px, -50%)' };
    }
  };

  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.1 }}
            style={{
              position: 'absolute',
              zIndex: 100,
              padding: '6px 12px',
              background: 'var(--rv-black)',
              border: '1.5px solid var(--rv-black)',
              color: 'var(--rv-white)',
              fontFamily: 'var(--rv-font-mono)',
              fontSize: '11px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              boxShadow: '4px 4px 0px rgba(0,0,0,0.2)',
              ...getPositionStyles(),
            }}
          >
            {content?.toString().toUpperCase() || 'NO_CONTENT'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
