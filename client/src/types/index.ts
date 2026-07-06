export interface Package {
  id: string; // unique identifier (maps to ma_goi or database numeric id)
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
