import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, MessageSquare, ArrowRight, Compass, ShieldCheck, Zap } from 'lucide-react';
import { usePackageStore, useChatbotStore } from '../store';
import PackageCard from '../components/PackageCard';

export default function Home() {
  const { packages } = usePackageStore();
  const navigate = useNavigate();
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const popularPackages = packages.filter(p => p.dohot !== 'normal').slice(0, 4);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const categories = [
    { id: 'data', name: 'Gói siêu DATA', desc: 'Dung lượng lớn lướt web thả ga', icon: Zap, color: 'text-amber-600' },
    { id: 'combo', name: 'Gói COMBO', desc: 'Miễn phí cả phút gọi và data', icon: Compass, color: 'text-primary' },
    { id: 'social', name: 'Mạng xã hội', desc: 'Không giới hạn TikTok, YouTube', icon: Sparkles, color: 'text-purple-600' }
  ];

  return (
    <div className="space-y-16 pb-12 relative animate-fade-in text-xs font-semibold">
      {/* Toast Notification */}
      {toastMsg && (
        <div className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-lg shadow-lg border-l-4 text-xs font-semibold animate-scale-up bg-white text-slate-800 ${
          toastMsg.type === 'success' ? 'border-emerald-500' : 'border-red-500'
        }`}>
          {toastMsg.text}
        </div>
      )}

      {/* Hero Banner Section */}
      <section className="relative bg-[#F8FAFC] border border-slate-200 shadow-sm rounded-xl p-8 md:p-14 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="max-w-xl space-y-6 relative z-10">
          <div className="inline-flex items-center space-x-2 bg-red-50 border border-red-100 px-3 py-1 rounded text-[11px] font-bold text-primary">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tích hợp Trợ lý ảo AI Viettel</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight text-slate-900">
            Lựa chọn gói cước <br />
            <span className="text-primary">Thông minh hơn cùng AI</span>
          </h1>

          <p className="text-slate-600 text-sm md:text-base leading-relaxed font-medium">
            Hệ thống phân tích nhu cầu sử dụng thực tế và gợi ý gói cước di động Viettel tiết kiệm nhất cho bạn. Khám phá kho gói cước data khủng, gọi thoại thả ga ngay hôm nay!
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <Link
              to="/survey"
              className="bg-primary hover:bg-primary-hover text-white font-bold px-6 py-3 rounded-lg text-xs transition-colors text-center flex items-center justify-center space-x-2"
            >
              <span>Tìm gói cước phù hợp (Khảo sát)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/packages"
              className="bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 px-6 py-3 rounded-lg text-xs font-bold transition-colors text-center"
            >
              Xem tất cả gói cước
            </Link>
          </div>
        </div>

        {/* Hero Visual decoration */}
        <div className="w-full md:w-80 h-72 relative flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl border border-slate-200 w-64 shadow-sm relative rotate-3">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Đề xuất nhiều nhất</span>
              <Sparkles className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-xl font-bold text-slate-900 mb-1">MXH100</p>
            <p className="text-[11px] text-slate-500 mb-4 font-medium">Free Youtube + TikTok + Facebook</p>
            <div className="flex justify-between items-baseline border-t border-slate-100 pt-3">
              <span className="text-xs text-slate-500 font-medium">Giá chỉ</span>
              <span className="text-base font-bold text-primary">100.000đ/tháng</span>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="space-y-6">
        <div className="text-center md:text-left">
          <h2 className="text-2xl font-extrabold text-slate-900">Khám phá theo nhu cầu</h2>
          <p className="text-slate-500 text-xs mt-1 font-semibold">Phân loại gói cước di động thông dụng nhất</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {categories.map((cat) => {
            const IconComponent = cat.icon;
            return (
              <div
                key={cat.id}
                onClick={() => navigate(`/packages?category=${cat.id}`)}
                className="bg-white border border-slate-200 rounded-xl p-6 card-hover-effect cursor-pointer flex items-start space-x-4"
              >
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg shrink-0">
                  <IconComponent className={`w-6 h-6 ${cat.color}`} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">{cat.name}</h3>
                  <p className="text-xs text-slate-500 leading-normal font-medium">{cat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Popular Packages Showcase */}
      <section className="space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Gói cước nổi bật</h2>
            <p className="text-slate-500 text-xs mt-1 font-semibold">Các gói cước được nhiều khách hàng đăng ký nhất tháng qua</p>
          </div>
          <Link to="/packages" className="text-xs text-primary font-bold flex items-center space-x-1 hover:underline">
            <span>Tất cả</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {popularPackages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              onSubscribeSuccess={(msg) => showToast('success', msg)}
              onSubscribeError={(msg) => showToast('error', msg)}
            />
          ))}
        </div>
      </section>

      {/* AI & Survey Call To Action Banner */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
        {/* Chatbot CTA */}
        <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-xl flex flex-col justify-between items-start space-y-4">
          <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
            <MessageSquare className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Bạn muốn hỏi đáp trực tuyến?</h3>
            <p className="text-slate-500 text-xs leading-normal font-medium">
              Trò chuyện trực tiếp với Trợ lý ảo Viettel AI để tìm kiếm gói cước, giải đáp thủ tục và hướng dẫn nạp thẻ nhanh chóng.
            </p>
          </div>
          <button
            onClick={() => useChatbotStore.getState().setIsOpen(true)}
            className="flex items-center space-x-1.5 text-xs text-primary font-bold hover:underline focus:outline-none"
          >
            <span>Bắt đầu Chat ngay</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Wizard Survey CTA */}
        <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-xl flex flex-col justify-between items-start space-y-4">
          <div className="p-3 bg-emerald-50 border border-emerald-150 rounded-lg">
            <Compass className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Khảo sát chọn gói cước phù hợp</h3>
            <p className="text-slate-500 text-xs leading-normal font-medium">
              Chỉ mất 1 phút hoàn thành bảng khảo sát thói quen sử dụng, thuật toán AI của chúng tôi sẽ tính toán và xuất ra gói cước lý tưởng nhất.
            </p>
          </div>
          <Link
            to="/survey"
            className="flex items-center space-x-1.5 text-xs text-emerald-600 font-bold hover:underline"
          >
            <span>Bắt đầu khảo sát</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* Brands Trust Section */}
      <section className="bg-[#F8FAFC] rounded-xl p-6 border border-slate-200 text-center space-y-4">
        <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tiêu chuẩn viễn thông hàng đầu</h4>
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 text-xs font-bold text-slate-500">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>KẾT NỐI 5G SIÊU TỐC</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>PHỦ SÓNG TOÀN QUỐC</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>HỖ TRỢ 24/7</span>
          </div>
        </div>
      </section>
    </div>
  );
}
