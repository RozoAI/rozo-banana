"use client";

import { BottomNavigation } from "@/components/BottomNavigation";
import { HeaderLogo } from "@/components/HeaderLogo";
import { ShareButton } from "@/components/ShareButton";
import { Toast } from "@/components/Toast";
import { TwitterShareButton } from "@/components/TwitterShareButton";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/useIsMobile";
import { creditsAPI, imageAPI, pointsAPI } from "@/lib/api";
import { Eye } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
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
  const { address, isConnected, status } = useAccount();
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
  const hasFetchedGallery = useRef(false);

  const isMobile = useIsMobile();
  const router = useRouter();

  // Fetch user data when wallet is connected (address is available)
  useEffect(() => {
    if (address && !hasFetched.current) {
      console.log(
        "📊 [Profile] Wallet connected, fetching user data for:",
        address
      );
      fetchUserData();
      hasFetched.current = true;
    } else if (!address) {
      // Reset fetch flags when wallet disconnects
      hasFetched.current = false;
      hasFetchedGallery.current = false;
      // Clear state when disconnecting
      setPoints(null);
      setCredits(null);
      setGalleryImages([]);
      setAffiliateName("");
      setUserSpent(0);
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
        const balance = await pointsAPI.getBalance(address);
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
        const creditsData = await creditsAPI.getBalance(address);
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
      if (!isConnected || !address || hasFetchedGallery.current) return; // Only fetch if user is connected and not already fetched

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
        hasFetchedGallery.current = true;
      } catch (error) {
        console.error("Failed to fetch gallery images:", error);
        setGalleryImages([]);
      } finally {
        setGalleryLoading(false);
      }
    };

    // Reset gallery fetch flag when address changes
    if (address) {
      hasFetchedGallery.current = false;
    }

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
    <div className="min-h-screen bg-[rgb(17,17,17)]">
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
      <header className="sticky top-0 w-full bg-[rgb(17,17,17)]/90 backdrop-blur-md border-b border-gray-800 z-50">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <HeaderLogo />
            {isConnected && <WalletConnectButton />}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 mt-4 mb-20">
        {!address ? (
          <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)] space-y-4">
            <div className="text-center mb-4">
              <p className="text-3xl font-bold text-white mb-2">👤</p>
              <p className="text-xl font-bold text-white mb-2">
                Connect your wallet to access your profile
              </p>
              <p className="text-base text-gray-500">
                View your points, gallery, and referral rewards by connecting
                your wallet.
              </p>
            </div>
            <WalletConnectButton />
          </div>
        ) : (
          <div className="pb-20 min-h-[calc(100vh-5rem)]">
            {/* Points Display */}
            <div className="py-6 bg-[rgb(17,17,17)] rounded-2xl shadow-sm border border-gray-800">
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-1">Points</p>
                {points === null ? (
                  <div className="h-9 w-20 bg-gray-200 rounded animate-pulse mx-auto"></div>
                ) : (
                  <p className="text-3xl font-bold text-white">{points}</p>
                )}
              </div>
            </div>

            {/* Main Content */}
            <div className="py-6">
              {activeTab === "home" && (
                <div className="space-y-4">
                  {/* Referral Card */}
                  <div className="bg-[rgb(17,17,17)] rounded-2xl p-6 shadow-sm border border-gray-800">
                    <h3 className="font-bold text-lg mb-4 text-white">Share</h3>

                    {/* Affiliate Name Section */}
                    <button
                      onClick={copyReferralLink}
                      className="w-full py-4 bg-[rgb(245,210,60)] text-black rounded-xl font-semibold text-base hover:bg-[rgb(255,220,70)] transition-all transform active:scale-[0.98]"
                    >
                      {copied ? "✓ Copied!" : "Copy Referral Link"}
                    </button>
                    <p className="text-sm text-gray-400 mt-3 text-center">
                      Earn 10% from direct referrals
                    </p>
                  </div>

                  {/* Gallery Preview */}
                  <div className="bg-[rgb(17,17,17)] rounded-2xl shadow-sm border border-gray-800 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-lg font-semibold text-white">
                        My Gallery
                      </h2>
                    </div>
                    {galleryLoading ? (
                      <div className="grid grid-cols-3 gap-3">
                        {Array.from({ length: 12 }).map((_, idx) => (
                          <div
                            key={idx}
                            className="w-full aspect-square bg-gray-800 rounded-lg animate-pulse"
                          />
                        ))}
                      </div>
                    ) : galleryImages.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3">
                        {galleryImages.map((img, idx) => (
                          <div
                            key={img.id || idx}
                            className="relative aspect-square rounded-lg overflow-hidden bg-gray-800"
                          >
                            <Image
                              src={
                                img.thumbnail ||
                                img.image_url ||
                                img.url ||
                                "/placeholder.png"
                              }
                              alt={img.prompt || `Generated image ${idx + 1}`}
                              fill
                              className="object-cover"
                              unoptimized
                            />

                            {/* Always visible overlay for mobile-friendly experience */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent">
                              {/* Top action buttons */}
                              <div className="absolute top-2 right-2 flex gap-2">
                                <button
                                  onClick={() =>
                                    router.push(`/share/${img.file_name}`)
                                  }
                                  className="bg-white/90 hover:bg-white text-gray-700 rounded-full p-1.5 shadow-sm transition-colors"
                                  title="View details"
                                >
                                  <Eye className="size-4" />
                                </button>
                              </div>

                              {/* Bottom content */}
                              <div className="absolute bottom-0 left-0 right-0 p-2">
                                <div className="flex gap-2">
                                  {isMobile ? (
                                    <ShareButton
                                      imageUrl={
                                        img.thumbnail ||
                                        img.image_url ||
                                        img.url
                                      }
                                      prompt={img.prompt}
                                      shareId={img.id}
                                      className="text-xs px-3 py-1.5 bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 flex-1"
                                    >
                                      Share
                                    </ShareButton>
                                  ) : (
                                    <TwitterShareButton
                                      imageUrl={
                                        img.thumbnail ||
                                        img.image_url ||
                                        img.url
                                      }
                                      prompt={img.prompt}
                                      shareId={img.id}
                                      className="text-xs px-3 py-1.5 bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 flex-1"
                                    >
                                      Share
                                    </TwitterShareButton>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <p>No images yet</p>
                        <p className="text-sm text-gray-500 mt-1">
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
