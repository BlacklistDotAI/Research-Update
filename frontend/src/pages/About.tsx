import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { SEO } from '../components/SEO';

const teamMembers = [
  { 
    name: 'Gianty', 
    website: 'https://www.gianty.com',
    description: 'team.description.gianty'
  },
  { 
    name: 'Uway', 
    website: 'https://uway.asia',
    description: 'team.description.uway'
  },
  { 
    name: 'Techainer', 
    website: 'https://techainer.com/',
    description: 'team.description.techainer'
  }
];

export const About = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col bg-white overflow-x-hidden w-full">
      <SEO 
        title={`${t('pageAbout.pageTitle')} - ${t('common.appName')}`}
        description={t('pageAbout.pageDescription')}
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
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </motion.div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              {t('pageAbout.pageTitle')}
            </h1>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              {t('pageAbout.pageDescription')}
            </p>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-10"
          >
            {/* Mission Section */}
            <section className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-6 md:p-8 border-2 border-blue-200">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <svg className="w-6 h-6 md:w-7 md:h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                {t('pageAbout.mission.title')}
              </h2>
              <div className="space-y-4 text-base md:text-lg text-gray-700 leading-relaxed">
                <p>{t('pageAbout.mission.content1')}</p>
                <p>{t('pageAbout.mission.content2')}</p>
              </div>
            </section>

            {/* Partnership Section */}
            <section>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-gray-900 text-white rounded-lg flex items-center justify-center font-bold text-sm">1</span>
                {t('pageAbout.partnership.title')}
              </h2>
              <div className="bg-gray-50 rounded-xl p-6 md:p-8 border border-gray-200 mb-6">
                <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-6">
                  {t('pageAbout.partnership.content1')}
                </p>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-lg p-5 border-2 border-purple-200">
                  <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {t('pageAbout.partnership.note')}
                  </h3>
                  <p className="text-sm md:text-base text-purple-800 leading-relaxed">
                    {t('pageAbout.partnership.noteContent')}
                  </p>
                </div>
              </div>

              {/* Team Members */}
              <div className="grid md:grid-cols-3 gap-6">
                {teamMembers.map((member, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                    className="bg-white rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-300 p-6"
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        <a
                          href={member.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-blue-600 transition-colors underline decoration-dotted underline-offset-4"
                        >
                          {member.name}
                        </a>
                      </h3>
                      {/* <p className="text-sm text-gray-600 leading-relaxed">
                        {t(member.description)}
                      </p> */}
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Technology Section */}
            <section>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-gray-900 text-white rounded-lg flex items-center justify-center font-bold text-sm">2</span>
                {t('pageAbout.technology.title')}
              </h2>
              <div className="bg-gray-50 rounded-xl p-6 md:p-8 border border-gray-200">
                <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-6">
                  {t('pageAbout.technology.content1')}
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-5 border border-gray-300">
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {t('pageAbout.technology.ai.title')}
                    </h3>
                    <p className="text-sm text-gray-700">{t('pageAbout.technology.ai.description')}</p>
                  </div>
                  <div className="bg-white rounded-lg p-5 border border-gray-300">
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {t('pageAbout.technology.security.title')}
                    </h3>
                    <p className="text-sm text-gray-700">{t('pageAbout.technology.security.description')}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Commitment Section */}
            <section>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-gray-900 text-white rounded-lg flex items-center justify-center font-bold text-sm">3</span>
                {t('pageAbout.commitment.title')}
              </h2>
              <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-6 md:p-8 border-2 border-green-200">
                <ul className="space-y-4 text-base md:text-lg text-gray-700">
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{t('pageAbout.commitment.point1')}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{t('pageAbout.commitment.point2')}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{t('pageAbout.commitment.point3')}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{t('pageAbout.commitment.point4')}</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Contact Section */}
            <section className="bg-gray-50 rounded-xl p-6 md:p-8 border border-gray-200">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                {t('pageAbout.contact.title')}
              </h2>
              <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-4">
                {t('pageAbout.contact.content1')}
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-900 to-gray-800 text-white font-semibold rounded-xl hover:from-gray-800 hover:to-gray-700 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {t('pageAbout.contact.button')}
              </Link>
            </section>
          </motion.div>

          {/* Back to Home */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-12 text-center"
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {t('pageAbout.backToHome')}
            </Link>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

