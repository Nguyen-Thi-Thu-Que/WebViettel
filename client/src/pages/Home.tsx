import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, MessageSquare, ArrowRight, Compass, ShieldCheck, Zap } from 'lucide-react';
import { usePackageStore, useChatbotStore } from '../store';
import PackageCard from '../components/PackageCard';
import SEO from '../components/SEO';

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
    { id: 'data', name: 'Gói siêu DATA', desc: 'Dung lượng lớn lướt web thả ga tốc độ cao', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50/50 border-amber-100' },
    { id: 'combo', name: 'Gói COMBO', desc: 'Trọn gói data tốc độ cao kèm miễn phí gọi thoại', icon: Compass, color: 'text-primary', bg: 'bg-red-50/40 border-red-100/60' },
    { id: 'social', name: 'Mạng xã hội', desc: 'Không giới hạn dung lượng TikTok, YouTube, FB', icon: Sparkles, color: 'text-violet-650', bg: 'bg-violet-50/45 border-violet-100' }
  ];

  // Structured schemas for SEO
  const homeSchemas = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Viettel AI - Cổng Đăng Ký Gói Cước Di Động",
      "url": window.location.origin,
      "logo": `${window.location.origin}/favicon.svg`,
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "1800 8098",
        "contactType": "CSKH",
        "areaServed": "VN",
        "availableLanguage": "Vietnamese"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "Tổng Công ty Viễn thông Viettel",
      "image": "https://viettel.vn/og-image.jpg",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Số 1 Giang Văn Minh, Ba Đình",
        "addressLocality": "Hà Nội",
        "addressRegion": "Hà Nội",
        "addressCountry": "VN"
      },
      "telephone": "1800 8098",
      "priceRange": "50000-300000 VND"
    }
  ];

  return (
    <div className="space-y-16 pb-12 relative animate-fade-in text-xs font-semibold">
      {/* Dynamic SEO Head updates */}
      <SEO
        title="Viettel AI - Tra Cứu và Đăng Ký Gói Cước Di Động Thông Minh"
        description="Chào mừng bạn đến với Viettel AI - Cổng thông tin hỗ trợ tra cứu, so sánh và đăng ký các gói cước data 4G/5G, combo thoại giá rẻ, tích hợp Trợ lý ảo AI Chatbot tư vấn 24/7."
        schema={homeSchemas}
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-lg shadow-lg border-l-4 text-xs font-semibold animate-scale-up bg-white text-slate-800 ${toastMsg.type === 'success' ? 'border-emerald-500' : 'border-red-500'
          }`}>
          {toastMsg.text}
        </div>
      )}

      {/* Hero Banner Section with Vercel / Stripe modern gradient design */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm p-8 md:p-14 lg:p-16">
        <div className="absolute inset-0 bg-gradient-to-tr from-red-50/20 via-slate-50/30 to-slate-100/10 pointer-events-none" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl space-y-6 relative z-10 text-left">
          <div className="inline-flex items-center space-x-2 bg-red-50 border border-red-100/60 px-3 py-1.5 rounded-full text-[10px] font-bold text-primary animate-pulse">
            <Sparkles className="w-3.5 h-3.5 fill-primary" />
            <span>ĐỘC QUYỀN TRÊN HỆ THỐNG: TƯ VẤN AI CHATBOT TỰ ĐỘNG</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-slate-900">
            Lựa chọn gói cước <br className="hidden sm:inline" />
            <span className="text-gradient-viettel">Thông minh hơn cùng AI</span>
          </h1>

          <p className="text-slate-500 text-sm md:text-base leading-relaxed font-medium max-w-2xl">
            Tìm kiếm gói cước di động Viettel chưa bao giờ dễ dàng đến thế. Thuật toán AI thông minh của chúng tôi tự động phân tích nhu cầu và đề xuất các gói cước 4G/5G tiết kiệm lên tới 40% chi phí.
          </p>

          <div className="flex flex-wrap items-center gap-3.5 pt-4">
            <Link
              to="/survey"
              className="bg-primary hover:bg-primary-hover text-white font-bold px-6 py-3.5 rounded-xl text-xs transition-all flex items-center justify-center space-x-2 shadow-sm hover:shadow-md cursor-pointer"
            >
              <span>Tìm gói cước phù hợp (Khảo sát)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/packages"
              className="bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-6 py-3.5 rounded-xl text-xs font-bold transition-colors text-center"
            >
              Xem tất cả gói cước
            </Link>
          </div>
        </div>

        {/* Hero mockup card with dynamic badge */}
        <div className="hidden lg:flex absolute right-12 top-1/2 -translate-y-1/2 w-80 h-72 items-center justify-center">
          <div className="bg-gradient-premium text-white p-7 rounded-2xl border border-slate-800 w-68 shadow-xl relative rotate-3 hover:rotate-0 transition-transform duration-500">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[9px] font-bold text-primary uppercase tracking-widest bg-red-500/10 px-2 py-0.5 rounded border border-primary/25">Đề xuất nhiều nhất</span>
              <Sparkles className="w-4 h-4 text-primary fill-primary" />
            </div>
            <p className="text-2xl font-black tracking-tight mb-1">MXH100</p>
            <p className="text-[11px] text-slate-400 mb-6 font-medium leading-relaxed">Không giới hạn truy cập mạng xã hội tốc độ cao</p>

            <div className="space-y-2.5 border-t border-slate-800 pt-4">
              <div className="flex items-center text-[10px] text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-primary mr-2" />
                <span>Miễn phí 100% Tiktok, Youtube, Facebook</span>
              </div>
              <div className="flex items-center text-[10px] text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-primary mr-2" />
                <span>30 GB Data tốc độ cao/tháng</span>
              </div>
            </div>

            <div className="flex justify-between items-baseline mt-6 pt-3 border-t border-slate-800/40">
              <span className="text-[10px] text-slate-400 font-medium">Chi phí chỉ</span>
              <span className="text-lg font-black text-primary">100.000đ/tháng</span>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="space-y-6">
        <div className="text-center md:text-left space-y-1">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Khám phá theo nhu cầu sử dụng</h2>
          <p className="text-slate-500 text-xs font-semibold">Phân loại các gói cước di động thông dụng và ưu đãi nhất</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {categories.map((cat) => {
            const IconComponent = cat.icon;
            return (
              <div
                key={cat.id}
                onClick={() => navigate(`/packages?category=${cat.id}`)}
                className={`bg-white border rounded-2xl p-6 card-hover-effect cursor-pointer flex items-start space-x-4 ${cat.bg}`}
              >
                <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm shrink-0">
                  <IconComponent className={`w-6 h-6 ${cat.color}`} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900">{cat.name}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">{cat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Popular Packages Showcase */}
      <section className="space-y-6">
        <div className="flex items-end justify-between border-b border-slate-100 pb-3">
          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Gói cước nổi bật khuyên dùng</h2>
            <p className="text-slate-500 text-xs font-semibold">Các gói cước di động được người dùng lựa chọn nhiều nhất trong tháng</p>
          </div>
          <Link to="/packages" className="text-xs text-primary font-bold flex items-center space-x-1 hover:underline">
            <span>Tất cả gói cước</span>
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
        <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl flex flex-col justify-between items-start space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
            <MessageSquare className="w-6 h-6 text-primary" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-slate-900">Trò chuyện cùng Trợ lý ảo Viettel AI</h3>
            <p className="text-slate-500 text-xs leading-relaxed font-medium">
              Bạn có thắc mắc về gói cước, cách đăng ký hay cách hủy? Bắt đầu chat ngay với AI Chatbot để nhận phản hồi nhanh chóng 24/7.
            </p>
          </div>
          <button
            onClick={() => useChatbotStore.getState().setIsOpen(true)}
            className="flex items-center space-x-1.5 text-xs text-primary font-bold hover:underline focus:outline-none cursor-pointer"
          >
            <span>Bắt đầu Chat ngay</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Wizard Survey CTA */}
        <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl flex flex-col justify-between items-start space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-55/10 rounded-full blur-2xl pointer-events-none" />
          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
            <Compass className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-slate-900">Khảo sát tìm gói cước phù hợp</h3>
            <p className="text-slate-500 text-xs leading-relaxed font-medium">
              Trả lời 4 câu hỏi nhanh về thói quen sử dụng, hệ thống phân tích nhu cầu di động sẽ gợi ý cho bạn gói cước tối ưu chi phí và tính năng.
            </p>
          </div>
          <Link
            to="/survey"
            className="flex items-center space-x-1.5 text-xs text-emerald-600 font-bold hover:underline"
          >
            <span>Bắt đầu khảo sát nhanh</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* Brands Trust Section */}
      <section className="bg-slate-50 border border-slate-250/60 rounded-2xl p-6 text-center space-y-4">
        <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Hạ tầng mạng viễn thông hàng đầu Việt Nam</h4>
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 text-xs font-bold text-slate-550">
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
            <span>HỖ TRỢ CSKH 24/7</span>
          </div>
        </div>
      </section>
    </div>
  );
}
