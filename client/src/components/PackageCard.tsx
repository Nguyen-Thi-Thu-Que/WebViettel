import { ArrowRightLeft, Sparkles, Wifi, Phone, ShieldCheck } from 'lucide-react';
import type { Package } from '../types';
import { usePackageStore, useAuthStore } from '../store';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface PackageCardProps {
  pkg: Package;
  onSubscribeSuccess?: (msg: string) => void;
  onSubscribeError?: (msg: string) => void;
}

const PackageCard = React.memo(function PackageCard({ pkg, onSubscribeSuccess, onSubscribeError }: PackageCardProps) {
  const { addToCompare, compareList, removeFromCompare } = usePackageStore();
  const { currentUser, subscribePackage } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isInCompare = compareList.some((p) => p.id === pkg.id);

  const isValid = (val: any) => {
    return val !== 0 && val !== '0' && val !== null && val !== undefined && val !== '';
  };

  const handleCompareToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isInCompare) {
      removeFromCompare(pkg.id);
      if (onSubscribeSuccess) onSubscribeSuccess('Đã xóa khỏi danh sách so sánh.');
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
    try {
      const res = await subscribePackage(pkg);
      setIsSubmitting(false);
      setShowConfirm(false);
      if (res.success) {
        if (onSubscribeSuccess) onSubscribeSuccess(res.message);
      } else {
        if (onSubscribeError) onSubscribeError(res.message);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setShowConfirm(false);
      if (onSubscribeError) onSubscribeError(err.message || 'Có lỗi xảy ra.');
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 flex flex-col justify-between card-hover-effect relative border border-slate-200 shadow-sm overflow-hidden text-xs font-semibold">
      {/* Popular Indicator */}
      {pkg.dohot !== 'normal' && (
        <div className="absolute top-0 right-0 bg-primary text-white text-[9px] font-bold px-3 py-1 rounded-bl-lg flex items-center space-x-1 z-10 animate-pulse">
          <Sparkles className="w-3 h-3 fill-white" />
          <span>NỔI BẬT</span>
        </div>
      )}

      {/* Header Info */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            {pkg.phan_loai_goi}
          </span>
        </div>

        <h3 className="text-lg font-black text-slate-900 group-hover:text-primary transition-colors flex items-center justify-between">
          {pkg.ten}
        </h3>

        {/* Price & Duration */}
        <div className="mt-2.5 mb-3.5 flex items-baseline space-x-1">
          <span className="text-xl font-black text-primary">
            {new Intl.NumberFormat('vi-VN').format(pkg.gia)}
          </span>
          <span className="text-[10px] text-slate-500 font-bold">
            đ / {pkg.chu_ky_ngay} ngày
          </span>
        </div>

        {/* Short description uudaitrong (max 2 lines) */}
        {isValid(pkg.uudaitrong) && (
          <p className="text-slate-500 text-[11px] leading-relaxed mb-4 font-semibold line-clamp-2 h-8">
            {pkg.uudaitrong}
          </p>
        )}

        {/* Simplified Benefits List (Only allowed non-zero fields shown) */}
        <div className="space-y-2.5 my-3.5 border-t border-slate-100 pt-3.5">
          {/* Data Benefit */}
          {isValid(pkg.data_theo_ngay) && (
            <div className="flex items-center text-slate-800">
              <Wifi className="w-4 h-4 text-primary mr-2.5 shrink-0" />
              <div className="flex flex-col">
                <span className="font-extrabold text-[12px] text-slate-900 leading-tight">{pkg.data_theo_ngay}</span>
                <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Dung lượng Data</span>
              </div>
            </div>
          )}

          {/* Voice Benefit - Internal */}
          {isValid(pkg.free_noi_mang) && (
            <div className="flex items-center text-slate-800">
              <Phone className="w-4 h-4 text-primary mr-2.5 shrink-0" />
              <div className="flex flex-col">
                <span className="font-extrabold text-[12px] text-slate-900 leading-tight">{pkg.free_noi_mang}</span>
                <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Gọi Nội mạng</span>
              </div>
            </div>
          )}

          {/* Voice Benefit - External */}
          {isValid(pkg.free_ngoai_mang) && (
            <div className="flex items-center text-slate-800">
              <Phone className="w-4 h-4 text-primary mr-2.5 shrink-0" />
              <div className="flex flex-col">
                <span className="font-extrabold text-[12px] text-slate-900 leading-tight">{pkg.free_ngoai_mang}</span>
                <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Gọi Ngoại mạng</span>
              </div>
            </div>
          )}

          {/* Social Benefit */}
          {isValid(pkg.noi_dung_ngoai) && (
            <div className="flex items-center text-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600 mr-2.5 shrink-0" />
              <div className="flex flex-col">
                <span className="font-extrabold text-[12px] text-slate-900 leading-tight line-clamp-1">{pkg.noi_dung_ngoai}</span>
                <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Ứng dụng Free</span>
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
            className="flex-1 bg-primary hover:bg-primary-hover text-white font-bold py-2 rounded-xl text-xs transition-colors focus:outline-none cursor-pointer"
          >
            Đăng ký
          </button>

          {/* Add to Compare Button */}
          <button
            onClick={handleCompareToggle}
            title={isInCompare ? "Xóa khỏi so sánh" : "Thêm vào so sánh"}
            className={`p-2 rounded-xl border transition-colors focus:outline-none cursor-pointer ${
              isInCompare
                ? 'bg-red-50 border-red-100 text-primary'
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* View Details button linking to independent route */}
        <Link
          to={`/packages/${pkg.id}`}
          className="block w-full text-center py-1.5 text-[11px] text-slate-500 hover:text-slate-900 hover:underline transition-colors font-bold"
        >
          Xem chi tiết & Điều kiện
        </Link>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-sm w-full shadow-md animate-scale-up">
            <h4 className="text-sm font-extrabold text-slate-900 mb-2">Xác nhận đăng ký</h4>
            <p className="text-xs text-slate-655 mb-5 leading-relaxed font-semibold">
              Bạn có chắc chắn muốn đăng ký gói cước <strong className="text-primary">{pkg.ten}</strong> với giá{' '}
              <strong className="text-slate-900">{new Intl.NumberFormat('vi-VN').format(pkg.gia)}đ</strong>? 
              Số tiền sẽ bị trừ trực tiếp từ số dư tài khoản ảo của bạn.
            </p>
            <div className="flex space-x-3">
              <button
                disabled={isSubmitting}
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 bg-slate-50 border border-slate-200 text-slate-650 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs transition-colors font-bold focus:outline-none"
              >
                Hủy
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleConfirmSubscribe}
                className="flex-1 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg text-xs transition-colors disabled:opacity-50 focus:outline-none cursor-pointer"
              >
                {isSubmitting ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default PackageCard;
