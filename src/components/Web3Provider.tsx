'use client';
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { monadTestnet } from '@wagmi/core/chains';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// 1. Get your own projectId at https://cloud.reown.com and add to .env.local
// NEXT_PUBLIC_PROJECT_ID=your_real_project_id
const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || 'b246a470126781cd095113d7e86e1e82';

// 2. Set up the Wagmi adapter
export const networks = [monadTestnet];
const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
});

// 3. Create the AppKit instance
createAppKit({
  adapters: [wagmiAdapter],
  networks: [monadTestnet],
  projectId,
  features: {
    analytics: false, // Disable to avoid 403 when using placeholder projectId
    email: false,
    socials: false,
  },
  themeMode: 'light',
  themeVariables: {
    '--w3m-accent': '#6b21a8',
    '--w3m-border-radius-master': '0px',
  },
});

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
