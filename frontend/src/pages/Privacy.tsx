import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { SEO } from '../components/SEO';

export const Privacy = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col bg-white overflow-x-hidden w-full">
      <SEO 
        title={`${t('pagePrivacy.title')} - ${t('common.appName')}`}
        description={t('pagePrivacy.intro.content1')}
      />
      <Navbar />
      <main className="flex-1 py-12 md:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-block mb-6"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </motion.div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              {t('pagePrivacy.title')}
            </h1>
            <p className="text-base md:text-lg text-gray-600">
              {t('pagePrivacy.lastUpdated')}: {new Date().toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="prose prose-lg max-w-none"
          >
            {/* Introduction */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-6 md:p-8 mb-8 border-2 border-blue-200">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <svg className="w-6 h-6 md:w-7 md:h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('pagePrivacy.intro.title')}
              </h2>
              <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-4">
                {t('pagePrivacy.intro.content1')}
              </p>
              <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                {t('pagePrivacy.intro.content2')}
              </p>
            </div>

            {/* Section 1: Purpose */}
            <section className="mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-gray-900 text-white rounded-lg flex items-center justify-center font-bold text-sm">1</span>
                {t('pagePrivacy.purpose.title')}
              </h2>
              <div className="bg-gray-50 rounded-xl p-6 md:p-8 border border-gray-200">
                <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-4">
                  {t('pagePrivacy.purpose.content1')}
                </p>
                <ul className="space-y-3 text-base md:text-lg text-gray-700">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{t('pagePrivacy.purpose.point1')}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{t('pagePrivacy.purpose.point2')}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{t('pagePrivacy.purpose.point3')}</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 2: Data Collection */}
            <section className="mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-gray-900 text-white rounded-lg flex items-center justify-center font-bold text-sm">2</span>
                {t('pagePrivacy.dataCollection.title')}
              </h2>
              <div className="bg-gray-50 rounded-xl p-6 md:p-8 border border-gray-200">
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-5 mb-6">
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <h3 className="font-bold text-red-900 mb-2">{t('pagePrivacy.dataCollection.warning')}</h3>
                      <p className="text-sm md:text-base text-red-800 leading-relaxed">
                        {t('pagePrivacy.dataCollection.warningContent')}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-4">
                  {t('pagePrivacy.dataCollection.content1')}
                </p>
                <div className="bg-white rounded-lg p-5 border border-gray-300">
                  <h3 className="font-semibold text-gray-900 mb-3">{t('pagePrivacy.dataCollection.localStorage')}</h3>
                  <ul className="space-y-2 text-sm md:text-base text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-gray-400">•</span>
                      <span>{t('pagePrivacy.dataCollection.localStoragePoint1')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gray-400">•</span>
                      <span>{t('pagePrivacy.dataCollection.localStoragePoint2')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gray-400">•</span>
                      <span>{t('pagePrivacy.dataCollection.localStoragePoint3')}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 3: Data Usage */}
            <section className="mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-gray-900 text-white rounded-lg flex items-center justify-center font-bold text-sm">3</span>
                {t('pagePrivacy.dataUsage.title')}
              </h2>
              <div className="bg-gray-50 rounded-xl p-6 md:p-8 border border-gray-200">
                <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-4">
                  {t('pagePrivacy.dataUsage.content1')}
                </p>
                <div className="grid md:grid-cols-2 gap-4 mt-6">
                  <div className="bg-white rounded-lg p-5 border border-gray-300">
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {t('pagePrivacy.dataUsage.allowed.title')}
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-700 mt-3">
                      <li>• {t('pagePrivacy.dataUsage.allowed.point1')}</li>
                      <li>• {t('pagePrivacy.dataUsage.allowed.point2')}</li>
                      <li>• {t('pagePrivacy.dataUsage.allowed.point3')}</li>
                    </ul>
                  </div>
                  <div className="bg-white rounded-lg p-5 border border-red-200 bg-red-50">
                    <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      {t('pagePrivacy.dataUsage.notAllowed.title')}
                    </h3>
                    <ul className="space-y-2 text-sm text-red-800 mt-3">
                      <li>• {t('pagePrivacy.dataUsage.notAllowed.point1')}</li>
                      <li>• {t('pagePrivacy.dataUsage.notAllowed.point2')}</li>
                      <li>• {t('pagePrivacy.dataUsage.notAllowed.point3')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4: Compliance */}
            <section className="mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-gray-900 text-white rounded-lg flex items-center justify-center font-bold text-sm">4</span>
                {t('pagePrivacy.compliance.title')}
              </h2>
              <div className="bg-gray-50 rounded-xl p-6 md:p-8 border border-gray-200">
                <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-6">
                  {t('pagePrivacy.compliance.content1')}
                </p>
                <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-lg p-5 border-2 border-green-200">
                  <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    {t('pagePrivacy.compliance.laws.title')}
                  </h3>
                  <ul className="space-y-2 text-sm md:text-base text-green-800 mt-3">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600">•</span>
                      <span>{t('pagePrivacy.compliance.laws.point1')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600">•</span>
                      <span>{t('pagePrivacy.compliance.laws.point2')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600">•</span>
                      <span>{t('pagePrivacy.compliance.laws.point3')}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 5: Contact */}
            <section className="mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-gray-900 text-white rounded-lg flex items-center justify-center font-bold text-sm">5</span>
                {t('pagePrivacy.contact.title')}
              </h2>
              <div className="bg-gray-50 rounded-xl p-6 md:p-8 border border-gray-200">
                <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-4">
                  {t('pagePrivacy.contact.content1')}
                </p>
                <div className="bg-white rounded-lg p-5 border border-gray-300">
                  <p className="text-sm md:text-base text-gray-600">
                    <strong>{t('pagePrivacy.contact.email')}:</strong> info@blacklist.vn
                  </p>
                </div>
              </div>
            </section>

            {/* Footer Note */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-6 md:p-8 border-2 border-blue-200 mt-12">
              <div className="flex items-start gap-4">
                <svg className="w-6 h-6 md:w-7 md:h-7 text-blue-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">
                    {t('pagePrivacy.footer.title')}
                  </h3>
                  <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                    {t('pagePrivacy.footer.content')}
                  </p>
                </div>
              </div>
            </div>

            {/* Back to Home */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-12 text-center"
            >
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                {t('pagePrivacy.backToHome')}
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

