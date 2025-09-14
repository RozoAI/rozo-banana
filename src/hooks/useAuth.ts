'use client';

import { useEffect, useState, useRef } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { SiweMessage } from 'siwe';
import { authAPI } from '@/lib/api';

// Global state to prevent multiple sign-in attempts
let globalSignInInProgress = false;
let globalAuthState: { [address: string]: boolean } = {};

export function useAuth() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const hasInitialized = useRef(false);

  // Check for existing auth token on mount and when address changes
  useEffect(() => {
    if (address && !hasInitialized.current) {
      const token = localStorage.getItem('auth_token');
      if (token) {
        setIsAuthenticated(true);
        globalAuthState[address] = true;
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

  const signIn = async () => {
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
      // Get nonce from backend
      const { nonce } = await authAPI.getNonce(address);

      // Create SIWE message
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in to Banana DApp',
        uri: window.location.origin,
        version: '1',
        chainId: 1,
        nonce,
      });

      const messageToSign = message.prepareMessage();

      // Sign message
      const signature = await signMessageAsync({
        message: messageToSign,
      });

      // Verify with backend
      const { token } = await authAPI.verify(messageToSign, signature, address);
      
      if (token) {
        setIsAuthenticated(true);
        globalAuthState[address] = true;
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
    signIn,
    signOut,
    address,
  };
}