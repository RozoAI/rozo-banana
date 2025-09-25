import { EthereumProvider } from "@walletconnect/ethereum-provider";
import { createConfig, http } from "wagmi";
import { mainnet, polygon, arbitrum, optimism, base, linea } from "wagmi/chains";
import { walletConnect, injected } from "wagmi/connectors";

// WalletConnect v2 Project ID - you should get your own from https://cloud.walletconnect.com
const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "ab8fa47f01e6a72c58bbb76577656051";

// Chains configuration - includes all chains required by RozoPay
export const chains = [mainnet, base, polygon, optimism, arbitrum, linea] as const;

// Create wagmi config with WalletConnect v2
export const walletConnectConfig = createConfig({
  chains,
  connectors: [
    // Injected connector for browser extensions
    injected({
      shimDisconnect: true,
    }),
    
    // WalletConnect v2 connector for mobile wallets
    walletConnect({
      projectId: WALLETCONNECT_PROJECT_ID,
      showQrModal: true,
      metadata: {
        name: "Banana DApp",
        description: "Banana DApp - Generate and manage your digital bananas",
        url: typeof window !== "undefined" ? window.location.origin : "https://banana.rozo.ai",
        icons: ["https://avatars.githubusercontent.com/u/37784886"],
      },
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
    [linea.id]: http(),
  },
});

// Create standalone WalletConnect provider for direct integration
export async function createWalletConnectProvider() {
  // Only initialize on client side
  if (typeof window === "undefined") {
    return null;
  }

  const provider = await EthereumProvider.init({
    projectId: WALLETCONNECT_PROJECT_ID,
    chains: [1], // Mainnet
    optionalChains: [137, 42161, 10, 8453], // Polygon, Arbitrum, Optimism, Base
    showQrModal: true,
    metadata: {
      name: "Banana DApp",
      description: "Banana DApp - Generate and manage your digital bananas",
      url: window.location.origin,
      icons: ["https://avatars.githubusercontent.com/u/37784886"],
    },
    qrModalOptions: {
      themeMode: "light",
      themeVariables: {
        "--wcm-z-index": "999999",
      },
    },
  });

  return provider;
}