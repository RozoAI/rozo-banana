'use client';

import { useState, useEffect } from 'react';
import { RozoPayButton, useRozoPayUI } from '@rozoai/intent-pay';
import { baseUSDC, PaymentCompletedEvent } from '@rozoai/intent-common';
import { getAddress, isAddress, parseUnits } from 'viem';
import { useAuth } from '@/hooks/useAuth';
import { CreditCard, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

// Payment recipient address (USDC on Base)
const RECIPIENT_ADDRESS = '0x5772FBe7a7817ef7F586215CA8b23b8dD22C8897';

interface PaymentPlan {
  id: string;
  name: string;
  price: number;
  credits: number;
  rozo: number;
  popular?: boolean;
}

const paymentPlans: PaymentPlan[] = [
  {
    id: 'monthly',
    name: 'Monthly Plan',
    price: 20,
    credits: 500,
    rozo: 1000,
    popular: true,
  },
  {
    id: 'yearly',
    name: 'Yearly Plan',
    price: 200,
    credits: 6000,
    rozo: 12000,
  },
];

// Track OG members count
let ogMembersCount = 2; // Starting from 2/100

function RozoIntentPayContent() {
  const { isAuthenticated, address } = useAuth();
  const { resetPayment } = useRozoPayUI();
  const [selectedPlan, setSelectedPlan] = useState<PaymentPlan>(paymentPlans[0]);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentOGCount, setCurrentOGCount] = useState(ogMembersCount);

  useEffect(() => {
    // Reset payment when plan changes
    if (selectedPlan) {
      resetPayment({
        toChain: baseUSDC.chainId,
        toAddress: getAddress(RECIPIENT_ADDRESS),
        toToken: getAddress(baseUSDC.token),
        toUnits: selectedPlan.price.toString(),
      });
    }
  }, [selectedPlan, resetPayment]);

  const handlePaymentSuccess = (event: PaymentCompletedEvent) => {
    setPaymentStatus('success');
    console.log('Payment successful:', event);
    
    // The webhook will handle crediting the user account
    // Show success message
    setTimeout(() => {
      setPaymentStatus('idle');
      // Refresh user balance
      window.location.reload();
    }, 3000);
  };

  // const handlePaymentError = (error: any) => {
  //   setPaymentStatus('error');
  //   setErrorMessage(error?.message || 'Payment failed');
  //   console.error('Payment error:', error);
    
  //   setTimeout(() => {
  //     setPaymentStatus('idle');
  //     setErrorMessage(null);
  //   }, 5000);
  // };

  if (!isAuthenticated) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-3" />
        <p className="text-gray-700">Please connect your wallet to make a payment</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Plan</h2>
        <p className="text-gray-600">Select a plan to get generation credits and earn ROZO rewards</p>
      </div>

      {/* Plan Selection */}
      <div className="grid md:grid-cols-2 gap-4">
        {paymentPlans.map((plan) => (
          <div
            key={plan.id}
            onClick={() => setSelectedPlan(plan)}
            className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all ${
              selectedPlan.id === plan.id
                ? 'border-yellow-500 bg-yellow-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                  50% CASHBACK • LIMITED 100
                </span>
              </div>
            )}
            {plan.id === 'yearly' && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                  77% REWARDS • LIMITED 10
                </span>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <div className="text-3xl font-bold text-gray-900 mt-2">
                  ${plan.price}
                  <span className="text-base font-normal text-gray-600">
                    /{plan.id === 'yearly' ? 'year' : 'month'}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700 text-lg font-semibold">
                    {plan.credits} credits
                  </span>
                </div>
                {plan.id === 'monthly' && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">
                      <strong className="text-yellow-600">50% cashback</strong> (1000 ROZO points)
                    </span>
                  </div>
                )}
                {plan.id === 'yearly' && (
                  <>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-gray-700">
                        <strong className="text-purple-600">77% rewards</strong> (12000 ROZO points)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-gray-700">
                        <strong>Save $40</strong> compared to monthly
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Payment Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Selected Plan:</span>
            <span className="font-bold text-lg">{selectedPlan.name}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Amount to Pay:</span>
            <span className="font-bold text-2xl text-gray-900">${selectedPlan.price} USDC</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600">You'll Receive:</span>
            <div className="text-right">
              <div className="font-semibold text-gray-900">{selectedPlan.credits} Credits</div>
              <div className="text-sm text-purple-600">+{selectedPlan.rozo} ROZO</div>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t pt-6">
          {/* Payment Method Icons */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
              <CreditCard className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Card</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
              <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="6" width="18" height="12" rx="2" />
                <path d="M3 10h18" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Bank</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
              <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
              </svg>
              <span className="text-sm font-medium text-gray-700">Crypto</span>
            </div>
          </div>

          {paymentStatus === 'idle' && (
            <div className="space-y-3">
              <RozoPayButton.Custom
                appId='rozoBananaMP'
                onPaymentCompleted={handlePaymentSuccess}
                // onError={handlePaymentError}
                toChain={baseUSDC.chainId}
                toAddress={getAddress(RECIPIENT_ADDRESS)}
                toToken={getAddress(baseUSDC.token)}
                toUnits={selectedPlan.price.toString()}
              >
                {({ show }) => (
                  <button
                    onClick={show}
                    className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold py-4 px-6 rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all"
                  >
                    Become OG
                  </button>
                )}
              </RozoPayButton.Custom>
              
              {/* Progress indicator */}
              <div className="flex items-center justify-between px-2">
                <span className="text-sm text-gray-600">
                  {currentOGCount}/100 OG members
                </span>
                <div className="flex-1 mx-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all"
                      style={{ width: `${currentOGCount}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {paymentStatus === 'processing' && (
            <div className="w-full bg-gray-100 text-gray-700 font-medium py-4 px-6 rounded-lg flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing Payment...
            </div>
          )}

          {paymentStatus === 'success' && (
            <div className="w-full bg-green-100 text-green-700 font-medium py-4 px-6 rounded-lg flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Payment Successful! Credits added to your account.
            </div>
          )}

          {paymentStatus === 'error' && (
            <div className="w-full bg-red-100 text-red-700 font-medium py-4 px-6 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5" />
                Payment Failed
              </div>
              {errorMessage && (
                <p className="text-sm text-center">{errorMessage}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">How it works:</h3>
        <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
          <li>Select your preferred plan (Monthly or Yearly)</li>
          <li>Click "Pay with ROZO Intent Pay"</li>
          <li>Approve the USDC payment in your wallet</li>
          <li>Credits are automatically added to your account</li>
          <li>Start generating amazing images with Banana!</li>
        </ol>
      </div>
    </div>
  );
}

export function RozoIntentPay() {
  return (
      <RozoIntentPayContent />
  );
}