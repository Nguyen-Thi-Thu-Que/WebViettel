import { Mail, Phone, User, Send, Clock, MapPin, Headphones, HelpCircle, Calendar, CheckCircle, Search } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store';
import { contactApi } from '../services/api';
import SEO from '../components/SEO';
import type { Contact as ContactType } from '../types';

export default function Contact() {
  const { currentUser } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');

  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [topic, setTopic] = useState('Tư vấn & Đăng ký gói cước');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // History / Lookup states
  const [historyContacts, setHistoryContacts] = useState<ContactType[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [lookupPhone, setLookupPhone] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync tab selection from query params
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'history') {
      setActiveTab('history');
    } else {
      setActiveTab('new');
    }
  }, [searchParams]);

  // Autofill if user is logged in
  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.name || '');
      setPhone(currentUser.phoneNumber || '');
    } else {
      setFullName('');
      setPhone('');
    }
  }, [currentUser]);

  // Handle textarea auto-resize
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${Math.min(Math.max(scrollHeight, 140), 380)}px`;
    }
  }, [message]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Họ và tên là bắt buộc.';
    }

    const phoneRegex = /^0[0-9]{9}$/;
    if (!phone.trim()) {
      newErrors.phone = 'Số điện thoại là bắt buộc.';
    } else if (!phoneRegex.test(phone.trim())) {
      newErrors.phone = 'Số điện thoại phải bao gồm 10 chữ số và bắt đầu bằng số 0.';
    }

    if (!message.trim()) {
      newErrors.message = 'Nội dung liên hệ là bắt buộc.';
    } else if (message.trim().length < 10) {
      newErrors.message = 'Nội dung liên hệ phải có ít nhất 10 ký tự.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const response = await contactApi.createContact({
        full_name: fullName.trim(),
        phone: phone.trim(),
        topic: topic,
        message: `[Chủ đề: ${topic}]\n${message.trim()}`
      });

      if (response.success) {
        showToast('success', 'Gửi yêu cầu hỗ trợ thành công! Đội ngũ CSKH Viettel sẽ liên hệ sớm nhất.');
        setMessage('');
        if (!currentUser) {
          setFullName('');
          setPhone('');
        }
      } else {
        showToast('error', response.message || 'Gửi yêu cầu hỗ trợ thất bại.');
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Có lỗi xảy ra khi kết nối máy chủ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch Member History
  const fetchMemberHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await contactApi.getMyRequests();
      setHistoryContacts(data || []);
    } catch (err) {
      console.error("Lỗi khi tải lịch sử liên hệ:", err);
      showToast('error', 'Không thể tải lịch sử liên hệ.');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history' && currentUser) {
      fetchMemberHistory();
    }
  }, [activeTab, currentUser]);

  // Guest lookup handler
  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = lookupPhone.trim();
    const phoneRegex = /^0[0-9]{9}$/;
    if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
      showToast('error', 'Vui lòng nhập số điện thoại hợp lệ (bao gồm 10 chữ số và bắt đầu bằng số 0) để tra cứu.');
      return;
    }

    setHistoryLoading(true);
    setHasSearched(true);
    try {
      const data = await contactApi.lookupContacts(cleanPhone);
      setHistoryContacts(data || []);
    } catch (err) {
      console.error("Lỗi khi tra cứu lịch sử liên hệ:", err);
      showToast('error', 'Tra cứu thất bại. Vui lòng thử lại sau.');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Auto-scroll and Highlight when card ID is passed in URL
  useEffect(() => {
    const contactIdParam = searchParams.get('id');
    if (contactIdParam && !historyLoading && historyContacts.length > 0) {
      const element = document.getElementById(`contact-card-${contactIdParam}`);
      if (element) {
        const timer1 = setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setHighlightedId(contactIdParam);
        }, 300);
        const timer2 = setTimeout(() => {
          setHighlightedId(null);
        }, 3300);
        return () => {
          clearTimeout(timer1);
          clearTimeout(timer2);
        };
      }
    }
  }, [searchParams, historyLoading, historyContacts]);

  const isRecentlyHandled = (handledAt?: string | null) => {
    if (!handledAt) return false;
    const handledTime = new Date(handledAt).getTime();
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return handledTime > oneDayAgo;
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

  const formatResponseDate = (dateInput?: any) => {
    if (!dateInput) return '—';
    try {
      const date = new Date(dateInput);
      const pad = (num: number) => String(num).padStart(2, '0');
      const hh = pad(date.getHours());
      const mm = pad(date.getMinutes());
      const dd = pad(date.getDate());
      const MM = pad(date.getMonth() + 1);
      const yyyy = date.getFullYear();
      return `${hh}:${mm} - ${dd}/${MM}/${yyyy}`;
    } catch (e) {
      return String(dateInput);
    }
  };

  const breadcrumbsSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Trang chủ",
        "item": typeof window !== 'undefined' ? window.location.origin : ''
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Liên hệ",
        "item": typeof window !== 'undefined' ? `${window.location.origin}/contact` : ''
      }
    ]
  };

  const handleTabChange = (tab: 'new' | 'history') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 px-4 relative animate-fade-in text-xs font-semibold">
      <SEO
        title="Liên Hệ Hỗ Trợ CSKH - Viettel Telecom"
        description="Gửi phản hồi, tư vấn gói cước di động và giải đáp thắc mắc dịch vụ tổng đài CSKH Viettel 24/7."
        schema={breadcrumbsSchema}
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border-l-4 text-xs font-bold bg-white text-slate-800 animate-slide-in ${
          toastMsg.type === 'success' ? 'border-emerald-500' : 'border-red-500'
        }`}>
          {toastMsg.text}
        </div>
      )}

      {/* Main Page Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 bg-red-50 border border-red-100 px-3 py-1.5 rounded-full text-[10px] font-bold text-primary mx-auto">
          <Headphones className="w-3.5 h-3.5 text-primary" />
          <span>TỔNG ĐÀI CHĂM SÓC KHÁCH HÀNG VIETTEL</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Trung Tâm Hỗ Trợ & Liên Hệ</h1>
        <p className="text-slate-500 text-xs max-w-lg mx-auto font-medium">
          Viettel Telecom luôn sẵn sàng phục vụ và giải đáp thắc mắc từ Quý khách hàng 24/7.
        </p>
      </div>

      {/* Tabs Selector Navigation */}
      <div className="flex border-b border-slate-200 max-w-lg mx-auto">
        <button
          onClick={() => handleTabChange('new')}
          className={`flex-1 py-3 text-center border-b-2 font-bold transition-all text-xs uppercase tracking-wider cursor-pointer focus:outline-none ${
            activeTab === 'new'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Gửi Yêu Cầu Mới
        </button>
        <button
          onClick={() => handleTabChange('history')}
          className={`flex-1 py-3 text-center border-b-2 font-bold transition-all text-xs uppercase tracking-wider cursor-pointer focus:outline-none ${
            activeTab === 'history'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Lịch Sử Yêu Cầu & Phản Hồi
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'new' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start animate-fade-in">
          {/* COLUMN 1: Form Gửi Phản Hồi */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 text-left">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                <Mail className="w-4 h-4 text-primary" />
                <span>Gửi Yêu Cầu Hỗ Trợ</span>
              </h2>
              <p className="text-slate-400 text-[11px] font-medium mt-1">
                Vui lòng nhập thông tin liên hệ và nội dung cần hỗ trợ.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name Input */}
              <div className="flex flex-col space-y-1.5">
                <label htmlFor="fullName" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-0.5">
                  Họ và tên <span className="text-primary">*</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nhập họ và tên của bạn..."
                    className={`w-full h-11 bg-slate-50 border ${
                      errors.fullName ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-primary/50'
                    } rounded-xl pl-11 pr-4 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white transition-all`}
                  />
                  <User className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                {errors.fullName && (
                  <p className="text-[11px] text-red-500 mt-0.5 font-medium pl-0.5">
                    {errors.fullName}
                  </p>
                )}
              </div>

              {/* Phone Number Input */}
              <div className="flex flex-col space-y-1.5">
                <label htmlFor="phone" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-0.5">
                  Số điện thoại liên hệ <span className="text-primary">*</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Nhập số điện thoại..."
                    className={`w-full h-11 bg-slate-50 border ${
                      errors.phone ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-primary/50'
                    } rounded-xl pl-11 pr-4 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white transition-all`}
                  />
                  <Phone className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                {errors.phone && (
                  <p className="text-[11px] text-red-500 mt-0.5 font-medium pl-0.5">
                    {errors.phone}
                  </p>
                )}
              </div>

              {/* Topic Dropdown */}
              <div className="flex flex-col space-y-1.5">
                <label htmlFor="topic" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-0.5">
                  Chủ đề hỗ trợ <span className="text-primary">*</span>
                </label>
                <div className="relative flex items-center">
                  <select
                    id="topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full h-11 bg-slate-50 border border-slate-200 focus:border-primary/50 rounded-xl pl-11 pr-4 text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white transition-all appearance-none cursor-pointer"
                  >
                    <option value="Tư vấn & Đăng ký gói cước">Tư vấn & Đăng ký gói cước</option>
                    <option value="Sự cố Nạp tiền & Số dư ví">Sự cố Nạp tiền & Số dư ví</option>
                    <option value="Quản lý tài khoản thuê bao">Quản lý tài khoản thuê bao</option>
                    <option value="Góp ý & Khiếu nại dịch vụ">Góp ý & Khiếu nại dịch vụ</option>
                    <option value="Khác">Khác</option>
                  </select>
                  <HelpCircle className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  <div className="absolute right-3.5 pointer-events-none text-slate-400 text-[10px]">▼</div>
                </div>
              </div>

              {/* Message Textarea */}
              <div className="flex flex-col space-y-1.5">
                <label htmlFor="message" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-0.5">
                  Nội dung chi tiết <span className="text-primary">*</span>
                </label>
                <textarea
                  id="message"
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Mô tả cụ thể yêu cầu của bạn..."
                  style={{ minHeight: '140px', maxHeight: '380px' }}
                  className={`w-full bg-slate-50 border ${
                    errors.message ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-primary/50'
                  } rounded-xl p-3.5 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white transition-all overflow-y-auto resize-none`}
                />
                {errors.message && (
                  <p className="text-[11px] text-red-500 mt-0.5 font-medium pl-0.5">
                    {errors.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 bg-primary hover:bg-[#D40032] hover:shadow-[0_4px_15px_rgba(238,0,51,0.2)] active:translate-y-0 transform transition-all duration-200 text-white font-bold rounded-xl text-xs uppercase tracking-wider disabled:opacity-50 focus:outline-none cursor-pointer flex items-center justify-center space-x-2 mt-2"
              >
                {isSubmitting ? (
                  <span className="flex items-center space-x-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Đang gửi yêu cầu...</span>
                  </span>
                ) : (
                  <>
                    <span>Gửi yêu cầu hỗ trợ</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* COLUMN 2: Thông Tin CSKH Viettel Trực Tiếp */}
          <div className="space-y-6 text-left">
            <div className="bg-slate-900 text-white border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden space-y-6">
              <div className="absolute -top-12 -right-12 w-40 h-40 bg-red-600/20 rounded-full blur-2xl pointer-events-none" />

              <div className="border-b border-slate-800 pb-4">
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">THÔNG TIN CHÍNH THỨC</span>
                <h2 className="text-lg font-extrabold text-white mt-1">Tổng Đài CSKH Viettel</h2>
                <p className="text-slate-400 text-xs mt-1 font-medium">
                  Kết nối trực tiếp với đội ngũ tư vấn viên Chăm sóc Khách hàng.
                </p>
              </div>

              <div className="space-y-5">
                <div className="flex items-start space-x-3.5">
                  <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 shrink-0 mt-0.5">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng đài CSKH 24/7</h3>
                    <p className="text-base font-extrabold text-white mt-0.5">
                      198 <span className="text-slate-400 font-medium text-xs">hoặc</span> 1800 8098
                    </p>
                    <p className="text-emerald-400 text-[11px] font-semibold mt-0.5">
                      ✓ Hỗ trợ 24/7 - Miễn phí cước gọi
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <div className="p-2.5 bg-slate-800 border border-slate-700/60 rounded-2xl text-slate-300 shrink-0 mt-0.5">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Email Tiếp Nhận Phản Hồi</h3>
                    <a
                      href="mailto:cskh@viettel.com.vn"
                      className="text-sm font-bold text-white hover:text-red-400 transition-colors mt-0.5 block"
                    >
                      cskh@viettel.com.vn
                    </a>
                    <p className="text-slate-400 text-[11px] font-medium mt-0.5">
                      Phản hồi trong vòng 24 giờ làm việc
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <div className="p-2.5 bg-slate-800 border border-slate-700/60 rounded-2xl text-slate-300 shrink-0 mt-0.5">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Thời Gian Làm Việc</h3>
                    <p className="text-xs font-bold text-white mt-0.5">
                      24/7 (Tất cả các ngày trong tuần, kể cả Lễ/Tết)
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5 pt-2 border-t border-slate-800">
                  <div className="p-2.5 bg-slate-800 border border-slate-700/60 rounded-2xl text-slate-300 shrink-0 mt-0.5">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Trụ Sở Chính</h3>
                    <p className="text-xs font-extrabold text-white mt-0.5">
                      Tòa nhà Viettel Cần Thơ, số 210, Trần Phú, Cái Khế, Ninh Kiều, Cần Thơ
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in max-w-3xl mx-auto py-6 px-4">
          {/* Lookup Input for Guest Users */}
          {!currentUser && (
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4 text-left">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                  <Search className="w-4 h-4 text-primary" />
                  <span>Tra cứu lịch sử liên hệ</span>
                </h2>
                <p className="text-slate-400 text-[11px] font-medium mt-1">
                  Nhập số điện thoại đã dùng để gửi yêu cầu hỗ trợ để kiểm tra tình trạng phản hồi.
                </p>
              </div>

              <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 flex items-center">
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={lookupPhone}
                    onChange={(e) => setLookupPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Nhập số điện thoại tra cứu (10 chữ số)..."
                    className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-primary/50 transition-all"
                  />
                  <Phone className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                <button
                  type="submit"
                  disabled={historyLoading}
                  className="h-11 px-6 bg-primary hover:bg-[#D40032] active:translate-y-0 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <Search className="w-4 h-4" />
                  <span>Tra cứu</span>
                </button>
              </form>
            </div>
          )}

          {/* History Results View */}
          {historyLoading ? (
            <div className="space-y-4 text-left">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-3 animate-pulse">
                  <div className="h-4 bg-slate-150 rounded w-1/3" />
                  <div className="h-3 bg-slate-150 rounded w-1/2" />
                  <div className="h-12 bg-slate-50 rounded" />
                </div>
              ))}
            </div>
          ) : !currentUser && !hasSearched ? (
            <div className="bg-slate-50/50 border border-slate-150 border-dashed rounded-3xl p-12 text-center text-slate-400 font-medium">
              Vui lòng nhập số điện thoại để tra cứu lịch sử yêu cầu của bạn.
            </div>
          ) : historyContacts.length === 0 ? (
            <div className="bg-slate-50/50 border border-slate-150 border-dashed rounded-3xl p-12 text-center text-slate-400 font-medium">
              {currentUser ? 'Bạn chưa gửi yêu cầu hỗ trợ nào.' : 'Không tìm thấy yêu cầu hỗ trợ nào cho số điện thoại này.'}
            </div>
          ) : (
            <div className="space-y-4 text-left">
              {historyContacts.map((item) => {
                const hasResponse = item.status === 'DONE' || (item.admin_note && item.admin_note.trim());
                const isHighlighted = highlightedId === item.contact_id;
                return (
                  <div
                    key={item.contact_id}
                    id={`contact-card-${item.contact_id}`}
                    className={`bg-white rounded-2xl border p-5 relative overflow-hidden transition-all duration-500 ${
                      isHighlighted
                        ? 'ring-2 ring-red-500 shadow-lg animate-pulse border-red-500 scale-[1.02]'
                        : 'border-slate-100 shadow-sm hover:shadow-md'
                    }`}
                  >
                    {/* Recently Handled Red Badge */}
                    {isRecentlyHandled(item.handled_at) && (
                      <span className="absolute top-0 right-0 bg-red-600 text-white font-extrabold text-[8px] uppercase tracking-wider px-2.5 py-0.5 rounded-bl-lg select-none z-10 animate-fade-in shadow-sm">
                        MỚI PHẢN HỒI
                      </span>
                    )}

                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex flex-col space-y-1">
                        <span className="font-mono text-slate-400 text-xs font-medium">Mã YC: #{item.contact_id}</span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {formatDate(item.created_at)}
                        </span>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border select-none ${
                        hasResponse
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                          : 'bg-amber-50 text-amber-700 border-amber-200/60'
                      }`}>
                        {hasResponse ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>Đã phản hồi</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-amber-600 shrink-0 animate-pulse" />
                            <span>Chưa phản hồi</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Question Content */}
                    <div className="mt-4 text-left space-y-2">
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Chủ đề hỗ trợ</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-50 border border-slate-200 text-slate-600">
                          {item.topic}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Chi tiết yêu cầu</span>
                        <p className="text-sm text-slate-700 leading-relaxed bg-slate-50/60 p-3 rounded-xl border border-slate-100/80 whitespace-pre-line">
                          {item.message}
                        </p>
                      </div>
                    </div>

                    {/* Admin Answer */}
                    {item.admin_note && item.admin_note.trim() ? (
                      <div className={`mt-3 p-4 rounded-xl bg-red-50/40 border-l-4 ${
                        item.status === 'DONE' ? 'border-emerald-500' : 'border-red-500'
                      } space-y-1.5 animate-fade-in`}>
                        <div className="font-bold text-sm text-slate-800 flex items-center gap-2">
                          <Headphones className="w-4 h-4 text-primary shrink-0" />
                          <span>CSKH Viettel Phản Hồi</span>
                        </div>
                        <p className="text-sm text-slate-700 mt-1.5 leading-relaxed">
                          {item.admin_note}
                        </p>
                        {item.handled_at && (
                          <div className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Đã phản hồi lúc: {formatResponseDate(item.handled_at)}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700 flex items-center gap-2 mt-2">
                        <Clock className="w-4 h-4 shrink-0 text-amber-600 animate-pulse" />
                        <span>Yêu cầu của bạn đang được chuyển đến bộ phận CSKH Viettel để xử lý. Vui lòng chờ phản hồi trực tiếp hoặc tại đây.</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
