import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, User, LogOut, Shield, CreditCard, Menu, X, ChevronDown, Lock, History, FileText } from 'lucide-react';
import { useAuthStore } from '../store';

export default function Navbar() {
  const { currentUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const keyword = params.get('keyword') || '';
    setSearchQuery(keyword);
  }, [location.search]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      navigate(`/goi-cuoc?keyword=${encodeURIComponent(query)}`);
    } else {
      navigate('/goi-cuoc');
    }
    setIsMenuOpen(false);
  };

  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const navLinks = [
    { label: 'Trang chủ', path: '/' },
    { label: 'Gói cước', path: '/packages' },
    { label: 'So sánh', path: '/compare' },
    { label: 'Khảo sát', path: '/survey' },
    { label: 'Tư vấn AI', path: '/chatbot' },
    { label: 'Liên hệ', path: '/contact' }
  ];

  return (
    <nav className="bg-white sticky top-0 z-50 px-4 py-3.5 md:px-8 flex items-center justify-between border-b border-slate-100 shadow-sm">
      {/* Brand Logo */}
      <Link to="/" className="flex items-center space-x-2 focus:outline-none">
        <div className="w-8.5 h-8.5 bg-primary rounded-lg flex items-center justify-center font-extrabold text-white text-lg tracking-wider">
          V
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-905">
          Viettel<span className="text-primary">AI</span>
        </span>
      </Link>

      {/* Main Nav Links (Desktop) */}
      <div className="hidden lg:flex items-center space-x-6 text-sm font-medium text-slate-600">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`hover:text-primary transition-colors py-1 relative ${isActive ? 'text-primary font-bold' : ''
                }`}
            >
              {link.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Search Bar (Desktop) */}
      <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative max-w-xs w-full mx-4">
        <input
          type="text"
          placeholder="Tìm kiếm nhanh gói cước..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-4 pr-10 text-xs text-slate-705 placeholder-slate-400 focus:outline-none focus:border-primary/50 focus:bg-white transition-colors"
        />
        <button type="submit" className="absolute right-3 text-slate-400 hover:text-primary transition-colors focus:outline-none">
          <Search className="w-4 h-4" />
        </button>
      </form>

      {/* Right User Area */}
      <div className="flex items-center space-x-3">
        {/* Notification Icon */}
        <button className="p-2 bg-slate-55 hover:bg-slate-105 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition-colors relative focus:outline-none">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full" />
        </button>

        {currentUser ? (
          <div className="flex items-center space-x-3">
            {/* Balance Badge (Desktop) */}
            <Link
              to="/profile/deposit"
              className="hidden sm:flex items-center space-x-1.5 bg-red-50 border border-red-100 hover:bg-red-100 px-3 py-1 rounded-lg text-xs font-bold text-primary transition-colors"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>{formatBalance(currentUser.balance)}</span>
            </Link>

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-1.5 focus:outline-none group"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-707 text-sm font-semibold group-hover:border-primary/50 transition-colors">
                  {currentUser.name.charAt(0)}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-800 transition-colors" />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-md py-1 text-slate-700 divide-y divide-slate-100 animate-fade-in z-50">
                  <div className="px-4 py-2.5">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Đang đăng nhập</p>
                    <p className="text-sm font-bold truncate text-slate-900">{currentUser.name}</p>
                    <p className="text-xs text-slate-550 truncate">{currentUser.phoneNumber}</p>
                    {/* Mobile Balance */}
                    <div className="sm:hidden mt-2">
                      <Link
                        to="/profile/deposit"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center space-x-1.5 bg-red-50 border border-red-100 px-2.5 py-1 rounded-lg text-xs font-bold text-primary"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>{formatBalance(currentUser.balance)}</span>
                      </Link>
                    </div>
                  </div>

                  <div className="py-1">
                    {currentUser.role === 'admin' && (
                      <Link
                        to="/admin/users"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center px-4 py-2 text-xs hover:bg-slate-50 hover:text-slate-950 transition-colors text-primary font-bold"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Quản lý người dùng
                      </Link>
                    )}
                    <Link
                      to="/profile"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center px-4 py-2 text-xs hover:bg-slate-50 hover:text-slate-950 transition-colors font-bold text-slate-700"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Hồ sơ cá nhân
                    </Link>
                    <Link
                      to="/profile/deposit"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center px-4 py-2 text-xs hover:bg-slate-50 hover:text-slate-950 transition-colors font-bold text-slate-700"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Nạp tiền tài khoản
                    </Link>
                    <Link
                      to="/profile/subscriptions"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center px-4 py-2 text-xs hover:bg-slate-50 hover:text-slate-950 transition-colors font-bold text-slate-700"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Gói cước đang dùng
                    </Link>
                    <Link
                      to="/profile/subscription-history"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center px-4 py-2 text-xs hover:bg-slate-50 hover:text-slate-950 transition-colors font-bold text-slate-700"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Lịch sử đăng ký gói cước
                    </Link>
                    <Link
                      to="/profile/history"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center px-4 py-2 text-xs hover:bg-slate-50 hover:text-slate-950 transition-colors font-bold text-slate-700"
                    >
                      <History className="w-4 h-4 mr-2" />
                      Lịch sử giao dịch
                    </Link>
                    <Link
                      to="/profile/change-password"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center px-4 py-2 text-xs hover:bg-slate-50 hover:text-slate-950 transition-colors font-bold text-slate-700"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Đổi mật khẩu
                    </Link>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        setShowLogoutConfirm(true);
                      }}
                      className="w-full text-left flex items-center px-4 py-2 text-xs hover:bg-red-50 transition-colors text-red-650 font-bold"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <Link
            to="/login"
            className="flex items-center space-x-1 bg-primary hover:bg-primary-hover text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
          >
            <User className="w-3.5 h-3.5" />
            <span>Đăng nhập</span>
          </Link>
        )}

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="lg:hidden p-2 bg-slate-55 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition-colors focus:outline-none"
        >
          {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {isMenuOpen && (
        <div className="absolute top-[65px] left-0 right-0 bg-white border border-slate-200 py-4 px-6 flex flex-col space-y-4 lg:hidden z-40 animate-fade-in shadow-xl">
          {/* Mobile search */}
          <form onSubmit={handleSearchSubmit} className="flex md:hidden items-center relative w-full">
            <input
              type="text"
              placeholder="Tìm kiếm gói cước..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-55 border border-slate-200 rounded-lg py-1.5 pl-4 pr-10 text-xs text-slate-700 focus:outline-none"
            />
            <button type="submit" className="absolute right-3 text-slate-400">
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Nav links */}
          <div className="flex flex-col space-y-3 font-semibold text-sm text-slate-650">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`hover:text-primary transition-colors py-1 ${isActive ? 'text-primary font-bold border-l-2 border-primary pl-2' : ''
                    }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 max-w-sm w-full shadow-lg animate-scale-up text-left space-y-4">
            <h3 className="text-base font-extrabold text-slate-905">Xác nhận đăng xuất</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Bạn có chắc chắn muốn đăng xuất khỏi hệ thống ViettelAI?
            </p>
            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 bg-slate-50 border border-slate-200 text-slate-605 hover:text-slate-950 hover:bg-slate-100 rounded-xl text-xs transition-colors font-bold focus:outline-none"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                  navigate('/login');
                }}
                className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl text-xs transition-colors focus:outline-none cursor-pointer"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
