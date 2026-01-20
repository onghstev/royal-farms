'use client';

import { useReportWebVitals } from 'next/web-vitals';
import { sendGAEvent } from '@next/third-parties/google';

export default function WebVitals() {
  useReportWebVitals((metric) => {
    // Only send in production
    if (process.env.NODE_ENV === 'development') {
      console.info('Web Vitals:', metric);
      return;
    }

    // Send Web Vitals to Google Analytics
    sendGAEvent({
      event: 'web_vitals',
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_label: metric.id,
      non_interaction: true,
      metric_name: metric.name,
      metric_value: metric.value,
      metric_rating: metric.rating,
    });
  });

  return null;
}
