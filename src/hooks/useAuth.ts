'use client';

import { useEffect, useState, useRef } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { authAPI } from '@/lib/api';

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
      const token = localStorage.getItem('rozo_token') || localStorage.getItem('auth_token');
      if (token) {
        // Validate token with Points Service
        authAPI.validateToken().then((result) => {
          if (result.valid) {
            setIsAuthenticated(true);
            globalAuthState[address] = true;
          } else {
            // Token invalid, clear it
            authAPI.logout();
            setIsAuthenticated(false);
            globalAuthState[address] = false;
          }
        });
      } else {
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
      // Create message for Points Service authentication
      const nonce = Date.now().toString();
      const message = `Sign this message to authenticate with ROZO\n\nNonce: ${nonce}\nTimestamp: ${new Date().toISOString()}`;

      // Sign message
      const signature = await signMessageAsync({
        message,
      });

      // Check for referral code in URL if not provided
      if (!referralCode) {
        const urlParams = new URLSearchParams(window.location.search);
        referralCode = urlParams.get('ref') || undefined;
      }

      // Verify with Points Service
      const { token, is_new_user, user, referral_applied } = await authAPI.verify(
        message,
        signature,
        address,
        referralCode
      );
      
      if (token) {
        setIsAuthenticated(true);
        globalAuthState[address] = true;
        setIsNewUser(is_new_user || false);
        
        // Store user data
        if (user) {
          localStorage.setItem('rozo_user', JSON.stringify(user));
        }
        
        // Store first login flag
        if (is_new_user) {
          localStorage.setItem('welcome_new_user', 'true');
          if (referral_applied) {
            localStorage.setItem('referral_bonus_applied', 'true');
          }
        } else {
          localStorage.setItem('welcome_back_user', 'true');
        }
      }
    } catch (error) {
      console.error('Sign in failed:', error);
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