import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Phone, Lock, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../store';
import SEO from '../../components/SEO';

const loginSchema = z.object({
  phoneNumber: z.string()
    .min(10, { message: 'Số điện thoại phải có ít nhất 10 số' })
    .max(11, { message: 'Số điện thoại không quá 11 số' })
    .regex(/^0[0-9]{9,10}$/, { message: 'Số điện thoại không hợp lệ (phải bắt đầu bằng số 0)' }),
  password: z.string().min(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phoneNumber: '',
      password: ''
    }
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const success = await login(data.phoneNumber, data.password);
      setIsSubmitting(false);
      if (success) {
        const user = useAuthStore.getState().currentUser;
        if (user?.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        setErrorMsg('Thông tin đăng nhập không chính xác.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(useAuthStore.getState().error || err.message || 'Đã xảy ra lỗi đăng nhập hệ thống.');
    }
  };

  return (
    <div className="min-h-[550px] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 text-xs font-semibold relative overflow-hidden bg-slate-50/50">
      {/* Dynamic background blur blobs */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-red-200 rounded-full filter blur-3xl opacity-30 pointer-events-none animate-pulse" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-rose-200 rounded-full filter blur-3xl opacity-30 pointer-events-none animate-pulse" />

      <SEO
        title="Đăng Nhập Cổng Thông Tin Viettel Portal"
        description="Đăng nhập để xem danh sách gói cước được cá nhân hóa và quản lý thuê bao di động."
      />

      <div className="max-w-md w-full space-y-8 bg-white border border-slate-100 p-8 rounded-3xl shadow-xl relative z-10 hover:shadow-2xl transition-shadow duration-300">
        {/* Brand Header */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-premium rounded-2xl shadow-md transform hover:rotate-6 transition-transform duration-300">
            <span className="text-2xl font-black text-white tracking-widest">V</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            VIETTEL PORTAL
          </h2>
          <p className="text-slate-450 text-xs font-medium">
            Quản lý thuê bao di động di động thông minh
          </p>
        </div>

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="flex items-center space-x-2 text-red-750 bg-red-50/70 border border-red-100 p-4 rounded-2xl text-xs font-semibold animate-scale-up">
            <AlertCircle className="w-5 h-5 shrink-0 text-primary" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Phone input */}
          <div className="flex flex-col space-y-1.5 text-left">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
              Số điện thoại di động
            </label>
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

          {/* Password input */}
          <div className="flex flex-col space-y-1.5 text-left">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Mật khẩu tài khoản
              </label>
              <Link to="/forgot-password" className="text-[10px] text-slate-450 hover:text-primary transition-colors font-bold">
                Quên mật khẩu?
              </Link>
            </div>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="off"
                placeholder="Nhập mật khẩu..."
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

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-gradient-premium hover:bg-gradient-premium-hover text-white font-bold rounded-2xl text-xs uppercase tracking-wider transition-all disabled:opacity-50 focus:outline-none cursor-pointer shadow-md hover:shadow-lg active:scale-[0.99] flex items-center justify-center space-x-2"
          >
            <span>{isSubmitting ? 'Đang xác thực...' : 'Đăng nhập'}</span>
            {!isSubmitting && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Redirect section */}
        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-50">
          Chưa có tài khoản di động?{' '}
          <Link to="/register" className="text-primary hover:underline font-extrabold">
            Đăng ký thuê bao mới
          </Link>
        </div>
      </div>
    </div>
  );
}
