'use client';

import { useEffect, useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { SiweMessage } from 'siwe';
import { supabaseAuthAPI } from '@/lib/supabaseApi';
import { supabase } from '@/lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';

export function useSupabaseAuth() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session);
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const signInWithWallet = async (inviteCode?: string) => {
    if (!address) throw new Error('No wallet connected');

    try {
      setLoading(true);
      
      // Create SIWE message
      const domain = window.location.host;
      const origin = window.location.origin;
      const nonce = Math.random().toString(36).substring(2, 15);
      
      const message = new SiweMessage({
        domain,
        address,
        statement: 'Sign in to Banana with your wallet',
        uri: origin,
        version: '1',
        chainId: 1,
        nonce,
      });

      const messageToSign = message.prepareMessage();
      
      // Sign message
      const signature = await signMessageAsync({
        message: messageToSign,
      });

      // Authenticate with backend
      const result = await supabaseAuthAPI.signInWithWallet(
        address,
        messageToSign,
        signature,
        inviteCode
      );

      setSession(result.session);
      setUser(result.user);
      setIsAuthenticated(true);
      
      return result;
    } catch (error) {
      console.error('Wallet sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const result = await supabaseAuthAPI.signIn(email, password);
      setSession(result.session);
      setUser(result.user);
      setIsAuthenticated(true);
      return result;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, walletAddress?: string) => {
    try {
      setLoading(true);
      const result = await supabaseAuthAPI.signUp(email, password, walletAddress || address);
      if (result.session) {
        setSession(result.session);
        setUser(result.user);
        setIsAuthenticated(true);
      }
      return result;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabaseAuthAPI.signOut();
      setSession(null);
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithProvider = async (provider: 'google' | 'github' | 'discord') => {
    try {
      setLoading(true);
      await supabaseAuthAPI.signInWithProvider(provider);
    } catch (error) {
      console.error('Provider sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    session,
    loading,
    isAuthenticated,
    isConnected,
    address,
    signIn,
    signUp,
    signOut,
    signInWithWallet,
    signInWithProvider,
    checkAuth,
  };
}