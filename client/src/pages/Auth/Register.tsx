import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Phone, Lock, User, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store';

const registerSchema = z.object({
  name: z.string().min(2, { message: 'Họ tên phải chứa ít nhất 2 ký tự' }),
  phoneNumber: z.string()
    .min(10, { message: 'Số điện thoại phải có ít nhất 10 số' })
    .max(11, { message: 'Số điện thoại không quá 11 số' })
    .regex(/^0[0-9]{9,10}$/, { message: 'Số điện thoại không hợp lệ (phải bắt đầu bằng số 0)' }),
  email: z.string().email({ message: 'Địa chỉ email không hợp lệ' }),
  password: z.string().min(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' }),
  confirmPassword: z.string().min(6, { message: 'Xác nhận mật khẩu là bắt buộc' })
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu nhập lại không trùng khớp',
  path: ['confirmPassword']
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = (data: RegisterFormValues) => {
    setIsSubmitting(true);
    // Simulate API registration delay
    setTimeout(() => {
      login(data.phoneNumber, 'customer'); // Auto-register & mock login
      setIsSubmitting(false);
      setSuccessMsg('Đăng ký tài khoản thành công! Đang chuyển hướng...');
      setTimeout(() => {
        navigate('/');
      }, 1500);
    }, 800);
  };

  return (
    <div className="space-y-6 text-xs font-semibold">
      <div>
        <h2 className="text-xl font-bold text-slate-900 text-center">Đăng ký tài khoản mới</h2>
        <p className="text-slate-500 text-center text-xs mt-1 font-semibold">Đăng ký dịch vụ quản lý thuê bao di động Viettel.</p>
      </div>

      {/* Success notification */}
      {successMsg && (
        <div className="flex items-center space-x-2 text-emerald-700 bg-emerald-50 border border-emerald-250 p-3.5 rounded-lg text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Register Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name Input */}
        <div className="flex flex-col space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Họ và tên</label>
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Ví dụ: Nguyễn Văn A"
              {...register('name')}
              className={`w-full bg-slate-50 border ${
                errors.name ? 'border-red-550 focus:border-red-550' : 'border-slate-200 focus:border-primary/50 focus:bg-white'
              } rounded-lg py-2 pl-9 pr-4 text-xs text-slate-700 placeholder-slate-400 focus:outline-none transition-colors`}
            />
            <User className="absolute left-3 w-4 h-4 text-slate-400" />
          </div>
          {errors.name && (
            <p className="text-[10px] text-red-550 flex items-center mt-0.5 font-medium">
              <AlertCircle className="w-3.5 h-3.5 mr-1" />
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Phone Input */}
        <div className="flex flex-col space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Số điện thoại di động</label>
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Ví dụ: 0987654321"
              {...register('phoneNumber')}
              className={`w-full bg-slate-50 border ${
                errors.phoneNumber ? 'border-red-550 focus:border-red-550' : 'border-slate-200 focus:border-primary/50 focus:bg-white'
              } rounded-lg py-2 pl-9 pr-4 text-xs text-slate-700 placeholder-slate-400 focus:outline-none transition-colors`}
            />
            <Phone className="absolute left-3 w-4 h-4 text-slate-400" />
          </div>
          {errors.phoneNumber && (
            <p className="text-[10px] text-red-550 flex items-center mt-0.5 font-medium">
              <AlertCircle className="w-3.5 h-3.5 mr-1" />
              {errors.phoneNumber.message}
            </p>
          )}
        </div>

        {/* Email Input */}
        <div className="flex flex-col space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Địa chỉ Email</label>
          <div className="relative flex items-center">
            <input
              type="email"
              placeholder="Ví dụ: vana@gmail.com"
              {...register('email')}
              className={`w-full bg-slate-50 border ${
                errors.email ? 'border-red-555 focus:border-red-555' : 'border-slate-200 focus:border-primary/50 focus:bg-white'
              } rounded-lg py-2 pl-9 pr-4 text-xs text-slate-700 placeholder-slate-400 focus:outline-none transition-colors`}
            />
            <Mail className="absolute left-3 w-4 h-4 text-slate-400" />
          </div>
          {errors.email && (
            <p className="text-[10px] text-red-555 flex items-center mt-0.5 font-medium">
              <AlertCircle className="w-3.5 h-3.5 mr-1" />
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Input */}
        <div className="flex flex-col space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mật khẩu</label>
          <div className="relative flex items-center">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Tối thiểu 6 ký tự..."
              {...register('password')}
              className={`w-full bg-slate-50 border ${
                errors.password ? 'border-red-555 focus:border-red-555' : 'border-slate-200 focus:border-primary/50 focus:bg-white'
              } rounded-lg py-2 pl-9 pr-10 text-xs text-slate-700 placeholder-slate-400 focus:outline-none transition-colors`}
            />
            <Lock className="absolute left-3 w-4 h-4 text-slate-400" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-[10px] text-red-555 flex items-center mt-0.5 font-medium">
              <AlertCircle className="w-3.5 h-3.5 mr-1" />
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Confirm Password Input */}
        <div className="flex flex-col space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nhập lại mật khẩu</label>
          <div className="relative flex items-center">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Nhập lại mật khẩu..."
              {...register('confirmPassword')}
              className={`w-full bg-slate-50 border ${
                errors.confirmPassword ? 'border-red-555 focus:border-red-555' : 'border-slate-200 focus:border-primary/50 focus:bg-white'
              } rounded-lg py-2 pl-9 pr-10 text-xs text-slate-700 placeholder-slate-400 focus:outline-none transition-colors`}
            />
            <Lock className="absolute left-3 w-4 h-4 text-slate-400" />
          </div>
          {errors.confirmPassword && (
            <p className="text-[10px] text-red-555 flex items-center mt-0.5 font-medium">
              <AlertCircle className="w-3.5 h-3.5 mr-1" />
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-2.5 rounded-lg text-xs transition-colors disabled:opacity-50 focus:outline-none"
        >
          {isSubmitting ? 'Đang tạo tài khoản...' : 'Đăng ký tài khoản'}
        </button>
      </form>

      {/* Switch to Login link */}
      <div className="text-center text-xs text-slate-500 pt-2 font-semibold">
        Đã có tài khoản di động?{' '}
        <Link to="/login" className="text-primary hover:underline font-bold">
          Đăng nhập ngay
        </Link>
      </div>
    </div>
  );
}
