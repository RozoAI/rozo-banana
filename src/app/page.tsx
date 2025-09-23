"use client";

import { MobileDashboard } from "@/components/MobileDashboard";
import NanoBananaGenerator from "@/components/NanoBananaGenerator";
import { Toast } from "@/components/Toast";
import { WalletButton } from "@/components/WalletButton";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

export default function Home() {
  const { address, isConnected } = useAccount();
  const [showGenerator, setShowGenerator] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    message: string;
    type: "success" | "error" | "info" | "warning";
  } | null>(null);

  useEffect(() => {
    // Check for JWT expiration
    if (typeof window !== "undefined") {
      const authExpired = localStorage.getItem("auth_expired");
      if (authExpired === "true") {
        setToastMessage({
          message: "Session expired. Please sign in again.",
          type: "warning",
        });
        localStorage.removeItem("auth_expired");
      }

    }
    console.warn("🔑 [Home] isConnected:", isConnected);
    console.warn("🔑 [Home] address:", address);
    if (!isConnected || !address) {
      const signedAddresses = localStorage.getItem("rozo_signed_addresses");
      console.warn("🔑 [Home] signedAddresses:", signedAddresses);
      if (signedAddresses) {
        const signedAddressesObj = JSON.parse(signedAddresses);
        console.warn("🔑 [Home] signedAddressesObj:", signedAddressesObj);
        if (signedAddressesObj.address !== address) {
          console.warn("🔑 [Home] signedAddressesObj.address !== address");
          // authAPI.logout();
        }
      }
    }

    if (isConnected && address) {
      const signedAddresses = localStorage.getItem("rozo_signed_addresses");
      console.warn("🔑 [Home] signedAddresses:", signedAddresses);
      if (signedAddresses) {
        const signedAddressesObj = JSON.parse(signedAddresses);
        if (signedAddressesObj.address !== address) {
          console.warn("🔑 [Home] signedAddressesObj.address === address");
          localStorage.removeItem("rozo_signed_addresses");
          localStorage.removeItem("rozo_token");
          localStorage.removeItem("auth_token");
          localStorage.removeItem("rozo_user");
          localStorage.removeItem("userAddress");
          localStorage.removeItem("auth_expired");
          localStorage.removeItem("welcome_new_user");
          localStorage.removeItem("welcome_back_user");
          localStorage.removeItem("authToken");
        }
      }
    }
  }, [isConnected, address]);

  // Check if coming from /generate route
  if (
    typeof window !== "undefined" &&
    window.location.pathname === "/generate"
  ) {
    return <NanoBananaGenerator />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50">
      {toastMessage && (
        <Toast
          message={toastMessage.message}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}
      <header className="sticky top-0 w-full bg-white/90 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-3xl">🍌</span>
              <span className="font-bold text-xl text-black">Banana</span>
            </div>
            <WalletButton />
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4">
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] py-8">
            <div className="text-center space-y-8 w-full">
              <div className="space-y-6">
                <span className="text-8xl block">🍌</span>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-3">
                    ROZO Banana
                  </h1>
                  <p className="text-xl font-semibold text-gray-700">
                    Create stunning images instantly
                  </p>
                  <p className="text-lg text-gray-600 mt-1">
                    AI-powered editing in seconds
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🎨</span>
                  <p className="text-base font-medium text-gray-800 text-left">
                    Generate and edit AI images instantly
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">💰</span>
                  <p className="text-base font-medium text-gray-800 text-left">
                    Earn{" "}
                    <span className="font-bold text-yellow-600">10%</span>{" "}
                    rewards from referrals
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <MobileDashboard address={address!} />
        )}
      </main>
    </div>
  );
}
