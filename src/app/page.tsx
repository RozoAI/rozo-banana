"use client";

import { HeaderLogo } from "@/components/HeaderLogo";
import { useIsMobile } from "@/hooks/useIsMobile";
import { userAPI } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";
import { injected, useConnect } from "wagmi";

export default function LandingPage() {
  const [userCount, setUserCount] = useState(0);
  const isMobile = useIsMobile();
  const { connect } = useConnect();

  const fetchUserCount = async () => {
    try {
      const countData = await userAPI.getCount();
      setUserCount(countData.count);
    } catch (error) {
      console.error("Failed to fetch user count:", error);
      setUserCount(0);
    }
  };

  useEffect(() => {
    fetchUserCount();
  }, []);

  useEffect(() => {
    if (isMobile) {
      connect({ connector: injected() });
    }
  }, [isMobile]);

  return (
    <div className="min-h-screen text-white font-sans lg:h-screen flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 lg:px-12 lg:py-6 lg:flex-shrink-0">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center lg:justify-between">
            {/* Logo */}
            <HeaderLogo />

            {/* Action Buttons */}
            {/* <div className="flex items-center gap-4">
              <WalletConnectButton />
            </div> */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 lg:px-12 flex-1 flex lg:items-center">
        <div className="max-w-7xl mx-auto lg:w-full flex flex-col justify-center">
          <div className="lg:flex lg:items-center lg:gap-16 lg:w-full">
            {/* Left Content */}
            <div className="hidden lg:flex lg:flex-col lg:flex-1">
              <h2 className="text-4xl lg:text-6xl font-bold mb-6">
                Buy AI with{" "}
                <span className="text-[rgb(245,210,60)]">stablecoins.</span>
              </h2>
              <h3 className="text-3xl lg:text-5xl font-bold mb-6">
                Get <span className="underline">rewards</span> that rock.
              </h3>
              <p className="text-lg lg:text-xl mb-8 max-w-2xl text-gray-300">
                ROZO Banana is a marketplace powered by Nano Banana. It
                demostrates Agentic Commerce payments with stablecoins. Enjoy
                instant access to top AI tools, and earn 10% referral rewards on
                every friend you bring.
              </p>

              {/* Mobile Payment Widget */}
              <div className="lg:hidden mb-8">
                <div className="bg-gray-800 rounded-2xl p-6">
                  <h5 className="text-white font-semibold text-lg mb-4">
                    Join ROZO OG
                  </h5>
                  <p className="text-gray-300 mb-6">
                    Become part of the first 1000 ROZO Pioneer OGs. Pay $20 to
                    unlock Nano Banana premium features and get 1,000 ROZO
                    Points.
                  </p>

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span>{userCount} joined</span>
                      <span>{1000 - userCount} left</span>
                    </div>
                    <div className="w-full bg-gray-700 h-4 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[rgb(245,210,60)]"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round(
                              ((userCount || 0) / (1000 - userCount)) * 100
                            )
                          )}%`,
                          transition: "width 0.5s",
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Link href="/topup">
                    <button className="w-full bg-[rgb(245,210,60)] hover:bg-[rgb(235,200,50)] text-black font-bold py-3 rounded-lg text-lg transition-colors mb-3">
                      Join Now
                    </button>
                  </Link>
                </div>
              </div>

              {/* Features */}
              <p className="text-sm text-gray-400">
                Any stablecoin with Visa-beating rewards
              </p>
            </div>

            {/* Desktop Progress Bar */}
            <div className="hidden lg:block lg:flex-shrink-0 lg:w-96 mt-12 lg:mt-0">
              <div className="bg-gray-800 rounded-2xl p-6">
                <h5 className="text-white font-semibold text-lg mb-4">
                  Join ROZO OG
                </h5>
                <p className="text-gray-300 mb-6">
                  Become the first 1000 ROZO OGs. Pay $20 to unlock Nano Banana
                  premium features and get 1,000 ROZO Points.
                </p>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span>{userCount} joined</span>
                    <span>{1000 - userCount} left</span>
                  </div>
                  <div className="w-full bg-gray-700 h-4 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[rgb(245,210,60)]"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(
                            ((userCount || 0) / (1000 - userCount)) * 100
                          )
                        )}%`,
                        transition: "width 0.5s",
                      }}
                    ></div>
                  </div>
                </div>

                {/* CTA Button */}
                <Link href="/topup">
                  <button className="w-full bg-[rgb(245,210,60)] hover:bg-[rgb(235,200,50)] text-black font-bold py-3 rounded-lg text-lg transition-colors mb-3">
                    Join Now
                  </button>
                </Link>
              </div>
            </div>

            {/* Mobile Progress Bar */}
            <div className="flex flex-col lg:hidden">
              <h5 className="text-white font-bold text-2xl mb-4 text-center">
                Join ROZO OG
              </h5>
              <p className="text-gray-300 mb-6 text-center">
                Become the first 1000 ROZO OGs. Pay $20 to unlock Nano Banana
                premium features and get 1,000 ROZO Points.
              </p>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span>{userCount} joined</span>
                  <span>{1000 - userCount} left</span>
                </div>
                <div className="w-full bg-gray-700 h-4 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[rgb(245,210,60)]"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          ((userCount || 0) / (1000 - userCount)) * 100
                        )
                      )}%`,
                      transition: "width 0.5s",
                    }}
                  ></div>
                </div>
              </div>

              {/* CTA Button */}
              <Link href="/topup">
                <button className="w-full bg-[rgb(245,210,60)] hover:bg-[rgb(235,200,50)] text-black font-bold py-3 rounded-lg text-lg transition-colors mb-3">
                  Join Now
                </button>
              </Link>

              <div className="mt-14">
                <h1 className="text-2xl font-bold mb-4 text-center">
                  What is ROZO Banana?
                </h1>

                <p className="text-base mb-8 max-w-2xl text-gray-300 text-center">
                  ROZO Banana is a marketplace powered by Nano Banana. It
                  demostrates Agentic Commerce payments with stablecoins. Enjoy
                  instant access to top AI tools, and earn 10% referral rewards
                  on every friend you bring.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-8 px-6 lg:flex-shrink-0 mt-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm text-gray-500">© 2025 ROZO Banana</p>
        </div>
      </div>
    </div>
  );
}
