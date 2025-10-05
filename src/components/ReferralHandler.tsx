"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

/**
 * Global component to handle referral codes from URL params
 * Saves the 'ref' parameter to localStorage and cookies on any page
 */
export function ReferralHandler() {
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
