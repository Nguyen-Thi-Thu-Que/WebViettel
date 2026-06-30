import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Phone, Lock, Key, AlertCircle } from 'lucide-react';

const forgotPasswordSchema = z.object({
  phoneNumber: z.string()
    .min(10, { message: 'Số điện thoại phải có ít nhất 10 số' })
    .max(11, { message: 'Số điện thoại không quá 11 số' })
    .regex(/^0[0-9]{9,10}$/, { message: 'Số điện thoại không hợp lệ' }),
  otpCode: z.string().min(6, { message: 'Mã xác thực OTP phải chứa 6 chữ số' }),
  newPassword: z.string().min(6, { message: 'Mật khẩu mới phải từ 6 ký tự' })
});

type ForgotFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Send OTP, 2: Reset Password
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors }
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotPasswordSchema)
  });

  const handleSendOTP = () => {
    const phone = getValues('phoneNumber');
    if (!phone || !/^0[0-9]{9,10}$/.test(phone)) {
      setToastMsg('Số điện thoại không hợp lệ để gửi OTP.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setToastMsg('Mã OTP xác thực đã được gửi về số điện thoại di động ảo của bạn (Mã: 123456).');
      setStep(2);
    }, 800);
  };

  const onSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setToastMsg('Khôi phục mật khẩu thành công! Đang chuyển hướng...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    }, 800);
  };

  return (
    <div className="space-y-6 text-xs font-semibold">
      <div>
        <h2 className="text-xl font-bold text-slate-900 text-center">Khôi phục mật khẩu</h2>
        <p className="text-slate-500 text-center text-xs mt-1 font-semibold">Xác thực mã OTP để thiết lập lại mật khẩu di động.</p>
      </div>

      {toastMsg && (
        <div className="flex items-center space-x-2 text-emerald-700 bg-emerald-50 border border-emerald-250 p-3.5 rounded-lg text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{toastMsg}</span>
        </div>
      )}

      {step === 1 ? (
        /* Step 1: Input Phone to request OTP */
        <div className="space-y-4 text-xs">
          <div className="flex flex-col space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Số điện thoại di động</label>
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Ví dụ: 0987654321"
                {...register('phoneNumber')}
                className={`w-full bg-slate-55 border ${
                  errors.phoneNumber ? 'border-red-550 focus:border-red-550' : 'border-slate-200 focus:border-primary/50 focus:bg-white'
                } rounded-lg py-2 pl-9 pr-4 text-xs text-slate-700 focus:outline-none transition-colors`}
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

          <button
            type="button"
            onClick={handleSendOTP}
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-2.5 rounded-lg text-xs transition-colors focus:outline-none"
          >
            {isSubmitting ? 'Đang gửi...' : 'Gửi mã xác thực OTP'}
          </button>
        </div>
      ) : (
        /* Step 2: Input OTP and New Password */
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
          {/* OTP Code Input */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mã xác thực OTP (Nhập: 123456)</label>
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Nhập 6 số OTP..."
                {...register('otpCode')}
                className={`w-full bg-slate-50 border ${
                  errors.otpCode ? 'border-red-555 focus:border-red-555' : 'border-slate-200 focus:border-primary/50 focus:bg-white'
                } rounded-lg py-2 pl-9 pr-4 text-xs text-slate-700 focus:outline-none transition-colors`}
              />
              <Key className="absolute left-3 w-4 h-4 text-slate-400" />
            </div>
            {errors.otpCode && (
              <p className="text-[10px] text-red-555 flex items-center mt-0.5 font-medium">
                <AlertCircle className="w-3.5 h-3.5 mr-1" />
                {errors.otpCode.message}
              </p>
            )}
          </div>

          {/* New Password Input */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mật khẩu mới</label>
            <div className="relative flex items-center">
              <input
                type="password"
                placeholder="Tối thiểu 6 ký tự..."
                {...register('newPassword')}
                className={`w-full bg-slate-50 border ${
                  errors.newPassword ? 'border-red-555 focus:border-red-555' : 'border-slate-200 focus:border-primary/50 focus:bg-white'
                } rounded-lg py-2 pl-9 pr-4 text-xs text-slate-700 focus:outline-none transition-colors`}
              />
              <Lock className="absolute left-3 w-4 h-4 text-slate-400" />
            </div>
            {errors.newPassword && (
              <p className="text-[10px] text-red-555 flex items-center mt-0.5 font-medium">
                <AlertCircle className="w-3.5 h-3.5 mr-1" />
                {errors.newPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-2.5 rounded-lg text-xs transition-colors focus:outline-none"
          >
            {isSubmitting ? 'Đang cập nhật...' : 'Xác nhận đổi mật khẩu'}
          </button>
        </form>
      )}

      {/* Switch to Login link */}
      <div className="text-center text-xs text-slate-500 pt-2 font-semibold">
        Nhớ mật khẩu di động?{' '}
        <Link to="/login" className="text-primary hover:underline font-bold">
          Đăng nhập ngay
        </Link>
      </div>
    </div>
  );
}
