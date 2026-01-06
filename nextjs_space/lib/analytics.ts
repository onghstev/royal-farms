import { sendGAEvent } from '@next/third-parties/google';

// Check if analytics is enabled
export const isAnalyticsEnabled = () => {
  return (
    typeof window !== 'undefined' &&
    process.env.NODE_ENV === 'production' &&
    !!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  );
};

// Track custom events
export const trackEvent = ({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (!isAnalyticsEnabled()) {
    console.info('Analytics Event (dev):', { action, category, label, value });
    return;
  }

  sendGAEvent({
    event: action,
    category,
    label,
    value,
  });
};

// Track page views
export const trackPageView = (url: string) => {
  if (!isAnalyticsEnabled()) {
    console.info('Page View (dev):', url);
    return;
  }

  sendGAEvent({
    event: 'page_view',
    page_path: url,
  });
};

// Poultry-specific event trackers
export const analytics = {
  // Egg collection events
  recordEggCollection: (flockName: string, totalEggs: number) => {
    trackEvent({
      action: 'egg_collection_recorded',
      category: 'Production',
      label: flockName,
      value: totalEggs,
    });
  },

  // Mortality events
  recordMortality: (type: string, deaths: number) => {
    trackEvent({
      action: 'mortality_recorded',
      category: 'Production',
      label: type,
      value: deaths,
    });
  },

  // Flock management
  createFlock: (flockName: string) => {
    trackEvent({
      action: 'flock_created',
      category: 'Management',
      label: flockName,
    });
  },

  editFlock: (flockName: string) => {
    trackEvent({
      action: 'flock_edited',
      category: 'Management',
      label: flockName,
    });
  },

  deleteFlock: (flockName: string) => {
    trackEvent({
      action: 'flock_deleted',
      category: 'Management',
      label: flockName,
    });
  },

  // Batch management
  createBatch: (batchNumber: string) => {
    trackEvent({
      action: 'batch_created',
      category: 'Management',
      label: batchNumber,
    });
  },

  // Report generation
  generateReport: (reportType: string) => {
    trackEvent({
      action: 'report_generated',
      category: 'Reports',
      label: reportType,
    });
  },

  exportData: (dataType: string) => {
    trackEvent({
      action: 'data_exported',
      category: 'Reports',
      label: dataType,
    });
  },

  // User actions
  login: (role: string) => {
    trackEvent({
      action: 'user_login',
      category: 'Authentication',
      label: role,
    });
  },

  logout: () => {
    trackEvent({
      action: 'user_logout',
      category: 'Authentication',
    });
  },
};
