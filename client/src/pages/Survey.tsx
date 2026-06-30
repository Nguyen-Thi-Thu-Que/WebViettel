import { Sparkles, Compass, ArrowLeft, ArrowRight, RefreshCw, Check } from 'lucide-react';
import { useSurveyStore, usePackageStore } from '../store';
import PackageCard from '../components/PackageCard';
import { useState } from 'react';

export default function Survey() {
  const { packages } = usePackageStore();
  const {
    answers,
    currentStep,
    recommendedPackages,
    setAnswer,
    setStep,
    resetSurvey,
    calculateRecommendations
  } = useSurveyStore();

  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 3000);
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

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16 relative animate-fade-in text-xs font-semibold">
      {/* Toast Notification */}
      {toastMsg && (
        <div className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-lg shadow-lg border-l-4 text-xs font-semibold bg-white text-slate-800 ${
          toastMsg.type === 'success' ? 'border-emerald-500' : 'border-red-500'
        }`}>
          {toastMsg.text}
        </div>
      )}

      {/* Header Info */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 bg-emerald-55 border border-emerald-100 px-3 py-1 rounded text-[11px] font-bold text-emerald-700 mx-auto">
          <Compass className="w-3.5 h-3.5 text-emerald-600" />
          <span>Tìm gói cước phù hợp bằng thuật toán AI</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">Khảo sát chọn gói cước</h1>
        <p className="text-slate-500 text-xs max-w-md mx-auto font-semibold">
          Điền ngắn gọn 4 câu hỏi khảo sát thói quen sử dụng, hệ thống AI sẽ chọn ra 3 gói cước tối ưu chi phí nhất.
        </p>
      </div>

      {/* Wizard Card Panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm relative">
        {/* Step Progress Indicators */}
        {currentStep < 4 && (
          <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-5">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded bg-red-50 border border-red-100 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                {currentStep + 1}
              </span>
              <div>
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">{steps[currentStep].title}</h3>
                <p className="text-[10px] text-slate-500 font-medium">{steps[currentStep].desc}</p>
              </div>
            </div>
            
            <div className="text-xs font-bold text-slate-500">
              Bước <span className="text-primary">{currentStep + 1}</span> / 4
            </div>
          </div>
        )}

        {/* Step Contents */}
        {currentStep === 0 && (
          <div className="space-y-4 py-2">
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
                  className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                    answers.budget === opt.id
                      ? 'bg-red-50 border-primary text-slate-900'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <p className="text-xs font-bold">{opt.label}</p>
                  <p className="text-[10px] text-slate-500 mt-1 font-medium">{opt.detail}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { id: 'none', label: 'Không dùng Data di động', detail: 'Chỉ dùng Wi-Fi ở nhà/công ty' },
                { id: 'low', label: 'Dùng ít (Dưới 1 GB/ngày)', detail: 'Chỉ đọc tin nhắn, tin tức khi ra ngoài' },
                { id: 'medium', label: 'Trung bình (1 - 3 GB/ngày)', detail: 'Lướt web, nghe nhạc, gửi nhận mail liên tục' },
                { id: 'high', label: 'Nhiều (Từ 3 - 5 GB/ngày)', detail: 'Xem video HD, làm việc từ xa thường xuyên' },
                { id: 'unlimited', label: 'Không giới hạn dung lượng', detail: 'Tốc độ cao nhất để livestream, chơi game' }
              ].map(opt => (
                <div
                  key={opt.id}
                  onClick={() => setAnswer('dataDemand', opt.id as typeof answers.dataDemand)}
                  className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                    answers.dataDemand === opt.id
                      ? 'bg-red-50 border-primary text-slate-900'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <p className="text-xs font-bold">{opt.label}</p>
                  <p className="text-[10px] text-slate-500 mt-1 font-medium">{opt.detail}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { id: 'none', label: 'Không gọi nhiều', detail: 'Chủ yếu đàm thoại qua Zalo/Messenger' },
                { id: 'low', label: 'Gọi ít (Dưới 500 phút)', detail: 'Gọi điện ngắn liên hệ công việc, người thân' },
                { id: 'high', label: 'Gọi nhiều (Trên 1000 phút)', detail: 'Đàm thoại liên tục, CSKH, bán hàng' }
              ].map(opt => (
                <div
                  key={opt.id}
                  onClick={() => setAnswer('voiceDemand', opt.id as typeof answers.voiceDemand)}
                  className={`p-4 rounded-lg border transition-colors cursor-pointer text-center ${
                    answers.voiceDemand === opt.id
                      ? 'bg-red-50 border-primary text-slate-900'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <p className="text-xs font-bold mb-1">{opt.label}</p>
                  <p className="text-[10px] text-slate-500 font-medium">{opt.detail}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4 py-2">
            <p className="text-[11px] text-slate-500 mb-2 font-bold">Tick chọn các ứng dụng bạn muốn được miễn cước data 100%:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {['TikTok', 'YouTube', 'Facebook'].map(app => {
                const isChecked = answers.socialApps.includes(app);
                return (
                  <div
                    key={app}
                    onClick={() => toggleSocialApp(app)}
                    className={`p-5 rounded-lg border transition-colors cursor-pointer flex flex-col items-center justify-center space-y-2 text-center ${
                      isChecked
                        ? 'bg-red-50 border-primary text-slate-900'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                      isChecked ? 'bg-primary border-primary text-white' : 'border-slate-300 bg-white'
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
              <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 mx-auto border border-emerald-150">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Đã tìm thấy các gói cước tối ưu!</h3>
              <p className="text-slate-500 text-xs font-semibold">
                Dựa trên thói quen sử dụng đã khai báo, thuật toán AI gợi ý các gói cước Viettel sau:
              </p>
            </div>

            {/* Suggested cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recommendedPackages.map((pkg) => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  onSubscribeSuccess={(msg) => showToast('success', msg)}
                  onSubscribeError={(msg) => showToast('error', msg)}
                />
              ))}
            </div>

            <div className="flex justify-center pt-4">
              <button
                onClick={handleRestart}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 px-5 py-2.5 rounded-lg transition-colors focus:outline-none"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Thực hiện lại khảo sát</span>
              </button>
            </div>
          </div>
        )}

        {/* Wizard Footer Navigation Controls */}
        {currentStep < 4 && (
          <div className="flex items-center justify-between mt-8 pt-5 border-t border-slate-100">
            <button
              disabled={currentStep === 0}
              onClick={handlePrev}
              className="inline-flex items-center space-x-1 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-55 rounded-lg text-xs text-slate-600 hover:text-slate-900 disabled:opacity-20 disabled:pointer-events-none transition-colors font-bold focus:outline-none"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Trước</span>
            </button>

            <button
              onClick={handleNext}
              className="inline-flex items-center space-x-1 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg text-xs transition-colors focus:outline-none"
            >
              <span>{currentStep === 3 ? 'Xem kết quả' : 'Tiếp theo'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
