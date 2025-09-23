"use client";

import { useAuth } from "@/hooks/useAuth";
import { creditsAPI, pointsAPI } from "@/lib/api";
import { useEffect, useRef, useState } from "react";

interface MobileDashboardProps {
  address: string;
}

export function MobileDashboard({ address }: MobileDashboardProps) {
  const { isAuthenticated, signIn, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("home");
  const [points, setPoints] = useState(0);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [affiliateName, setAffiliateName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [userSpent, setUserSpent] = useState(0); // Track total spent for tier calculation
  const hasFetched = useRef(false);

  useEffect(() => {
    if (isAuthenticated) {
      if (!hasFetched.current) {
        fetchUserData();
        hasFetched.current = true;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    // Auto sign-in when address is available and not authenticated
    if (address && !isAuthenticated && !isLoading) {
      console.log("🔄 [MobileDashboard] Auto signing in...");
      signIn();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, isAuthenticated]);

  const fetchUserData = async () => {
    console.log("📊 [MobileDashboard] Fetching user data...");
    setLoading(true);
    try {
      // Fetch points balance
      console.log("💰 [MobileDashboard] Fetching points balance...");
      const balance = await pointsAPI.getBalance();
      console.log("✅ [MobileDashboard] Points balance response:", balance);
      setPoints(balance.balance || balance.points || 0);

      // Also try to fetch credits
      try {
        console.log("💳 [MobileDashboard] Fetching credits balance...");
        const creditsData = await creditsAPI.getBalance();
        console.log(
          "✅ [MobileDashboard] Credits balance response:",
          creditsData
        );

        // Extract numeric credits value from various possible response formats
        let creditsValue = 0;

        // Handle nested object structure like { available, plan_type, expires_at, used_this_month }
        if (typeof creditsData === "object" && creditsData !== null) {
          if (typeof creditsData.available === "number") {
            creditsValue = creditsData.available;
          } else if (typeof creditsData.credits === "number") {
            creditsValue = creditsData.credits;
          } else if (creditsData.data?.credits) {
            if (typeof creditsData.data.credits === "number") {
              creditsValue = creditsData.data.credits;
            } else if (typeof creditsData.data.credits.available === "number") {
              creditsValue = creditsData.data.credits.available;
            }
          } else if (typeof creditsData.balance === "number") {
            creditsValue = creditsData.balance;
          }
        }

        console.log(
          "💳 [MobileDashboard] Extracted credits value:",
          creditsValue
        );
        setCredits(creditsValue);
      } catch (creditsError: any) {
        console.error("❌ [MobileDashboard] Failed to fetch credits:", {
          error: creditsError.message,
          response: creditsError.response?.data,
          status: creditsError.response?.status,
        });
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
    } finally {
      setLoading(false);
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

  if (!isAuthenticated && !isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen space-y-4">
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-4">
            Please sign in to access your dashboard
          </p>
          <button
            onClick={() => signIn()}
            className="px-6 py-3 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 transition-colors"
          >
            Sign In with Wallet
          </button>
        </div>
      </div>
    );
  }

  if (loading || isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

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
      {/* Tier Badge */}
      <div className="flex justify-end mt-4 mb-2">
        <div className={`flex items-center gap-1 px-3 py-1 bg-white rounded-full shadow-sm border ${currentTier.color}`}>
          <span className="text-sm">{currentTier.icon}</span>
          <span className="font-semibold text-sm">{currentTier.name}</span>
        </div>
      </div>

      {/* Points and Credits Display */}
      <div className="grid grid-cols-2 gap-4">
        <div className="py-6 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">Points</p>
            <p className="text-3xl font-bold text-gray-900">{points}</p>
          </div>
        </div>
        <div className="py-6 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">Credits</p>
            <p className="text-3xl font-bold text-yellow-600">{credits}</p>
          </div>
        </div>
      </div>

      {/* Membership Progress Bar */}
      <div className="mt-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="mb-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-700">Membership Progress</span>
            {currentTier.nextTier && (
              <span className="text-xs text-gray-500">
                ${userSpent.toFixed(0)} / ${currentTier.nextAmount}
              </span>
            )}
          </div>
          {currentTier.nextTier ? (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(tierProgress, 100)}%` }}
              />
            </div>
          ) : (
            <div className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full h-2" />
          )}
        </div>
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex items-center gap-1">
            <span>🥉</span>
            <span><strong>Bronze:</strong> Complete your first purchase</span>
          </div>
          <div className="flex items-center gap-1">
            <span>🥈</span>
            <span><strong>Silver:</strong> Spend $100 to upgrade</span>
          </div>
          <div className="flex items-center gap-1">
            <span>🏆</span>
            <span><strong>Gold:</strong> Spend $1000 for exclusive benefits</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-6">
        {activeTab === "home" && (
          <div className="space-y-4">
            {/* Referral Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-lg mb-4 text-gray-900">
                Share & Earn
              </h3>

              {/* Social Links */}
              <div className="flex gap-3 mb-4">
                <a
                  href="https://discord.com/invite/EfWejgTbuU"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                  <span className="text-sm font-medium">Discord</span>
                </a>
                <a
                  href="https://x.com/ROZOai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  <span className="text-sm font-medium">Twitter</span>
                </a>
              </div>

              {/* Affiliate Name Section */}
              <div className="mb-4">
                <label className="text-sm text-gray-600 mb-2 block">
                  Your Affiliate Name
                </label>
                {isEditingName ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={affiliateName}
                      onChange={(e) => setAffiliateName(e.target.value)}
                      placeholder="Enter your name"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      maxLength={30}
                    />
                    <button
                      onClick={saveAffiliateName}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingName(false);
                        setAffiliateName(
                          localStorage.getItem(`affiliateName_${address}`) || ""
                        );
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900 font-medium">
                      {affiliateName ||
                        address.slice(0, 6) + "..." + address.slice(-4)}
                    </span>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
                    >
                      Edit
                    </button>
                  </div>
                )}
                {nameSaved && (
                  <p className="text-sm text-green-600 mt-2">
                    ✓ Name saved successfully!
                  </p>
                )}
              </div>

              <button
                onClick={copyReferralLink}
                className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold text-base hover:from-yellow-600 hover:to-orange-600 transition-all transform active:scale-[0.98]"
              >
                {copied ? "✓ Copied!" : "Copy Referral Link"}
              </button>
              <p className="text-sm text-gray-500 mt-3 text-center">
                Earn 10% from direct referrals
              </p>
              <p className="text-xs text-gray-400 mt-2 text-center">
                <span className="break-all">Your link: {window.location.origin}?ref=
                {affiliateName ? encodeURIComponent(affiliateName) : address}</span>
              </p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => (window.location.href = "/generate")}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-left hover:shadow-md transition-shadow"
              >
                <div className="text-3xl mb-2">🎨</div>
                <p className="font-semibold text-gray-900">Generate</p>
                <p className="text-sm text-gray-500 mt-1">5 pts/image</p>
              </button>

              <button
                onClick={() => (window.location.href = "/recharge")}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-left hover:shadow-md transition-shadow relative"
              >
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                  HOT
                </div>
                <div className="text-3xl mb-2">💎</div>
                <p className="font-semibold text-gray-900">Top Up</p>
                <p className="text-sm text-gray-500 mt-1">Get points</p>
              </button>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-lg mb-4 text-gray-900">
              Recent Activity
            </h3>
            <div className="flex flex-col items-center justify-center py-12">
              <span className="text-4xl mb-3">📭</span>
              <p className="text-gray-500">No activity yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Your transactions will appear here
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100">
        <div className="max-w-lg mx-auto">
          <div className="grid grid-cols-2">
            <button
              onClick={() => setActiveTab("home")}
              className={`py-4 text-center transition-colors ${
                activeTab === "home" ? "text-yellow-600" : "text-gray-400"
              }`}
            >
              <div className="text-2xl mb-1">🏠</div>
              <p className="text-xs font-medium">Home</p>
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`py-4 text-center transition-colors ${
                activeTab === "history" ? "text-yellow-600" : "text-gray-400"
              }`}
            >
              <div className="text-2xl mb-1">📊</div>
              <p className="text-xs font-medium">History</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
