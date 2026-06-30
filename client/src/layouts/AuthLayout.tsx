import { Link, Outlet } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5] px-4 py-12 relative overflow-hidden">
      <div className="w-full max-w-md bg-white border border-slate-200 shadow-sm rounded-xl p-6 md:p-8 relative z-10">
        {/* Logo and Brand */}
        <div className="text-center mb-6 space-y-2">
          <Link to="/" className="inline-flex items-center space-x-2 font-black text-slate-900 text-2xl focus:outline-none">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-extrabold text-white text-base">
              V
            </div>
            <span>
              Viettel<span className="text-primary">AI</span>
            </span>
          </Link>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Hệ thống quản lý dịch vụ khách hàng</p>
        </div>

        {/* Dynamic Auth Views */}
        <Outlet />

        {/* Footer Back Link */}
        <div className="mt-8 pt-4 border-t border-slate-100 text-center">
          <Link
            to="/"
            className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại trang chủ</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
