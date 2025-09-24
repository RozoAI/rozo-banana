"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const RechargeContent = dynamic(
  () => import("@/components/RechargeWithRozo"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment options...</p>
        </div>
      </div>
    ),
  }
);

export default function RechargePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RechargeContent />
    </Suspense>
  );
}