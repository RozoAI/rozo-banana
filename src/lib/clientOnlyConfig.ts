"use client";

import { createConfig } from "wagmi";
import type { Config } from "wagmi";

// Dynamic import for RozoPay to avoid SSR issues
let rozoPayConfig: Config | null = null;

export async function getRozoPayConfig(): Promise<Config> {
  if (rozoPayConfig) return rozoPayConfig;

  // Only import on client side
  if (typeof window !== "undefined") {
    const { getDefaultConfig: getDefaultConfigRozo } = await import("@rozoai/intent-pay");

    rozoPayConfig = createConfig(
      getDefaultConfigRozo({
        appName: "Banana DApp",
        appIcon: "https://avatars.githubusercontent.com/u/37784886",
        appUrl: window.location.origin,
      })
    );

    return rozoPayConfig;
  }

  // Return a basic config for SSR (will be replaced on client)
  const { http } = await import("wagmi");
  const { mainnet } = await import("wagmi/chains");

  return createConfig({
    chains: [mainnet],
    transports: {
      [mainnet.id]: http(),
    },
  });
}