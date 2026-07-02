import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User, CreditCard, History, Shield, Check, QrCode } from 'lucide-react';
import { useAuthStore, usePackageStore } from '../store';

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

  // If user is not logged in, redirect to login
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    } else {
      useAuthStore.getState().fetchTransactions().catch(() => {});
      useAuthStore.getState().fetchFAQs().catch(() => {});
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

  const onProfileSubmit = (data: ProfileFormValues) => {
    updateProfile(data.name, data.email);
    showToast('success', 'Cập nhật thông tin cá nhân thành công!');
  };

  const onPasswordSubmit = async (data: PasswordFormValues) => {
    const success = await changePassword(data.oldPassword, data.newPassword);
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

  const handleConfirmUnsubscribe = () => {
    if (cancellingPkgId) {
      unsubscribePackage(cancellingPkgId);
      showToast('success', 'Đã hủy gia hạn gói cước thành công.');
      setCancellingPkgId(null);
    }
  };

  const tabs = [
    { id: 'info', label: 'Hồ sơ cá nhân', icon: User },
    { id: 'topup', label: 'Nạp tiền tài khoản', icon: CreditCard },
    { id: 'packages', label: 'Gói cước đang dùng', icon: Shield },
    { id: 'history', label: 'Lịch sử giao dịch', icon: History }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pb-16 relative animate-fade-in text-xs font-semibold">
      {/* Toast Notification */}
      {toastMsg && (
        <div className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-lg shadow-lg border-l-4 text-xs font-semibold bg-white text-slate-800 ${
          toastMsg.type === 'success' ? 'border-emerald-500' : 'border-red-500'
        }`}>
          {toastMsg.text}
        </div>
      )}

      {/* Left Column: Navigation Tabs Sidebar */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-xl space-y-4">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center font-bold text-white text-base">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">{currentUser.name}</h3>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{currentUser.role}</span>
            </div>
          </div>
          
          <div className="flex flex-col space-y-1">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSearchParams({ tab: tab.id })}
                  className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-colors text-left focus:outline-none ${
                    isSelected
                      ? 'bg-primary/5 text-primary border-l-2 border-primary'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
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
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 md:p-8 space-y-6">
          {/* Tab 1: Profile Info & Change Password */}
          {activeTab === 'info' && (
            <div className="space-y-8">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-900">Hồ sơ cá nhân</h2>
                <p className="text-slate-500 text-xs mt-0.5 font-semibold">Quản lý và điều chỉnh thông tin liên lạc của bạn.</p>
              </div>

              {/* Profile Details Form */}
              <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Số điện thoại</label>
                  <input
                    type="text"
                    disabled
                    value={currentUser.phoneNumber}
                    className="w-full bg-slate-100/60 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-500 cursor-not-allowed focus:outline-none"
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Loại tài khoản</label>
                  <input
                    type="text"
                    disabled
                    value={currentUser.role === 'admin' ? 'Quản trị viên (Admin)' : 'Thuê bao khách hàng'}
                    className="w-full bg-slate-100/60 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-500 cursor-not-allowed focus:outline-none"
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Họ và tên</label>
                  <input
                    type="text"
                    {...registerProfile('name')}
                    className={`w-full bg-slate-50 border ${
                      profileErrors.name ? 'border-red-550 focus:border-red-555' : 'border-slate-200 focus:border-primary/50 focus:bg-white'
                    } rounded-lg py-2 px-3 text-xs text-slate-700 focus:outline-none transition-colors`}
                  />
                  {profileErrors.name && <p className="text-[9px] text-red-550 mt-0.5">{profileErrors.name.message}</p>}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Địa chỉ Email</label>
                  <input
                    type="text"
                    {...registerProfile('email')}
                    className={`w-full bg-slate-50 border ${
                      profileErrors.email ? 'border-red-550' : 'border-slate-200 focus:border-primary/50 focus:bg-white'
                    } rounded-lg py-2 px-3 text-xs text-slate-700 focus:outline-none transition-colors`}
                  />
                  {profileErrors.email && <p className="text-[9px] text-red-550 mt-0.5">{profileErrors.email.message}</p>}
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    className="bg-primary hover:bg-primary-hover text-white font-bold px-5 py-2 rounded-lg text-xs transition-colors focus:outline-none"
                  >
                    Cập nhật thông tin
                  </button>
                </div>
              </form>

              {/* Password Change Form */}
              <div className="border-t border-slate-100 pt-6 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Thay đổi mật khẩu</h3>
                  <p className="text-[10px] text-slate-500 font-semibold">Mật khẩu mới phải dài tối thiểu 6 ký tự.</p>
                </div>

                <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mật khẩu hiện tại</label>
                    <input
                      type="password"
                      placeholder="Nhập mật khẩu cũ..."
                      {...registerPassword('oldPassword')}
                      className={`w-full bg-slate-50 border ${
                        passwordErrors.oldPassword ? 'border-red-555' : 'border-slate-200 focus:border-primary/50 focus:bg-white'
                      } rounded-lg py-2 px-3 text-xs text-slate-700 focus:outline-none transition-colors`}
                    />
                    {passwordErrors.oldPassword && <p className="text-[9px] text-red-555 mt-0.5">{passwordErrors.oldPassword.message}</p>}
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mật khẩu mới</label>
                    <input
                      type="password"
                      placeholder="Mật khẩu mới..."
                      {...registerPassword('newPassword')}
                      className={`w-full bg-slate-50 border ${
                        passwordErrors.newPassword ? 'border-red-555' : 'border-slate-200 focus:border-primary/50 focus:bg-white'
                      } rounded-lg py-2 px-3 text-xs text-slate-700 focus:outline-none transition-colors`}
                    />
                    {passwordErrors.newPassword && <p className="text-[9px] text-red-555 mt-0.5">{passwordErrors.newPassword.message}</p>}
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nhập lại mật khẩu</label>
                    <input
                      type="password"
                      placeholder="Nhập lại mật khẩu mới..."
                      {...registerPassword('confirmNewPassword')}
                      className={`w-full bg-slate-50 border ${
                        passwordErrors.confirmNewPassword ? 'border-red-555' : 'border-slate-200 focus:border-primary/50 focus:bg-white'
                      } rounded-lg py-2 px-3 text-xs text-slate-700 focus:outline-none transition-colors`}
                    />
                    {passwordErrors.confirmNewPassword && <p className="text-[9px] text-red-555 mt-0.5">{passwordErrors.confirmNewPassword.message}</p>}
                  </div>
                  <div className="md:col-span-3 flex justify-end">
                    <button
                      type="submit"
                      className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 px-5 py-2 rounded-lg text-xs transition-colors font-bold focus:outline-none"
                    >
                      Thay đổi mật khẩu
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Tab 2: TopUp Wallet Virtual Payment */}
          {activeTab === 'topup' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-900">Nạp tiền vào tài khoản ảo</h2>
                <p className="text-slate-500 text-xs mt-0.5 font-semibold">Số dư ví điện tử được dùng để mua/đăng ký các gói cước thử nghiệm.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Form Input nạp tiền */}
                <form onSubmit={handleDepositClick} className="md:col-span-2 space-y-5">
                  <div className="flex flex-col space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Chọn số tiền nạp</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['50000', '100000', '200000', '500000'].map(amount => (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => setDepositAmount(amount)}
                          className={`py-2 text-center rounded-lg border text-xs font-bold transition-colors focus:outline-none ${
                            depositAmount === amount
                              ? 'bg-red-50 border-primary text-primary'
                              : 'bg-slate-55 border-slate-250 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          {parseInt(amount).toLocaleString()}đ
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Hoặc nhập số tiền tùy chọn</label>
                    <input
                      type="number"
                      placeholder="Tối thiểu 10.000đ"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-primary/50 focus:bg-white rounded-lg py-2 px-3 text-xs text-slate-700 focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="flex flex-col space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Phương thức thanh toán ảo</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'VietQR', name: 'Mã QR VietQR', desc: 'Mô phỏng quét mã ngân hàng' },
                        { id: 'Momo', name: 'Ví điện tử MoMo', desc: 'Mô phỏng cổng thanh toán ví' }
                      ].map(method => (
                        <div
                          key={method.id}
                          onClick={() => setPaymentMethod(method.id)}
                          className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                            paymentMethod === method.id
                              ? 'bg-red-50 border-primary text-slate-900'
                              : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <p className="text-xs font-bold">{method.name}</p>
                          <p className="text-[9px] text-slate-500 mt-0.5 font-semibold">{method.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-2.5 rounded-lg text-xs transition-colors focus:outline-none"
                  >
                    Tiến hành nạp tiền (Mô phỏng)
                  </button>
                </form>

                {/* Right Info balance panel */}
                <div className="md:col-span-1 bg-slate-50 border border-slate-200 p-5 rounded-xl flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Số dư hiện tại</p>
                    <h3 className="text-2xl font-black text-slate-900">
                      {new Intl.NumberFormat('vi-VN').format(currentUser.balance)}đ
                    </h3>
                  </div>
                  <div className="text-[10px] text-slate-500 space-y-1 leading-relaxed">
                    <p className="font-bold text-slate-800">Lưu ý thanh toán:</p>
                    <p className="font-semibold">Hệ thống này chỉ chạy trên môi trường giả lập thử nghiệm. Mọi khoản nạp thẻ và ví đều là ảo và không tốn tiền thật.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Active Subscriptions List */}
          {activeTab === 'packages' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-900">Gói cước đang sử dụng</h2>
                <p className="text-slate-500 text-xs mt-0.5 font-semibold">Danh sách các gói cước dịch vụ đang kích hoạt trên thuê bao di động.</p>
              </div>

              {currentUser.activePackages.length > 0 ? (
                <div className="space-y-4">
                  {currentUser.activePackages.map((ap) => {
                    const pkgDetail = packages.find(p => p.id === ap.packageId);
                    if (!pkgDetail) return null;
                    return (
                      <div
                        key={ap.packageId}
                        className="bg-slate-55 border border-slate-200 p-5 rounded-xl flex flex-col md:flex-row justify-between md:items-center gap-4 relative overflow-hidden"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-base font-extrabold text-slate-900">{pkgDetail.ten}</h4>
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-bold px-2.5 py-0.5 rounded uppercase">
                              Đang hoạt động
                            </span>
                          </div>
                          <p className="text-slate-600 text-xs max-w-lg font-medium">{pkgDetail.uudaitrong}</p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1.5 text-[10px] text-slate-500 font-semibold">
                            <p>Kích hoạt: <strong className="text-slate-800">{new Date(ap.activatedAt).toLocaleDateString('vi-VN')}</strong></p>
                            <p>Hết hạn: <strong className="text-slate-800">{new Date(ap.expiresAt).toLocaleDateString('vi-VN')}</strong></p>
                            <p>Chu kỳ: <strong className="text-slate-800">{pkgDetail.chu_ky_ngay} ngày</strong></p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleUnsubscribeClick(ap.packageId)}
                          className="shrink-0 text-xs font-bold text-primary hover:bg-red-50 border border-red-150 px-4 py-2 rounded-lg transition-colors text-center focus:outline-none"
                        >
                          Hủy gia hạn gói
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 p-10 rounded-xl text-center max-w-sm mx-auto space-y-4">
                  <p className="text-slate-500 text-xs font-semibold">Bạn hiện chưa đăng ký sử dụng gói cước di động nào.</p>
                  <button
                    onClick={() => navigate('/packages')}
                    className="bg-primary hover:bg-primary-hover text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors focus:outline-none"
                  >
                    Xem các gói cước ngay
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Transaction Ledger History */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-900">Lịch sử giao dịch ví & đăng ký</h2>
                <p className="text-slate-500 text-xs mt-0.5 font-semibold">Nhật ký toàn bộ hoạt động nạp ví và trừ tiền đăng ký gói cước di động.</p>
              </div>

              {transactions.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-150 text-slate-600 font-bold">
                        <th className="p-4">Mã GD</th>
                        <th className="p-4">Thời gian</th>
                        <th className="p-4">Loại giao dịch</th>
                        <th className="p-4">Số tiền</th>
                        <th className="p-4">Chi tiết / Cổng</th>
                        <th className="p-4">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 font-mono text-[10px] text-slate-500 font-semibold">{tx.id.toUpperCase()}</td>
                          <td className="p-4 text-slate-500 font-semibold">{new Date(tx.createdAt).toLocaleString('vi-VN')}</td>
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
                          <td className="p-4 text-slate-500 font-semibold">
                            {tx.type === 'deposit' ? `Cổng: ${tx.paymentMethod}` : `Gói: ${tx.packageName}`}
                          </td>
                          <td className="p-4">
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] px-2 py-0.5 rounded font-bold">
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-sm w-full shadow-md space-y-5 text-center animate-scale-up z-50">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h4 className="text-sm font-extrabold text-slate-900">Quét mã chuyển khoản</h4>
              <span className="text-[10px] text-slate-550 font-bold">Cổng nạp {paymentMethod}</span>
            </div>

            {/* QR Mock image */}
            <div className="bg-white p-4 rounded-xl inline-block mx-auto border border-slate-200">
              <QrCode className="w-40 h-40 text-slate-900" />
            </div>

            <div className="space-y-1">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Số tiền cần nạp</p>
              <h3 className="text-2xl font-black text-primary">
                {parseInt(depositAmount).toLocaleString()}đ
              </h3>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px] text-slate-650 space-y-2 text-left font-semibold">
              <p>• Mã nạp thẻ: <strong className="text-slate-900 font-bold font-mono">NAP_VIETTELAI_{currentUser.id.toUpperCase()}</strong></p>
              <p>• Thời gian thanh toán còn lại: <strong className="text-primary font-bold">{qrCountdown} giây</strong></p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowQRModal(false)}
                className="flex-1 py-2.5 bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs transition-colors font-bold focus:outline-none"
              >
                Hủy giao dịch
              </button>
              <button
                onClick={handleConfirmQRDeposit}
                className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center space-x-1.5 focus:outline-none"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-sm w-full shadow-md animate-scale-up z-50">
            <h4 className="text-base font-extrabold text-slate-900 mb-2">Hủy gói cước di động</h4>
            <p className="text-xs text-slate-650 mb-5 leading-relaxed font-semibold">
              Bạn có chắc chắn muốn hủy gia hạn gói cước <strong className="text-primary">{cancellingPkgId.toUpperCase()}</strong>? 
              Bạn vẫn tiếp tục sử dụng dung lượng còn lại cho đến hết thời hạn chu kỳ hiện tại.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setCancellingPkgId(null)}
                className="flex-1 py-2 bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs transition-colors font-bold focus:outline-none"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmUnsubscribe}
                className="flex-1 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg text-xs transition-colors focus:outline-none"
              >
                Đồng ý hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
