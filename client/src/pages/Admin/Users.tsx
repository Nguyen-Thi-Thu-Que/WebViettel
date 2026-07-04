import { useState, useEffect } from 'react';
import { 
  Users, 
  Loader2, 
  Lock, 
  Unlock, 
  Sparkles, 
  User as UserIcon,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useAuthStore } from '../../store';
import { userApi } from '../../services/api';
import type { User } from '../../types';

export default function AdminUsers() {
  const { currentUser } = useAuthStore();
  const [usersList, setUsersList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Track loading per user row by maps of userId -> actionName ('status' | 'loyalty' | 'type')
  const [processingUserIds, setProcessingUserIds] = useState<Record<string, string>>({});

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await userApi.fetchUsers();
      setUsersList(data);
    } catch (err: any) {
      console.error("Lỗi khi tải danh sách người dùng:", err);
      showToast('error', 'Không thể tải danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleToggleStatus = async (user: User) => {
    const nextStatus = user.status === 'locked' ? 'active' : 'locked';
    const confirmMessage = nextStatus === 'locked'
      ? "Bạn có chắc chắn muốn khóa tài khoản này?\nNgười dùng sẽ không thể đăng nhập cho đến khi được mở khóa."
      : "Bạn có chắc chắn muốn mở khóa tài khoản này?";

    if (!window.confirm(confirmMessage)) return;

    setProcessingUserIds(prev => ({ ...prev, [user.id]: 'status' }));

    try {
      const success = await userApi.updateUser(user.id, { status: nextStatus });
      if (success) {
        // Optimistic Local State Update
        setUsersList(prev => prev.map(u => u.id === user.id ? { ...u, status: nextStatus } : u));
        showToast('success', nextStatus === 'locked' ? 'Đã khóa tài khoản.' : 'Đã mở khóa tài khoản.');
        
        if (currentUser && currentUser.id === user.id) {
          useAuthStore.getState().fetchMe().catch(() => {});
        }
      } else {
        showToast('error', 'Không thể cập nhật dữ liệu.');
      }
    } catch (err: any) {
      showToast('error', err.response ? 'Không thể cập nhật dữ liệu.' : 'Kết nối máy chủ thất bại.');
    } finally {
      setProcessingUserIds(prev => {
        const next = { ...prev };
        delete next[user.id];
        return next;
      });
    }
  };

  const handleToggleLoyalty = async (user: User) => {
    if (!window.confirm("Bạn có chắc chắn muốn thay đổi trạng thái khách hàng thân thiết?")) return;

    const nextLoyal = !user.is_loyal_customer;
    setProcessingUserIds(prev => ({ ...prev, [user.id]: 'loyalty' }));

    try {
      const success = await userApi.updateUser(user.id, { is_loyal_customer: nextLoyal });
      if (success) {
        // Optimistic Local State Update
        setUsersList(prev => prev.map(u => u.id === user.id ? { ...u, is_loyal_customer: nextLoyal } : u));
        showToast('success', 'Đã cập nhật khách hàng thân thiết.');
        
        if (currentUser && currentUser.id === user.id) {
          useAuthStore.getState().fetchMe().catch(() => {});
        }
      } else {
        showToast('error', 'Không thể cập nhật dữ liệu.');
      }
    } catch (err: any) {
      showToast('error', err.response ? 'Không thể cập nhật dữ liệu.' : 'Kết nối máy chủ thất bại.');
    } finally {
      setProcessingUserIds(prev => {
        const next = { ...prev };
        delete next[user.id];
        return next;
      });
    }
  };

  const handleToggleSubscriptionType = async (user: User) => {
    const nextType = user.subscription_type === 'tra_sau' ? 'tra_truoc' : 'tra_sau';
    const label = nextType === 'tra_truoc' ? 'Trả trước' : 'Trả sau';

    if (!window.confirm(`Bạn có chắc chắn muốn chuyển thuê bao này sang ${label}?\nThao tác sẽ ảnh hưởng tới các gói cước người dùng có thể xem.`)) return;

    setProcessingUserIds(prev => ({ ...prev, [user.id]: 'type' }));

    try {
      const success = await userApi.updateUser(user.id, { subscription_type: nextType });
      if (success) {
        // Optimistic Local State Update
        setUsersList(prev => prev.map(u => u.id === user.id ? { ...u, subscription_type: nextType } : u));
        showToast('success', `Đã cập nhật loại thuê bao của ${user.phoneNumber} sang ${label}.`);
        
        if (currentUser && currentUser.id === user.id) {
          useAuthStore.getState().fetchMe().catch(() => {});
        }
      } else {
        showToast('error', 'Không thể cập nhật dữ liệu.');
      }
    } catch (err: any) {
      showToast('error', err.response ? 'Không thể cập nhật dữ liệu.' : 'Kết nối máy chủ thất bại.');
    } finally {
      setProcessingUserIds(prev => {
        const next = { ...prev };
        delete next[user.id];
        return next;
      });
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Không rõ';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoString;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-xs font-semibold text-slate-500 space-y-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span>Đang tải thông tin danh sách người dùng...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative animate-fade-in text-xs font-semibold max-w-7xl mx-auto px-2">
      {/* Toast Notification Container */}
      {toastMsg && (
        <div className={`fixed top-20 right-6 z-50 flex items-center space-x-3 px-5 py-3.5 rounded-2xl shadow-xl border transition-all duration-300 animate-scale-up ${
          toastMsg.type === 'success' 
            ? 'bg-emerald-50/95 border-emerald-250 text-emerald-800' 
            : 'bg-red-50/95 border-red-200 text-red-800'
        }`}>
          <AlertCircle className={`w-5 h-5 shrink-0 ${toastMsg.type === 'success' ? 'text-emerald-600' : 'text-primary'}`} />
          <span className="font-bold text-xs">{toastMsg.text}</span>
        </div>
      )}

      {/* Header View */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-left">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center">
            <Users className="w-6 h-6 text-primary mr-2" />
            Quản lý người dùng thuê bao
          </h1>
          <p className="text-slate-500 text-xs mt-0.5 font-semibold">Danh sách các tài khoản khách hàng đăng ký trên hệ thống Viettel Portal.</p>
        </div>
        <button
          onClick={loadUsers}
          className="inline-flex items-center justify-center space-x-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-950 font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm focus:outline-none cursor-pointer text-xs shrink-0 self-start sm:self-center active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Làm mới danh sách</span>
        </button>
      </div>

      {/* User Records Table Container */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden text-left">
        {/* Table responsive and Scrollable with Sticky Header */}
        <div className="overflow-x-auto max-h-[580px] overflow-y-auto">
          {usersList.length > 0 ? (
            <table className="w-full text-left border-collapse text-xs table-auto min-w-[1000px]">
              <thead className="sticky top-0 bg-slate-50 z-10 shadow-[inset_0_-1px_0_rgba(226,232,240,1)]">
                <tr className="text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                  <th className="p-4 bg-slate-50">Họ và tên</th>
                  <th className="p-4 bg-slate-50">Số điện thoại</th>
                  <th className="p-4 bg-slate-50">Loại thuê bao</th>
                  <th className="p-4 bg-slate-50">Khách hàng thân thiết</th>
                  <th className="p-4 bg-slate-50">Số dư ví</th>
                  <th className="p-4 bg-slate-50">Trạng thái</th>
                  <th className="p-4 bg-slate-50">Vai trò</th>
                  <th className="p-4 bg-slate-50">Ngày đăng ký</th>
                  <th className="p-4 bg-slate-50 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                {usersList.map((user) => {
                  const isStatusLoading = processingUserIds[user.id] === 'status';
                  const isLoyaltyLoading = processingUserIds[user.id] === 'loyalty';
                  const isTypeLoading = processingUserIds[user.id] === 'type';
                  
                  return (
                    <tr key={user.id} className="hover:bg-red-50/5 transition-colors">
                      {/* Full Name */}
                      <td className="p-4 font-bold text-slate-900">
                        <div className="flex items-center space-x-2">
                          <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{user.name}</span>
                        </div>
                      </td>
                      
                      {/* Phone Number */}
                      <td className="p-4 font-mono font-medium">{user.phoneNumber}</td>
                      
                      {/* Subscription Type Toggle */}
                      <td className="p-4">
                        <button
                          disabled={isTypeLoading}
                          onClick={() => handleToggleSubscriptionType(user)}
                          className={`px-3 py-1.5 rounded-lg font-bold border transition-all cursor-pointer select-none text-[10px] uppercase tracking-wider active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${
                            user.subscription_type === 'tra_sau' 
                              ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                          }`}
                          title="Click để đổi loại thuê bao"
                        >
                          {isTypeLoading ? 'Đang đổi...' : (user.subscription_type === 'tra_sau' ? 'Trả sau' : 'Trả trước')}
                        </button>
                      </td>

                      {/* Loyal Customer (KHTT) Toggle */}
                      <td className="p-4">
                        <button
                          disabled={isLoyaltyLoading}
                          onClick={() => handleToggleLoyalty(user)}
                          className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border transition-all cursor-pointer select-none font-bold text-[10px] uppercase tracking-wider active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${
                            user.is_loyal_customer 
                              ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                              : 'bg-slate-50 border-slate-200 text-slate-450 hover:bg-slate-100'
                          }`}
                          title="Click để bật/tắt ưu đãi KHTT"
                        >
                          <Sparkles className={`w-3.5 h-3.5 ${user.is_loyal_customer ? 'fill-amber-400 text-amber-500' : 'text-slate-400'}`} />
                          <span>{isLoyaltyLoading ? 'Cập nhật...' : (user.is_loyal_customer ? 'Thân thiết' : 'Thường')}</span>
                        </button>
                      </td>

                      {/* Balance (Display-only) */}
                      <td className="p-4 font-black text-slate-800 text-xs">
                        {new Intl.NumberFormat('vi-VN').format(user.balance)}đ
                      </td>

                      {/* Account Status Badge */}
                      <td className="p-4">
                        <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full font-bold text-[10px] border ${
                          user.status === 'locked'
                            ? 'bg-red-50 border-red-200 text-primary'
                            : 'bg-emerald-50 border-emerald-250 text-emerald-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'locked' ? 'bg-primary' : 'bg-emerald-500'}`} />
                          <span>{user.status === 'locked' ? 'Bị khóa' : 'Hoạt động'}</span>
                        </span>
                      </td>

                      {/* Role */}
                      <td className="p-4 uppercase font-bold text-[9px]">
                        {user.role === 'admin' ? (
                          <span className="text-primary bg-red-50 border border-red-200 px-2 py-0.5 rounded">ADMIN</span>
                        ) : (
                          <span className="text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">USER</span>
                        )}
                      </td>

                      {/* Created Date */}
                      <td className="p-4 text-slate-500 font-medium whitespace-nowrap">
                        {formatDate(user.created_at)}
                      </td>

                      {/* Action buttons - Khóa/Mở khóa */}
                      <td className="p-4 text-center">
                        <button
                          disabled={isStatusLoading}
                          onClick={() => handleToggleStatus(user)}
                          className={`inline-flex items-center space-x-1 border px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all focus:outline-none cursor-pointer active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${
                            user.status === 'locked'
                              ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700'
                              : 'bg-red-50 hover:bg-red-100 border-red-200 text-primary'
                          }`}
                        >
                          {user.status === 'locked' ? (
                            <>
                              <Unlock className="w-3 h-3 shrink-0" />
                              <span>{isStatusLoading ? 'Đang mở...' : 'Mở tài khoản'}</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-3 h-3 shrink-0" />
                              <span>{isStatusLoading ? 'Đang khóa...' : 'Khóa tài khoản'}</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-10 text-center text-slate-500 font-medium">Danh sách người dùng hiện đang trống.</div>
          )}
        </div>
      </div>
    </div>
  );
}
