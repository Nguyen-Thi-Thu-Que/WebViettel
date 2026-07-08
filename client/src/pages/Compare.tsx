import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightLeft, X, Bot, Plus, Check, ShieldAlert } from 'lucide-react';
import { usePackageStore, useAuthStore } from '../store';
import type { Package } from '../types';
import SEO from '../components/SEO';

export default function Compare() {
  const { compareList, packages, removeFromCompare, addToCompare, clearCompare } = usePackageStore();
  const { currentUser, subscribePackage, checkSubscription } = useAuthStore();

  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showAddSelector, setShowAddSelector] = useState(false);
  const [selectedPkgIdToAdd, setSelectedPkgIdToAdd] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmSubscribePkg, setConfirmSubscribePkg] = useState<Package | null>(null);
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkResult, setCheckResult] = useState<{
    action: 'ALLOW' | 'REPLACE' | 'REJECT';
    message: string;
    replaceSubscriptions?: any[];
    conflictSubscriptions?: any[];
  } | null>(null);

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
    setCheckResult(null);
    setCheckLoading(false);
    setConfirmSubscribePkg(pkg);
  };

  const handleConfirmSubscribe = async () => {
    if (!confirmSubscribePkg) return;

    let cycle: 'DAY' | 'MONTH' | 'YEAR' = 'MONTH';
    const dayCycle = parseInt(confirmSubscribePkg.chu_ky_ngay || '30', 10);
    if (dayCycle === 1) {
      cycle = 'DAY';
    } else if (dayCycle >= 360) {
      cycle = 'YEAR';
    }

    if (!checkResult) {
      setCheckLoading(true);
      try {
        const res = await checkSubscription(confirmSubscribePkg.numericId || Number(confirmSubscribePkg.id) || 0, cycle);
        if (res.hasActive === false) {
          // If no active subscriptions, register immediately!
          setIsSubmitting(true);
          try {
            const regRes = await subscribePackage(confirmSubscribePkg);
            setConfirmSubscribePkg(null);
            if (regRes.success) {
              showToast('success', regRes.message);
            } else {
              showToast('error', regRes.message);
            }
          } catch (err: any) {
            setConfirmSubscribePkg(null);
            showToast('error', err.message || 'Lỗi đăng ký gói cước.');
          } finally {
            setIsSubmitting(false);
          }
        } else {
          setCheckResult(res);
        }
      } catch (err: any) {
        showToast('error', err.message || 'Lỗi kiểm tra xung đột gói cước.');
        setConfirmSubscribePkg(null);
      } finally {
        setCheckLoading(false);
      }
    } else {
      if (checkResult.action === 'ALLOW' || checkResult.action === 'REPLACE') {
        setIsSubmitting(true);
        try {
          const res = await subscribePackage(confirmSubscribePkg);
          setConfirmSubscribePkg(null);
          if (res.success) {
            showToast('success', res.message);
          } else {
            showToast('error', res.message);
          }
        } catch (err: any) {
          setConfirmSubscribePkg(null);
          showToast('error', err.message || 'Lỗi đăng ký gói cước.');
        } finally {
          setIsSubmitting(false);
        }
      }
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
      report += `Nếu cần trọn gói cả nghe gọi và data cân bằng nhất, gói quốc danh **V120C** là sự lựa chọn tối ưu.`;
    }

    return report;
  };

  const availablePackagesToSelect = packages.filter(p => !compareList.some(cp => cp.id === p.id));

  // Structured breadcrumbs schema for Compare Page
  const compareBreadcrumbsSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Trang chủ",
        "item": window.location.origin
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "So sánh gói cước",
        "item": `${window.location.origin}/compare`
      }
    ]
  };

  return (
    <div className="space-y-8 pb-16 relative animate-fade-in text-xs font-semibold">
      {/* SEO optimization */}
      <SEO
        title="So Sánh Các Gói Cước Di Động Viettel - Đối Chiếu Khách Quan"
        description="Đặt lên bàn cân so sánh chi tiết về dung lượng data tốc độ cao, số phút gọi nội/ngoại mạng miễn phí, thời hạn chu kỳ và mức giá giữa các gói cước Viettel tốt nhất."
        schema={compareBreadcrumbsSchema}
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-lg shadow-lg border-l-4 text-xs font-semibold bg-white text-slate-800 ${toastMsg.type === 'success' ? 'border-emerald-500' : 'border-red-500'
          }`}>
          {toastMsg.text}
        </div>
      )}

      {/* Header Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="text-left space-y-1">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center">
            <ArrowRightLeft className="w-7 h-7 text-primary mr-2.5" />
            So sánh gói cước
          </h1>
          <p className="text-slate-500 text-xs font-medium">
            Đặt các gói cước di động lên bàn cân để đối chiếu chi tiết ưu đãi và tìm ra gói phù hợp nhất.
          </p>
        </div>

        {compareList.length > 0 && (
          <button
            onClick={clearCompare}
            className="text-xs text-primary hover:bg-red-50 transition-colors bg-red-50 border border-red-150 px-4 py-2.5 rounded-xl font-bold focus:outline-none cursor-pointer"
          >
            Xóa danh sách so sánh
          </button>
        )}
      </div>

      {compareList.length === 0 ? (
        /* Empty State */
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-12 text-center flex flex-col items-center max-w-lg mx-auto space-y-5 animate-scale-up">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center text-primary border border-red-100">
            <ArrowRightLeft className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-slate-900">Chưa có gói cước để so sánh</h3>
            <p className="text-slate-500 text-xs leading-relaxed font-semibold">
              Bạn chưa thêm gói cước nào vào danh sách so sánh. Hãy chọn nhanh gói cước bên dưới để tiến hành so sánh ngay (tối đa 3 gói).
            </p>
          </div>

          <div className="w-full space-y-3 pt-3 border-t border-slate-105">
            <button
              onClick={() => setShowAddSelector(true)}
              className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-xl text-xs transition-colors flex items-center justify-center space-x-2 focus:outline-none cursor-pointer shadow-sm hover:shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm gói nhanh tại đây</span>
            </button>
            <Link
              to="/packages"
              className="block text-xs text-slate-450 hover:text-slate-900 hover:underline transition-colors font-semibold"
            >
              Hoặc duyệt danh sách gói cước chính
            </Link>
          </div>
        </div>
      ) : (
        /* Comparison Table Grid & AI Advice */
        <div className="space-y-8 animate-slide-up">
          <div className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="p-4.5 font-bold text-slate-500 uppercase tracking-wider w-1/4">Thông số / Gói</th>
                    {compareList.map((pkg) => (
                      <th key={pkg.id} className="p-4.5 w-1/4 relative group min-w-[200px] border-l border-slate-100 bg-white">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-extrabold text-slate-900">{pkg.ten}</span>
                          <button
                            onClick={() => removeFromCompare(pkg.id)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-800 transition-colors focus:outline-none cursor-pointer"
                            title="Xóa"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </th>
                    ))}
                    {compareList.length < 3 && (
                      <th className="p-4.5 w-1/4 text-center min-w-[200px] border-l border-slate-100 bg-slate-50/20">
                        <button
                          onClick={() => setShowAddSelector(true)}
                          className="inline-flex items-center space-x-1 text-slate-600 hover:text-slate-950 bg-white border border-dashed border-slate-200 hover:bg-slate-50 px-3.5 py-2 rounded-xl transition-all font-bold focus:outline-none cursor-pointer shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Thêm gói</span>
                        </button>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-700">
                  {/* Row: Price */}
                  <tr className="hover:bg-slate-50/20 transition-colors">
                    <td className="p-4.5 font-bold text-slate-500 bg-slate-50/30">Giá cước (VND)</td>
                    {compareList.map((pkg) => (
                      <td key={pkg.id} className="p-4.5 text-base font-black text-primary border-l border-slate-100">
                        {new Intl.NumberFormat('vi-VN').format(pkg.gia)}đ
                      </td>
                    ))}
                    {compareList.length < 3 && <td className="p-4.5 bg-slate-50/10 border-l border-slate-100"></td>}
                  </tr>

                  {/* Row: Cycle */}
                  <tr className="hover:bg-slate-50/20 transition-colors">
                    <td className="p-4.5 font-bold text-slate-500 bg-slate-50/30">Chu kỳ sử dụng</td>
                    {compareList.map((pkg) => (
                      <td key={pkg.id} className="p-4.5 font-bold text-slate-800 border-l border-slate-100">
                        {pkg.chu_ky_ngay} ngày
                      </td>
                    ))}
                    {compareList.length < 3 && <td className="p-4.5 bg-slate-50/10 border-l border-slate-100"></td>}
                  </tr>

                  {/* Row: Category */}
                  <tr className="hover:bg-slate-50/20 transition-colors">
                    <td className="p-4.5 font-bold text-slate-500 bg-slate-50/30">Phân loại gói</td>
                    {compareList.map((pkg) => (
                      <td key={pkg.id} className="p-4.5 text-slate-800 border-l border-slate-100 font-bold">
                        {pkg.phan_loai_goi}
                      </td>
                    ))}
                    {compareList.length < 3 && <td className="p-4.5 bg-slate-50/10 border-l border-slate-100"></td>}
                  </tr>

                  {/* Row: Data limit */}
                  <tr className="hover:bg-slate-50/20 transition-colors">
                    <td className="p-4.5 font-bold text-slate-500 bg-slate-50/30">Ưu đãi DATA</td>
                    {compareList.map((pkg) => (
                      <td key={pkg.id} className="p-4.5 border-l border-slate-100">
                        <p className="font-extrabold text-slate-900 text-[13px]">{isValid(pkg.data_theo_ngay) ? pkg.data_theo_ngay : 'Không có'}</p>
                      </td>
                    ))}
                    {compareList.length < 3 && <td className="p-4.5 bg-slate-50/10 border-l border-slate-100"></td>}
                  </tr>

                  {/* Row: Internal voice */}
                  <tr className="hover:bg-slate-50/20 transition-colors">
                    <td className="p-4.5 font-bold text-slate-500 bg-slate-50/30">Gọi nội mạng</td>
                    {compareList.map((pkg) => (
                      <td key={pkg.id} className="p-4.5 text-slate-800 border-l border-slate-100">
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
                    {compareList.length < 3 && <td className="p-4.5 bg-slate-50/10 border-l border-slate-100"></td>}
                  </tr>

                  {/* Row: External voice */}
                  <tr className="hover:bg-slate-50/20 transition-colors">
                    <td className="p-4.5 font-bold text-slate-500 bg-slate-50/30">Gọi ngoại mạng</td>
                    {compareList.map((pkg) => (
                      <td key={pkg.id} className="p-4.5 text-slate-800 border-l border-slate-100">
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
                    {compareList.length < 3 && <td className="p-4.5 bg-slate-50/10 border-l border-slate-100"></td>}
                  </tr>

                  {/* Row: Free Apps */}
                  <tr className="hover:bg-slate-50/20 transition-colors">
                    <td className="p-4.5 font-bold text-slate-500 bg-slate-50/30">Free Data Ứng dụng</td>
                    {compareList.map((pkg) => (
                      <td key={pkg.id} className="p-4.5 text-slate-800 border-l border-slate-100">
                        {isValid(pkg.noi_dung_ngoai) ? (
                          <div className="flex flex-wrap gap-1">
                            {pkg.noi_dung_ngoai.split(',').map((app) => (
                              <span key={app} className="bg-slate-55 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-lg text-[9px] font-bold">
                                {app.trim()}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-medium">Không hỗ trợ</span>
                        )}
                      </td>
                    ))}
                    {compareList.length < 3 && <td className="p-4.5 bg-slate-50/10 border-l border-slate-100"></td>}
                  </tr>

                  {/* Row: Free Utilities */}
                  <tr className="hover:bg-slate-50/20 transition-colors">
                    <td className="p-4.5 font-bold text-slate-500 bg-slate-50/30">Tiện ích đi kèm</td>
                    {compareList.map((pkg) => (
                      <td key={pkg.id} className="p-4.5 text-slate-800 border-l border-slate-100">
                        {isValid(pkg.tien_ich_free) ? (
                          <span className="font-bold text-slate-800">{pkg.tien_ich_free}</span>
                        ) : (
                          <span className="text-slate-400 font-medium">Không có</span>
                        )}
                      </td>
                    ))}
                    {compareList.length < 3 && <td className="p-4.5 bg-slate-50/10 border-l border-slate-100"></td>}
                  </tr>

                  {/* Row: Description */}
                  <tr className="hover:bg-slate-50/20 transition-colors">
                    <td className="p-4.5 font-bold text-slate-500 bg-slate-50/30">Mô tả tóm tắt</td>
                    {compareList.map((pkg) => (
                      <td key={pkg.id} className="p-4.5 text-slate-500 border-l border-slate-100 leading-relaxed font-medium">
                        {pkg.uudaitrong}
                      </td>
                    ))}
                    {compareList.length < 3 && <td className="p-4.5 bg-slate-50/10 border-l border-slate-100"></td>}
                  </tr>

                  {/* Row: Quick Subscribe Actions */}
                  <tr className="bg-slate-50/50">
                    <td className="p-4.5 font-bold text-slate-500 bg-slate-50/50">Thao tác nhanh</td>
                    {compareList.map((pkg) => (
                      <td key={pkg.id} className="p-4.5 border-l border-slate-100 bg-white">
                        <button
                          onClick={() => handleSubscribeClick(pkg)}
                          className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-2.5 rounded-xl text-[10px] transition-colors focus:outline-none cursor-pointer"
                        >
                          Đăng ký ngay
                        </button>
                      </td>
                    ))}
                    {compareList.length < 3 && <td className="p-4.5 bg-slate-50/10 border-l border-slate-100"></td>}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Comments Panel */}
          <div className="bg-white border border-slate-150 shadow-sm rounded-2xl p-6 space-y-4 text-left">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-50">
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center border border-red-100/60">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center">
                  Nhận xét thông minh từ Viettel AI
                  <span className="ml-2 bg-emerald-50 text-emerald-700 text-[8px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-emerald-100">
                    Realtime AI
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400">Phân tích đa chiều dựa trên tính năng gói cước</p>
              </div>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-line space-y-2.5 font-medium">
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
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 max-w-sm w-full shadow-md animate-scale-up z-50 text-left">
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
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Danh sách gói cước</label>
                  <select
                    value={selectedPkgIdToAdd}
                    onChange={(e) => setSelectedPkgIdToAdd(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 focus:outline-none focus:bg-white transition-colors cursor-pointer"
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
                <div className="flex items-center space-x-2 text-xs text-amber-800 bg-amber-50/50 border border-amber-200 p-3 rounded-xl">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>Đã chọn so sánh toàn bộ gói cước khả dụng!</span>
                </div>
              )}

              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => {
                    setShowAddSelector(false);
                    setSelectedPkgIdToAdd('');
                  }}
                  className="flex-1 py-2.5 bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl text-xs transition-colors font-bold focus:outline-none"
                >
                  Hủy
                </button>
                <button
                  disabled={!selectedPkgIdToAdd}
                  onClick={handleAddPackageDirectly}
                  className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl text-xs transition-colors disabled:opacity-40 focus:outline-none cursor-pointer"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-150 rounded-2xl p-6 max-w-sm w-full shadow-md animate-scale-up z-50 text-left space-y-5">
            <h4 className="text-base font-extrabold text-slate-900 border-b border-slate-50 pb-2">Xác nhận đăng ký</h4>
            <p className="text-xs text-slate-550 leading-relaxed font-semibold">
              Bạn có chắc chắn muốn đăng ký nhanh gói cước <strong className="text-primary">{confirmSubscribePkg.ten}</strong> với giá{' '}
              <strong className="text-slate-900">{new Intl.NumberFormat('vi-VN').format(confirmSubscribePkg.gia)}đ</strong>?
              Số tiền này sẽ được trừ trực tiếp vào tài khoản ví ảo của bạn.
            </p>

            {/* Nhóm 3 - Cảnh báo Xung đột Gói cước (Sprint 7.3) */}
            {checkResult && (
              <div className={`p-4 rounded-xl border text-[11px] leading-relaxed font-semibold ${
                checkResult.action === 'REJECT'
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : checkResult.action === 'REPLACE'
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-emerald-50 border-emerald-250 text-emerald-800'
              }`}>
                <p className="font-extrabold text-xs mb-1.5">
                  {checkResult.action === 'REJECT' ? '⚠️ Không thể đăng ký' : checkResult.action === 'REPLACE' ? '⚠️ Cảnh báo thay thế gói' : '✅ Đăng ký song song'}
                </p>
                
                {checkResult.action === 'ALLOW' && (
                  <p>
                    Gói cước này có thể sử dụng song song với các gói hiện tại.
                    <br />
                    Bạn có muốn tiếp tục đăng ký không?
                  </p>
                )}
                
                {checkResult.action === 'REPLACE' && (
                  <div>
                    <p className="mb-2">Gói cước này sẽ thay thế các gói đang sử dụng.</p>
                    <p className="font-extrabold mb-1">Khi tiếp tục:</p>
                    <ul className="list-disc pl-4 space-y-0.5">
                      <li>Các gói hiện tại sẽ bị hủy ngay lập tức.</li>
                      <li>Quyền lợi còn lại sẽ kết thúc.</li>
                      <li>Gói mới sẽ được kích hoạt.</li>
                    </ul>
                    <p className="mt-2 font-bold">Bạn có muốn tiếp tục không?</p>
                  </div>
                )}
                
                {checkResult.action === 'REJECT' && (
                  <p>
                    Không thể đăng ký đồng thời với các gói đang sử dụng.
                    <br />
                    Vui lòng hủy gói hiện tại trước khi đăng ký gói này.
                  </p>
                )}
              </div>
            )}

            <div className="flex space-x-3 pt-2">
              <button
                disabled={isSubmitting || checkLoading}
                onClick={() => setConfirmSubscribePkg(null)}
                className="flex-1 py-2.5 bg-slate-50 border border-slate-200 text-slate-605 hover:text-slate-950 hover:bg-slate-100 rounded-xl text-xs transition-colors font-bold focus:outline-none"
              >
                {checkResult?.action === 'REJECT' ? 'Đóng' : 'Hủy'}
              </button>
              {(!checkResult || checkResult.action !== 'REJECT') && (
                <button
                  disabled={isSubmitting || checkLoading}
                  onClick={handleConfirmSubscribe}
                  className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl text-xs transition-colors focus:outline-none cursor-pointer flex items-center justify-center"
                >
                  {checkLoading ? 'Đang kiểm tra...' : isSubmitting ? 'Đang xử lý...' : checkResult ? 'Xác nhận' : 'Xác nhận'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
