import { useState, useEffect } from 'react';
import { Bot, Save, Plus, Trash2, Edit2, X, Loader2 } from 'lucide-react';
import { useChatbotStore, usePackageStore } from '../../store';
import type { ChatbotConfig } from '../../types';

export default function AdminChatbot() {
  const { config, fetchConfig, updateConfig } = useChatbotStore();
  const { packages, fetchPackages } = usePackageStore();

  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Local config states
  const [systemPrompt, setSystemPrompt] = useState('');
  const [keywordsList, setKeywordsList] = useState<ChatbotConfig['trainingKeywords']>([]);

  // Modal states for keyword CRUD
  const [showModal, setShowModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [kwVal, setKwVal] = useState('');
  const [respVal, setRespVal] = useState('');
  const [pkgVal, setPkgVal] = useState('');

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await fetchConfig();
      await fetchPackages({ limit: 100 });
      setLoading(false);
    };
    initializeData();
  }, [fetchConfig, fetchPackages]);

  // Sync config from store to local states
  useEffect(() => {
    if (config) {
      setSystemPrompt(config.systemPrompt);
      setKeywordsList(config.trainingKeywords || []);
    }
  }, [config]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleOpenAddModal = () => {
    setEditingIndex(null);
    setKwVal('');
    setRespVal('');
    setPkgVal('');
    setShowModal(true);
  };

  const handleOpenEditModal = (idx: number) => {
    const item = keywordsList[idx];
    setEditingIndex(idx);
    setKwVal(item.keyword);
    setRespVal(item.response);
    setPkgVal(item.suggestedPackageId || '');
    setShowModal(true);
  };

  const handleKeywordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kwVal.trim() || !respVal.trim()) {
      showToast('error', 'Vui lòng điền từ khóa huấn luyện và câu trả lời.');
      return;
    }

    const newItem = {
      keyword: kwVal.trim(),
      response: respVal.trim(),
      suggestedPackageId: pkgVal || undefined
    };

    if (editingIndex !== null) {
      setKeywordsList(prev => prev.map((item, idx) => idx === editingIndex ? newItem : item));
    } else {
      setKeywordsList(prev => [...prev, newItem]);
    }
    setShowModal(false);
  };

  const handleKeywordDelete = (idx: number) => {
    setKeywordsList(prev => prev.filter((_, i) => i !== idx));
    showToast('success', 'Đã xóa từ khóa huấn luyện.');
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    const newConfig: ChatbotConfig = {
      systemPrompt: systemPrompt.trim(),
      trainingKeywords: keywordsList
    };
    const success = await updateConfig(newConfig);
    setIsSaving(false);
    if (success) {
      showToast('success', 'Đã lưu và cập nhật cấu hình Huấn luyện AI Chatbot thành công!');
    } else {
      showToast('error', 'Lưu cấu hình thất bại.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-xs font-semibold text-slate-500 space-y-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span>Đang tải thông tin cấu hình AI Chatbot...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative animate-fade-in text-xs font-semibold">
      {/* Toast Notification */}
      {toastMsg && (
        <div className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-lg shadow-lg border-l-4 text-xs font-semibold bg-white text-slate-800 ${
          toastMsg.type === 'success' ? 'border-emerald-500' : 'border-red-500'
        }`}>
          {toastMsg.text}
        </div>
      )}

      {/* Header View */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center">
            <Bot className="w-6 h-6 text-primary mr-2" />
            Cấu hình trợ lý ảo AI Chatbot
          </h1>
          <p className="text-slate-555 text-xs mt-0.5 font-semibold">Huấn luyện từ khóa đối khớp và prompts hành vi hệ thống cho Trợ lý ảo Viettel.</p>
        </div>
        <button
          disabled={isSaving}
          onClick={handleSaveConfig}
          className="flex items-center space-x-1.5 bg-primary hover:bg-primary-hover text-white font-bold px-4 py-2.5 rounded-lg text-xs transition-colors focus:outline-none cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Đang lưu...' : 'Lưu cấu hình'}</span>
        </button>
      </div>

      {/* Prompts config panel */}
      <section className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900">System Behavior Prompt (Chỉ dẫn hệ thống)</h3>
        <p className="text-[10px] text-slate-500 font-semibold">Đặt định hướng phong cách giao tiếp cho AI Chatbot ở Client.</p>
        <textarea
          rows={3}
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-700 focus:outline-none focus:border-primary/50 focus:bg-white resize-none font-semibold leading-relaxed transition-colors"
        />
      </section>

      {/* NLP Keywords config panel */}
      <section className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Dữ liệu huấn luyện từ khóa NLP (Rule-based)</h3>
            <p className="text-[10px] text-slate-500 font-semibold">Đối chiếu từ khóa người dùng nhập và sinh câu trả lời tự động kèm theo gói cước liên kết.</p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center space-x-1 bg-white border border-slate-250 hover:bg-slate-50 text-slate-605 hover:text-slate-950 px-3.5 py-2 rounded-lg text-xs transition-colors font-bold focus:outline-none cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm từ khóa</span>
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <th className="p-3 w-1/4">Từ khóa bắt được</th>
                <th className="p-3">Câu trả lời phản hồi của Chatbot</th>
                <th className="p-3 w-1/5">Gói cước liên kết</th>
                <th className="p-3 text-center w-28">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
              {keywordsList.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-3 font-bold text-primary font-mono">"{item.keyword}"</td>
                  <td className="p-3 leading-relaxed whitespace-pre-line text-slate-800 font-medium">{item.response}</td>
                  <td className="p-3 text-slate-800 font-bold">
                    {item.suggestedPackageId ? (
                      <span className="text-slate-600 font-mono bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded">
                        {item.suggestedPackageId === 'survey' ? 'Wizard Khảo sát' : item.suggestedPackageId.toUpperCase()}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium">Không có</span>
                    )}
                  </td>
                  <td className="p-3 flex items-center justify-center space-x-2">
                    <button
                      onClick={() => handleOpenEditModal(idx)}
                      className="p-2 hover:bg-slate-50 rounded-lg text-blue-650 hover:text-blue-800 transition-colors focus:outline-none cursor-pointer"
                      title="Sửa"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleKeywordDelete(idx)}
                      className="p-2 hover:bg-red-50 rounded-lg text-primary hover:text-red-800 transition-colors focus:outline-none cursor-pointer"
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
      </section>

      {/* Add/Edit overlay Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-sm w-full shadow-md animate-scale-up space-y-5 z-50">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h4 className="text-sm font-extrabold text-slate-900">
                {editingIndex !== null ? 'Cập nhật từ khóa AI' : 'Thêm mới từ khóa đối sánh'}
              </h4>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-800 transition-colors focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleKeywordSubmit} className="space-y-4">
              {/* Keyword */}
              <div className="flex flex-col space-y-1.5">
                <label className="font-bold text-slate-500 uppercase tracking-wider">Từ khóa kích hoạt</label>
                <input
                  type="text"
                  placeholder="Ví dụ: thoại, data, rẻ..."
                  value={kwVal}
                  onChange={(e) => setKwVal(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-primary/50 focus:bg-white rounded-lg py-2 px-3 text-slate-700 focus:outline-none transition-colors"
                />
              </div>

              {/* Response */}
              <div className="flex flex-col space-y-1.5">
                <label className="font-bold text-slate-500 uppercase tracking-wider">Nội dung phản hồi</label>
                <textarea
                  placeholder="Ví dụ: Bạn nên chọn gói SD135..."
                  rows={3}
                  value={respVal}
                  onChange={(e) => setRespVal(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-primary/50 focus:bg-white rounded-lg py-2 px-3 text-slate-700 focus:outline-none resize-none transition-colors"
                />
              </div>

              {/* Suggested package link */}
              <div className="flex flex-col space-y-1.5">
                <label className="font-bold text-slate-500 uppercase tracking-wider">Gói cước gợi ý đi kèm</label>
                <select
                  value={pkgVal}
                  onChange={(e) => setPkgVal(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-primary/50 focus:bg-white rounded-lg py-2 px-3 text-slate-700 focus:outline-none transition-colors"
                >
                  <option value="">Không có gợi ý</option>
                  <option value="survey">Wizard Khảo sát</option>
                  {packages.map(p => (
                    <option key={p.id} value={p.id}>
                      Gói {p.ten}
                    </option>
                  ))}
                </select>
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
                  className="flex-1 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg transition-colors focus:outline-none cursor-pointer"
                >
                  {editingIndex !== null ? 'Lưu chỉnh sửa' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
