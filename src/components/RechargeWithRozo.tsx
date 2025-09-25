"use client";

import { baseUSDC } from "@rozoai/intent-common";
import { RozoPayButtonProps, useRozoPayUI } from "@rozoai/intent-pay";
import { Check, HelpCircle, Loader2, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { getAddress } from "viem";

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
    id: "monthly",
    name: "Monthly Plan",
    usd: 20,
    credits: 500,
    images: 100,
    period: "month",
    popular: true,
  },
  {
    id: "yearly",
    name: "Yearly Plan",
    usd: 200,
    credits: 6000,
    images: 1200,
    period: "year",
  },
];

// Destination address for payments
const DESTINATION_ADDRESS = getAddress(
  "0x5772FBe7a7817ef7F586215CA8b23b8dD22C8897"
);

export default function RechargeContent() {
  // Default select the $20 plan (first tier)
  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(
    PRICING_TIERS[0]
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [RozoPayModule, setRozoPayModule] = useState<any>(null);

  // Dynamically load RozoPay module on client side
  useEffect(() => {
    const loadRozoPayModule = async () => {
      try {
        const module = await import("@rozoai/intent-pay");
        setRozoPayModule(module);
      } catch (err) {
        console.warn("RozoPay module not available:", err);
      }
    };
    loadRozoPayModule();
  }, []);

  const handlePurchase = async () => {
    if (!selectedTier || !RozoPayModule) return;

    setIsLoading(true);
    setError(null);

    try {
      // Try to use selectMethod if available
      const rozoPayUI = RozoPayModule.useRozoPayUI?.();
      if (rozoPayUI?.selectMethod) {
        rozoPayUI.selectMethod({
          allowance: {
            token: baseUSDC,
            amount: selectedTier.usd * 1e6,
          },
          recipient: DESTINATION_ADDRESS,
          reference: `recharge-${selectedTier.id}-${Date.now()}`,
        });
      } else {
        setError("Payment method not available. Please try again later.");
      }
    } catch (err) {
      console.error("Purchase error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to initiate purchase"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">
          <Zap className="inline-block w-8 h-8 text-yellow-500 mr-2" />
          Recharge Your Account
        </h1>
        <p className="text-gray-600">
          Choose a plan and pay with your preferred wallet or payment method
        </p>
      </div>

      {/* Pricing Tiers */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {PRICING_TIERS.map((tier) => (
          <div
            key={tier.id}
            className={`relative rounded-2xl p-6 cursor-pointer transition-all ${
              selectedTier?.id === tier.id
                ? "ring-2 ring-yellow-500 bg-gradient-to-br from-yellow-50 to-orange-50"
                : "bg-white border border-gray-200 hover:border-yellow-300"
            }`}
            onClick={() => setSelectedTier(tier)}
          >
            {tier.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-semibold rounded-full">
                POPULAR
              </div>
            )}

            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold">{tier.name}</h3>
                <div className="text-3xl font-bold text-gray-900 mt-2">
                  ${tier.usd}
                  {tier.period && (
                    <span className="text-lg text-gray-500 font-normal">
                      /{tier.period}
                    </span>
                  )}
                </div>
              </div>
              <div
                className={`w-6 h-6 rounded-full border-2 ${
                  selectedTier?.id === tier.id
                    ? "border-yellow-500 bg-yellow-500"
                    : "border-gray-300"
                } flex items-center justify-center`}
              >
                {selectedTier?.id === tier.id && (
                  <Check className="w-4 h-4 text-white" />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center text-gray-600">
                <Check className="w-4 h-4 text-green-500 mr-2" />
                <span>{tier.credits} credits</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Check className="w-4 h-4 text-green-500 mr-2" />
                <span>~{tier.images} image generations</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Payment Button */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Payment Summary</h3>
            {selectedTier && (
              <p className="text-gray-600 mt-1">
                {selectedTier.name} - ${selectedTier.usd}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 text-gray-500">
            <HelpCircle className="w-4 h-4" />
            <span className="text-sm">Secure payment</span>
          </div>
        </div>

        {selectedTier && (
          <div>
            {isLoading ? (
              <button
                disabled
                className="w-full py-3 bg-gray-100 text-gray-500 rounded-lg flex items-center justify-center gap-2"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </button>
            ) : RozoPayModule ? (
              <RozoPayButton selectedTier={selectedTier} />
            ) : (
              <button
                onClick={handlePurchase}
                className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all"
              >
                Pay with Rozo
              </button>
            )}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Payments are processed securely via Rozo Pay</p>
        <p className="mt-2">
          Need help?{" "}
          <a href="#" className="text-yellow-600 hover:text-yellow-700">
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}

// Dynamic component for RozoPayButton
function RozoPayButton({ selectedTier }: { selectedTier: PricingTier }) {
  const [Component, setComponent] = useState<any>(null);
  const [payParams, setPayParams] = useState<RozoPayButtonProps | null>(null);
  const { resetPayment } = useRozoPayUI();

  useEffect(() => {
    const loadComponent = async () => {
      try {
        const module = await import("@rozoai/intent-pay");
        setComponent(() => module.RozoPayButton);

        const params: RozoPayButtonProps = {
          appId: "rozoBananaMP",
          toAddress: DESTINATION_ADDRESS,
          toToken: getAddress(baseUSDC.token),
          toUnits: selectedTier.usd.toString(),
          toChain: baseUSDC.chainId,
          externalId: `recharge-${selectedTier.id}-${Date.now()}`,
        };

        setPayParams(params);
        resetPayment(params);
      } catch (err) {
        console.error("Failed to load RozoPayButton:", err);
      }
    };
    loadComponent();
  }, [selectedTier]);

  if (!Component || !payParams) {
    return (
      <button className="w-full py-3 bg-gray-100 text-gray-500 rounded-lg">
        Loading payment options...
      </button>
    );
  }

  return (
    <Component
      {...payParams}
      onSuccess={(result: any) => {
        console.log("Payment successful:", result);
        window.location.href = "/";
      }}
      onError={(error: any) => {
        console.error("Payment error:", error);
      }}
    />
  );
}
