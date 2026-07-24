import { useState, useEffect } from 'react';
import { 
  Phone, 
  Search, 
  RefreshCw, 
  AlertCircle, 
  X, 
  Calendar,
  User,
  MessageSquare
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
  const [replyingContact, setReplyingContact] = useState<Contact | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

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

  const handleSubmitReply = async () => {
    if (!replyingContact || !replyMessage.trim()) return;
    setSubmittingReply(true);
    try {
      await contactApi.replyContact(replyingContact.contact_id, replyMessage.trim());
      showToast('success', 'Lưu phản hồi thành công!');
      setReplyingContact(null);
      setReplyMessage('');
      loadContacts();
    } catch (err: any) {
      console.error("Lỗi khi gửi phản hồi:", err);
      if (err.response) {
        console.log("Response / Error:", err.response);
      }
      showToast('error', err.response?.data?.message || 'Gửi phản hồi thất bại.');
    } finally {
      setSubmittingReply(false);
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

  const getStatusBadgeClass = (status: string, adminNote?: string) => {
    if (status === 'DONE' || (adminNote && adminNote.trim())) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-250';
    }
    return 'bg-red-50 text-red-700 border-red-200';
  };

  const getStatusLabel = (status: string, adminNote?: string) => {
    if (status === 'DONE' || (adminNote && adminNote.trim())) {
      return 'Đã phản hồi';
    }
    return 'Chưa phản hồi';
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
    { label: 'Chưa phản hồi', value: 'NEW' },
    { label: 'Đã phản hồi', value: 'DONE' }
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
                <th className="p-4 bg-slate-50 w-32">Thao tác</th>
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
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center text-slate-900 font-bold">
                          <User className="w-3 h-3 text-slate-400 mr-1" />
                          {contact.full_name}
                        </div>
                        <div className="flex items-center gap-1.5 pl-4">
                          <span className="text-slate-400 font-mono text-[10px]">{contact.phone}</span>
                          {contact.user_id ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Thành viên
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              Khách vãng lai
                            </span>
                          )}
                        </div>
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
                      </div>
                    </td>

                    {/* Trạng thái xử lý */}
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border select-none ${getStatusBadgeClass(contact.status, contact.admin_note)}`}>
                        {getStatusLabel(contact.status, contact.admin_note)}
                      </span>
                    </td>

                    {/* Ngày gửi */}
                    <td className="p-4 text-slate-500 font-medium whitespace-nowrap">
                      <span className="inline-flex items-center">
                        <Calendar className="w-3 h-3 text-slate-400 mr-1" />
                        {formatDate(contact.created_at)}
                      </span>
                    </td>

                    {/* Thao tác */}
                    <td className="p-4 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setReplyingContact(contact);
                          setReplyMessage(contact.admin_note || '');
                        }}
                        className={`inline-flex items-center space-x-1 px-3 py-1.5 border rounded-lg text-[10px] uppercase transition-all select-none active:scale-95 cursor-pointer ${
                          contact.admin_note && contact.admin_note.trim()
                            ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                            : 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700'
                        }`}
                        title={contact.admin_note && contact.admin_note.trim() ? "Xem / Sửa phản hồi" : "Phản hồi liên hệ"}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{contact.admin_note && contact.admin_note.trim() ? "Xem/Sửa phản hồi" : "Phản hồi"}</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-400 font-semibold">
                    Không tìm thấy yêu cầu liên hệ nào phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reply Modal */}
      {replyingContact && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 max-w-lg w-full shadow-lg animate-scale-up space-y-4 text-left">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center">
                <MessageSquare className="w-4 h-4 text-primary mr-1.5" />
                {replyingContact.admin_note && replyingContact.admin_note.trim() ? "Xem / Sửa phản hồi" : "Phản hồi yêu cầu liên hệ"} #{replyingContact.contact_id.substring(0, 10)}...
              </h4>
              <button
                onClick={() => {
                  setReplyingContact(null);
                  setReplyMessage('');
                }}
                className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-800 transition-colors focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Customer Question details */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Thông tin khách hàng</span>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-700 space-y-1 font-medium">
                <div><strong>Họ tên:</strong> {replyingContact.full_name}</div>
                <div><strong>Số điện thoại:</strong> {replyingContact.phone}</div>
                <div><strong>Đối tượng:</strong> {replyingContact.user_id ? 'Thành viên' : 'Khách vãng lai'}</div>
                <div className="mt-2 pt-2 border-t border-slate-250">
                  {replyingContact.topic && (
                    <div className="mb-2">
                      <strong>Chủ đề: </strong>
                      {getTopicBadge(replyingContact.topic)}
                    </div>
                  )}
                  <strong>Nội dung yêu cầu:</strong>
                  <p className="mt-1 whitespace-pre-line text-slate-600 font-medium leading-relaxed">
                    {replyingContact.message}
                  </p>
                </div>
              </div>
            </div>

            {/* Warn guest user if user_id is null */}
            {!replyingContact.user_id && (
              <div className="bg-amber-50 border border-amber-250 rounded-xl p-3 text-[11px] text-amber-805 font-medium flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span className="text-amber-800">
                  Lưu ý: Đây là khách vãng lai. Sau khi lưu phản hồi trên hệ thống, Admin vui lòng liên hệ trực tiếp qua số điện thoại của khách.
                </span>
              </div>
            )}

            {/* Reply Textarea */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider" htmlFor="reply_message_input">
                Nội dung câu trả lời / phản hồi
              </label>
              <textarea
                id="reply_message_input"
                rows={4}
                placeholder="Nhập nội dung phản hồi cho khách hàng..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-primary/50 focus:bg-white rounded-xl p-3 text-slate-700 text-xs focus:outline-none transition-colors font-semibold"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => {
                  setReplyingContact(null);
                  setReplyMessage('');
                }}
                disabled={submittingReply}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors focus:outline-none disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSubmitReply}
                disabled={submittingReply || !replyMessage.trim()}
                className="px-5 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl text-xs transition-colors focus:outline-none disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer active:scale-95"
              >
                {submittingReply ? 'Đang lưu...' : replyingContact.admin_note && replyingContact.admin_note.trim() ? 'Cập nhật phản hồi' : 'Gửi phản hồi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
