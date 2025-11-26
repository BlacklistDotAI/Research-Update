import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { SEO } from '../components/SEO';
import { Captcha } from '../components/Captcha';
import { trackEvent } from '../components/GoogleAnalytics';

export const Donate = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    organization: '',
    contributionTypes: [] as string[],
    skills: [] as string[],
    timeCommitment: '',
    referralLink: '',
    notes: '',
    agreement1: false,
    agreement2: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (field: 'contributionTypes' | 'skills', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value],
    }));
  };

  const handleAgreementChange = (field: 'agreement1' | 'agreement2') => {
    setFormData(prev => ({ ...prev, [field]: !prev[field] }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Track form submission attempt
    trackEvent('click', 'button', 'donate_submit', 1);
    
    setSubmitSuccess(false);
    
    // Validate form
    const newErrors: Record<string, string> = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = t('donate.form.validation.fullNameRequired');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('donate.form.validation.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('donate.form.validation.emailInvalid');
    }

    if (formData.contributionTypes.length === 0) {
      newErrors.contributionTypes = t('donate.form.validation.contributionTypesRequired');
    }

    if (!formData.agreement1) {
      newErrors.agreement1 = t('donate.form.validation.agreement1Required');
    }

    if (!formData.agreement2) {
      newErrors.agreement2 = t('donate.form.validation.agreement2Required');
    }

    if (!captchaVerified) {
      newErrors.captcha = t('donate.form.validation.captchaRequired');
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      // Scroll to first error
      setTimeout(() => {
        const firstErrorField = Object.keys(newErrors)[0];
        if (firstErrorField) {
          let element: HTMLElement | null = null;
          if (firstErrorField === 'contributionTypes' || firstErrorField === 'captcha') {
            element = document.querySelector(`[data-field="${firstErrorField}"]`) as HTMLElement;
          } else if (firstErrorField === 'agreement1' || firstErrorField === 'agreement2') {
            element = document.querySelector(`[data-field="${firstErrorField}"]`) as HTMLElement;
          } else {
            element = document.querySelector(`[name="${firstErrorField}"]`) as HTMLElement;
          }
          element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return;
    }

    setIsSubmitting(true);
    
    try {
      const apiBaseUrl = 'https://api.blacklist.vn';

      // Prepare data for API
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone || undefined,
        organization: formData.organization || undefined,
        contributionTypes: formData.contributionTypes,
        skills: formData.skills,
        timeCommitment: formData.timeCommitment || undefined,
        referralLink: formData.referralLink || undefined,
        notes: formData.notes || undefined,
      };

      const response = await fetch(`${apiBaseUrl}/api/donates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Log response for debugging
      console.log('📡 API Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status}`;
        
        try {
          const errorData = await response.json();
          console.error('❌ API Error Data:', errorData);
          
          // Handle different error formats
          if (errorData.error) {
            errorMessage = errorData.error.message || errorData.error.name || errorMessage;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          // Response is not JSON, try to get text
          try {
            const errorText = await response.text();
            console.error('❌ API Error Text:', errorText);
            errorMessage = errorText || `Server error: ${response.status} ${response.statusText}`;
          } catch (textError) {
            console.error('❌ Could not parse error response:', textError);
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
          }
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('✅ Form submitted successfully:', result);
      
      setIsSubmitting(false);
      setSubmitSuccess(true);
      
      // Track successful submission
      trackEvent('submit', 'form', 'donate_form_success', 1);
      
      // Reset form after success
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        organization: '',
        contributionTypes: [],
        skills: [],
        timeCommitment: '',
        referralLink: '',
        notes: '',
        agreement1: false,
        agreement2: false,
      });
      setCaptchaVerified(false);
      setErrors({});
    } catch (error) {
      console.error('❌ Error submitting form:', error);
      setIsSubmitting(false);
      
      // Better error handling with detailed messages
      let errorMessage = t('donate.form.error.message');
      
      if (error instanceof Error) {
        const errorMsg = error.message;
        
        // Network/Connection errors
        if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError') || errorMsg.includes('CORS')) {
          errorMessage = 'Không thể kết nối đến API. Có thể do lỗi CORS hoặc kết nối mạng. Vui lòng thử lại sau.';
        }
        // Permission errors
        else if (errorMsg.includes('403') || errorMsg.includes('Forbidden')) {
          errorMessage = 'Lỗi quyền truy cập. Vui lòng thử lại sau.';
        }
        // Not found errors
        else if (errorMsg.includes('404') || errorMsg.includes('Not Found')) {
          errorMessage = 'Không tìm thấy API endpoint. Vui lòng thử lại sau.';
        }
        // Other errors
        else {
          errorMessage = errorMsg;
        }
      }
      
      // Track form error
      trackEvent('error', 'form', 'donate_form_error', 0);
      
      // Show error message to user
      alert(errorMessage);
    }
  };

  const contributionTypeCards = [
    {
      id: 'skills-time',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v4m0 12v4M2 12h4m12 0h4" />
        </svg>
      ),
      title: t('donate.types.skillsTime.title'),
      description: t('donate.types.skillsTime.description'),
    },
    {
      id: 'project-data',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: t('donate.types.projectData.title'),
      description: t('donate.types.projectData.description'),
    },
    {
      id: 'infrastructure',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      title: t('donate.types.infrastructure.title'),
      description: t('donate.types.infrastructure.description'),
    },
    {
      id: 'financial',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      title: t('donate.types.financial.title'),
      description: t('donate.types.financial.description'),
    },
  ];

  const skillOptions = [
    'ai-ml',
    'software',
    'design-ux',
    'product',
    'data-bi',
    'security-legal',
    'moderation',
    'growth-content',
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 overflow-x-hidden w-full">
      <SEO
        title={`${t('donate.pageTitle')} - ${t('common.appName')}`}
        description={t('donate.pageDescription')}
      />
      <Navbar />
      
      <main className="flex-1">
        {/* Header Section */}
        <section className="bg-gray-900 text-white py-8 md:py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <p className="text-base md:text-lg text-gray-300 leading-relaxed max-w-4xl mx-auto">
                {t('donate.header')}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Main Content */}
        <section className="pb-16 px-4 sm:px-6 lg:px-8 -mt-8 md:-mt-12">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 lg:p-12"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                {/* Left Column - Contribution Types */}
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    {t('donate.leftColumn.title')}
                  </h2>
                  <p className="text-sm md:text-base text-gray-600 mb-6">
                    {t('donate.leftColumn.subtitle')}
                  </p>

                  <div className="space-y-4 mb-8">
                    {contributionTypeCards.map((card, index) => (
                      <motion.div
                        key={card.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                        className={`p-4 border-2 rounded-xl transition-all cursor-pointer ${
                          formData.contributionTypes.includes(card.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                        onClick={() => handleCheckboxChange('contributionTypes', card.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                            formData.contributionTypes.includes(card.id)
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {card.icon}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">{card.title}</h3>
                            <p className="text-sm text-gray-600">{card.description}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Info Sections */}
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm text-gray-700">{t('donate.leftColumn.dataProtection')}</p>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                      <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <p className="text-sm text-gray-700">{t('donate.leftColumn.compliance')}</p>
                    </div>
                  </div>
                </div>

                {/* Right Column - Form */}
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    {t('donate.form.title')}
                  </h2>
                  <p className="text-sm md:text-base text-gray-600 mb-6">
                    {t('donate.form.subtitle')}
                  </p>

                  {submitSuccess ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center"
                    >
                      <svg className="w-16 h-16 text-green-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="text-lg font-semibold text-green-900 mb-2">{t('donate.form.success.title')}</h3>
                      <p className="text-sm text-green-700">{t('donate.form.success.message')}</p>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Full Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('donate.form.fields.fullName')} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            className={`pl-10 w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                              errors.fullName ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder={t('donate.form.fields.fullNamePlaceholder')}
                          />
                        </div>
                        {errors.fullName && (
                          <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                        )}
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('donate.form.fields.email')} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className={`pl-10 w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                              errors.email ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder={t('donate.form.fields.emailPlaceholder')}
                          />
                        </div>
                        {errors.email && (
                          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                        )}
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('donate.form.fields.phone')}
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </div>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="pl-10 w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder={t('donate.form.fields.phonePlaceholder')}
                          />
                        </div>
                      </div>

                      {/* Organization */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('donate.form.fields.organization')}
                        </label>
                        <input
                          type="text"
                          name="organization"
                          value={formData.organization}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                          placeholder={t('donate.form.fields.organizationPlaceholder')}
                        />
                      </div>

                      {/* Contribution Types */}
                      <div data-field="contributionTypes">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          {t('donate.form.fields.contributionTypes')} <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-2">
                          {contributionTypeCards.map((card) => (
                            <label key={card.id} className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.contributionTypes.includes(card.id)}
                                onChange={() => handleCheckboxChange('contributionTypes', card.id)}
                                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">{card.title}</span>
                            </label>
                          ))}
                        </div>
                        {errors.contributionTypes && (
                          <p className="mt-1 text-sm text-red-600">{errors.contributionTypes}</p>
                        )}
                      </div>

                      {/* Skills */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          {t('donate.form.fields.skills')}
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {skillOptions.map((skill) => (
                            <label key={skill} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.skills.includes(skill)}
                                onChange={() => handleCheckboxChange('skills', skill)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">{t(`donate.form.skills.${skill}`)}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Time Commitment */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          {t('donate.form.fields.timeCommitment')}
                        </label>
                        <div className="space-y-2">
                          {['ad-hoc', 'part-time', 'full-time'].map((option) => (
                            <label key={option} className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="radio"
                                name="timeCommitment"
                                value={option}
                                checked={formData.timeCommitment === option}
                                onChange={handleInputChange}
                                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">{t(`donate.form.timeCommitment.${option}`)}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Referral Link */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('donate.form.fields.referralLink')}
                        </label>
                        <input
                          type="url"
                          name="referralLink"
                          value={formData.referralLink}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                          placeholder={t('donate.form.fields.referralLinkPlaceholder')}
                        />
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('donate.form.fields.notes')}
                        </label>
                        <textarea
                          name="notes"
                          value={formData.notes}
                          onChange={handleInputChange}
                          rows={4}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-y"
                          placeholder={t('donate.form.fields.notesPlaceholder')}
                        />
                      </div>

                      {/* Agreements */}
                      <div className="space-y-3" data-field="agreements">
                        <div data-field="agreement1">
                          <label className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.agreement1}
                              onChange={() => handleAgreementChange('agreement1')}
                              className={`w-5 h-5 mt-0.5 text-blue-600 rounded focus:ring-blue-500 ${
                                errors.agreement1 ? 'border-red-500' : 'border-gray-300'
                              }`}
                            />
                            <span className={`text-sm ${errors.agreement1 ? 'text-red-600' : 'text-gray-700'}`}>
                              {t('donate.form.agreement1')} <span className="text-red-500">*</span>
                            </span>
                          </label>
                          {errors.agreement1 && (
                            <p className="mt-1 ml-8 text-sm text-red-600">{errors.agreement1}</p>
                          )}
                        </div>
                        <div data-field="agreement2">
                          <label className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.agreement2}
                              onChange={() => handleAgreementChange('agreement2')}
                              className={`w-5 h-5 mt-0.5 text-blue-600 rounded focus:ring-blue-500 ${
                                errors.agreement2 ? 'border-red-500' : 'border-gray-300'
                              }`}
                            />
                            <span className={`text-sm ${errors.agreement2 ? 'text-red-600' : 'text-gray-700'}`}>
                              {t('donate.form.agreement2')} <span className="text-red-500">*</span>
                            </span>
                          </label>
                          {errors.agreement2 && (
                            <p className="mt-1 ml-8 text-sm text-red-600">{errors.agreement2}</p>
                          )}
                        </div>
                      </div>

                      {/* CAPTCHA */}
                      <div data-field="captcha">
                        {errors.captcha && (
                          <p className="mb-2 text-sm text-red-600">{errors.captcha}</p>
                        )}
                        <Captcha onVerify={(isValid) => {
                          setCaptchaVerified(isValid);
                          // Clear error when verified
                          if (isValid && errors.captcha) {
                            setErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors.captcha;
                              return newErrors;
                            });
                          }
                        }} />
                      </div>

                      {/* Submit Button */}
                      <div className="flex items-center justify-between pt-4">
                        <button
                          type="submit"
                          disabled={isSubmitting || !formData.agreement1 || !formData.agreement2 || !captchaVerified}
                          className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                        >
                          {isSubmitting ? t('donate.form.submitting') : t('donate.form.submit')}
                        </button>
                        <p className="text-sm text-gray-500">
                          {t('donate.form.support')} <a href={`mailto:${t('donate.form.supportEmail')}`} className="text-blue-600 hover:text-blue-700 underline">{t('donate.form.supportEmail')}</a>
                        </p>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

