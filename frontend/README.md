# Blacklist.vn - AI Phát hiện Lừa đảo qua Giọng nói

A community AI platform to detect scam voices through audio analysis.

---

## 📋 Mục lục

1. [Tổng quan](#tổng-quan)
2. [Tech Stack](#tech-stack)
3. [Cài đặt & Chạy](#cài-đặt--chạy)
4. [Environment Variables](#environment-variables)
5. [Cấu trúc Project](#cấu-trúc-project)
6. [Tính năng](#tính-năng)
7. [API Integration](#api-integration)
8. [Strapi Setup cho Donate Form](#strapi-setup-cho-donate-form)
9. [Share Feature](#share-feature)
10. [Google Analytics](#google-analytics)
11. [Deployment](#deployment)
12. [Troubleshooting](#troubleshooting)

---

## Tổng quan

Blacklist.vn là nền tảng AI phát hiện lừa đảo qua phân tích giọng nói, giúp bảo vệ người dùng khỏi các cuộc gọi lừa đảo thông qua công nghệ AI tiên tiến.

---

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Animations**: Framer Motion
- **i18n**: react-i18next
- **SEO**: react-helmet-async
- **Backend**: Strapi (cho Donate Form)
- **Deployment**: Vercel

---

## Cài đặt & Chạy

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Ứng dụng sẽ chạy tại `http://localhost:5173`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

---

## Environment Variables

### Frontend `.env` File

Tạo file `.env` trong thư mục root với nội dung:

```env
# API Configuration (cho audio analysis)
VITE_API_BASE_URL=https://scam-detect.techainer.com

# Strapi Configuration (cho donate form)
VITE_STRAPI_URL=http://localhost:1337
VITE_STRAPI_API_TOKEN=your-api-token-here

# Google Analytics (optional - để trống nếu không dùng)
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Kiểm tra Environment Variables

#### Vấn đề: "Vui lòng cấu hình Strapi trong file .env"

**Bước 1**: Kiểm tra file `.env` có tồn tại

```bash
ls -la | grep .env
```

**Bước 2**: Tạo file `.env` nếu chưa có

```bash
touch .env
```

**Bước 3**: Thêm nội dung vào `.env`

```env
VITE_STRAPI_URL=https://your-project.strapi.cloud
VITE_STRAPI_API_TOKEN=your-token-here
```

**Lưu ý quan trọng:**
- ❌ KHÔNG có dấu cách trước/sau dấu `=`
- ❌ KHÔNG có dấu ngoặc kép `"` hay `'`
- ❌ URL KHÔNG có `/api` ở cuối

**Bước 4**: Restart Dev Server

Sau khi thêm/sửa `.env`, **BẮT BUỘC** phải restart:

```bash
# Dừng server (Ctrl+C)
# Sau đó start lại
npm run dev
```

**Lý do:** Vite chỉ đọc `.env` khi start, không tự động reload!

**Bước 5**: Kiểm tra trong Console

Mở DevTools (F12) → Console và chạy:

```javascript
console.log('STRAPI_URL:', import.meta.env.VITE_STRAPI_URL);
console.log('STRAPI_TOKEN:', import.meta.env.VITE_STRAPI_API_TOKEN);
```

Nếu thấy `undefined` → `.env` chưa được load hoặc format sai.

### Với Vercel Production

Thêm env variables trong Vercel Dashboard:
1. Vào Project → Settings → Environment Variables
2. Thêm từng biến:
   - `VITE_API_BASE_URL` = URL của API
   - `VITE_STRAPI_URL` = URL của Strapi
   - `VITE_STRAPI_API_TOKEN` = Token
   - `VITE_GA_MEASUREMENT_ID` = Google Analytics Measurement ID (optional)
3. Redeploy lại project

---

## Cấu trúc Project

```
src/
├── pages/
│   ├── Landing.tsx      # Landing page với hero và features
│   ├── Login.tsx        # Email login page
│   ├── Dashboard.tsx    # Main dashboard với file upload và analysis
│   ├── Files.tsx        # Danh sách files đã scan
│   ├── Profile.tsx      # User profile với export/delete data
│   ├── Voice.tsx        # Voice recording page
│   ├── Contact.tsx       # Contact page
│   ├── About.tsx        # About Us page
│   ├── FAQ.tsx          # FAQ page
│   ├── Donate.tsx       # Donate form page
│   ├── Share.tsx        # Share result page
│   ├── Privacy.tsx      # Privacy policy
│   └── Terms.tsx        # Terms of service
├── components/
│   ├── Navbar.tsx       # Navigation bar
│   ├── Footer.tsx       # Footer component
│   ├── Logo.tsx         # Logo component
│   ├── SEO.tsx          # SEO meta tags component
│   ├── FileUploader.tsx # File upload component với drag & drop
│   ├── ResultCard.tsx   # Analysis result display component với share buttons
│   ├── Captcha.tsx      # CAPTCHA component
│   ├── VoiceRecorder.tsx # Voice recording component
│   ├── LanguageSwitcher.tsx # Language switcher
│   └── CookieConsent.tsx # Cookie consent banner
├── utils/
│   ├── api.ts          # API client với axios interceptors
│   ├── auth.ts         # LocalStorage authentication utilities
│   └── storage.ts      # File và profile storage utilities
├── i18n/
│   ├── config.ts       # i18n configuration
│   └── locales/
│       ├── vi.json     # Vietnamese translations
│       └── en.json     # English translations
├── App.tsx             # Main app với routing
└── main.tsx            # Entry point

api/
├── share/
│   └── [id].ts         # Serverless function cho share URLs
└── og-image.ts         # Dynamic OG image generator
```

---

## Tính năng

- 🎤 **Voice to text conversion**: Chuyển đổi audio thành text
- 🔍 **Scam pattern detection**: Phát hiện mẫu lừa đảo
- 📊 **Risk score evaluation**: Đánh giá điểm rủi ro (0-100%)
- 🔐 **Simple email-based authentication**: Xác thực bằng email (localStorage)
- 📱 **Responsive design**: Thiết kế responsive cho mọi thiết bị
- ✨ **Smooth animations**: Animation mượt mà với Framer Motion
- 🌐 **Multi-language support**: Hỗ trợ tiếng Việt và tiếng Anh
- 📤 **Share results**: Chia sẻ kết quả lên Facebook, Twitter, LinkedIn
- 🎨 **Dynamic OG images**: Tự động tạo thumbnail khi share
- 💾 **Data management**: Export và xóa dữ liệu cá nhân
- 📝 **Donate form**: Form đóng góp với Strapi backend

---

## API Integration

### Architecture

API layer theo pattern **senior dev architecture** với:

- ✅ **Centralized Configuration**: Single source of truth cho API base URL
- ✅ **Environment Variables**: Secure configuration qua Vercel
- ✅ **Axios Instance**: Reusable HTTP client với interceptors
- ✅ **Error Handling**: Comprehensive error catching và logging
- ✅ **Type Safety**: Full TypeScript interfaces
- ✅ **Scalable Structure**: Dễ dàng thêm endpoints mới

### Configuration

**Base Configuration**:

```typescript
// src/utils/api.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://scam-detect.techainer.com';
const API_VERSION = 'v1';
```

**Full API URL Structure**: `{API_BASE_URL}/api/{API_VERSION}/{endpoint}`

### Available Endpoints

#### 1. Detect Scam (`/detect-scam`)

**Method**: `POST`  
**Content-Type**: `multipart/form-data`  
**Param**: `file` (audio file)

**Usage**:
```typescript
import { analyzeAudio } from '@/utils/api';

const file = event.target.files[0];
const result = await analyzeAudio(file);

console.log(result.transcript);    // "Xin chào, tôi gọi từ..."
console.log(result.riskScore);     // 0.85
console.log(result.flagged);        // true/false
```

**Response Interface**:
```typescript
interface AnalysisResult {
  transcript: string;
  riskScore: number;  // 0-1
  flagged: boolean;
}
```

#### 2. Health Check (`/health`)

**Method**: `GET`  
**Purpose**: Kiểm tra API availability

**Usage**:
```typescript
import { healthCheck } from '@/utils/api';

const health = await healthCheck();
console.log(health.status);        // "ok"
console.log(health.timestamp);     // "2025-01-XX..."
```

### Error Handling

API client tự động xử lý:

- ✅ **401 Unauthorized**: Missing/invalid credentials
- ✅ **403 Forbidden**: Access denied
- ✅ **404 Not Found**: Endpoint không tồn tại
- ✅ **429 Rate Limit**: Too many requests
- ✅ **500 Server Error**: API is down
- ✅ **Network Error**: No internet connection

### Adding New Endpoints

**Step 1**: Update Types

```typescript
// src/utils/api.ts

export interface NewApiResponse {
  data: string;
  count: number;
}
```

**Step 2**: Create Service Function

```typescript
// src/utils/api.ts

export const yourNewFunction = async (param: string): Promise<NewApiResponse> => {
  try {
    const response = await apiClient.post<NewApiResponse>('/your-endpoint', {
      param,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const apiError: ApiError = {
        message: error.response?.data?.message || error.message,
        code: error.code,
        status: error.response?.status,
      };
      throw apiError;
    }
    throw error;
  }
};
```

**Step 3**: Use in Components

```typescript
import { yourNewFunction } from '@/utils/api';

const MyComponent = () => {
  const handleAction = async () => {
    try {
      const result = await yourNewFunction('value');
      console.log(result);
    } catch (error) {
      console.error('API error:', error);
    }
  };
};
```

---

## Strapi Setup cho Donate Form

### Option 1: Strapi Cloud (Khuyến nghị - Nhanh nhất)

#### Bước 1: Đăng ký Strapi Cloud

1. Truy cập: https://cloud.strapi.io
2. Sign up / Login với GitHub hoặc Email
3. Click **Create new project**

#### Bước 2: Tạo Project

- **Name**: `blacklist-donate` (hoặc tên bạn muốn)
- **Region**: Chọn gần nhất (Singapore/Europe)
- **Plan**: Free tier (đủ dùng)
- Click **Create project**

#### Bước 3: Setup Admin Account

1. Mở Admin URL: `https://your-project-admin.strapi.cloud`
2. Tạo admin account (email + password)
3. Đăng nhập vào Admin Panel

#### Bước 4: Tạo Content Type

1. Vào **Content-Type Builder**
2. **Create new collection type**: `Donate Submission`
3. Thêm các fields:

| Field Name | Type | Required |
|------------|------|----------|
| `fullName` | Text (Short) | ✅ |
| `email` | Email | ✅ |
| `phone` | Text (Short) | ❌ |
| `organization` | Text (Short) | ❌ |
| `contributionTypes` | JSON | ❌ |
| `skills` | JSON | ❌ |
| `timeCommitment` | Enumeration | ❌ |
| `referralLink` | Text (Long) | ❌ |
| `notes` | Text (Long) | ❌ |

**Enumeration `timeCommitment` values:**
- `ad-hoc`
- `part-time`
- `full-time`

4. Click **Save**

#### Bước 5: Setup Permissions

1. **Settings** → **Roles & Permissions** → **Roles** → **Public**
2. Tìm **Donate Submission**
3. Tick **create** ✅
4. Click **Save**

#### Bước 6: Tạo API Token

1. **Settings** → **API Tokens**
2. Click **Create new API Token**
3. Điền:
   - **Name**: `Donate Form Token`
   - **Token duration**: `Unlimited`
   - **Token type**: `Full access` (hoặc Custom với quyền `create` cho `donate-submission`)
4. Click **Save**
5. **Copy token ngay** (chỉ hiện 1 lần!)

#### Bước 7: Update Frontend `.env`

Thêm vào `.env` của frontend:

```env
VITE_STRAPI_URL=https://your-project.strapi.cloud
VITE_STRAPI_API_TOKEN=your-copied-token-here
```

**Lưu ý**: Không có `/api` trong URL, Strapi tự động thêm!

### Option 2: Local Strapi Development

#### Bước 1: Start Strapi Backend

```bash
cd ../chongluadao_be  # vào thư mục Strapi
npm run develop
```

**Đợi đến khi thấy:**
```
Server started on http://0.0.0.0:1337
```

Mở: http://localhost:1337/admin

#### Bước 2: Tạo Content Type

Giống như Strapi Cloud (Bước 4-5 ở trên)

#### Bước 3: Tạo API Token

1. Vào http://localhost:1337/admin
2. **Settings** → **API Tokens** → **Create new token**
3. Copy token

#### Bước 4: Update Frontend `.env`

```env
VITE_STRAPI_URL=http://localhost:1337
VITE_STRAPI_API_TOKEN=your-token-here
```

### Testing Strapi API

Sau khi setup xong, test API bằng curl:

```bash
curl -X POST https://your-strapi-url/api/donate-submissions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -d '{
    "data": {
      "fullName": "Test User",
      "email": "test@example.com",
      "contributionTypes": ["skills-time"],
      "skills": ["ai-ml"],
      "timeCommitment": "part-time"
    }
  }'
```

### Lưu ý về Environment Variables

**❌ KHÔNG có trong Strapi backend `.env`**

File `.env` của Strapi backend (trong thư mục `chongluadao_be`) chứa:
- `HOST`, `PORT`: Cấu hình server
- `APP_KEYS`, `API_TOKEN_SALT`, `JWT_SECRET`: Security keys
- `DATABASE_CLIENT`, `DATABASE_FILENAME`: Database config

**KHÔNG có** `VITE_STRAPI_URL` hay `VITE_STRAPI_API_TOKEN` ở đây!

**✅ Cần thêm vào Frontend `.env`**

Trong thư mục **frontend** (`chongluadao`), tạo file `.env` với:

```env
# Strapi Configuration
VITE_STRAPI_URL=http://localhost:1337
VITE_STRAPI_API_TOKEN=your-api-token-here
```

**Cách lấy API Token:**

1. Start Strapi backend
2. Truy cập Admin Panel: http://localhost:1337/admin
3. **Settings** → **API Tokens** → **Create new API Token**
4. Copy token và thêm vào frontend `.env`

**Lưu ý:**
- API Token KHÔNG phải là `JWT_SECRET` hay `APP_KEYS`
- API Token PHẢI tạo từ Strapi Admin Panel
- ⚠️ KHÔNG commit `.env` vào Git

---

## Share Feature

### Overview

Hệ thống share cho phép người dùng chia sẻ kết quả scan lên Facebook, Twitter, và LinkedIn với preview đầy đủ bao gồm:
- Risk Score và status (Lừa đảo/An toàn)
- Dynamic OG Image được generate tự động
- Meta tags đầy đủ cho SEO và social sharing

### Architecture

#### 1. Frontend Components

- **`src/components/ResultCard.tsx`**: Nút share và tạo share URL
- **`src/pages/Share.tsx`**: Trang hiển thị kết quả share

#### 2. API Routes (Serverless Functions)

- **`api/share/[id].ts`**: Render HTML với meta tags cho crawlers
- **`api/og-image.ts`**: Generate dynamic OG image (SVG) dựa trên score và flagged status

#### 3. Configuration

- **`vercel.json`**: Rewrite rules để route `/share/:id` đến API function
- **`index.html`**: Pre-render script để update meta tags trước khi React load

### How It Works

#### Flow khi user share:

1. User bấm nút share trên `ResultCard`
2. Hệ thống tạo share URL: `/share/{id}?s={score}&f={flagged}`
3. Data được lưu vào `sessionStorage` với key `blacklist_share_results`
4. Share URL được mở trong popup window

#### Flow khi crawler truy cập:

1. Vercel rewrite rule route `/share/:id` → `/api/share/:id`
2. API function đọc query params (`s` và `f`) để build meta tags
3. API function trả về HTML với:
   - Full Open Graph tags
   - Twitter Card tags
   - Dynamic OG image URL (`/api/og-image?score=X&flagged=Y`)
   - Redirect script để chuyển đến SPA sau khi crawler đã đọc

#### OG Image Generation:

- Endpoint: `/api/og-image?score={score}&flagged={0|1}`
- Format: SVG (1200x630px)
- Content: Status badge, Risk score, Brand name
- Color scheme: Red cho scam, Green cho safe

### Testing

#### Local Development

1. Run `npm run dev`
2. Test share URL: `http://localhost:5173/share/{id}?s=85&f=1`
3. Kiểm tra meta tags trong DevTools → Elements → `<head>`

#### Production Testing

Sau khi deploy lên Vercel, test với:
- **Facebook**: https://developers.facebook.com/tools/debug/
- **Twitter**: https://cards-dev.twitter.com/validator
- **LinkedIn**: Share URL và kiểm tra preview

#### Debug Tips

- Kiểm tra Network tab để xem API responses
- Dùng curl để test API endpoints:
  ```bash
  curl https://your-domain.com/api/share/123?s=85&f=1
  curl https://your-domain.com/api/og-image?score=85&flagged=1
  ```

### Performance

- OG images được cache 1 year (immutable)
- Share HTML được cache 1 hour với stale-while-revalidate 24 hours
- SessionStorage được clear khi đóng tab (privacy)

### Security

- Share data chỉ lưu trong sessionStorage (client-side only)
- Không expose sensitive data trong URLs
- API functions không lưu trữ data persistent

---

## Google Analytics

### Setup Google Analytics

1. **Tạo Google Analytics Property**
   - Vào [Google Analytics](https://analytics.google.com/)
   - Tạo Property mới hoặc sử dụng Property hiện có
   - Lấy **Measurement ID** (format: `G-XXXXXXXXXX`)

2. **Thêm vào Environment Variables**
   
   Thêm vào file `.env`:
   ```env
   VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```
   
   Hoặc trong Vercel Dashboard:
   - Project → Settings → Environment Variables
   - Thêm `VITE_GA_MEASUREMENT_ID` với giá trị là Measurement ID

3. **Features**
   - ✅ Tự động track page views khi chuyển trang
   - ✅ Track custom events (nếu cần)
   - ✅ Chỉ load khi có GA_MEASUREMENT_ID (optional)

### Sử dụng Custom Events

Để track custom events, import và sử dụng:

```typescript
import { trackEvent } from '../components/GoogleAnalytics';

// Track button click
trackEvent('click', 'button', 'share_facebook');

// Track form submission
trackEvent('submit', 'form', 'donate_form', 1);
```

**Parameters:**
- `action`: Hành động (ví dụ: 'click', 'submit', 'download')
- `category`: Danh mục (ví dụ: 'button', 'form', 'video')
- `label`: Nhãn mô tả (optional)
- `value`: Giá trị số (optional)

### Kiểm tra

1. Mở Google Analytics → Realtime
2. Truy cập website
3. Xem realtime data trong GA dashboard

---

## Deployment

### Vercel Deployment

1. Push code lên GitHub
2. Import project trong Vercel
3. Vercel sẽ auto-detect Vite và configure build settings
4. Thêm Environment Variables trong Vercel Dashboard:
   - `VITE_API_BASE_URL`
   - `VITE_STRAPI_URL`
   - `VITE_STRAPI_API_TOKEN`
5. Deploy!

### Vercel Configuration

File `vercel.json` đã được cấu hình với:
- Rewrite rules cho share URLs
- Cache headers cho OG images
- Framework detection cho Vite

---

## Troubleshooting

### ❌ Lỗi: "Strapi configuration is missing"

- Kiểm tra `.env` có đúng format (không có space/quotes)
- `VITE_STRAPI_URL` không có `/api` ở cuối
- Đã restart dev server sau khi thêm/sửa `.env`
- Console không báo `undefined` cho các biến

### ❌ Lỗi: "403 Forbidden" hoặc "401 Unauthorized"

- Kiểm tra API Token có đúng không
- Kiểm tra Permissions: Public role phải có `create` permission
- Kiểm tra Token type: Phải là `Full access` hoặc có quyền `create`

### ❌ Lỗi: "404 Not Found"

- Kiểm tra `VITE_STRAPI_URL` có đúng không
- Kiểm tra Content Type name: Phải là `donate-submission` (Strapi tự convert)
- URL đúng format: `${VITE_STRAPI_URL}/api/donate-submissions`

### ❌ Lỗi: "Network Error"

- Kiểm tra Strapi backend đang chạy không (http://localhost:1337/admin)
- Kiểm tra CORS settings trong Strapi (nếu deploy production)

### ❌ Share preview không hiển thị

- Test URL với Facebook Debugger hoặc Twitter Validator
- Kiểm tra OG image URL có accessible không
- Kiểm tra meta tags có đầy đủ không
- Clear cache của social media crawlers

### ✅ Checklist Debug

- [ ] File `.env` tồn tại và đúng format
- [ ] Đã restart dev server sau khi sửa `.env`
- [ ] Strapi backend đang chạy (nếu local)
- [ ] API Token đã được tạo từ Strapi Admin Panel
- [ ] Permissions đã được setup đúng
- [ ] Network tab không có errors
- [ ] Console không có undefined variables

---

## Resources

- **API Documentation**: https://scam-detect.techainer.com/docs
- **Vercel Env Variables**: https://vercel.com/docs/environment-variables
- **Strapi Cloud**: https://cloud.strapi.io
- **Axios Docs**: https://axios-http.com/
- **Facebook Debugger**: https://developers.facebook.com/tools/debug/
- **Twitter Card Validator**: https://cards-dev.twitter.com/validator

---

## License

MIT
