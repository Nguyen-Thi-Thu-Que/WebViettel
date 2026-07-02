import { create } from 'zustand';
import type { User, Package, Transaction, FAQ, ChatMessage, ChatbotConfig, SurveyAnswers } from '../types';
import { MOCK_USERS, MOCK_TRANSACTIONS, MOCK_FAQS, DEFAULT_CHATBOT_CONFIG, MOCK_PACKAGES } from '../utils/mockData';
import { processChatMessage } from '../utils/chatbotEngine';
import { packageApi } from '../services/api';


// ==========================================
// 1. AUTH STORE
// ==========================================
interface AuthState {
  currentUser: User | null;
  transactions: Transaction[];
  faqs: FAQ[];
  login: (phoneNumber: string, role?: 'customer' | 'admin') => boolean;
  logout: () => void;
  updateProfile: (name: string, email: string) => void;
  changePassword: (oldPw: string, newPw: string) => boolean;
  deposit: (amount: number, method: string) => void;
  subscribePackage: (pkg: Package) => { success: boolean; message: string };
  unsubscribePackage: (packageId: string) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: MOCK_USERS[0], // Default logged-in user
  transactions: MOCK_TRANSACTIONS,
  faqs: MOCK_FAQS,

  login: (phoneNumber, role) => {
    // Look up existing user by phone number (autodetect role)
    const existing = MOCK_USERS.find(u => u.phoneNumber === phoneNumber);
    if (existing) {
      set({ currentUser: existing });
      return true;
    }
    
    // Create new mock user if not exists
    const newUserRole = role || 'customer';
    const newUser: User = {
      id: `user_${Date.now()}`,
      name: newUserRole === 'admin' ? 'Quản trị viên mới' : 'Khách hàng mới',
      phoneNumber,
      email: `${phoneNumber}@gmail.com`,
      balance: newUserRole === 'admin' ? 0 : 50000,
      activePackages: [],
      role: newUserRole
    };
    set({ currentUser: newUser });
    return true;
  },

  logout: () => {
    set({ currentUser: null });
  },

  updateProfile: (name, email) => {
    const { currentUser } = get();
    if (!currentUser) return;
    set({
      currentUser: {
        ...currentUser,
        name,
        email
      }
    });
  },

  changePassword: () => {
    return true; // Mock success
  },

  deposit: (amount, method) => {
    const { currentUser } = get();
    if (!currentUser) return;

    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      userId: currentUser.id,
      type: 'deposit',
      amount,
      paymentMethod: method,
      status: 'success',
      createdAt: new Date().toISOString()
    };

    set(state => ({
      currentUser: state.currentUser ? {
        ...state.currentUser,
        balance: state.currentUser.balance + amount
      } : null,
      transactions: [newTx, ...state.transactions]
    }));
  },

  subscribePackage: (pkg) => {
    const { currentUser } = get();
    if (!currentUser) {
      return { success: false, message: 'Vui lòng đăng nhập để đăng ký gói cước.' };
    }

    if (currentUser.balance < pkg.gia) {
      return { success: false, message: 'Số dư tài khoản không đủ. Vui lòng nạp thêm tiền.' };
    }

    // Check if already active
    const isAlreadyActive = currentUser.activePackages.some(ap => ap.packageId === pkg.id);
    if (isAlreadyActive) {
      return { success: false, message: `Bạn đang sử dụng gói ${pkg.ten} rồi.` };
    }

    const activatedAt = new Date().toISOString();
    const durationDays = parseInt(pkg.chu_ky_ngay) || 30;
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    const newActivePkg = {
      packageId: pkg.id,
      activatedAt,
      expiresAt
    };

    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      userId: currentUser.id,
      type: 'subscribe',
      amount: pkg.gia,
      packageName: pkg.ten,
      status: 'success',
      createdAt: activatedAt
    };

    set(state => ({
      currentUser: state.currentUser ? {
        ...state.currentUser,
        balance: state.currentUser.balance - pkg.gia,
        activePackages: [...state.currentUser.activePackages, newActivePkg]
      } : null,
      transactions: [newTx, ...state.transactions]
    }));

    return { success: true, message: `Đăng ký thành công gói cước ${pkg.ten}!` };
  },

  unsubscribePackage: (packageId) => {
    const { currentUser } = get();
    if (!currentUser) return;

    set(state => ({
      currentUser: state.currentUser ? {
        ...state.currentUser,
        activePackages: state.currentUser.activePackages.filter(p => p.packageId !== packageId)
      } : null
    }));
  }
}));

// Helper function to filter MOCK_PACKAGES client-side when backend API is unavailable
function filterMockPackages(params: Record<string, any>) {
  let filtered = [...MOCK_PACKAGES];

  if (params.search) {
    const s = params.search.toLowerCase();
    filtered = filtered.filter(p => 
      p.ten.toLowerCase().includes(s) || 
      p.id.toLowerCase().includes(s) || 
      (p.uudaitrong && p.uudaitrong.toLowerCase().includes(s))
    );
  }

  if (params.category && params.category !== 'all') {
    const cat = params.category.toLowerCase();
    filtered = filtered.filter(p => p.phan_loai_goi.toLowerCase() === cat);
  }

  if (params.price && params.price !== 'all') {
    if (params.price === 'under_50') filtered = filtered.filter(p => p.gia < 50000);
    else if (params.price === '50_100') filtered = filtered.filter(p => p.gia >= 50000 && p.gia <= 100000);
    else if (params.price === '100_200') filtered = filtered.filter(p => p.gia > 100000 && p.gia <= 200000);
    else if (params.price === 'above_200') filtered = filtered.filter(p => p.gia > 200000);
  }

  if (params.duration && params.duration !== 'all') {
    const dur = params.duration.toLowerCase();
    filtered = filtered.filter(p => {
      const days = parseInt(p.chu_ky_ngay) || 30;
      if (dur === 'daily') return days <= 1;
      if (dur === 'weekly') return days > 1 && days <= 15;
      if (dur === 'monthly') return days > 15 && days <= 90;
      return days > 90;
    });
  }

  if (params.voice === 'yes') {
    filtered = filtered.filter(p => p.free_noi_mang !== '0' && p.free_noi_mang !== '');
  } else if (params.voice === 'no') {
    filtered = filtered.filter(p => p.free_noi_mang === '0' || p.free_noi_mang === '');
  }

  if (params.sms === 'yes') {
    filtered = filtered.filter(p => p.sms !== '0' && p.sms !== '');
  } else if (params.sms === 'no') {
    filtered = filtered.filter(p => p.sms === '0' || p.sms === '');
  }

  if (params.target) {
    const t = params.target.toLowerCase();
    filtered = filtered.filter(p => p.dieu_kien_dang_ky.toLowerCase().includes(t));
  }

  // sorting
  if (params.sort === 'price_asc') {
    filtered.sort((a, b) => a.gia - b.gia);
  } else if (params.sort === 'price_desc') {
    filtered.sort((a, b) => b.gia - a.gia);
  }

  const page = params.page || 1;
  const limit = params.limit || 8;
  const startIndex = (page - 1) * limit;
  const paginated = filtered.slice(startIndex, startIndex + limit);

  return {
    packages: paginated,
    totalPages: Math.ceil(filtered.length / limit),
    totalItems: filtered.length
  };
}

// ==========================================
// 2. PACKAGE STORE (INCLUDING COMPARE & CRUD)
// ==========================================
interface PackageState {
  packages: Package[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  totalItems: number;
  compareList: Package[];
  currentPackage: Package | null;
  addToCompare: (pkg: Package) => { success: boolean; message: string };
  removeFromCompare: (packageId: string) => void;
  clearCompare: () => void;
  fetchPackages: (params: Record<string, any>) => Promise<void>;
  fetchPackageById: (id: string) => Promise<void>;
  addPackage: (pkg: Omit<Package, 'id' | 'phan_khuc_gia'>) => Promise<boolean>;
  updatePackage: (id: string, updated: Partial<Package>) => Promise<boolean>;
  deletePackage: (id: string) => Promise<boolean>;
}

export const usePackageStore = create<PackageState>((set) => ({
  packages: [],
  loading: false,
  error: null,
  totalPages: 1,
  totalItems: 0,
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

  fetchPackages: async (params) => {
    set({ loading: true, error: null });
    try {
      const data = await packageApi.fetchPackages(params);
      if (data && data.packages && data.packages.length > 0) {
        set({ 
          packages: data.packages, 
          totalPages: data.totalPages, 
          totalItems: data.totalItems,
          loading: false 
        });
      } else {
        console.warn("API returned empty package list. Falling back to MOCK_PACKAGES...");
        const fallback = filterMockPackages(params);
        set({
          packages: fallback.packages,
          totalPages: fallback.totalPages,
          totalItems: fallback.totalItems,
          loading: false
        });
      }
    } catch (err: any) {
      console.error("Error fetching packages from API, falling back to MOCK_PACKAGES:", err);
      const fallback = filterMockPackages(params);
      set({
        packages: fallback.packages,
        totalPages: fallback.totalPages,
        totalItems: fallback.totalItems,
        loading: false
      });
    }
  },

  fetchPackageById: async (id) => {
    set({ loading: true, error: null, currentPackage: null });
    try {
      const pkg = await packageApi.fetchPackageById(id);
      if (pkg && pkg.id) {
        set({ currentPackage: pkg, loading: false });
      } else {
        console.warn(`Package ${id} not found in API. Falling back to MOCK_PACKAGES...`);
        const mockPkg = MOCK_PACKAGES.find(p => p.id === id);
        if (mockPkg) {
          set({ currentPackage: mockPkg, loading: false });
        } else {
          set({ error: 'Gói cước không tồn tại.', loading: false });
        }
      }
    } catch (err: any) {
      console.error(`Error fetching package ${id} from API, falling back to MOCK_PACKAGES:`, err);
      const mockPkg = MOCK_PACKAGES.find(p => p.id === id);
      if (mockPkg) {
        set({ currentPackage: mockPkg, loading: false });
      } else {
        set({ error: 'Gói cước không tồn tại.', loading: false });
      }
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
  config: ChatbotConfig;
  setIsOpen: (isOpen: boolean) => void;
  sendMessage: (text: string) => void;
  updateConfig: (config: ChatbotConfig) => void;
  clearHistory: () => void;
}

const INITIAL_WELCOME_MSG: ChatMessage = {
  id: 'msg_welcome',
  sender: 'bot',
  text: 'Xin chào! Tôi là trợ lý ảo Viettel AI. Tôi có thể giúp gì cho bạn hôm nay? Bạn có thể hỏi về các gói cước như: thoại, data khủng, mạng xã hội, hoặc làm khảo sát nhu cầu nhé!',
  createdAt: new Date().toISOString()
};

export const useChatbotStore = create<ChatbotState>((set, get) => ({
  messages: [INITIAL_WELCOME_MSG],
  isOpen: false,
  config: DEFAULT_CHATBOT_CONFIG,

  setIsOpen: (isOpen) => set({ isOpen }),

  sendMessage: (text) => {
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      sender: 'user',
      text,
      createdAt: new Date().toISOString()
    };

    set(state => ({ messages: [...state.messages, userMsg] }));

    // Simulate Bot response delay
    setTimeout(() => {
      const { config } = get();
      const botResponse = processChatMessage(text, config);

      const botMsg: ChatMessage = {
        id: `msg_${Date.now()}_bot`,
        sender: 'bot',
        text: botResponse.text,
        suggestedAction: botResponse.suggestedAction,
        createdAt: new Date().toISOString()
      };

      set(state => ({ messages: [...state.messages, botMsg] }));
    }, 600);
  },

  updateConfig: (newConfig) => set({ config: newConfig }),

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
