"use client";

import { BottomNavigation } from "@/components/BottomNavigation";
import { ShareButton } from "@/components/ShareButton";
import { Toast } from "@/components/Toast";
import { TwitterShareButton } from "@/components/TwitterShareButton";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/useIsMobile";
import { creditsAPI, imageAPI, pointsAPI } from "@/lib/api";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { useAccount } from "wagmi";

// Component to handle referral code from URL params
function ReferralHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const referralCode = searchParams.get("ref");
    if (referralCode) {
      // Save referral code to localStorage and cookie
      localStorage.setItem("referralCode", referralCode);
      document.cookie = `referralCode=${referralCode}; path=/; max-age=${
        60 * 60 * 24 * 30
      }`; // 30 days
      console.log("Referral code saved:", referralCode);
    }
  }, [searchParams]);

  return null;
}

export default function Home() {
  const { address, isConnected } = useAccount();
  const { isAuthenticated, signIn, isLoading } = useAuth();
  const [showGenerator, setShowGenerator] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    message: string;
    type: "success" | "error" | "info" | "warning";
  } | null>(null);
  const [galleryImages, setGalleryImages] = useState<
    Array<{
      id: string;
      image_url?: string;
      url?: string;
      thumbnail?: string;
      file_name?: string;
      prompt: string;
      created_at: string;
    }>
  >([]);
  const [galleryLoading, setGalleryLoading] = useState(false);

  // MobileDashboard state variables
  const [activeTab, setActiveTab] = useState("home");
  const [points, setPoints] = useState<number | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [affiliateName, setAffiliateName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [userSpent, setUserSpent] = useState(0);
  const [isTierDetailsExpanded, setIsTierDetailsExpanded] = useState(false);
  const hasFetched = useRef(false);

  const isMobile = useIsMobile();

  // Fetch user data when wallet is connected (address is available)
  useEffect(() => {
    if (address && !hasFetched.current) {
      console.log(
        "📊 [Profile] Wallet connected, fetching user data for:",
        address
      );
      fetchUserData();
      hasFetched.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const fetchUserData = async () => {
    console.log("📊 [Profile] Fetching user data for address:", address);
    // Don't block UI - load data in background
    try {
      // Fetch points balance - API will use address parameter automatically
      console.log("💰 [Profile] Fetching points balance...");

      // Try to fetch points balance
      try {
        const balance = await pointsAPI.getBalance();
        console.log("✅ [Profile] Points balance response:", balance);
        setPoints(balance.balance ?? balance.points ?? 0);
      } catch (pointsError: any) {
        if (pointsError.response?.status === 401) {
          console.log(
            "🔔 [Profile] Points API requires authentication, showing default"
          );
          setPoints(0);
        } else {
          console.error("❌ [Profile] Points fetch error:", pointsError);
          setPoints(0);
        }
      }

      // Try to fetch credits balance
      console.log("💳 [Profile] About to fetch credits...");
      try {
        const creditsData = await creditsAPI.getBalance();
        console.log("✅ [Profile] Credits balance response:", creditsData);
        setCredits(creditsData.credits ?? creditsData.available ?? 0);
      } catch (creditsError: any) {
        console.log("❌ [Profile] Credits fetch error details:", {
          status: creditsError.response?.status,
          data: creditsError.response?.data,
          message: creditsError.message,
        });
        if (creditsError.response?.status === 401) {
          console.log(
            "🔔 [Profile] Credits API requires authentication, showing default"
          );
          setCredits(0);
        } else {
          console.error("❌ [Profile] Credits fetch error:", creditsError);
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
      console.error("❌ [Profile] Failed to fetch user data:", {
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

  // Calculate user tier based on spending
  const getUserTier = () => {
    if (userSpent >= 1000)
      return {
        name: "Gold",
        icon: "🏆",
        color: "text-yellow-500",
        nextTier: null,
        nextAmount: null,
      };
    if (userSpent >= 100)
      return {
        name: "Silver",
        icon: "🥈",
        color: "text-gray-400",
        nextTier: "Gold",
        nextAmount: 1000,
      };
    return {
      name: "Bronze",
      icon: "🥉",
      color: "text-orange-600",
      nextTier: "Silver",
      nextAmount: 100,
    };
  };

  const currentTier = getUserTier();
  const tierProgress = currentTier.nextAmount
    ? (userSpent / currentTier.nextAmount) * 100
    : 100;

  // Fetch user's personal gallery images
  useEffect(() => {
    const fetchGalleryImages = async () => {
      if (!isConnected || !address) return; // Only fetch if user is connected

      setGalleryLoading(true);
      try {
        console.log(
          "🖼️ [Profile] Fetching personal gallery for user:",
          address
        );
        const response = await imageAPI.getHistory(1, 18); // Fetch up to 18 images for preview

        // Handle the response structure for personal gallery
        if (response.images) {
          setGalleryImages(
            response.images.map((image: any) => ({
              ...image,
              file_name: image.url
                ? image.url.replace(
                    "https://eslabobvkchgpokxszwv.supabase.co/storage/v1/object/public/generated-images/rozobanana/",
                    ""
                  )
                : undefined,
            }))
          );
        } else if (Array.isArray(response)) {
          setGalleryImages(response);
        } else {
          setGalleryImages([]);
        }
      } catch (error) {
        console.error("Failed to fetch gallery images:", error);
        setGalleryImages([]);
      } finally {
        setGalleryLoading(false);
      }
    };

    fetchGalleryImages();
  }, [isConnected, address]);

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
    // Commented out problematic signed address checking that causes logout loops
    // This was clearing localStorage when addresses didn't match, but we don't
    // require signing for basic wallet connection anymore
    /*
    console.warn("🔑 [Home] isConnected:", isConnected);
    console.warn("🔑 [Home] address:", address);
    if (!isConnected || !address) {
      const signedAddresses = localStorage.getItem("rozo_signed_addresses");
      if (signedAddresses) {
        const signedAddressesObj = JSON.parse(signedAddresses);
        if (signedAddressesObj.address !== address) {
          // This was causing issues
        }
      }
    }

    if (isConnected && address) {
      const signedAddresses = localStorage.getItem("rozo_signed_addresses");
      if (signedAddresses) {
        const signedAddressesObj = JSON.parse(signedAddresses);
        if (signedAddressesObj.address !== address) {
          // This was clearing localStorage incorrectly
        }
      }
    }
    */
  }, [isConnected, address]);

  // Check if coming from /generate route
  // if (
  //   typeof window !== "undefined" &&
  //   window.location.pathname === "/generate"
  // ) {
  //   return <NanoBananaGenerator />;
  // }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50">
      <Suspense fallback={null}>
        <ReferralHandler />
      </Suspense>
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
            <WalletConnectButton />
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 mt-4 mb-20">
        {!address ? (
          <div className="flex flex-col justify-center items-center h-screen space-y-4">
            <div className="text-center">
              <p className="text-lg text-gray-600 mb-4">
                Please connect your wallet to access the dashboard
              </p>
            </div>
          </div>
        ) : (
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

                  {/* Gallery Preview */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-lg font-semibold text-gray-900">
                        My Gallery
                      </h2>
                    </div>
                    {galleryLoading ? (
                      <div className="grid grid-cols-3 gap-3">
                        {Array.from({ length: 12 }).map((_, idx) => (
                          <div
                            key={idx}
                            className="w-full aspect-square bg-gray-200 rounded-lg animate-pulse"
                          />
                        ))}
                      </div>
                    ) : galleryImages.length > 0 ? (
                      <div className="grid grid-cols-3 gap-3">
                        {galleryImages.map((img, idx) => (
                          <div
                            key={idx}
                            className="relative w-full aspect-square overflow-hidden rounded-lg bg-gray-100 group"
                          >
                            <Image
                              src={
                                img.thumbnail ||
                                img.image_url ||
                                img.url ||
                                "/placeholder.png"
                              }
                              alt={img.prompt || `Gallery ${idx + 1}`}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              {isMobile ? (
                                <ShareButton
                                  imageUrl={
                                    img.thumbnail || img.image_url || img.url
                                  }
                                  prompt={img.prompt}
                                  shareId={img.id}
                                  className="text-xs px-2 py-1"
                                >
                                  Share
                                </ShareButton>
                              ) : (
                                <TwitterShareButton
                                  imageUrl={
                                    img.thumbnail || img.image_url || img.url
                                  }
                                  prompt={img.prompt}
                                  shareId={img.id}
                                  className="text-xs px-2 py-1"
                                >
                                  Share
                                </TwitterShareButton>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>No images yet</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Your generated images will appear here
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}
