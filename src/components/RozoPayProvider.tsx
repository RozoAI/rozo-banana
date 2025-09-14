'use client';

import { RozoPayProvider as RozoProvider } from '@rozoai/intent-pay';
import React from 'react';

export default function RozoPayProvider({ children }: { children: React.ReactNode }) {
  return (
    <RozoProvider
      config={{
        appId: 'rozoBananaMP',
        theme: {
          primaryColor: '#FFC107',
          borderRadius: 12,
        },
      }}
    >
      {children}
    </RozoProvider>
  );
}