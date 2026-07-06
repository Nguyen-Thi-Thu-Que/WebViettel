import axiosInstance from './axiosInstance';
import type { Package, User, FAQ, Transaction, ChatbotConfig } from '../types';

const API_BASE_URL = '/api/packages';

export interface FetchPackagesResponse {
  packages: Package[];
  page: number;
  limit: number;
  totalPages: number;
  totalItems: number;
}

export interface FilterOptions {
  categories: { key: string; label: string }[];
  networks: string[];
  durations: { key: string; label: string }[];
  appPromos?: string[];
}

export function toVietnamesePackage(apiPkg: any): Package {
  if (!apiPkg) return {} as Package;
  const price = apiPkg.price || 0;
  const phan_khuc_gia = price < 50000 ? 'Gia_re' : price <= 150000 ? 'Trung_binh' : 'Cao_cap';

  const termsList = apiPkg.terms || [];
  const chinh_sach_ap_dung = termsList[0] || 'Áp dụng cho thuê bao Viettel di động.';
  
  let dangky = apiPkg.dangky || '';
  let huygiahan = apiPkg.huygiahan || '';
  let huygoicuoc = apiPkg.huygoicuoc || '';

  termsList.forEach((term: string) => {
    if (term.toLowerCase().startsWith('cách đăng ký:')) {
      dangky = term.replace(/cách đăng ký:\s*/i, '').trim();
    } else if (term.toLowerCase().startsWith('hủy gia hạn:')) {
      huygiahan = term.replace(/hủy gia hạn:\s*/i, '').trim();
    } else if (term.toLowerCase().startsWith('hủy gói:')) {
      huygoicuoc = term.replace(/hủy gói:\s*/i, '').trim();
    } else if (term.toLowerCase().startsWith('hủy gói cước:')) {
      huygoicuoc = term.replace(/hủy gói cước:\s*/i, '').trim();
    }
  });

  if (!dangky) {
    dangky = `Soạn ${apiPkg.ma_goi || apiPkg.id?.toUpperCase()} gửi 191`;
  }
  if (!huygiahan) {
    huygiahan = 'Soạn HUY gửi 191';
  }
  if (!huygoicuoc) {
    huygoicuoc = 'Soạn HUYDATA gửi 191';
  }

  const free_noi_mang = apiPkg.voiceFreeInternalMin ? `${apiPkg.voiceFreeInternalMin} phút nội mạng` : '0';
  const free_ngoai_mang = apiPkg.voiceFreeExternalMin ? `${apiPkg.voiceFreeExternalMin} phút ngoại mạng` : '0';

  return {
    id: apiPkg.id,
    ten: apiPkg.name || '',
    dohot: apiPkg.isPopular ? 'Hot' : 'normal',
    phan_loai_goi: apiPkg.category === 'data' ? 'Data' : apiPkg.category === 'combo' ? 'Combo' : apiPkg.category === 'social' ? 'Social' : 'Thoại',
    gia: price,
    phan_khuc_gia,
    data_theo_ngay: apiPkg.dataLimit || '',
    free_ngoai_mang,
    free_noi_mang,
    tienich: apiPkg.tienich || '0',
    sms: apiPkg.sms || '0',
    dieu_kien_dang_ky: apiPkg.dieu_kien_dang_ky || apiPkg.conditions || 'Thuê bao di động hoạt động bình thường',
    chinh_sach_ap_dung: apiPkg.chinh_sach_ap_dung || chinh_sach_ap_dung || 'Áp dụng cho thuê bao Viettel di động.',
    noi_dung_ngoai: apiPkg.noi_dung_ngoai || '0',
    tien_ich_free: apiPkg.tien_ich_free || apiPkg.tienich || '0',
    uudaitrong: apiPkg.description || '',
    chu_ky_ngay: String(apiPkg.durationDays || 30),
    dangky,
    huygiahan,
    huygoicuoc,
    tags: apiPkg.tags || [],
    ma_goi: apiPkg.ma_goi || '',
    diem_noi_bat: apiPkg.diem_noi_bat || '',
    goi_thay_the: apiPkg.goi_thay_the || '',
    doi_tuong_ap_dung: apiPkg.conditions || '',
    loai_mang: apiPkg.loai_mang || ''
  };
}

export function toEnglishPackage(vnPkg: Partial<Package>): any {
  const price = vnPkg.gia || 0;
  const durationDays = parseInt(vnPkg.chu_ky_ngay || '30') || 30;
  let duration = 'monthly';
  if (durationDays <= 1) duration = 'daily';
  else if (durationDays <= 15) duration = 'weekly';
  else if (durationDays <= 90) duration = 'monthly';
  else duration = 'yearly';

  const voiceFreeInternalMin = vnPkg.free_noi_mang ? (parseInt(vnPkg.free_noi_mang.replace(/\D/g, '')) || 0) : 0;
  const voiceFreeExternalMin = vnPkg.free_ngoai_mang ? (parseInt(vnPkg.free_ngoai_mang.replace(/\D/g, '')) || 0) : 0;
  const socialFreeApps = vnPkg.noi_dung_ngoai && vnPkg.noi_dung_ngoai !== '0'
    ? vnPkg.noi_dung_ngoai.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const category = socialFreeApps.length > 0 ? 'social' : voiceFreeInternalMin > 0 ? 'combo' : 'data';

  return {
    id: vnPkg.id,
    name: vnPkg.ten,
    price,
    duration,
    durationDays,
    dataLimit: vnPkg.data_theo_ngay || '0 GB',
    dataPerDayGb: vnPkg.data_theo_ngay ? (parseFloat(vnPkg.data_theo_ngay.replace(',', '.').match(/(\d+(\.\d+)?)/)?.[1] || '0')) : 0,
    voiceFreeInternalMin,
    voiceFreeExternalMin,
    socialFreeApps,
    description: vnPkg.uudaitrong || '',
    conditions: vnPkg.dieu_kien_dang_ky || '',
    terms: [
      vnPkg.chinh_sach_ap_dung || 'Áp dụng cho thuê bao Viettel di động.',
      vnPkg.dangky ? `Cách đăng ký: ${vnPkg.dangky}` : '',
      vnPkg.huygiahan ? `Hủy gia hạn: ${vnPkg.huygiahan}` : '',
      vnPkg.huygoicuoc ? `Hủy gói: ${vnPkg.huygoicuoc}` : ''
    ].filter(Boolean),
    isPopular: vnPkg.dohot === 'Hot',
    category,
    tags: vnPkg.dohot === 'Hot' ? ['Hot'] : [],
    loai_mang: vnPkg.loai_mang || ''
  };
}

// 1. Package APIs
export const packageApi = {
  fetchPackages: async (params: Record<string, any>): Promise<FetchPackagesResponse> => {
    const response = await axiosInstance.get<any>(API_BASE_URL, { params });
    const rawData = response.data;
    return {
      packages: (rawData.packages || []).map(toVietnamesePackage),
      page: rawData.page,
      limit: rawData.limit,
      totalPages: rawData.totalPages,
      totalItems: rawData.totalItems,
    };
  },

  fetchPackageById: async (id: string): Promise<Package> => {
    const response = await axiosInstance.get<any>(`${API_BASE_URL}/${id}`);
    return toVietnamesePackage(response.data);
  },

  fetchFilterOptions: async (): Promise<FilterOptions> => {
    const response = await axiosInstance.get<FilterOptions>(`${API_BASE_URL}/filter`);
    return response.data;
  },

  fetchCategories: async (): Promise<{ id: string; name: string; count: number }[]> => {
    const response = await axiosInstance.get(`${API_BASE_URL}/categories`);
    return response.data;
  },

  createPackage: async (pkg: Omit<Package, 'id' | 'phan_khuc_gia'>): Promise<{ success: boolean; package: Package }> => {
    const englishPkg = toEnglishPackage(pkg);
    const response = await axiosInstance.post<{ success: boolean; package: any }>(API_BASE_URL, englishPkg);
    return {
      success: response.data.success,
      package: toVietnamesePackage(response.data.package),
    };
  },

  updatePackage: async (id: string, pkg: Partial<Package>): Promise<{ success: boolean; package: Package }> => {
    const englishPkg = toEnglishPackage(pkg);
    const response = await axiosInstance.put<{ success: boolean; package: any }>(`${API_BASE_URL}/${id}`, englishPkg);
    return {
      success: response.data.success,
      package: toVietnamesePackage(response.data.package),
    };
  },

  deletePackage: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await axiosInstance.delete<{ success: boolean; message: string }>(`${API_BASE_URL}/${id}`);
    return response.data;
  },
};

// 2. Authentication and Profile APIs
export const authApi = {
  login: async (phoneNumber: string, password?: string): Promise<{ token: string; user: User }> => {
    const response = await axiosInstance.post<{ success: boolean; message: string; data: { token: string; user: User } }>('/api/auth/login', {
      phoneNumber,
      password: password || 'password123'
    });
    return response.data.data;
  },

  register: async (name: string, phoneNumber: string, email: string, password?: string, subscriptionType?: string): Promise<{ token: string; user: User }> => {
    const response = await axiosInstance.post<{ success: boolean; message: string; data: { token: string; user: User } }>('/api/auth/register', {
      name,
      phoneNumber,
      email,
      password: password || 'password123',
      subscription_type: subscriptionType || 'tra_truoc'
    });
    return response.data.data;
  },

  getMe: async (): Promise<User> => {
    const response = await axiosInstance.get<{ success: boolean; data: { user: User } }>('/api/auth/me');
    return response.data.data.user;
  },

  updateProfile: async (name: string, email: string): Promise<User> => {
    const response = await axiosInstance.put<{ success: boolean; data: { user: User } }>('/api/auth/profile', { name, email });
    return response.data.data.user;
  },

  changePassword: async (oldPw: string, newPw: string): Promise<boolean> => {
    const response = await axiosInstance.put<{ success: boolean }>('/api/auth/change-password', {
      oldPassword: oldPw,
      newPassword: newPw
    });
    return response.data.success;
  },

  deposit: async (amount: number, method: string): Promise<{ balance: number }> => {
    const response = await axiosInstance.post<{ success: boolean; data: { balance: number } }>('/api/auth/deposit', { amount, method });
    return response.data.data;
  },

  subscribePackage: async (packageId: string): Promise<{ balance: number; activePackage: any }> => {
    const response = await axiosInstance.post<{ success: boolean; data: { balance: number; activePackage: any } }>('/api/auth/subscribe', { packageId });
    return response.data.data;
  },

  unsubscribePackage: async (packageId: string): Promise<boolean> => {
    const response = await axiosInstance.delete<{ success: boolean }>(`/api/auth/unsubscribe/${packageId}`);
    return response.data.success;
  },

  linkWallet: async (walletAddress: string): Promise<User> => {
    const response = await axiosInstance.put<{ success: boolean; data: { user: User } }>('/api/auth/wallet', { walletAddress });
    return response.data.data.user;
  }
};

// 3. Transactions APIs
export const transactionApi = {
  fetchTransactions: async (): Promise<Transaction[]> => {
    const response = await axiosInstance.get<{ success: boolean; data: Transaction[] }>('/api/transactions');
    return response.data.data;
  },

  fetchAdminStats: async (): Promise<{
    totalUsersCount: number;
    totalPackagesCount: number;
    totalRevenueVal: number;
    totalSubscriptionsCount: number;
    recentTransactions: any[];
  }> => {
    const response = await axiosInstance.get<{ success: boolean; data: any }>('/api/transactions/admin/stats');
    return response.data.data;
  }
};

// 4. FAQ APIs
export const faqApi = {
  fetchFAQs: async (): Promise<FAQ[]> => {
    const response = await axiosInstance.get<{ success: boolean; data: FAQ[] }>('/api/faqs');
    return response.data.data;
  },

  createFAQ: async (faq: Omit<FAQ, 'id'>): Promise<FAQ> => {
    const response = await axiosInstance.post<{ success: boolean; data: FAQ }>('/api/faqs', faq);
    return response.data.data;
  },

  updateFAQ: async (id: string, faq: Partial<FAQ>): Promise<FAQ> => {
    const response = await axiosInstance.put<{ success: boolean; data: FAQ }>(`/api/faqs/${id}`, faq);
    return response.data.data;
  },

  deleteFAQ: async (id: string): Promise<boolean> => {
    const response = await axiosInstance.delete<{ success: boolean }>(`/api/faqs/${id}`);
    return response.data.success;
  }
};

// 5. Chatbot APIs
export const chatbotApi = {
  sendMessage: async (message: string): Promise<{ text: string; suggestedAction?: any }> => {
    const response = await axiosInstance.post<{ success: boolean; data: { text: string; suggestedAction?: any } }>('/api/chatbot/message', { message });
    return response.data.data;
  },

  fetchConfig: async (): Promise<ChatbotConfig> => {
    const response = await axiosInstance.get<{ success: boolean; data: ChatbotConfig }>('/api/chatbot/config');
    return response.data.data;
  },

  updateConfig: async (config: ChatbotConfig): Promise<ChatbotConfig> => {
    const response = await axiosInstance.put<{ success: boolean; data: ChatbotConfig }>('/api/chatbot/config', config);
    return response.data.data;
  }
};

// 6. User Management APIs (Admin)
export const userApi = {
  fetchUsers: async (): Promise<User[]> => {
    const response = await axiosInstance.get<{ success: boolean; data: User[] }>('/api/users');
    return response.data.data;
  },

  updateUserBalance: async (userId: string, balance: number): Promise<boolean> => {
    const response = await axiosInstance.put<{ success: boolean }>(`/api/users/${userId}/balance`, { balance });
    return response.data.success;
  },

  updateUser: async (userId: string, data: { subscription_type?: 'tra_truoc' | 'tra_sau'; is_loyal_customer?: boolean; status?: 'active' | 'blocked' | 'pending'; balance?: number }): Promise<boolean> => {
    const response = await axiosInstance.put<{ success: boolean }>(`/api/users/${userId}`, data);
    return response.data.success;
  }
};
