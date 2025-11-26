import { AnalysisResult } from '../utils/api';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { saveShareResult } from '../utils/storage';
import { trackEvent } from './GoogleAnalytics';

interface ResultCardProps {
  result: AnalysisResult;
  showFullAnalysis?: boolean;
}

// Helper function to translate reasoning labels
const translateLabel = (label: string, t: (key: string) => string): string => {
  // Remove colon if present for lookup
  const key = label.replace(':', '').trim();
  
  // Normalize key: remove extra spaces, convert to proper case
  const normalizedKey = key.replace(/\s+/g, ' ').trim();
  
  // List of all possible labels (case-insensitive matching)
  const labelKeys = [
    'Context', 'Behavioral indicators', 'Linguistic signals',
    'Emotional tone', 'Social engineering techniques', 'Information sensitivity',
    'Verification cues', 'Consistency check', 'Previous pattern match',
    'Risk assessment', 'Summary'
  ];
  
  // Try case-insensitive match first
  const lowerKey = normalizedKey.toLowerCase();
  const matchedKey = labelKeys.find(lk => lk.toLowerCase() === lowerKey);
  
  if (matchedKey) {
    const translationKey = `results.reasoningLabels.${matchedKey}`;
    const translated = t(translationKey);
    // If translation exists and is different from key, use it
    if (translated && translated !== translationKey) {
      return translated + (label.endsWith(':') ? ':' : '');
    }
    // Debug: log if translation not found
    if (translated === translationKey) {
      console.warn('⚠️ Translation not found for label:', matchedKey, 'key:', translationKey);
    }
  } else {
    // Debug: log if no match found
    console.warn('⚠️ Label not matched:', normalizedKey, 'original:', label);
  }
  
  // Try exact match as fallback
  const translationKeyExact = `results.reasoningLabels.${normalizedKey}`;
  const translatedExact = t(translationKeyExact);
  
  if (translatedExact && translatedExact !== translationKeyExact) {
    return translatedExact + (label.endsWith(':') ? ':' : '');
  }
  
  // Fallback to original
  return label;
};

// Helper function to format reasoning text with bullets and line breaks
const formatReasoning = (text: string, t: (key: string) => string, showAll: boolean = false): { html: string; totalItems: number } => {
  if (!text) return { html: '', totalItems: 0 };
  
  // Replace \n with actual newlines
  const processed = text.replace(/\\n/g, '\n');
  
  // Split by newlines to process each line
  const lines = processed.split('\n').map(line => line.trim()).filter(line => line);
  
  const regularBullets: string[] = [];
  const nonBulletLines: string[] = [];
  let summaryHtml = '';
  let regularBulletCount = 0;
  const maxInitialBullets = 3;
  
  // First pass: separate regular bullets, summary, and non-bullet lines
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if line starts with bullet marker (* or -)
    const isBullet = line.startsWith('* ') || line.startsWith('- ');
    const bulletContent = isBullet ? (line.startsWith('* ') ? line.substring(2).trim() : line.substring(2).trim()) : null;
    
    if (isBullet && bulletContent) {
      const content = bulletContent;
      const isSummary = content.toLowerCase().startsWith('summary:');
      
      if (isSummary) {
        // Handle Summary separately (always show at end)
        const summaryContent = content.substring(8).trim();
        const summaryLabel = translateLabel('Summary:', t);
        summaryHtml = `<div class="mt-5 p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 rounded-r-lg shadow-sm">
          <div class="font-bold text-blue-900 text-base mb-2 flex items-center gap-2">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
            </svg>
            ${summaryLabel.replace(':', '')}
          </div>
          <p class="text-blue-800 leading-relaxed">${summaryContent}</p>
        </div>`;
        continue; // Don't count summary as a regular bullet
      }
      
      // Regular bullet - COUNT THIS
      regularBulletCount++;
      
      // Format the bullet
      if (content.includes(':')) {
        const colonIndex = content.indexOf(':');
        const originalLabel = content.substring(0, colonIndex + 1).trim();
        const description = content.substring(colonIndex + 1).trim();
        const translatedLabel = translateLabel(originalLabel, t);
        
        regularBullets.push(
          `<div class="mt-3 mb-2.5">
            <div class="flex items-start gap-2">
              <span class="text-blue-600 font-semibold mt-1">•</span>
              <div class="flex-1">
                <span class="font-semibold text-gray-900">${translatedLabel}</span>
                ${description ? `<span class="text-gray-700 ml-2">${description}</span>` : ''}
              </div>
            </div>
          </div>`
        );
      } else {
        regularBullets.push(
          `<div class="ml-2 mb-2 text-gray-700 leading-relaxed">
            <span class="text-gray-400">•</span> ${content}
          </div>`
        );
      }
    } else {
      // Non-bullet line - check if it's a label line (e.g., "Context: ..." or "Behavioral indicators: ...")
      // These lines should be treated as bullets too for display purposes
      if (line.includes(':')) {
        const colonIndex = line.indexOf(':');
        const label = line.substring(0, colonIndex + 1).trim();
        const description = line.substring(colonIndex + 1).trim();
        const translatedLabel = translateLabel(label, t);
        
        // Count as a regular bullet for "show more/less" functionality
        regularBulletCount++;
        
        regularBullets.push(
          `<div class="mt-3 mb-2.5">
            <div class="flex items-start gap-2">
              <span class="text-blue-600 font-semibold mt-1">•</span>
              <div class="flex-1">
                <span class="font-semibold text-gray-900">${translatedLabel}</span>
                ${description ? `<span class="text-gray-700 ml-2">${description}</span>` : ''}
              </div>
            </div>
          </div>`
        );
      } else {
        // Plain text line (no label, no bullet)
        nonBulletLines.push(`<p class="mb-3 text-gray-700 leading-relaxed">${line}</p>`);
      }
    }
  }
  
  // Build final HTML: show non-bullet lines first, then bullets, then summary
  const bulletsToShow = showAll ? regularBullets : regularBullets.slice(0, maxInitialBullets);
  const nonBulletHtml = nonBulletLines.join('');
  const bulletsHtml = bulletsToShow.join('');
  const finalHtml = nonBulletHtml + bulletsHtml + (summaryHtml ? summaryHtml : '');
  
  // If no bullets found, show all non-bullet lines as fallback
  if (regularBulletCount === 0 && nonBulletLines.length > 0) {
    return { html: nonBulletHtml, totalItems: 0 };
  }
  
  return { html: finalHtml, totalItems: regularBulletCount };
};

export const ResultCard = ({ result: analysisResult, showFullAnalysis = false }: ResultCardProps) => {
  const { t } = useTranslation();
  const [showAllAnalysis, setShowAllAnalysis] = useState(showFullAnalysis);
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmittingBlacklist, setIsSubmittingBlacklist] = useState(false);
  const [blacklistSuccess, setBlacklistSuccess] = useState(false);
  const [blacklistError, setBlacklistError] = useState('');
  const [shareUrl, setShareUrl] = useState<string>('');
  
  // Use analysisResult to avoid naming conflict with response result
  const result = analysisResult;
  
  // Reset showAllAnalysis when result changes (new analysis) or when showFullAnalysis prop changes
  useEffect(() => {
    setShowAllAnalysis(showFullAnalysis);
  }, [result.transcript, showFullAnalysis]);
  
  // Generate share URL on mount - encode result data in URL for crawlers
  useEffect(() => {
    const id = saveShareResult(result);
    const baseUrl = window.location.origin;
    const score = Math.round(result.riskScore * 100);
    const flagged = result.flagged ? '1' : '0';
    // Include minimal data in URL for OG tags (crawlers can't access sessionStorage)
    setShareUrl(`${baseUrl}/share/${id}?s=${score}&f=${flagged}`);
  }, [result]);
  
  // Format reasoning with show more/less
  const reasoningResult = formatReasoning(result.transcript || '', t, showAllAnalysis);
  
  // Share functions
  const handleShare = async (platform: 'facebook' | 'twitter' | 'linkedin') => {
    // Track share event
    trackEvent('click', 'share', `share_${platform}`, Math.round(result.riskScore * 100));
    
    const score = Math.round(result.riskScore * 100);
    const status = result.flagged ? t('results.isScam') : t('results.safe');
    const text = `${status} - ${t('results.riskScore')}: ${score}% | ${t('common.appName')}`;
    
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    };
    
    // Check if mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // On mobile, use direct links to open in-app or browser (consistent behavior)
    // On desktop, use popup window
    if (isMobile) {
      // Mobile: Open directly in new tab (works for both app and browser)
      // This ensures consistent behavior across all platforms (Facebook, Twitter, LinkedIn)
      window.open(shareUrls[platform], '_blank');
    } else {
      // Desktop: Open in popup window
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };
  
  // confidence là số từ 0-1, thể hiện mức độ tin tưởng của hệ thống về kết luận
  // Khi is_scam = true: confidence = 0.95 nghĩa là hệ thống tin 95% rằng đây LÀ lừa đảo
  // Khi is_scam = false: confidence = 0.30 nghĩa là hệ thống chỉ tin 30% rằng đây là bình thường (không chắc chắn)
  const getConfidenceColor = (confidence: number, isScam: boolean) => {
    if (isScam) {
      // Trường hợp là lừa đảo
      if (confidence >= 0.9) {
        // Confidence cao (≥0.9) = hệ thống rất chắc chắn đây là lừa đảo → màu đỏ (nguy hiểm)
        return 'text-red-600 bg-red-50 border-red-200';
      }
      if (confidence >= 0.6) {
        // Confidence trung bình = tương đối chắc chắn là lừa đảo → màu cam
        return 'text-orange-600 bg-orange-50 border-orange-200';
      }
      // Confidence thấp = không chắc chắn lắm nhưng vẫn phát hiện là lừa đảo → màu vàng
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    } else {
      // Trường hợp không phải lừa đảo
      if (confidence >= 0.9) {
        // Confidence cao = hệ thống rất chắc chắn đây là bình thường → màu xanh (an toàn)
        return 'text-green-600 bg-green-50 border-green-200';
      }
      if (confidence >= 0.6) {
        // Confidence trung bình = tương đối chắc chắn là bình thường → màu vàng xanh
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      }
      // Confidence thấp = không chắc chắn lắm → màu xám (cần kiểm tra thêm)
      return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };
  
  // Convert confidence (0-1) to percentage (0-100)
  const confidencePercent = Math.round(result.riskScore * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
      className="bg-white rounded-xl border-2 border-gray-200 hover:border-gray-300 p-6 md:p-8 space-y-6 md:space-y-8 hover:shadow-xl transition-all duration-300"
    >
      {/* Transcript Section */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {t('results.transcript')}
        </h3>
        <div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-sm md:text-base text-gray-700 leading-relaxed bg-gradient-to-br from-gray-50 to-gray-100/50 p-4 md:p-5 rounded-xl border border-gray-200 shadow-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: reasoningResult.html }}
          />
          {reasoningResult.totalItems > 3 && (
            <button
              onClick={() => setShowAllAnalysis(!showAllAnalysis)}
              className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
            >
              {showAllAnalysis ? t('results.showLess') : t('results.showMore')}
              <svg 
                className={`w-4 h-4 transition-transform ${showAllAnalysis ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>
      </motion.div>

      {/* Confidence Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        {/* <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          {t('results.riskScore')}
        </h3> */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <motion.div
              className={`inline-flex items-center justify-center px-6 py-4 md:px-8 md:py-6 rounded-2xl border-4 shadow-xl ${getConfidenceColor(
                result.riskScore,
                result.flagged
              )}`}
              whileHover={{ scale: 1.08 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight">{confidencePercent}%</span>
            </motion.div>
            <div className="relative group">
              <svg 
                className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-help transition-colors" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <p className="leading-relaxed">
                  {result.riskScore < 0.5 
                    ? t('results.confidenceDescriptionLow', { percent: confidencePercent })
                    : result.flagged
                      ? t('results.confidenceDescriptionScam', { percent: confidencePercent })
                      : t('results.confidenceDescriptionNotScam', { percent: confidencePercent })
                  }
                </p>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                  <div className="w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-900"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Blacklist Form Section - Only show when flagged */}
      {result.flagged && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="space-y-3"
        >
          <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 border-2 border-gray-200 rounded-xl p-4 md:p-5 space-y-3">
            <h4 className="text-sm md:text-base font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              {t('results.blacklist.title')}
            </h4>
            <p className="text-xs md:text-sm text-gray-600">
              {t('results.blacklist.description')}
            </p>
            
            {blacklistSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 bg-green-50 border border-green-200 rounded-lg"
              >
                <p className="text-sm text-green-700 font-medium flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {t('results.blacklist.success')}
                </p>
              </motion.div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setIsSubmittingBlacklist(true);
                  setBlacklistError('');
                  
                  try {
                    const trimmedName = name.trim();
                    const trimmedPhone = phoneNumber.trim();

                    // Validation logic:
                    // - If phone is provided, name is required
                    // - If name is provided, phone is required (10-11 digits)
                    // - If both are empty, allow submission (both optional)

                    if (trimmedPhone && !trimmedName) {
                      setBlacklistError(t('results.blacklist.nameRequired'));
                      setIsSubmittingBlacklist(false);
                      return;
                    }

                    if (trimmedName && !trimmedPhone) {
                      setBlacklistError(t('results.blacklist.phoneRequired'));
                      setIsSubmittingBlacklist(false);
                      return;
                    }

                    // Validate phone number if provided (10 or 11 digits)
                    if (trimmedPhone) {
                      if (trimmedPhone.length !== 10 && trimmedPhone.length !== 11) {
                        setBlacklistError(t('results.blacklist.phoneError'));
                        setIsSubmittingBlacklist(false);
                        return;
                      }

                      // Validate phone contains only digits (double check)
                      if (!/^\d{10,11}$/.test(trimmedPhone)) {
                        setBlacklistError(t('results.blacklist.phoneError'));
                        setIsSubmittingBlacklist(false);
                        return;
                      }
                    }

                    const apiBaseUrl = 'https://api.blacklist.vn';

                    // Prepare payload according to API spec
                    const payload = {
                      name: trimmedName || undefined,
                      phone: trimmedPhone || undefined,
                      reasoning: result.transcript || '',
                      riskScore: result.riskScore,
                    };

                    const response = await fetch(`${apiBaseUrl}/api/records`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(payload),
                    });

                    if (!response.ok) {
                      let errorMessage = `Server error: ${response.status}`;
                      try {
                        const errorData = await response.json();
                        if (errorData.error) {
                          errorMessage = errorData.error.message || errorMessage;
                        } else if (errorData.message) {
                          errorMessage = errorData.message;
                        }
                      } catch (e) {
                        // Ignore parse errors
                      }
                      throw new Error(errorMessage);
                    }

                    const responseData = await response.json();
                    console.log('✅ Blacklist submitted successfully:', responseData);
                    
                    setBlacklistSuccess(true);
                    setName('');
                    setPhoneNumber('');
                    trackEvent('submit', 'blacklist', 'blacklist_submitted', Math.round(result.riskScore * 100));
                    
                    // Hide success message after 5 seconds
                    setTimeout(() => {
                      setBlacklistSuccess(false);
                    }, 5000);
                  } catch (error) {
                    console.error('❌ Error submitting blacklist:', error);
                    setBlacklistError(error instanceof Error ? error.message : t('results.blacklist.error'));
                    trackEvent('error', 'blacklist', 'blacklist_submit_failed', 0);
                  } finally {
                    setIsSubmittingBlacklist(false);
                  }
                }}
                className="space-y-3"
              >
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('results.blacklist.nameLabel')}
                    <span className="text-gray-400 text-xs ml-1">({t('results.blacklist.optional')})</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      // Clear error when user types
                      if (blacklistError && (blacklistError.includes('tên') || blacklistError.includes('name'))) {
                        setBlacklistError('');
                      }
                    }}
                    placeholder={t('results.blacklist.namePlaceholder')}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all ${
                      blacklistError && (blacklistError.includes('tên') || blacklistError.includes('name'))
                        ? 'border-red-300 bg-red-50' 
                        : 'border-gray-300'
                    }`}
                    disabled={isSubmittingBlacklist}
                  />
                </div>

                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('results.blacklist.phoneLabel')}
                    <span className="text-gray-400 text-xs ml-1">({t('results.blacklist.optional')})</span>
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => {
                      // Only allow numbers
                      const value = e.target.value.replace(/\D/g, '');
                      // Limit to 11 digits (allow 10-11)
                      if (value.length <= 11) {
                        setPhoneNumber(value);
                        // Clear error when user types
                        if (blacklistError && (blacklistError.includes('phone') || blacklistError.includes('số điện thoại'))) {
                          setBlacklistError('');
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      // Prevent non-numeric keys except backspace, delete, tab, arrow keys
                      if (!/[0-9]/.test(e.key) && 
                          !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) &&
                          !(e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                      }
                    }}
                    placeholder={t('results.blacklist.phonePlaceholder')}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all ${
                      blacklistError && (blacklistError.includes('phone') || blacklistError.includes('số điện thoại'))
                        ? 'border-red-300 bg-red-50' 
                        : 'border-gray-300'
                    }`}
                    disabled={isSubmittingBlacklist}
                    maxLength={11}
                  />
                  {phoneNumber && phoneNumber.length > 0 && phoneNumber.length !== 10 && phoneNumber.length !== 11 && (
                    <p className="mt-1 text-xs text-amber-600">
                      {t('results.blacklist.phoneHint')}
                    </p>
                  )}
                </div>
                
                {blacklistError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{blacklistError}</p>
                  </div>
                )}
                
                <motion.button
                  type="submit"
                  disabled={isSubmittingBlacklist}
                  whileHover={{ scale: isSubmittingBlacklist ? 1 : 1.02 }}
                  whileTap={{ scale: isSubmittingBlacklist ? 1 : 0.98 }}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-gray-900 to-gray-800 text-white font-semibold rounded-lg hover:from-gray-800 hover:to-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  {isSubmittingBlacklist ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>{t('results.blacklist.submitting')}</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span>{t('results.blacklist.button')}</span>
                    </>
                  )}
                </motion.button>
              </form>
            )}
          </div>
        </motion.div>
      )}

      {/* Scam Warning Section */}
      {result.flagged && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <motion.div
            initial={{ opacity: 0, x: -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            whileHover={{ x: 5, scale: 1.02 }}
            transition={{ 
              type: "spring",
              stiffness: 200
            }}
            className="flex items-center space-x-3 p-4 md:p-5 bg-gradient-to-br from-red-50 to-red-100/50 border-2 border-red-200 rounded-xl shadow-sm hover:shadow-md hover:border-red-300 transition-all duration-300"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <svg
                className="w-6 h-6 md:w-7 md:h-7 text-red-600 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className="text-sm sm:text-base md:text-lg font-bold text-red-700 break-words">
                {t('results.isScam')}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Share Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="pt-4 border-t border-gray-200"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">{t('results.share.title')}</h4>
            <p className="text-xs text-gray-500">{t('results.share.description')}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Facebook */}
            <motion.button
              onClick={() => handleShare('facebook')}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-colors"
              aria-label="Share on Facebook"
            >
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </motion.button>
            
            {/* Twitter */}
            <motion.button
              onClick={() => handleShare('twitter')}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 rounded-full bg-sky-500 hover:bg-sky-600 flex items-center justify-center transition-colors"
              aria-label="Share on Twitter"
            >
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
            </motion.button>
            
            {/* LinkedIn */}
            <motion.button
              onClick={() => handleShare('linkedin')}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 rounded-full bg-blue-700 hover:bg-blue-800 flex items-center justify-center transition-colors"
              aria-label="Share on LinkedIn"
            >
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

