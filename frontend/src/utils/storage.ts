import { AnalysisResult } from './api';

export interface SavedFile {
  id: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  result: AnalysisResult;
}

const STORAGE_KEY = 'nghelabiet_user_files';
const PROFILE_KEY = 'nghelabiet_user_profile';

export interface UserProfile {
  fullName: string;
  email: string;
}

// File Management
export const saveFile = (file: File, result: AnalysisResult): SavedFile => {
  const savedFile: SavedFile = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    fileName: file.name,
    fileSize: file.size,
    uploadedAt: new Date().toISOString(),
    result,
  };

  const files = getSavedFiles();
  files.unshift(savedFile); // Add to beginning
  localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
  return savedFile;
};

export const getSavedFiles = (): SavedFile[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  
  // Return sample data for demo purposes
  return [
    {
      id: 'sample-1',
      fileName: 'cuoc_goi_lua_dao_1.mp3',
      fileSize: 2048576, // 2MB
      uploadedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      result: {
        transcript: "Xin chào, tôi gọi từ ngân hàng ABC. Chúng tôi có chương trình cho vay với lãi suất 0% đặc biệt dành cho bạn. Bạn chỉ cần cung cấp thông tin cá nhân và số thẻ tín dụng để xác minh...",
        riskScore: 0.85, // confidence 0-1
        flagged: true
      }
    },
    {
      id: 'sample-2',
      fileName: 'tin_nhan_quang_cao.wav',
      fileSize: 1536000, // 1.5MB
      uploadedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      result: {
        transcript: "Chúc mừng! Bạn đã trúng thưởng 1 tỷ đồng! Hãy gọi ngay số hotline 1900-xxx-xxx để nhận thưởng. Chỉ cần thanh toán phí xử lý 500.000 đồng...",
        riskScore: 0.95, // confidence 0-1
        flagged: true
      }
    },
    {
      id: 'sample-3',
      fileName: 'cuoc_goi_hop_phap.m4a',
      fileSize: 3072000, // 3MB
      uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      result: {
        transcript: "Xin chào, tôi là nhân viên từ công ty bảo hiểm XYZ. Chúng tôi muốn tư vấn cho bạn về gói bảo hiểm sức khỏe mới. Bạn có thể dành 10 phút để nghe tư vấn không?",
        riskScore: 0.30, // confidence 0-1 (30% tin rằng đây là bình thường)
        flagged: false
      }
    },
    {
      id: 'sample-4',
      fileName: 'thong_bao_ngan_hang.aac',
      fileSize: 1024000, // 1MB
      uploadedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
      result: {
        transcript: "Thông báo từ ngân hàng: Tài khoản của bạn có giao dịch bất thường. Vui lòng truy cập link ngay để xác minh: bit.ly/verify-account-urgent",
        riskScore: 0.78, // confidence 0-1
        flagged: true
      }
    },
    {
      id: 'sample-5',
      fileName: 'cuoc_goi_ban_hang.mp3',
      fileSize: 2560000, // 2.5MB
      uploadedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks ago
      result: {
        transcript: "Chào anh/chị, em là nhân viên bán hàng từ công ty ABC. Chúng tôi có chương trình khuyến mãi đặc biệt dành cho khách hàng VIP. Anh/chị có quan tâm không ạ?",
        riskScore: 0.85, // confidence 0-1 (85% tin rằng đây là bình thường)
        flagged: false
      }
    }
  ];
};

export const deleteFile = (id: string): void => {
  const files = getSavedFiles();
  const filtered = files.filter((f) => f.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const getFileById = (id: string): SavedFile | null => {
  const files = getSavedFiles();
  return files.find((f) => f.id === id) || null;
};

// Profile Management
export const getProfile = (): UserProfile | null => {
  const stored = localStorage.getItem(PROFILE_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const saveProfile = (profile: UserProfile): void => {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
};

export const updateProfile = (updates: Partial<UserProfile>): void => {
  const current = getProfile();
  if (current) {
    saveProfile({ ...current, ...updates });
  } else {
    saveProfile(updates as UserProfile);
  }
};

// Share functionality
const SHARE_STORAGE_KEY = 'blacklist_share_results';

export interface ShareResult {
  id: string;
  result: AnalysisResult;
  createdAt: string;
}

export const saveShareResult = (result: AnalysisResult): string => {
  const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  const shareResult: ShareResult = {
    id,
    result,
    createdAt: new Date().toISOString(),
  };

  // Store in sessionStorage (cleared on tab close) for privacy
  const shares = getShareResults();
  shares.push(shareResult);
  // Keep only last 10 shares to avoid storage bloat
  if (shares.length > 10) {
    shares.shift();
  }
  sessionStorage.setItem(SHARE_STORAGE_KEY, JSON.stringify(shares));
  return id;
};

export const getShareResult = (id: string): ShareResult | null => {
  const shares = getShareResults();
  return shares.find(s => s.id === id) || null;
};

const getShareResults = (): ShareResult[] => {
  const stored = sessionStorage.getItem(SHARE_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const clearAllUserData = (): void => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(PROFILE_KEY);
  sessionStorage.removeItem(SHARE_STORAGE_KEY);
};

