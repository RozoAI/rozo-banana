"use client";

import { getReferralCode } from "@/lib/referral";

interface ShareButtonProps {
  imageUrl?: string;
  prompt?: string;
  referralCode?: string;
  shareId?: string; // For sharing the share page instead of direct image
  className?: string;
  children?: React.ReactNode;
}

export function ShareButton({
  imageUrl,
  prompt,
  referralCode,
  shareId,
  className = "",
  children,
}: ShareButtonProps) {
  const generateShareData = () => {
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

    let shareUrl = "";
    // Use share page URL if available, otherwise use image URL
    if (imageUrl) {
      // Convert full Supabase URL to just the filename if needed
      let imageFilename = imageUrl;
      try {
        if (imageUrl) {
          const parts = imageUrl.split("/");
          imageFilename = parts.pop() || "";
        }
      } catch {}
      shareUrl = `${window.location.origin}/share/${encodeURIComponent(
        imageFilename
      )}?ref=${encodeURIComponent(userReferralCode)}`;
    } else if (shareId) {
      shareUrl = `${
        window.location.origin
      }/share/${shareId}?ref=${encodeURIComponent(userReferralCode)}`;
    }

    // Add hashtags and via after the URL
    const textWithHashtags = `${text} ${shareUrl} #AI #ROZO #Banana via @ROZOai`;

    return {
      title: "Check out this AI-generated design!",
      text: textWithHashtags,
    };
  };

  const generateTwitterUrl = () => {
    const baseUrl = "https://twitter.com/intent/tweet";
    const params = new URLSearchParams();
    const shareData = generateShareData();

    params.set("text", shareData.text);
    // if (shareData.url) {
    //   params.set("url", shareData.url);
    // }

    // Add hashtags
    params.set("hashtags", "AI,ROZO,Banana");

    // Add via
    params.set("via", "ROZOai");

    return `${baseUrl}?${params.toString()}`;
  };

  const handleShare = async () => {
    const shareData = generateShareData();

    // Check if navigator.share is available
    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare(shareData)
    ) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        // User cancelled or error occurred, fallback to Twitter
        if (error instanceof Error && error.name !== "AbortError") {
          const twitterUrl = generateTwitterUrl();
          window.open(twitterUrl, "_blank", "width=550,height=420");
        }
      }
    } else {
      // Fallback to Twitter share for browsers that don't support navigator.share
      const twitterUrl = generateTwitterUrl();
      window.open(twitterUrl, "_blank", "width=550,height=420");
    }
  };

  return (
    <button
      onClick={handleShare}
      className={`inline-flex items-center gap-2 px-3 py-1.5 justify-center text-base bg-[rgb(245,210,60)] text-black font-medium rounded-lg hover:bg-[rgb(245,210,20)] transition-colors cursor-pointer ${className}`}
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
      </svg>
      {children || "Share"}
    </button>
  );
}
