#!/bin/bash

# Test Share API Script
# Thay YOUR_DOMAIN bằng domain thực của bạn trên Vercel

DOMAIN="${1:-blacklist.vn}"  # Sử dụng argument hoặc default
SHARE_ID="test123"
SCORE="85"
FLAGGED="1"

echo "🔍 Testing Share API for domain: $DOMAIN"
echo "=========================================="
echo ""

echo "1️⃣ Testing Rewrite Rule (should route to API):"
echo "URL: https://$DOMAIN/share/$SHARE_ID?s=$SCORE&f=$FLAGGED"
echo ""
curl -s "https://$DOMAIN/share/$SHARE_ID?s=$SCORE&f=$FLAGGED" | head -40
echo ""
echo "---"
echo ""

echo "2️⃣ Testing Direct API Endpoint:"
echo "URL: https://$DOMAIN/api/share/$SHARE_ID?s=$SCORE&f=$FLAGGED"
echo ""
curl -s "https://$DOMAIN/api/share/$SHARE_ID?s=$SCORE&f=$FLAGGED" | head -40
echo ""
echo "---"
echo ""

echo "3️⃣ Testing OG Image Endpoint:"
echo "URL: https://$DOMAIN/api/og-image?score=$SCORE&flagged=$FLAGGED"
echo ""
curl -I "https://$DOMAIN/api/og-image?score=$SCORE&flagged=$FLAGGED" 2>&1 | head -10
echo ""

echo "4️⃣ Checking Response Headers:"
echo ""
echo "Share URL Headers:"
curl -I "https://$DOMAIN/share/$SHARE_ID?s=$SCORE&f=$FLAGGED" 2>&1 | grep -E "HTTP|Content-Type|Location"
echo ""
echo "Direct API Headers:"
curl -I "https://$DOMAIN/api/share/$SHARE_ID?s=$SCORE&f=$FLAGGED" 2>&1 | grep -E "HTTP|Content-Type|Location"
echo ""

echo "✅ Test completed!"
echo ""
echo "📝 What to look for:"
echo "   - Both requests should return HTML (200 OK)"
echo "   - HTML should contain <title> tag with 'Lừa đảo' or 'An toàn'"
echo "   - HTML should contain og:image meta tag pointing to /api/og-image"
echo "   - If rewrite works: Both responses should be identical"
echo "   - OG Image should return SVG (Content-Type: image/svg+xml)"

