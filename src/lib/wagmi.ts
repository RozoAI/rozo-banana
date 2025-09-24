import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { coinbaseWallet, phantomWallet } from "@rainbow-me/rainbowkit/wallets";
import { getDefaultConfig as getDefaultConfigRozo } from "@rozoai/intent-pay";
import { createConfig } from "wagmi";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [phantomWallet, coinbaseWallet],
    },
  ],
  {
    appName: "Banana DApp",
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID as string,
  }
);

export const rozoPayConfig = createConfig(
  getDefaultConfigRozo({
    appName: "Banana DApp",
    appIcon: "https://avatars.githubusercontent.com/u/37784886",
    appUrl:
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000",
    connectors: [...connectors],
  })
);
