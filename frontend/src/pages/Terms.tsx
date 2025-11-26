import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { SEO } from '../components/SEO';

export const Terms = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col bg-white overflow-x-hidden w-full">
      <SEO 
        title={`${t('pageTerms.title')} - ${t('common.appName')}`}
        description={t('pageTerms.intro.content1')}
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
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </motion.div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              {t('pageTerms.title')}
            </h1>
            <p className="text-base md:text-lg text-gray-600">
              {t('pageTerms.lastUpdated')}: {new Date().toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}
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
            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-6 md:p-8 mb-8 border-2 border-purple-200">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <svg className="w-6 h-6 md:w-7 md:h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('pageTerms.intro.title')}
              </h2>
              <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-4">
                {t('pageTerms.intro.content1')}
              </p>
              <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                {t('pageTerms.intro.content2')}
              </p>
            </div>

            {/* Section 1: Acceptance */}
            <section className="mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-gray-900 text-white rounded-lg flex items-center justify-center font-bold text-sm">1</span>
                {t('pageTerms.acceptance.title')}
              </h2>
              <div className="bg-gray-50 rounded-xl p-6 md:p-8 border border-gray-200">
                <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                  {t('pageTerms.acceptance.content1')}
                </p>
              </div>
            </section>

            {/* Section 2: Service Description */}
            <section className="mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-gray-900 text-white rounded-lg flex items-center justify-center font-bold text-sm">2</span>
                {t('pageTerms.service.title')}
              </h2>
              <div className="bg-gray-50 rounded-xl p-6 md:p-8 border border-gray-200">
                <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-4">
                  {t('pageTerms.service.content1')}
                </p>
                <ul className="space-y-3 text-base md:text-lg text-gray-700">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{t('pageTerms.service.point1')}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{t('pageTerms.service.point2')}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{t('pageTerms.service.point3')}</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 3: User Responsibilities */}
            <section className="mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-gray-900 text-white rounded-lg flex items-center justify-center font-bold text-sm">3</span>
                {t('pageTerms.responsibilities.title')}
              </h2>
              <div className="bg-gray-50 rounded-xl p-6 md:p-8 border border-gray-200">
                <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-4">
                  {t('pageTerms.responsibilities.content1')}
                </p>
                <ul className="space-y-3 text-base md:text-lg text-gray-700">
                  <li className="flex items-start gap-3">
                    <span className="text-gray-400 font-bold">•</span>
                    <span>{t('pageTerms.responsibilities.point1')}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-gray-400 font-bold">•</span>
                    <span>{t('pageTerms.responsibilities.point2')}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-gray-400 font-bold">•</span>
                    <span>{t('pageTerms.responsibilities.point3')}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-gray-400 font-bold">•</span>
                    <span>{t('pageTerms.responsibilities.point4')}</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 4: Limitations */}
            <section className="mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-gray-900 text-white rounded-lg flex items-center justify-center font-bold text-sm">4</span>
                {t('pageTerms.limitations.title')}
              </h2>
              <div className="bg-gray-50 rounded-xl p-6 md:p-8 border border-gray-200">
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-5 mb-6">
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <h3 className="font-bold text-yellow-900 mb-2">{t('pageTerms.limitations.warning')}</h3>
                      <p className="text-sm md:text-base text-yellow-800 leading-relaxed">
                        {t('pageTerms.limitations.warningContent')}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-4">
                  {t('pageTerms.limitations.content1')}
                </p>
                <ul className="space-y-2 text-sm md:text-base text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400">•</span>
                    <span>{t('pageTerms.limitations.point1')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400">•</span>
                    <span>{t('pageTerms.limitations.point2')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400">•</span>
                    <span>{t('pageTerms.limitations.point3')}</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 5: Intellectual Property */}
            <section className="mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-gray-900 text-white rounded-lg flex items-center justify-center font-bold text-sm">5</span>
                {t('pageTerms.intellectual.title')}
              </h2>
              <div className="bg-gray-50 rounded-xl p-6 md:p-8 border border-gray-200">
                <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                  {t('pageTerms.intellectual.content1')}
                </p>
              </div>
            </section>

            {/* Section 6: Modifications */}
            <section className="mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-gray-900 text-white rounded-lg flex items-center justify-center font-bold text-sm">6</span>
                {t('pageTerms.modifications.title')}
              </h2>
              <div className="bg-gray-50 rounded-xl p-6 md:p-8 border border-gray-200">
                <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                  {t('pageTerms.modifications.content1')}
                </p>
              </div>
            </section>

            {/* Section 7: Contact */}
            <section className="mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="w-8 h-8 bg-gray-900 text-white rounded-lg flex items-center justify-center font-bold text-sm">7</span>
                {t('pageTerms.contact.title')}
              </h2>
              <div className="bg-gray-50 rounded-xl p-6 md:p-8 border border-gray-200">
                <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-4">
                  {t('pageTerms.contact.content1')}
                </p>
                <div className="bg-white rounded-lg p-5 border border-gray-300">
                  <p className="text-sm md:text-base text-gray-600">
                    <strong>{t('pageTerms.contact.email')}:</strong> info@blacklist.vn
                  </p>
                </div>
              </div>
            </section>

            {/* Footer Note */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-6 md:p-8 border-2 border-purple-200 mt-12">
              <div className="flex items-start gap-4">
                <svg className="w-6 h-6 md:w-7 md:h-7 text-purple-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">
                    {t('pageTerms.footer.title')}
                  </h3>
                  <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                    {t('pageTerms.footer.content')}
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
                {t('pageTerms.backToHome')}
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

