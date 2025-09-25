import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { base, bsc, mainnet, polygon } from "@reown/appkit/networks";
import { createAppKit } from "@reown/appkit/react";
import { http } from "viem";
import { injected } from "wagmi/connectors";

// WalletConnect v2 Project ID - you should get your own from https://cloud.walletconnect.com
const WALLETCONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
  "ab8fa47f01e6a72c58bbb76577656051";

// Chains configuration - includes all chains required by RozoPay
// export const chains = [mainnet, base, polygon, optimism, arbitrum, linea, bsc] as const;

// Create wagmi config with WalletConnect v2
// export const walletConnectConfig = createConfig({
//   chains,
//   connectors: [
//     // Injected connector for browser extensions
//     injected({
//       shimDisconnect: true,
//     }),

//     // WalletConnect v2 connector for mobile wallets
//     walletConnect({
//       projectId: WALLETCONNECT_PROJECT_ID,
//       showQrModal: true,
//       metadata: {
//         name: "Banana DApp",
//         description: "Banana DApp - Generate and manage your digital bananas",
//         url: typeof window !== "undefined" ? window.location.origin : "https://banana.rozo.ai",
//         icons: ["https://avatars.githubusercontent.com/u/37784886"],
//       },
//     }),
//   ],
//   transports: {
//     [mainnet.id]: http(),
//     [base.id]: http(),
//     [polygon.id]: http(),
//     [optimism.id]: http(),
//     [arbitrum.id]: http(),
//     [linea.id]: http(),
//     [bsc.id]: http(),
//   },
// });

// 2. Create a metadata object - optional
const metadata = {
  name: "Banana DApp",
  description: "Banana DApp - Generate and manage your digital bananas",
  url:
    typeof window !== "undefined"
      ? window.location.origin
      : "https://b.rozo.ai",
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

// 3. Set the networks
const networks = [mainnet, base, polygon, bsc];

// 4. Create Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId: WALLETCONNECT_PROJECT_ID,
  ssr: true,
  chains: [mainnet, base, polygon, bsc],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [polygon.id]: http(),
    [bsc.id]: http(),
  },
  connectors: [
    injected({
      shimDisconnect: true,
    }),
  ],
});

// 5. Create modal
createAppKit({
  adapters: [wagmiAdapter],
  // @ts-ignore
  networks: networks,
  projectId: WALLETCONNECT_PROJECT_ID,
  metadata,
  features: {
    email: false, // default to true
    socials: [],
    emailShowWallets: true, // default to true
  },
  allWallets: "SHOW", // default to SHOW
  coinbasePreference: "all",
  enableCoinbase: true,
  themeMode: "light",
});

// // Create standalone WalletConnect provider for direct integration
// export async function createWalletConnectProvider() {
//   // Only initialize on client side
//   if (typeof window === "undefined") {
//     return null;
//   }

//   const provider = await EthereumProvider.init({
//     projectId: WALLETCONNECT_PROJECT_ID,
//     chains: [1], // Mainnet
//     optionalChains: [137, 42161, 10, 8453, 56], // Polygon, Arbitrum, Optimism, Base, BSC
//     showQrModal: true,
//     metadata: {
//       name: "Banana DApp",
//       description: "Banana DApp - Generate and manage your digital bananas",
//       url: window.location.origin,
//       icons: ["https://avatars.githubusercontent.com/u/37784886"],
//     },
//     qrModalOptions: {
//       themeMode: "light",
//       themeVariables: {
//         "--wcm-z-index": "999999",
//       },
//     },
//   });

//   return provider;
// }
