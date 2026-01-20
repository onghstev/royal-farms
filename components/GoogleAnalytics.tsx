'use client';

import { GoogleAnalytics as NextGoogleAnalytics } from '@next/third-parties/google';
import { useEffect } from 'react';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';

export default function GoogleAnalytics() {
  // Don't load GA in development
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    if (isDevelopment) {
      console.info('Google Analytics disabled in development mode');
    }
  }, [isDevelopment]);

  if (!GA_MEASUREMENT_ID || isDevelopment) {
    return null;
  }

  return <NextGoogleAnalytics gaId={GA_MEASUREMENT_ID} />;
}

// Re-export analytics utilities for convenience
export { sendGAEvent } from '@next/third-parties/google';
