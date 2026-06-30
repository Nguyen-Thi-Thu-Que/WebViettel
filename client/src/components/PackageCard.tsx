import { Link } from 'react-router-dom';
import { Wifi, Phone, ShieldCheck, Star, ArrowRightLeft, Sparkles } from 'lucide-react';
import type { Package } from '../types';
import { usePackageStore, useAuthStore } from '../store';
import { useState } from 'react';

interface PackageCardProps {
  pkg: Package;
  onSubscribeSuccess?: (msg: string) => void;
  onSubscribeError?: (msg: string) => void;
}

export default function PackageCard({ pkg, onSubscribeSuccess, onSubscribeError }: PackageCardProps) {
  const { addToCompare, compareList, removeFromCompare } = usePackageStore();
  const { currentUser, subscribePackage } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isInCompare = compareList.some((p) => p.id === pkg.id);

  const handleCompareToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isInCompare) {
      removeFromCompare(pkg.id);
    } else {
      const res = addToCompare(pkg);
      if (!res.success && onSubscribeError) {
        onSubscribeError(res.message);
      } else if (res.success && onSubscribeSuccess) {
        onSubscribeSuccess(res.message);
      }
    }
  };

  const handleSubscribeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!currentUser) {
      if (onSubscribeError) onSubscribeError('Vui lòng đăng nhập trước khi đăng ký gói cước.');
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmSubscribe = async () => {
    setIsSubmitting(true);
    // Mimic API delay
    setTimeout(() => {
      const res = subscribePackage(pkg);
      setIsSubmitting(false);
      setShowConfirm(false);
      if (res.success) {
        if (onSubscribeSuccess) onSubscribeSuccess(res.message);
      } else {
        if (onSubscribeError) onSubscribeError(res.message);
      }
    }, 800);
  };

  const getDurationLabel = (duration: Package['duration']) => {
    switch (duration) {
      case 'daily': return 'Ngày';
      case 'weekly': return 'Tuần';
      case 'monthly': return 'Tháng';
      case 'yearly': return 'Năm';
    }
  };

  return (
    <div className="bg-white rounded-xl p-5 flex flex-col justify-between card-hover-effect relative border border-slate-200 shadow-sm overflow-hidden">
      {/* Popular Indicator */}
      {pkg.isPopular && (
        <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg flex items-center space-x-1 z-10">
          <Sparkles className="w-3 h-3" />
          <span>Phổ biến</span>
        </div>
      )}

      {/* Header Info */}
      <div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {pkg.tags.map((tag, idx) => (
            <span key={idx} className="bg-slate-50 border border-slate-200 text-slate-650 text-[9px] px-2 py-0.5 rounded font-semibold">
              {tag}
            </span>
          ))}
        </div>

        <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-primary transition-colors flex items-center justify-between">
          {pkg.name}
          <span className="text-xs text-slate-500 flex items-center font-normal">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 mr-1" />
            {pkg.rating}
          </span>
        </h3>

        {/* Price & Duration */}
        <div className="mt-3 mb-4 flex items-baseline space-x-1">
          <span className="text-2xl font-black text-primary">
            {new Intl.NumberFormat('vi-VN').format(pkg.price)}
          </span>
          <span className="text-xs text-slate-500 font-bold">
            đ / {getDurationLabel(pkg.duration)}
          </span>
        </div>

        {/* Benefits List */}
        <div className="space-y-2.5 my-4 border-t border-slate-100 pt-4 text-xs">
          {/* Data Benefit */}
          <div className="flex items-center text-slate-800">
            <Wifi className="w-4 h-4 text-primary mr-2.5 shrink-0" />
            <div className="flex flex-col">
              <span className="font-bold text-[13px] text-slate-900">{pkg.dataLimit}</span>
              <span className="text-[10px] text-slate-500 font-medium">Dung lượng Data</span>
            </div>
          </div>

          {/* Voice Benefit (if combo) */}
          {(pkg.voiceFreeInternalMin > 0 || pkg.voiceFreeExternalMin > 0) ? (
            <div className="flex items-center text-slate-800">
              <Phone className="w-4 h-4 text-primary mr-2.5 shrink-0" />
              <div className="flex flex-col">
                <span className="font-bold text-[13px] text-slate-900">
                  {pkg.voiceFreeInternalMin > 0 ? `Nội mạng < ${pkg.id === 'v50c' || pkg.id === 'mxh120' ? '10m' : '20m'}` : ''}
                  {pkg.voiceFreeExternalMin > 0 ? ` + ${pkg.voiceFreeExternalMin}ph ngoại mạng` : ''}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Gọi thoại miễn phí</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center text-slate-400">
              <Phone className="w-4 h-4 text-slate-300 mr-2.5 shrink-0" />
              <span className="text-[11px] text-slate-400 font-medium">Không bao gồm phút thoại</span>
            </div>
          )}

          {/* Social Benefit */}
          {pkg.socialFreeApps.length > 0 && (
            <div className="flex items-center text-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600 mr-2.5 shrink-0" />
              <div className="flex flex-col">
                <span className="font-bold text-[13px] text-slate-900">
                  Free data {pkg.socialFreeApps.join(', ')}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Ứng dụng miễn phí</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
        <div className="flex items-center space-x-2">
          {/* Quick Subscribe Button */}
          <button
            onClick={handleSubscribeClick}
            className="flex-1 bg-primary hover:bg-primary-hover text-white font-bold py-2 rounded-lg text-xs transition-colors"
          >
            Đăng ký
          </button>

          {/* Add to Compare Button */}
          <button
            onClick={handleCompareToggle}
            title={isInCompare ? "Xóa khỏi so sánh" : "Thêm vào so sánh"}
            className={`p-2 rounded-lg border transition-colors focus:outline-none ${
              isInCompare
                ? 'bg-red-50 border-red-100 text-primary'
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* View Details Link */}
        <Link
          to={`/packages/${pkg.id}`}
          className="block w-full text-center py-1.5 text-[11px] text-slate-500 hover:text-slate-900 hover:underline transition-colors"
        >
          Xem chi tiết & Điều kiện
        </Link>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-sm w-full shadow-md animate-scale-up">
            <h4 className="text-base font-extrabold text-slate-900 mb-2">Xác nhận đăng ký</h4>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              Bạn có chắc chắn muốn đăng ký gói cước <strong className="text-primary">{pkg.name}</strong> với giá{' '}
              <strong className="text-slate-900">{new Intl.NumberFormat('vi-VN').format(pkg.price)}đ</strong>? 
              Số tiền sẽ bị trừ trực tiếp từ số dư tài khoản ảo của bạn.
            </p>
            <div className="flex space-x-3">
              <button
                disabled={isSubmitting}
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 bg-slate-50 border border-slate-200 text-slate-650 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs transition-colors font-bold"
              >
                Hủy
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleConfirmSubscribe}
                className="flex-1 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg text-xs transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
