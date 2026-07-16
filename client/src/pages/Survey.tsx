import { Sparkles, Compass, ArrowLeft, ArrowRight, RefreshCw, Check, Trash2 } from 'lucide-react';
import { useSurveyStore, useAuthStore } from '../store';
import PackageCard from '../components/PackageCard';
import RegisterModal from '../components/RegisterModal';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SEO from '../components/SEO';
import type { Package } from '../types';

export default function Survey() {
  const {
    questions,
    answers,
    currentStep,
    recommendedPackages,
    loading,
    hasHistory,
    isEarlyTerminated,
    setAnswer,
    setStep,
    resetSurvey,
    fetchConfig,
    submitAnswers,
    fetchHistory,
    deleteHistory
  } = useSurveyStore();

  const { currentUser } = useAuthStore();
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Khởi tạo và đồng bộ hóa trạng thái lịch sử khảo sát của user
  useEffect(() => {
    const initSurvey = async () => {
      // Luôn tải cấu hình câu hỏi từ database trước để đảm bảo có đầy đủ dữ liệu questions
      await fetchConfig();
      if (currentUser) {
        await fetchHistory();
      }
    };
    initSurvey();
  }, [currentUser, fetchHistory, fetchConfig]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleSubscribeOpen = (pkg: Package) => {
    if (!currentUser) {
      showToast('error', 'Vui lòng đăng nhập để đăng ký gói cước.');
      return;
    }
    setSelectedPkg(pkg);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setSelectedPkg(null);
    setIsModalOpen(false);
  };

  const handleNext = async () => {
    const nextStepIdx = currentStep + 1;
    const nextQuestion = questions[nextStepIdx];
    const isNextBlocked = nextQuestion && nextQuestion.options.every((opt: any) => opt.disabled);

    if (currentStep < questions.length - 1 && !isNextBlocked) {
      setStep(currentStep + 1);
    } else {
      await submitAnswers();
      setStep(questions.length); // Màn hình kết quả
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setStep(currentStep - 1);
    }
  };

  const handleRestart = async () => {
    resetSurvey();
    if (questions.length === 0) {
      await fetchConfig();
    }
    setStep(0);
  };

  const handleDeleteHistory = async () => {
    if (!currentUser) return;
    await deleteHistory();
    if (questions.length === 0) {
      await fetchConfig();
    }
    showToast('success', 'Đã xóa lịch sử khảo sát thành công.');
  };

  // Structured breadcrumbs schema for Survey Page
  const surveyBreadcrumbsSchema = {
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
        "name": "Khảo sát chọn gói",
        "item": typeof window !== 'undefined' ? `${window.location.origin}/survey` : ''
      }
    ]
  };

  if (loading && questions.length === 0) {
    return (
      <div className="max-w-3xl mx-auto py-24 text-center space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto" />
        <p className="text-slate-500 font-bold text-xs">Đang tải câu hỏi khảo sát từ hệ thống...</p>
      </div>
    );
  }

  const currentQuestion = questions[currentStep];

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16 relative animate-fade-in text-xs font-semibold">
      {/* SEO configuration */}
      <SEO
        title="Khảo Sát AI Chọn Gói Cước Viettel - Gợi Ý Gói Cước Tối Ưu"
        description="Trả lời nhanh khảo sát thói quen sử dụng điện thoại để nhận ngay đề xuất gói cước di động Viettel tiết kiệm chi phí nhất từ thuật toán AI."
        schema={surveyBreadcrumbsSchema}
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
          <Compass className="w-3.5 h-3.5 text-primary" />
          <span>HỆ THỐNG GỢI Ý GÓI CƯỚC THÔNG MINH VIETTEL AI</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Khảo sát chọn gói cước</h1>
        <p className="text-slate-500 text-xs max-w-md mx-auto font-medium">
          Khảo sát thói quen sử dụng và nhu cầu thực tế của bạn để tìm ra gói cước di động tối ưu nhất từ hệ thống Viettel AI.
        </p>
      </div>

      {/* Wizard Card Panel */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden">
        {/* Step Progress Indicators */}
        {currentStep < questions.length && currentQuestion && (
          <div className="flex items-center justify-between mb-8 border-b border-slate-50 pb-5">
            <div className="flex items-center space-x-3 text-left">
              <span className="w-7 h-7 rounded-xl bg-red-50 border border-red-100 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                {currentStep + 1}
              </span>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">{currentQuestion.title}</h3>
                <p className="text-[10px] text-slate-400 font-medium">{currentQuestion.description}</p>
              </div>
            </div>

            <div className="text-xs font-bold text-slate-400">
              Bước <span className="text-primary">{currentStep + 1}</span> / {questions.length}
            </div>
          </div>
        )}

        {/* Step Contents with AnimatePresence */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            {/* Render single-choice component dynamically */}
            {currentStep < questions.length && currentQuestion && currentQuestion.component === 'single-choice' && (
              <div className="space-y-4 py-2 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {currentQuestion.options.map((opt: any) => {
                    const isDisabled = !!opt.disabled;
                    return (
                      <div
                        key={opt.value}
                        onClick={() => {
                          if (!isDisabled) {
                            setAnswer(currentQuestion.field, opt.value);
                          }
                        }}
                        className={`p-4 rounded-xl border transition-all ${
                          isDisabled
                            ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400 pointer-events-none'
                            : (answers as any)[currentQuestion.field] === opt.value
                              ? 'bg-red-50/50 border-primary text-slate-900 shadow-sm cursor-pointer'
                              : 'bg-slate-50/60 border-slate-200 hover:border-slate-300 text-slate-700 cursor-pointer'
                        }`}
                      >
                        <p className="text-xs font-bold">{opt.label}</p>
                        {opt.detail && <p className="text-[10px] text-slate-400 mt-1 font-medium">{opt.detail}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Render multi-choice component dynamically */}
            {currentStep < questions.length && currentQuestion && currentQuestion.component === 'multi-choice' && (
              <div className="space-y-4 py-2 text-left">
                <p className="text-[10px] text-slate-400 mb-3 font-bold uppercase tracking-wider">Tick chọn các ứng dụng bạn muốn được miễn cước data 100%:</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {currentQuestion.options.map((opt: any) => {
                    const currentList = Array.isArray((answers as any)[currentQuestion.field]) ? (answers as any)[currentQuestion.field] : [];
                    const isChecked = currentList.includes(opt.value);
                    const isDisabled = !!opt.disabled;
                    const toggleOption = () => {
                      if (isDisabled) return;
                      if (isChecked) {
                        setAnswer(currentQuestion.field, currentList.filter((v: any) => v !== opt.value));
                      } else {
                        setAnswer(currentQuestion.field, [...currentList, opt.value]);
                      }
                    };
                    return (
                      <div
                        key={opt.value}
                        onClick={toggleOption}
                        className={`p-5 rounded-xl border transition-all ${
                          isDisabled
                            ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400 pointer-events-none'
                            : isChecked
                              ? 'bg-red-50/55 border-primary text-slate-900 shadow-sm cursor-pointer'
                              : 'bg-slate-50/60 border-slate-200 hover:border-slate-300 text-slate-700 cursor-pointer'
                        } flex flex-col items-center justify-center space-y-3.5 text-center`}
                      >
                        <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-colors ${
                          isDisabled
                            ? 'border-slate-200 bg-slate-100'
                            : isChecked
                              ? 'bg-primary border-primary text-white'
                              : 'border-slate-350 bg-white'
                        }`}>
                          {isChecked && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <span className="text-xs font-bold text-slate-800">{opt.label}</span>
                        {opt.detail && <span className="text-[10px] text-slate-400 font-medium leading-relaxed mt-1">{opt.detail}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Results Page */}
            {currentStep === questions.length && (
              <div className="space-y-8 py-2">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-650 mx-auto border border-amber-100">
                    <Sparkles className="w-6 h-6 fill-amber-600 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900">Gợi ý gói cước tối ưu dành cho bạn</h3>
                  {isEarlyTerminated ? (
                    <div className="bg-amber-50 border border-amber-100 text-amber-800 p-3.5 rounded-xl text-center text-[11px] font-bold max-w-md mx-auto">
                      ⚠️ Chúng tôi đã xác định được các gói cước phù hợp nhất với nhu cầu của bạn. Những câu hỏi còn lại không giúp phân loại thêm nên hệ thống hiển thị kết quả ngay.
                    </div>
                  ) : (
                    <div className="bg-red-50 border border-red-100 text-primary p-3.5 rounded-xl text-center text-[11px] font-bold max-w-md mx-auto">
                      ✨ Các gói cước dưới đây được lựa chọn và sắp xếp dựa trên câu trả lời khảo sát bằng công cụ gợi ý thông minh Viettel AI của bạn.
                    </div>
                  )}
                </div>

                {/* Suggested cards */}
                {recommendedPackages.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {recommendedPackages.map((pkg) => (
                      <PackageCard
                        key={pkg.id}
                        pkg={pkg}
                        onSubscribe={handleSubscribeOpen}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-slate-500 font-medium py-6">
                    Không tìm thấy gói cước nào phù hợp. Vui lòng thực hiện lại khảo sát với tiêu chí rộng hơn.
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-4">
                  <button
                    onClick={handleRestart}
                    className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-950 bg-white border border-slate-200 hover:bg-slate-50 px-5 py-2.5 rounded-xl transition-colors focus:outline-none cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Thực hiện lại khảo sát</span>
                  </button>

                  {hasHistory && currentUser && (
                    <button
                      onClick={handleDeleteHistory}
                      className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-5 py-2.5 rounded-xl transition-colors focus:outline-none cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Xóa kết quả khảo sát</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Wizard Footer Navigation Controls */}
        {currentStep < questions.length && (
          <div className="flex items-center justify-between mt-8 pt-5 border-t border-slate-100">
            <button
              disabled={currentStep === 0}
              onClick={handlePrev}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs text-slate-550 hover:text-slate-900 disabled:opacity-20 disabled:pointer-events-none transition-colors font-bold focus:outline-none cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Trước</span>
            </button>

            <button
              disabled={questions.length === 0}
              onClick={handleNext}
              className="inline-flex items-center space-x-1.5 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl text-xs transition-colors focus:outline-none cursor-pointer shadow-sm"
            >
              {(() => {
                const nextStepIdx = currentStep + 1;
                const nextQuestion = questions[nextStepIdx];
                const isNextBlocked = nextQuestion && nextQuestion.options.every((opt: any) => opt.disabled);
                return (
                  <span>{(currentStep === questions.length - 1 || isNextBlocked) ? 'Xem kết quả' : 'Tiếp theo'}</span>
                );
              })()}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Subscription Modal overlay */}
      {selectedPkg && (
        <RegisterModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          pkg={selectedPkg}
          onSuccess={(msg) => showToast('success', msg)}
          onError={(msg) => showToast('error', msg)}
        />
      )}
    </div>
  );
}
