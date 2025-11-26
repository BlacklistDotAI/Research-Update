import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { setCookie, getCookie } from '../utils/cookies';

const COOKIE_CONSENT_KEY = 'cookie_consent_accepted';

export const CookieConsent = () => {
  const { t } = useTranslation();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already accepted
    const consent = getCookie(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    // Save consent for 1 year
    setCookie(COOKIE_CONSENT_KEY, 'true', {
      expires: 365,
      path: '/',
      secure: window.location.protocol === 'https:',
      sameSite: 'lax',
    });
    setShowBanner(false);
  };

  const handleDecline = () => {
    // Still save preference, but mark as declined
    setCookie(COOKIE_CONSENT_KEY, 'declined', {
      expires: 365,
      path: '/',
      secure: window.location.protocol === 'https:',
      sameSite: 'lax',
    });
    setShowBanner(false);
    // Note: In a real GDPR scenario, you might want to delete existing cookies
    // But since we're only using cookies for auth, we'll keep them for functionality
  };

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-gray-200 shadow-2xl"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              {/* Cookie Icon */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">
                  {t('pageCookieConsent.title')}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-2">
                  {t('pageCookieConsent.description')}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  {t('pageCookieConsent.learnMore')}{' '}
                  <a
                    href="/privacy"
                    className="text-blue-600 hover:text-blue-700 underline"
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = '/privacy';
                    }}
                  >
                    {t('pageCookieConsent.privacyPolicy')}
                  </a>
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                <motion.button
                  onClick={handleDecline}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors whitespace-nowrap"
                >
                  {t('pageCookieConsent.decline')}
                </motion.button>
                <motion.button
                  onClick={handleAccept}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2 text-sm font-semibold text-white bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 rounded-lg transition-all whitespace-nowrap shadow-md"
                >
                  {t('pageCookieConsent.accept')}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

