import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { BackToTop } from '../components/BackToTop';
import { FileUploader } from '../components/FileUploader';
import { ResultCard } from '../components/ResultCard';
import { Captcha } from '../components/Captcha';
import { SEO } from '../components/SEO';
import { analyzeAudio, AnalysisResult } from '../utils/api';
import { isAuthenticated } from '../utils/auth';
import { saveFile } from '../utils/storage';
import { trackEvent } from '../components/GoogleAnalytics';

export const Landing = () => {
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const isLoggedIn = isAuthenticated();

  const handleAnalyze = async (skipCaptchaCheck = false) => {
    if (!selectedFile) {
      alert(t('pageDashboard.selectFile'));
      return;
    }

    // Track file analysis attempt
    trackEvent('click', 'button', 'analyze_audio', 1);

    // Check if user needs to verify CAPTCHA
    if (!skipCaptchaCheck && !isLoggedIn && !captchaVerified) {
      setShowCaptcha(true);
      setTimeout(() => {
        const captchaSection = document.getElementById('captcha-section');
        if (captchaSection) {
          captchaSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const result = await analyzeAudio(selectedFile);
      setAnalysisResult(result);
      
      // Track successful analysis
      trackEvent('complete', 'analysis', result.flagged ? 'scam_detected' : 'safe', Math.round(result.riskScore * 100));
      
      // Save to history if logged in
      if (isLoggedIn) {
        saveFile(selectedFile, result);
      }

      // If CAPTCHA is verified but user is not logged in, reset CAPTCHA after analysis
      if (!isLoggedIn && captchaVerified) {
        setTimeout(() => {
          setCaptchaVerified(false);
        }, 5000);
      }
    } catch (error) {
      trackEvent('error', 'analysis', 'analysis_failed', 0);
      alert(t('pageDashboard.analyzeError'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCaptchaVerify = (isValid: boolean) => {
    if (isValid) {
      setCaptchaVerified(true);
      setShowCaptcha(false);
      // Auto-analyze after CAPTCHA verification
      setTimeout(() => {
        handleAnalyze(true); // Skip CAPTCHA check since we just verified
      }, 500);
    }
  };

  // Reset CAPTCHA when new file is selected
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setAnalysisResult(null);
    setCaptchaVerified(false);
    setShowCaptcha(false);
  };

  const stats = [
    { value: '98%', label: t('stats.accuracy') },
    { value: '<2s', label: t('stats.speed') },
    { value: '10K+', label: t('stats.samples') },
    { value: '24/7', label: t('stats.uptime') },
  ];

  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      ),
      title: t('features.feature1Title'),
      description: t('features.feature1Desc'),
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: t('features.feature2Title'),
      description: t('features.feature2Desc'),
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: t('features.feature3Title'),
      description: t('features.feature3Desc'),
    },
  ];

  const howItWorks = [
    {
      step: '01',
      title: t('howItWorks.step1Title'),
      description: t('howItWorks.step1Desc'),
    },
    {
      step: '02',
      title: t('howItWorks.step2Title'),
      description: t('howItWorks.step2Desc'),
    },
    {
      step: '03',
      title: t('howItWorks.step3Title'),
      description: t('howItWorks.step3Desc'),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white overflow-x-hidden w-full">
      <SEO 
        title={`${t('common.appName')} - ${t('common.tagline')}`}
        description={t('landingAbout.paragraph1')}
      />
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
          {/* Simplified background gradient */}
          <div className="absolute inset-0 opacity-10">
            <motion.div
              className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl"
              animate={{
                x: [0, 50, 0],
                y: [0, 50, 0],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
            <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
              {/* Left Column - Text Content */}
              <div className="text-center lg:text-left">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight"
                >
                  {t('hero.title')}
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-8 md:mb-10 font-light"
                >
                  {t('hero.subtitle')}
                  {t('hero.highlight') && <span className="text-white font-semibold"> {t('hero.highlight')}</span>}
                </motion.p>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      const scanSection = document.getElementById('scan');
                      if (scanSection) {
                        scanSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    className="px-6 sm:px-8 py-3 sm:py-4 bg-white text-gray-900 font-semibold rounded-xl shadow-xl text-base sm:text-lg inline-flex items-center gap-2"
                  >
                    {t('hero.ctaPrimary')}
                    <motion.svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </motion.svg>
                  </motion.button>
                </motion.div>
              </div>

              {/* Right Column - YouTube Video */}
              <div className="mt-8 lg:mt-0">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="relative aspect-video rounded-xl overflow-hidden shadow-2xl bg-gray-900 border-2 border-white/20"
                >
                  <iframe
                    className="absolute top-0 left-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${import.meta.env.VITE_YOUTUBE_VIDEO_ID || 'YOUR_VIDEO_ID'}`}
                    title="Hướng dẫn sử dụng Blacklist.vn"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                  />
                </motion.div>
                <p className="text-center text-sm text-gray-400 mt-3">
                  {t('tutorial.note', { defaultValue: 'Nhấp vào video để xem hướng dẫn chi tiết' })}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Scan Form Section */}
        <section id="scan" className="relative py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 scroll-mt-20">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="space-y-6 sm:space-y-8"
            >
              {/* File Upload Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-white rounded-xl shadow-lg border-2 border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-300 p-5 sm:p-6 md:p-8"
              >
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-4 md:mb-6 flex items-center gap-2 sm:gap-3">
                  <motion.span
                    className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm shadow-md"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    1
                  </motion.span>
                  {t('pageDashboard.uploadTitle')}
                </h2>
                <FileUploader
                  onFileSelect={handleFileSelect}
                  selectedFile={selectedFile}
                />
              </motion.div>

              {/* Analyze Button Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-xl shadow-lg border-2 border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-300 p-5 sm:p-6 md:p-8"
              >
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-4 md:mb-6 flex items-center gap-2 sm:gap-3">
                  <motion.span
                    className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm shadow-md"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    2
                  </motion.span>
                  {t('pageDashboard.analyzeTitle')}
                </h2>
                <motion.button
                  onClick={(e) => {
                    e.preventDefault();
                    handleAnalyze();
                  }}
                  disabled={!selectedFile || isAnalyzing}
                  whileHover={{ scale: selectedFile && !isAnalyzing ? 1.02 : 1 }}
                  whileTap={{ scale: selectedFile && !isAnalyzing ? 0.98 : 1 }}
                  className="relative w-full sm:w-auto px-6 sm:px-8 md:px-10 py-4 md:py-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white font-semibold rounded-xl hover:from-gray-800 hover:to-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl overflow-hidden group min-h-[48px]"
                >
                  {isAnalyzing ? (
                    <>
                      <motion.svg
                        className="h-5 w-5 md:h-6 md:w-6 text-white"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </motion.svg>
                      <span className="text-sm sm:text-base">{t('pageDashboard.analyzing')}</span>
                    </>
                  ) : !isLoggedIn && !captchaVerified ? (
                    <>
                      <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span className="text-sm sm:text-base">{t('pageDashboard.verifyCaptcha')}</span>
                    </>
                  ) : !isLoggedIn && captchaVerified ? (
                    <>
                      <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm sm:text-base">{t('pageDashboard.analyze')}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm sm:text-base">{t('pageDashboard.analyze')}</span>
                      <motion.svg
                        className="w-5 h-5 md:w-6 md:h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        animate={{ x: [0, 3, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </motion.svg>
                    </>
                  )}
                  {/* Shine effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: '-100%' }}
                    animate={!isAnalyzing && selectedFile ? { x: '100%' } : {}}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
                  />
                </motion.button>
              </motion.div>

              {/* CAPTCHA Section */}
              {showCaptcha && !isLoggedIn && (
                <motion.div
                  id="captcha-section"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-xl shadow-lg border-2 border-blue-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 p-4 sm:p-6 md:p-8 w-full overflow-hidden"
                >
                  <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-4 md:mb-6 flex items-center gap-2 sm:gap-3">
                    <motion.span
                      className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm shadow-md"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      🔒
                    </motion.span>
                    {t('pageDashboard.captchaTitle')}
                  </h2>
                  <Captcha onVerify={handleCaptchaVerify} />
                </motion.div>
              )}

              {/* CAPTCHA Verified Success Message */}
              {captchaVerified && !isLoggedIn && !analysisResult && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-green-50 border-2 border-green-200 rounded-xl p-4 sm:p-5"
                >
                  <div className="flex items-center gap-3">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                    >
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </motion.div>
                    <div className="flex-1">
                      <p className="text-sm sm:text-base font-semibold text-green-900">{t('pageCaptcha.success')}</p>
                      <p className="text-xs sm:text-sm text-green-700 mt-1">{t('pageDashboard.captchaVerifiedDesc')}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Results Section */}
              {analysisResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileInView={{ y: -2 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
                  className="bg-white rounded-xl shadow-lg border-2 border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-300 p-5 sm:p-6 md:p-8"
                >
                  <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-4 md:mb-6 flex items-center gap-2 sm:gap-3">
                    <motion.span
                      className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm shadow-md"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      3
                    </motion.span>
                    {t('pageDashboard.resultsTitle')}
                  </h2>
                  <ResultCard result={analysisResult} />
                  
                  {/* Success Message - Show if logged in and file saved */}
                  {isLoggedIn && analysisResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="mt-6 pt-6 border-t border-gray-200"
                    >
                      <div className="bg-gradient-to-br from-green-50 to-green-100/50 border-2 border-green-200 rounded-xl p-4 sm:p-5">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">{t('pageDashboard.fileSaved')}</h3>
                            <p className="text-xs sm:text-sm text-gray-600 mb-3">{t('pageDashboard.fileSavedDesc')}</p>
                            <Link
                              to="/files"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors shadow-md hover:shadow-lg"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              {t('pageDashboard.viewFiles')}
                            </Link>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white scroll-mt-20 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full filter blur-3xl opacity-50"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-50 rounded-full filter blur-3xl opacity-50"></div>
          
          <div className="relative max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
              className="text-center"
            >
              <motion.h2
                className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 bg-clip-text text-transparent mb-6 md:mb-8"
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{
                  backgroundSize: '200% 200%',
                }}
              >
                {t('landingAbout.title')}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed mb-6 md:mb-8 px-2"
              >
                {t('landingAbout.paragraph1')}
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-sm sm:text-base md:text-lg text-gray-600 leading-relaxed px-2"
              >
                {t('landingAbout.paragraph2')}
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 md:py-20 bg-gradient-to-b from-white via-gray-50/50 to-white border-b border-gray-100 relative overflow-hidden">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1, type: "spring", stiffness: 100 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="text-center group cursor-default"
                >
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-gray-200/50 shadow-sm group-hover:shadow-xl group-hover:border-gray-300 transition-all duration-300">
                    <motion.div
                      className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 bg-clip-text text-transparent mb-2 md:mb-3"
                      animate={{
                        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                      }}
                      transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      style={{
                        backgroundSize: '200% 200%',
                      }}
                    >
                      {stat.value}
                    </motion.div>
                    <div className="text-xs sm:text-sm md:text-base text-gray-600 font-medium">
                      {stat.label}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section id="risks" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 scroll-mt-20">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 md:mb-6">
                {t('risks.title')}
              </h2>
              <p className="text-base md:text-lg text-gray-600 max-w-3xl mx-auto px-4">
                {t('risks.description')}
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
              {[
                t('risks.risk1'),
                t('risks.risk2'),
                t('risks.risk3')
              ].map((risk, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  whileInView={{ opacity: 1, x: 0, scale: 1 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.02, x: 5 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 200
                  }}
                  className="flex items-start space-x-3 p-4 md:p-5 bg-gradient-to-br from-red-50 to-red-100/50 border-2 border-red-200/50 rounded-xl shadow-sm hover:shadow-md hover:border-red-300 transition-all duration-300 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-red-400/0 to-red-400/0 group-hover:from-red-400/5 group-hover:to-red-500/5 transition-all duration-300"></div>
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: index * 0.5 }}
                  >
                    <svg className="w-6 h-6 md:w-7 md:h-7 text-red-600 flex-shrink-0 mt-0.5 group-hover:text-red-700 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </motion.div>
                  <p className="text-xs sm:text-sm md:text-base text-gray-800 font-medium relative z-10 leading-relaxed">{risk}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white scroll-mt-20">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
                {t('features.title')}
              </h2>
              <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-4">
                {t('features.description')}
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  whileHover={{ 
                    y: -8,
                    scale: 1.02,
                    transition: { duration: 0.3 }
                  }}
                  transition={{ 
                    duration: 0.6, 
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 100
                  }}
                  className="group relative bg-white border-2 border-gray-200 rounded-2xl p-6 md:p-8 hover:border-gray-900/20 hover:shadow-2xl transition-all duration-300 overflow-hidden"
                >
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-900/0 via-gray-900/0 to-gray-900/0 group-hover:from-gray-900/5 group-hover:via-gray-900/3 group-hover:to-gray-900/0 transition-all duration-300"></div>
                  
                  {/* Animated icon container */}
                  <motion.div
                    className="relative w-14 h-14 md:w-18 md:h-18 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl flex items-center justify-center text-white mb-4 md:mb-6 group-hover:from-gray-800 group-hover:to-gray-900 transition-all duration-300 shadow-lg group-hover:shadow-xl group-hover:scale-110"
                    whileHover={{ rotate: [0, -5, 5, -5, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="w-7 h-7 md:w-9 md:h-9">
                      {feature.icon}
                    </div>
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-white/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </motion.div>
                  
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4 relative z-10 group-hover:text-gray-800 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed relative z-10">
                    {feature.description}
                  </p>
                  
                  {/* Decorative corner */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-gray-900/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 scroll-mt-20">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
                {t('howItWorks.title')}
              </h2>
              <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-4">
                {t('howItWorks.description')}
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
              {howItWorks.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  whileHover={{ 
                    y: -5,
                    scale: 1.02,
                    transition: { duration: 0.2 }
                  }}
                  transition={{ 
                    duration: 0.6, 
                    delay: index * 0.15,
                    type: "spring",
                    stiffness: 100
                  }}
                  className="relative group"
                >
                  <div className="relative bg-white rounded-2xl p-6 md:p-8 border-2 border-gray-200 hover:border-gray-900/30 hover:shadow-2xl transition-all duration-300 overflow-hidden">
                    {/* Gradient background on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Animated step number */}
                    <motion.div
                      className="relative text-5xl md:text-6xl font-black bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200 bg-clip-text text-transparent mb-4 md:mb-5"
                      animate={{
                        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear",
                        delay: index * 0.2,
                      }}
                      style={{
                        backgroundSize: '200% 200%',
                      }}
                      whileHover={{ scale: 1.1 }}
                    >
                      {step.step}
                    </motion.div>
                    
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4 relative z-10 group-hover:text-gray-800 transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-sm md:text-base text-gray-600 leading-relaxed relative z-10">
                      {step.description}
                    </p>
                    
                    {/* Decorative element */}
                    <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-gray-100/50 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
                  </div>
                  
                  {/* Animated connector arrow */}
                  {index < howItWorks.length - 1 && (
                    <motion.div
                      className="hidden md:flex absolute top-1/2 -right-4 items-center justify-center transform -translate-y-1/2 z-10"
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.5 + index * 0.15 }}
                    >
                      <div className="w-8 h-0.5 bg-gradient-to-r from-gray-300 to-gray-400"></div>
                      <motion.div
                        className="w-0 h-0 border-l-8 border-l-gray-400 border-t-4 border-t-transparent border-b-4 border-b-transparent -ml-1"
                        animate={{ x: [0, 3, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.3 }}
                      />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
          {/* Animated background */}
          <div className="absolute inset-0">
            <motion.div
              className="absolute top-0 left-1/4 w-64 h-64 bg-white/5 rounded-full filter blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute bottom-0 right-1/4 w-64 h-64 bg-white/5 rounded-full filter blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
            />
          </div>
          <div className="relative max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6">
                {t('cta.title')}
              </h2>
              <p className="text-base md:text-xl text-gray-300 mb-6 md:mb-8 px-4">
                {t('cta.description')}
              </p>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.button
                  onClick={() => {
                    const scanSection = document.getElementById('scan');
                    if (scanSection) {
                      scanSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className="relative inline-block px-6 sm:px-8 py-3 sm:py-4 bg-white text-gray-900 font-semibold rounded-xl overflow-hidden shadow-2xl text-base sm:text-lg group"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {t('cta.button')}
                    <motion.svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </motion.svg>
                  </span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-gray-100 via-white to-gray-100"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.6 }}
                  />
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-white/50 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </motion.button>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>
      <BackToTop />
      <Footer />
    </div>
  );
};

