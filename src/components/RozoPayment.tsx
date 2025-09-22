'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Zap, Check } from 'lucide-react';
import { useAccount } from 'wagmi';

interface PricingTier {
  id: string;
  name: string;
  usd: number;
  credits: number;
  images: number;
  popular?: boolean;
  bonus?: string;
  period?: string;
  pioneerBonus?: number;
}

const PRICING_TIERS: PricingTier[] = [
  {
    id: 'monthly',
    name: 'Monthly Membership',
    usd: 20,
    credits: 500,
    images: 100,
    period: 'month',
    popular: true,
    pioneerBonus: 1000,
  },
  {
    id: 'yearly',
    name: 'Yearly Membership',
    usd: 200,
    credits: 6000,
    images: 1200,
    period: 'year',
    bonus: 'Save 17%',
    pioneerBonus: 12000,
  },
];

export default function RozoPayment() {
  const { address, isConnected } = useAccount();
  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openRozoPayment = async () => {
    if (!selectedTier || !isConnected || !address) {
      setError('Please connect wallet and select a package');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get auth token - check both possible token names
      const authToken = localStorage.getItem('rozo_token') || localStorage.getItem('auth_token') || localStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('Please authenticate first. Connect your wallet and sign in.');
      }

      console.log("HELLO", process.env.NEXT_PUBLIC_BANANA_API_URL)
      // Create payment order
      const apiUrl = process.env.NEXT_PUBLIC_BANANA_API_URL || 'https://eslabobvkchgpokxszwv.supabase.co/functions/v1';
      const orderResponse = await fetch(`${apiUrl}/banana-payment-create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          plan_type: selectedTier.id,
          return_url: window.location.origin + '/payment/success'
        }),
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create payment order');
      }

      const orderData = await orderResponse.json();
      
      // Generate externalId using user address + timestamp as suggested
      const timestamp = Date.now();
      const externalId = `${address}_${timestamp}`;
      
      // Use backend paymentId if available, otherwise use our generated externalId
      const paymentId = orderData.paymentId || orderData.id || externalId;

      // Open ROZO payment in iframe/modal
      const paymentUrl = `https://pay.rozo.ai/embed?` + new URLSearchParams({
        appId: 'rozoBananaMP',
        amount: selectedTier.usd.toString(),
        currency: 'USD',
        intent: `${selectedTier.name} - ${selectedTier.images} images`,
        destinationAddress: '0x5772FBe7a7817ef7F586215CA8b23b8dD22C8897',
        destinationChainId: '8453',
        destinationToken: 'USDC',
        externalId: externalId,
        userAddress: address,
        webhookUrl: `${apiUrl}/banana-payment-webhook`,
      }).toString();

      // Create modal overlay
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      `;

      // Create iframe container
      const container = document.createElement('div');
      container.style.cssText = `
        background: white;
        border-radius: 16px;
        width: 90%;
        max-width: 500px;
        height: 80vh;
        max-height: 700px;
        position: relative;
        overflow: hidden;
      `;

      // Create close button
      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '×';
      closeBtn.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: none;
        background: rgba(0,0,0,0.1);
        font-size: 24px;
        cursor: pointer;
        z-index: 1;
      `;
      closeBtn.onclick = () => {
        document.body.removeChild(modal);
        setIsLoading(false);
      };

      // Create iframe
      const iframe = document.createElement('iframe');
      iframe.src = paymentUrl;
      iframe.style.cssText = `
        width: 100%;
        height: 100%;
        border: none;
      `;

      // Listen for payment completion
      window.addEventListener('message', function handleMessage(event) {
        if (event.origin !== 'https://pay.rozo.ai') return;
        
        if (event.data.type === 'payment_success') {
          console.log('Payment successful:', event.data);
          document.body.removeChild(modal);
          window.removeEventListener('message', handleMessage);
          // Refresh to update points
          setTimeout(() => window.location.reload(), 2000);
        } else if (event.data.type === 'payment_failed') {
          console.error('Payment failed:', event.data);
          document.body.removeChild(modal);
          window.removeEventListener('message', handleMessage);
          setError('Payment failed. Please try again.');
          setIsLoading(false);
        }
      });

      // Assemble and show modal
      container.appendChild(closeBtn);
      container.appendChild(iframe);
      modal.appendChild(container);
      document.body.appendChild(modal);

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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Banana Membership</h1>
          <p className="text-gray-600 text-sm">Get credits for AI image generation</p>
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
                          {tier.images} images
                        </span>
                        {tier.bonus && (
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded">
                            {tier.bonus}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600">
                        {tier.credits} credits {tier.period === 'month' ? 'per month' : 'per year'}
                      </p>
                      
                      {tier.period === 'month' && (
                        <p className="text-xs text-gray-500">
                          Credits expire monthly, auto-renew fills to 500
                        </p>
                      )}
                      {tier.period === 'year' && (
                        <p className="text-xs text-gray-500">
                          Lock in for long-term savings
                        </p>
                      )}
                      
                      {tier.pioneerBonus && (
                        <div className="mt-2 p-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                          <p className="text-xs font-semibold text-purple-700">
                            🎁 Pioneer Bonus (First 100 buyers)
                          </p>
                          <p className="text-xs text-purple-600">
                            Get +{tier.pioneerBonus.toLocaleString()} $ROZO points
                          </p>
                        </div>
                      )}
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

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Pay Button */}
        <button
          onClick={openRozoPayment}
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