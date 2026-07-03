import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Wifi, Phone, ArrowLeft, ArrowRightLeft, CreditCard, Sparkles, Info, HelpCircle, Loader2 } from 'lucide-react';
import { usePackageStore, useAuthStore } from '../store';
import PackageCard from '../components/PackageCard';
import SEO from '../components/SEO';

export default function PackageDetail() {
  const { id } = useParams<{ id: string }>();
  const {
    currentPackage: pkg,
    loading,
    error,
    fetchPackageById,
    packages,
    addToCompare,
    compareList,
    removeFromCompare
  } = usePackageStore();
  const { currentUser, subscribePackage } = useAuthStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (id) {
      fetchPackageById(id);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id, fetchPackageById]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 3000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-xs font-semibold text-slate-500 space-y-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="animate-pulse">Đang tải thông tin chi tiết gói cước...</span>
      </div>
    );
  }

  if (error || !pkg) {
    return (
      <div className="bg-white border border-slate-200 p-12 rounded-2xl max-w-lg mx-auto text-center space-y-4 shadow-sm my-12 text-xs font-semibold animate-scale-up">
        <h3 className="text-xl font-bold text-primary">Gói cước không tồn tại</h3>
        <p className="text-slate-500 text-xs">
          {error || 'Gói cước bạn tìm kiếm không có trong hệ thống dữ liệu Viettel hoặc đã tạm ngưng cung cấp.'}
        </p>
        <Link
          to="/packages"
          className="inline-flex items-center space-x-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh mục</span>
        </Link>
      </div>
    );
  }

  const isValid = (val: any) => {
    return val !== 0 && val !== '0' && val !== null && val !== undefined && val !== '';
  };

  const isInCompare = compareList.some(p => p.id === pkg.id);

  const handleCompareToggle = () => {
    if (isInCompare) {
      removeFromCompare(pkg.id);
      showToast('success', 'Đã xóa khỏi danh sách so sánh.');
    } else {
      const res = addToCompare(pkg);
      if (res.success) {
        showToast('success', res.message);
      } else {
        showToast('error', res.message);
      }
    }
  };

  const handleSubscribeClick = () => {
    if (!currentUser) {
      showToast('error', 'Vui lòng đăng nhập trước khi đăng ký gói cước.');
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmSubscribe = async () => {
    setIsSubmitting(true);
    try {
      const res = await subscribePackage(pkg);
      setIsSubmitting(false);
      setShowConfirm(false);
      if (res.success) {
        showToast('success', res.message);
      } else {
        showToast('error', res.message);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setShowConfirm(false);
      showToast('error', err.message || 'Lỗi đăng ký gói cước.');
    }
  };

  // Find related packages
  const relatedPackages = packages
    .filter(p => p.id !== pkg.id && (p.phan_loai_goi === pkg.phan_loai_goi || Math.abs(p.gia - pkg.gia) <= 50000))
    .slice(0, 3);

  // Structured schemas: Product & FAQ schemas for SEO
  const packageUrl = `${window.location.origin}/packages/${pkg.id}`;
  const detailSchemas = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": `Gói Cước ${pkg.ten} Viettel`,
      "description": pkg.uudaitrong || `Đăng ký gói cước ${pkg.ten} Viettel nhận ngay ưu đãi hấp dẫn.`,
      "image": `${window.location.origin}/og-image.jpg`,
      "brand": {
        "@type": "Brand",
        "name": "Viettel"
      },
      "offers": {
        "@type": "Offer",
        "url": packageUrl,
        "price": pkg.gia,
        "priceCurrency": "VND",
        "availability": "https://schema.org/InStock",
        "seller": {
          "@type": "Organization",
          "name": "Viettel"
        }
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": `Cú pháp đăng ký gói ${pkg.ten} Viettel?`,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": `Soạn tin nhắn theo cú pháp: ${pkg.dangky || `${pkg.ten} gửi 191`}`
          }
        },
        {
          "@type": "Question",
          "name": `Làm sao để hủy gói cước ${pkg.ten}?`,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": `Hủy gia hạn soạn: ${pkg.huygiahan || 'HUY gửi 191'} hoặc hủy gói cước hoàn toàn soạn: ${pkg.huygoicuoc || 'HUYDATA gửi 191'}`
          }
        }
      ]
    },
    {
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
          "name": "Gói cước",
          "item": `${window.location.origin}/packages`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": pkg.ten,
          "item": packageUrl
        }
      ]
    }
  ];

  return (
    <div className="space-y-10 pb-16 relative animate-fade-in text-xs font-semibold">
      {/* SEO configuration */}
      <SEO
        title={`Gói Cước ${pkg.ten} Viettel - Ưu Đãi ${pkg.data_theo_ngay || pkg.uudaitrong}`}
        description={`Chi tiết gói cước di động ${pkg.ten} Viettel. Giá cước ${pkg.gia.toLocaleString()}đ cho chu kỳ ${pkg.chu_ky_ngay} ngày. Đăng ký ngay nhận data khủng ${pkg.data_theo_ngay} cùng các ưu đãi gọi thoại miễn phí.`}
        schema={detailSchemas}
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-lg shadow-lg border-l-4 text-xs font-semibold bg-white text-slate-800 ${toastMsg.type === 'success' ? 'border-emerald-500' : 'border-red-500'
          }`}>
          {toastMsg.text}
        </div>
      )}

      {/* Back link */}
      <div className="text-left">
        <Link
          to="/packages"
          className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-slate-900 transition-colors font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách gói cước</span>
        </Link>
      </div>

      {/* Main Details Panel */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Price and Primary Action Card */}
        <div className="lg:col-span-1 bg-white border border-slate-100 shadow-sm rounded-2xl p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4 text-left">
            <div className="flex justify-between items-center">
              <span className="bg-red-50 border border-red-100/60 text-primary text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                {pkg.phan_loai_goi}
              </span>
              {pkg.dohot !== 'normal' && (
                <div className="flex items-center text-[10px] text-primary font-bold bg-red-500/10 px-2 py-0.5 rounded border border-primary/20">
                  <Sparkles className="w-3.5 h-3.5 mr-1 fill-primary text-primary" />
                  <span>NỔI BẬT</span>
                </div>
              )}
            </div>

            <h2 className="text-3xl font-extrabold text-slate-900 leading-tight">{pkg.ten}</h2>

            {isValid(pkg.uudaitrong) && (
              <p className="text-slate-600 text-xs leading-relaxed font-medium bg-red-50/20 p-4 rounded-xl border border-primary/10">
                {pkg.uudaitrong}
              </p>
            )}
          </div>

          <div className="space-y-4 border-t border-slate-50 pt-6">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl font-black text-primary">
                {new Intl.NumberFormat('vi-VN').format(pkg.gia)}
              </span>
              <span className="text-slate-500 text-xs font-bold">
                đ / {pkg.chu_ky_ngay} ngày
              </span>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={handleSubscribeClick}
                className="flex-1 bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-xl text-xs transition-colors flex items-center justify-center space-x-2 focus:outline-none cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>Đăng ký ngay</span>
              </button>
              <button
                onClick={handleCompareToggle}
                className={`p-3.5 rounded-xl border transition-colors focus:outline-none cursor-pointer ${isInCompare
                    ? 'bg-red-50 border-red-150 text-primary'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                title={isInCompare ? "Xóa khỏi so sánh" : "Thêm vào so sánh"}
              >
                <ArrowRightLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Benefits and Conditions */}
        <div className="lg:col-span-2 space-y-6 text-left">
          {/* Box 1: Detailed Allowances */}
          <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 md:p-8 space-y-6">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2 border-b border-slate-50 pb-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <span>Chi tiết ưu đãi dịch vụ</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Data Detail Block */}
              {isValid(pkg.data_theo_ngay) && (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-1">
                  <div className="flex items-center space-x-2">
                    <Wifi className="w-4.5 h-4.5 text-primary" />
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dung lượng Data</h4>
                  </div>
                  <p className="text-base font-black text-slate-950">{pkg.data_theo_ngay}</p>
                </div>
              )}

              {/* Calls Detail Block - Internal */}
              {isValid(pkg.free_noi_mang) && (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-1">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4.5 h-4.5 text-primary" />
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gọi Nội mạng</h4>
                  </div>
                  <p className="text-base font-black text-slate-950">{pkg.free_noi_mang}</p>
                </div>
              )}

              {/* Calls Detail Block - External */}
              {isValid(pkg.free_ngoai_mang) && (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-1">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4.5 h-4.5 text-primary" />
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gọi Ngoại mạng</h4>
                  </div>
                  <p className="text-base font-black text-slate-950">{pkg.free_ngoai_mang}</p>
                </div>
              )}

              {/* SMS Detail Block */}
              {isValid(pkg.sms) && (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-1">
                  <div className="flex items-center space-x-2">
                    <Info className="w-4.5 h-4.5 text-primary" />
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tin nhắn SMS</h4>
                  </div>
                  <p className="text-base font-black text-slate-950">{pkg.sms}</p>
                </div>
              )}

              {/* Free Apps Detail Block */}
              {isValid(pkg.noi_dung_ngoai) && (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-1 col-span-1 md:col-span-2">
                  <div className="flex items-center space-x-2">
                    <HelpCircle className="w-4.5 h-4.5 text-emerald-600" />
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ứng dụng miễn cước data</h4>
                  </div>
                  <p className="text-base font-black text-slate-950">{pkg.noi_dung_ngoai}</p>
                </div>
              )}

              {/* Free Utilities Detail Block */}
              {isValid(pkg.tien_ich_free) && (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-1 col-span-1 md:col-span-2">
                  <div className="flex items-center space-x-2">
                    <Info className="w-4.5 h-4.5 text-emerald-600" />
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tiện ích đi kèm</h4>
                  </div>
                  <p className="text-base font-black text-slate-950">{pkg.tien_ich_free}</p>
                </div>
              )}
            </div>
          </div>

          {/* Box 2: Terms and Conditions */}
          {(isValid(pkg.dieu_kien_dang_ky) || isValid(pkg.chinh_sach_ap_dung)) && (
            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 md:p-8 space-y-5">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-50 pb-3">Điều kiện và quy định sử dụng</h3>

              <div className="space-y-4 text-xs text-slate-600 font-medium">
                {isValid(pkg.dieu_kien_dang_ky) && (
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900">Đối tượng áp dụng:</h4>
                    <p className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 leading-relaxed">
                      {pkg.dieu_kien_dang_ky}
                    </p>
                  </div>
                )}

                {isValid(pkg.chinh_sach_ap_dung) && (
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900">Chính sách sử dụng:</h4>
                    <p className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 leading-relaxed">
                      {pkg.chinh_sach_ap_dung}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Box 3: Reg & Cancellation syntaxes */}
          <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 md:p-8 space-y-3.5 font-medium text-slate-600">
            {isValid(pkg.dangky) && (
              <div className="flex justify-between items-center py-1">
                <span>Cú pháp đăng ký nhanh:</span>
                <span className="font-bold text-slate-900 font-mono select-all bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-lg">{pkg.dangky}</span>
              </div>
            )}
            {isValid(pkg.huygiahan) && (
              <div className="flex justify-between items-center py-1 border-t border-slate-50 pt-2.5">
                <span>Hủy gia hạn:</span>
                <span className="font-bold text-slate-900 font-mono select-all bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-lg">{pkg.huygiahan}</span>
              </div>
            )}
            {isValid(pkg.huygoicuoc) && (
              <div className="flex justify-between items-center py-1 border-t border-slate-50 pt-2.5">
                <span>Hủy hoàn toàn gói cước:</span>
                <span className="font-bold text-slate-900 font-mono select-all bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-lg">{pkg.huygoicuoc}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Related Packages Showcase */}
      {relatedPackages.length > 0 && (
        <section className="space-y-6 pt-6 text-left">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xl font-bold text-slate-900">Gói cước liên quan</h3>
            <p className="text-slate-500 text-xs font-semibold">Các gói cước cùng thể loại hoặc phân khúc giá tương tự</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedPackages.map(rPkg => (
              <PackageCard
                key={rPkg.id}
                pkg={rPkg}
                onSubscribeSuccess={(msg) => showToast('success', msg)}
                onSubscribeError={(msg) => showToast('error', msg)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Subscription Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 max-w-sm w-full shadow-md animate-scale-up z-50 text-left">
            <h4 className="text-sm font-extrabold text-slate-900 mb-2">Xác nhận đăng ký</h4>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed font-semibold">
              Bạn có chắc chắn muốn đăng ký gói cước <strong className="text-primary">{pkg.ten}</strong> với giá{' '}
              <strong className="text-slate-900">{new Intl.NumberFormat('vi-VN').format(pkg.gia)}đ</strong>?
              Số tiền này sẽ được trừ trực tiếp vào tài khoản ví ảo của bạn.
            </p>
            <div className="flex space-x-3">
              <button
                disabled={isSubmitting}
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl text-xs transition-colors font-bold focus:outline-none"
              >
                Hủy
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleConfirmSubscribe}
                className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl text-xs transition-colors focus:outline-none cursor-pointer"
              >
                {isSubmitting ? 'Đang xử lý...' : 'Đăng ký ngay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
