import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * API Base URL from environment variables
 * Falls back to hardcoded URL for local development
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// console.log('🔧 API Config:', {
//   VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
//   API_BASE_URL,
//   fullURL: `${API_BASE_URL}/api/v1/detect-scam`,
// });

/**
 * API version
 */
const API_VERSION = 'v1';

/**
 * Create axios instance with default configuration
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api/${API_VERSION}`,
  timeout: 60000, // 60 seconds timeout for file uploads
  headers: {
    'Accept': 'application/json',
  },
});

// ============================================================================
// INTERCEPTORS
// ============================================================================

/**
 * Request Interceptor
 * Add auth tokens, logging, etc.
 */
apiClient.interceptors.request.use(
  (config) => {
    // console.log('🌐 API Request:', {
    //   method: config.method,
    //   url: config.url,
    //   baseURL: config.baseURL,
    //   fullURL: `${config.baseURL}${config.url}`,
    //   dataType: config.data?.constructor?.name,
    //   hasFormData: config.data instanceof FormData,
    // });
    
    // For FormData, let browser set Content-Type automatically with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    // Add any auth tokens here if needed
    // const token = getAuthToken();
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error: AxiosError) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handle common errors, transform responses, etc.
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle common API errors
    if (error.response) {
      const status = error.response.status;
      
      switch (status) {
        case 401:
          console.error('Unauthorized: Check API credentials');
          break;
        case 403:
          console.error('Forbidden: Access denied');
          break;
        case 404:
          console.error('Not found: API endpoint does not exist');
          break;
        case 422:
          console.error('Unprocessable Entity: Validation failed', error.response?.data);
          break;
        case 429:
          console.error('Too many requests: Rate limit exceeded');
          break;
        case 500:
          console.error('Server error: API is down');
          break;
        default:
          console.error(`API error ${status}:`, error.message);
      }
    } else if (error.request) {
      console.error('Network error: No response from server');
    } else {
      console.error('Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

// API Response from server
interface ApiScamDetectionResponse {
  reasoning: string;
  is_scam: boolean;
  confidence: number;
}

// Our frontend interface
export interface AnalysisResult {
  transcript: string;
  riskScore: number;
  flagged: boolean;
}

interface ApiError {
  message: string;
  code?: string;
  status?: number;
}
//DONATE Enums

// ContributionInterest
export enum ContributionInterest {
  SkillsTime = "Skills and time",
  ProjectData = "Project/Data",
  Infra = "Infrastructure",
  FinancialCommitment = "Financial Commitment"
}

// ContributionSkill
export enum ContributionSkill {
  AI_ML = "AI/ML",
  Software = "Software (FE/BE)",
  DesignUX = "Design/UX",
  Product = "Product",
  DataBI = "Data/BI",
  SecurityLegal = "Security/Legal",
  Moderation = "Moderation",
  GrowthContent = "Growth/Content"
}

// ParticipationTime
export enum ParticipationTime {
  AdHoc = "Ad-hoc / Mini Task",
  PartTime = "Part-time",
  FullTime = "Temporary full-time (per sprint)"
}
// --------------------
// Donate Interfaces
// --------------------
export interface DonateRequest {
  name: string;
  email: string;
  phone_number?: string;
  organization?: string;
  contribution_interest: ContributionInterest;
  contribution_skill?: ContributionSkill;
  participation_time?: ParticipationTime;
  referral_link?: string;
  note?: string;
  accept_information: boolean;
  accept_no_abuse: boolean;
}
export interface DonateResponse extends DonateRequest {
  id: number;
  created_at: string;
}

// --------------------
// Report Enums
// --------------------
// Category
export enum Category {
  PhoneNumber = "Phone Number",
  PersonnelKOL = "Personnel/KOL",
  Company = "Company",
  Event = "Event"
}

// Status
export enum Status {
  Draft = "Draft",
  Publish = "Publish",
  Blacklist = "Blacklist"
}

// ProofType
export enum ProofType {
  Image = "image",
  Video = "video",
  Audio = "audio"
}


// --------------------
// Report Interfaces
// --------------------
export interface ReportRequest {
  title: string;
  description: string;
  category: Category;
  detail?: string;
  proof_file?: string;
  proof_type?: ProofType;
  status: Status;
}

export interface ReportResponse extends ReportRequest {
  id: string;
  created_at: string;
  updated_at?: string;
}
// ============================================================================
// API SERVICES
// ============================================================================

/**
 * Detect scam in audio file
 * @param file - Audio file to analyze
 * @returns Analysis result with transcript, risk score, and flagged items
 * @throws ApiError if request fails
 */
export const analyzeAudio = async (file: File): Promise<AnalysisResult> => {
  try {
    // console.log('📤 Uploading file:', file.name, file.size, 'bytes', file.type);
    const formData = new FormData();
    formData.append('audio', file);

    const response = await apiClient.post<ApiScamDetectionResponse>('/detect-scam', formData);

    // console.log('📥 API response:', response.data);

    // Confidence là giá trị từ 0 → 1 (tương ứng 0% → 100% độ tin cậy)
    // Ví dụ: confidence = 0.95 nghĩa là hệ thống tin 95% rằng đoạn audio
    // có đặc điểm giống với các mẫu lừa đảo đã được huấn luyện
    const confidence = Math.max(0, Math.min(1, response.data.confidence || 0)); // Đảm bảo trong khoảng 0-1
    
    return {
      transcript: response.data.reasoning || '',
      riskScore: confidence, // Lưu confidence (0-1) để convert sang % ở UI
      flagged: response.data.is_scam || false
    };
  } catch (error) {
    console.error('❌ API error:', error);
    if (axios.isAxiosError(error)) {
      const apiError: ApiError = {
        message: error.response?.data?.message || error.message || 'Failed to analyze audio',
        code: error.code,
        status: error.response?.status,
      };
      throw apiError;
    }
    throw error;
  }
};

/**
 * Health check endpoint
 * @returns API health status
 */
export const healthCheck = async (): Promise<{ status: string; timestamp: string }> => {
  try {
    const response = await apiClient.get('/health');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw {
        message: 'Health check failed',
        status: error.response?.status,
      };
    }
    throw error;
  }
};

// --------------------
// Donate API Functions
// --------------------
export const createDonate = async (
  donateData: DonateRequest
): Promise<DonateResponse> => {
  try {
    const response = await apiClient.post<DonateResponse>("/api/v1/donates/", donateData);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw {
        message: error.response?.data?.detail || error.message,
        code: error.code,
        status: error.response?.status,
      };
    }
    throw error;
  }
};

// --------------------
// Report API Functions
// --------------------
export const createReport = async (
  reportData: ReportRequest
): Promise<ReportResponse> => {
  try {
    const response = await apiClient.post<ReportResponse>("/api//v1/reports/", reportData);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw {
        message: error.response?.data?.detail || error.message,
        code: error.code,
        status: error.response?.status,
      };
    }
    throw error;
  }
};
// ============================================================================
// EXPORTS
// ============================================================================

export { apiClient };
export type { ApiError };
