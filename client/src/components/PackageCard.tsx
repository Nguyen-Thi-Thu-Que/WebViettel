import { ArrowRightLeft, Sparkles, Wifi, Phone, PhoneCall, MessageSquare, ArrowRight, Check, Gift, Globe } from 'lucide-react';
import type { Package } from '../types';
import { usePackageStore } from '../store';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import RegisterModal from './RegisterModal';

interface PackageCardProps {
  pkg: Package;
  onSubscribe?: (pkg: Package) => void;
  onSubscribeSuccess?: (msg: string) => void;
  onSubscribeError?: (msg: string) => void;
}

const PackageCard = React.memo(function PackageCard({
  pkg,
  onSubscribe,
  onSubscribeSuccess,
  onSubscribeError
}: PackageCardProps) {
  const { addToCompare, compareList, removeFromCompare } = usePackageStore();
  const isInCompare = compareList.some((p) => p.id === pkg.id);
  const [showConfirm, setShowConfirm] = useState(false);

  const isValid = (val: any) => {
    return val !== 0 && val !== '0' && val !== null && val !== undefined && val !== '';
  };

  const handleCompareToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isInCompare) {
      removeFromCompare(pkg.id);
    } else {
      addToCompare(pkg);
    }
  };

  const handleSubscribeClick = () => {
    if (onSubscribe) {
      onSubscribe(pkg);
    } else {
      setShowConfirm(true);
    }
  };

  const isHot = pkg.dohot === 'Hot';

  // Exclude internal database filter tags from being displayed on the card UI
  const excludedTags = ['gia_re', 'trung_binh', 'cao_cap', 'pho_thong', 'tra_truoc', 'tra_sau'];
  const tagsList = (pkg.tags || [])
    .filter((tag: string) => !excludedTags.includes(tag.toLowerCase()))
    .map((tag: string) => tag.trim());

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 hover:border-slate-350 p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-lg relative text-xs font-semibold select-none text-left">
      {/* Badge Hot */}
      {isHot && (
        <div className="absolute top-4 right-4 bg-primary text-white text-[9px] font-black px-2.5 py-1 rounded-full flex items-center space-x-1 shadow-sm">
          <Sparkles className="w-3 h-3 fill-white text-white" />
          <span>HOT</span>
        </div>
      )}

      {/* Main info block */}
      <div className="space-y-4">
        {/* Category & Package Code */}
        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">
          {pkg.phan_loai_goi || 'Data'} {pkg.ma_goi && `• ${pkg.ma_goi}`}
        </span>

        {/* Name */}
        <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-primary transition-colors pr-8 leading-snug">
          {pkg.ten}
        </h3>

        {/* Pricing */}
        <div className="flex items-baseline space-x-1.5 pt-1">
          <span className="text-2xl font-black text-slate-900 tracking-tight">
            {new Intl.NumberFormat('vi-VN').format(pkg.gia)}đ
          </span>
          <span className="text-[11px] text-slate-500 font-bold">
            / {pkg.chu_ky_ngay} ngày
          </span>
        </div>

        {/* Highlight points if available */}
        {isValid(pkg.diem_noi_bat) && (
          <div className="bg-red-50/50 border border-red-100/40 rounded-xl p-3 text-[11px] text-primary font-bold flex items-start space-x-2">
            <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
            <span className="leading-snug">{pkg.diem_noi_bat}</span>
          </div>
        )}

        {/* Benefits lists */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          {/* Data benefit */}
          {isValid(pkg.data_theo_ngay) && (
            <div className="flex items-center text-slate-700">
              <Wifi className="w-4 h-4 text-primary mr-3 shrink-0" />
              <div className="flex flex-col">
                <span className="font-extrabold text-[12.5px] text-slate-950 leading-tight">
                  {pkg.data_theo_ngay}
                </span>
                <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                  Dung lượng Data
                </span>
              </div>
            </div>
          )}

          {/* Internal Calls benefit */}
          {isValid(pkg.free_noi_mang) && (
            <div className="flex items-center text-slate-700">
              <PhoneCall className="w-4 h-4 text-primary mr-3 shrink-0" />
              <div className="flex flex-col">
                <span className="font-extrabold text-[12.5px] text-slate-950 leading-tight">
                  {pkg.free_noi_mang}
                </span>
                <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                  Gọi nội mạng miễn phí
                </span>
              </div>
            </div>
          )}

          {/* External Calls benefit */}
          {isValid(pkg.free_ngoai_mang) && (
            <div className="flex items-center text-slate-700">
              <Phone className="w-4 h-4 text-primary mr-3 shrink-0" />
              <div className="flex flex-col">
                <span className="font-extrabold text-[12.5px] text-slate-950 leading-tight">
                  {pkg.free_ngoai_mang}
                </span>
                <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                  Gọi ngoại mạng miễn phí
                </span>
              </div>
            </div>
          )}

          {/* SMS benefit */}
          {isValid(pkg.sms) && (
            <div className="flex items-center text-slate-700">
              <MessageSquare className="w-4 h-4 text-primary mr-3 shrink-0" />
              <div className="flex flex-col">
                <span className="font-extrabold text-[12.5px] text-slate-950 leading-tight">
                  {pkg.sms}
                </span>
                <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                  Tin nhắn SMS miễn phí
                </span>
              </div>
            </div>
          )}

          {/* Utilities benefit */}
          {isValid(pkg.tien_ich_free) && (
            <div className="flex items-center text-slate-700">
              <Gift className="w-4 h-4 text-primary mr-3 shrink-0" />
              <div className="flex flex-col">
                <span className="font-extrabold text-[12px] text-slate-950 leading-tight">
                  {pkg.tien_ich_free}
                </span>
                <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                  Tiện ích miễn phí
                </span>
              </div>
            </div>
          )}

          {/* Social Media Apps benefit */}
          {isValid(pkg.noi_dung_ngoai) && (
            <div className="flex items-center text-slate-700">
              <Globe className="w-4 h-4 text-primary mr-3 shrink-0" />
              <div className="flex flex-col">
                <span className="font-extrabold text-[12px] text-slate-950 leading-tight">
                  {pkg.noi_dung_ngoai}
                </span>
                <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                  Ứng dụng miễn phí data
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Tag chips */}
        {tagsList.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {tagsList.slice(0, 3).map((tag: string, index: number) => (
              <span
                key={index}
                className="bg-slate-50 border border-slate-200 text-slate-500 font-bold px-2 py-0.5 rounded-lg text-[9px] tracking-wide"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Buttons Action bar */}
      <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
        <div className="flex items-center gap-2">
          {/* Subscribe trigger button */}
          <button
            onClick={handleSubscribeClick}
            className="flex-1 bg-primary hover:bg-primary-hover text-white font-extrabold py-3 px-4 rounded-xl text-xs transition-colors focus:outline-none cursor-pointer text-center"
            type="button"
          >
            Đăng ký
          </button>

          {/* Compare toggle button */}
          <button
            onClick={handleCompareToggle}
            title={isInCompare ? "Xóa khỏi so sánh" : "Thêm vào so sánh"}
            className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer focus:outline-none ${
              isInCompare
                ? 'bg-red-50 border-red-200 text-primary'
                : 'bg-white border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-450 hover:text-slate-750'
            }`}
            type="button"
          >
            {isInCompare ? <Check className="w-4 h-4" /> : <ArrowRightLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Details route button */}
        <Link
          to={`/packages/${pkg.id}`}
          className="w-full flex items-center justify-center py-2 text-[11px] text-slate-400 hover:text-primary transition-colors font-bold group/lnk"
        >
          <span>Xem chi tiết gói cước</span>
          <ArrowRight className="w-3 h-3 ml-1 transition-transform group-hover/lnk:translate-x-0.5" />
        </Link>
      </div>

      {/* Portal-rendered local fallback modal if parent did not provide page-level registration container */}
      {!onSubscribe && showConfirm && (
        <RegisterModal
          isOpen={showConfirm}
          pkg={pkg}
          onClose={() => setShowConfirm(false)}
          onSuccess={onSubscribeSuccess}
          onError={onSubscribeError}
        />
      )}
    </div>
  );
});

export default PackageCard;
