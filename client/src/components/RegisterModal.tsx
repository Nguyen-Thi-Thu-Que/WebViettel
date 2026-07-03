import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, ShieldCheck, Wallet } from 'lucide-react';
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
  const { currentUser, subscribePackage } = useAuthStore();
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

  if (!isOpen || !pkg) return null;

  const handleConfirm = async () => {
    if (!currentUser) {
      if (onError) onError('Vui lòng đăng nhập trước khi đăng ký gói cước.');
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await subscribePackage(pkg);
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

  const formattedPrice = new Intl.NumberFormat('vi-VN').format(pkg.gia);

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
          className="bg-white border border-slate-250 shadow-2xl rounded-2xl p-6 max-w-sm w-full relative z-[1000] text-xs font-semibold text-slate-800 text-left pointer-events-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-register-title"
        >
          {/* Close button X */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-100"
            title="Đóng"
            type="button"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Heading */}
          <div className="flex items-center space-x-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center border border-red-100">
              <ShieldCheck className="w-4 h-4 text-primary" />
            </div>
            <h4 id="confirm-register-title" className="text-sm font-extrabold text-slate-900">
              Xác nhận đăng ký gói cước
            </h4>
          </div>

          {/* Description */}
          <p className="text-slate-550 leading-relaxed font-semibold mb-5 text-[11px]">
            Bạn có chắc chắn muốn đăng ký gói cước <strong className="text-primary">{pkg.ten}</strong> với mức giá{' '}
            <strong className="text-slate-950 font-black">{formattedPrice}đ</strong> cho chu kỳ{' '}
            <strong className="text-slate-950 font-black">{pkg.chu_ky_ngay} ngày</strong>?
          </p>

          {/* User balance check status */}
          {currentUser && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between mb-5">
              <div className="flex items-center space-x-2 text-slate-500">
                <Wallet className="w-3.5 h-3.5" />
                <span className="font-semibold text-[10px]">Số dư tài khoản ví</span>
              </div>
              <span className={`font-black text-[11px] ${currentUser.balance < pkg.gia ? 'text-red-600' : 'text-slate-900'}`}>
                {new Intl.NumberFormat('vi-VN').format(currentUser.balance)}đ
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              disabled={isSubmitting}
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl text-xs transition-colors font-bold focus:outline-none cursor-pointer"
              type="button"
            >
              Hủy
            </button>
            <button
              disabled={isSubmitting || (currentUser ? currentUser.balance < pkg.gia : false)}
              onClick={handleConfirm}
              className="flex-1 py-2.5 bg-primary hover:bg-primary-hover disabled:bg-slate-150 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed text-white border border-primary font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-2 focus:outline-none cursor-pointer shadow-sm hover:shadow"
              type="button"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang đăng ký...</span>
                </>
              ) : currentUser && currentUser.balance < pkg.gia ? (
                <span>Số dư không đủ</span>
              ) : (
                <span>Xác nhận</span>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
