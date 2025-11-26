import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { getUserEmail, removeUserEmail } from '../utils/auth';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Logo } from './Logo';

interface NavbarProps {
  showAuth?: boolean;
}

export const Navbar = ({ showAuth = false }: NavbarProps) => {
  const { t } = useTranslation();
  const userEmail = getUserEmail();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isLandingPage = location.pathname === '/';

  const handleLogout = () => {
    removeUserEmail();
    window.location.href = '/login';
  };

  const handleScrollTo = (sectionId: string) => {
    if (location.pathname !== '/') {
      window.location.href = '/';
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-100 sticky top-0 z-50 overflow-x-hidden w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20 gap-2">
          <div className="flex-shrink-0 min-w-0">
            <Logo variant="header" />
          </div>

          {/* Desktop Navigation */}
          {!showAuth && (
            <div className="hidden md:flex items-center space-x-6">
              <motion.button
                onClick={() => handleScrollTo('features')}
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors relative"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                {t('nav.features')}
                <motion.span
                  className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-900"
                  whileHover={{ width: '100%' }}
                  transition={{ duration: 0.3 }}
                />
              </motion.button>
              <motion.button
                onClick={() => handleScrollTo('how-it-works')}
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors relative"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                {t('nav.howItWorks')}
                <motion.span
                  className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-900"
                  whileHover={{ width: '100%' }}
                  transition={{ duration: 0.3 }}
                />
              </motion.button>
              <motion.button
                onClick={() => handleScrollTo('about')}
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors relative"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                {t('nav.about')}
                <motion.span
                  className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-900"
                  whileHover={{ width: '100%' }}
                  transition={{ duration: 0.3 }}
                />
              </motion.button>
              <LanguageSwitcher />
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to="/scan"
                    className="px-4 py-2 text-sm font-medium text-gray-900 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm hover:shadow-md"
                  >
                    {t('nav.dashboard')}
                  </Link>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all shadow-md hover:shadow-lg"
                  >
                    {t('common.login')}
                  </Link> */}
                </motion.div>
              </div>
            </div>
          )}

          {/* Mobile Controls */}
          {(!showAuth || (showAuth && userEmail)) && (
            <div className="md:hidden flex items-center gap-2">
              {/* Language Switcher for Mobile */}
              <div className="block min-h-[44px] flex items-center">
                <LanguageSwitcher />
              </div>
              
              {/* Mobile Menu Button */}
              <motion.button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-3 text-gray-700 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Toggle menu"
                whileTap={{ scale: 0.9 }}
              >
                {mobileMenuOpen ? (
                  <motion.svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 90 }}
                    transition={{ duration: 0.3 }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </motion.svg>
                ) : (
                  <motion.svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </motion.svg>
                )}
              </motion.button>
            </div>
          )}

          {/* Auth Buttons */}
          {showAuth && userEmail ? (
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link
                to="/files"
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all hidden sm:inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {t('nav.files')}
              </Link>
              <Link
                to="/profile"
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="hidden sm:inline">{t('nav.profile')}</span>
              </Link>
              <span className="text-xs sm:text-sm text-gray-600 hidden lg:inline">{userEmail}</span>
              <button
                onClick={handleLogout}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all"
              >
                {t('common.logout')}
              </button>
            </div>
          ) : !showAuth && !isLandingPage && 
          (
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              {/* Đăng nhập */}
            </Link>
          )
          }
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden overflow-hidden border-t border-gray-200 bg-white/95 backdrop-blur-sm"
          >
            <div className="py-4 flex flex-col space-y-2 px-4">
              {!showAuth ? (
                <>
                  {[
                    { key: 'features', label: t('nav.features') },
                    { key: 'how-it-works', label: t('nav.howItWorks') },
                    { key: 'about', label: t('nav.about') },
                  ].map((item, index) => (
                    <motion.button
                      key={item.key}
                      onClick={() => handleScrollTo(item.key)}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.3 }}
                      whileHover={{ x: 5, backgroundColor: '#f9fafb' }}
                      whileTap={{ scale: 0.98 }}
                      className="text-left px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all"
                    >
                      {item.label}
                    </motion.button>
                  ))}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-col gap-2"
                  >
                    <Link
                      to="/scan"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-center px-4 py-3 text-sm font-medium text-gray-900 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all shadow-sm"
                    >
                      {t('nav.dashboard')}
                    </Link>
                    {/* <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-center px-4 py-3 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all shadow-md"
                    >
                      {t('common.login')}
                    </Link> */}
                  </motion.div>
                </>
              ) : showAuth && userEmail ? (
                <>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="px-4 py-2 border-b border-gray-200 mb-2"
                  >
                    <p className="text-xs text-gray-500 mb-1">{t('nav.loggedInAs')}</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{userEmail}</p>
                  </motion.div>
                  <Link
                    to="/scan"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all text-left"
                  >
                    {t('nav.dashboard')}
                  </Link>
                  <Link
                    to="/files"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all text-left flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {t('nav.files')}
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all text-left flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {t('nav.profile')}
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="mt-2 px-4 py-3 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all text-left"
                  >
                    {t('common.logout')}
                  </button>
                </>
              ) : null}
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
};

