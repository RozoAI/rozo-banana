import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet } from 'wagmi/chains';

// Use a placeholder project ID for development if not provided
// To get a real project ID: https://cloud.walletconnect.com/
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'wallet-conenct-id';

export const config = getDefaultConfig({
  appName: 'Banana',
  projectId,
  chains: [mainnet],
  ssr: true,
  // Add additional configuration to prevent initialization issues
  walletConnectParameters: {
    projectId,
    metadata: {
      name: 'Banana DApp',
      description: 'EVM Invitation Incentive System',
      url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
      icons: ['https://avatars.githubusercontent.com/u/37784886'],
    },
  },
});