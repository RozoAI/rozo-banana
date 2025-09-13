'use client';

import { useEffect, useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { SiweMessage } from 'siwe';
import { authAPI } from '@/lib/api';

export function useAuth() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isConnected || !address) {
      setIsAuthenticated(false);
      authAPI.logout();
    }
  }, [isConnected, address]);

  const signIn = async () => {
    if (!address) return;

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
      }
    } catch (error) {
      console.error('Sign in failed:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = () => {
    authAPI.logout();
    setIsAuthenticated(false);
  };

  return {
    isAuthenticated,
    isLoading,
    signIn,
    signOut,
    address,
  };
}