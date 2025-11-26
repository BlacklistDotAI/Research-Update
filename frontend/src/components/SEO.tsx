import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
}

export const SEO = ({
  title,
  description,
  keywords,
  image = '/og-image.jpg',
  url = 'https://blacklist.vn',
}: SEOProps) => {
  const { t, i18n } = useTranslation();
  
  const defaultTitle = `${t('common.appName')} - ${t('common.tagline')}`;
  const defaultDescription = t('landingAbout.paragraph1');
  
  const finalTitle = title || defaultTitle;
  const finalDescription = (description || defaultDescription).substring(0, 200); // Limit description length
  const finalKeywords = keywords || 'AI, scam detection, voice analysis, lừa đảo, phát hiện lừa đảo, trí tuệ nhân tạo, bảo mật, an toàn';
  
  // Handle URLs - if url prop is provided and is absolute, use it; otherwise construct from current location
  let finalUrl: string;
  if (url && url.startsWith('http')) {
    finalUrl = url;
  } else if (typeof window !== 'undefined') {
    finalUrl = window.location.href;
  } else {
    finalUrl = url || 'https://blacklist.vn';
  }
  
  // Handle images - if image prop is provided and is absolute, use it; otherwise construct absolute URL
  let finalImage: string;
  if (image && image.startsWith('http')) {
    finalImage = image;
  } else {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://blacklist.vn';
    finalImage = `${baseUrl}${image || '/og-image.jpg'}`;
  }

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{finalTitle}</title>
      <meta name="title" content={finalTitle} />
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords} />
      <meta name="language" content={i18n.language} />
      <meta name="author" content="blacklist.vn" />
      <meta name="robots" content="index, follow" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={finalUrl} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:site_name" content={t('common.appName')} />
      <meta property="og:locale" content={i18n.language === 'vi' ? 'vi_VN' : 'en_US'} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={finalUrl} />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={finalImage} />
      <meta name="twitter:image:alt" content={finalTitle} />
      
      {/* LinkedIn - uses Open Graph tags, but ensure image is set */}
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:type" content="image/svg+xml" />
      
      {/* Additional SEO */}
      <meta name="theme-color" content="#111827" />
      <link rel="canonical" href={finalUrl} />
      <html lang={i18n.language} />
    </Helmet>
  );
};

