import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Phone, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store';

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
      phoneNumber: '0987654321', // Pre-fill with customer mock
      password: 'password123'
    }
  });

  const onSubmit = (data: LoginFormValues) => {
    setIsSubmitting(true);
    setErrorMsg('');

    // Simulate API request delay
    setTimeout(() => {
      const success = login(data.phoneNumber);
      setIsSubmitting(false);
      if (success) {
        const user = useAuthStore.getState().currentUser;
        if (user?.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        setErrorMsg('Thông tin đăng nhập không chính xác. Thuê bao của bạn chưa được kích hoạt ảo.');
      }
    }, 700);
  };

  return (
    <div className="space-y-6 text-xs font-semibold">
      <div>
        <h2 className="text-xl font-bold text-slate-900 text-center">Đăng nhập cổng thông tin</h2>
        <p className="text-slate-500 text-center text-xs mt-1 font-semibold">Đăng nhập bằng số điện thoại di động Viettel của bạn.</p>
      </div>

      {/* Error Alert Box */}
      {errorMsg && (
        <div className="flex items-center space-x-2 text-red-750 bg-red-50 border border-red-200 p-3.5 rounded-lg text-xs font-medium animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-primary" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Phone Input */}
        <div className="flex flex-col space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Số điện thoại Viettel</label>
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
            <p className="text-[10px] text-red-505 flex items-center mt-0.5 font-medium">
              <AlertCircle className="w-3.5 h-3.5 mr-1" />
              {errors.phoneNumber.message}
            </p>
          )}
        </div>

        {/* Password Input */}
        <div className="flex flex-col space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mật khẩu</label>
            <Link to="/forgot-password" className="text-[10px] text-slate-500 hover:text-primary transition-colors font-bold">
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative flex items-center">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Nhập mật khẩu..."
              {...register('password')}
              className={`w-full bg-slate-50 border ${
                errors.password ? 'border-red-550 focus:border-red-550' : 'border-slate-200 focus:border-primary/50 focus:bg-white'
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
            <p className="text-[10px] text-red-550 flex items-center mt-0.5 font-medium">
              <AlertCircle className="w-3.5 h-3.5 mr-1" />
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg text-xs transition-colors disabled:opacity-50 focus:outline-none cursor-pointer"
        >
          {isSubmitting ? 'Đang xác thực...' : 'Đăng nhập'}
        </button>
      </form>

      {/* Switch to Register link */}
      <div className="text-center text-xs text-slate-550 pt-2 font-semibold">
        Chưa có tài khoản di động?{' '}
        <Link to="/register" className="text-primary hover:underline font-bold">
          Đăng ký ngay
        </Link>
      </div>

      {/* Testing Quick Guide */}
      <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-[10px] text-slate-500 font-medium leading-relaxed">
        <p className="font-bold text-slate-700 mb-1">Gợi ý đăng nhập thử nghiệm:</p>
        <p>• Khách hàng: <span className="font-bold text-slate-900">0987654321</span> hoặc <span className="font-bold text-slate-900">0912345678</span></p>
        <p>• Quản trị viên (Admin): <span className="font-bold text-slate-900">0900000001</span></p>
        <p className="text-[9px] text-slate-400 mt-1">(*) Mật khẩu nhập bất kỳ tối thiểu 6 ký tự (ví dụ: password123).</p>
      </div>
    </div>
  );
}
