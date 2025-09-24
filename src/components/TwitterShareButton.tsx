"use client";

import { getReferralCode } from "@/lib/referral";

interface TwitterShareButtonProps {
  imageUrl?: string;
  prompt?: string;
  referralCode?: string;
  shareId?: string; // For sharing the share page instead of direct image
  className?: string;
  children?: React.ReactNode;
}

export function TwitterShareButton({
  imageUrl,
  prompt,
  referralCode,
  shareId,
  className = "",
  children,
}: TwitterShareButtonProps) {
  const generateTwitterUrl = () => {
    const baseUrl = "https://twitter.com/intent/tweet";
    const params = new URLSearchParams();

    // Get referral code from provided prop, saved referral, or user address
    let userReferralCode = referralCode;

    if (!userReferralCode) {
      // Try to get saved referral code
      userReferralCode = getReferralCode() || referralCode;
    }

    if (!userReferralCode && typeof window !== "undefined") {
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

    // Random creative sharing messages
    const shareMessages = [
      "From pixels → product 🤖🎨",
      "AI just cooked up this wild design 🍌✨ Made in minutes: AI art → product shot.",
      "The future of creativity is here 🚀",
      "Just another casual AI flex 😎",
      "Imagine every idea instantly turned into packaging.",
    ];

    const text =
      shareMessages[Math.floor(Math.random() * shareMessages.length)];

    params.set("text", text);

    // Use share page URL if available, otherwise use image URL
    if (imageUrl) {
      const shareUrl = `https://b.rozo.ai/share/${encodeURIComponent(
        imageUrl
      )}?ref=${encodeURIComponent(userReferralCode)}`;
      params.set("url", shareUrl);
    } else if (shareId) {
      const shareUrl = `${
        window.location.origin
      }/share/${shareId}?ref=${encodeURIComponent(userReferralCode)}`;
      params.set("url", shareUrl);
    }

    // Add hashtags
    params.set("hashtags", "AI,ROZO,Banana");

    // Add via
    params.set("via", "ROZOai");

    return `${baseUrl}?${params.toString()}`;
  };

  const handleShare = () => {
    const twitterUrl = generateTwitterUrl();
    window.open(twitterUrl, "_blank", "width=550,height=420");
  };

  return (
    <button
      onClick={handleShare}
      className={`inline-flex items-center gap-2 px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm ${className}`}
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
      {children || "Share"}
    </button>
  );
}
