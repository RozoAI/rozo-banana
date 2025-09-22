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
        // Validate token with Points Service
        console.log("🔍 [useAuth] Validating token with Points Service...");
        authAPI
          .validateToken()
          .then((result) => {
            console.log("✅ [useAuth] Token validation result:", result);
            if (result.valid) {
              setIsAuthenticated(true);
              globalAuthState[address] = true;
              console.log("✅ [useAuth] Token is valid, user authenticated");
            } else {
              // Token invalid, clear it
              console.log("❌ [useAuth] Token is invalid, clearing auth");
              authAPI.logout();
              setIsAuthenticated(false);
              globalAuthState[address] = false;
            }
          })
          .catch((error) => {
            console.error("❌ [useAuth] Token validation error:", error);
            authAPI.logout();
            setIsAuthenticated(false);
            globalAuthState[address] = false;
          });
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

  const signIn = async (referralCode?: string) => {
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

      // Sign message
      const signature = await signMessageAsync({
        message,
      });

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

      const { token, is_new_user, user } = result;

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
