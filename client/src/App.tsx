import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ClientLayout from './layouts/ClientLayout';
import Home from './pages/Home';
import Packages from './pages/Packages';
import PackageDetail from './pages/PackageDetail';
import Compare from './pages/Compare';
import Survey from './pages/Survey';
import AuthLayout from './layouts/AuthLayout';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import Profile from './pages/Profile';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/Admin/Dashboard';
import AdminPackages from './pages/Admin/Packages';
import AdminUsers from './pages/Admin/Users';
import AdminFAQs from './pages/Admin/FAQs';
import AdminChatbot from './pages/Admin/Chatbot';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Customer Routing */}
        <Route path="/" element={<ClientLayout />}>
          <Route index element={<Home />} />
          <Route path="packages" element={<Packages />} />
          <Route path="packages/:id" element={<PackageDetail />} />
          <Route path="compare" element={<Compare />} />
          <Route path="survey" element={<Survey />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Auth Routing */}
        <Route path="/" element={<AuthLayout />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
        </Route>

        {/* Admin Routing */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="packages" element={<AdminPackages />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="faqs" element={<AdminFAQs />} />
          <Route path="chatbot" element={<AdminChatbot />} />
        </Route>

        {/* Fallback 404 Route */}
        <Route
          path="*"
          element={
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center text-xs font-semibold">
              <h1 className="text-4xl font-extrabold text-primary mb-2">404</h1>
              <p className="text-slate-500 text-xs mb-6 font-semibold">Trang web bạn yêu cầu không tồn tại.</p>
              <a
                href="/"
                className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg text-xs font-bold transition-colors"
              >
                Về trang chủ
              </a>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
