import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { setUserEmail } from '../utils/auth';
import { saveProfile, getProfile, updateProfile } from '../utils/storage';
import { Navbar } from '../components/Navbar';
import { SEO } from '../components/SEO';
import { trackEvent } from '../components/GoogleAnalytics';

export const Login = () => {
  const { t } = useTranslation();
  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Track login/register attempt
    trackEvent('click', 'button', isRegister ? 'register' : 'login', 1);

    if (!email || !email.includes('@')) {
        setError(t('pageLogin.error'));
      return;
    }

    if (isRegister) {
      // Register validation
      if (!fullName || fullName.trim().length < 2) {
        setError(t('register.fullNameError'));
        return;
      }
      if (!password || password.length < 6) {
        setError(t('register.passwordError'));
        return;
      }
      if (password !== confirmPassword) {
        setError(t('register.passwordMatchError'));
        return;
      }
    }

    // For now, just save email (password would be handled by backend)
    setUserEmail(email);
    
    // If registering, save profile
    if (isRegister && fullName) {
      saveProfile({
        fullName: fullName.trim(),
        email: email.trim(),
      });
      trackEvent('complete', 'user', 'register_success', 1);
    } else if (!isRegister) {
      // If logging in, try to load profile but don't override if exists
      const existingProfile = getProfile();
      if (!existingProfile) {
        updateProfile({ email: email.trim() });
      }
      trackEvent('complete', 'user', 'login_success', 1);
    }
    
    navigate('/scan');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 overflow-x-hidden w-full">
      <SEO 
        title={`${isRegister ? t('pageRegister.title') : t('pageLogin.title')} - ${t('common.appName')}`}
        description={isRegister ? t('pageRegister.description') : t('pageLogin.description')}
      />
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full bg-white rounded-xl shadow-xl p-6 sm:p-8 mx-4"
        >
          {/* Toggle Tabs */}
          <div className="flex gap-2 mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => {
                setIsRegister(false);
                setError('');
                setFullName('');
                setPassword('');
                setConfirmPassword('');
              }}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${
                !isRegister
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('pageLogin.title')}
            </button>
            <button
              onClick={() => {
                setIsRegister(true);
                setError('');
                setFullName('');
              }}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${
                isRegister
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('pageRegister.title')}
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={isRegister ? 'register' : '...'}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 text-center">
                {isRegister ? t('pageRegister.title') : t('pageLogin.title')}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                {isRegister && (
                  <div>
                    <label
                      htmlFor="fullName"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      {t('register.fullName')}
                    </label>
                    <motion.input
                      type="text"
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      whileFocus={{ scale: 1.02 }}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all hover:border-gray-400"
                      placeholder={t('register.fullNamePlaceholder')}
                      required={isRegister}
                    />
                  </div>
                )}
                
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    {t('login.email')}
                  </label>
                  <motion.input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    whileFocus={{ scale: 1.02 }}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all hover:border-gray-400"
                    placeholder={t('login.emailPlaceholder')}
                    required
                  />
                </div>

                {isRegister && (
                  <>
                    <div>
                      <label
                        htmlFor="password"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        {t('register.password')}
                      </label>
                      <motion.input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        whileFocus={{ scale: 1.02 }}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all hover:border-gray-400"
                        placeholder={t('register.passwordPlaceholder')}
                        required={isRegister}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="confirmPassword"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        {t('register.confirmPassword')}
                      </label>
                      <motion.input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        whileFocus={{ scale: 1.02 }}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all hover:border-gray-400"
                        placeholder={t('register.confirmPasswordPlaceholder')}
                        required={isRegister}
                      />
                    </div>
                  </>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg flex items-center gap-2"
                  >
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </motion.div>
                )}

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative w-full px-4 py-3 bg-gradient-to-r from-gray-900 to-gray-800 text-white font-semibold rounded-xl hover:from-gray-800 hover:to-gray-700 transition-all shadow-lg hover:shadow-xl overflow-hidden group"
                >
                  <span className="relative z-10">
                    {isRegister ? t('pageRegister.submit') : t('pageLogin.submit')}
                  </span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-900"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.5 }}
                  />
                </motion.button>
              </form>

              {/* Switch Link */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  {isRegister ? t('register.haveAccount') : t('login.noAccount')}{' '}
                  <button
                    onClick={() => {
                      setIsRegister(!isRegister);
                      setError('');
                      setFullName('');
                      setPassword('');
                      setConfirmPassword('');
                    }}
                    className="text-gray-900 font-semibold hover:underline transition-colors"
                  >
                    {isRegister ? t('login.title') : t('register.title')}
                  </button>
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </main>
    </div>
  );
};

