import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  // Debug logging
  console.log('🖼️ OG Image API called:', {
    url: req.url,
    query: req.query,
    score: req.query.score,
    flagged: req.query.flagged,
  });

  const { score = '0', flagged = '0' } = req.query;
  
  const isScam = flagged === '1';
  const riskScore = parseInt(score as string) || 0;
  
  console.log('✅ Generating OG image:', {
    score,
    flagged,
    isScam,
    riskScore,
  });
  
  // Colors
  const bgColor = isScam ? '#DC2626' : '#059669'; // red or green
  const textColor = '#FFFFFF';
  
  // Generate SVG image (1200x630 for OG)
  // Simple design with only English text to avoid font issues
  const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${isScam ? '#991B1B' : '#047857'};stop-opacity:1" />
      </linearGradient>
      <filter id="shadow">
        <feDropShadow dx="0" dy="3" stdDeviation="4" flood-opacity="0.4"/>
      </filter>
    </defs>
    <!-- Background -->
    <rect width="1200" height="630" fill="url(#grad)"/>
    
    <!-- Brand name -->
    <text x="600" y="280" font-family="Arial, Helvetica, sans-serif" font-size="72" font-weight="bold" fill="${textColor}" text-anchor="middle" filter="url(#shadow)">Blacklist.vn</text>
    
    <!-- Risk Score -->
    <text x="600" y="380" font-family="Arial, Helvetica, sans-serif" font-size="96" font-weight="900" fill="${textColor}" text-anchor="middle" filter="url(#shadow)">Risk Score: ${riskScore}%</text>
  </svg>`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.status(200).send(svg);
}

