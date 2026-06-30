import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { HelpCircle, Plus, Edit2, Trash2, X, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store';
import type { FAQ } from '../../types';

// Zod validation for FAQ CRUD
const faqFormSchema = z.object({
  question: z.string().min(5, { message: 'Câu hỏi phải dài từ 5 ký tự' }),
  answer: z.string().min(5, { message: 'Câu trả lời phải dài từ 5 ký tự' }),
  category: z.string().min(2, { message: 'Danh mục không được để trống' })
});

type FAQFormValues = z.infer<typeof faqFormSchema>;

export default function AdminFAQs() {
  const { faqs } = useAuthStore();
  const [faqsList, setFaqsList] = useState<FAQ[]>(faqs);
  
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [deleteConfirmFaq, setDeleteConfirmFaq] = useState<FAQ | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FAQFormValues>({
    resolver: zodResolver(faqFormSchema)
  });

  const openAddModal = () => {
    setEditingFaq(null);
    reset({
      question: '',
      answer: '',
      category: 'Hỗ trợ chung'
    });
    setShowModal(true);
  };

  const openEditModal = (faq: FAQ) => {
    setEditingFaq(faq);
    reset({
      question: faq.question,
      answer: faq.answer,
      category: faq.category
    });
    setShowModal(true);
  };

  const handleFormSubmit = (data: FAQFormValues) => {
    if (editingFaq) {
      // Edit in list
      setFaqsList(prev => prev.map(f => f.id === editingFaq.id ? { ...f, ...data } : f));
      showToast('success', 'Đã cập nhật câu hỏi FAQ thành công!');
    } else {
      // Add to list
      const newFaq: FAQ = {
        id: `faq_${Date.now()}`,
        question: data.question,
        answer: data.answer,
        category: data.category
      };
      setFaqsList(prev => [...prev, newFaq]);
      showToast('success', 'Đã thêm mới câu hỏi FAQ thành công!');
    }
    setShowModal(false);
  };

  const handleDeleteClick = (faq: FAQ) => {
    setDeleteConfirmFaq(faq);
  };

  const confirmDelete = () => {
    if (deleteConfirmFaq) {
      setFaqsList(prev => prev.filter(f => f.id !== deleteConfirmFaq.id));
      showToast('success', 'Đã xóa FAQ thành công.');
      setDeleteConfirmFaq(null);
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

      {/* Header view */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center">
            <HelpCircle className="w-6 h-6 text-primary mr-2" />
            Quản lý câu hỏi thường gặp (FAQ)
          </h1>
          <p className="text-slate-550 text-xs mt-0.5 font-semibold">CRUD danh mục câu hỏi hỗ trợ khách hàng đăng ký di động.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center space-x-1 bg-primary hover:bg-primary-hover text-white font-bold px-4 py-2.5 rounded-lg text-xs transition-colors focus:outline-none"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm FAQ mới</span>
        </button>
      </div>

      {/* FAQ Catalog Table */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <th className="p-4 w-1/4">Danh mục</th>
                <th className="p-4 w-1/3">Câu hỏi</th>
                <th className="p-4">Câu trả lời ngắn</th>
                <th className="p-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
              {faqsList.map((faq) => (
                <tr key={faq.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-bold text-slate-550">{faq.category}</td>
                  <td className="p-4 font-bold text-slate-900 leading-relaxed">{faq.question}</td>
                  <td className="p-4 text-slate-500 font-medium truncate max-w-xs">{faq.answer}</td>
                  <td className="p-4 flex items-center justify-center space-x-2">
                    <button
                      onClick={() => openEditModal(faq)}
                      className="p-2 hover:bg-slate-50 rounded-lg text-blue-650 hover:text-blue-800 transition-colors focus:outline-none"
                      title="Sửa"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(faq)}
                      className="p-2 hover:bg-red-50 rounded-lg text-primary hover:text-red-800 transition-colors focus:outline-none"
                      title="Xóa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit overlay Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 z-50 text-xs font-semibold">
          <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-md w-full shadow-md animate-scale-up space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h4 className="text-sm font-extrabold text-slate-900">
                {editingFaq ? 'Cập nhật FAQ' : 'Thêm mới câu hỏi thường gặp'}
              </h4>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-800 transition-colors focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
              {/* Category */}
              <div className="flex flex-col space-y-1.5">
                <label className="font-bold text-slate-500 uppercase tracking-wider">Phân loại danh mục</label>
                <select
                  {...register('category')}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-primary/50 focus:bg-white rounded-lg py-2 px-3 text-slate-700 focus:outline-none transition-colors"
                >
                  <option value="Đăng ký">Hỗ trợ Đăng ký</option>
                  <option value="Nạp tiền">Hỗ trợ Nạp tiền</option>
                  <option value="Hỗ trợ chung">Hỗ trợ Chung/Thủ tục</option>
                </select>
                {errors.category && <p className="text-[10px] text-red-500 mt-0.5">{errors.category.message}</p>}
              </div>

              {/* Question */}
              <div className="flex flex-col space-y-1.5">
                <label className="font-bold text-slate-500 uppercase tracking-wider">Nội dung Câu hỏi</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Cách nạp tiền như thế nào?..."
                  {...register('question')}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-primary/50 focus:bg-white rounded-lg py-2 px-3 text-slate-750 focus:outline-none transition-colors"
                />
                {errors.question && <p className="text-[10px] text-red-500 mt-0.5">{errors.question.message}</p>}
              </div>

              {/* Answer */}
              <div className="flex flex-col space-y-1.5">
                <label className="font-bold text-slate-500 uppercase tracking-wider">Nội dung Câu trả lời</label>
                <textarea
                  placeholder="Nhập câu trả lời cụ thể..."
                  rows={4}
                  {...register('answer')}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-primary/50 focus:bg-white rounded-lg py-2 px-3 text-slate-750 focus:outline-none resize-none transition-colors"
                />
                {errors.answer && <p className="text-[10px] text-red-500 mt-0.5">{errors.answer.message}</p>}
              </div>

              <div className="flex space-x-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors font-bold focus:outline-none"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg transition-colors focus:outline-none"
                >
                  {editingFaq ? 'Lưu chỉnh sửa' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmFaq && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-sm w-full shadow-md animate-scale-up z-50">
            <h4 className="text-base font-extrabold text-primary mb-2 flex items-center space-x-2">
              <AlertCircle className="w-5 h-5" />
              <span>Xóa câu hỏi FAQ</span>
            </h4>
            <p className="text-xs text-slate-650 mb-5 leading-relaxed font-semibold">
              Bạn có chắc chắn muốn xóa câu hỏi FAQ này ra khỏi bộ lọc hỗ trợ khách hàng? Hành động này không thể hoàn tác.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setDeleteConfirmFaq(null)}
                className="flex-1 py-2 bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs transition-colors font-bold focus:outline-none"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg text-xs transition-colors focus:outline-none"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
