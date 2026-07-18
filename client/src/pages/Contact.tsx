import { Mail, Phone, User, Send } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store';
import { contactApi } from '../services/api';
import SEO from '../components/SEO';

export default function Contact() {
  const { currentUser } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      // Clamp between 180px and 420px
      textarea.style.height = `${Math.min(Math.max(scrollHeight, 180), 420)}px`;
    }
  }, [message]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Họ và tên là bắt buộc.';
    }

    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phone.trim()) {
      newErrors.phone = 'Số điện thoại là bắt buộc.';
    } else if (!phoneRegex.test(phone.trim())) {
      newErrors.phone = 'Số điện thoại không hợp lệ (phải từ 10-11 chữ số).';
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
        message: message.trim()
      });

      if (response.success) {
        showToast('success', 'Gửi yêu cầu liên hệ thành công!');
        setMessage('');
        // Keep user info if logged in, otherwise reset
        if (!currentUser) {
          setFullName('');
          setPhone('');
        }
      } else {
        showToast('error', response.message || 'Gửi yêu cầu liên hệ thất bại.');
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Có lỗi xảy ra khi kết nối máy chủ.');
    } finally {
      setIsSubmitting(false);
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

  const placeholderText = `Ví dụ:\n• Tôi cần tư vấn gói cước.\n• Tôi không đăng ký được gói cước.\n• Tôi cần hỗ trợ tài khoản...`;

  return (
    <div className="max-w-xl mx-auto space-y-8 pb-16 px-4 relative animate-fade-in text-xs font-semibold">
      <SEO
        title="Liên Hệ Hỗ Trợ - Viettel AI"
        description="Gửi phản hồi, yêu cầu tư vấn gói cước hoặc yêu cầu hỗ trợ tài khoản cho đội ngũ Viettel AI."
        schema={breadcrumbsSchema}
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-lg shadow-lg border-l-4 text-xs font-semibold bg-white text-slate-800 ${toastMsg.type === 'success' ? 'border-emerald-500' : 'border-red-500'
          }`}>
          {toastMsg.text}
        </div>
      )}

      {/* Header Info */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 bg-red-50 border border-red-100 px-3 py-1.5 rounded-full text-[10px] font-bold text-primary mx-auto">
          <Mail className="w-3.5 h-3.5 text-primary" />
          <span>PHẢN HỒI Ý KIẾN KHÁCH HÀNG</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Liên hệ với chúng tôi</h1>
        <p className="text-slate-500 text-xs max-w-sm mx-auto font-medium">
          Chúng tôi luôn sẵn sàng lắng nghe mọi góp ý và giải đáp thắc mắc từ bạn.
        </p>
      </div>

      {/* Contact Form Card */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
        <form onSubmit={handleSubmit} className="space-y-6 text-left">
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
                className={`w-full h-11 bg-slate-50 border ${errors.fullName ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-primary/50'
                  } rounded-xl pl-11 pr-4 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white transition-all`}
              />
              <User className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            {errors.fullName && (
              <p className="text-[11px] text-red-500 mt-1 font-medium pl-0.5">
                {errors.fullName}
              </p>
            )}
          </div>

          {/* Phone Number Input */}
          <div className="flex flex-col space-y-1.5">
            <label htmlFor="phone" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-0.5">
              Số điện thoại <span className="text-primary">*</span>
            </label>
            <div className="relative flex items-center">
              <input
                id="phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Nhập số điện thoại..."
                className={`w-full h-11 bg-slate-50 border ${errors.phone ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-primary/50'
                  } rounded-xl pl-11 pr-4 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white transition-all`}
              />
              <Phone className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            {errors.phone && (
              <p className="text-[11px] text-red-500 mt-1 font-medium pl-0.5">
                {errors.phone}
              </p>
            )}
          </div>

          {/* Message Textarea */}
          <div className="flex flex-col space-y-1.5">
            <label htmlFor="message" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-0.5">
              Nội dung liên hệ <span className="text-primary">*</span>
            </label>
            <textarea
              id="message"
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={placeholderText}
              style={{ minHeight: '180px', maxHeight: '420px' }}
              className={`w-full bg-slate-50 border ${errors.message ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-primary/50'
                } rounded-xl p-4 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white transition-all overflow-y-auto resize-none`}
            />
            {errors.message && (
              <p className="text-[11px] text-red-500 mt-1 font-medium pl-0.5">
                {errors.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 bg-primary hover:bg-[#D40032] hover:shadow-[0_4px_15px_rgba(238,0,51,0.2)] hover:-translate-y-0.5 active:translate-y-0 transform transition-all duration-200 text-white font-bold rounded-xl text-[13px] uppercase tracking-wider disabled:opacity-50 focus:outline-none cursor-pointer flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <span className="flex items-center space-x-2">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Đang gửi...</span>
              </span>
            ) : (
              <>
                <span>Gửi liên hệ</span>
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
