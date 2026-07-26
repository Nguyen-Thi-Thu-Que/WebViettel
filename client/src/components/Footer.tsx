import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Phone, Mail, MapPin, Bot, ChevronDown, ChevronRight, ChevronUp,
  Wifi, Shield, FileText, HeadphonesIcon, Zap,
  ArrowRightLeft, ClipboardList, Wallet
} from 'lucide-react';
import { useChatbotStore } from '../store';

// ─── Social icon SVGs (inline — no external deps) ─────────────────────────────
function IconFacebook() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-label="Facebook">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.66c0-3.025 1.791-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.266h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  );
}
function IconYoutube() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-label="Youtube">
      <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
    </svg>
  );
}
function IconTiktok() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-label="TikTok">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.3a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.88a8.24 8.24 0 0 0 4.82 1.54V7.04a4.85 4.85 0 0 1-1.06-.35z" />
    </svg>
  );
}
function IconZalo() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-label="Zalo">
      <path d="M12.49 10.272c-.745 0-1.247.573-1.247 1.228 0 .676.502 1.249 1.247 1.249.744 0 1.247-.573 1.247-1.249 0-.655-.503-1.228-1.247-1.228zM12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.815 14.52c-.153.399-.486.717-.906.832-.207.057-.497.083-.888.083-1.148 0-2.295-.255-3.45-.768-1.155-.512-2.163-1.23-3.022-2.154-.862-.921-1.479-1.906-1.854-2.955-.377-1.052-.394-1.988-.048-2.808.346-.82.998-1.353 1.955-1.601l.36-.066c.334-.033.625.176.735.498l.75 2.113c.108.305.026.651-.205.87l-.362.338c-.162.149-.211.382-.125.582.292.649.76 1.265 1.4 1.848.64.582 1.31 1.003 2.007 1.261.213.078.451.01.594-.168l.333-.389c.216-.252.564-.333.871-.203l2.015.892c.308.136.489.462.44.796l-.4.999z" />
    </svg>
  );
}

// ─── Mobile accordion item ─────────────────────────────────────────────────────
function MobileSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/8">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-sm font-bold text-white/90 cursor-pointer"
      >
        {title}
        <ChevronDown className={`w-4 h-4 text-white/50 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-96 pb-4' : 'max-h-0'}`}>
        {children}
      </div>
    </div>
  );
}

// ─── Reusable nav link ─────────────────────────────────────────────────────────
function NavLink({ to, children, onClick }: { to?: string; children: React.ReactNode; onClick?: () => void }) {
  const location = useLocation();
  const cls =
    'flex items-center gap-1.5 text-slate-400 hover:text-white text-xs font-medium transition-all duration-200 hover:translate-x-0.5 cursor-pointer';

  const handleLinkClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick();
      return;
    }
    if (to) {
      const currentPath = location.pathname + location.search;
      if (currentPath === to || location.pathname === to) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  if (onClick) {
    return (
      <button type="button" onClick={handleLinkClick} className={cls}>
        <ChevronRight className="w-3 h-3 opacity-50 shrink-0" />
        {children}
      </button>
    );
  }
  return (
    <Link to={to!} onClick={handleLinkClick} className={cls}>
      <ChevronRight className="w-3 h-3 opacity-50 shrink-0" />
      {children}
    </Link>
  );
}

// ─── Social button ─────────────────────────────────────────────────────────────
function SocialBtn({
  href, label, hoverClass, children,
}: { href: string; label: string; hoverClass: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={`w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 border border-white/10 bg-white/5 hover:border-transparent transition-all duration-200 hover:-translate-y-0.5 ${hoverClass}`}
    >
      {children}
    </a>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function Footer() {
  const { setIsOpen: openChatbot } = useChatbotStore();
  const [subscribeInput, setSubscribeInput] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscribeInput.trim()) {
      setSubscribeStatus('error');
      return;
    }
    setSubscribeStatus('ok');
    setSubscribeInput('');
    setTimeout(() => setSubscribeStatus('idle'), 4000);
  };

  return (
    <footer className="bg-[#0f172a] border-t-2 border-primary/30 text-slate-400 text-xs mt-12">

      {/* ═══ TẦNG 1: NEWSLETTER BANNER ══════════════════════════════════════ */}
      <div className="relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-16 left-1/4 w-80 h-80 bg-primary/8 rounded-full blur-3xl" />
          <div className="absolute top-0 right-0 w-60 h-60 bg-violet-700/6 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 py-8 border-b border-white/8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left: Copy */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 bg-primary/15 border border-primary/30 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                <Zap className="w-3 h-3" />
                Ưu đãi độc quyền
              </div>
              <h3 className="text-lg font-black text-white leading-snug">
                Nhận ngay thông tin khuyến mãi gói cước<br className="hidden sm:inline" /> mới nhất từ Viettel
              </h3>
              <p className="text-slate-400 text-xs font-medium leading-relaxed max-w-sm">
                Đăng ký để không bỏ lỡ các gói cước Data/Combo ưu đãi, thông báo
                gia hạn tự động và tin tức công nghệ mạng 5G.
              </p>
              {/* AI shortcut */}
              <button
                type="button"
                onClick={() => openChatbot(true)}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-primary transition-colors mt-1 cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5" />
                Cần tìm gói cước gấp? Trò chuyện cùng AI ngay →
              </button>
            </div>

            {/* Right: Form */}
            <div className="space-y-3">
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  id="footer-subscribe-input"
                  type="text"
                  placeholder="Nhập số điện thoại hoặc email..."
                  value={subscribeInput}
                  onChange={e => setSubscribeInput(e.target.value)}
                  className="flex-1 h-11 px-4 bg-white/6 border border-white/12 rounded-xl text-sm font-medium text-white placeholder-slate-600 focus:outline-none focus:border-primary/60 focus:bg-white/10 transition-all"
                />
                <button
                  id="footer-subscribe-btn"
                  type="submit"
                  className="h-11 px-5 bg-primary hover:bg-primary-hover text-white font-bold text-xs rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20 cursor-pointer shrink-0"
                >
                  Đăng ký
                </button>
              </form>

              {subscribeStatus === 'ok' && (
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold animate-fade-in">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <span className="text-emerald-400 text-[10px]">✓</span>
                  </div>
                  Đăng ký thành công! Chúng tôi sẽ gửi thông tin ưu đãi sớm nhất.
                </div>
              )}
              {subscribeStatus === 'error' && (
                <p className="text-red-400 text-[11px] font-semibold">Vui lòng nhập số điện thoại hoặc email hợp lệ.</p>
              )}

              <p className="text-[10px] text-slate-600 font-medium">
                Bằng cách đăng ký, bạn đồng ý với{' '}
                <Link to="/privacy" className="text-slate-500 hover:text-primary underline transition-colors">Chính sách bảo mật</Link>{' '}
                của chúng tôi.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ TẦNG 2: MAIN NAVIGATION — DESKTOP ═══════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-10 hidden md:block">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-8">

          {/* COL 1: Brand */}
          <div className="lg:col-span-1 space-y-4">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-primary to-[#7B0019] rounded-xl flex items-center justify-center font-black text-white text-base shadow-lg shadow-primary/30">
                V
              </div>
              <span className="text-base font-black text-white tracking-tight">
                Viettel<span className="text-primary">AI</span>
              </span>
            </div>

            <p className="text-slate-400 text-[11px] font-medium leading-relaxed">
              Hệ thống đăng ký gói cước di động thông minh tích hợp AI Chatbot tư vấn & Công nghệ nạp tiền Web3 Blockchain Sepolia.
            </p>

            {/* System status badge */}
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-[10px] font-bold text-emerald-400">Hệ thống API Viettel 24/7 đang hoạt động</span>
            </div>
          </div>

          {/* COL 2: Gói cước nổi bật */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-primary" />
              Gói Cước Nổi Bật
            </h4>
            <ul className="space-y-2.5">
              <li><NavLink to="/packages?category=data">Gói Data Khủng (SD135, 5G...)</NavLink></li>
              <li><NavLink to="/packages?category=combo">Gói Combo Thoại + Data</NavLink></li>
              <li><NavLink to="/packages?category=social">Free YouTube, TikTok, Facebook</NavLink></li>
              <li><NavLink to="/packages?category=daily">Gói Theo Ngày / Ngắn Hạn</NavLink></li>
              <li><NavLink to="/packages">Xem tất cả gói cước</NavLink></li>
            </ul>
          </div>

          {/* COL 3: Tiện ích & AI */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-violet-400" />
              Tiện Ích & AI
            </h4>
            <ul className="space-y-2.5">
              <li><NavLink to="/compare">
                <ArrowRightLeft className="w-3 h-3 opacity-70" /> So sánh gói cước thông minh
              </NavLink></li>
              <li><NavLink to="/survey">
                <ClipboardList className="w-3 h-3 opacity-70" /> Khảo sát chọn gói 30s
              </NavLink></li>
              <li><NavLink onClick={() => openChatbot(true)}>
                <Bot className="w-3 h-3 opacity-70" /> Chatbot tư vấn AI
              </NavLink></li>
              <li><NavLink to="/profile?tab=subscriptions">
                <Zap className="w-3 h-3 opacity-70" /> Lịch sử đăng ký gói cước
              </NavLink></li>
              <li><NavLink to="/profile?tab=deposit">
                <Wallet className="w-3 h-3 opacity-70" /> Nạp tiền Web3 / QR Code
              </NavLink></li>
            </ul>
          </div>

          {/* COL 4: CSKH */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-1.5">
              <HeadphonesIcon className="w-3.5 h-3.5 text-yellow-400" />
              Hỗ Trợ CSKH
            </h4>
            <ul className="space-y-3">
              <li className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Tổng đài miễn phí 24/7</span>
                </div>
                <div className="pl-5 flex items-center gap-2">
                  <span className="text-xl font-black text-primary leading-none">198</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-sm font-black text-yellow-400">1800 8098</span>
                </div>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-slate-400 font-medium">cskh@viettel.com.vn</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <span className="text-slate-400 font-medium leading-relaxed">Tòa nhà Viettel Cần Thơ<br />210 Trần Phú, Ninh Kiều</span>
              </li>
              <li><NavLink to="/contact">
                Gửi yêu cầu hỗ trợ
              </NavLink></li>
            </ul>
          </div>

          {/* COL 5: Điều khoản */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              Pháp Lý & Tuân Thủ
            </h4>
            <ul className="space-y-2.5">
              <li><NavLink to="/terms">
                <FileText className="w-3 h-3 opacity-70" /> Điều khoản sử dụng dịch vụ
              </NavLink></li>
              <li><NavLink to="/privacy">
                <Shield className="w-3 h-3 opacity-70" /> Chính sách bảo mật
              </NavLink></li>
              <li><NavLink to="/contact">
                Quy trình giải quyết khiếu nại
              </NavLink></li>
              <li>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-medium mt-2 border border-white/8 bg-white/4 rounded-lg px-3 py-2">
                  <Shield className="w-3 h-3 text-slate-600 shrink-0" />
                  <span>Giấy phép KDDV viễn thông Bộ TTTT</span>
                </div>
              </li>
              <li>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-medium border border-white/8 bg-white/4 rounded-lg px-3 py-2">
                  <Shield className="w-3 h-3 text-slate-600 shrink-0" />
                  <span>Chứng nhận Bộ Công Thương</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ═══ TẦNG 2: MAIN NAVIGATION — MOBILE ACCORDION ══════════════════════ */}
      <div className="md:hidden px-6 py-6 border-b border-white/8 space-y-0">
        {/* Brand always visible on mobile */}
        <div className="flex items-center gap-2.5 pb-5 border-b border-white/8 mb-2">
          <div className="w-9 h-9 bg-gradient-to-br from-primary to-[#7B0019] rounded-xl flex items-center justify-center font-black text-white text-base shadow-lg shadow-primary/30">
            V
          </div>
          <span className="text-base font-black text-white tracking-tight">
            Viettel<span className="text-primary">AI</span>
          </span>
          <span className="ml-auto inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-bold text-emerald-400">Online 24/7</span>
          </span>
        </div>

        <MobileSection title="Gói Cước Nổi Bật">
          <ul className="space-y-3 pl-2">
            <li><NavLink to="/packages?category=data">Gói Data Khủng</NavLink></li>
            <li><NavLink to="/packages?category=combo">Gói Combo Thoại + Data</NavLink></li>
            <li><NavLink to="/packages?category=social">Free YouTube, TikTok, Facebook</NavLink></li>
            <li><NavLink to="/packages?category=daily">Gói Ngắn Hạn / Theo Ngày</NavLink></li>
            <li><NavLink to="/packages">Xem tất cả gói cước</NavLink></li>
          </ul>
        </MobileSection>

        <MobileSection title="Tiện Ích & AI">
          <ul className="space-y-3 pl-2">
            <li><NavLink to="/compare">So sánh gói cước thông minh</NavLink></li>
            <li><NavLink to="/survey">Khảo sát chọn gói 30s</NavLink></li>
            <li><NavLink onClick={() => openChatbot(true)}>Chatbot tư vấn AI</NavLink></li>
            <li><NavLink to="/profile?tab=subscriptions">Lịch sử đăng ký gói cước</NavLink></li>
            <li><NavLink to="/profile?tab=deposit">Nạp tiền</NavLink></li>
          </ul>
        </MobileSection>

        <MobileSection title="Hỗ Trợ CSKH">
          <ul className="space-y-3 pl-2">
            <li className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Tổng đài: <strong className="text-primary">198</strong> · <strong className="text-yellow-400">1800 8098</strong></span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-slate-400">cskh@viettel.com.vn</span>
            </li>
            <li><NavLink to="/contact">Gửi yêu cầu hỗ trợ</NavLink></li>
          </ul>
        </MobileSection>

        <MobileSection title="Pháp Lý & Điều Khoản">
          <ul className="space-y-3 pl-2">
            <li><NavLink to="/terms">Điều khoản sử dụng</NavLink></li>
            <li><NavLink to="/privacy">Chính sách bảo mật</NavLink></li>
            <li><NavLink to="/contact">Quy trình giải quyết khiếu nại</NavLink></li>
          </ul>
        </MobileSection>
      </div>

      {/* ═══ TẦNG 3: BOTTOM BAR ══════════════════════════════════════════════ */}
      <div className="border-t border-white/8">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">

          {/* Left: Copyright */}
          <p className="text-[11px] text-slate-600 font-medium text-center sm:text-left">
            © 2026 Viettel Telecom. Tất cả quyền được bảo lưu.
            <span className="text-slate-700"> · Phát triển bởi </span>
            <span className="text-slate-500 font-bold">Viettel AI Core System</span>
          </p>

          {/* Right: Blockchain tag + Socials */}
          <div className="flex items-center gap-4 flex-wrap justify-center">
            {/* Blockchain network badge */}
            <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-violet-400" />
              <span className="text-[10px] font-bold text-violet-400">Sepolia Network ID: 11155111</span>
            </div>

            {/* Social icons */}
            <div className="flex items-center gap-2">
              <SocialBtn href="https://www.facebook.com/viettel" label="Facebook" hoverClass="hover:bg-[#1877F2] hover:text-white">
                <IconFacebook />
              </SocialBtn>
              <SocialBtn href="https://www.youtube.com/viettel" label="Youtube" hoverClass="hover:bg-[#FF0000] hover:text-white">
                <IconYoutube />
              </SocialBtn>
              <SocialBtn href="https://www.tiktok.com/@viettel" label="TikTok" hoverClass="hover:bg-black hover:text-white hover:border-white/20">
                <IconTiktok />
              </SocialBtn>
              <SocialBtn href="https://zalo.me/viettel" label="Zalo" hoverClass="hover:bg-[#0084FF] hover:text-white">
                <IconZalo />
              </SocialBtn>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Back to Top Button */}
      <button
        type="button"
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 z-[150] w-10 h-10 rounded-xl bg-slate-900 border border-white/10 text-white flex items-center justify-center shadow-2xl hover:bg-primary transition-all duration-300 cursor-pointer ${
          showBackToTop ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
        }`}
        aria-label="Cuộn về đầu trang"
      >
        <ChevronUp className="w-5 h-5" />
      </button>
    </footer>
  );
}
