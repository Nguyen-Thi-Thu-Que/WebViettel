import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Phone, Lock, User, Eye, EyeOff, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../../store';
import SEO from '../../components/SEO';

const registerSchema = z.object({
  name: z.string().min(2, { message: 'Họ tên phải chứa ít nhất 2 ký tự' }),
  phoneNumber: z.string()
    .length(10, { message: 'Số điện thoại phải chứa đúng 10 chữ số' })
    .regex(/^(086|096|097|098|032|033|034|035|036|037|038|039)[0-9]{7}$/, { message: 'Chỉ hỗ trợ đăng ký bằng số điện thoại Viettel.' }),
  password: z.string().min(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' }),
  confirmPassword: z.string().min(6, { message: 'Xác nhận mật khẩu là bắt buộc' }),
  subscription_type: z.enum(['tra_truoc', 'tra_sau'])
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu nhập lại không trùng khớp',
  path: ['confirmPassword']
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const navigate = useNavigate();
  const { registerUser } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      subscription_type: 'tra_truoc'
    }
  });

  const activeSubscriptionType = watch('subscription_type');

  const onSubmit = async (data: RegisterFormValues) => {
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const success = await registerUser(data.name, data.phoneNumber, '', data.password, data.subscription_type);
      setIsSubmitting(false);
      if (success) {
        setSuccessMsg('Đăng ký tài khoản thành công! Đang chuyển hướng...');
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        setErrorMsg(useAuthStore.getState().error || 'Đăng ký không thành công.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Lỗi hệ thống khi đăng ký.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 text-xs font-semibold relative overflow-hidden bg-[#F8FAFC]">
      {/* Decorative background grid and soft glow blobs */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] opacity-60" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#EE0033]/5 rounded-full filter blur-3xl opacity-40 pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-rose-300/10 rounded-full filter blur-3xl opacity-30 pointer-events-none animate-pulse" />

      <SEO
        title="Đăng Ký Tài Khoản ViettelAI"
        description="Tạo tài khoản mới để tra cứu gói cước di động Viettel và quản lý số dư ảo trên ViettelAI Portal."
      />

      {/* Main Single Card Panel */}
      <main className="w-full max-w-[480px] bg-white rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.08)] p-6 sm:p-10 transition-shadow duration-300 relative z-10 space-y-8 animate-fade-in-up">
        
        {/* Brand Header */}
        <header className="flex flex-col items-center justify-center text-center space-y-2.5">
          {/* Logo V with Red Background */}
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#EE0033] rounded-2xl shadow-sm transform hover:scale-105 transition-transform duration-200">
            <span className="text-xl font-black text-white">V</span>
          </div>
          <div className="space-y-0.5">
            {/* ViettelAI text */}
            <div className="text-lg font-black tracking-tight text-[#EE0033]">
              ViettelAI
            </div>
            {/* System Description */}
            <p className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
              HỆ THỐNG QUẢN LÝ DỊCH VỤ KHÁCH HÀNG
            </p>
          </div>
        </header>

        {/* Title Area */}
        <div className="text-center space-y-2">
          <h1 className="text-[30px] sm:text-[32px] font-black text-slate-900 tracking-tight leading-tight">
            Đăng ký tài khoản ViettelAI
          </h1>
          <h2 className="text-[15px] sm:text-[16px] font-medium text-slate-500 leading-normal">
            Tạo tài khoản để quản lý và đăng ký gói cước Viettel.
          </h2>
        </div>

        {/* Success Alert Banner */}
        {successMsg && (
          <div role="alert" className="flex items-center space-x-2 text-emerald-700 bg-emerald-50 border border-emerald-150 p-4 rounded-2xl text-xs font-semibold animate-scale-up">
            <AlertCircle className="w-5 h-5 shrink-0 text-emerald-650" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Notification Alert Banner */}
        {errorMsg && (
          <div role="alert" className="flex items-center space-x-2 text-red-750 bg-red-50/70 border border-red-150 p-4 rounded-2xl text-xs font-semibold animate-scale-up">
            <AlertCircle className="w-5 h-5 shrink-0 text-[#EE0033]" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Register form elements */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 text-left">
          {/* Full Name Input */}
          <div className="flex flex-col space-y-2">
            <label htmlFor="reg-name" className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">
              Họ và tên
            </label>
            <div className="relative flex items-center">
              <input
                id="reg-name"
                type="text"
                autoComplete="off"
                placeholder="Ví dụ: Nguyễn Văn A"
                {...register('name')}
                className={`w-full h-[54px] bg-slate-50 border ${
                  errors.name ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-[#EE0033] focus:ring-[#EE0033]/10'
                } rounded-2xl pl-11 pr-4 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-4 transition-all duration-200`}
              />
              <User className="absolute left-4 w-4.5 h-4.5 text-slate-400" />
            </div>
            {errors.name && (
              <p className="text-[10px] text-red-500 flex items-center mt-1 font-medium pl-1 animate-fade-in">
                <AlertCircle className="w-3.5 h-3.5 mr-1" />
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Phone Number Input */}
          <div className="flex flex-col space-y-2">
            <label htmlFor="reg-phone" className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">
              Số điện thoại di động
            </label>
            <div className="relative flex items-center">
              <input
                id="reg-phone"
                type="text"
                autoComplete="off"
                placeholder="Nhập số điện thoại Viettel..."
                {...register('phoneNumber')}
                className={`w-full h-[54px] bg-slate-50 border ${
                  errors.phoneNumber ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-[#EE0033] focus:ring-[#EE0033]/10'
                } rounded-2xl pl-11 pr-4 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-4 transition-all duration-200`}
              />
              <Phone className="absolute left-4 w-4.5 h-4.5 text-slate-400" />
            </div>
            {errors.phoneNumber && (
              <p className="text-[10px] text-red-500 flex items-center mt-1 font-medium pl-1 animate-fade-in">
                <AlertCircle className="w-3.5 h-3.5 mr-1" />
                {errors.phoneNumber.message}
              </p>
            )}
          </div>

          {/* Subscription Type Selector (Modern Segmented Control) */}
          <div className="flex flex-col space-y-2">
            <label htmlFor="subscription_type_container" className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">
              Loại thuê bao
            </label>
            <div id="subscription_type_container" className="relative flex p-1 bg-slate-100/80 rounded-2xl border border-slate-200/50 w-full h-[54px]">
              
              {/* Prepaid Tab Label */}
              <label className={`relative flex-grow flex items-center justify-center cursor-pointer text-xs font-bold rounded-xl transition-all duration-200 select-none ${
                activeSubscriptionType === 'tra_truoc' 
                  ? 'bg-white text-[#EE0033] shadow-sm border border-slate-200/40' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}>
                <input
                  type="radio"
                  value="tra_truoc"
                  {...register('subscription_type')}
                  className="sr-only"
                />
                <span>Trả trước</span>
              </label>

              {/* Postpaid Tab Label */}
              <label className={`relative flex-grow flex items-center justify-center cursor-pointer text-xs font-bold rounded-xl transition-all duration-200 select-none ${
                activeSubscriptionType === 'tra_sau' 
                  ? 'bg-white text-[#EE0033] shadow-sm border border-slate-200/40' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}>
                <input
                  type="radio"
                  value="tra_sau"
                  {...register('subscription_type')}
                  className="sr-only"
                />
                <span>Trả sau</span>
              </label>
            </div>
          </div>

          {/* Password Input */}
          <div className="flex flex-col space-y-2">
            <label htmlFor="reg-password" className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">
              Mật khẩu
            </label>
            <div className="relative flex items-center">
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Tối thiểu 6 ký tự..."
                {...register('password')}
                className={`w-full h-[54px] bg-slate-50 border ${
                  errors.password ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-[#EE0033] focus:ring-[#EE0033]/10'
                } rounded-2xl pl-11 pr-12 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-4 transition-all duration-200`}
              />
              <Lock className="absolute left-4 w-4.5 h-4.5 text-slate-400" />
              
              {/* Show/Hide Password Switch */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className="absolute right-4 p-1 rounded-full text-slate-400 hover:text-slate-650 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/20"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-[10px] text-red-500 flex items-center mt-1 font-medium pl-1 animate-fade-in">
                <AlertCircle className="w-3.5 h-3.5 mr-1" />
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password Input */}
          <div className="flex flex-col space-y-2">
            <label htmlFor="reg-confirm" className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">
              Nhập lại mật khẩu
            </label>
            <div className="relative flex items-center">
              <input
                id="reg-confirm"
                type={showPassword ? 'text' : 'password'}
                placeholder="Nhập lại mật khẩu..."
                {...register('confirmPassword')}
                className={`w-full h-[54px] bg-slate-50 border ${
                  errors.confirmPassword ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-[#EE0033] focus:ring-[#EE0033]/10'
                } rounded-2xl pl-11 pr-12 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-4 transition-all duration-200`}
              />
              <Lock className="absolute left-4 w-4.5 h-4.5 text-slate-400" />
            </div>
            {errors.confirmPassword && (
              <p className="text-[10px] text-red-500 flex items-center mt-1 font-medium pl-1 animate-fade-in">
                <AlertCircle className="w-3.5 h-3.5 mr-1" />
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Form Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-[54px] bg-gradient-to-r from-[#EE0033] to-[#D40032] hover:shadow-[0_8px_25px_rgba(238,0,51,0.25)] hover:-translate-y-0.5 transform transition-all duration-200 text-white font-bold rounded-2xl text-xs uppercase tracking-wider disabled:opacity-50 focus:outline-none cursor-pointer flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <span className="flex items-center space-x-2">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Đang xử lý...</span>
              </span>
            ) : (
              <>
                <span>Đăng ký tài khoản</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>

        {/* Redirect link footer */}
        <footer className="text-center text-xs space-y-4 pt-4 border-t border-slate-100">
          <div>
            Đã có tài khoản di động?{' '}
            <Link to="/login" className="text-[#EE0033] hover:text-[#D40032] hover:underline font-extrabold transition-colors">
              Đăng nhập ngay
            </Link>
          </div>
          <div className="flex justify-center">
            <Link
              to="/"
              className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại trang chủ</span>
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
