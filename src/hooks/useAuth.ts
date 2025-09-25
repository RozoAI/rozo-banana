"use client";

import { authAPI } from "@/lib/api";
import { useEffect, useRef, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";

// Global state to prevent multiple sign-in attempts
let globalSignInInProgress = false;
let globalAuthState: { [address: string]: boolean } = {};

export function useAuth() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const hasInitialized = useRef(false);

  // Check for existing auth token on mount and when address changes
  useEffect(() => {
    if (address && !hasInitialized.current) {
      const token =
        localStorage.getItem("rozo_token") ||
        localStorage.getItem("auth_token");
      console.log("🔐 [useAuth] Checking existing token on mount:", {
        address,
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 20)}...` : null,
        tokenSource: localStorage.getItem("rozo_token")
          ? "rozo_token"
          : localStorage.getItem("auth_token")
          ? "auth_token"
          : "none",
      });

      if (token) {
        // If token exists, assume authenticated
        // If token is invalid, API calls will fail and trigger logout
        console.log("✅ [useAuth] Token found, user authenticated");
        setIsAuthenticated(true);
        globalAuthState[address] = true;
      } else {
        console.log("⚠️ [useAuth] No existing token found");
        globalAuthState[address] = false;
      }
      hasInitialized.current = true;
    }
  }, [address]);

  // Handle disconnection
  useEffect(() => {
    if (!isConnected || !address) {
      setIsAuthenticated(false);
      hasInitialized.current = false;
      if (address) {
        delete globalAuthState[address];
      }
      authAPI.logout();
    }
  }, [isConnected, address]);

  const signIn = async (referralCode?: string, requireSignature: boolean = false) => {
    if (!address || isAuthenticated || isLoading || globalSignInInProgress) {
      return;
    }

    // Check global state first
    if (globalAuthState[address]) {
      setIsAuthenticated(true);
      return;
    }

    globalSignInInProgress = true;
    setIsLoading(true);

    try {
      // Create message for Supabase authentication (matching backend format)
      const nonce = Date.now().toString();
      const message = `Welcome to ROZO Points!\n\nPlease sign this message to verify your wallet.\n\nNonce: ${nonce}`;

      let signature = "";
      let token = "";
      let is_new_user = false;
      let user = null;

      // Check if we already have a valid token and don't require a new signature
      if (!requireSignature) {
        const existingToken = localStorage.getItem("rozo_token") || localStorage.getItem("auth_token");
        const existingUser = localStorage.getItem("rozo_user");

        if (existingToken && existingUser) {
          // We have a token and user data, consider authenticated
          console.log("🎟️ [useAuth] Found existing token, skipping signature");
          setIsAuthenticated(true);
          globalAuthState[address] = true;
          globalSignInInProgress = false;
          setIsLoading(false);
          return true;
        }
      }

      const itemSigned = localStorage.getItem("rozo_signed_addresses");
      if (itemSigned && !requireSignature) {
        try {
          const signedAddresses = JSON.parse(itemSigned);
          // Check if the signed address matches current address (case insensitive)
          if (signedAddresses.address?.toLowerCase() === address?.toLowerCase()) {
            signature = signedAddresses.signature;
            token =
              localStorage.getItem("rozo_token") ||
              localStorage.getItem("auth_token") ||
              "";
            is_new_user = localStorage.getItem("is_new_user") === "true" || false;
            user = localStorage.getItem("rozo_user");
          }
        } catch (e) {
          console.log("⚠️ [useAuth] Failed to parse signed addresses", e);
        }
      } else {
        // Sign message
        signature = await signMessageAsync({
          message,
        });
        localStorage.setItem(
          "rozo_signed_addresses",
          JSON.stringify({
            address,
            signature,
          })
        );

        // Check for referral code in URL if not provided
        if (!referralCode) {
          const urlParams = new URLSearchParams(window.location.search);
          referralCode = urlParams.get("ref") || undefined;
        }

        // Verify with Supabase auth-wallet-verify endpoint
        console.log("🔑 [useAuth] Calling authAPI.verify with:", {
          address,
          hasSignature: !!signature,
          messageLength: message.length,
          referralCode,
        });

        const result = await authAPI.verify(
          message,
          signature,
          address,
          referralCode
        );

        const {
          token: tokenResult,
          is_new_user: is_new_userResult,
          user: userResult,
        } = result;
        token =
          tokenResult ||
          localStorage.getItem("rozo_token") ||
          localStorage.getItem("auth_token");
        is_new_user = is_new_userResult || false;
        user = userResult || localStorage.getItem("rozo_user");
      }

      console.log("🎫 [useAuth] Auth verification response:", {
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 30)}...` : null,
        is_new_user,
        hasUser: !!user,
      });

      if (token) {
        console.log("✅ [useAuth] Token received, setting authenticated state");
        setIsAuthenticated(true);
        globalAuthState[address] = true;
        setIsNewUser(is_new_user || false);
        globalSignInInProgress = false;
        setIsLoading(false);
        return true;

        // Store user data
        if (user) {
          localStorage.setItem("rozo_user", JSON.stringify(user));
          console.log("💾 [useAuth] User data stored in localStorage");
        }

        // Store first login flag
        if (is_new_user) {
          localStorage.setItem("welcome_new_user", "true");
          // if (referral_applied) {
          //   localStorage.setItem('referral_bonus_applied', 'true');
          // }
        } else {
          localStorage.setItem("welcome_back_user", "true");
        }
      }
    } catch (error) {
      console.error("Sign in failed:", error);
      setIsAuthenticated(false);
      globalAuthState[address] = false;
    } finally {
      setIsLoading(false);
      globalSignInInProgress = false;
    }
  };

  const signOut = () => {
    authAPI.logout();
    setIsAuthenticated(false);
    if (address) {
      globalAuthState[address] = false;
      localStorage.removeItem("rozo_signed_addresses");
    }
  };

  return {
    isAuthenticated,
    isLoading,
    isNewUser,
    signIn,
    signOut,
    address,
  };
}
