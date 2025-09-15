'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { pointsAPI } from '@/lib/api';

interface MobileDashboardProps {
  address: string;
}

export function MobileDashboard({ address }: MobileDashboardProps) {
  const { isAuthenticated, signIn, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    // Only attempt sign in once when address is available and not already authenticated
    if (address && !isAuthenticated && !isLoading) {
      signIn();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]); // Only depend on address change

  const fetchUserData = async () => {
    try {
      const balance = await pointsAPI.getBalance();
      setPoints(balance.points || 0);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}?ref=${address}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="pb-20 min-h-[calc(100vh-5rem)]">
      {/* Points Display */}
      <div className="py-8 bg-white rounded-2xl mt-6 shadow-sm border border-gray-100">
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">Balance</p>
          <p className="text-5xl font-bold text-gray-900">{points}</p>
          <p className="text-lg text-gray-600 mt-1">pts</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-6">
        {activeTab === 'home' && (
          <div className="space-y-4">
            {/* Referral Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-lg mb-4 text-gray-900">Share & Earn</h3>
              <button
                onClick={copyReferralLink}
                className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold text-base hover:from-yellow-600 hover:to-orange-600 transition-all transform active:scale-[0.98]"
              >
                {copied ? '✓ Copied!' : 'Copy Referral Link'}
              </button>
              <p className="text-sm text-gray-500 mt-3 text-center">
                Earn 20% from direct referrals
              </p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => window.location.href = '/generate'}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-left hover:shadow-md transition-shadow"
              >
                <div className="text-3xl mb-2">🎨</div>
                <p className="font-semibold text-gray-900">Generate</p>
                <p className="text-sm text-gray-500 mt-1">5 pts/image</p>
              </button>
              
              <button
                onClick={() => window.location.href = '/recharge'}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-left hover:shadow-md transition-shadow relative"
              >
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">HOT</div>
                <div className="text-3xl mb-2">💎</div>
                <p className="font-semibold text-gray-900">Top Up</p>
                <p className="text-sm text-gray-500 mt-1">Get points</p>
              </button>
            </div>
          </div>
        )}


        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-lg mb-4 text-gray-900">Recent Activity</h3>
            <div className="flex flex-col items-center justify-center py-12">
              <span className="text-4xl mb-3">📭</span>
              <p className="text-gray-500">No activity yet</p>
              <p className="text-sm text-gray-400 mt-1">Your transactions will appear here</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100">
        <div className="max-w-lg mx-auto">
          <div className="grid grid-cols-2">
            <button
              onClick={() => setActiveTab('home')}
              className={`py-4 text-center transition-colors ${
                activeTab === 'home' ? 'text-yellow-600' : 'text-gray-400'
              }`}
            >
              <div className="text-2xl mb-1">🏠</div>
              <p className="text-xs font-medium">Home</p>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 text-center transition-colors ${
                activeTab === 'history' ? 'text-yellow-600' : 'text-gray-400'
              }`}
            >
              <div className="text-2xl mb-1">📊</div>
              <p className="text-xs font-medium">History</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}