import { useState, useEffect } from 'react';
import { 
  Phone, 
  Search, 
  RefreshCw, 
  AlertCircle, 
  X, 
  Eye,
  Calendar,
  User
} from 'lucide-react';
import { contactApi } from '../../services/api';
import { TableRowSkeleton } from '../../components/Skeleton';
import type { Contact } from '../../types';

export default function AdminContacts() {
  const [contactsList, setContactsList] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Filters state
  const [searchVal, setSearchVal] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // '' means All
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);

  // Search Debounce (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchKeyword(searchVal);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchVal]);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const data = await contactApi.getAdminContacts({
        status: statusFilter,
        search: searchKeyword
      });
      setContactsList(data || []);
    } catch (err: any) {
      console.error("Lỗi khi tải danh sách yêu cầu liên hệ:", err);
      showToast('error', 'Không thể tải danh sách liên hệ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, [statusFilter, searchKeyword]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleStatusChange = async (contactId: string, newStatus: string) => {
    try {
      await contactApi.updateContactStatus(contactId, newStatus);
      showToast('success', 'Đã cập nhật trạng thái xử lý.');
      loadContacts();
    } catch (error) {
      console.error("Failed to update contact status:", error);
      showToast('error', 'Cập nhật trạng thái thất bại.');
    }
  };

  const formatDate = (dateInput?: any) => {
    if (!dateInput) return '—';
    try {
      const date = new Date(dateInput);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return String(dateInput);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'DONE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-250';
      case 'PROCESSING':
        return 'bg-amber-50 text-amber-700 border-amber-250';
      case 'NEW':
      default:
        return 'bg-red-50 text-primary border-red-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DONE':
        return 'Hoàn thành';
      case 'PROCESSING':
        return 'Đang xử lý';
      case 'NEW':
      default:
        return 'Mới';
    }
  };

  const truncateMessage = (msg: string, limit = 50) => {
    if (!msg) return '—';
    if (msg.length <= limit) return msg;
    return `${msg.substring(0, limit)}...`;
  };

  const getTopicBadge = (topic?: string) => {
    const text = topic || 'Liên hệ chung';
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-50 border border-slate-200 text-slate-650">
        {text}
      </span>
    );
  };

  const filterChips = [
    { label: 'Tất cả', value: '' },
    { label: 'MỚI', value: 'NEW' },
    { label: 'ĐANG XỬ LÝ', value: 'PROCESSING' },
    { label: 'HOÀN THÀNH', value: 'DONE' }
  ];

  return (
    <div className="space-y-6 relative animate-fade-in text-xs font-semibold max-w-7xl mx-auto px-2">
      {/* Toast Notification Container */}
      {toastMsg && (
        <div className={`fixed top-20 right-6 z-50 flex items-center space-x-3 px-5 py-3.5 rounded-2xl shadow-xl border transition-all duration-300 animate-scale-up bg-white text-slate-800 ${
          toastMsg.type === 'success' 
            ? 'border-emerald-500' 
            : 'border-red-500'
        }`}>
          <AlertCircle className={`w-5 h-5 shrink-0 ${toastMsg.type === 'success' ? 'text-emerald-600' : 'text-primary'}`} />
          <span className="font-bold text-xs">{toastMsg.text}</span>
        </div>
      )}

      {/* Header View */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-left">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center">
            <Phone className="w-6 h-6 text-primary mr-2" />
            Yêu cầu Liên hệ & Hỗ trợ
          </h1>
          <p className="text-slate-500 text-xs mt-0.5 font-semibold">Tiếp nhận thông tin phản hồi và quản lý trạng thái hỗ trợ khách hàng thuê bao.</p>
        </div>
        <button
          onClick={loadContacts}
          className="inline-flex items-center justify-center space-x-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-650 hover:text-slate-950 font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm focus:outline-none cursor-pointer text-xs shrink-0 self-start sm:self-center active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Search and Status Chips Filter Row */}
      <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-xl space-y-4 text-left">
        <div className="relative">
          <input
            type="text"
            placeholder="Tìm kiếm theo Họ tên, Số điện thoại hoặc Mã YC..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-primary/50 focus:bg-white rounded-lg py-2.5 px-3 pl-10 text-slate-700 focus:outline-none transition-colors"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          {searchVal && (
            <button
              onClick={() => setSearchVal('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status Tab Chips */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
          {filterChips.map(chip => (
            <button
              key={chip.value}
              onClick={() => setStatusFilter(chip.value)}
              className={`px-3 py-1.5 rounded-lg border font-bold text-[10px] uppercase tracking-wider transition-all select-none active:scale-95 cursor-pointer ${
                statusFilter === chip.value
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-slate-50 text-slate-650 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contacts Table Container */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden text-left">
        <div className="overflow-x-auto max-h-[580px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs table-auto min-w-[900px]">
            <thead className="sticky top-0 bg-slate-50 z-10 shadow-[inset_0_-1px_0_rgba(226,232,240,1)]">
              <tr className="text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                <th className="p-4 bg-slate-50 w-24">Mã YC</th>
                <th className="p-4 bg-slate-50 w-44">Người gửi</th>
                <th className="p-4 bg-slate-50 w-44">Chủ đề</th>
                <th className="p-4 bg-slate-50">Nội dung chi tiết</th>
                <th className="p-4 bg-slate-50 w-44">Trạng thái xử lý</th>
                <th className="p-4 bg-slate-50 w-36">Ngày gửi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRowSkeleton key={idx} />
                ))
              ) : contactsList.length > 0 ? (
                contactsList.map((contact) => (
                  <tr key={contact.contact_id} className="hover:bg-red-50/5 transition-colors">
                    {/* Mã YC */}
                    <td className="p-4 font-mono font-bold text-slate-500">
                      #{contact.contact_id.substring(0, 10)}...
                    </td>

                    {/* Người gửi */}
                    <td className="p-4">
                      <div className="flex flex-col space-y-0.5">
                        <div className="flex items-center text-slate-900 font-bold">
                          <User className="w-3 h-3 text-slate-400 mr-1" />
                          {contact.full_name}
                        </div>
                        <span className="text-slate-400 font-mono text-[10px] pl-4">{contact.phone}</span>
                      </div>
                    </td>

                    {/* Chủ đề */}
                    <td className="p-4">
                      {getTopicBadge(contact.topic)}
                    </td>

                    {/* Nội dung chi tiết */}
                    <td className="p-4">
                      <div className="flex items-center justify-between space-x-2">
                        <span className="text-slate-600 font-medium leading-relaxed">
                          {truncateMessage(contact.message)}
                        </span>
                        <button
                          onClick={() => setSelectedMessage(contact.message)}
                          className="p-1 hover:bg-slate-100 rounded text-blue-600 hover:text-blue-800 transition-colors focus:outline-none shrink-0"
                          title="Xem đầy đủ"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Trạng thái xử lý (Dropdown chuyển nhanh) */}
                    <td className="p-4">
                      <select
                        value={contact.status}
                        onChange={(e) => handleStatusChange(contact.contact_id, e.target.value)}
                        className={`font-bold text-[10px] uppercase py-1 px-2.5 rounded-full border focus:outline-none cursor-pointer tracking-wider ${getStatusBadgeClass(contact.status)}`}
                      >
                        <option value="NEW">{getStatusLabel('NEW')}</option>
                        <option value="PROCESSING">{getStatusLabel('PROCESSING')}</option>
                        <option value="DONE">{getStatusLabel('DONE')}</option>
                      </select>
                    </td>

                    {/* Ngày gửi */}
                    <td className="p-4 text-slate-500 font-medium whitespace-nowrap">
                      <span className="inline-flex items-center">
                        <Calendar className="w-3 h-3 text-slate-400 mr-1" />
                        {formatDate(contact.created_at)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-400 font-semibold">
                    Không tìm thấy yêu cầu liên hệ nào phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Message Modal Viewer */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 max-w-lg w-full shadow-lg animate-scale-up space-y-4 text-left">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center">
                <AlertCircle className="w-4 h-4 text-primary mr-1.5" />
                Nội dung chi tiết yêu cầu liên hệ
              </h4>
              <button
                onClick={() => setSelectedMessage(null)}
                className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-800 transition-colors focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-h-[300px] overflow-y-auto">
              <p className="text-slate-700 font-medium leading-relaxed whitespace-pre-line">
                {selectedMessage}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedMessage(null)}
                className="px-5 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl text-xs transition-colors focus:outline-none"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
