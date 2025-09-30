"use client";

import { useIsMobile } from "@/hooks/useIsMobile";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useAppKit } from "@reown/appkit/react";
import { Loader2, LogOut, Smartphone, Wallet } from "lucide-react";
import { useEffect } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

export function WalletConnectButton({
  className = "",
}: {
  className?: string;
}) {
  const { openConnectModal } = useConnectModal();
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();
  const isMobile = useIsMobile();

  // Save address when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      console.log(
        "🔗 [WalletConnectButton] Wallet connected, saving address:",
        address
      );
      // Save address in localStorage for API calls
      localStorage.setItem("userAddress", address.toLowerCase());

      // Also create a minimal user object if it doesn't exist
      const existingUser = localStorage.getItem("rozo_user");
      if (!existingUser) {
        const user = {
          address: address.toLowerCase(),
          is_connected: true,
        };
        localStorage.setItem("rozo_user", JSON.stringify(user));
        console.log(
          "👤 [WalletConnectButton] Created user object with address"
        );
      } else {
        // If rozo_user exists, validate it has the correct address
        try {
          const user = JSON.parse(existingUser);
          if (
            user.address &&
            user.address.toLowerCase() !== address.toLowerCase()
          ) {
            console.warn(
              "⚠️ [WalletConnectButton] Correcting mismatched address in rozo_user",
              {
                stored: user.address,
                actual: address,
              }
            );
            user.address = address.toLowerCase();
            localStorage.setItem("rozo_user", JSON.stringify(user));
          }
        } catch (e) {
          console.error("Failed to parse existing rozo_user", e);
        }
      }
    }
  }, [isConnected, address]);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleConnect = () => {
    // Find WalletConnect connector for mobile, injected for desktop
    const walletConnectConnector = connectors.find(
      (c) => c.id === "walletConnect"
    );
    const injectedConnector = connectors.find((c) => c.id === "injected");
    open({ view: "Connect" });
    // // If we haven't detected mobile status yet, prefer WalletConnect as it works everywhere
    // if (isMobile === null) {
    //   if (walletConnectConnector) {
    //     console.log(
    //       "[WalletConnectButton] isMobile is null, connecting with WalletConnect"
    //     );
    //     connect({ connector: walletConnectConnector });
    //   } else if (injectedConnector) {
    //     console.log(
    //       "[WalletConnectButton] isMobile is null, WalletConnect not found, connecting with injected"
    //     );
    //     connect({ connector: injectedConnector });
    //   } else {
    //     console.warn(
    //       "[WalletConnectButton] No suitable connector found (isMobile null)"
    //     );
    //   }
    // } else if (isMobile && walletConnectConnector) {
    //   // Use WalletConnect for mobile
    //   console.log(
    //     "[WalletConnectButton] Mobile detected, connecting with WalletConnect"
    //   );
    //   connect({ connector: walletConnectConnector });
    // } else if (!isMobile && injectedConnector) {
    //   // Use injected (MetaMask, etc.) for desktop
    //   console.log(
    //     "[WalletConnectButton] Desktop detected, connecting with injected"
    //   );
    //   connect({ connector: injectedConnector });
    // } else if (walletConnectConnector) {
    //   // Fallback to WalletConnect if no injected wallet
    //   console.log(
    //     "[WalletConnectButton] Fallback: connecting with WalletConnect"
    //   );
    //   connect({ connector: walletConnectConnector });
    // } else {
    //   console.warn("[WalletConnectButton] No suitable connector found");
    // }
  };

  if (isConnecting || isPending) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-400 rounded-lg cursor-not-allowed"
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Connecting...</span>
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-2 bg-green-900 text-green-300 rounded-lg">
          <Wallet className="w-4 h-4" />
          <span className="font-medium">{formatAddress(address)}</span>
        </div>
        <button
          onClick={() => disconnect()}
          className="p-2 text-red-400 hover:bg-red-900 rounded-lg transition-colors"
          title="Disconnect wallet"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // During SSR and initial client render, show a consistent button state
  // to avoid hydration mismatches
  return (
    <button
      onClick={handleConnect}
      className={`flex items-center gap-2 px-2 py-1.5 lg:px-4 lg:py-2 bg-[rgb(245,210,60)] text-black rounded-lg hover:bg-[rgb(255,220,70)] transition-all transform hover:scale-105 shadow-lg ${className}`}
    >
      {isMobile === true ? (
        <Smartphone className="w-4 h-4" />
      ) : (
        <Wallet className="w-4 h-4" />
      )}
      <span className={`font-medium ${isMobile ? "text-sm" : "text-base"}`}>
        Connect Wallet
      </span>
    </button>
  );
}
