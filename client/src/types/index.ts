export interface Package {
  id: string; // unique identifier (maps to ma_goi or database numeric id)
  numericId?: number;
  is_auto_renew?: boolean;
  support_auto_renew?: boolean;
  ten: string;
  dohot: string; // e.g. "Hot" or "normal"
  phan_loai_goi: string; // e.g. "Data", "Combo", "Social", "Thoại"
  gia: number;
  phan_khuc_gia: string; // e.g. "Gia_re", "Trung_binh", "Cao_cap"
  data_theo_ngay: string;
  free_ngoai_mang: string;
  free_noi_mang: string;
  tienich: string;
  sms: string;
  dieu_kien_dang_ky: string;
  chinh_sach_ap_dung: string;
  noi_dung_ngoai: string;
  tien_ich_free: string;
  uudaitrong: string;
  chu_ky_ngay: string;
  dangky: string;
  huygiahan: string;
  huygoicuoc: string;
  tags?: string[];
  ma_goi?: string;
  diem_noi_bat?: string;
  goi_thay_the?: string;
  doi_tuong_ap_dung?: string;
  loai_mang?: string;
  has_data?: boolean;
  has_voice?: boolean;
  has_sms?: boolean;
  has_tv360?: boolean;
  has_youtube?: boolean;
  has_tiktok?: boolean;
  has_facebook?: boolean;
  is_addon?: boolean;
  is_long_term?: boolean;
  requires_base_package?: boolean;
  system_type?: string;
  allow_parallel_with?: string[];
  benefit_group?: string;
  matchScore?: number;
  recommendationTag?: string;
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
  subscription_type?: 'tra_truoc' | 'tra_sau';
  is_loyal_customer?: boolean;
  status?: 'active' | 'blocked' | 'pending';
  walletAddress?: string | null;
  created_at?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'subscribe' | 'purchase' | string;
  direction?: 'PLUS' | 'MINUS';
  amount: number;
  packageName?: string;
  paymentMethod?: string; // e.g. "VietQR", "Momo", "ATM Card"
  status: 'pending' | 'success' | 'failed' | 'cancelled' | string;
  createdAt: string;
  txHash?: string;
  walletAddress?: string;
  exchangeRate?: number;
  network?: string;
  amountETH?: string;
  description?: string;
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
  packages?: Package[]; // Hoặc sử dụng Type Package định nghĩa sẵn của dự án
  recommendedPackages?: Package[];
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
  budget?: 'under_90' | '90_150' | 'above_150' | string;
  demand_branch?: 'DATA_ONLY' | 'COMBO' | 'SOCIAL_DEEP' | string;
  data_per_day?: '1GB' | '2_3GB' | 'UNLIMITED' | string;
  combo_priority?: 'DATA_FIRST' | 'VOICE_FIRST' | 'BALANCED' | string;
  primary_app?: 'TikTok' | 'YouTube' | 'Facebook' | 'ALL_SOCIAL' | string;
  cycle_preference?: 'MONTHLY' | 'LONG_TERM' | 'ANY' | string;
  [key: string]: any;
}

export type SubscriptionStatus = 'ACTIVE' | 'PENDING_PAYMENT' | 'EXPIRED' | 'CANCELLED';
export type SubscriptionCycle = 'DAY' | 'MONTH' | 'YEAR';

export interface UserSubscription {
  id?: string;
  userId: number;
  packageId: number;
  registeredAt: string;
  activatedAt: string;
  expiresAt: string;
  status: SubscriptionStatus;
  autoRenew: boolean;
  cycle: SubscriptionCycle;
  cancelledAt?: string | null;
  cancelReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Contact {
  contact_id: string;
  user_id: number | null;
  full_name: string;
  phone: string;
  message: string;
  topic?: string;
  status: 'NEW' | 'READ' | 'PROCESSING' | 'DONE' | 'CLOSED';
  source: 'guest' | 'user';
  created_at?: string;
  updated_at?: string;
  handled_by?: number | null;
  handled_at?: string | null;
  admin_note?: string;
}

export interface Notification {
  _id: string;
  userId: number;
  title: string;
  content: string;
  type: 'SUBSCRIPTION' | 'TRANSACTION' | 'SYSTEM';
  status: 'UNREAD' | 'READ';
  link?: string;
  isDeleted: boolean;
  createdAt: string;
}
