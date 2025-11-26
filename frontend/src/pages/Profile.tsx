import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Navbar } from '../components/Navbar';
import { SEO } from '../components/SEO';
import { getUserEmail, isAuthenticated, removeUserEmail } from '../utils/auth';
import { getProfile, saveProfile, getSavedFiles, UserProfile } from '../utils/storage';
import { trackEvent } from '../components/GoogleAnalytics';

export const Profile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    // Load profile or use defaults
    const profile = getProfile();
    const userEmail = getUserEmail();
    
    if (profile) {
      setFullName(profile.fullName || '');
      setEmail(profile.email || userEmail || '');
    } else if (userEmail) {
      setEmail(userEmail);
    }
  }, [navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage('');

    // Track profile save
    trackEvent('click', 'button', 'profile_save', 1);

    // Validate
    if (!fullName.trim() || fullName.trim().length < 2) {
      alert(t('pageProfile.fullNameError'));
      setIsSaving(false);
      return;
    }

    if (!email || !email.includes('@')) {
      alert(t('pageProfile.emailError'));
      setIsSaving(false);
      return;
    }

    // Save profile
    const profile: UserProfile = {
      fullName: fullName.trim(),
      email: email.trim(),
    };
    saveProfile(profile);

    setIsSaving(false);
    setSuccessMessage(t('pageProfile.saveSuccess'));
    trackEvent('complete', 'profile', 'profile_saved', 1);

    // Clear success message after 3 seconds
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleExportData = () => {
    trackEvent('click', 'button', 'export_data', 1);
    const profile = getProfile();
    const files = getSavedFiles();
    const userEmail = getUserEmail();

    const exportData = {
      exportedAt: new Date().toISOString(),
      profile: profile || null,
      email: userEmail || null,
      files: files || [],
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `blacklist-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setSuccessMessage(t('pageProfile.exportSuccess'));
    trackEvent('complete', 'profile', 'data_exported', 1);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleDeleteAllData = () => {
    trackEvent('click', 'button', 'delete_all_data', 1);
    // Delete from localStorage
    localStorage.removeItem('nghelabiet_user_files');
    localStorage.removeItem('nghelabiet_user_profile');
    localStorage.removeItem('chongluadao_user_email');

    // Delete from cookies
    removeUserEmail();

    // Show success message
    setSuccessMessage(t('pageProfile.deleteSuccess'));
    setShowDeleteConfirm(false);
    setTimeout(() => {
      setSuccessMessage('');
      navigate('/login');
    }, 2000);
  };

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 overflow-x-hidden w-full">
      <SEO title={`${t('pageProfile.title')} - ${t('common.appName')}`} />
      <Navbar showAuth={true} />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6 sm:space-y-8"
        >
          {/* Header */}
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
              {t('pageProfile.title')}
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              {t('pageProfile.description')}
            </p>
          </div>

          {/* Profile Form */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg border-2 border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-300 p-6 sm:p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t('pageProfile.fullName')}
                </label>
                <motion.input
                  type="text"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  whileFocus={{ scale: 1.02 }}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all hover:border-gray-400"
                  placeholder={t('pageProfile.fullNamePlaceholder')}
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t('pageProfile.email')}
                </label>
                <motion.input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  whileFocus={{ scale: 1.02 }}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all hover:border-gray-400"
                  placeholder={t('pageProfile.emailPlaceholder')}
                  required
                />
              </div>

              {/* Success Message */}
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-green-600 bg-green-50 border border-green-200 p-3 rounded-lg flex items-center gap-2"
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {successMessage}
                </motion.div>
              )}

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isSaving}
                whileHover={{ scale: isSaving ? 1 : 1.02 }}
                whileTap={{ scale: isSaving ? 1 : 0.98 }}
                className="relative w-full px-6 py-3 bg-gradient-to-r from-gray-900 to-gray-800 text-white font-semibold rounded-xl hover:from-gray-800 hover:to-gray-700 transition-all shadow-lg hover:shadow-xl overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <motion.svg
                      className="w-5 h-5"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </motion.svg>
                    {t('pageProfile.saving')}
                  </span>
                ) : (
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {t('pageProfile.save')}
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-900"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.5 }}
                />
              </motion.button>
            </form>
          </motion.section>

          {/* Data Management Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg border-2 border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-300 p-6 sm:p-8"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              {t('pageProfile.dataManagement.title')}
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              {t('pageProfile.dataManagement.description')}
            </p>

            <div className="space-y-4">
              {/* Export Data */}
              <div className="border-2 border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{t('pageProfile.dataManagement.export.title')}</h3>
                    <p className="text-xs text-gray-600">{t('pageProfile.dataManagement.export.description')}</p>
                  </div>
                </div>
                <motion.button
                  onClick={handleExportData}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {t('pageProfile.dataManagement.export.button')}
                </motion.button>
              </div>

              {/* Delete All Data */}
              <div className="border-2 border-red-200 bg-red-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-red-900 mb-1">{t('pageProfile.dataManagement.delete.title')}</h3>
                    <p className="text-xs text-red-700">{t('pageProfile.dataManagement.delete.description')}</p>
                  </div>
                </div>
                {!showDeleteConfirm ? (
                  <motion.button
                    onClick={() => setShowDeleteConfirm(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {t('pageProfile.dataManagement.delete.button')}
                  </motion.button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-red-800 font-medium">{t('pageProfile.dataManagement.delete.confirm')}</p>
                    <div className="flex gap-2">
                      <motion.button
                        onClick={handleDeleteAllData}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        {t('pageProfile.dataManagement.delete.confirmYes')}
                      </motion.button>
                      <motion.button
                        onClick={() => setShowDeleteConfirm(false)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                      >
                        {t('pageProfile.dataManagement.delete.confirmNo')}
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.section>
        </motion.div>
      </main>
    </div>
  );
};

