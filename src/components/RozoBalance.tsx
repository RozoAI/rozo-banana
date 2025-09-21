'use client';

import { useState, useEffect } from 'react';
import { rozoAPI, creditsAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Coins, Zap, TrendingUp, RefreshCw } from 'lucide-react';

interface BalanceData {
  rozo: {
    balance: number;
    totalEarned: number;
    totalSpent: number;
  };
  credits: {
    available: number;
    expiresAt: string | null;
    planType: string | null;
  };
}

export function RozoBalance() {
  const { isAuthenticated } = useAuth();
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Parallel fetch from both services
      const [rozoData, creditsData] = await Promise.all([
        rozoAPI.getBalance(),
        creditsAPI.getBalance()
      ]);
      
      setBalance({
        rozo: {
          balance: rozoData.balance || 0,
          totalEarned: rozoData.total_earned || 0,
          totalSpent: rozoData.total_spent || 0,
        },
        credits: {
          available: creditsData.credits?.available || 0,
          expiresAt: creditsData.credits?.expires_at || null,
          planType: creditsData.credits?.plan_type || null,
        }
      });
    } catch (err) {
      console.error('Failed to fetch balance:', err);
      setError('Failed to load balance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [isAuthenticated]);

  if (!isAuthenticated || !balance) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
      {/* ROZO Balance Card */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-4 text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5" />
            <span className="text-sm font-medium opacity-90">ROZO Balance</span>
          </div>
          <button
            onClick={fetchBalance}
            disabled={loading}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        <div className="text-3xl font-bold mb-3">
          {balance.rozo.balance.toLocaleString()} ROZO
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-white/10 rounded p-2">
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp className="w-3 h-3" />
              <span className="opacity-75">Earned</span>
            </div>
            <div className="font-semibold">+{balance.rozo.totalEarned.toLocaleString()}</div>
          </div>
          <div className="bg-white/10 rounded p-2">
            <div className="flex items-center gap-1 mb-1">
              <Zap className="w-3 h-3" />
              <span className="opacity-75">Spent</span>
            </div>
            <div className="font-semibold">-{balance.rozo.totalSpent.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Credits Balance Card */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-4 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-5 h-5" />
          <span className="text-sm font-medium opacity-90">Generation Credits</span>
        </div>
        
        <div className="text-2xl font-bold mb-2">
          {balance.credits.available} Credits
        </div>
        
        {balance.credits.planType && (
          <div className="flex items-center justify-between text-sm">
            <span className="opacity-75">
              {balance.credits.planType === 'monthly' ? 'Monthly Plan' : 'Yearly Plan'}
            </span>
            {balance.credits.expiresAt && (
              <span className="opacity-75">
                Expires: {new Date(balance.credits.expiresAt).toLocaleDateString()}
              </span>
            )}
          </div>
        )}
        
        {!balance.credits.planType && (
          <div className="text-sm opacity-75">
            No active plan
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}
    </div>
  );
}