import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { getShareResult, ShareResult, getSavedFiles, SavedFile } from '../utils/storage';
import { SEO } from '../components/SEO';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ResultCard } from '../components/ResultCard';

export const Share = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [shareData, setShareData] = useState<ShareResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      navigate('/');
      return;
    }

    // Try to get from sessionStorage first
    let data = getShareResult(id);
    
    // If not found in sessionStorage, try localStorage as fallback
    if (!data) {
      // Try to find in saved files
      const savedFiles = getSavedFiles();
      const savedFile = savedFiles.find((f: SavedFile) => f.id === id);
      
      if (savedFile && savedFile.result) {
        // Found in saved files, use it
        data = {
          id: id,
          result: savedFile.result,
          createdAt: savedFile.uploadedAt || new Date().toISOString(),
        };
      }
    }
    
    // If still not found, try to reconstruct from URL params (for crawlers and direct links)
    if (!data) {
      const urlScore = searchParams.get('s');
      const urlFlagged = searchParams.get('f');
      
      if (urlScore && urlFlagged !== null) {
        // Reconstruct minimal result from URL params
        const score = parseFloat(urlScore) / 100;
        const flagged = urlFlagged === '1';
        
        data = {
          id: id,
          result: {
            transcript: '', // Will be empty if not in storage
            riskScore: score,
            flagged: flagged,
          },
          createdAt: new Date().toISOString(),
        };
      } else {
        // No data available, redirect to home silently
        navigate('/');
        return;
      }
    }

    setShareData(data);
    setLoading(false);
  }, [id, navigate, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 overflow-x-hidden w-full">
        <SEO
          title={`${t('results.share.title')} - ${t('common.appName')}`}
          description={t('results.share.description')}
        />
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">{t('common.loading')}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!shareData) {
    // Show loading state while redirecting (will be handled by useEffect)
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 overflow-x-hidden w-full">
        <SEO
          title={`${t('results.share.title')} - ${t('common.appName')}`}
          description={t('results.share.description')}
        />
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">{t('common.loading')}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const result = shareData.result;
  const score = Math.round(result.riskScore * 100);
  const status = result.flagged ? t('results.isScam') : t('results.safe');
  const title = `${status} - ${t('results.riskScore')}: ${score}% | ${t('common.appName')}`;
  
  // Build description from URL params if available (for crawlers) or from result
  const urlScore = searchParams.get('s');
  const urlFlagged = searchParams.get('f');
  let description = t('results.share.description');
  
  if (result.transcript) {
    description = result.transcript.substring(0, 200).replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  } else if (urlScore && urlFlagged) {
    // Fallback for crawlers when sessionStorage not available
    const urlStatus = urlFlagged === '1' ? t('results.isScam') : t('results.safe');
    description = `${urlStatus} - ${t('results.riskScore')}: ${urlScore}%`;
  }
  
  const shareUrl = window.location.href;
  // Use dynamic OG image generator
  const imageUrl = `${window.location.origin}/api/og-image?score=${score}&flagged=${result.flagged ? '1' : '0'}`;

  // Extract top 3 reasons for OG description
  const getTop3Reasons = (): string[] => {
    if (!result.transcript) return [];
    const processed = result.transcript.replace(/\\n/g, '\n');
    const lines = processed.split('\n').map(line => line.trim()).filter(line => line);
    const reasons: string[] = [];
    let count = 0;
    
    for (const line of lines) {
      if (line.startsWith('* ') && count < 3) {
        const content = line.substring(2).trim();
        if (!content.toLowerCase().startsWith('summary:')) {
          const colonIndex = content.indexOf(':');
          if (colonIndex > 0) {
            const desc = content.substring(colonIndex + 1).trim();
            reasons.push(desc.substring(0, 80));
          } else {
            reasons.push(content.substring(0, 80));
          }
          count++;
        }
      }
    }
    return reasons;
  };

  const topReasons = getTop3Reasons();
  const ogDescription = topReasons.length > 0 
    ? `${title}. ${topReasons.join(' ')}`
    : description;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 overflow-x-hidden w-full max-w-full">
      <SEO
        title={title}
        description={ogDescription}
        image={imageUrl}
        url={shareUrl}
      />
      <Navbar />
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Link
              to="/"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {t('results.share.backToHome')}
            </Link>
          </motion.div>

          <ResultCard result={result} showFullAnalysis={true} />
        </div>
      </main>
      <Footer />
    </div>
  );
};


