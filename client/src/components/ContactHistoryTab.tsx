import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Trash2, Headphones, Clock, CheckCircle2, AlertCircle,
  XCircle, Filter, RotateCcw, MessageSquare, ChevronRight,
  Send, User, Lock, Copy, Check, Info, Sparkles, AlertTriangle
} from 'lucide-react';
import { useAuthStore } from '../store';
import { contactApi } from '../services/api';
import type { Contact as ContactType } from '../types';
import {
  getGuestContactIds,
  saveGuestContactId,
  removeGuestContactId,
  clearGuestContactItems
} from '../utils/guestContactTracker';

interface ContactHistoryTabProps {
  onNavigateToNew?: () => void;
  highlightedId?: string | null;
}

export default function ContactHistoryTab({
  onNavigateToNew,
  highlightedId: initialHighlightId
}: ContactHistoryTabProps) {
  const { currentUser } = useAuthStore();

  // Primary data state
  const [contacts, setContacts] = useState<ContactType[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Search & Filters
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'PENDING' | 'DONE'>('ALL');
  const [selectedTopic, setSelectedTopic] = useState<string>('ALL');

  // Guest Search Form State
  const [showGuestFinder, setShowGuestFinder] = useState(false);
  const [lookupContactId, setLookupContactId] = useState('');
  const [lookupPhone, setLookupPhone] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');

  // Delete Modals
  const [deleteTarget, setDeleteTarget] = useState<ContactType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // Copied code feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Highlight state
  const [highlightId, setHighlightId] = useState<string | null>(initialHighlightId || null);

  const showToast = (type: 'ok' | 'err', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3800);
  };

  // Load history data
  const fetchHistory = async () => {
    setLoading(true);
    try {
      if (currentUser) {
        // Authenticated user history
        const data = await contactApi.getUserContactHistory();
        setContacts(data || []);
      } else {
        // Guest history from localStorage tracker
        const guestIds = getGuestContactIds();
        if (guestIds.length > 0) {
          const data = await contactApi.getGuestContactHistory({ contact_ids: guestIds });
          setContacts(data || []);
        } else {
          setContacts([]);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch contact history', err);
      showToast('err', 'Không thể tải danh sách lịch sử phản hồi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [currentUser]);

  // Highlight scroll effect
  useEffect(() => {
    if (initialHighlightId && !loading && contacts.length > 0) {
      setHighlightId(initialHighlightId);
      const el = document.getElementById(`ct-${initialHighlightId}`);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
        setTimeout(() => setHighlightId(null), 3500);
      }
    }
  }, [initialHighlightId, loading, contacts]);

  // Guest lookup submission
  const handleGuestLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError('');

    const cid = lookupContactId.trim();
    const ph = lookupPhone.trim();

    if (!cid && !ph) {
      setLookupError('Vui lòng nhập Mã yêu cầu hoặc Số điện thoại để tra cứu.');
      return;
    }

    if (ph && !/^0[0-9]{9}$/.test(ph)) {
      setLookupError('Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0.');
      return;
    }

    setLookupLoading(true);
    try {
      const results = await contactApi.lookupContacts(ph, cid);
      if (!results || results.length === 0) {
        setLookupError('Không tìm thấy yêu cầu nào trùng khớp với thông tin đã nhập.');
      } else {
        // Save found contact_ids to guest localStorage
        results.forEach((item) => {
          if (item.contact_id && item.phone) {
            saveGuestContactId(item.contact_id, item.phone);
          }
        });
        showToast('ok', `Đã tìm thấy ${results.length} yêu cầu và lưu vào danh sách tra cứu.`);
        setLookupContactId('');
        setLookupPhone('');
        setShowGuestFinder(false);
        fetchHistory();
      }
    } catch (err: any) {
      setLookupError(err.response?.data?.message || 'Tra cứu thất bại. Vui lòng thử lại.');
    } finally {
      setLookupLoading(false);
    }
  };

  // Handle single item soft delete
  const confirmSoftDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const success = await contactApi.softDeleteContact(deleteTarget.contact_id);
      if (success) {
        // If guest, also remove from localStorage
        if (!currentUser) {
          removeGuestContactId(deleteTarget.contact_id);
        }
        setContacts((prev) => prev.filter((item) => item.contact_id !== deleteTarget.contact_id));
        showToast('ok', 'Đã ẩn yêu cầu khỏi danh sách lịch sử.');
      } else {
        showToast('err', 'Không thể xóa yêu cầu. Vui lòng thử lại.');
      }
    } catch (err: any) {
      showToast('err', err.response?.data?.message || 'Lỗi khi xóa lịch sử.');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  // Handle soft delete all
  const confirmSoftDeleteAll = async () => {
    setIsDeletingAll(true);
    try {
      const guestIds = getGuestContactIds();
      const success = await contactApi.softDeleteAllContacts(currentUser ? undefined : guestIds);
      if (success) {
        if (!currentUser) {
          clearGuestContactItems();
        }
        setContacts([]);
        showToast('ok', 'Đã xóa tất cả lịch sử phản hồi.');
      } else {
        showToast('err', 'Xóa tất cả thất bại.');
      }
    } catch (err: any) {
      showToast('err', err.response?.data?.message || 'Lỗi khi xóa toàn bộ lịch sử.');
    } finally {
      setIsDeletingAll(false);
      setShowDeleteAllModal(false);
    }
  };

  // Copy code helper
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const total = contacts.length;
    const pending = contacts.filter(
      (c) => c.status === 'NEW' || c.status === 'READ' || c.status === 'PROCESSING'
    ).length;
    const done = contacts.filter(
      (c) => c.status === 'DONE' || c.status === 'CLOSED' || !!c.admin_note?.trim()
    ).length;
    return { total, pending, done };
  }, [contacts]);

  // Unique topics from contacts
  const availableTopics = useMemo(() => {
    const topicsSet = new Set<string>();
    contacts.forEach((c) => {
      if (c.topic) topicsSet.add(c.topic);
    });
    return Array.from(topicsSet);
  }, [contacts]);

  // Filtered contacts list
  const filteredContacts = useMemo(() => {
    return contacts.filter((item) => {
      // 1. Search keyword
      if (searchKeyword.trim()) {
        const kw = searchKeyword.trim().toLowerCase();
        const matchId = item.contact_id.toLowerCase().includes(kw);
        const matchTopic = item.topic.toLowerCase().includes(kw);
        const matchMsg = item.message.toLowerCase().includes(kw);
        const matchNote = (item.admin_note || '').toLowerCase().includes(kw);
        if (!matchId && !matchTopic && !matchMsg && !matchNote) return false;
      }

      // 2. Status filter
      if (selectedStatus === 'PENDING') {
        const isDone = item.status === 'DONE' || item.status === 'CLOSED' || !!item.admin_note?.trim();
        if (isDone) return false;
      } else if (selectedStatus === 'DONE') {
        const isDone = item.status === 'DONE' || item.status === 'CLOSED' || !!item.admin_note?.trim();
        if (!isDone) return false;
      }

      // 3. Topic filter
      if (selectedTopic !== 'ALL' && item.topic !== selectedTopic) {
        return false;
      }

      return true;
    });
  }, [contacts, searchKeyword, selectedStatus, selectedTopic]);

  // Date formatting helpers
  const formatDateStr = (dateVal?: any) => {
    if (!dateVal) return '—';
    try {
      const d = new Date(dateVal);
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${pad(d.getHours())}:${pad(d.getMinutes())} - ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    } catch {
      return String(dateVal);
    }
  };

  const getRelativeTimeStr = (dateVal?: any) => {
    if (!dateVal) return '';
    try {
      const diffMs = Date.now() - new Date(dateVal).getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return 'Vừa xong';
      if (diffMin < 60) return `${diffMin} phút trước`;
      const diffHrs = Math.floor(diffMin / 60);
      if (diffHrs < 24) return `${diffHrs} giờ trước`;
      const diffDays = Math.floor(diffHrs / 24);
      if (diffDays <= 7) return `${diffDays} ngày trước`;
      return '';
    } catch {
      return '';
    }
  };

  return (
    <div className="w-full space-y-6 animate-fade-in text-slate-800">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-bold shadow-xl border animate-scale-up ${
            toast.type === 'ok'
              ? 'bg-slate-900 text-white border-slate-800'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          {toast.type === 'ok' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-red-50 text-[#EE0033] border border-red-100">
              {currentUser ? 'Hồ sơ thành viên' : 'Khách vãng lai'}
            </span>
            {currentUser && (
              <span className="text-xs font-semibold text-slate-500">
                · {currentUser.name} ({currentUser.phoneNumber})
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Lịch sử phản hồi yêu cầu hỗ trợ
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Theo dõi trạng thái xử lý và phản hồi trực tiếp từ đội ngũ CSKH Viettel 24/7.
          </p>
        </div>

        {/* Action Button: Guest Search Toggle */}
        {!currentUser && (
          <button
            type="button"
            onClick={() => setShowGuestFinder(!showGuestFinder)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm shrink-0"
          >
            <Search className="w-4 h-4 text-slate-300" />
            <span>{showGuestFinder ? 'Đóng tra cứu' : 'Tra cứu mã yêu cầu'}</span>
          </button>
        )}
      </div>

      {/* Guest Finder Modal / Collapsible Panel */}
      {!currentUser && showGuestFinder && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white p-6 rounded-3xl shadow-xl border border-slate-700 animate-scale-up space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#EE0033] flex items-center justify-center shrink-0">
                <Search className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Tra cứu thủ công cho Khách vãng lai</h3>
                <p className="text-xs text-slate-400 font-medium">
                  Nhập Mã yêu cầu (dạng <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">CT...</code>) và Số điện thoại để tìm lại yêu cầu cũ.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowGuestFinder(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleGuestLookup} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Mã yêu cầu (ID)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: CT172189..."
                  value={lookupContactId}
                  onChange={(e) => setLookupContactId(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-slate-800 border border-slate-700 text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-[#EE0033] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Số điện thoại di động
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="Ví dụ: 0987654321"
                  value={lookupPhone}
                  onChange={(e) => setLookupPhone(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full h-11 px-4 rounded-xl bg-slate-800 border border-slate-700 text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-[#EE0033] transition-colors"
                />
              </div>
            </div>

            {lookupError && (
              <div className="flex items-center gap-2 text-xs font-semibold text-red-400 bg-red-950/50 border border-red-800/50 p-3 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{lookupError}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setLookupContactId('');
                  setLookupPhone('');
                  setLookupError('');
                }}
                className="px-4 h-10 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                Đặt lại
              </button>
              <button
                type="submit"
                disabled={lookupLoading}
                className="px-6 h-10 rounded-xl bg-[#EE0033] hover:bg-[#d4002d] text-white text-xs font-extrabold uppercase tracking-wider transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {lookupLoading ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>Đang tìm...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Tìm yêu cầu</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Summary Cards Widget */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {/* Total Badge */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
              Tổng đã gửi
            </p>
            <p className="text-lg sm:text-2xl font-black text-slate-900 leading-tight">
              {stats.total}
            </p>
          </div>
        </div>

        {/* Pending Badge */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 relative">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
            {stats.pending > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
              Đang xử lý
            </p>
            <p className="text-lg sm:text-2xl font-black text-amber-600 leading-tight">
              {stats.pending}
            </p>
          </div>
        </div>

        {/* Done Badge */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
              Hoàn tất
            </p>
            <p className="text-lg sm:text-2xl font-black text-emerald-600 leading-tight">
              {stats.done}
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar & Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Smart Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm theo Mã yêu cầu (CT...), chủ đề, nội dung câu hỏi hoặc phản hồi..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full h-11 pl-10 pr-10 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#EE0033] focus:bg-white transition-all"
            />
            {searchKeyword && (
              <button
                onClick={() => setSearchKeyword('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Delete All Button */}
          {contacts.length > 0 && (
            <button
              type="button"
              onClick={() => setShowDeleteAllModal(true)}
              className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-colors shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa tất cả lịch sử</span>
            </button>
          )}
        </div>

        {/* Filter Chips & Topic Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setSelectedStatus('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedStatus === 'ALL'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Tất cả ({contacts.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus('PENDING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedStatus === 'PENDING'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Chờ phản hồi ({stats.pending})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus('DONE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedStatus === 'DONE'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Đã xử lý ({stats.done})
            </button>
          </div>

          {/* Topic Filter Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#EE0033] transition-colors cursor-pointer"
            >
              <option value="ALL">Tất cả chủ đề</option>
              {availableTopics.map((topicStr) => (
                <option key={topicStr} value={topicStr}>
                  {topicStr}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area: Card-Timeline Layout */}
      <div className="space-y-4">
        {loading ? (
          // Loading Skeletons
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 animate-pulse"
              >
                <div className="flex items-center justify-between">
                  <div className="h-5 w-32 bg-slate-200 rounded-lg" />
                  <div className="h-6 w-24 bg-slate-200 rounded-full" />
                </div>
                <div className="h-16 bg-slate-100 rounded-2xl" />
                <div className="h-20 bg-slate-100 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : filteredContacts.length === 0 ? (
          // Empty State
          <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto text-slate-300">
              <Headphones className="w-8 h-8" />
            </div>
            <div className="max-w-sm mx-auto space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">
                Chưa có yêu cầu hỗ trợ nào
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {searchKeyword || selectedStatus !== 'ALL' || selectedTopic !== 'ALL'
                  ? 'Không tìm thấy yêu cầu nào phù hợp với bộ lọc hiện tại. Thử xóa bớt bộ lọc xem sao.'
                  : currentUser
                  ? 'Bạn chưa gửi yêu cầu hỗ trợ nào tới tổng đài Viettel.'
                  : 'Chưa có lịch sử lưu trên trình duyệt này. Nếu bạn từng gửi yêu cầu làm khách, hãy bấm "Tra cứu mã yêu cầu" ở trên.'}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              {(searchKeyword || selectedStatus !== 'ALL' || selectedTopic !== 'ALL') ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchKeyword('');
                    setSelectedStatus('ALL');
                    setSelectedTopic('ALL');
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Xóa bộ lọc
                </button>
              ) : onNavigateToNew ? (
                <button
                  type="button"
                  onClick={onNavigateToNew}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#EE0033] hover:bg-[#d4002d] text-white text-xs font-extrabold transition-all shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Tạo yêu cầu mới</span>
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          // Contact Cards List
          filteredContacts.map((item) => {
            const isDone = item.status === 'DONE' || item.status === 'CLOSED' || !!item.admin_note?.trim();
            const isLit = highlightId === item.contact_id;
            const relativeTime = getRelativeTimeStr(item.created_at);

            return (
              <div
                key={item.contact_id}
                id={`ct-${item.contact_id}`}
                className={`bg-white rounded-3xl border transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md ${
                  isLit
                    ? 'border-[#EE0033] ring-4 ring-red-500/10 scale-[1.01]'
                    : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                {/* Card Header */}
                <div className="px-6 py-4 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    {/* Code Badge */}
                    <button
                      type="button"
                      onClick={() => handleCopyCode(item.contact_id)}
                      title="Bấm để sao chép mã yêu cầu"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 text-white font-mono text-xs font-bold hover:bg-slate-800 transition-colors group cursor-pointer"
                    >
                      <span>#{item.contact_id}</span>
                      {copiedId === item.contact_id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-400 group-hover:text-white transition-colors" />
                      )}
                    </button>

                    {/* Status Badge */}
                    {isDone ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Đã hoàn tất</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                        <span>Đang xử lý</span>
                      </span>
                    )}

                    {/* Source Tag */}
                    <span className="text-[11px] font-semibold text-slate-400">
                      • {item.source === 'user' ? 'Thành viên' : 'Khách vãng lai'}
                    </span>
                  </div>

                  {/* Top Right: Date & Soft Delete Action */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-bold text-slate-600">
                        {formatDateStr(item.created_at)}
                      </p>
                      {relativeTime && (
                        <p className="text-[10px] font-medium text-slate-400">
                          {relativeTime}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      title="Xóa lịch sử này khỏi danh sách"
                      className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Card Body - 2 Conversation Blocks */}
                <div className="p-6 space-y-4">
                  {/* Block 1: User Question */}
                  <div className="bg-slate-50 border border-slate-100 p-4 sm:p-5 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-extrabold">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-extrabold text-slate-900">
                          {item.full_name} ({item.phone})
                        </span>
                      </div>
                      <span className="inline-block px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 text-[11px] font-extrabold">
                        {item.topic}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-line pl-8">
                      {item.message}
                    </p>
                  </div>

                  {/* Block 2: CSKH Viettel Response */}
                  {isDone && item.admin_note?.trim() ? (
                    <div className="bg-gradient-to-r from-emerald-50/80 to-teal-50/50 border border-emerald-200/80 p-4 sm:p-5 rounded-2xl space-y-2 relative overflow-hidden">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-xl bg-[#EE0033] text-white flex items-center justify-center text-xs font-black shadow-sm">
                            V
                          </div>
                          <div>
                            <span className="text-xs font-black text-slate-900">
                              Phản hồi từ CSKH Viettel
                            </span>
                            <span className="ml-2 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              Chính thức
                            </span>
                          </div>
                        </div>
                        {item.handled_at && (
                          <span className="text-[11px] font-medium text-slate-400">
                            {formatDateStr(item.handled_at)}
                          </span>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed whitespace-pre-line pl-9">
                        {item.admin_note}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-amber-50/70 border border-amber-200/80 p-4 sm:p-5 rounded-2xl flex items-start gap-3">
                      <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Clock className="w-4 h-4 animate-spin" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-extrabold text-amber-900">
                          Đang chờ bộ phận CSKH phản hồi
                        </p>
                        <p className="text-xs font-medium text-amber-800/80 leading-relaxed">
                          Yêu cầu của bạn đã được chuyển tới nhân viên tiếp nhận. Tổng đài CSKH Viettel sẽ xử lý và đưa ra câu trả lời chi tiết sớm nhất (thông thường trong 24h).
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Single Item Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-100 animate-scale-up">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-[#EE0033]" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Ẩn lịch sử phản hồi</h3>
                <p className="text-xs text-slate-400 font-medium">Mã yêu cầu: #{deleteTarget.contact_id}</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
              Bạn có chắc chắn muốn ẩn yêu cầu hỗ trợ chủ đề <strong>"{deleteTarget.topic}"</strong> khỏi danh sách lịch sử cá nhân? 
              <br />
              <span className="text-[11px] text-slate-400 font-normal">
                (Dữ liệu hệ thống phía Admin Viettel vẫn được giữ nguyên để đối soát khi cần thiết).
              </span>
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="px-4 h-10 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmSoftDelete}
                className="px-5 h-10 rounded-xl bg-[#EE0033] hover:bg-[#d4002d] text-white text-xs font-extrabold uppercase tracking-wider transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang ẩn...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ẩn khỏi danh sách</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Items Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-100 animate-scale-up">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-[#EE0033]" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Xóa tất cả lịch sử</h3>
                <p className="text-xs text-slate-400 font-medium">Hành động này sẽ ẩn toàn bộ bản ghi hiện có</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
              Bạn có chắc muốn xóa tất cả <strong>{contacts.length} yêu cầu hỗ trợ</strong> khỏi danh sách hiển thị của bạn?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isDeletingAll}
                onClick={() => setShowDeleteAllModal(false)}
                className="px-4 h-10 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isDeletingAll}
                onClick={confirmSoftDeleteAll}
                className="px-5 h-10 rounded-xl bg-[#EE0033] hover:bg-[#d4002d] text-white text-xs font-extrabold uppercase tracking-wider transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
              >
                {isDeletingAll ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa tất cả</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
