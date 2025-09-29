import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen text-white font-sans">
      {/* Header */}
      <div className="text-center pt-8 pb-12">
        <div className="flex items-center justify-center gap-2">
          <span className="text-3xl">🍌</span>
          <h1 className="text-2xl font-bold">ROZO Banana</h1>
        </div>
      </div>

      {/* Main CTA Section */}
      <div className="text-center px-6 pb-16">
        <h2 className="text-4xl font-bold mb-6">Join ROZO OG</h2>
        <p className="text-lg mb-8 max-w-md mx-auto">
          Become part of the first 1000 ROZO OGs. Pay $20 to unlock
          Nano Banana premium features and get 1,000 ROZO Points.
        </p>

        {/* Progress Bar */}
        <div className="max-w-md mx-auto mb-8">
          <div className="flex justify-between text-sm mb-2">
            <span>420 joined</span>
            <span>580 left</span>
          </div>
          <div className="w-full bg-gray-700 h-4 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-400 w-[42%]"></div>
          </div>
        </div>

        {/* CTA Button */}
        <Link href="/topup">
          <button className="bg-yellow-400 text-black font-bold py-2 px-4 rounded-lg text-lg hover:bg-yellow-300 transition-colors w-full max-w-md">
            Join Now
          </button>
        </Link>
      </div>

      {/* Info Section */}
      <div className="text-center px-6 pb-16">
        <h3 className="text-2xl font-bold mb-4">What is ROZO Banana?</h3>
        <p className="text-lg max-w-md mx-auto text-gray-300">
          ROZO Banana is your gateway to discounted AI tools — pay seamlessly
          with stablecoins and earn in ROZO Points. Simple, crypto-native, and
          rewarding.
        </p>
      </div>

      {/* Footer */}
      <div className="text-center pb-8">
        <p className="text-sm text-gray-500">
          © 2025 ROZO Banana
        </p>
      </div>
    </div>
  );
}
