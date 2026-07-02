import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightLeft, X, Bot, Plus, Check, ShieldAlert } from 'lucide-react';
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

  const handleConfirmSubscribe = async () => {
    if (!confirmSubscribePkg) return;
    setIsSubmitting(true);
    try {
      const res = await subscribePackage(confirmSubscribePkg);
      setIsSubmitting(false);
      setConfirmSubscribePkg(null);
      if (res.success) {
        showToast('success', res.message);
      } else {
        showToast('error', res.message);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setConfirmSubscribePkg(null);
      showToast('error', err.message || 'Lỗi đăng ký gói cước.');
    }
  };

  const isValid = (val: any) => {
    return val !== 0 && val !== '0' && val !== null && val !== undefined && val !== '';
  };

  const parseDataGb = (str: string) => {
    if (!str) return 0;
    const match = str.replace(',', '.').match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  };

  const generateAIAnalysis = (list: Package[]): string => {
    if (list.length === 0) return '';
    if (list.length === 1) {
      const catLabel = list[0].phan_loai_goi === 'Social' ? 'chuyên dùng cho mạng xã hội (YouTube/TikTok)' :
                       list[0].phan_loai_goi === 'Combo' ? 'combo nghe gọi kèm data tiện lợi' : 'chuyên dụng data tốc độ cao';
      return `Bạn đang xem xét gói **${list[0].ten}**. Đây là gói cước ${catLabel} với chi phí ${list[0].gia.toLocaleString()}đ/chu kỳ. Gói cước này có mức giá khá hợp lý ở phân khúc ${list[0].phan_khuc_gia}.`;
    }

    let report = 'Dựa trên phân tích các gói cước đã chọn, **Viettel AI** xin đưa ra nhận xét:\n\n';

    const sortedByPrice = [...list].sort((a, b) => a.gia - b.gia);
    const cheapest = sortedByPrice[0];
    report += `• **Tiết kiệm nhất**: Gói **${cheapest.ten}** có chi phí thấp nhất là **${cheapest.gia.toLocaleString()}đ**, thích hợp nếu bạn muốn duy trì liên lạc với ngân sách tối giản.\n`;

    const sortedByData = [...list].sort((a, b) => {
      const limitA = parseDataGb(a.data_theo_ngay);
      const limitB = parseDataGb(b.data_theo_ngay);
      return limitB - limitA;
    });
    const maxData = sortedByData[0];
    if (parseDataGb(maxData.data_theo_ngay) > 0 && maxData.id !== cheapest.id) {
      report += `• **Dung lượng khủng nhất**: Gói **${maxData.ten}** cung cấp lượng data vượt trội **${maxData.data_theo_ngay}** hỗ trợ lướt web cực nhanh, phù hợp cho nhu cầu làm việc di động nhiều.\n`;
    }

    const socialPackages = list.filter(p => isValid(p.noi_dung_ngoai));
    if (socialPackages.length > 0) {
      report += `• **Ưu đãi Giải trí**: Gói **${socialPackages.map(p => p.ten).join(', ')}** là lựa chọn tốt nếu bạn nghiện lướt mạng xã hội vì được miễn cước data cho các ứng dụng phổ biến.\n`;
    }

    const voicePackages = list.filter(p => isValid(p.free_noi_mang) && p.free_noi_mang !== '0');
    if (voicePackages.length > 0) {
      report += `• **Nghe gọi thoải mái**: Gói **${voicePackages.map(p => p.ten).join(', ')}** tối ưu nhất cho người đàm thoại liên tục nhờ có ưu đãi phút gọi nội/ngoại mạng miễn phí.\n`;
    }

    report += `\n**Khuyên dùng**: `;
    if (list.some(p => p.id === 'mxh100')) {
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
            className="text-xs text-primary hover:bg-red-50 transition-colors bg-red-50 border border-red-150 px-3.5 py-2 rounded-lg font-bold focus:outline-none cursor-pointer"
          >
            Xóa danh sách so sánh
          </button>
        )}
      </div>

      {compareList.length === 0 ? (
        /* Empty State */
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-12 text-center flex flex-col items-center max-w-lg mx-auto space-y-5">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center text-primary border border-red-100">
            <ArrowRightLeft className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Chưa có gói cước để so sánh</h3>
            <p className="text-slate-550 text-xs leading-relaxed font-semibold">
              Bạn chưa thêm gói cước nào vào danh sách so sánh. Hãy chọn nhanh gói cước bên dưới để tiến hành so sánh ngay (tối đa 3 gói).
            </p>
          </div>
          
          <div className="w-full space-y-3 pt-3 border-t border-slate-100">
            <button
              onClick={() => setShowAddSelector(true)}
              className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-2.5 rounded-lg text-xs transition-colors flex items-center justify-center space-x-2 focus:outline-none cursor-pointer"
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
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="p-4 font-bold text-slate-600 uppercase tracking-wider w-1/4">Thông số / Gói</th>
                    {compareList.map((pkg) => (
                      <th key={pkg.id} className="p-4 w-1/4 relative group min-w-[200px] border-l border-slate-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-extrabold text-slate-900">{pkg.ten}</span>
                          <button
                            onClick={() => removeFromCompare(pkg.id)}
                            className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors focus:outline-none cursor-pointer"
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
                          className="inline-flex items-center space-x-1 text-slate-650 hover:text-slate-950 bg-slate-50 border border-dashed border-slate-250 hover:bg-slate-100 px-3.5 py-1.5 rounded-lg transition-colors font-bold focus:outline-none cursor-pointer"
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
                        {new Intl.NumberFormat('vi-VN').format(pkg.gia)}đ
                      </td>
                    ))}
                    {compareList.length < 3 && <td className="p-4 bg-slate-50/10 border-l border-slate-200"></td>}
                  </tr>

                  {/* Row: Cycle */}
                  <tr className="hover:bg-slate-50/20 transition-colors">
                    <td className="p-4 font-bold text-slate-600 bg-slate-50/30">Chu kỳ sử dụng</td>
                    {compareList.map((pkg) => (
                      <td key={pkg.id} className="p-4 font-bold text-slate-800 border-l border-slate-200">
                        {pkg.chu_ky_ngay} ngày
                      </td>
                    ))}
                    {compareList.length < 3 && <td className="p-4 bg-slate-50/10 border-l border-slate-200"></td>}
                  </tr>

                  {/* Row: Category */}
                  <tr className="hover:bg-slate-50/20 transition-colors">
                    <td className="p-4 font-bold text-slate-600 bg-slate-50/30">Phân loại gói</td>
                    {compareList.map((pkg) => (
                      <td key={pkg.id} className="p-4 text-slate-800 border-l border-slate-200 font-bold">
                        {pkg.phan_loai_goi}
                      </td>
                    ))}
                    {compareList.length < 3 && <td className="p-4 bg-slate-50/10 border-l border-slate-200"></td>}
                  </tr>

                  {/* Row: Data limit */}
                  <tr className="hover:bg-slate-50/20 transition-colors">
                    <td className="p-4 font-bold text-slate-600 bg-slate-50/30">Ưu đãi DATA</td>
                    {compareList.map((pkg) => (
                      <td key={pkg.id} className="p-4 border-l border-slate-200">
                        <p className="font-extrabold text-slate-900 text-[13px]">{isValid(pkg.data_theo_ngay) ? pkg.data_theo_ngay : 'Không có'}</p>
                      </td>
                    ))}
                    {compareList.length < 3 && <td className="p-4 bg-slate-50/10 border-l border-slate-200"></td>}
                  </tr>

                  {/* Row: Internal voice */}
                  <tr className="hover:bg-slate-50/20 transition-colors">
                    <td className="p-4 font-bold text-slate-600 bg-slate-50/30">Gọi nội mạng</td>
                    {compareList.map((pkg) => (
                      <td key={pkg.id} className="p-4 text-slate-850 border-l border-slate-200">
                        {isValid(pkg.free_noi_mang) ? (
                          <span className="flex items-center text-emerald-600 font-bold">
                            <Check className="w-3.5 h-3.5 mr-1" />
                            {pkg.free_noi_mang}
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
                      <td key={pkg.id} className="p-4 text-slate-850 border-l border-slate-200">
                        {isValid(pkg.free_ngoai_mang) ? (
                          <span className="flex items-center text-emerald-600 font-bold">
                            <Check className="w-3.5 h-3.5 mr-1" />
                            {pkg.free_ngoai_mang}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">Không hỗ trợ</span>
                        )}
                      </td>
                    ))}
                    {compareList.length < 3 && <td className="p-4 bg-slate-50/10 border-l border-slate-200"></td>}
                  </tr>

                  {/* Row: Free Apps */}
                  <tr className="hover:bg-slate-50/20 transition-colors">
                    <td className="p-4 font-bold text-slate-600 bg-slate-50/30">Free Data Ứng dụng</td>
                    {compareList.map((pkg) => (
                      <td key={pkg.id} className="p-4 text-slate-800 border-l border-slate-200">
                        {isValid(pkg.noi_dung_ngoai) ? (
                          <div className="flex flex-wrap gap-1">
                            {pkg.noi_dung_ngoai.split(',').map((app) => (
                              <span key={app} className="bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded text-[9px] font-bold">
                                {app.trim()}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-medium">Không hỗ trợ</span>
                        )}
                      </td>
                    ))}
                    {compareList.length < 3 && <td className="p-4 bg-slate-50/10 border-l border-slate-200"></td>}
                  </tr>

                  {/* Row: Free Utilities */}
                  <tr className="hover:bg-slate-50/20 transition-colors">
                    <td className="p-4 font-bold text-slate-600 bg-slate-50/30">Tiện ích đi kèm</td>
                    {compareList.map((pkg) => (
                      <td key={pkg.id} className="p-4 text-slate-800 border-l border-slate-200">
                        {isValid(pkg.tien_ich_free) ? (
                          <span className="font-bold text-slate-800">{pkg.tien_ich_free}</span>
                        ) : (
                          <span className="text-slate-400 font-medium">Không có</span>
                        )}
                      </td>
                    ))}
                    {compareList.length < 3 && <td className="p-4 bg-slate-50/10 border-l border-slate-200"></td>}
                  </tr>

                  {/* Row: Description */}
                  <tr className="hover:bg-slate-50/20 transition-colors">
                    <td className="p-4 font-bold text-slate-600 bg-slate-50/30">Mô tả tóm tắt</td>
                    {compareList.map((pkg) => (
                      <td key={pkg.id} className="p-4 text-slate-650 border-l border-slate-200 leading-relaxed font-medium">
                        {pkg.uudaitrong}
                      </td>
                    ))}
                    {compareList.length < 3 && <td className="p-4 bg-slate-50/10 border-l border-slate-200"></td>}
                  </tr>

                  {/* Row: Quick Subscribe Actions */}
                  <tr className="bg-slate-50/50">
                    <td className="p-4 font-bold text-slate-600 bg-slate-50/50">Thao tác nhanh</td>
                    {compareList.map((pkg) => (
                      <td key={pkg.id} className="p-4 border-l border-slate-200">
                        <button
                          onClick={() => handleSubscribeClick(pkg)}
                          className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-2 rounded-xl text-[10px] transition-colors focus:outline-none cursor-pointer"
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

            <div className="text-xs text-slate-650 leading-relaxed whitespace-pre-line space-y-2 font-medium">
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-700 focus:outline-none focus:bg-white transition-colors cursor-pointer"
                  >
                    <option value="">Chọn gói cước cần thêm...</option>
                    {availablePackagesToSelect.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.ten} - {new Intl.NumberFormat('vi-VN').format(p.gia)}đ
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
                  className="flex-1 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg text-xs transition-colors disabled:opacity-40 focus:outline-none cursor-pointer"
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
              Bạn có chắc chắn muốn đăng ký nhanh gói cước <strong className="text-primary">{confirmSubscribePkg.ten}</strong> với giá{' '}
              <strong className="text-slate-900">{new Intl.NumberFormat('vi-VN').format(confirmSubscribePkg.gia)}đ</strong>?
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
                className="flex-1 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg text-xs transition-colors focus:outline-none cursor-pointer"
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
