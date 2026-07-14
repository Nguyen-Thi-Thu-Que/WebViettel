import { Sparkles, Compass, ArrowLeft, ArrowRight, RefreshCw, Check } from 'lucide-react';
import { useSurveyStore, usePackageStore, useAuthStore } from '../store';
import PackageCard from '../components/PackageCard';
import RegisterModal from '../components/RegisterModal';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SEO from '../components/SEO';
import type { Package } from '../types';

export default function Survey() {
  const { packages, fetchPackages } = usePackageStore();
  const {
    answers,
    currentStep,
    recommendedPackages,
    setAnswer,
    setStep,
    resetSurvey,
    calculateRecommendations
  } = useSurveyStore();

  const { currentUser } = useAuthStore();
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (packages.length === 0) {
      fetchPackages();
    }
  }, [packages.length, fetchPackages]);

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

  const steps = [
    { title: 'Ngân sách cước phí', desc: 'Mức chi phí tối đa bạn muốn bỏ ra hàng tháng' },
    { title: 'Dung lượng Data', desc: 'Nhu cầu truy cập Internet, lướt web hàng ngày của bạn' },
    { title: 'Gọi thoại miễn phí', desc: 'Nhu cầu đàm thoại, gọi điện nội/ngoại mạng của bạn' },
    { title: 'Mạng xã hội giải trí', desc: 'Các ứng dụng mạng xã hội bạn dùng thường xuyên nhất' }
  ];

  const handleNext = () => {
    if (currentStep < 3) {
      setStep(currentStep + 1);
    } else {
      calculateRecommendations(packages);
      setStep(4); // Display results step
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setStep(currentStep - 1);
    }
  };

  const handleRestart = () => {
    resetSurvey();
  };

  const toggleSocialApp = (app: string) => {
    const currentList = answers.socialApps;
    if (currentList.includes(app)) {
      setAnswer('socialApps', currentList.filter(a => a !== app));
    } else {
      setAnswer('socialApps', [...currentList, app]);
    }
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

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16 relative animate-fade-in text-xs font-semibold">
      {/* SEO configuration */}
      <SEO
        title="Khảo Sát AI Chọn Gói Cước Viettel - Gợi Ý Gói Cước Tối Ưu"
        description="Trả lời nhanh 4 câu hỏi khảo sát thói quen sử dụng điện thoại để nhận ngay đề xuất 3 gói cước di động Viettel tiết kiệm chi phí nhất từ thuật toán AI."
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
        <div className="inline-flex items-center space-x-2 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-full text-[10px] font-bold text-amber-700 mx-auto">
          <Compass className="w-3.5 h-3.5 text-amber-600" />
          <span>HỆ THỐNG GỢI Ý GÓI CƯỚC THỬ NGHIỆM (DEMO SPRINT 8.1)</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Khảo sát chọn gói cước</h1>
        <p className="text-slate-500 text-xs max-w-md mx-auto font-medium">
          Khảo sát thói quen sử dụng. Kết quả hiển thị dưới đây là gợi ý giả định (thuật toán mẫu) phục vụ thử nghiệm giao diện.
        </p>
      </div>

      {/* Wizard Card Panel */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden">
        {/* Step Progress Indicators */}
        {currentStep < 4 && (
          <div className="flex items-center justify-between mb-8 border-b border-slate-50 pb-5">
            <div className="flex items-center space-x-3 text-left">
              <span className="w-7 h-7 rounded-xl bg-red-50 border border-red-100 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                {currentStep + 1}
              </span>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">{steps[currentStep].title}</h3>
                <p className="text-[10px] text-slate-400 font-medium">{steps[currentStep].desc}</p>
              </div>
            </div>

            <div className="text-xs font-bold text-slate-400">
              Bước <span className="text-primary">{currentStep + 1}</span> / 4
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
            {currentStep === 0 && (
              <div className="space-y-4 py-2 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { id: 'under_50', label: 'Dưới 50.000đ / tháng', detail: 'Nhu cầu nghe gọi hoặc data cơ bản' },
                    { id: '50_100', label: 'Từ 50.000đ - 100.000đ / tháng', detail: 'Tiết kiệm, có lướt web & mạng xã hội' },
                    { id: '100_200', label: 'Từ 100.000đ - 200.000đ / tháng', detail: 'Combo thoại thoải mái và dung lượng lớn' },
                    { id: 'above_200', label: 'Trên 200.000đ / tháng', detail: 'Nhu cầu đàm thoại VIP và không giới hạn' },
                    { id: 'any', label: 'Mức ngân sách nào cũng được', detail: 'Đặt hiệu năng và dung lượng lên hàng đầu' }
                  ].map(opt => (
                    <div
                      key={opt.id}
                      onClick={() => setAnswer('budget', opt.id as typeof answers.budget)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${answers.budget === opt.id
                          ? 'bg-red-50/50 border-primary text-slate-900 shadow-sm'
                          : 'bg-slate-50/60 border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                    >
                      <p className="text-xs font-bold">{opt.label}</p>
                      <p className="text-[10px] text-slate-400 mt-1 font-medium">{opt.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-4 py-2 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { id: 'none', label: 'Không dùng Data di động', detail: 'Chỉ dùng Wi-Fi ở nhà hoặc nơi làm việc' },
                    { id: 'low', label: 'Dùng ít (Dưới 1 GB/ngày)', detail: 'Chỉ đọc tin nhắn, tin tức cơ bản khi ra ngoài' },
                    { id: 'medium', label: 'Trung bình (1 - 3 GB/ngày)', detail: 'Lướt web, nghe nhạc, mạng xã hội liên tục' },
                    { id: 'high', label: 'Nhiều (Từ 3 - 5 GB/ngày)', detail: 'Xem video HD, livestream, làm việc di động nhiều' },
                    { id: 'unlimited', label: 'Không giới hạn dung lượng', detail: 'Tốc độ cao nhất để chơi game, download lớn' }
                  ].map(opt => (
                    <div
                      key={opt.id}
                      onClick={() => setAnswer('dataDemand', opt.id as typeof answers.dataDemand)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${answers.dataDemand === opt.id
                          ? 'bg-red-50/50 border-primary text-slate-900 shadow-sm'
                          : 'bg-slate-50/60 border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                    >
                      <p className="text-xs font-bold">{opt.label}</p>
                      <p className="text-[10px] text-slate-400 mt-1 font-medium">{opt.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4 py-2 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { id: 'none', label: 'Không gọi nhiều', detail: 'Chủ yếu liên lạc online qua MXH' },
                    { id: 'low', label: 'Gọi ít (Dưới 500 phút)', detail: 'Liên hệ ngắn công việc hoặc gia đình' },
                    { id: 'high', label: 'Gọi nhiều (Trên 1000 phút)', detail: 'Tần suất gọi cao, bán hàng, CSKH' }
                  ].map(opt => (
                    <div
                      key={opt.id}
                      onClick={() => setAnswer('voiceDemand', opt.id as typeof answers.voiceDemand)}
                      className={`p-5 rounded-xl border transition-all cursor-pointer text-center flex flex-col justify-between h-32 ${answers.voiceDemand === opt.id
                          ? 'bg-red-50/50 border-primary text-slate-900 shadow-sm'
                          : 'bg-slate-50/60 border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                    >
                      <p className="text-xs font-bold">{opt.label}</p>
                      <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-2">{opt.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4 py-2 text-left">
                <p className="text-[10px] text-slate-400 mb-3 font-bold uppercase tracking-wider">Tick chọn các ứng dụng bạn muốn được miễn cước data 100%:</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {['TikTok', 'YouTube', 'Facebook'].map(app => {
                    const isChecked = answers.socialApps.includes(app);
                    return (
                      <div
                        key={app}
                        onClick={() => toggleSocialApp(app)}
                        className={`p-5 rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-center space-y-3.5 text-center ${isChecked
                            ? 'bg-red-50/55 border-primary text-slate-900 shadow-sm'
                            : 'bg-slate-50/60 border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                      >
                        <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-colors ${isChecked ? 'bg-primary border-primary text-white' : 'border-slate-350 bg-white'
                          }`}>
                          {isChecked && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <span className="text-xs font-bold text-slate-800">{app}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Results Page */}
            {currentStep === 4 && (
              <div className="space-y-8 py-2">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-650 mx-auto border border-amber-100">
                    <Sparkles className="w-6 h-6 fill-amber-600 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900">Đề xuất gợi ý giả định (Mẫu)</h3>
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3.5 rounded-xl text-center text-[11px] font-semibold max-w-md mx-auto">
                    ⚠️ Đây là dữ liệu gợi ý mẫu (giả định) cho mục đích thử nghiệm giao diện ở Sprint 8.1. Thuật toán AI thực tế kết nối với dữ liệu thật sẽ được triển khai ở Sprint sau.
                  </div>
                </div>

                {/* Suggested cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {recommendedPackages.map((pkg) => (
                    <PackageCard
                      key={pkg.id}
                      pkg={pkg}
                      onSubscribe={handleSubscribeOpen}
                    />
                  ))}
                </div>

                <div className="flex justify-center pt-4">
                  <button
                    onClick={handleRestart}
                    className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-950 bg-white border border-slate-200 hover:bg-slate-50 px-5 py-2.5 rounded-xl transition-colors focus:outline-none"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Thực hiện lại khảo sát</span>
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Wizard Footer Navigation Controls */}
        {currentStep < 4 && (
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
              onClick={handleNext}
              className="inline-flex items-center space-x-1.5 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl text-xs transition-colors focus:outline-none cursor-pointer shadow-sm"
            >
              <span>{currentStep === 3 ? 'Xem kết quả' : 'Tiếp theo'}</span>
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
