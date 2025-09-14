import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet } from 'wagmi/chains';

// Use a default project ID for development, but you should replace this with your actual WalletConnect project ID
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'default-project-id';

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