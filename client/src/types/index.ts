export interface Package {
  id: string;
  name: string;
  price: number;
  duration: 'daily' | 'weekly' | 'monthly' | 'yearly';
  durationDays: number;
  dataLimit: string; // e.g. "1.5 GB/ngày" or "Không giới hạn" or "30 GB"
  dataPerDayGb?: number; // raw value for sorting/filtering
  voiceFreeInternalMin: number; // e.g. 1000 mins
  voiceFreeExternalMin: number; // e.g. 50 mins
  socialFreeApps: string[]; // e.g. ["TikTok", "YouTube", "Facebook"]
  description: string;
  terms: string[];
  conditions: string;
  isPopular: boolean;
  category: 'data' | 'voice' | 'combo' | 'social';
  rating: number; // e.g. 4.8
  registrationsCount: number; // e.g. 152000
  tags: string[]; // e.g. ["Hot", "TikTok FREE", "Giá rẻ"]
}

export interface User {
  id: string;
  name: string;
  phoneNumber: string;
  email: string;
  balance: number;
  activePackages: {
    packageId: string;
    activatedAt: string;
    expiresAt: string;
  }[];
  role: 'customer' | 'admin';
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'subscribe';
  amount: number;
  packageName?: string;
  paymentMethod?: string; // e.g. "VietQR", "Momo", "ATM Card"
  status: 'pending' | 'success' | 'failed';
  createdAt: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string; // e.g. "Đăng ký", "Nạp tiền", "Hỗ trợ chung"
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  createdAt: string;
  suggestedAction?: {
    type: 'subscribe' | 'view_details' | 'survey';
    payload: string; // package ID or redirect link
    label: string;
  };
}

export interface ChatbotConfig {
  systemPrompt: string;
  trainingKeywords: {
    keyword: string;
    response: string;
    suggestedPackageId?: string;
  }[];
}

export interface SurveyAnswers {
  budget: 'under_50' | '50_100' | '100_200' | 'above_200' | 'any';
  dataDemand: 'none' | 'low' | 'medium' | 'high' | 'unlimited';
  voiceDemand: 'none' | 'low' | 'high';
  socialApps: string[]; // e.g., ["TikTok", "YouTube", "Facebook"]
}
