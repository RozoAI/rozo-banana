"use client";

import { useIsMobile } from "@/hooks/useIsMobile";
import { baseUSDC } from "@rozoai/intent-common";
import { RozoPayButton, useRozoPayUI } from "@rozoai/intent-pay";
import { Check, HelpCircle, Loader2, X, Zap } from "lucide-react";
import { useState } from "react";
import { getAddress } from "viem";
import { useAccount } from "wagmi";
import { BottomNavigation } from "./BottomNavigation";
import { WalletConnectButton } from "./WalletConnectButton";

interface PricingTier {
  id: string;
  name: string;
  usd: number;
  credits: number;
  images: number;
  popular?: boolean;
  period?: string;
  points: number;
}

const PRICING_TIERS: PricingTier[] = [
  {
    id: "monthly",
    name: "Monthly Plan",
    usd: 20,
    credits: 500,
    images: 100,
    period: "month",
    popular: true,
    points: 1000,
  },
  {
    id: "yearly",
    name: "Yearly Plan",
    usd: 200,
    credits: 6000,
    images: 1200,
    period: "year",
    points: 12000,
  },
];

// Destination address for payments
const DESTINATION_ADDRESS = getAddress(
  "0x5772FBe7a7817ef7F586215CA8b23b8dD22C8897"
);

export default function RechargeContent() {
  // Default select the $20 plan (first tier)
  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(
    PRICING_TIERS[0]
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payParams, setPayParams] = useState<any>(null);
  const [showPayWithButton, setShowPayWithButton] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const { resetPayment } = useRozoPayUI();
  const { isConnected } = useAccount();
  const isMobile = useIsMobile();

  const handlePayment = async (tier?: PricingTier) => {
    const currentTier = tier || selectedTier;
    if (!currentTier) {
      setError("Please select a plan");
      return;
    }

    setError(null);

    try {
      // Generate unique external ID
      const timestamp = Date.now();
      const externalId = `banana_${currentTier.id}_${timestamp}`;
      const referralCode = localStorage.getItem("referralCode");
      const paymentParams = {
        appId: "rozoBananaMP",
        toUnits: currentTier.usd.toString(),
        currency: "USD" as const,
        intent: `Banana ${currentTier.name} - ${currentTier.credits} credits`,
        toAddress: getAddress(DESTINATION_ADDRESS),
        toToken: getAddress(baseUSDC.token),
        toChainId: baseUSDC.chainId, // Base chain ID
        externalId: externalId,
        metadata: {
          planId: currentTier.id,
          planName: currentTier.name,
          credits: currentTier.credits.toString(),
          images: currentTier.images.toString(),
          referralCode: referralCode || "",
          items: [
            {
              name: `Rozo Banana`,
              description: `Banana ${currentTier.name} - ${currentTier.credits} credits`,
            },
          ],
        },
      };

      setShowPayWithButton(false);
      resetPayment(paymentParams as any);
      setPayParams(paymentParams);

      console.log("Starting payment with params:", paymentParams);
    } catch (err) {
      console.error("Payment error:", err);
      setError(err instanceof Error ? err.message : "Payment failed");
    }
  };

  const handleSelectTier = (tier: PricingTier) => {
    setSelectedTier(tier);
    // Reset payment state when changing tiers
    setPayParams(null);
    setShowPayWithButton(true);
    setError(null);
  };

  // Generates share data for the Banana OG referral (no image)
  const generateShareData = () => {
    // Try to get referral code from localStorage or fallback
    let userReferralCode = localStorage.getItem("referralCode");
    if (!userReferralCode) {
      // Try to get user address as referral code
      const userAddress =
        localStorage.getItem("userAddress") ||
        localStorage.getItem("rozo_signed_addresses");
      if (userAddress) {
        try {
          const parsedAddress =
            typeof userAddress === "string"
              ? JSON.parse(userAddress)
              : userAddress;
          userReferralCode = parsedAddress.address || userAddress;
        } catch {
          userReferralCode = userAddress;
        }
      }
    }
    if (!userReferralCode) {
      userReferralCode = "default";
    }

    // Creative sharing messages for Banana OG
    const shareMessages = [
      "I'm officially a Banana OG! 🍌🚀 Join me and unlock AI creativity with ROZO.",
      "Just unlocked Nano Banana Premium on ROZO! Get your spot and earn rewards 🍌✨",
      "Banana OG status achieved! Claim yours and let's create with AI together.",
      "I got 1,000 ROZO Points and Nano Banana Premium! Join the OGs 🍌",
      "Become a Banana OG and get exclusive rewards with ROZO AI!",
    ];
    const text =
      shareMessages[Math.floor(Math.random() * shareMessages.length)];

    const shareUrl = `${window.location.origin}/?ref=${encodeURIComponent(
      userReferralCode
    )}`;

    return {
      title: "Become a Banana OG with ROZO!",
      text,
      url: shareUrl,
    };
  };

  // Twitter share URL generator for Banana OG
  const generateTwitterUrl = () => {
    const baseUrl = "https://twitter.com/intent/tweet";
    const params = new URLSearchParams();
    const shareData = generateShareData();

    params.set("text", shareData.text);
    if (shareData.url) {
      params.set("url", shareData.url);
    }
    params.set("hashtags", "ROZO,Banana,AI");
    params.set("via", "ROZOai");

    return `${baseUrl}?${params.toString()}`;
  };

  const handleShare = async () => {
    const shareData = generateShareData();
    const twitterUrl = generateTwitterUrl();

    if (
      isMobile &&
      navigator.share &&
      navigator.canShare &&
      navigator.canShare(shareData)
    ) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        // User cancelled or error occurred, fallback to Twitter
        if (error instanceof Error && error.name !== "AbortError") {
          window.open(twitterUrl, "_blank", "width=550,height=420");
        }
      }
    } else {
      // Desktop or fallback: open Twitter share
      window.open(twitterUrl, "_blank", "width=550,height=420");
    }
  };

  return (
    <div className="min-h-screen bg-[rgb(17,17,17)]">
      {/* Header */}
      <header className="sticky top-0 w-full bg-[rgb(17,17,17)]/90 backdrop-blur-md border-b border-gray-800 z-50">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-3xl">🍌</span>
              <span className="font-bold text-xl text-white">ROZO Banana</span>
            </div>
            <WalletConnectButton />
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Hello ROZO OG</h1>
          <p className="text-gray-400 text-sm">
            {/* Pay with crypto via RozoAI Intent Pay */}
          </p>
        </div>

        {/* Pricing Tiers */}
        <div className="space-y-4">
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`relative bg-[rgb(17,17,17)] rounded-xl shadow-sm border-2 transition-all ${
                selectedTier?.id === tier.id
                  ? "border-[rgb(245,210,60)] shadow-md"
                  : "border-gray-700 hover:border-gray-600"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-[rgb(245,210,60)] text-black text-xs font-bold px-3 py-1 rounded-full">
                    MOST POPULAR
                  </span>
                </div>
              )}

              <button
                onClick={() => handleSelectTier(tier)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl font-bold text-white">
                        ${tier.usd}
                        {tier.period && (
                          <span className="text-lg font-normal">
                            {/* /{tier.period} */}
                          </span>
                        )}
                      </span>
                      {tier.popular && (
                        <Zap className="w-5 h-5 text-[rgb(245,210,60)]" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-[rgb(245,210,60)]">
                          {tier.credits.toLocaleString()} credits
                        </span>
                        <div className="group relative">
                          <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                          <div className="absolute left-0 bottom-full mb-1 hidden group-hover:block z-10 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg">
                            {tier.id === "monthly"
                              ? "• Credits expire after 30 days"
                              : "• 500 credits added each month"}
                            <br />• Points never expire
                          </div>
                        </div>
                        {tier.id === "monthly" && (
                          <span className="bg-green-900 text-green-300 text-xs px-2 py-0.5 rounded">
                            50% Cashback
                          </span>
                        )}
                        {tier.id === "yearly" && (
                          <span className="bg-purple-900 text-purple-300 text-xs px-2 py-0.5 rounded">
                            60% Cashback
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-400">
                        {tier.id === "monthly" ? "1000 Points" : "12000 Points"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        selectedTier?.id === tier.id
                          ? "border-[rgb(245,210,60)] bg-[rgb(245,210,60)]"
                          : "border-gray-600"
                      }`}
                    >
                      {selectedTier?.id === tier.id && (
                        <Check className="w-4 h-4 text-black" />
                      )}
                    </div>
                  </div>
                </div>
              </button>
            </div>
          ))}
        </div>

        {/* Payment Method */}
        {/* <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <span className="text-blue-600 font-medium">Secure Payment</span>
            </div>
          </div>
        </div> */}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-900 border border-red-700 text-red-300 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Pay Button */}
        {showPayWithButton && selectedTier && (
          <div className="mt-6">
            <button
              onClick={() => handlePayment(selectedTier)}
              disabled={!selectedTier || isLoading}
              className="w-full py-3 bg-[rgb(245,210,60)] text-black font-medium rounded-xl hover:bg-[rgb(255,220,70)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>Join</>
              )}
            </button>
          </div>
        )}

        {payParams && !showPayWithButton && (
          <RozoPayButton.Custom
            resetOnSuccess
            defaultOpen
            appId="rozoBananaMP"
            toChain={baseUSDC.chainId}
            toAddress={getAddress(DESTINATION_ADDRESS)}
            toToken={getAddress(baseUSDC.token)}
            toUnits={payParams.toUnits}
            externalId={payParams.externalId}
            metadata={payParams.metadata}
            intent={payParams.intent}
            onPaymentStarted={() => {
              console.log("Payment started");
              setIsLoading(true);
            }}
            onPaymentCompleted={() => {
              console.log("Payment completed");
              setIsLoading(false);
              setShowSuccessModal(true);
            }}
          >
            {({ show }) => (
              <div className="m-auto flex w-full flex-col gap-2">
                <button
                  className="mt-6 w-full py-3 bg-[rgb(245,210,60)] text-black font-medium rounded-xl hover:bg-[rgb(255,220,70)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  onClick={show}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      Pay{" "}
                      {selectedTier ? `$${selectedTier.usd}` : "Select a plan"}{" "}
                      with Crypto
                    </>
                  )}
                </button>
              </div>
            )}
          </RozoPayButton.Custom>
        )}

        {/* Terms */}
        <p className="text-xs text-gray-500 text-center mt-4">
          By purchasing, you agree to our terms of service
        </p>
        {/* Social Links */}
        <div className="text-center mb-4">
          <p className="text-sm text-gray-400 mt-3 text-center"></p>
          <div className="flex justify-center gap-2">
            <a
              href="https://discord.com/invite/EfWejgTbuU"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 flex items-center justify-center bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
            </a>
            <a
              href="https://x.com/ROZOai"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 flex items-center justify-center bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <BottomNavigation />

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[rgb(17,17,17)] rounded-2xl max-w-md w-full relative overflow-hidden border border-gray-800">
            {/* Close Button */}
            <button
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 z-10 w-8 h-8 bg-black/20 hover:bg-black/30 rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Video - Commented out */}
            {/* <div className="relative">
              <video
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-auto"
                onEnded={() => setShowSuccessModal(false)}
              >
                <source
                  src="https://cdn.rozo.ai/rozoog1.mp4"
                  type="video/mp4"
                />
                Your browser does not support the video tag.
              </video>
            </div> */}

            {/* Success Message */}
            <div className="p-6 text-center">
              {/* Header with party popper and Congrats */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="text-3xl">🎉</div>
                <h3 className="text-2xl font-bold text-[rgb(245,210,60)]">
                  Congrats!
                </h3>
              </div>

              {/* Body text */}
              <div className="mb-6">
                <p className="text-white text-lg mb-2">
                  You are the{" "}
                  <span className="text-[rgb(245,210,60)] font-bold">#421</span>{" "}
                  ROZO OG.
                </p>
                <p className="text-gray-400 text-sm">
                  You've unlocked Nano Banana Premium ({selectedTier?.name}) and
                  received {selectedTier?.points} ROZO Points.
                </p>
              </div>

              {/* Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => {
                    window.open(
                      "https://discord.com/invite/EfWejgTbuU",
                      "_blank"
                    );
                  }}
                  className="w-full py-3 bg-[rgb(245,210,60)] text-black font-medium rounded-lg hover:bg-[rgb(255,220,70)] transition-all flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                  Join Discord
                </button>
                <button
                  onClick={handleShare}
                  className="w-full py-3 bg-[rgb(17,17,17)] border border-gray-600 text-white font-medium rounded-lg hover:bg-gray-800 transition-all"
                >
                  Share & Earn 10%
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
