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
    <div className="w-full bg-white rounded-3xl border border-slate-100 shadow-[0_20px_50px_rgba(15,23,42,0.04)] p-6 sm:p-8 space-y-6 animate-scale-up">
      {/* Brand Header */}
      <header className="flex flex-col items-center justify-center text-center space-y-2">
        {/* Logo V with Red Background */}
        <div className="inline-flex items-center justify-center w-12 h-12 bg-[#EE0033] rounded-2xl shadow-sm transform hover:scale-105 transition-transform duration-200">
          <span className="text-xl font-black text-white">V</span>
        </div>
        <div className="text-[30px] font-black tracking-tight text-[#EE0033] leading-none">
          ViettelAI
        </div>
      </header>

      {/* Title Area */}
      <div className="text-center space-y-1">
        <h1 className="text-[28px] font-black text-slate-900 tracking-tight leading-tight">
          Quên mật khẩu
        </h1>
        <p className="text-[14px] text-slate-400 font-semibold">
          Xác thực mã OTP để thiết lập lại mật khẩu
        </p>
      </div>

      {toastMsg && (
        <div className="flex items-center space-x-2 text-emerald-700 bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-[13px] font-semibold animate-scale-up">
          <AlertCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{toastMsg}</span>
        </div>
      )}

      {step === 1 ? (
        /* Step 1: Input Phone to request OTP */
        <div className="space-y-4">
          <div className="flex flex-col space-y-1.5 text-left">
            <label className="text-[13px] font-semibold text-slate-500 pl-0.5">Số điện thoại di động</label>
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Ví dụ: 0987654321"
                {...register('phoneNumber')}
                className={`w-full h-[48px] bg-slate-50 border ${
                  errors.phoneNumber ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-[#EE0033] focus:ring-[#EE0033]/10'
                } rounded-xl pl-11 pr-4 text-[15px] font-semibold text-slate-700 focus:outline-none transition-all`}
              />
              <Phone className="absolute left-3.5 w-[18px] h-[18px] text-slate-400 pointer-events-none" />
            </div>
            {errors.phoneNumber && (
              <p className="text-[13px] text-red-500 flex items-center mt-1 font-medium pl-0.5 animate-fade-in">
                <AlertCircle className="w-3.5 h-3.5 mr-1" />
                {errors.phoneNumber.message}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleSendOTP}
            disabled={isSubmitting}
            className="w-full h-[48px] bg-[#EE0033] hover:bg-[#D40032] text-white font-semibold rounded-xl text-[15px] uppercase tracking-wider disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center"
          >
            {isSubmitting ? 'Đang gửi...' : 'Gửi mã xác thực OTP'}
          </button>
        </div>
      ) : (
        /* Step 2: Input OTP and New Password */
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
          {/* OTP Code Input */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-[13px] font-semibold text-slate-500 pl-0.5">Mã xác thực OTP (Nhập: 123456)</label>
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Nhập 6 số OTP..."
                {...register('otpCode')}
                className={`w-full h-[48px] bg-slate-55 border ${
                  errors.otpCode ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-[#EE0033] focus:ring-[#EE0033]/10'
                } rounded-xl pl-11 pr-4 text-[15px] font-semibold text-slate-700 focus:outline-none transition-all`}
              />
              <Key className="absolute left-3.5 w-[18px] h-[18px] text-slate-400 pointer-events-none" />
            </div>
            {errors.otpCode && (
              <p className="text-[13px] text-red-500 flex items-center mt-1 font-medium pl-0.5 animate-fade-in">
                <AlertCircle className="w-3.5 h-3.5 mr-1" />
                {errors.otpCode.message}
              </p>
            )}
          </div>

          {/* New Password Input */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-[13px] font-semibold text-slate-500 pl-0.5">Mật khẩu mới</label>
            <div className="relative flex items-center">
              <input
                type="password"
                placeholder="Tối thiểu 6 ký tự..."
                {...register('newPassword')}
                className={`w-full h-[48px] bg-slate-50 border ${
                  errors.newPassword ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-[#EE0033] focus:ring-[#EE0033]/10'
                } rounded-xl pl-11 pr-4 text-[15px] font-semibold text-slate-700 focus:outline-none transition-all`}
              />
              <Lock className="absolute left-3.5 w-[18px] h-[18px] text-slate-400 pointer-events-none" />
            </div>
            {errors.newPassword && (
              <p className="text-[13px] text-red-500 flex items-center mt-1 font-medium pl-0.5 animate-fade-in">
                <AlertCircle className="w-3.5 h-3.5 mr-1" />
                {errors.newPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-[48px] bg-[#EE0033] hover:bg-[#D40032] text-white font-semibold rounded-xl text-[15px] uppercase tracking-wider disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center"
          >
            {isSubmitting ? 'Đang cập nhật...' : 'Xác nhận đổi mật khẩu'}
          </button>
        </form>
      )}

      {/* Switch to Login link */}
      <div className="text-center text-[14px] text-slate-500 pt-2 font-semibold">
        Nhớ mật khẩu di động?{' '}
        <Link to="/login" className="text-[#EE0033] hover:text-[#D40032] hover:underline font-bold transition-colors">
          Đăng nhập ngay
        </Link>
      </div>
    </div>
  );
}
