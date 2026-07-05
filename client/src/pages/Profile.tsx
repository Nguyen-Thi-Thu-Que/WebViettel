import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User, CreditCard, History, Shield, Check, QrCode, Eye, EyeOff } from 'lucide-react';
import { useAuthStore, usePackageStore } from '../store';
import SEO from '../components/SEO';

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
  const { currentUser, transactions, deposit, unsubscribePackage, updateProfile, changePassword } = useAuthStore();
  const { packages } = usePackageStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'info';

  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Wallet states
  const [depositAmount, setDepositAmount] = useState('100000');
  const [paymentMethod, setPaymentMethod] = useState('VietQR');
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCountdown, setQRCountdown] = useState(120);

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
    let timer: any;
    if (showQRModal && qrCountdown > 0) {
      timer = setInterval(() => setQRCountdown(c => c - 1), 1000);
    } else if (qrCountdown === 0) {
      setShowQRModal(false);
    }
    return () => clearInterval(timer);
  }, [showQRModal, qrCountdown]);

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

  const handleDepositClick = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseInt(depositAmount);
    if (isNaN(amountVal) || amountVal < 10000) {
      showToast('error', 'Số tiền nạp tối thiểu là 10.000đ');
      return;
    }
    setQRCountdown(120);
    setShowQRModal(true);
  };

  const handleConfirmQRDeposit = () => {
    const amountVal = parseInt(depositAmount);
    deposit(amountVal, paymentMethod);
    setShowQRModal(false);
    showToast('success', `Đã cộng ${amountVal.toLocaleString()}đ vào số dư tài khoản ảo của bạn!`);
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

          {/* Tab 2: TopUp Wallet Virtual Payment */}
          {activeTab === 'topup' && (
            <div className="space-y-6 text-left">
              <div className="border-b border-slate-50 pb-4">
                <h2 className="text-lg font-bold text-slate-900">Nạp tiền vào tài khoản ảo</h2>
                <p className="text-slate-400 text-xs mt-0.5 font-medium">Số dư ví điện tử được dùng để mua/đăng ký thử nghiệm các gói cước.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Form Input nạp tiền */}
                <form onSubmit={handleDepositClick} className="md:col-span-2 space-y-5">
                  <div className="flex flex-col space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chọn số tiền cần nạp</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {['50000', '100000', '200000', '500000'].map(amount => (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => setDepositAmount(amount)}
                          className={`py-2 px-1 text-center rounded-xl border text-xs font-bold transition-all focus:outline-none cursor-pointer ${depositAmount === amount
                              ? 'bg-red-50 border-primary text-primary shadow-sm'
                              : 'bg-slate-50/60 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                        >
                          {parseInt(amount).toLocaleString()}đ
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hoặc nhập số tiền tùy chọn</label>
                    <input
                      type="number"
                      placeholder="Tối thiểu 10.000đ"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-primary/50 focus:bg-white rounded-xl py-2.5 px-3.5 text-xs text-slate-700 focus:outline-none transition-colors input-premium-focus"
                    />
                  </div>

                  <div className="flex flex-col space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phương thức thanh toán ảo</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { id: 'VietQR', name: 'Mã QR VietQR', desc: 'Mô phỏng quét mã ngân hàng' },
                        { id: 'Momo', name: 'Ví điện tử MoMo', desc: 'Mô phỏng cổng thanh toán ví' }
                      ].map(method => (
                        <div
                          key={method.id}
                          onClick={() => setPaymentMethod(method.id)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${paymentMethod === method.id
                              ? 'bg-red-50/50 border-primary text-slate-900 shadow-sm'
                              : 'bg-slate-50/60 border-slate-200 hover:border-slate-300 text-slate-750'
                            }`}
                        >
                          <p className="text-xs font-bold">{method.name}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5 font-medium">{method.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-xl text-xs transition-colors focus:outline-none cursor-pointer shadow-sm hover:shadow"
                  >
                    Tiến hành nạp tiền (Giả lập)
                  </button>
                </form>

                {/* Right Info balance panel */}
                <div className="md:col-span-1 bg-slate-50 border border-slate-200/60 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Số dư ví hiện tại</p>
                    <h3 className="text-2xl font-black text-slate-900">
                      {new Intl.NumberFormat('vi-VN').format(currentUser.balance)}đ
                    </h3>
                  </div>
                  <div className="text-[10px] text-slate-450 space-y-1.5 leading-relaxed">
                    <p className="font-bold text-slate-700">Lưu ý thanh toán:</p>
                    <p className="font-medium">Đây là cổng thanh toán mô phỏng. Mọi giao dịch nạp tiền ảo đều được xử lý tức thời và hoàn toàn miễn phí, không tốn tiền thật.</p>
                  </div>
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
                <h2 className="text-lg font-bold text-slate-900">Lịch sử giao dịch ví & đăng ký</h2>
                <p className="text-slate-400 text-xs mt-0.5 font-medium">Nhật ký toàn bộ hoạt động nạp ví và trừ tiền đăng ký gói cước di động.</p>
              </div>

              {transactions.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-550 font-bold uppercase tracking-wider">
                        <th className="p-4">Mã GD</th>
                        <th className="p-4">Thời gian</th>
                        <th className="p-4">Loại giao dịch</th>
                        <th className="p-4">Số tiền</th>
                        <th className="p-4">Chi tiết / Cổng</th>
                        <th className="p-4">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-slate-700">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="p-4 font-mono text-[9px] text-slate-405 font-bold">{tx.id.toUpperCase()}</td>
                          <td className="p-4 text-slate-450 font-semibold">{new Date(tx.createdAt).toLocaleString('vi-VN')}</td>
                          <td className="p-4 font-bold text-slate-800">
                            {tx.type === 'deposit' ? (
                              <span className="text-emerald-600">Nạp tiền vào ví</span>
                            ) : (
                              <span className="text-primary">Đăng ký gói cước</span>
                            )}
                          </td>
                          <td className="p-4 font-black text-slate-900">
                            {tx.type === 'deposit' ? '+' : '-'}
                            {tx.amount.toLocaleString()}đ
                          </td>
                          <td className="p-4 text-slate-500 font-semibold font-mono text-[10px]">
                            {tx.type === 'deposit' ? `Cổng: ${tx.paymentMethod}` : `Gói: ${tx.packageName}`}
                          </td>
                          <td className="p-4">
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] px-2 py-0.5 rounded-full font-bold">
                              Thành công
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500 text-xs font-semibold">
                  Không có nhật ký giao dịch nào được ghi nhận.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mock VietQR / Momo Overlay Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 max-w-sm w-full shadow-lg space-y-5 text-center animate-scale-up z-50 text-left">
            <div className="flex justify-between items-center pb-3 border-b border-slate-50">
              <h4 className="text-sm font-extrabold text-slate-900">Quét mã chuyển khoản</h4>
              <span className="text-[9px] text-primary bg-red-500/10 px-2 py-0.5 rounded border border-primary/20 font-bold">Cổng nạp {paymentMethod}</span>
            </div>

            {/* QR Mock image */}
            <div className="bg-white p-4 rounded-2xl inline-block mx-auto border border-slate-200">
              <QrCode className="w-40 h-40 text-slate-900" />
            </div>

            <div className="space-y-1 text-center">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Số tiền nạp ảo</p>
              <h3 className="text-2xl font-black text-primary">
                {parseInt(depositAmount).toLocaleString()}đ
              </h3>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150 text-[11px] text-slate-600 space-y-2 text-left font-semibold">
              <p>• Mã giao dịch: <strong className="text-slate-900 font-bold font-mono">NAP_VIETTELAI_{currentUser.id.toUpperCase().substring(0, 8)}</strong></p>
              <p>• Thời gian chờ: <strong className="text-primary font-bold">{qrCountdown} giây</strong></p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowQRModal(false)}
                className="flex-1 py-2.5 bg-slate-50 border border-slate-200 text-slate-605 hover:text-slate-900 hover:bg-slate-100 rounded-xl text-xs transition-colors font-bold focus:outline-none"
              >
                Hủy giao dịch
              </button>
              <button
                onClick={handleConfirmQRDeposit}
                className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1.5 focus:outline-none cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Xác nhận đã quét</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}
