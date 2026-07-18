import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-[#F5F5F5] py-10 px-6 md:px-12 text-slate-600 text-xs">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Info Column */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-extrabold text-white text-base">
              V
            </div>
            <span className="text-base font-bold text-slate-900 tracking-tight">
              Viettel<span className="text-primary">AI</span>
            </span>
          </div>
          <p className="leading-relaxed">
            Hệ thống Quản lý Đăng ký Gói cước Viettel tích hợp Trợ lý ảo tư vấn tự động AI Chatbot hỗ trợ 24/7.
          </p>
        </div>

        {/* Quick Links Column */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-slate-900">Liên kết nhanh</h4>
          <ul className="space-y-2">
            <li>
              <Link to="/packages" className="hover:text-primary transition-colors">Danh sách gói cước</Link>
            </li>
            <li>
              <Link to="/compare" className="hover:text-primary transition-colors">So sánh gói cước</Link>
            </li>
            <li>
              <Link to="/survey" className="hover:text-primary transition-colors">Khảo sát chọn gói</Link>
            </li>
            <li>
              <Link to="/profile" className="hover:text-primary transition-colors">Tài khoản cá nhân</Link>
            </li>
          </ul>
        </div>

        {/* Popular Categories Column */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-slate-900">Nhóm gói cước</h4>
          <ul className="space-y-2">
            <li>
              <Link to="/packages?category=data" className="hover:text-primary transition-colors">Gói cước DATA tốc độ cao</Link>
            </li>
            <li>
              <Link to="/packages?category=combo" className="hover:text-primary transition-colors">Gói cước COMBO Thoại + Data</Link>
            </li>
            <li>
              <Link to="/packages?category=social" className="hover:text-primary transition-colors">Gói cước Mạng xã hội</Link>
            </li>
            <li>
              <Link to="/packages?category=daily" className="hover:text-primary transition-colors">Gói cước ngắn ngày</Link>
            </li>
          </ul>
        </div>

        {/* Contact Column */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-slate-900">Hỗ trợ khách hàng</h4>
          <ul className="space-y-2.5">
            <li className="flex items-center">
              <Phone className="w-4 h-4 mr-2 text-primary shrink-0" />
              <span>Tổng đài miễn phí: 1800 8098</span>
            </li>
            <li className="flex items-center">
              <Mail className="w-4 h-4 mr-2 text-primary shrink-0" />
              <span>cskh@viettel.com.vn</span>
            </li>
            <li className="flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-primary shrink-0" />
              <span>Số 210 đường Trần Phú, Phường Cái Khế, TP Cần Thơ</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-slate-200 mt-8 pt-6 flex flex-col md:flex-row items-center justify-between text-[11px] text-slate-400">
        <p>© 2026 Tổng Công ty Viễn thông Viettel.</p>
        <div className="flex space-x-4 mt-2 md:mt-0">
          <a href="#" className="hover:text-slate-700">Điều khoản sử dụng</a>
          <a href="#" className="hover:text-slate-700">Chính sách bảo mật</a>
        </div>
      </div>
    </footer>
  );
}
