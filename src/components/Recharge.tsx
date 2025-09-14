'use client';

import React, { useState } from 'react';
import { Loader2, Zap, Check } from 'lucide-react';
import { useAccount } from 'wagmi';

interface PricingTier {
  id: string;
  usd: number;
  points: number;
  images: number;
  popular?: boolean;
}

const PRICING_TIERS: PricingTier[] = [
  {
    id: 'tier_10',
    usd: 10,
    points: 120,
    images: 24,
  },
  {
    id: 'tier_50',
    usd: 50,
    points: 800,
    images: 160,
    popular: true,
  },
  {
    id: 'tier_100',
    usd: 100,
    points: 2000,
    images: 400,
  },
];

// ROZO configuration
const ROZO_CONFIG = {
  appId: 'rozoBananaMP',
  destinationAddress: '0x5772FBe7a7817ef7F586215CA8b23b8dD22C8897',
  chain: 'base', // Base chain
  token: 'USDC',
  chainId: '8453', // Base chain ID
};

export default function Recharge() {
  const { address, isConnected } = useAccount();
  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async (tier: PricingTier) => {
    if (!isConnected || !address) {
      setError('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get auth token
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('Please authenticate first');
      }

      // Step 1: Create payment order in backend
      const orderResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/payments/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          packageId: tier.id,
          amountUsd: tier.usd,
          points: tier.points,
        }),
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create payment order');
      }

      const orderData = await orderResponse.json();
      const { paymentId } = orderData;

      // Step 2: Initialize ROZO payment
      const rozoPaymentData = {
        display: {
          intent: `Purchase ${tier.points} points for Banana`,
          currency: 'USD',
        },
        preferredChain: ROZO_CONFIG.chainId,
        preferredToken: ROZO_CONFIG.token,
        destination: {
          destinationAddress: ROZO_CONFIG.destinationAddress,
          chainId: ROZO_CONFIG.chainId,
          amountUnits: tier.usd.toString(),
        },
        metadata: {
          appId: ROZO_CONFIG.appId,
          paymentId: paymentId,
          userAddress: address,
          packageId: tier.id,
          webhookUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/payments/webhook`,
          externalId: paymentId,
        },
      };

      // Step 3: Call ROZO API
      const rozoResponse = await fetch('https://api.rozo.ai/functions/v1/payment-api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rozoPaymentData),
      });

      if (!rozoResponse.ok) {
        throw new Error('Failed to initialize payment');
      }

      const rozoData = await rozoResponse.json();
      
      // Step 4: Redirect to payment page or handle payment URL
      if (rozoData.paymentUrl) {
        window.open(rozoData.paymentUrl, '_blank');
      } else if (rozoData.paymentId) {
        // Handle payment tracking
        await trackPaymentStatus(paymentId, rozoData.paymentId);
      }

    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setIsLoading(false);
    }
  };

  const trackPaymentStatus = async (paymentId: string, rozoPaymentId: string) => {
    // Poll payment status
    const checkStatus = async () => {
      try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/status/${paymentId}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (!response.ok) return;
        
        const data = await response.json();
        if (data.status === 'success') {
          // Payment successful
          window.location.reload(); // Refresh to update points
        } else if (data.status === 'failed') {
          setError('Payment failed');
        } else {
          // Still pending, check again
          setTimeout(checkStatus, 3000);
        }
      } catch (err) {
        console.error('Status check error:', err);
      }
    };

    // Start checking
    setTimeout(checkStatus, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50">
      {/* Header */}
      <header className="sticky top-0 w-full bg-white/90 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-3xl">🍌</span>
              <span className="font-bold text-xl">Banana</span>
            </div>
            <button
              onClick={() => window.history.back()}
              className="text-gray-600 hover:text-gray-800"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Top Up Points</h1>
          <p className="text-gray-600 text-sm">1 USD = 10 points base rate</p>
        </div>

        {/* Pricing Tiers */}
        <div className="space-y-4">
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`relative bg-white rounded-xl shadow-sm border-2 transition-all ${
                selectedTier?.id === tier.id
                  ? 'border-yellow-400 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold px-3 py-1 rounded-full">
                    MOST POPULAR
                  </span>
                </div>
              )}

              <button
                onClick={() => setSelectedTier(tier)}
                className="w-full p-4 text-left"
                disabled={isLoading}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl font-bold text-gray-900">${tier.usd}</span>
                      {tier.popular && <Zap className="w-5 h-5 text-yellow-500" />}
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-yellow-600">
                          {tier.points.toLocaleString()} points
                        </span>
                        {tier.usd === 50 && (
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded">
                            +60% bonus
                          </span>
                        )}
                        {tier.usd === 100 && (
                          <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded">
                            +100% bonus
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600">
                        Generate {tier.images} images
                      </p>
                      
                      <p className="text-xs text-gray-500">
                        ${(tier.usd / tier.images).toFixed(2)} per image
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedTier?.id === tier.id
                        ? 'border-yellow-400 bg-yellow-400'
                        : 'border-gray-300'
                    }`}>
                      {selectedTier?.id === tier.id && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>
                </div>
              </button>
            </div>
          ))}
        </div>

        {/* Payment Method */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-blue-600">💳</span>
            <span className="font-medium text-blue-900">Payment Method</span>
          </div>
          <p className="text-sm text-blue-700">
            Pay with USDC on Base chain via ROZO
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Secure payment powered by ROZO AI
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Pay Button */}
        <button
          onClick={() => selectedTier && handlePayment(selectedTier)}
          disabled={!selectedTier || isLoading || !isConnected}
          className="mt-6 w-full py-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-medium rounded-xl hover:from-yellow-500 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Pay {selectedTier ? `$${selectedTier.usd}` : 'Select a package'}
            </>
          )}
        </button>

        {/* Terms */}
        <p className="text-xs text-gray-500 text-center mt-4">
          By purchasing, you agree to our terms of service
        </p>
      </div>
    </div>
  );
}