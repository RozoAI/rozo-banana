// Utility functions for handling referral codes

export function getReferralCode(): string | null {
  // Check if we're on the client side
  if (typeof window === 'undefined') {
    return null;
  }
  
  // Try localStorage first
  const localRef = localStorage.getItem('referralCode');
  if (localRef) return localRef;
  
  // Try cookie
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'referralCode') {
      return value;
    }
  }
  
  return null;
}

export function saveReferralCode(code: string): void {
  // Check if we're on the client side
  if (typeof window === 'undefined') {
    return;
  }
  
  // Save to localStorage
  localStorage.setItem('referralCode', code);
  
  // Save to cookie (30 days)
  document.cookie = `referralCode=${code}; path=/; max-age=${60 * 60 * 24 * 30}`;
}

export function clearReferralCode(): void {
  // Check if we're on the client side
  if (typeof window === 'undefined') {
    return;
  }
  
  localStorage.removeItem('referralCode');
  document.cookie = 'referralCode=; path=/; max-age=0';
}
