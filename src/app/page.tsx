'use client';

import { WalletButton } from '@/components/WalletButton';
import { useAccount } from 'wagmi';
import { MobileDashboard } from '@/components/MobileDashboard';

export default function Home() {
  const { address, isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50">
      <header className="sticky top-0 w-full bg-white/90 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-3xl">🍌</span>
              <span className="font-bold text-xl">Banana</span>
            </div>
            <WalletButton />
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4">
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] py-8">
            <div className="text-center space-y-8 w-full">
              <div className="space-y-6">
                <span className="text-8xl block">🍌</span>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome to Banana</h1>
                  <p className="text-lg text-gray-600">Earn points through referrals</p>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">💰</span>
                  <p className="text-base text-gray-700 text-left">Invite friends and earn <span className="font-semibold text-yellow-600">20%</span> rewards</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🎯</span>
                  <p className="text-base text-gray-700 text-left">Their invites earn you <span className="font-semibold text-yellow-600">5%</span> bonus</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🎨</span>
                  <p className="text-base text-gray-700 text-left">Generate AI images with your points</p>
                </div>
              </div>

              <div className="text-sm text-gray-500">
                Connect your wallet to get started
              </div>
            </div>
          </div>
        ) : (
          <MobileDashboard address={address!} />
        )}
      </main>
    </div>
  );
}