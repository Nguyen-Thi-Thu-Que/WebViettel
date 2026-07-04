import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4 py-12 relative overflow-hidden">
      {/* Decorative background grid and soft glow blobs */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] opacity-60 pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#EE0033]/5 rounded-full filter blur-3xl opacity-40 pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-rose-300/10 rounded-full filter blur-3xl opacity-30 pointer-events-none" />

      {/* Renders Login.tsx or Register.tsx within clean viewport */}
      <Outlet />
    </div>
  );
}
