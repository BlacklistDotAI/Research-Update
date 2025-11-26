import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface CaptchaProps {
  onVerify: (isValid: boolean) => void;
}

export const Captcha = ({ onVerify }: CaptchaProps) => {
  const { t } = useTranslation();
  const [captchaText, setCaptchaText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [attempts, setAttempts] = useState(0);

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(result);
    setUserInput('');
    setIsValid(null);
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleVerify = () => {
    const correct = userInput.toLowerCase() === captchaText.toLowerCase();
    setIsValid(correct);
    setAttempts(prev => prev + 1);
    onVerify(correct);
  };

  const handleRefresh = () => {
    generateCaptcha();
    setAttempts(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border-2 border-gray-200 p-4 sm:p-6 space-y-4 w-full"
    >
      <div className="text-center">
        <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          {t('pageCaptcha.title')}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {t('pageCaptcha.description')}
        </p>
      </div>

      <div className="space-y-4">
        {/* CAPTCHA Display */}
        <div className="flex items-center justify-center">
          <div className="relative w-full max-w-xs">
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-300 rounded-lg p-3 sm:p-4 text-center w-full">
              <div className="text-xl sm:text-2xl font-bold text-gray-800 tracking-wider select-none break-words">
                {captchaText}
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
            </div>
            <motion.button
              onClick={handleRefresh}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="absolute -right-2 -top-2 p-1.5 sm:p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
              title={t('pageCaptcha.refresh')}
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </motion.button>
          </div>
        </div>

        {/* Input Field */}
        <div className="space-y-2">
          <label htmlFor="captcha-input" className="block text-sm font-medium text-gray-700">
            {t('pageCaptcha.enterCode')}
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="captcha-input"
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                isValid === true
                  ? 'border-green-500 bg-green-50'
                  : isValid === false
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              placeholder={t('pageCaptcha.placeholder')}
              maxLength={6}
            />
            <motion.button
              onClick={handleVerify}
              disabled={userInput.length !== 6}
              whileHover={{ scale: userInput.length === 6 ? 1.02 : 1 }}
              whileTap={{ scale: userInput.length === 6 ? 0.98 : 1 }}
              className={`px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-medium rounded-lg transition-all whitespace-nowrap flex-shrink-0 ${
                userInput.length === 6
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {t('pageCaptcha.verify')}
            </motion.button>
          </div>
        </div>

        {/* Status Messages */}
        {isValid === true && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg p-3"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">{t('pageCaptcha.success')}</span>
          </motion.div>
        )}

        {isValid === false && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg p-3"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">
              {t('pageCaptcha.error')} ({attempts}/3)
            </span>
          </motion.div>
        )}

        {attempts >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <p className="text-sm text-gray-600 mb-2">{t('pageCaptcha.tooManyAttempts')}</p>
            <motion.button
              onClick={handleRefresh}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              {t('pageCaptcha.tryAgain')}
            </motion.button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
