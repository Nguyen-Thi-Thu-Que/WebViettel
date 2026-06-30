import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightLeft, X, Bot, Plus, Check, ShieldAlert, Star } from 'lucide-react';
import { usePackageStore, useAuthStore } from '../store';
import type { Package } from '../types';

export default function Compare() {
  const { compareList, packages, removeFromCompare, addToCompare, clearCompare } = usePackageStore();
  const { currentUser, subscribePackage } = useAuthStore();

  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showAddSelector, setShowAddSelector] = useState(false);
  const [selectedPkgIdToAdd, setSelectedPkgIdToAdd] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmSubscribePkg, setConfirmSubscribePkg] = useState<Package | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleAddPackageDirectly = () => {
    if (!selectedPkgIdToAdd) return;
    const targetPkg = packages.find(p => p.id === selectedPkgIdToAdd);
    if (targetPkg) {
      const res = addToCompare(targetPkg);
      if (res.success) {
        showToast('success', res.message);
        setSelectedPkgIdToAdd('');
        setShowAddSelector(false);
      } else {
        showToast('error', res.message);
      }
    }
  };

  const handleSubscribeClick = (pkg: Package) => {
    if (!currentUser) {
      showToast('error', 'Vui lòng đăng nhập trước khi đăng ký gói cước.');
      return;
    }
    setConfirmSubscribePkg(pkg);
  };

  const handleConfirmSubscribe = () => {
    if (!confirmSubscribePkg) return;
    setIsSubmitting(true);
    setTimeout(() => {
      const res = subscribePackage(confirmSubscribePkg);
      setIsSubmitting(false);
      setConfirmSubscribePkg(null);
      if (res.success) {
        showToast('success', res.message);
      } else {
        showToast('error', res.message);
      }
    }, 800);
  };

  // Generate dynamic "AI Comments" based on selected packages features
  const generateAIAnalysis = (list: Package[]): string => {
    if (list.length === 0) return '';
    if (list.length === 1) {
      return `Bạn đang xem xét gói **${list[0].name}**. Đây là gói cước ${
        list[0].category === 'social' ? 'chuyên dùng cho mạng xã hội (YouTube/TikTok)' : 
        list[0].category === 'combo' ? 'combo nghe gọi kèm data tiện lợi' : 'chuyên dụng data tốc độ cao'
      } với chi phí ${list[0].price.toLocaleString()}đ/chu kỳ. Gói này có lượt đăng ký rất cao (${list[0].registrationsCount.toLocaleString()} lượt).`;
    }

    let report = 'Dựa trên phân tích các gói cước đã chọn, **Viettel AI** xin đưa ra nhận xét:\n\n';

    // Find cheapest
    const sortedByPrice = [...list].sort((a, b) => a.price - b.price);
    const cheapest = sortedByPrice[0];
    report += `• **Tiết kiệm nhất**: Gói **${cheapest.name}** có chi phí thấp nhất là **${cheapest.price.toLocaleString()}đ**, thích hợp nếu bạn muốn duy trì liên lạc với ngân sách tối giản.\n`;

    // Find package with max data
    const sortedByData = [...list].sort((a, b) => {
      const limitA = a.dataPerDayGb || 0;
      const limitB = b.dataPerDayGb || 0;
      return limitB - limitA;
    });
    const maxData = sortedByData[0];
    if (maxData.dataPerDayGb && maxData.dataPerDayGb > 0 && maxData.id !== cheapest.id) {
      report += `• **Dung lượng khủng nhất**: Gói **${maxData.name}** cung cấp lượng data vượt trội **${maxData.dataLimit}** hỗ trợ lướt web cực nhanh, phù hợp cho nhu cầu làm việc di động nhiều.\n`;
    }

    // Check for social apps
    const socialPackages = list.filter(p => p.socialFreeApps.length > 0);
    if (socialPackages.length > 0) {
      report += `• **Ưu đãi Giải trí**: Gói **${socialPackages.map(p => p.name).join(', ')}** là lựa chọn số 1 nếu bạn nghiện TikTok hoặc YouTube vì được miễn cước data cho các ứng dụng này.\n`;
    }

    // Check for voice apps
    const voicePackages = list.filter(p => p.voiceFreeInternalMin > 0);
    if (voicePackages.length > 0) {
      report += `• **Nghe gọi thoải mái**: Gói **${voicePackages.map(p => p.name).join(', ')}** tối ưu nhất cho người làm kinh doanh hoặc đàm thoại liên tục nhờ có ưu đãi phút gọi nội/ngoại mạng miễn phí.\n`;
    }

    // Recommendation summary
    report += `\n**Khuyên dùng**: `;
    const mxhAppsCount = list.filter(p => p.category === 'social').length;
    if (mxhAppsCount > 0 && list.some(p => p.id === 'mxh100')) {
      report += `Nếu bạn thường xuyên xem video giải trí trên điện thoại, hãy chọn **MXH100**. `;
    }
    if (list.some(p => p.id === 'sd135')) {
      report += `Nếu bạn cần data thông thường ổn định cho làm việc hàng ngày, hãy chốt ngay **SD135** (5GB/ngày). `;
    }
    if (list.some(p => p.id === 'v120c')) {
      report += `Nếu cần trọn gói cả nghe gọi và data cân bằng nhất, gói quốc dân **V120C** là sự lựa chọn tối ưu.`;
    }

    return report;
  };

  // Filter out already selected packages to prevent double selection in dropdown
  const availablePackagesToSelect = packages.filter(p => !compareList.some(cp => cp.id === p.id));

  return (
    <div className="space-y-8 pb-16 relative animate-fade-in text-xs font-semibold">
      {/* Toast Notification */}
      {toastMsg && (
        <div className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-lg shadow-lg border-l-4 text-xs font-semibold bg-white text-slate-800 ${
          toastMsg.type === 'success' ? 'border-emerald-500' : 'border-red-500'
        }`}>
          {toastMsg.text}
        </div>
      )}

      {/* Header Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center">
            <ArrowRightLeft className="w-7 h-7 text-primary mr-2.5" />
            So sánh gói cước
          </h1>
          <p className="text-slate-550 text-xs mt-1 font-semibold">
            Đặt các gói cước lên bàn cân để đối chiếu chi tiết ưu đãi và tìm ra gói phù hợp nhất.
          </p>
        </div>

        {compareList.length > 0 && (
          <button
            onClick={clearCompare}
            className="text-xs text-primary hover:bg-red-50 transition-colors bg-red-50 border border-red-150 px-3.5 py-2 rounded-lg font-bold focus:outline-none"
          >
            Xóa danh sách so sánh
          </button>
        )}
      </div>

      {/* Comparison Area */}
      {compareList.length === 0 ? (
        /* Empty State */
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-12 text-center flex flex-col items-center max-w-lg mx-auto space-y-5">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center text-primary border border-red-100">
            <ArrowRightLeft className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Chưa có gói cước để so sánh</h3>
            <p className="text-slate-500 text-xs leading-relaxed font-semibold">
              Bạn chưa thêm gói cước nào vào danh sách so sánh. Hãy quay lại danh mục gói cước hoặc chọn nhanh gói cước bên dưới để so sánh ngay (tối đa 3 gói).
            </p>
          </div>
          
          {/* Quick Select Panel inside Empty State */}
          <div className="w-full space-y-3 pt-3 border-t border-slate-100">
            <button
              onClick={() => setShowAddSelector(true)}
              className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-2.5 rounded-lg text-xs transition-colors flex items-center justify-center space-x-2 focus:outline-none"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm gói nhanh tại đây</span>
            </button>
            <Link
              to="/packages"
              className="block text-xs text-slate-500 hover:text-slate-900 hover:underline transition-colors font-semibold"
            >
              Hoặc duyệt danh sách gói cước chính
            </Link>
          </div>
        </div>
      ) : (
        /* Comparison Table Grid & AI Advice */
        <div className="space-y-8">
          {/* Comparison Matrix Table */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="p-4 font-bold text-slate-600 uppercase tracking-wider w-1/4">Thông số / Gói</th>
                    {compareList.map((pkg) => (
                      <th key={pkg.id} className="p-4 w-1/4 relative group min-w-[200px] border-l border-slate-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-extrabold text-slate-900">{pkg.name}</span>
                          <button
                            onClick={() => removeFromCompare(pkg.id)}
                            className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors focus:outline-none"
                            title="Xóa"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </th>
                    ))}
                    {compareList.length < 3 && (
                      <th className="p-4 w-1/4 text-center min-w-[200px] border-l border-slate-200">
                        <button
                          onClick={() => setShowAddSelector(true)}
                          className="inline-flex items-center space-x-1 text-slate-650 hover:text-slate-950 bg-slate-50 border border-dashed border-slate-250 hover:bg-slate-100 px-3.5 py-1.5 rounded-lg transition-colors font-bold focus:outline-none"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Thêm gói</span>
                        </button>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {/* Row: Price */}
                  <tr className="hover:bg-slate-50/20 transition-colors">
                    <td className="p-4 font-bold text-slate-600 bg-slate-50/30">Giá cước (VND)</td>
                    {compareList.map((pkg) => (
                      <td key={pkg.id} className="p-4 text-base font-black text-primary border-l border-slate-200">
                        {new Intl.NumberFormat('vi-VN').format(pkg.price)}đ
                      </td>
                    ))}
                    {compareList.length < 3 && <td className="p-4 bg-slate-50/10 border-l border-slate-200"></td>}
                  </tr>

                  {/* Row: Cycle */}
                  <tr className="hover:bg-slate-50/20 transition-colors">
                    <td className="p-4 font-bold text-slate-600 bg-slate-50/30">Chu kỳ sử dụng</td>
                    {compareList.map((pkg) => (
                      <td key={pkg.id} className="p-4 font-bold text-slate-800 border-l border-slate-200">
                        {pkg.durationDays} ngày
                      </td>
                    ))}
                    {compareList.length < 3 && <td className="p-4 bg-slate-50/10 border-l border-slate-200"></td>}
                  </tr>

                  {/* Row: Data limit */}
                  <tr className="hover:bg-slate-50/20 transition-colors">
                    <td className="p-4 font-bold text-slate-600 bg-slate-50/30">Ưu đãi DATA</td>
                    {compareList.map((pkg) => (
                      <td key={pkg.id} className="p-4 border-l border-slate-200">
                        <p className="font-extrabold text-slate-900 text-[13px]">{pkg.dataLimit}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">Tốc độ cao 4G/5G</p>
                      </td>
                    ))}
                    {compareList.length < 3 && <td className="p-4 bg-slate-50/10 border-l border-slate-200"></td>}
                  </tr>

                  {/* Row: Internal voice */}
                  <tr className="hover:bg-slate-50/20 transition-colors">
                    <td className="p-4 font-bold text-slate-600 bg-slate-50/30">Gọi nội mạng</td>
                    {compareList.map((pkg) => (
                      <td key={pkg.id} className="p-4 text-slate-850 border-l border-slate-200">
                        {pkg.voiceFreeInternalMin > 0 ? (
                          <span className="flex items-center text-emerald-600 font-bold">
                            <Check className="w-3.5 h-3.5 mr-1" />
                            Miễn phí cuộc gọi &lt; {pkg.id === 'v50c' || pkg.id === 'mxh120' ? '10' : '20'} phút
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">Không hỗ trợ</span>
                        )}
                      </td>
                    ))}
                    {compareList.length < 3 && <td className="p-4 bg-slate-50/10 border-l border-slate-200"></td>}
                  </tr>

                  {/* Row: External voice */}
                  <tr className="hover:bg-slate-50/20 transition-colors">
                    <td className="p-4 font-bold text-slate-600 bg-slate-50/30">Gọi ngoại mạng</td>
                    {compareList.map((pkg) => (
                      <td key={pkg.id} className="p-4 text-slate-800 border-l border-slate-200">
                        {pkg.voiceFreeExternalMin > 0 ? (
                          <span className="font-bold text-slate-900">{pkg.voiceFreeExternalMin} phút / chu kỳ</span>
                        ) : (
                          <span className="text-slate-400 font-medium">Không hỗ trợ</span>
                        )}
                      </td>
                    ))}
                    {compareList.length < 3 && <td className="p-4 bg-slate-50/10 border-l border-slate-200"></td>}
                  </tr>

                  {/* Row: Social Media */}
                  <tr className="hover:bg-slate-50/20 transition-colors">
                    <td className="p-4 font-bold text-slate-600 bg-slate-50/30">Free Data Ứng dụng</td>
                    {compareList.map((pkg) => (
                      <td key={pkg.id} className="p-4 text-slate-800 border-l border-slate-200">
                        {pkg.socialFreeApps.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {pkg.socialFreeApps.map((app) => (
                              <span key={app} className="bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded text-[9px] font-bold">
                                {app}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-medium">Tính data thông thường</span>
                        )}
                      </td>
                    ))}
                    {compareList.length < 3 && <td className="p-4 bg-slate-50/10 border-l border-slate-200"></td>}
                  </tr>

                  {/* Row: Ratings */}
                  <tr className="hover:bg-slate-50/20 transition-colors">
                    <td className="p-4 font-bold text-slate-600 bg-slate-50/30">Đánh giá / Sao</td>
                    {compareList.map((pkg) => (
                      <td key={pkg.id} className="p-4 border-l border-slate-200">
                        <div className="flex items-center">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 mr-1" />
                          <span className="font-extrabold text-slate-900">{pkg.rating}</span>
                          <span className="text-slate-500 ml-1 font-semibold">({pkg.registrationsCount.toLocaleString()} lượt)</span>
                        </div>
                      </td>
                    ))}
                    {compareList.length < 3 && <td className="p-4 bg-slate-50/10 border-l border-slate-200"></td>}
                  </tr>

                  {/* Row: Quick Subscribe Actions */}
                  <tr className="bg-slate-50/50">
                    <td className="p-4 font-bold text-slate-600 bg-slate-50/50">Thao tác</td>
                    {compareList.map((pkg) => (
                      <td key={pkg.id} className="p-4 border-l border-slate-200">
                        <button
                          onClick={() => handleSubscribeClick(pkg)}
                          className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-2 rounded-lg text-[10px] transition-colors focus:outline-none"
                        >
                          Đăng ký ngay
                        </button>
                      </td>
                    ))}
                    {compareList.length < 3 && <td className="p-4 bg-slate-50/10 border-l border-slate-200"></td>}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Comments Panel */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded bg-red-50 flex items-center justify-center border border-red-100">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center">
                  Nhận xét thông minh từ Viettel AI
                  <span className="ml-2 bg-emerald-50 text-emerald-700 text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-emerald-100">
                    Realtime AI
                  </span>
                </h3>
                <p className="text-[10px] text-slate-550">Phân tích đa chiều dựa trên tính năng gói cước</p>
              </div>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-line space-y-2 font-medium">
              {generateAIAnalysis(compareList).split('\n').map((line, i) => {
                if (line.startsWith('•')) {
                  const boldPart = line.match(/\*\*(.*?)\*\*/);
                  return (
                    <p key={i} className="pl-4 relative">
                      <span className="absolute left-0 text-primary font-bold">•</span>
                      {boldPart ? (
                        <>
                          <strong>{boldPart[0].replace(/\*\*/g, '')}</strong>
                          {line.substring(boldPart[0].length + 1)}
                        </>
                      ) : line.substring(1)}
                    </p>
                  );
                }
                return (
                  <p key={i}>
                    {line.split('**').map((part, index) =>
                      index % 2 === 1 ? <strong key={index} className="text-slate-900 font-extrabold">{part}</strong> : part
                    )}
                  </p>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Select Add Package Modal/Dropdown */}
      {showAddSelector && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-sm w-full shadow-md animate-scale-up z-50">
            <h4 className="text-base font-extrabold text-slate-900 mb-2 flex items-center">
              <Plus className="w-5 h-5 text-primary mr-1.5" />
              Thêm gói cước so sánh
            </h4>
            <p className="text-[11px] text-slate-500 mb-4 leading-relaxed font-medium">
              Chọn một gói cước khác trong danh mục để tiến hành so sánh nhanh. Danh sách hiển thị các gói chưa được thêm.
            </p>

            <div className="space-y-4 text-xs">
              {availablePackagesToSelect.length > 0 ? (
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Danh sách gói cước</label>
                  <select
                    value={selectedPkgIdToAdd}
                    onChange={(e) => setSelectedPkgIdToAdd(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-700 focus:outline-none focus:bg-white transition-colors"
                  >
                    <option value="">Chọn gói cước cần thêm...</option>
                    {availablePackagesToSelect.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - {new Intl.NumberFormat('vi-VN').format(p.price)}đ
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 p-3 rounded-lg">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Đã chọn so sánh toàn bộ gói cước khả dụng!</span>
                </div>
              )}

              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => {
                    setShowAddSelector(false);
                    setSelectedPkgIdToAdd('');
                  }}
                  className="flex-1 py-2 bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs transition-colors font-bold focus:outline-none"
                >
                  Hủy
                </button>
                <button
                  disabled={!selectedPkgIdToAdd}
                  onClick={handleAddPackageDirectly}
                  className="flex-1 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg text-xs transition-colors disabled:opacity-40 focus:outline-none"
                >
                  Thêm gói cước
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Confirmation Modal */}
      {confirmSubscribePkg && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-sm w-full shadow-md animate-scale-up z-50">
            <h4 className="text-base font-extrabold text-slate-900 mb-2">Xác nhận đăng ký</h4>
            <p className="text-xs text-slate-655 mb-5 leading-relaxed font-semibold">
              Bạn có chắc chắn muốn đăng ký nhanh gói cước <strong className="text-primary">{confirmSubscribePkg.name}</strong> với giá{' '}
              <strong className="text-slate-900">{new Intl.NumberFormat('vi-VN').format(confirmSubscribePkg.price)}đ</strong>?
              Số tiền này sẽ được trừ trực tiếp vào tài khoản ví ảo của bạn.
            </p>
            <div className="flex space-x-3">
              <button
                disabled={isSubmitting}
                onClick={() => setConfirmSubscribePkg(null)}
                className="flex-1 py-2 bg-slate-50 border border-slate-200 text-slate-605 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs transition-colors font-bold focus:outline-none"
              >
                Hủy
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleConfirmSubscribe}
                className="flex-1 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg text-xs transition-colors focus:outline-none"
              >
                {isSubmitting ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
