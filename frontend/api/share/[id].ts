import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // Debug logging (will appear in Vercel logs)
  console.log('🔍 Share API called:', {
    url: req.url,
    method: req.method,
    query: req.query,
    headers: {
      host: req.headers.host,
      'user-agent': req.headers['user-agent'],
    },
  });

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    console.error('❌ Missing or invalid ID:', id);
    return res.status(404).send('Not found');
  }

  // Parse query params for share data
  // Vercel passes query params in req.query
  let score = (req.query.s as string) || (req.query.score as string) || '0';
  let flagged = req.query.f === '1' || req.query.flagged === '1';
  
  // Also try parsing from URL if available
  const fullUrl = req.url || '';
  const queryString = fullUrl.includes('?') ? fullUrl.split('?')[1] : '';
  if (queryString) {
    const urlParams = new URLSearchParams(queryString);
    const urlScore = urlParams.get('s');
    const urlFlagged = urlParams.get('f');
    if (urlScore) {
      score = urlScore;
    }
    if (urlFlagged !== null) {
      flagged = urlFlagged === '1';
    }
  }

  // Build meta tags
  const status = flagged ? 'Lừa đảo' : 'An toàn';
  const title = `${status} - Điểm rủi ro: ${score}% | Blacklist.vn`;
  const description = `${status} - Điểm rủi ro: ${score}%. Kết quả phân tích lừa đảo qua giọng nói với công nghệ AI tiên tiến.`;
  
  // Get base URL from request headers (for production) or fallback
  const host = req.headers.host || '';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = host ? `${protocol}://${host}` : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://blacklist.vn');
  
  const queryParams = queryString ? `?${queryString}` : '';
  const shareUrl = `${baseUrl}/share/${id}${queryParams}`;
  const imageUrl = `${baseUrl}/api/og-image?score=${score}&flagged=${flagged ? '1' : '0'}`;
  
  // Debug logging
  console.log('✅ Generated share data:', {
    id,
    score,
    flagged,
    status,
    title,
    baseUrl,
    shareUrl,
    imageUrl,
  });
  
  // Return HTML with full meta tags that crawlers can read
  // Use proper escaping for HTML
  const escapedTitle = title.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const escapedDescription = description.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  
  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapedTitle}</title>
  <meta name="title" content="${escapedTitle}" />
  <meta name="description" content="${escapedDescription}" />
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${shareUrl}" />
  <meta property="og:title" content="${escapedTitle}" />
  <meta property="og:description" content="${escapedDescription}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="image/svg+xml" />
  <meta property="og:image:secure_url" content="${imageUrl}" />
  <meta property="og:site_name" content="Blacklist.vn" />
  <meta property="og:locale" content="vi_VN" />
  <meta property="og:locale:alternate" content="en_US" />
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${shareUrl}" />
  <meta name="twitter:title" content="${escapedTitle}" />
  <meta name="twitter:description" content="${escapedDescription}" />
  <meta name="twitter:image" content="${imageUrl}" />
  <meta name="twitter:image:alt" content="${escapedTitle}" />
  <meta name="twitter:site" content="@blacklistvn" />
  <meta name="twitter:creator" content="@blacklistvn" />
  
  <!-- LinkedIn - uses same Open Graph tags but ensure secure_url -->
  
  <!-- Additional SEO -->
  <meta name="theme-color" content="${flagged ? '#DC2626' : '#059669'}" />
  <link rel="canonical" href="${shareUrl}" />
  
  <!-- Prevent indexing of share pages by default (they're temporary) -->
  <meta name="robots" content="noindex, nofollow" />
</head>
<body>
  <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui, -apple-system, sans-serif; padding: 20px; background: ${flagged ? '#DC2626' : '#059669'};">
    <div style="text-align: center; max-width: 600px; color: white;">
      <h1 style="font-size: 2.5rem; margin-bottom: 1rem; font-weight: bold;">${status}</h1>
      <p style="font-size: 1.5rem; margin-bottom: 2rem;">Risk Score: <strong>${score}%</strong></p>
      <p style="color: rgba(255,255,255,0.9); margin-bottom: 2rem;">Loading full results...</p>
    </div>
  </div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(html);
}

