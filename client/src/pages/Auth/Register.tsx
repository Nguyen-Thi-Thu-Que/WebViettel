import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Phone, Lock, User, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
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
    <div className="min-h-[580px] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 text-xs font-semibold relative overflow-hidden bg-slate-50/50">
      {/* Dynamic background blur blobs */}
      <div className="absolute top-10 right-10 w-72 h-72 bg-red-200 rounded-full filter blur-3xl opacity-30 pointer-events-none animate-pulse" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-rose-200 rounded-full filter blur-3xl opacity-30 pointer-events-none animate-pulse" />

      <SEO
        title="Đăng Ký Tài Khoản Thuê Bao Viettel"
        description="Đăng ký tài khoản mới để tra cứu gói cước di động và quản lý số dư ảo."
      />

      <div className="max-w-md w-full space-y-6 bg-white border border-slate-100 p-8 rounded-3xl shadow-xl relative z-10 hover:shadow-2xl transition-shadow duration-300">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-premium rounded-2xl shadow-md transform hover:rotate-6 transition-transform duration-300">
            <span className="text-2xl font-black text-white tracking-widest">V</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            ĐĂNG KÝ THUÊ BAO
          </h2>
          <p className="text-slate-450 text-xs font-medium">
            Tạo tài khoản quản lý cổng thông tin Viettel AI Portal
          </p>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="flex items-center space-x-2 text-emerald-700 bg-emerald-50 border border-emerald-100 p-4 rounded-2xl text-xs font-semibold animate-scale-up">
            <AlertCircle className="w-5 h-5 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="flex items-center space-x-2 text-red-750 bg-red-50/70 border border-red-100 p-4 rounded-2xl text-xs font-semibold animate-scale-up">
            <AlertCircle className="w-5 h-5 shrink-0 text-primary" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
          {/* Full Name Input */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Họ và tên</label>
            <div className="relative flex items-center">
              <input
                type="text"
                autoComplete="off"
                placeholder="Ví dụ: Nguyễn Văn A"
                {...register('name')}
                className={`w-full bg-slate-50 border ${
                  errors.name ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-primary/50 focus:ring-red-50/20'
                } rounded-2xl py-3.5 pl-11 pr-4 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-4 transition-all`}
              />
              <User className="absolute left-4 w-4 h-4 text-slate-400" />
            </div>
            {errors.name && (
              <p className="text-[10px] text-red-500 flex items-center mt-1 font-medium pl-1 animate-fade-in">
                <AlertCircle className="w-3.5 h-3.5 mr-1" />
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Phone Input */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Số điện thoại di động</label>
            <div className="relative flex items-center">
              <input
                type="text"
                autoComplete="off"
                placeholder="Nhập số điện thoại Viettel..."
                {...register('phoneNumber')}
                className={`w-full bg-slate-50 border ${
                  errors.phoneNumber ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-primary/50 focus:ring-red-50/20'
                } rounded-2xl py-3.5 pl-11 pr-4 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-4 transition-all`}
              />
              <Phone className="absolute left-4 w-4 h-4 text-slate-400" />
            </div>
            {errors.phoneNumber && (
              <p className="text-[10px] text-red-500 flex items-center mt-1 font-medium pl-1 animate-fade-in">
                <AlertCircle className="w-3.5 h-3.5 mr-1" />
                {errors.phoneNumber.message}
              </p>
            )}
          </div>

          {/* Subscription Type Selector (Uniform Style) */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Loại thuê bao</label>
            <div className="grid grid-cols-2 gap-4 py-1 text-slate-700 font-bold">
              <label className={`flex items-center justify-center space-x-2.5 cursor-pointer border rounded-2xl py-3.5 px-4 text-center transition-all ${
                activeSubscriptionType === 'tra_truoc' 
                  ? 'bg-red-50/40 border-primary text-primary shadow-sm'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-550'
              }`}>
                <input
                  type="radio"
                  value="tra_truoc"
                  {...register('subscription_type')}
                  className="w-4 h-4 text-primary border-slate-300 focus:ring-primary"
                />
                <span>Trả trước</span>
              </label>
              <label className={`flex items-center justify-center space-x-2.5 cursor-pointer border rounded-2xl py-3.5 px-4 text-center transition-all ${
                activeSubscriptionType === 'tra_sau' 
                  ? 'bg-red-50/40 border-primary text-primary shadow-sm'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-550'
              }`}>
                <input
                  type="radio"
                  value="tra_sau"
                  {...register('subscription_type')}
                  className="w-4 h-4 text-primary border-slate-300 focus:ring-primary"
                />
                <span>Trả sau</span>
              </label>
            </div>
          </div>

          {/* Password Input */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Mật khẩu</label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Tối thiểu 6 ký tự..."
                {...register('password')}
                className={`w-full bg-slate-50 border ${
                  errors.password ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-primary/50 focus:ring-red-50/20'
                } rounded-2xl py-3.5 pl-11 pr-10 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-4 transition-all`}
              />
              <Lock className="absolute left-4 w-4 h-4 text-slate-400" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-slate-400 hover:text-slate-650 transition-colors focus:outline-none"
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
          <div className="flex flex-col space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Nhập lại mật khẩu</label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Nhập lại mật khẩu..."
                {...register('confirmPassword')}
                className={`w-full bg-slate-50 border ${
                  errors.confirmPassword ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-primary/50 focus:ring-red-50/20'
                } rounded-2xl py-3.5 pl-11 pr-10 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-4 transition-all`}
              />
              <Lock className="absolute left-4 w-4 h-4 text-slate-400" />
            </div>
            {errors.confirmPassword && (
              <p className="text-[10px] text-red-500 flex items-center mt-1 font-medium pl-1 animate-fade-in">
                <AlertCircle className="w-3.5 h-3.5 mr-1" />
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-gradient-premium hover:bg-gradient-premium-hover text-white font-bold rounded-2xl text-xs uppercase tracking-wider transition-all disabled:opacity-50 focus:outline-none cursor-pointer shadow-md hover:shadow-lg active:scale-[0.99] flex items-center justify-center space-x-2"
          >
            <span>{isSubmitting ? 'Đang tạo tài khoản...' : 'Đăng ký tài khoản'}</span>
            {!isSubmitting && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Redirect section */}
        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-50">
          Đã có tài khoản di động?{' '}
          <Link to="/login" className="text-primary hover:underline font-extrabold">
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
