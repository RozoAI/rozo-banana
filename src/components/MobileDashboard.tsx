"use client";

import { useAuth } from "@/hooks/useAuth";
import { creditsAPI, pointsAPI } from "@/lib/api";
import { useEffect, useRef, useState } from "react";
import { TwitterShareButton } from "./TwitterShareButton";

interface MobileDashboardProps {
  address: string;
}

export function MobileDashboard({ address }: MobileDashboardProps) {
  const { isAuthenticated, signIn, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("home");
  const [points, setPoints] = useState<number | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [affiliateName, setAffiliateName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [userSpent, setUserSpent] = useState(0); // Track total spent for tier calculation
  const [isTierDetailsExpanded, setIsTierDetailsExpanded] = useState(false);
  const hasFetched = useRef(false);

  // Fetch user data when wallet is connected (address is available)
  useEffect(() => {
    if (address && !hasFetched.current) {
      console.log("📊 [MobileDashboard] Wallet connected, fetching user data for:", address);
      fetchUserData();
      hasFetched.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  // Removed auto sign-in - authentication will happen when needed for image generation
  // useEffect(() => {
  //   if (address && !isAuthenticated && !isLoading) {
  //     signIn();
  //   }
  // }, [address, isAuthenticated]);


  const fetchUserData = async () => {
    console.log("📊 [MobileDashboard] Fetching user data for address:", address);
    // Don't block UI - load data in background
    try {
      // Fetch points balance - API will use address parameter automatically
      console.log("💰 [MobileDashboard] Fetching points balance...");

      // Try to fetch points balance
      try {
        const balance = await pointsAPI.getBalance();
        console.log("✅ [MobileDashboard] Points balance response:", balance);
        setPoints(balance.balance ?? balance.points ?? 0);
      } catch (pointsError: any) {
        if (pointsError.response?.status === 401) {
          console.log("🔔 [MobileDashboard] Points API requires authentication, showing default");
          setPoints(0);
        } else {
          console.error("❌ [MobileDashboard] Points fetch error:", pointsError);
          setPoints(0);
        }
      }

      // Try to fetch credits balance
      console.log("💳 [MobileDashboard] About to fetch credits...");
      try {
        const creditsData = await creditsAPI.getBalance();
        console.log("✅ [MobileDashboard] Credits balance response:", creditsData);
        setCredits(creditsData.credits ?? creditsData.available ?? 0);
      } catch (creditsError: any) {
        console.log("❌ [MobileDashboard] Credits fetch error details:", {
          status: creditsError.response?.status,
          data: creditsError.response?.data,
          message: creditsError.message
        });
        if (creditsError.response?.status === 401) {
          console.log("🔔 [MobileDashboard] Credits API requires authentication, showing default");
          setCredits(0);
        } else {
          console.error("❌ [MobileDashboard] Credits fetch error:", creditsError);
          setCredits(0);
        }
      }


      // Load saved affiliate name from localStorage
      const savedName = localStorage.getItem(`affiliateName_${address}`);
      if (savedName) {
        setAffiliateName(savedName);
      }

      // Load or set user spending (mock data for now)
      const savedSpent = localStorage.getItem(`userSpent_${address}`);
      if (savedSpent) {
        setUserSpent(parseFloat(savedSpent));
      } else {
        // Initialize with 0 spent
        setUserSpent(0);
        localStorage.setItem(`userSpent_${address}`, "0");
      }
    } catch (error: any) {
      console.error("❌ [MobileDashboard] Failed to fetch user data:", {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      // Set default values if fetch fails
      if (points === null) setPoints(0);
    }
  };


  const saveAffiliateName = () => {
    if (affiliateName.trim()) {
      // Save to localStorage
      localStorage.setItem(`affiliateName_${address}`, affiliateName.trim());
      setIsEditingName(false);
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2000);
    }
  };

  const copyReferralLink = () => {
    const baseLink = `${window.location.origin}?ref=`;
    const link = affiliateName.trim()
      ? `${baseLink}${encodeURIComponent(affiliateName.trim())}`
      : `${baseLink}${address}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Show dashboard if wallet is connected (address prop is passed)
  // Don't require authentication just to view dashboard
  if (!address) {
    return (
      <div className="flex flex-col justify-center items-center h-screen space-y-4">
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-4">
            Please connect your wallet to access the dashboard
          </p>
        </div>
      </div>
    );
  }

  // Remove loading screen - show content immediately with skeleton loaders

  // Calculate user tier based on spending
  const getUserTier = () => {
    if (userSpent >= 1000) return { name: "Gold", icon: "🏆", color: "text-yellow-500", nextTier: null, nextAmount: null };
    if (userSpent >= 100) return { name: "Silver", icon: "🥈", color: "text-gray-400", nextTier: "Gold", nextAmount: 1000 };
    return { name: "Bronze", icon: "🥉", color: "text-orange-600", nextTier: "Silver", nextAmount: 100 };
  };

  const currentTier = getUserTier();
  const tierProgress = currentTier.nextAmount ? (userSpent / currentTier.nextAmount) * 100 : 100;

  return (
    <div className="pb-20 min-h-[calc(100vh-5rem)]">
      {/* Points Display */}
      <div className="py-6 bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">Points</p>
          {points === null ? (
            <div className="h-9 w-20 bg-gray-200 rounded animate-pulse mx-auto"></div>
          ) : (
            <p className="text-3xl font-bold text-gray-900">{points}</p>
          )}
        </div>
      </div>



      {/* Main Content */}
      <div className="py-6">
        {activeTab === "home" && (
          <div className="space-y-4">
            {/* Referral Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-lg mb-4 text-gray-900">
                Share
              </h3>

              {/* Affiliate Name Section */}
              <button
                onClick={copyReferralLink}
                className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold text-base hover:from-yellow-600 hover:to-orange-600 transition-all transform active:scale-[0.98]"
              >
                {copied ? "✓ Copied!" : "Copy Referral Link"}
              </button>
              <p className="text-sm text-gray-500 mt-3 text-center">
                Earn 10% from direct referrals
              </p>
            </div>
          </div>
        )}

      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100">
        <div className="max-w-lg mx-auto">
          <div className="grid grid-cols-4">
            <button
              onClick={() => setActiveTab("home")}
              className={`py-3 text-center transition-colors ${
                activeTab === "home" ? "text-yellow-600" : "text-gray-400"
              }`}
            >
              <div className="text-2xl mb-1">🏠</div>
              <p className="text-xs font-medium">Home</p>
            </button>
            <button
              onClick={() => (window.location.href = "/generate")}
              className="py-3 text-center transition-colors text-gray-400 hover:text-yellow-600"
            >
              <div className="text-2xl mb-1">🎨</div>
              <p className="text-xs font-medium">Generate</p>
            </button>
            <button
              onClick={() => (window.location.href = "/recharge")}
              className="py-3 text-center transition-colors text-gray-400 hover:text-yellow-600 relative"
            >
              <div className="absolute -top-1 right-1/4 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                HOT
              </div>
              <div className="text-2xl mb-1">💎</div>
              <p className="text-xs font-medium">Top Up</p>
            </button>
            <button
              onClick={() => (window.location.href = "/gallery")}
              className="py-3 text-center transition-colors text-gray-400 hover:text-yellow-600"
            >
              <div className="text-2xl mb-1">🖼️</div>
              <p className="text-xs font-medium">Gallery</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
