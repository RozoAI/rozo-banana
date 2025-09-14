'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Dynamically import to avoid SSR issues
const RozoPayment = dynamic(
  () => import('@/components/RozoPayment'),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
          <p className="text-gray-600">Loading payment system...</p>
        </div>
      </div>
    )
  }
);

export default function RechargePage() {
  return <RozoPayment />;
}