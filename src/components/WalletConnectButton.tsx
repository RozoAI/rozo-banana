"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useState, useEffect } from "react";
import { Wallet, LogOut, Loader2, Smartphone } from "lucide-react";

export function WalletConnectButton() {
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    // Detect if running on mobile
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
    };
    setIsMobile(checkMobile());
  }, []);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleConnect = () => {
    // Find WalletConnect connector for mobile, injected for desktop
    const walletConnectConnector = connectors.find(c => c.id === "walletConnect");
    const injectedConnector = connectors.find(c => c.id === "injected");
    
    // If we haven't detected mobile status yet, prefer WalletConnect as it works everywhere
    if (isMobile === null) {
      if (walletConnectConnector) {
        connect({ connector: walletConnectConnector });
      } else if (injectedConnector) {
        connect({ connector: injectedConnector });
      }
    } else if (isMobile && walletConnectConnector) {
      // Use WalletConnect for mobile
      connect({ connector: walletConnectConnector });
    } else if (!isMobile && injectedConnector) {
      // Use injected (MetaMask, etc.) for desktop
      connect({ connector: injectedConnector });
    } else if (walletConnectConnector) {
      // Fallback to WalletConnect if no injected wallet
      connect({ connector: walletConnectConnector });
    }
  };

  if (isConnecting || isPending) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed"
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Connecting...</span>
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-800 rounded-lg">
          <Wallet className="w-4 h-4" />
          <span className="font-medium">{formatAddress(address)}</span>
        </div>
        <button
          onClick={() => disconnect()}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Disconnect wallet"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all transform hover:scale-105 shadow-lg"
    >
      {isMobile ? (
        <Smartphone className="w-4 h-4" />
      ) : (
        <Wallet className="w-4 h-4" />
      )}
      <span className="font-medium">
        {isMobile ? "Connect Mobile Wallet" : "Connect Wallet"}
      </span>
    </button>
  );
}