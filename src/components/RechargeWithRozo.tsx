'use client';

import React, { useState } from 'react';
import { Loader2, Zap, Check } from 'lucide-react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getDefaultConfig } from '@rozoai/intent-pay';
import { RozoPayProvider, useRozoPay } from '@rozoai/intent-pay';
import { baseUSDC } from '@rozoai/intent-common';
import { getAddress } from 'viem';
import { base } from 'wagmi/chains';

interface PricingTier {
  id: string;
  name: string;
  usd: number;
  credits: number;
  images: number;
  popular?: boolean;
  period?: string;
}

const PRICING_TIERS: PricingTier[] = [
  {
    id: 'monthly',
    name: 'Monthly Plan',
    usd: 20,
    credits: 500,
    images: 100,
    period: 'month',
    popular: true,
  },
  {
    id: 'yearly',
    name: 'Yearly Plan',
    usd: 200,
    credits: 6000,
    images: 1200,
    period: 'year',
  },
];

// Create wagmi config using getDefaultConfig from @rozoai/intent-pay
const wagmiConfig = getDefaultConfig({
  appName: 'Banana AI',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
  chains: [base],
});

// Create a client for React Query
const queryClient = new QueryClient();

// Destination address for payments
const DESTINATION_ADDRESS = getAddress('0x5772FBe7a7817ef7F586215CA8b23b8dD22C8897');

function RechargeContent() {
  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { pay } = useRozoPay();

  const handlePayment = async () => {
    if (!selectedTier) {
      setError('Please select a plan');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Generate unique external ID
      const timestamp = Date.now();
      const externalId = `banana_${selectedTier.id}_${timestamp}`;

      const paymentParams = {
        appId: 'rozoDemo', // Demo app ID for testing
        amount: selectedTier.usd,
        currency: 'USD' as const,
        intent: `Banana ${selectedTier.name} - ${selectedTier.credits} credits`,
        destinationAddress: DESTINATION_ADDRESS,
        destinationChainId: 8453, // Base chain ID
        destinationToken: baseUSDC.address,
        externalId: externalId,
        metadata: {
          planId: selectedTier.id,
          planName: selectedTier.name,
          credits: selectedTier.credits,
          images: selectedTier.images,
        },
      };

      console.log('Starting payment with params:', paymentParams);

      await pay(paymentParams, {
        onPaymentStarted: (data) => {
          console.log('Payment started:', data);
          alert('Payment started! Please complete the transaction in your wallet.');
        },
        onPaymentCompleted: (data) => {
          console.log('Payment completed:', data);
          alert(`Payment successful! You received ${selectedTier.credits} credits.`);
          setIsLoading(false);
          // Here you could call your backend to update user credits
          // or refresh the page to show updated balance
          setTimeout(() => window.location.reload(), 2000);
        },
        onPaymentBounced: (error) => {
          console.error('Payment bounced:', error);
          alert('Payment failed. Please try again.');
          setError('Payment failed. Please try again.');
          setIsLoading(false);
        },
      });

    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Payment failed');
      setIsLoading(false);
    }
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Plan</h1>
          <p className="text-gray-600 text-sm">Pay with crypto via RozoAI Intent Pay</p>
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
                      <span className="text-2xl font-bold text-gray-900">
                        ${tier.usd}{tier.period && <span className="text-lg font-normal">/{tier.period}</span>}
                      </span>
                      {tier.popular && <Zap className="w-5 h-5 text-yellow-500" />}
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-yellow-600">
                          {tier.credits.toLocaleString()} credits
                        </span>
                        {tier.id === 'monthly' && (
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded">
                            Popular
                          </span>
                        )}
                        {tier.id === 'yearly' && (
                          <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded">
                            Save 17%
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
            <span className="text-blue-600">🔗</span>
            <span className="font-medium text-blue-900">Payment Method</span>
          </div>
          <p className="text-sm text-blue-700">
            Pay with USDC on Base chain via RozoAI Intent Pay
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Secure crypto payments powered by RozoAI
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
          onClick={handlePayment}
          disabled={!selectedTier || isLoading}
          className="mt-6 w-full py-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-medium rounded-xl hover:from-yellow-500 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              Pay {selectedTier ? `$${selectedTier.usd}` : 'Select a plan'} with Crypto
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

export default function RechargeWithRozo() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RozoPayProvider>
          <RechargeContent />
        </RozoPayProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}