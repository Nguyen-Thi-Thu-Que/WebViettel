import { useState } from 'react';
import { Users, Edit2, X } from 'lucide-react';
import { useAuthStore } from '../../store';
import type { User } from '../../types';

export default function AdminUsers() {
  const { currentUser } = useAuthStore();
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Mock users list (derived from mock database + logged-in state changes)
  const [usersList, setUsersList] = useState<User[]>([
    { id: 'user_01', name: 'Nguyễn Văn A', phoneNumber: '0987654321', email: 'vana@gmail.com', balance: useAuthStore.getState().currentUser?.id === 'user_01' ? useAuthStore.getState().currentUser!.balance : 150000, activePackages: useAuthStore.getState().currentUser?.id === 'user_01' ? useAuthStore.getState().currentUser!.activePackages : [{ packageId: 'mxh100', activatedAt: '2026-06-15T08:00:00Z', expiresAt: '2026-07-15T08:00:00Z' }], role: 'customer' },
    { id: 'admin_01', name: 'Lê Văn Quản Trị', phoneNumber: '0900000001', email: 'admin@viettel.vn', balance: 0, activePackages: [], role: 'admin' },
    { id: 'user_02', name: 'Trần Thị B', phoneNumber: '0912345678', email: 'thib@gmail.com', balance: 500000, activePackages: [{ packageId: 'sd135', activatedAt: '2026-06-20T10:00:00Z', expiresAt: '2026-07-20T10:00:00Z' }], role: 'customer' },
    { id: 'user_03', name: 'Phạm Văn C', phoneNumber: '0966778899', email: 'vanc@gmail.com', balance: 20000, activePackages: [], role: 'customer' }
  ]);

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newBalance, setNewBalance] = useState('0');

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleEditBalanceClick = (user: User) => {
    setEditingUser(user);
    setNewBalance(user.balance.toString());
  };

  const handleSaveBalance = (e: React.FormEvent) => {
    e.preventDefault();
    const balanceVal = parseInt(newBalance);
    if (isNaN(balanceVal) || balanceVal < 0) {
      showToast('error', 'Số dư tài khoản phải lớn hơn hoặc bằng 0đ');
      return;
    }

    if (editingUser) {
      // Modify in list
      setUsersList(prev => prev.map(u => u.id === editingUser.id ? { ...u, balance: balanceVal } : u));
      
      // If editing currently logged in user, update store
      if (currentUser && currentUser.id === editingUser.id) {
        useAuthStore.setState(state => ({
          currentUser: state.currentUser ? { ...state.currentUser, balance: balanceVal } : null
        }));
      }

      showToast('success', `Đã cập nhật số dư cho thuê bao ${editingUser.phoneNumber} thành ${balanceVal.toLocaleString()}đ.`);
      setEditingUser(null);
    }
  };

  return (
    <div className="space-y-6 relative animate-fade-in text-xs font-semibold">
      {/* Toast Notification */}
      {toastMsg && (
        <div className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-lg shadow-lg border-l-4 text-xs font-semibold bg-white text-slate-800 ${
          toastMsg.type === 'success' ? 'border-emerald-500' : 'border-red-500'
        }`}>
          {toastMsg.text}
        </div>
      )}

      {/* Header View */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center">
          <Users className="w-6 h-6 text-primary mr-2" />
          Quản lý người dùng thuê bao
        </h1>
        <p className="text-slate-500 text-xs mt-0.5 font-semibold">Danh sách các tài khoản khách hàng đăng ký trên hệ thống Viettel Portal.</p>
      </div>

      {/* User Records Table */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <th className="p-4">Họ và tên</th>
                <th className="p-4">Số điện thoại</th>
                <th className="p-4">Địa chỉ Email</th>
                <th className="p-4">Số dư ví điện tử</th>
                <th className="p-4">Gói đang dùng</th>
                <th className="p-4">Vai trò</th>
                <th className="p-4 text-center">Điều chỉnh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {usersList.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-bold text-slate-900">{user.name}</td>
                  <td className="p-4 font-mono font-medium">{user.phoneNumber}</td>
                  <td className="p-4 text-slate-500 font-medium">{user.email}</td>
                  <td className="p-4 font-bold text-emerald-600">
                    {new Intl.NumberFormat('vi-VN').format(user.balance)}đ
                  </td>
                  <td className="p-4 text-slate-550 text-[11px] font-semibold">
                    {user.activePackages.length > 0 ? (
                      <span className="text-slate-800 font-bold">
                        {user.activePackages.map(ap => ap.packageId.toUpperCase()).join(', ')}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium">Chưa đăng ký</span>
                    )}
                  </td>
                  <td className="p-4 uppercase font-bold text-[9px]">
                    {user.role === 'admin' ? (
                      <span className="text-primary bg-red-50 border border-red-100 px-2 py-0.5 rounded">ADMIN</span>
                    ) : (
                      <span className="text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">CS</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleEditBalanceClick(user)}
                      className="p-2 hover:bg-slate-50 rounded-lg text-primary hover:text-red-800 transition-colors focus:outline-none"
                      title="Sửa số dư"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Balance overlay Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-sm w-full shadow-md animate-scale-up space-y-5 z-50 text-xs">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h4 className="text-sm font-extrabold text-slate-900">Điều chỉnh số dư ví</h4>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-800 transition-colors focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBalance} className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-600 space-y-1 font-semibold">
                <p>• Người dùng: <strong className="text-slate-900 font-bold">{editingUser.name}</strong></p>
                <p>• Số điện thoại: <strong className="text-slate-900 font-bold font-mono">{editingUser.phoneNumber}</strong></p>
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="font-bold text-slate-500 uppercase tracking-wider">Số dư mới (VND)</label>
                <input
                  type="number"
                  value={newBalance}
                  onChange={(e) => setNewBalance(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-primary/50 focus:bg-white rounded-lg py-2 px-3 text-slate-700 focus:outline-none transition-colors"
                />
              </div>

              <div className="flex space-x-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-2 bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors font-bold focus:outline-none"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg transition-colors focus:outline-none"
                >
                  Lưu số dư
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
