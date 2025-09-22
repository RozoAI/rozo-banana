import { getDefaultConfig as getDefaultConfigRozo } from "@rozoai/intent-pay";
import { createConfig } from "wagmi";

export const rozoPayConfig = createConfig(
  getDefaultConfigRozo({
    appName: "Banana DApp",
    appIcon: "https://avatars.githubusercontent.com/u/37784886",
    appUrl:
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000",
  })
);
