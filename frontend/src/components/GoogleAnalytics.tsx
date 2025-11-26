import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Google Analytics Measurement ID from environment variable
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

// Type definitions for Google Analytics
type GtagCommand = 'js' | 'config' | 'event' | 'set';
type GtagConfigParams = {
  page_path?: string;
  page_title?: string;
  [key: string]: string | number | boolean | undefined;
};
type GtagEventParams = {
  event_category?: string;
  event_label?: string;
  value?: number;
  [key: string]: string | number | boolean | undefined;
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (
      command: GtagCommand,
      targetId: string | Date,
      config?: GtagConfigParams | GtagEventParams
    ) => void;
  }
}

// Initialize Google Analytics
const initGoogleAnalytics = () => {
  if (typeof window === 'undefined') {
    return;
  }

  // Debug: Log GA_MEASUREMENT_ID (always log for debugging)
  console.log('GA_MEASUREMENT_ID:', GA_MEASUREMENT_ID || 'NOT SET');
  console.log('Is placeholder?', GA_MEASUREMENT_ID === 'VITE_GA_MEASUREMENT_ID');

  // Check if it's a placeholder or empty
  if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID === 'VITE_GA_MEASUREMENT_ID' || !GA_MEASUREMENT_ID.startsWith('G-')) {
    console.warn('Google Analytics: VITE_GA_MEASUREMENT_ID is not set correctly. Please set it to your actual GA Measurement ID (e.g., G-XXXXXXXXXX)');
    return;
  }

  // Check if already initialized
  if (typeof window.gtag === 'function') {
    if (import.meta.env.DEV) {
      console.log('Google Analytics: Already initialized');
    }
    return;
  }

  // Initialize dataLayer first (before loading script)
  window.dataLayer = window.dataLayer || [];
  
  // Define gtag function before script loads (will be replaced by GA script)
  // eslint-disable-next-line prefer-rest-params
  window.gtag = function() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };

  // Set initial config (will be queued in dataLayer)
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: window.location.pathname,
    page_title: document.title,
  });

  // Load Google Analytics script
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  script1.onload = () => {
    console.log('Google Analytics: Script loaded successfully');
    // Wait for GA to process the queued dataLayer items
    setTimeout(() => {
      if (window.dataLayer && window.dataLayer.length > 0) {
        console.log('Google Analytics: dataLayer initialized', window.dataLayer.length, 'items');
        console.log('Google Analytics: dataLayer contents', window.dataLayer);
      }
      // Verify gtag is now the real GA function (GA script replaces our custom function)
      if (typeof window.gtag === 'function') {
        console.log('Google Analytics: gtag function is ready');
        // Ensure page view is sent (dataLayer items should be processed automatically)
        // But send again to be sure
        window.gtag('config', GA_MEASUREMENT_ID, {
          page_path: window.location.pathname,
          page_title: document.title,
        });
        console.log('Google Analytics: Page view sent to GA');
      }
    }, 1000);
  };
  script1.onerror = () => {
    console.error('Google Analytics: Failed to load script from', script1.src);
  };
  document.head.appendChild(script1);

  console.log('Google Analytics: Initialized with ID', GA_MEASUREMENT_ID);
};

// Track page views on route changes
export const GoogleAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    // Initialize GA on mount
    initGoogleAnalytics();

    // Wait a bit for script to load before tracking
    const timer = setTimeout(() => {
      if (GA_MEASUREMENT_ID && typeof window.gtag === 'function') {
        window.gtag('config', GA_MEASUREMENT_ID, {
          page_path: location.pathname + location.search,
          page_title: document.title,
        });
        console.log('Google Analytics: Page view tracked', location.pathname);
      } else if (GA_MEASUREMENT_ID) {
        console.warn('Google Analytics: gtag not available yet, retrying...');
        // Retry after script loads
        const checkGtag = setInterval(() => {
          if (typeof window.gtag === 'function') {
            window.gtag('config', GA_MEASUREMENT_ID, {
              page_path: location.pathname + location.search,
              page_title: document.title,
            });
            clearInterval(checkGtag);
            console.log('Google Analytics: Page view tracked (retry)', location.pathname);
          }
        }, 100);
        // Stop retrying after 5 seconds
        setTimeout(() => clearInterval(checkGtag), 5000);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [location]);

  return null;
};

// Helper function to track custom events
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (GA_MEASUREMENT_ID && typeof window.gtag === 'function') {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

