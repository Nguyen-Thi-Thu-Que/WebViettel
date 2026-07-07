import { create } from 'zustand';
import type { User, Package, Transaction, FAQ, ChatMessage, ChatbotConfig, SurveyAnswers } from '../types';
import { packageApi, authApi, transactionApi, faqApi, chatbotApi } from '../services/api';

export function isAllowedForUser(pkg: Package, user: any): boolean {
  // Hiện tại vẫn hiển thị bình thường.
  // Ở Sprint sau, có thể mở rộng:
  // if (pkg.doi_tuong_ap_dung?.includes('khach_hang_than_thiet') && user?.role !== 'loyalty') return false;
  if (pkg && user) {
    return true;
  }
  return true;
}

// ==========================================
// 1. AUTH STORE
// ==========================================
interface AuthState {
  currentUser: User | null;
  transactions: Transaction[];
  faqs: FAQ[];
  loading: boolean;
  error: string | null;
  login: (phoneNumber: string, password?: string) => Promise<boolean>;
  registerUser: (name: string, phoneNumber: string, email: string, password?: string, subscriptionType?: string) => Promise<boolean>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  fetchFAQs: () => Promise<void>;
  updateProfile: (name: string, email: string) => Promise<boolean>;
  changePassword: (oldPw: string, newPw: string) => Promise<boolean>;
  deposit: (amount: number, method: string) => Promise<boolean>;
  depositBlockchain: (amount: number, txHash: string, walletAddress: string, network: string) => Promise<{ success: boolean; message: string; balance?: number }>;
  subscribePackage: (pkg: Package) => Promise<{ success: boolean; message: string }>;
  registerSubscription: (packageId: number, cycle: 'DAY' | 'MONTH' | 'YEAR') => Promise<{ success: boolean; message: string }>;
  unsubscribePackage: (packageId: string) => Promise<boolean>;
  linkWalletAddress: (walletAddress: string) => Promise<{ success: boolean; message: string }>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  transactions: [],
  faqs: [],
  loading: false,
  error: null,

  login: async (phoneNumber, password) => {
    set({ loading: true, error: null });
    try {
      const data = await authApi.login(phoneNumber, password);
      localStorage.setItem('token', data.token);
      set({ currentUser: data.user, loading: false });
      
      // Auto fetch other details
      get().fetchTransactions().catch(() => {});
      get().fetchFAQs().catch(() => {});
      
      return true;
    } catch (err: any) {
      set({ 
        error: err.response?.data?.message || 'Thông tin đăng nhập không chính xác.',
        loading: false 
      });
      return false;
    }
  },

  registerUser: async (name, phoneNumber, email, password, subscriptionType) => {
    set({ loading: true, error: null });
    try {
      const data = await authApi.register(name, phoneNumber, email, password, subscriptionType);
      localStorage.setItem('token', data.token);
      set({ currentUser: data.user, loading: false });
      return true;
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Đăng ký tài khoản thất bại.',
        loading: false
      });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ currentUser: null, transactions: [], faqs: [] });
  },

  fetchMe: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const user = await authApi.getMe();
      set({ currentUser: user });
    } catch (err) {
      console.error("Error fetching current user profile:", err);
    }
  },

  fetchTransactions: async () => {
    try {
      const txs = await transactionApi.fetchTransactions();
      set({ transactions: txs });
    } catch (err) {
      console.error("Error fetching transactions:", err);
      throw err;
    }
  },

  fetchFAQs: async () => {
    try {
      const list = await faqApi.fetchFAQs();
      set({ faqs: list });
    } catch (err) {
      console.error("Error fetching FAQs:", err);
    }
  },

  updateProfile: async (name, email) => {
    try {
      const user = await authApi.updateProfile(name, email);
      set({ currentUser: user });
      return true;
    } catch (err) {
      console.error("Error updating profile:", err);
      return false;
    }
  },

  changePassword: async (oldPw, newPw) => {
    try {
      return await authApi.changePassword(oldPw, newPw);
    } catch (err) {
      console.error("Error changing password:", err);
      return false;
    }
  },

  deposit: async (amount, method) => {
    try {
      const result = await authApi.deposit(amount, method);
      set(state => ({
        currentUser: state.currentUser ? {
          ...state.currentUser,
          balance: result.balance
        } : null
      }));
      get().fetchTransactions().catch(() => {});
      return true;
    } catch (err) {
      console.error("Error depositing wallet:", err);
      return false;
    }
  },

  depositBlockchain: async (amount, txHash, walletAddress, network) => {
    set({ loading: true, error: null });
    try {
      const result = await authApi.depositBlockchain(amount, txHash, walletAddress, network);
      set(state => ({
        currentUser: state.currentUser ? {
          ...state.currentUser,
          balance: result.balance
        } : null,
        loading: false
      }));
      get().fetchTransactions().catch(() => {});
      return { success: true, message: 'Nạp tiền qua blockchain thành công!', balance: result.balance };
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Nạp tiền qua blockchain thất bại.';
      set({ error: errMsg, loading: false });
      return { success: false, message: errMsg };
    }
  },

  subscribePackage: async (pkg) => {
    try {
      const result = await authApi.subscribePackage(pkg.id);
      
      set(state => {
        if (!state.currentUser) return state;
        
        const isAlreadyActive = state.currentUser.activePackages.some(ap => ap.packageId === result.activePackage.packageId);
        const updatedPackages = isAlreadyActive 
          ? state.currentUser.activePackages 
          : [...state.currentUser.activePackages, result.activePackage];

        return {
          currentUser: {
            ...state.currentUser,
            balance: result.balance,
            activePackages: updatedPackages
          }
        };
      });
      get().fetchTransactions().catch(() => {});
      return { success: true, message: `Đăng ký thành công gói cước ${pkg.ten}!` };
    } catch (err: any) {
      const msg = err.response?.data?.message || `Lỗi đăng ký gói cước ${pkg.ten}.`;
      return { success: false, message: msg };
    }
  },

  registerSubscription: async (packageId, cycle) => {
    try {
      const result = await authApi.registerSubscription(packageId, cycle);
      return { success: true, message: result?.message || 'Đăng ký gói cước thành công!' };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Lỗi đăng ký gói cước.';
      return { success: false, message: msg };
    }
  },

  unsubscribePackage: async (packageId) => {
    try {
      const success = await authApi.unsubscribePackage(packageId);
      if (success) {
        set(state => ({
          currentUser: state.currentUser ? {
            ...state.currentUser,
            activePackages: state.currentUser.activePackages.filter(p => p.packageId !== packageId)
          } : null
        }));
        get().fetchTransactions().catch(() => {});
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error unsubscribing package:", err);
      return false;
    }
  },

  linkWalletAddress: async (walletAddress: string) => {
    set({ loading: true, error: null });
    try {
      const user = await authApi.linkWallet(walletAddress);
      set({ currentUser: user, loading: false });
      return { success: true, message: 'Liên kết địa chỉ ví thành công!' };
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Liên kết địa chỉ ví thất bại.';
      set({ error: errMsg, loading: false });
      return { success: false, message: errMsg };
    }
  }
}));

// Automatically fetch user profile on store startup if token is available
if (typeof window !== 'undefined') {
  useAuthStore.getState().fetchMe().catch(() => {});
}

// ==========================================
// 2. PACKAGE STORE
// ==========================================
interface PackageFilters {
  category: string;
  price: string;
  cycle: string;
  network: string;
  data: string;
  call: string;
  sms: string;
  hot: string;
  recommended: string;
  target: string;
  promo: string;
  keyword: string;
}

interface PackageState {
  packages: Package[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  totalItems: number;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
  };
  filters: PackageFilters;
  search: string;
  sort: string;
  compareList: Package[];
  currentPackage: Package | null;
  addToCompare: (pkg: Package) => { success: boolean; message: string };
  removeFromCompare: (packageId: string) => void;
  clearCompare: () => void;
  fetchPackages: (params?: Record<string, any>) => Promise<void>;
  fetchPackageById: (id: string) => Promise<void>;
  addPackage: (pkg: Omit<Package, 'id' | 'phan_khuc_gia'>) => Promise<boolean>;
  updatePackage: (id: string, updated: Partial<Package>) => Promise<boolean>;
  deletePackage: (id: string) => Promise<boolean>;
  setFilter: (key: keyof PackageFilters, value: string) => void;
  setSearch: (value: string) => void;
  setSort: (value: string) => void;
  setPage: (page: number) => void;
  reset: () => void;
}

const INITIAL_FILTERS: PackageFilters = {
  category: 'all',
  price: 'all',
  cycle: 'all',
  network: 'all',
  data: 'all',
  call: 'all',
  sms: 'all',
  hot: 'all',
  recommended: 'all',
  target: '',
  promo: 'all',
  keyword: '',
};

const INITIAL_PAGINATION = {
  page: 1,
  limit: 8,
  totalPages: 1,
  totalItems: 0,
};

export const usePackageStore = create<PackageState>((set, get) => ({
  packages: [],
  loading: false,
  error: null,
  totalPages: 1,
  totalItems: 0,
  pagination: INITIAL_PAGINATION,
  filters: INITIAL_FILTERS,
  search: '',
  sort: 'popular',
  compareList: [],
  currentPackage: null,

  addToCompare: (pkg) => {
    let result = { success: true, message: 'Đã thêm vào danh sách so sánh.' };
    set(state => {
      if (state.compareList.some(p => p.id === pkg.id)) {
        result = { success: false, message: 'Gói cước này đã có trong danh sách so sánh.' };
        return state;
      }
      if (state.compareList.length >= 3) {
        result = { success: false, message: 'Bạn chỉ có thể so sánh tối đa 3 gói cước.' };
        return state;
      }
      return { compareList: [...state.compareList, pkg] };
    });
    return result;
  },

  removeFromCompare: (packageId) => {
    set(state => ({
      compareList: state.compareList.filter(p => p.id !== packageId)
    }));
  },

  clearCompare: () => {
    set({ compareList: [] });
  },

  setFilter: (key, value) => {
    set(state => ({
      filters: { ...state.filters, [key]: value },
      pagination: { ...state.pagination, page: 1 }
    }));
  },

  setSearch: (value) => {
    set(state => ({
      search: value,
      pagination: { ...state.pagination, page: 1 }
    }));
  },

  setSort: (value) => {
    set({ sort: value });
  },

  setPage: (page) => {
    set(state => ({
      pagination: { ...state.pagination, page }
    }));
  },

  reset: () => {
    set({
      filters: INITIAL_FILTERS,
      search: '',
      sort: 'popular',
      pagination: INITIAL_PAGINATION,
      totalPages: 1,
      totalItems: 0
    });
  },

  fetchPackages: async (params) => {
    set({ loading: true, error: null });
    try {
      const state = get();
      const mergedParams = {
        page: 1,
        limit: 999, // Fetch all packages so client can filter/paginate locally
        search: state.search,
        ...params
      };

      const data = await packageApi.fetchPackages(mergedParams);
      
      set({ 
        packages: data.packages || [], 
        loading: false 
      });
    } catch (err: any) {
      console.error("Error fetching packages from API:", err);
      set({
        error: err.response?.data?.message || 'Không thể tải danh sách gói cước.',
        packages: [],
        loading: false
      });
    }
  },

  fetchPackageById: async (id) => {
    set({ loading: true, error: null, currentPackage: null });
    try {
      const pkg = await packageApi.fetchPackageById(id);
      set({ currentPackage: pkg, loading: false });
    } catch (err: any) {
      console.error(`Error fetching package ${id} from API:`, err);
      set({ 
        error: err.response?.data?.message || 'Không thể tải chi tiết gói cước.', 
        loading: false 
      });
    }
  },

  addPackage: async (newPkg) => {
    set({ loading: true, error: null });
    try {
      const res = await packageApi.createPackage(newPkg);
      if (res.success) {
        set(state => ({
          packages: [res.package, ...state.packages],
          loading: false
        }));
        return true;
      }
      set({ loading: false });
      return false;
    } catch (err: any) {
      console.error("Error creating package:", err);
      set({ 
        error: err.response?.data?.message || 'Không thể tạo gói cước mới.',
        loading: false 
      });
      return false;
    }
  },

  updatePackage: async (id, updated) => {
    set({ loading: true, error: null });
    try {
      const res = await packageApi.updatePackage(id, updated);
      if (res.success) {
        set(state => ({
          packages: state.packages.map(p => p.id === id ? res.package : p),
          compareList: state.compareList.map(p => p.id === id ? res.package : p),
          loading: false
        }));
        return true;
      }
      set({ loading: false });
      return false;
    } catch (err: any) {
      console.error("Error updating package:", err);
      set({ 
        error: err.response?.data?.message || 'Không thể cập nhật gói cước.',
        loading: false 
      });
      return false;
    }
  },

  deletePackage: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await packageApi.deletePackage(id);
      if (res.success) {
        set(state => ({
          packages: state.packages.filter(p => p.id !== id),
          compareList: state.compareList.filter(p => p.id !== id),
          loading: false
        }));
        return true;
      }
      set({ loading: false });
      return false;
    } catch (err: any) {
      console.error("Error deleting package:", err);
      set({ 
        error: err.response?.data?.message || 'Không thể xóa gói cước.',
        loading: false 
      });
      return false;
    }
  }
}));

// ==========================================
// 3. CHATBOT STORE
// ==========================================
interface ChatbotState {
  messages: ChatMessage[];
  isOpen: boolean;
  config: ChatbotConfig | null;
  setIsOpen: (isOpen: boolean) => void;
  sendMessage: (text: string) => Promise<void>;
  fetchConfig: () => Promise<void>;
  updateConfig: (config: ChatbotConfig) => Promise<boolean>;
  clearHistory: () => void;
}

const INITIAL_WELCOME_MSG: ChatMessage = {
  id: 'msg_welcome',
  sender: 'bot',
  text: 'Xin chào! Tôi là trợ lý ảo Viettel AI. Tôi có thể giúp gì cho bạn hôm nay? Bạn có thể hỏi về các gói cước như: thoại, data khủng, mạng xã hội, hoặc làm khảo sát nhu cầu nhé!',
  createdAt: new Date().toISOString()
};

export const useChatbotStore = create<ChatbotState>((set) => ({
  messages: [INITIAL_WELCOME_MSG],
  isOpen: false,
  config: null,

  setIsOpen: (isOpen) => set({ isOpen }),

  sendMessage: async (text) => {
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      sender: 'user',
      text,
      createdAt: new Date().toISOString()
    };

    set(state => ({ messages: [...state.messages, userMsg] }));

    try {
      const botResponse = await chatbotApi.sendMessage(text);
      const botMsg: ChatMessage = {
        id: `msg_${Date.now()}_bot`,
        sender: 'bot',
        text: botResponse.text,
        suggestedAction: botResponse.suggestedAction,
        createdAt: new Date().toISOString()
      };
      set(state => ({ messages: [...state.messages, botMsg] }));
    } catch (err) {
      console.error("Error sending message to chatbot:", err);
      const botMsg: ChatMessage = {
        id: `msg_${Date.now()}_bot_err`,
        sender: 'bot',
        text: 'Rất tiếc, tôi đang gặp lỗi kết nối hệ thống chatbot. Vui lòng thử lại sau ít phút.',
        createdAt: new Date().toISOString()
      };
      set(state => ({ messages: [...state.messages, botMsg] }));
    }
  },

  fetchConfig: async () => {
    try {
      const data = await chatbotApi.fetchConfig();
      set({ config: data });
    } catch (err) {
      console.error("Error fetching chatbot config:", err);
    }
  },

  updateConfig: async (newConfig) => {
    try {
      const data = await chatbotApi.updateConfig(newConfig);
      set({ config: data });
      return true;
    } catch (err) {
      console.error("Error updating chatbot config:", err);
      return false;
    }
  },

  clearHistory: () => set({ messages: [INITIAL_WELCOME_MSG] })
}));

// ==========================================
// 4. SURVEY STORE
// ==========================================
interface SurveyState {
  answers: SurveyAnswers;
  currentStep: number;
  recommendedPackages: Package[];
  setAnswer: <K extends keyof SurveyAnswers>(field: K, value: SurveyAnswers[K]) => void;
  setStep: (step: number) => void;
  resetSurvey: () => void;
  calculateRecommendations: (allPackages: Package[]) => void;
}

const INITIAL_ANSWERS: SurveyAnswers = {
  budget: 'any',
  dataDemand: 'none',
  socialApps: [],
  voiceDemand: 'none'
};

export const useSurveyStore = create<SurveyState>((set, get) => ({
  answers: INITIAL_ANSWERS,
  currentStep: 0,
  recommendedPackages: [],

  setAnswer: (field, value) => {
    set(state => ({
      answers: {
        ...state.answers,
        [field]: value
      }
    }));
  },

  setStep: (step) => set({ currentStep: step }),

  resetSurvey: () => set({ answers: INITIAL_ANSWERS, currentStep: 0, recommendedPackages: [] }),

  calculateRecommendations: (allPackages) => {
    const { answers } = get();
    const scoredPackages = allPackages.map(pkg => {
      let score = 0;

      // 1. Budget Score
      if (answers.budget === 'under_50' && pkg.gia <= 50000) score += 30;
      else if (answers.budget === '50_100' && pkg.gia > 50000 && pkg.gia <= 100000) score += 30;
      else if (answers.budget === '100_200' && pkg.gia > 100000 && pkg.gia <= 200000) score += 30;
      else if (answers.budget === 'above_200' && pkg.gia > 200000) score += 30;
      else if (answers.budget === 'any') score += 10;

      // 2. Data Demand Score
      let dataPerDay = 0;
      if (pkg.data_theo_ngay) {
        const match = pkg.data_theo_ngay.replace(',', '.').match(/(\d+(\.\d+)?)\s*GB\/ngày/i);
        if (match) {
          dataPerDay = parseFloat(match[1]);
        } else {
          const matchTotal = pkg.data_theo_ngay.replace(',', '.').match(/(\d+(\.\d+)?)\s*GB/i);
          if (matchTotal) {
            dataPerDay = parseFloat(matchTotal[1]) / (parseInt(pkg.chu_ky_ngay) || 30);
          }
        }
      }

      if (answers.dataDemand === 'unlimited' && pkg.id === 'umax300') score += 40;
      else if (answers.dataDemand === 'high' && dataPerDay >= 3) score += 30;
      else if (answers.dataDemand === 'medium' && dataPerDay >= 1 && dataPerDay < 3) score += 30;
      else if (answers.dataDemand === 'low' && dataPerDay > 0 && dataPerDay < 1) score += 20;
      else if (answers.dataDemand === 'none' && dataPerDay === 0) score += 20;

      // 3. Voice Demand Score
      const voiceInternal = pkg.free_noi_mang && pkg.free_noi_mang !== '0' ? (parseInt(pkg.free_noi_mang.replace(/\D/g, '')) || 1000) : 0;
      if (answers.voiceDemand === 'high' && voiceInternal > 0) score += 30;
      else if (answers.voiceDemand === 'low' && voiceInternal > 0 && pkg.gia <= 90000) score += 20;
      else if (answers.voiceDemand === 'none' && voiceInternal === 0) score += 15;

      // 4. Social Apps Match Score
      const pkgSocialApps = pkg.noi_dung_ngoai && pkg.noi_dung_ngoai !== '0'
        ? pkg.noi_dung_ngoai.split(',').map(s => s.trim().toLowerCase())
        : [];
      if (answers.socialApps.length > 0 && pkgSocialApps.length > 0) {
        const matches = answers.socialApps.filter(app => pkgSocialApps.includes(app.toLowerCase()));
        score += matches.length * 15;
      }

      return { pkg, score };
    });

    // Sort by score descending and take top 3
    scoredPackages.sort((a, b) => b.score - a.score);
    const recommendations = scoredPackages.slice(0, 3).map(sp => sp.pkg);

    set({ recommendedPackages: recommendations });
  }
}));
