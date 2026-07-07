import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User, CreditCard, History, Shield, Check, Eye, EyeOff } from 'lucide-react';
import { useAuthStore, usePackageStore } from '../store';
import SEO from '../components/SEO';
import { useWeb3 } from '../hooks/useWeb3';
import { getBlockchainConfig } from '../services/web3Service';
import type { Transaction } from '../types';

// Schemas for forms
const profileSchema = z.object({
  name: z.string().min(2, { message: 'Họ tên phải chứa ít nhất 2 ký tự' }),
  email: z.string().email({ message: 'Địa chỉ email không hợp lệ' })
});

const passwordSchema = z.object({
  oldPassword: z.string().min(6, { message: 'Mật khẩu cũ phải từ 6 ký tự' }),
  newPassword: z.string().min(6, { message: 'Mật khẩu mới phải từ 6 ký tự' }),
  confirmNewPassword: z.string().min(6, { message: 'Nhập lại mật khẩu mới' })
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Mật khẩu mới nhập lại không trùng khớp',
  path: ['confirmNewPassword']
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function Profile() {
  const navigate = useNavigate();
  const { currentUser, transactions, unsubscribePackage, updateProfile, changePassword, depositBlockchain } = useAuthStore();
  const { packages } = usePackageStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'info';

  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Wallet states
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [customAmountStr, setCustomAmountStr] = useState<string>('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Subscription cancellation states
  const [cancellingPkgId, setCancellingPkgId] = useState<string | null>(null);

  // Show/Hide password states
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Submitting states to prevent double submits
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [isUnsubmitting, setIsUnsubmitting] = useState(false);
  const [selectedTxDetail, setSelectedTxDetail] = useState<Transaction | null>(null);
  const showDetailModal = !!selectedTxDetail;

  // Web3 MetaMask hook and integration states
  const { isInstalled, isConnected, walletAddress, isSepolia, connect, switchToSepolia } = useWeb3();
  const { linkWalletAddress } = useAuthStore();

  const handleConnectWallet = async () => {
    const res = await connect();
    const config = getBlockchainConfig();
    if (res.success && res.address) {
      showToast('success', 'Kết nối MetaMask thành công!');
      if (!res.isSepolia) {
        showToast('error', `Vui lòng chuyển mạng sang ${config.networkName} để tiếp tục.`);
        return;
      }
      
      // Auto-link to account on backend!
      const linkRes = await linkWalletAddress(res.address);
      
      if (linkRes.success) {
        showToast('success', 'Liên kết ví thành công!');
      } else {
        showToast('error', linkRes.message || 'Liên kết ví thất bại.');
      }
    } else {
      showToast('error', res.error || 'Kết nối ví bị từ chối hoặc thất bại.');
    }
  };

  const handleSwitchNetwork = async () => {
    const success = await switchToSepolia();
    const config = getBlockchainConfig();
    if (success) {
      showToast('success', `Chuyển sang mạng ${config.networkName} thành công!`);
    } else {
      showToast('error', 'Chuyển mạng thất bại. Vui lòng thử lại.');
    }
  };

  const handlePresetSelect = (presetVal: number) => {
    setSelectedPreset(presetVal);
    setCustomAmountStr(presetVal.toLocaleString('vi-VN') + ' VNĐ');
  };

  const handleCustomAmountInput = (val: string) => {
    const numericString = val.replace(/\D/g, '');
    if (!numericString) {
      setCustomAmountStr('');
      setSelectedPreset(null);
      return;
    }
    const parsedNum = parseInt(numericString, 10);
    setSelectedPreset(null);
    setCustomAmountStr(parsedNum.toLocaleString('vi-VN') + ' VNĐ');
  };

  const getSummaryAmount = () => {
    if (selectedPreset !== null) {
      return selectedPreset.toLocaleString('vi-VN') + ' VNĐ';
    }
    if (!customAmountStr) {
      return '0 VNĐ';
    }
    return customAmountStr;
  };

  const handleBlockchainDeposit = async () => {
    let vndAmount = 0;
    if (selectedPreset !== null) {
      vndAmount = selectedPreset;
    } else if (customAmountStr) {
      const numStr = customAmountStr.replace(/\D/g, '');
      if (numStr) {
        vndAmount = parseInt(numStr, 10);
      }
    }

    if (vndAmount < 10000) {
      showToast('error', 'Số tiền nạp tối thiểu là 10.000 VNĐ');
      return;
    }

    if (!isConnected || !walletAddress || !isSepolia) {
      showToast('error', 'Vui lòng kết nối ví MetaMask trên đúng mạng Sepolia.');
      return;
    }

    setIsDepositing(true);
    try {
      const config = getBlockchainConfig();
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      
      const networkObj = await provider.getNetwork();
      if (String(networkObj.chainId) !== String(config.chainIdDecimal)) {
        showToast('error', `Vui lòng chuyển mạng sang ${config.networkName} để thực hiện giao dịch.`);
        setIsDepositing(false);
        return;
      }

      const balance = await provider.getBalance(walletAddress);
      
      const exchangeRate = parseFloat(import.meta.env.VITE_ETH_EXCHANGE_RATE || '75000000');
      const ethAmountVal = vndAmount / exchangeRate;
      const ethAmountString = ethAmountVal.toFixed(18);
      const valueWei = ethers.parseEther(ethAmountString);

      const signer = await provider.getSigner();
      let gasEstimate = 21000n;
      try {
        gasEstimate = await signer.estimateGas({
          to: config.receiverWallet,
          value: valueWei
        });
      } catch (gasErr) {
        console.warn('Gas estimation failed, using standard transaction gas limit', gasErr);
      }

      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || ethers.parseUnits('10', 'gwei');
      const totalGasCost = gasEstimate * gasPrice;
      const totalRequired = valueWei + totalGasCost;

      if (balance < totalRequired) {
        showToast('error', 'Số dư tài khoản ETH không đủ để thanh toán giá trị giao dịch và phí gas.');
        setIsDepositing(false);
        return;
      }

      const txResponse = await signer.sendTransaction({
        to: config.receiverWallet,
        value: valueWei
      });

      showToast('success', 'Giao dịch đã được gửi lên Blockchain. Vui lòng chờ xác nhận...');

      const receipt = await txResponse.wait();
      if (!receipt || receipt.status !== 1) {
        throw new Error('Giao dịch Blockchain thất bại hoặc không được xác nhận.');
      }

      const res = await depositBlockchain(vndAmount, receipt.hash, walletAddress, config.networkName);

      if (res.success) {
        showToast('success', `Nạp tiền thành công! Đã cộng ${vndAmount.toLocaleString('vi-VN')} VNĐ vào số dư tài khoản.`);
        setSelectedPreset(null);
        setCustomAmountStr('');
      } else {
        showToast('error', res.message || 'Xác nhận nạp tiền thất bại.');
      }
    } catch (err: any) {
      console.error('Deposit error:', err);
      if (err.code === 4001 || err.message?.includes('rejected') || err.message?.includes('User denied')) {
        showToast('error', 'Giao dịch đã bị hủy bởi người dùng.');
      } else {
        showToast('error', err.message || 'Có lỗi xảy ra trong quá trình nạp tiền.');
      }
    } finally {
      setIsDepositing(false);
    }
  };

  // If user is not logged in, redirect to login
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    } else {
      useAuthStore.getState().fetchTransactions().catch(() => { });
      useAuthStore.getState().fetchFAQs().catch(() => { });
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (activeTab === 'history' && currentUser) {
      const loadHistory = async () => {
        setHistoryLoading(true);
        setHistoryError(null);
        try {
          await useAuthStore.getState().fetchTransactions();
        } catch (err: any) {
          setHistoryError(err.response?.data?.message || err.message || 'Không thể tải lịch sử giao dịch. Vui lòng thử lại sau.');
        } finally {
          setHistoryLoading(false);
        }
      };
      loadHistory();
    }
  }, [activeTab, currentUser]);

  const formatHash = (hash: string) => {
    if (!hash) return '—';
    if (hash.length <= 12) return hash;
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
  };



  if (!currentUser) return null;

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 3000);
  };

  // React Hook Forms
  const { register: registerProfile, handleSubmit: handleProfileSubmit, formState: { errors: profileErrors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: currentUser.name,
      email: currentUser.email
    }
  });

  const { register: registerPassword, handleSubmit: handlePasswordSubmit, reset: resetPasswordForm, formState: { errors: passwordErrors } } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema)
  });

  const onProfileSubmit = async (data: ProfileFormValues) => {
    setIsSubmittingProfile(true);
    const success = await updateProfile(data.name, data.email);
    setIsSubmittingProfile(false);
    if (success) {
      showToast('success', 'Cập nhật thông tin cá nhân thành công!');
    } else {
      showToast('error', 'Cập nhật thông tin cá nhân thất bại.');
    }
  };

  const onPasswordSubmit = async (data: PasswordFormValues) => {
    setIsSubmittingPassword(true);
    const success = await changePassword(data.oldPassword, data.newPassword);
    setIsSubmittingPassword(false);
    if (success) {
      showToast('success', 'Thay đổi mật khẩu thành công!');
      resetPasswordForm();
    } else {
      showToast('error', 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ.');
    }
  };



  const handleUnsubscribeClick = (pkgId: string) => {
    setCancellingPkgId(pkgId);
  };

  const handleConfirmUnsubscribe = async () => {
    if (cancellingPkgId) {
      setIsUnsubmitting(true);
      try {
        await unsubscribePackage(cancellingPkgId);
        showToast('success', 'Đã hủy gia hạn gói cước thành công.');
      } catch (err) {
        showToast('error', 'Hủy gia hạn gói cước thất bại.');
      } finally {
        setIsUnsubmitting(false);
        setCancellingPkgId(null);
      }
    }
  };

  const tabs = [
    { id: 'info', label: 'Hồ sơ cá nhân', icon: User },
    { id: 'topup', label: 'Nạp tiền tài khoản', icon: CreditCard },
    { id: 'packages', label: 'Gói cước đang dùng', icon: Shield },
    { id: 'history', label: 'Lịch sử giao dịch', icon: History }
  ];

  // Breadcrumbs schema for Profile Page
  const profileBreadcrumbsSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Trang chủ",
        "item": window.location.origin
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Hồ sơ cá nhân",
        "item": `${window.location.origin}/profile`
      }
    ]
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pb-16 relative animate-fade-in text-xs font-semibold">
      {/* SEO configuration */}
      <SEO
        title="Quản Lý Tài Khoản Khách Hàng - Cổng Thông Tin Viettel AI"
        description="Quản lý hồ sơ cá nhân, đổi mật khẩu bảo mật, xem các gói cước đang hoạt động và nạp tiền tài khoản ảo phục vụ đăng ký gói cước Viettel di động."
        schema={profileBreadcrumbsSchema}
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-lg shadow-lg border-l-4 text-xs font-semibold bg-white text-slate-800 ${toastMsg.type === 'success' ? 'border-emerald-500' : 'border-red-500'
          }`}>
          {toastMsg.text}
        </div>
      )}

      {/* Left Column: Navigation Tabs Sidebar */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white border border-slate-100 shadow-sm p-5 rounded-2xl space-y-4 text-left">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-50">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center font-bold text-white text-base">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">{currentUser.name}</h3>
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">{currentUser.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}</span>
            </div>
          </div>

          <div className="flex flex-col space-y-1.5">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSearchParams({ tab: tab.id })}
                  className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left focus:outline-none cursor-pointer ${isSelected
                      ? 'bg-red-50/70 text-primary border-l-2 border-primary pl-4'
                      : 'text-slate-550 hover:bg-slate-50 hover:text-slate-950'
                    }`}
                >
                  <TabIcon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Column: Dynamic Tabs Content Area */}
      <div className="lg:col-span-3">
        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 md:p-8 space-y-6">
          {/* Tab 1: Profile Info & Change Password */}
          {activeTab === 'info' && (
            <div className="space-y-8 text-left">
              <div className="border-b border-slate-50 pb-4">
                <h2 className="text-lg font-bold text-slate-900">Hồ sơ cá nhân</h2>
                <p className="text-slate-400 text-xs mt-0.5 font-medium">Quản lý và điều chỉnh thông tin liên lạc của bạn.</p>
              </div>

              {/* Profile Details Form */}
              <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Số điện thoại</label>
                  <input
                    type="text"
                    disabled
                    value={currentUser.phoneNumber}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-405 cursor-not-allowed focus:outline-none"
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loại tài khoản</label>
                  <input
                    type="text"
                    disabled
                    value={currentUser.role === 'admin' ? 'Quản trị viên (Admin)' : 'Thuê bao di động'}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-405 cursor-not-allowed focus:outline-none"
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loại thuê bao</label>
                  <input
                    type="text"
                    disabled
                    value={currentUser.subscription_type === 'tra_sau' ? 'Trả sau' : 'Trả trước'}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-405 cursor-not-allowed focus:outline-none"
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trạng thái KHTT</label>
                  <input
                    type="text"
                    disabled
                    value={currentUser.is_loyal_customer ? 'Khách hàng thân thiết (KHTT)' : 'Thành viên thường'}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-405 cursor-not-allowed focus:outline-none"
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trạng thái tài khoản</label>
                  <input
                    type="text"
                    disabled
                    value={currentUser.status === 'blocked' ? 'Bị khóa' : currentUser.status === 'pending' ? 'Chờ kích hoạt' : 'Đang hoạt động'}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-405 cursor-not-allowed focus:outline-none"
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Họ và tên</label>
                  <input
                    type="text"
                    {...registerProfile('name')}
                    className={`w-full bg-slate-50 border ${profileErrors.name ? 'border-red-500' : 'border-slate-200 focus:border-primary/50 focus:bg-white'
                      } rounded-xl py-2.5 px-3.5 text-xs text-slate-700 focus:outline-none transition-colors input-premium-focus`}
                  />
                  {profileErrors.name && <p className="text-[9px] text-red-500 mt-0.5">{profileErrors.name.message}</p>}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Địa chỉ Email</label>
                  <input
                    type="text"
                    {...registerProfile('email')}
                    className={`w-full bg-slate-50 border ${profileErrors.email ? 'border-red-500' : 'border-slate-200 focus:border-primary/50 focus:bg-white'
                      } rounded-xl py-2.5 px-3.5 text-xs text-slate-700 focus:outline-none transition-colors input-premium-focus`}
                  />
                  {profileErrors.email && <p className="text-[9px] text-red-500 mt-0.5">{profileErrors.email.message}</p>}
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmittingProfile}
                    className="bg-primary hover:bg-primary-hover disabled:bg-slate-150 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-colors focus:outline-none cursor-pointer"
                  >
                    {isSubmittingProfile ? 'Đang cập nhật...' : 'Cập nhật thông tin'}
                  </button>
                </div>
              </form>

              {/* Password Change Form */}
              <div className="border-t border-slate-50 pt-6 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Thay đổi mật khẩu</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Mật khẩu mới phải dài tối thiểu 6 ký tự để bảo mật.</p>
                </div>

                <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mật khẩu hiện tại</label>
                    <div className="relative flex items-center">
                      <input
                        type={showOldPassword ? 'text' : 'password'}
                        placeholder="Nhập mật khẩu cũ..."
                        {...registerPassword('oldPassword')}
                        className={`w-full bg-slate-50 border ${passwordErrors.oldPassword ? 'border-red-500' : 'border-slate-200 focus:border-primary/50 focus:bg-white'
                          } rounded-xl py-2.5 pl-3.5 pr-10 text-xs text-slate-700 focus:outline-none transition-colors input-premium-focus`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        aria-label={showOldPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/20"
                      >
                        {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {passwordErrors.oldPassword && <p className="text-[9px] text-red-500 mt-0.5">{passwordErrors.oldPassword.message}</p>}
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mật khẩu mới</label>
                    <div className="relative flex items-center">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="Mật khẩu mới..."
                        {...registerPassword('newPassword')}
                        className={`w-full bg-slate-50 border ${passwordErrors.newPassword ? 'border-red-500' : 'border-slate-200 focus:border-primary/50 focus:bg-white'
                          } rounded-xl py-2.5 pl-3.5 pr-10 text-xs text-slate-700 focus:outline-none transition-colors input-premium-focus`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        aria-label={showNewPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/20"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {passwordErrors.newPassword && <p className="text-[9px] text-red-500 mt-0.5">{passwordErrors.newPassword.message}</p>}
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nhập lại mật khẩu</label>
                    <div className="relative flex items-center">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Nhập lại mật khẩu mới..."
                        {...registerPassword('confirmNewPassword')}
                        className={`w-full bg-slate-50 border ${passwordErrors.confirmNewPassword ? 'border-red-500' : 'border-slate-200 focus:border-primary/50 focus:bg-white'
                          } rounded-xl py-2.5 pl-3.5 pr-10 text-xs text-slate-700 focus:outline-none transition-colors input-premium-focus`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/20"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {passwordErrors.confirmNewPassword && <p className="text-[9px] text-red-500 mt-0.5">{passwordErrors.confirmNewPassword.message}</p>}
                  </div>
                  <div className="md:col-span-3 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmittingPassword}
                      className="bg-white border border-slate-200 hover:bg-slate-50 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed text-slate-600 hover:text-slate-900 px-5 py-2.5 rounded-xl text-xs transition-colors font-bold focus:outline-none cursor-pointer"
                    >
                      {isSubmittingPassword ? 'Đang thay đổi...' : 'Thay đổi mật khẩu'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Tab 2: MetaMask Topup & Connection */}
          {activeTab === 'topup' && (
            <div className="space-y-6 text-left max-w-xl">
              <div className="border-b border-slate-50 pb-4">
                <h2 className="text-lg font-bold text-slate-900">Cổng nạp tiền ví</h2>
                <p className="text-slate-400 text-xs mt-0.5 font-medium">
                  Kết nối ví MetaMask và nạp tiền vào tài khoản.
                </p>
              </div>

              {/* 1. Card kết nối MetaMask */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-lg select-none">
                    🦊
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900">Ví MetaMask</h3>
                    {isConnected && walletAddress && (
                      <p className="text-xs font-mono text-slate-500 mt-0.5 break-all select-all leading-normal">
                        {walletAddress}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  {!isInstalled ? (
                    <a
                      href="https://metamask.io/download/"
                      target="_blank"
                      rel="noreferrer"
                      className="block w-full text-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition-all text-xs border border-slate-200"
                    >
                      Cài đặt MetaMask
                    </a>
                  ) : !isConnected ? (
                    <button
                      type="button"
                      onClick={handleConnectWallet}
                      className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-2.5 rounded-xl transition-all text-xs cursor-pointer"
                    >
                      Kết nối MetaMask
                    </button>
                  ) : !isSepolia ? (
                    <button
                      type="button"
                      onClick={handleSwitchNetwork}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl transition-all text-xs cursor-pointer"
                    >
                      Chuyển mạng sang {getBlockchainConfig().networkName}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="w-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-1.5 cursor-default"
                    >
                      <Check className="w-4 h-4 text-emerald-650" />
                      <span>Đã kết nối</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 2. Thiết kế khu vực nạp tiền */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Nạp tiền vào tài khoản</h3>
                  <p className="text-slate-400 text-xs mt-0.5 font-medium">
                    Chọn số tiền bạn muốn nạp vào tài khoản.
                  </p>
                </div>

                {/* 3. Các mức tiền có sẵn */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Mức tiền có sẵn
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[10000, 20000, 30000, 50000, 100000, 200000, 300000, 500000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handlePresetSelect(preset)}
                        className={`py-2.5 px-2 text-center rounded-xl border text-xs font-bold transition-all focus:outline-none cursor-pointer ${
                          selectedPreset === preset
                            ? 'bg-red-50 border-primary text-primary shadow-sm'
                            : 'bg-slate-50/60 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        {preset.toLocaleString('vi-VN')} VNĐ
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Nhập số tiền tùy chỉnh */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Số tiền muốn nạp
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập số tiền..."
                    value={customAmountStr}
                    onChange={(e) => handleCustomAmountInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-primary/50 focus:bg-white rounded-xl py-2.5 px-3.5 text-xs text-slate-700 focus:outline-none transition-colors input-premium-focus font-bold"
                  />
                </div>

                {/* 6. Tóm tắt giao dịch & 7. Nút thanh toán */}
                <div className="border-t border-slate-100 pt-5 space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      Số tiền sẽ nạp:
                    </span>
                    <span className="text-base font-black text-slate-900">
                      {getSummaryAmount()}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleBlockchainDeposit}
                    disabled={!(isConnected && walletAddress && isSepolia) || isDepositing}
                    className="w-full py-3 bg-primary hover:bg-primary-hover disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs transition-colors shadow-sm cursor-pointer animate-scale-up"
                  >
                    {isDepositing ? 'Đang nạp tiền...' : 'Nạp tiền'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Active Subscriptions List */}
          {activeTab === 'packages' && (
            <div className="space-y-6 text-left">
              <div className="border-b border-slate-50 pb-4">
                <h2 className="text-lg font-bold text-slate-900">Gói cước đang sử dụng</h2>
                <p className="text-slate-400 text-xs mt-0.5 font-medium">Danh sách các gói cước dịch vụ đang kích hoạt trên thuê bao di động.</p>
              </div>

              {currentUser.activePackages.length > 0 ? (
                <div className="space-y-4">
                  {currentUser.activePackages.map((ap) => {
                    const pkgDetail = packages.find(p => p.id === ap.packageId);
                    if (!pkgDetail) return null;
                    return (
                      <div
                        key={ap.packageId}
                        className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-4 relative overflow-hidden"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-base font-extrabold text-slate-900">{pkgDetail.ten}</h4>
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                              Đang hoạt động
                            </span>
                          </div>
                          <p className="text-slate-500 text-xs max-w-lg font-medium">{pkgDetail.uudaitrong}</p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            <p>Kích hoạt: <span className="text-slate-800 font-extrabold">{new Date(ap.activatedAt).toLocaleDateString('vi-VN')}</span></p>
                            <p>Hết hạn: <span className="text-slate-800 font-extrabold">{new Date(ap.expiresAt).toLocaleDateString('vi-VN')}</span></p>
                            <p>Chu kỳ: <span className="text-slate-800 font-extrabold">{pkgDetail.chu_ky_ngay} ngày</span></p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleUnsubscribeClick(ap.packageId)}
                          className="shrink-0 text-xs font-bold text-primary hover:bg-red-50 border border-red-150 px-4 py-2.5 rounded-xl transition-all text-center focus:outline-none cursor-pointer"
                        >
                          Hủy gia hạn gói
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200/50 p-10 rounded-2xl text-center max-w-sm mx-auto space-y-4">
                  <p className="text-slate-500 text-xs font-medium">Bạn hiện chưa đăng ký sử dụng gói cước di động nào.</p>
                  <button
                    onClick={() => navigate('/packages')}
                    className="bg-primary hover:bg-primary-hover text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors focus:outline-none cursor-pointer shadow-sm"
                  >
                    Xem các gói cước ngay
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Transaction Ledger History */}
          {activeTab === 'history' && (
            <div className="space-y-6 text-left">
              <div className="border-b border-slate-50 pb-4">
                <h2 className="text-lg font-bold text-slate-900">Lịch sử giao dịch</h2>
                <p className="text-slate-400 text-xs mt-0.5 font-medium">
                  Xem lại nhật ký các giao dịch nạp tiền của bạn.
                </p>
              </div>

              {historyLoading ? (
                /* Skeleton Loading state */
                <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="p-4">Thời gian</th>
                        <th className="p-4">Số tiền</th>
                        <th className="p-4">Trạng thái</th>
                        <th className="p-4">Mã giao dịch</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {[1, 2, 3].map((i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="p-4">
                            <div className="h-4 bg-slate-100 rounded w-24"></div>
                          </td>
                          <td className="p-4">
                            <div className="h-4 bg-slate-100 rounded w-16"></div>
                          </td>
                          <td className="p-4">
                            <div className="h-5 bg-slate-100 rounded-full w-20"></div>
                          </td>
                          <td className="p-4">
                            <div className="h-4 bg-slate-100 rounded w-48"></div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : historyError ? (
                /* Error State */
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs flex items-center space-x-2 font-medium">
                  <span>⚠️ Lỗi tải dữ liệu: {historyError}</span>
                </div>
              ) : transactions.length > 0 ? (
                /* Data State */
                <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="p-4">Thời gian</th>
                        <th className="p-4">Số tiền</th>
                        <th className="p-4">Trạng thái</th>
                        <th className="p-4">Mã giao dịch</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-slate-700">
                      {transactions.map((tx) => (
                        <tr
                          key={tx.id}
                          onClick={() => setSelectedTxDetail(tx)}
                          className="hover:bg-slate-50/40 transition-colors cursor-pointer"
                        >
                          <td className="p-4 text-slate-550 font-semibold">
                            {tx.createdAt ? new Date(tx.createdAt).toLocaleString('vi-VN') : 'Không rõ'}
                          </td>
                          <td className="p-4 font-bold text-slate-800">
                            {tx.type === 'deposit' ? '+' : '-'}
                            {tx.amount.toLocaleString()} VNĐ
                          </td>
                          <td className="p-4">
                            {tx.status === 'success' ? (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] px-2.5 py-0.5 rounded-full font-bold">
                                Thành công
                              </span>
                            ) : tx.status === 'pending' ? (
                              <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[9px] px-2.5 py-0.5 rounded-full font-bold animate-pulse">
                                Đang xử lý
                              </span>
                            ) : (
                              <span className="bg-red-50 text-red-700 border border-red-100 text-[9px] px-2.5 py-0.5 rounded-full font-bold">
                                Thất bại
                              </span>
                            )}
                          </td>
                          <td className="p-4 font-mono text-[10px] text-slate-550 font-bold break-all select-all">
                            {formatHash(tx.txHash || tx.id)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Empty State */
                <div className="bg-slate-50 border border-slate-200/50 p-10 rounded-2xl text-center max-w-sm mx-auto space-y-2">
                  <p className="text-slate-500 text-xs font-semibold">Chưa ghi nhận giao dịch nào.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>



      {/* Subscription Unsubscribe Confirmation Modal */}
      {cancellingPkgId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 max-w-sm w-full shadow-md animate-scale-up z-50 text-left">
            <h4 className="text-base font-extrabold text-slate-900 mb-2">Hủy gói cước di động</h4>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed font-semibold">
              Bạn có chắc chắn muốn hủy gia hạn gói cước <strong className="text-primary">{cancellingPkgId.toUpperCase()}</strong>?
              Bạn vẫn tiếp tục sử dụng dung lượng còn lại cho đến hết thời hạn chu kỳ hiện tại.
            </p>
            <div className="flex space-x-3">
              <button
                disabled={isUnsubmitting}
                onClick={() => setCancellingPkgId(null)}
                className="flex-1 py-2.5 bg-slate-50 border border-slate-200 text-slate-605 hover:text-slate-950 hover:bg-slate-100 rounded-xl text-xs transition-colors font-bold focus:outline-none disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                disabled={isUnsubmitting}
                onClick={handleConfirmUnsubscribe}
                className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl text-xs transition-colors focus:outline-none cursor-pointer disabled:opacity-50"
              >
                {isUnsubmitting ? 'Đang hủy...' : 'Đồng ý hủy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Detail Modal */}
      {showDetailModal && selectedTxDetail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 max-w-md w-full shadow-md animate-scale-up z-50 text-left">
            <h3 className="text-base font-extrabold text-slate-900 mb-4">Chi tiết giao dịch</h3>
            
            <div className="space-y-3 text-xs text-slate-600 font-medium">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Mã giao dịch</span>
                <span className="font-mono font-bold text-slate-800 break-all select-all">
                  {selectedTxDetail.txHash || selectedTxDetail.id}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Số tiền</span>
                <span className="font-bold text-slate-800">
                  {selectedTxDetail.amount.toLocaleString()} VNĐ
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Trạng thái</span>
                <span className="font-bold text-slate-800">
                  {selectedTxDetail.status === 'success' ? (
                    <span className="text-emerald-600">Thành công</span>
                  ) : selectedTxDetail.status === 'pending' ? (
                    <span className="text-amber-600">Đang xử lý</span>
                  ) : (
                    <span className="text-red-600">Thất bại</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Ví gửi</span>
                <span className="font-mono font-bold text-slate-800 break-all select-all">
                  {selectedTxDetail.walletAddress || '—'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Ví nhận</span>
                <span className="font-mono font-bold text-slate-800 break-all select-all">
                  {selectedTxDetail.type === 'deposit' ? (import.meta.env.VITE_RECEIVER_WALLET || '—') : '—'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Mạng Blockchain</span>
                <span className="font-bold text-slate-800">
                  {selectedTxDetail.network || 'Sepolia'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Tỷ giá quy đổi</span>
                <span className="font-bold text-slate-800">
                  {selectedTxDetail.exchangeRate ? `${selectedTxDetail.exchangeRate.toLocaleString()} VNĐ / ETH` : '—'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Thời gian tạo</span>
                <span className="font-bold text-slate-800">
                  {selectedTxDetail.createdAt ? new Date(selectedTxDetail.createdAt).toLocaleString('vi-VN') : '—'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Thời gian xác nhận</span>
                <span className="font-bold text-slate-800">
                  {selectedTxDetail.createdAt && selectedTxDetail.status === 'success' ? new Date(selectedTxDetail.createdAt).toLocaleString('vi-VN') : '—'}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => setSelectedTxDetail(null)}
                className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-605 hover:text-slate-950 font-bold rounded-xl text-xs transition-colors focus:outline-none cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
