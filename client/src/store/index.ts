import { create } from 'zustand';
import type { User, Package, Transaction, FAQ, ChatMessage, ChatbotConfig, SurveyAnswers } from '../types';
import { MOCK_PACKAGES, MOCK_USERS, MOCK_TRANSACTIONS, MOCK_FAQS, DEFAULT_CHATBOT_CONFIG } from '../utils/mockData';
import { processChatMessage } from '../utils/chatbotEngine';

// ==========================================
// 1. AUTH STORE
// ==========================================
interface AuthState {
  currentUser: User | null;
  transactions: Transaction[];
  faqs: FAQ[];
  login: (phoneNumber: string, role: 'customer' | 'admin') => boolean;
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
    const existing = MOCK_USERS.find(u => u.phoneNumber === phoneNumber && u.role === role);
    if (existing) {
      set({ currentUser: existing });
      return true;
    }
    // Create new mock user if not exists
    const newUser: User = {
      id: `user_${Date.now()}`,
      name: role === 'admin' ? 'Quản trị viên mới' : 'Khách hàng mới',
      phoneNumber,
      email: `${phoneNumber}@gmail.com`,
      balance: role === 'admin' ? 0 : 50000,
      activePackages: [],
      role
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

    if (currentUser.balance < pkg.price) {
      return { success: false, message: 'Số dư tài khoản không đủ. Vui lòng nạp thêm tiền.' };
    }

    // Check if already active
    const isAlreadyActive = currentUser.activePackages.some(ap => ap.packageId === pkg.id);
    if (isAlreadyActive) {
      return { success: false, message: `Bạn đang sử dụng gói ${pkg.name} rồi.` };
    }

    const activatedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + pkg.durationDays * 24 * 60 * 60 * 1000).toISOString();

    const newActivePkg = {
      packageId: pkg.id,
      activatedAt,
      expiresAt
    };

    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      userId: currentUser.id,
      type: 'subscribe',
      amount: pkg.price,
      packageName: pkg.name,
      status: 'success',
      createdAt: activatedAt
    };

    set(state => ({
      currentUser: state.currentUser ? {
        ...state.currentUser,
        balance: state.currentUser.balance - pkg.price,
        activePackages: [...state.currentUser.activePackages, newActivePkg]
      } : null,
      transactions: [newTx, ...state.transactions]
    }));

    return { success: true, message: `Đăng ký thành công gói cước ${pkg.name}!` };
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

// ==========================================
// 2. PACKAGE STORE (INCLUDING COMPARE & CRUD)
// ==========================================
interface PackageState {
  packages: Package[];
  compareList: Package[];
  addToCompare: (pkg: Package) => { success: boolean; message: string };
  removeFromCompare: (packageId: string) => void;
  clearCompare: () => void;
  addPackage: (pkg: Omit<Package, 'id' | 'registrationsCount' | 'rating'>) => void;
  updatePackage: (id: string, updated: Partial<Package>) => void;
  deletePackage: (id: string) => void;
}

export const usePackageStore = create<PackageState>((set) => ({
  packages: MOCK_PACKAGES,
  compareList: [],

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

  addPackage: (newPkg) => {
    set(state => {
      const created: Package = {
        ...newPkg,
        id: newPkg.name.toLowerCase().replace(/\s+/g, '_'),
        registrationsCount: 0,
        rating: 5.0
      };
      return { packages: [...state.packages, created] };
    });
  },

  updatePackage: (id, updated) => {
    set(state => ({
      packages: state.packages.map(p => p.id === id ? { ...p, ...updated } : p)
    }));
  },

  deletePackage: (id) => {
    set(state => ({
      packages: state.packages.filter(p => p.id !== id),
      compareList: state.compareList.filter(p => p.id !== id)
    }));
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
  voiceDemand: 'none',
  socialApps: []
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
    let scoredPackages = allPackages.map(pkg => {
      let score = 0;

      // 1. Budget Score
      if (answers.budget === 'under_50' && pkg.price <= 50000) score += 30;
      else if (answers.budget === '50_100' && pkg.price > 50000 && pkg.price <= 100000) score += 30;
      else if (answers.budget === '100_200' && pkg.price > 100000 && pkg.price <= 200000) score += 30;
      else if (answers.budget === 'above_200' && pkg.price > 200000) score += 30;
      else if (answers.budget === 'any') score += 10;

      // 2. Data Demand Score
      const dataPerDay = pkg.dataPerDayGb || 0;
      if (answers.dataDemand === 'unlimited' && pkg.id === 'umax300') score += 40;
      else if (answers.dataDemand === 'high' && dataPerDay >= 3) score += 30;
      else if (answers.dataDemand === 'medium' && dataPerDay >= 1 && dataPerDay < 3) score += 30;
      else if (answers.dataDemand === 'low' && dataPerDay > 0 && dataPerDay < 1) score += 20;
      else if (answers.dataDemand === 'none' && dataPerDay === 0) score += 20;

      // 3. Voice Demand Score
      if (answers.voiceDemand === 'high' && pkg.voiceFreeInternalMin > 0) score += 30;
      else if (answers.voiceDemand === 'low' && pkg.voiceFreeInternalMin > 0 && pkg.price <= 90000) score += 20;
      else if (answers.voiceDemand === 'none' && pkg.voiceFreeInternalMin === 0) score += 15;

      // 4. Social Apps Match Score
      if (answers.socialApps.length > 0 && pkg.socialFreeApps.length > 0) {
        const matches = answers.socialApps.filter(app => pkg.socialFreeApps.includes(app));
        score += matches.length * 15; // 15 points per matching free social app
      }

      return { pkg, score };
    });

    // Sort by score descending and take top 3
    scoredPackages.sort((a, b) => b.score - a.score);
    const recommendations = scoredPackages.slice(0, 3).map(sp => sp.pkg);

    set({ recommendedPackages: recommendations });
  }
}));
