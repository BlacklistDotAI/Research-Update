#!/bin/bash
echo "🧪 Test Strapi API"
echo ""
echo "Nhập Strapi URL (ví dụ: https://your-project.strapi.cloud):"
read STRAPI_URL
echo ""
echo "Nhập API Token:"
read API_TOKEN
echo ""
echo "Testing API..."
echo ""

curl -X POST "${STRAPI_URL}/api/donate-submissions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -d '{
    "data": {
      "fullName": "Test User",
      "email": "test@example.com",
      "contributionTypes": ["skills-time"],
      "skills": ["ai-ml"],
      "timeCommitment": "part-time"
    }
  }'

echo ""
echo ""
echo "✅ Nếu thấy 200 OK → API hoạt động!"
echo "❌ Nếu 403/401 → Check permissions hoặc token"
