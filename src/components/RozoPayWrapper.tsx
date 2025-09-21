'use client';

import { RozoPayProvider, getDefaultConfig } from '@rozoai/intent-pay';
import { WagmiProvider, createConfig } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Create a separate config for ROZO Pay with required chains
const rozoPayConfig = createConfig(
  getDefaultConfig({
    appName: 'Banana Image Generator',
  })
);

const queryClient = new QueryClient();

interface RozoPayWrapperProps {
  children: ReactNode;
}

export function RozoPayWrapper({ children }: RozoPayWrapperProps) {
  return (
    <WagmiProvider config={rozoPayConfig}>
      <QueryClientProvider client={queryClient}>
        <RozoPayProvider debugMode>
          {children}
        </RozoPayProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}