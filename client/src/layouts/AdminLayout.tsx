import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wifi, Users, HelpCircle, Bot, ArrowLeft, LogOut, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../store';
import { useEffect } from 'react';

export default function AdminLayout() {
  const { currentUser, authChecked, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Route Guard: only admins allowed
  useEffect(() => {
    if (!authChecked) return;

    if (!currentUser || currentUser.role !== 'admin') {
      navigate('/login');
    }
  }, [currentUser, authChecked, navigate]);

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-500">Đang xác thực tài khoản...</span>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'admin') return null;

  const adminLinks = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Quản lý Gói cước', path: '/admin/packages', icon: Wifi },
    { label: 'Quản lý Người dùng', path: '/admin/users', icon: Users },
    { label: 'Quản lý FAQ', path: '/admin/faqs', icon: HelpCircle },
    { label: 'Cấu hình Chatbot', path: '/admin/chatbot', icon: Bot }
  ];

  return (
    <div className="min-h-screen flex bg-[#F5F5F5] text-slate-800 font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-950 border-r border-slate-900 flex flex-col justify-between shrink-0 p-5 hidden md:flex">
        <div className="space-y-6">
          <div className="flex items-center space-x-2 pb-4 border-b border-slate-900">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-extrabold text-white text-base">
              V
            </div>
            <span className="text-base font-bold text-white tracking-tight flex items-center">
              Admin<span className="text-primary ml-1">Portal</span>
            </span>
          </div>

          <nav className="flex flex-col space-y-1">
            {adminLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-primary/10 text-primary border-l-2 border-primary'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3 pt-6 border-t border-slate-900">
          <Link
            to="/"
            className="flex items-center space-x-2 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về Trang chủ Portal</span>
          </Link>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="w-full flex items-center space-x-2 text-xs text-red-500 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất Admin</span>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white h-16 px-6 md:px-8 flex items-center justify-between border-b border-slate-200 shrink-0 z-10">
          {/* Mobile brand text */}
          <span className="text-sm font-bold text-slate-900 md:hidden">Admin Portal</span>
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-500">Đăng nhập với vai trò:</span>
            <span className="flex items-center text-primary bg-red-50 px-2.5 py-0.5 rounded-lg border border-red-100 font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              {currentUser.name}
            </span>
          </div>
        </header>

        {/* View Outlet Container */}
        <main className="flex-grow p-6 md:p-8 overflow-y-auto space-y-8 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
