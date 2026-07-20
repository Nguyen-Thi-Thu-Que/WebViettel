import { create } from 'zustand';
import type { User, Package, Transaction, FAQ, ChatMessage, ChatbotConfig, SurveyAnswers } from '../types';
import { packageApi, authApi, transactionApi, faqApi, chatbotApi, surveyApi } from '../services/api';

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
  authChecked: boolean;
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
  toggleAutoRenew: (subscriptionId: string, autoRenew: boolean) => Promise<boolean>;
  cancelSubscription: (subscriptionId: string) => Promise<boolean>;
  clearSubscriptionHistory: () => Promise<boolean>;
  linkWalletAddress: (walletAddress: string) => Promise<{ success: boolean; message: string }>;
  activeSubscriptions: any[];
  subscriptionHistory: any[];
  checkSubscription: (packageId: number, cycle: 'DAY' | 'MONTH' | 'YEAR') => Promise<any>;
  fetchActiveSubscriptions: () => Promise<void>;
  fetchSubscriptionHistory: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  transactions: [],
  faqs: [],
  activeSubscriptions: [],
  subscriptionHistory: [],
  loading: false,
  error: null,
  authChecked: typeof window !== 'undefined' ? !localStorage.getItem('token') : true,

  login: async (phoneNumber, password) => {
    set({ loading: true, error: null });
    try {
      const data = await authApi.login(phoneNumber, password);
      localStorage.setItem('token', data.token);

      set({ currentUser: data.user, authChecked: true, loading: false });

      // Automatically fetch active subscriptions & history into global state
      await get().fetchActiveSubscriptions().catch(() => { });
      await get().fetchSubscriptionHistory().catch(() => { });

      // Auto fetch other details
      get().fetchTransactions().catch(() => { });
      get().fetchFAQs().catch(() => { });
      return true;
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Thông tin đăng nhập không chính xác.',
        authChecked: true,
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
      set({ currentUser: data.user, authChecked: true, loading: false });

      // Automatically fetch active subscriptions & history into global state
      await get().fetchActiveSubscriptions().catch(() => { });
      await get().fetchSubscriptionHistory().catch(() => { });

      return true;
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Đăng ký tài khoản thất bại.',
        authChecked: true,
        loading: false
      });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ currentUser: null, authChecked: true, transactions: [], faqs: [], activeSubscriptions: [], subscriptionHistory: [] });
  },

  fetchMe: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ authChecked: true, currentUser: null, activeSubscriptions: [], subscriptionHistory: [] });
      return;
    }
    try {
      const user = await authApi.getMe();
      set({ currentUser: user, authChecked: true });

      // Run all initial global state fetches concurrently without resetting activeSubscriptions/subscriptionHistory beforehand
      await Promise.all([
        get().fetchActiveSubscriptions().catch((err) => console.error("fetchActiveSubscriptions error", err)),
        get().fetchSubscriptionHistory().catch((err) => console.error("fetchSubscriptionHistory error", err)),
        get().fetchTransactions().catch((err) => console.error("fetchTransactions error", err)),
        get().fetchFAQs().catch((err) => console.error("fetchFAQs error", err))
      ]);
    } catch (err) {
      console.error("Error fetching current user profile:", err);
      set({ currentUser: null, authChecked: true, activeSubscriptions: [], subscriptionHistory: [] });
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
      get().fetchTransactions().catch(() => { });
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
      get().fetchTransactions().catch(() => { });
      return { success: true, message: 'Nạp tiền qua blockchain thành công!', balance: result.balance };
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Nạp tiền qua blockchain thất bại.';
      set({ error: errMsg, loading: false });
      return { success: false, message: errMsg };
    }
  },

  subscribePackage: async (pkg) => {
    let cycle: 'DAY' | 'MONTH' | 'YEAR' = 'MONTH';
    const dayCycle = parseInt(pkg.chu_ky_ngay || '30', 10);
    if (dayCycle === 1) {
      cycle = 'DAY';
    } else if (dayCycle >= 360) {
      cycle = 'YEAR';
    }
    return get().registerSubscription(pkg.numericId || Number(pkg.id) || 0, cycle);
  },

  registerSubscription: async (packageId, cycle) => {
    try {
      const result = await authApi.registerSubscription(packageId, cycle);

      // Reload entire state from server to synchronize after registration/replacement
      await get().fetchMe();
      await get().fetchActiveSubscriptions().catch(() => { });
      await get().fetchSubscriptionHistory().catch(() => { });
      await get().fetchTransactions().catch(() => { });

      return { success: true, message: result?.message || 'Đăng ký gói cước thành công!' };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Lỗi đăng ký gói cước.';
      return { success: false, message: msg };
    }
  },

  checkSubscription: async (packageId, cycle) => {
    try {
      return await authApi.checkSubscription(packageId, cycle);
    } catch (err: any) {
      throw new Error(err.response?.data?.message || err.message || 'Lỗi kiểm tra đăng ký.');
    }
  },

  fetchActiveSubscriptions: async () => {
    try {
      const result = await authApi.fetchActiveSubscriptions();
      if (result && result.activePackages) {
        set({ activeSubscriptions: result.activePackages });
      } else {
        set({ activeSubscriptions: [] });
      }
    } catch (err) {
      console.error("Error fetching active subscriptions:", err);
      set({ activeSubscriptions: [] });
    }
  },

  fetchSubscriptionHistory: async () => {
    try {
      const result = await authApi.fetchSubscriptionHistory();
      if (result && result.success) {
        set({ subscriptionHistory: result.history || [] });
      } else {
        set({ subscriptionHistory: [] });
      }
    } catch (err) {
      console.error("Error fetching subscription history:", err);
      set({ subscriptionHistory: [] });
    }
  },

  unsubscribePackage: async (packageId) => {
    try {
      const success = await authApi.unsubscribePackage(packageId);
      if (success) {
        await get().fetchActiveSubscriptions().catch(() => { });
        await get().fetchSubscriptionHistory().catch(() => { });
        get().fetchTransactions().catch(() => { });
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error unsubscribing package:", err);
      return false;
    }
  },

  toggleAutoRenew: async (subscriptionId, autoRenew) => {
    try {
      await authApi.toggleAutoRenew(subscriptionId, autoRenew);
      await get().fetchActiveSubscriptions().catch(() => { });
      await get().fetchSubscriptionHistory().catch(() => { });
      return true;
    } catch (err) {
      console.error("Error toggling auto renew:", err);
      return false;
    }
  },

  cancelSubscription: async (subscriptionId) => {
    try {
      await authApi.cancelSubscription(subscriptionId);
      await get().fetchActiveSubscriptions().catch(() => { });
      await get().fetchSubscriptionHistory().catch(() => { });
      return true;
    } catch (err) {
      console.error("Error cancelling subscription:", err);
      return false;
    }
  },

  clearSubscriptionHistory: async () => {
    try {
      await authApi.clearSubscriptionHistory();
      await get().fetchSubscriptionHistory().catch(() => { });
      return true;
    } catch (err) {
      console.error("Error clearing subscription history:", err);
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
      const targetMaGoi = (pkg.ma_goi || pkg.id || '').trim();
      if (state.compareList.some(p => (p.ma_goi || p.id || '').trim() === targetMaGoi)) {
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
    const targetKey = String(packageId).trim();
    set(state => ({
      compareList: state.compareList.filter(p => (p.ma_goi || p.id || '').trim() !== targetKey)
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
  clearHistory: () => Promise<void>;
  hydrateHistory: () => Promise<void>;
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
        packages: botResponse.packages,
        recommendedPackages: botResponse.recommendedPackages,
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

  clearHistory: async () => {
    const currentUser = useAuthStore.getState().currentUser;
    if (currentUser) {
      try {
        await chatbotApi.clearHistory();
      } catch (err) {
        console.error("Error clearing chatbot history on server:", err);
      }
    }
    set({ messages: [INITIAL_WELCOME_MSG] });
  },

  hydrateHistory: async () => {
    const currentUser = useAuthStore.getState().currentUser;
    if (currentUser) {
      try {
        const history = await chatbotApi.fetchHistory();
        if (history && history.length > 0) {
          set({ messages: history });
        } else {
          set({ messages: [INITIAL_WELCOME_MSG] });
        }
      } catch (err) {
        console.error("Error fetching chatbot history:", err);
      }
    } else {
      set({ messages: [INITIAL_WELCOME_MSG] });
    }
  }
}));

// Subscribe to currentUser changes to hydrate chatbot history
let lastUserId: string | null | undefined = undefined;

useAuthStore.subscribe((state) => {
  const currentUserId = state.currentUser?.id;
  if (currentUserId !== lastUserId) {
    lastUserId = currentUserId;
    if (state.currentUser) {
      useChatbotStore.getState().hydrateHistory();
    } else {
      useChatbotStore.setState({ messages: [INITIAL_WELCOME_MSG] });
    }
  }
});

// ==========================================
// 4. SURVEY STORE
// ==========================================
interface SurveyState {
  questions: any[];
  answers: SurveyAnswers;
  currentStep: number;
  recommendedPackages: Package[];
  loading: boolean;
  hasHistory: boolean;
  isEarlyTerminated: boolean;
  setAnswer: <K extends keyof SurveyAnswers>(field: K, value: SurveyAnswers[K]) => void;
  setStep: (step: number) => void;
  resetSurvey: () => void;
  fetchConfig: (answers?: SurveyAnswers) => Promise<void>;
  submitAnswers: () => Promise<void>;
  fetchHistory: () => Promise<boolean>;
  deleteHistory: () => Promise<void>;
}

const INITIAL_ANSWERS: SurveyAnswers = {
  budget: 'any',
  dataDemand: 'none',
  socialApps: [],
  voiceDemand: 'none'
};

export const useSurveyStore = create<SurveyState>((set, get) => ({
  questions: [],
  answers: INITIAL_ANSWERS,
  currentStep: 0,
  recommendedPackages: [],
  loading: false,
  hasHistory: false,
  isEarlyTerminated: false,

  setAnswer: (field, value) => {
    set(state => {
      const newAnswers = {
        ...state.answers,
        [field]: value
      };
      // Gọi fetchConfig bất đồng bộ để cập nhật tính khả dụng (disabled) của các câu hỏi tiếp theo
      get().fetchConfig(newAnswers);
      return { answers: newAnswers };
    });
  },

  setStep: (step) => set({ currentStep: step }),

  resetSurvey: () => set({ answers: INITIAL_ANSWERS, currentStep: 0, recommendedPackages: [], isEarlyTerminated: false }),

  fetchConfig: async (answersParam) => {
    set({ loading: true });
    try {
      const activeAnswers = answersParam || get().answers;
      const questions = await surveyApi.fetchConfig(activeAnswers);
      set({ questions, loading: false });
    } catch (err) {
      console.error("Error fetching survey configs:", err);
      set({ loading: false });
    }
  },

  submitAnswers: async () => {
    set({ loading: true });
    try {
      const { answers } = get();
      const res = await surveyApi.submitAnswers(answers);
      set({
        answers: res.answers,
        recommendedPackages: res.recommendedPackages,
        isEarlyTerminated: res.isEarlyTerminated || false,
        hasHistory: true,
        loading: false
      });
    } catch (err) {
      console.error("Error submitting survey answers:", err);
      set({ loading: false });
    }
  },

  fetchHistory: async () => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) return false;

    set({ loading: true });
    try {
      const res = await surveyApi.fetchHistory();
      if (res.hasHistory && res.answers && res.recommendedPackages) {
        set({
          answers: res.answers,
          recommendedPackages: res.recommendedPackages,
          isEarlyTerminated: res.isEarlyTerminated || false,
          hasHistory: true,
          currentStep: get().questions.length || 7, // Hướng thẳng tới màn hình kết quả
          loading: false
        });
        // Tải lại cấu hình khả dụng (disabled) dựa trên lịch sử đã tải
        await get().fetchConfig(res.answers);
        return true;
      }
      set({ hasHistory: false, loading: false });
      return false;
    } catch (err) {
      console.error("Error fetching survey history:", err);
      set({ hasHistory: false, loading: false });
      return false;
    }
  },

  deleteHistory: async () => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) return;

    set({ loading: true });
    try {
      await surveyApi.deleteHistory();
      set({
        answers: INITIAL_ANSWERS,
        recommendedPackages: [],
        currentStep: 0,
        hasHistory: false,
        isEarlyTerminated: false,
        loading: false
      });
    } catch (err) {
      console.error("Error deleting survey history:", err);
      set({ loading: false });
    }
  }
}));

