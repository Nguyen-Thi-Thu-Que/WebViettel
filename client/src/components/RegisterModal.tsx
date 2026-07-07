import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Package } from '../types';
import { useAuthStore } from '../store';

interface RegisterModalProps {
  isOpen: boolean;
  pkg: Package | null;
  onClose: () => void;
  onSuccess?: (msg: string) => void;
  onError?: (msg: string) => void;
}

export default function RegisterModal({
  isOpen,
  pkg,
  onClose,
  onSuccess,
  onError
}: RegisterModalProps) {
  const { currentUser, registerSubscription } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ESC keypress handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Scroll lock when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !pkg || !currentUser) return null;

  const handleConfirm = async () => {
    if (!currentUser) {
      if (onError) onError('Vui lòng đăng nhập trước khi đăng ký gói cước.');
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      let cycle: 'DAY' | 'MONTH' | 'YEAR' = 'MONTH';
      const dayCycle = parseInt(pkg.chu_ky_ngay || '30', 10);
      if (dayCycle === 1) {
        cycle = 'DAY';
      } else if (dayCycle >= 360) {
        cycle = 'YEAR';
      }

      const res = await registerSubscription(Number(pkg.id), cycle);
      setIsSubmitting(false);
      onClose();
      if (res.success) {
        if (onSuccess) onSuccess(res.message);
      } else {
        if (onError) onError(res.message);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      onClose();
      if (onError) onError(err.message || 'Lỗi hệ thống khi đăng ký gói cước.');
    }
  };



  return ReactDOM.createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
        {/* Backdrop (rgba(0,0,0,0.45) with blur) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/45 backdrop-blur-sm pointer-events-auto"
        />

        {/* Modal Dialog Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking dialog body
          className="bg-white border border-slate-250 shadow-2xl rounded-2xl p-6 max-w-md w-full relative z-[1000] text-xs font-semibold text-slate-800 text-left pointer-events-auto space-y-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-register-title"
        >
          <h4 id="confirm-register-title" className="text-base font-extrabold text-slate-900 border-b border-slate-50 pb-2">
            Xác nhận đăng ký
          </h4>

          {/* Nhóm 1 – Thông tin gói cước */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thông tin gói cước</h5>
            <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Tên gói cước:</span>
                <span className="font-extrabold text-slate-900">{pkg.ten} ({pkg.ma_goi})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Giá gói:</span>
                <span className="font-extrabold text-slate-900">{pkg.gia.toLocaleString()} VNĐ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Chu kỳ sử dụng:</span>
                <span className="font-extrabold text-slate-900">
                  {pkg.chu_ky_ngay.includes('ngày') ? pkg.chu_ky_ngay : `${pkg.chu_ky_ngay} ngày`}
                </span>
              </div>
            </div>
          </div>

          {/* Nhóm 2 – Thanh toán */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thanh toán</h5>
            <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Phương thức:</span>
                <span className="font-bold text-slate-900">Số dư tài khoản</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Số dư hiện tại:</span>
                <span className="font-bold text-slate-900">{(currentUser?.balance || 0).toLocaleString()} VNĐ</span>
              </div>
              {currentUser && currentUser.balance >= pkg.gia ? (
                <div className="flex justify-between border-t border-slate-100/50 pt-1.5 mt-1.5">
                  <span className="text-slate-500 font-semibold">Số dư dự kiến:</span>
                  <span className="font-bold text-emerald-600">{(currentUser.balance - pkg.gia).toLocaleString()} VNĐ</span>
                </div>
              ) : (
                <div className="text-[10px] text-red-655 bg-red-50/60 border border-red-100 rounded-lg p-2 leading-relaxed font-semibold">
                  Số dư hiện tại có thể không đủ để đăng ký gói cước này. Hệ thống sẽ kiểm tra lại khi bạn xác nhận.
                </div>
              )}
            </div>
          </div>

          {/* Nhóm 3 – Lưu ý */}
          <div className="space-y-1.5">
            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lưu ý</h5>
            <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
              Sau khi xác nhận đăng ký, hệ thống sẽ tiến hành trừ số dư trong tài khoản để kích hoạt gói cước. Vui lòng kiểm tra kỹ thông tin trước khi tiếp tục.
            </p>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-2">
            <button
              disabled={isSubmitting}
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-50 border border-slate-200 text-slate-605 hover:text-slate-950 hover:bg-slate-100 rounded-xl text-xs transition-colors font-bold focus:outline-none cursor-pointer disabled:opacity-50"
              type="button"
            >
              Hủy
            </button>
            <button
              disabled={isSubmitting}
              onClick={handleConfirm}
              className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-2 focus:outline-none cursor-pointer disabled:opacity-50 shadow-sm"
              type="button"
            >
              {isSubmitting ? 'Đang xử lý...' : 'Xác nhận đăng ký'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
