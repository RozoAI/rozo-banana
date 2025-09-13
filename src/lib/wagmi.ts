import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Banana',
  projectId: 'YOUR_PROJECT_ID', // Get this from https://cloud.walletconnect.com
  chains: [mainnet],
  ssr: true,
});