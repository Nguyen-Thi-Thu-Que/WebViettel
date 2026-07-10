import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Wifi,
  ArrowLeft,
  ArrowRightLeft,
  CreditCard,
  Copy,
  Check,
  AlertCircle
} from 'lucide-react';
import { usePackageStore, useAuthStore } from '../store';
import PackageCard from '../components/PackageCard';
import SEO from '../components/SEO';
import Breadcrumb from '../components/Breadcrumb';
import { calculateSimilarity } from '../utils/similarity';
import { canViewPackage } from '../utils/permission';
import type { Package } from '../types';
import RegisterModal from '../components/RegisterModal';

function DetailSkeleton() {
  return (
    <div className="space-y-6 pb-16 animate-pulse text-left">
      {/* Breadcrumb skeleton */}
      <div className="h-4 bg-slate-200 rounded w-1/4 mb-6"></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column Skeleton */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
          <div className="space-y-3">
            <div className="h-4 bg-slate-200 rounded w-1/3"></div>
            <div className="h-8 bg-slate-200 rounded w-2/3"></div>
          </div>
          <div className="h-20 bg-slate-100 rounded-xl"></div>
          <div className="pt-6 border-t border-slate-100 space-y-4">
            <div className="h-8 bg-slate-200 rounded w-1/2"></div>
            <div className="h-12 bg-slate-200 rounded w-full"></div>
          </div>
        </div>

        {/* Right Column Skeleton */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
            <div className="h-6 bg-slate-200 rounded w-1/4"></div>
            <div className="h-16 bg-slate-50 rounded-xl"></div>
            <div className="h-16 bg-slate-50 rounded-xl"></div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <div className="h-6 bg-slate-200 rounded w-1/4"></div>
            <div className="h-20 bg-slate-50 rounded-xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PackageDetail() {
  const { ma_goi } = useParams<{ ma_goi: string }>();
  const {
    currentPackage: pkg,
    loading,
    error,
    fetchPackageById,
    packages,
    fetchPackages,
    addToCompare,
    compareList,
    removeFromCompare
  } = usePackageStore();
  const { currentUser, registerSubscription, checkSubscription, activeSubscriptions } = useAuthStore();
  console.log('PACKAGE_DETAIL_RENDER', activeSubscriptions);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkResult, setCheckResult] = useState<{
    action: 'ALLOW' | 'REPLACE' | 'REJECT';
    message: string;
    replaceSubscriptions?: any[];
    conflictSubscriptions?: any[];
  } | null>(null);
  const [selectedRelatedPkg, setSelectedRelatedPkg] = useState<Package | null>(null);
  const [isRelatedModalOpen, setIsRelatedModalOpen] = useState(false);

  const handleSubscribeOpenForRelated = (rPkg: Package) => {
    if (!currentUser) {
      showToast('error', 'Vui lòng đăng nhập để đăng ký gói cước.');
      return;
    }
    setSelectedRelatedPkg(rPkg);
    setIsRelatedModalOpen(true);
  };

  // Auto scroll to top on router parameter change
  useEffect(() => {
    if (ma_goi) {
      fetchPackageById(ma_goi);
    }
    if (packages.length === 0) {
      fetchPackages();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [ma_goi, fetchPackageById, packages.length, fetchPackages]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedText(type);
        showToast('success', `Đã sao chép: ${text}`);
        setTimeout(() => setCopiedText(null), 2000);
      })
      .catch(err => {
        console.error("Failed to copy:", err);
        showToast('error', 'Không thể sao chép.');
      });
  };

  const handleReload = () => {
    if (ma_goi) {
      fetchPackageById(ma_goi);
    }
  };

  const isValid = (val: any) => {
    if (
      val === 0 ||
      val === '0' ||
      val === '0GB' ||
      val === '0 GB' ||
      val === null ||
      val === undefined ||
      val === '' ||
      val === '_'
    ) {
      return false;
    }
    return true;
  };

  if (pkg) {
    console.log("========== PACKAGEDETAIL RENDER pkg ==========");
    console.log("PackageDetail pkg object:", pkg);
    console.log("id =", pkg.id);
    console.log("numericId =", (pkg as any).numericId);
    console.log("dbId =", (pkg as any).dbId);
  }

  if (loading) {
    return <DetailSkeleton />;
  }

  if (error) {
    const isPermissionError = error.includes('không có quyền') || error.includes('quyền xem');
    return (
      <div className="bg-white border border-slate-200 p-12 rounded-2xl max-w-lg mx-auto text-center space-y-5 shadow-sm my-12 text-xs font-semibold animate-scale-up">
        <AlertCircle className="w-12 h-12 text-primary mx-auto" />
        <h3 className="text-lg font-extrabold text-slate-900">
          {isPermissionError ? 'Từ chối truy cập' : 'Không thể tải dữ liệu'}
        </h3>
        <p className="text-slate-500 font-medium">
          {error || 'Đã xảy ra lỗi kết nối khi lấy thông tin gói cước từ hệ thống Viettel.'}
        </p>
        <div className="flex justify-center space-x-3 pt-2">
          <Link
            to="/packages"
            className="inline-flex items-center space-x-1.5 bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 font-bold px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại danh mục</span>
          </Link>
          {!isPermissionError && (
            <button
              onClick={handleReload}
              className="inline-flex items-center space-x-1.5 bg-primary hover:bg-primary-hover text-white font-bold px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
              type="button"
            >
              Tải lại
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="bg-white border border-slate-200 p-12 rounded-2xl max-w-lg mx-auto text-center space-y-5 shadow-sm my-12 text-xs font-semibold animate-scale-up">
        <AlertCircle className="w-12 h-12 text-primary mx-auto" />
        <h3 className="text-lg font-extrabold text-slate-900">Không tìm thấy gói cước</h3>
        <p className="text-slate-500 font-medium">
          Gói cước di động bạn tìm kiếm không tồn tại trên hệ thống hoặc đã tạm ngừng đăng ký.
        </p>
        <Link
          to="/packages"
          className="inline-flex items-center space-x-1.5 bg-primary hover:bg-primary-hover text-white font-bold px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách</span>
        </Link>
      </div>
    );
  }

  if (!canViewPackage(currentUser, pkg)) {
    return (
      <div className="bg-white border border-slate-200 p-12 rounded-2xl max-w-lg mx-auto text-center space-y-5 shadow-sm my-12 text-xs font-semibold animate-scale-up text-left">
        <AlertCircle className="w-12 h-12 text-primary mx-auto" />
        <h3 className="text-lg font-extrabold text-slate-900 text-center">Từ chối truy cập</h3>
        <p className="text-slate-500 font-medium text-center">
          Bạn không có quyền xem gói cước này.
        </p>
        <div className="flex justify-center pt-2">
          <Link
            to="/packages"
            className="inline-flex items-center space-x-1.5 bg-primary hover:bg-primary-hover text-white font-bold px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại danh sách</span>
          </Link>
        </div>
      </div>
    );
  }

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
      showToast('error', 'Vui lòng đăng nhập để đăng ký gói cước.');
      return;
    }
    setCheckResult(null);
    setCheckLoading(false);
    setShowConfirm(true);
  };

  const handleConfirmSubscribe = async () => {
    if (currentUser && currentUser.balance < pkg.gia) {
      showToast('error', 'Số dư tài khoản không đủ để đăng ký gói cước này.');
      setShowConfirm(false);
      return;
    }

    let cycle: 'DAY' | 'MONTH' | 'YEAR' = 'MONTH';
    const dayCycle = parseInt(pkg.chu_ky_ngay || '30', 10);
    if (dayCycle === 1) {
      cycle = 'DAY';
    } else if (dayCycle >= 360) {
      cycle = 'YEAR';
    }

    if (!checkResult) {
      setCheckLoading(true);
      try {
        const res = await checkSubscription(pkg.numericId || Number(pkg.id) || 0, cycle);
        if (res.hasActive === false) {
          // If no active subscriptions, register immediately!
          setIsSubmitting(true);
          try {
            const regRes = await registerSubscription(pkg.numericId || Number(pkg.id) || 0, cycle);
            setShowConfirm(false);
            if (regRes.success) {
              showToast('success', regRes.message);
            } else {
              showToast('error', regRes.message);
            }
          } catch (err: any) {
            setShowConfirm(false);
            showToast('error', err.message || 'Lỗi đăng ký gói cước.');
          } finally {
            setIsSubmitting(false);
          }
        } else {
          setCheckResult(res);
        }
      } catch (err: any) {
        showToast('error', err.message || 'Lỗi kiểm tra xung đột gói cước.');
        setShowConfirm(false);
      } finally {
        setCheckLoading(false);
      }
    } else {
      if (checkResult.action === 'ALLOW' || checkResult.action === 'REPLACE') {
        setIsSubmitting(true);
        try {
          const res = await registerSubscription(pkg.numericId || Number(pkg.id) || 0, cycle);
          setShowConfirm(false);
          if (res.success) {
            showToast('success', res.message);
          } else {
            showToast('error', res.message);
          }
        } catch (err: any) {
          setShowConfirm(false);
          showToast('error', err.message || 'Lỗi đăng ký gói cước.');
        } finally {
          setIsSubmitting(false);
        }
      }
    }
  };

  const getCycleLabel = (cycleDays: string) => {
    if (!cycleDays) return '—';
    return cycleDays.includes('ngày') ? cycleDays : `${cycleDays} ngày`;
  };

  // Find related packages sorted by similarity score + fallback to do_uu_tien
  const relatedPackages = packages
    .filter(p => p.id !== pkg.id && canViewPackage(currentUser, p))
    .map(p => ({
      pkg: p,
      score: calculateSimilarity(pkg, p)
    }))
    .sort((a, b) => b.score - a.score || parseInt(b.pkg.ma_goi || '0') - parseInt(a.pkg.ma_goi || '0'))
    .map(item => item.pkg)
    .slice(0, 3);

  // SEO dynamic values
  const formattedPrice = new Intl.NumberFormat('vi-VN').format(pkg.gia);
  const cycleLabel = `${pkg.chu_ky_ngay} ngày`;
  const seoTitle = `${pkg.ma_goi || pkg.ten} - Gói cước Viettel ${formattedPrice}đ | Website`;
  const seoDescription = `Đăng ký gói ${pkg.ma_goi || pkg.ten} Viettel giá ${formattedPrice}đ, nhận ưu đãi ${pkg.data_theo_ngay || 'data khủng'} trong chu kỳ ${cycleLabel}.`;
  const canonicalUrl = `${window.location.origin}/goi-cuoc/${pkg.ma_goi || pkg.id}`;

  const detailSchemas = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": `Gói Cước ${pkg.ten} Viettel`,
      "description": pkg.uudaitrong || seoDescription,
      "image": `${window.location.origin}/og-image.jpg`,
      "brand": {
        "@type": "Brand",
        "name": "Viettel"
      },
      "offers": {
        "@type": "Offer",
        "url": canonicalUrl,
        "price": pkg.gia,
        "priceCurrency": "VND",
        "availability": "https://schema.org/InStock",
        "seller": {
          "@type": "Organization",
          "name": "Viettel"
        }
      }
    }
  ];

  const breadcrumbItems = [
    { label: 'Gói cước', path: '/packages' },
    { label: pkg.ma_goi || pkg.ten }
  ];

  return (
    <div className="space-y-6 pb-16 relative animate-fade-in text-xs font-semibold text-left">
      {/* SEO configuration */}
      <SEO
        title={seoTitle}
        description={seoDescription}
        schema={detailSchemas}
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-lg shadow-lg border-l-4 text-xs font-bold bg-white text-slate-800 ${
          toastMsg.type === 'success' ? 'border-l-emerald-500' : 'border-l-red-500'
        }`}>
          {toastMsg.text}
        </div>
      )}

      {/* Breadcrumbs */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Main Details Panel */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Price and Primary Action Card */}
        <div className="lg:col-span-1 bg-white border border-slate-200 shadow-sm rounded-2xl p-6 flex flex-col justify-between space-y-6 h-fit">
          <div className="space-y-4 text-left">
            <h2 className="text-2xl font-extrabold text-slate-900 leading-tight">
              {pkg.ma_goi ? `${pkg.ma_goi} - ${pkg.ten}` : pkg.ten}
            </h2>
          </div>

          <div className="space-y-4 border-t border-slate-100 pt-6">
            {/* Info Group 1: Thông tin cơ bản */}
            <div className="space-y-2 text-slate-600 font-medium">
              <div className="flex justify-between items-center">
                <span>Tên gói:</span>
                <span className="font-extrabold text-slate-950">{pkg.ten}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-50 pt-2">
                <span>Giá cước:</span>
                <span className="font-extrabold text-slate-950 text-sm">{formattedPrice}đ</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-50 pt-2">
                <span>Chu kỳ sử dụng:</span>
                <span className="font-extrabold text-slate-950">{cycleLabel}</span>
              </div>
              {isValid(pkg.data_theo_ngay) && (
                <div className="flex justify-between items-center border-t border-slate-50 pt-2">
                  <span className="flex items-center gap-1">
                    <Wifi className="w-3.5 h-3.5 text-primary" />
                    <span>Data:</span>
                  </span>
                  <span className="font-extrabold text-slate-950">{pkg.data_theo_ngay}</span>
                </div>
              )}
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
          {/* Info Group 2: Nội dung ưu đãi */}
          {isValid(pkg.uudaitrong) && (
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 md:p-8 space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Nội dung ưu đãi</h3>
              <p className="text-slate-600 text-xs leading-relaxed font-medium bg-red-50/10 p-4 rounded-xl border border-primary/10">
                {pkg.uudaitrong}
              </p>
            </div>
          )}

          {/* Info Group 3: Điều kiện đăng ký & chính sách sử dụng */}
          {(isValid(pkg.dieu_kien_dang_ky) || isValid(pkg.chinh_sach_ap_dung)) && (
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 md:p-8 space-y-5">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Điều kiện & quy định sử dụng</h3>

              <div className="space-y-4 text-xs text-slate-600 font-medium">
                {isValid(pkg.dieu_kien_dang_ky) && (
                  <div className="space-y-1.5">
                    <h4 className="font-extrabold text-slate-900">Điều kiện đăng ký:</h4>
                    <p className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 leading-relaxed font-medium">
                      {pkg.dieu_kien_dang_ky}
                    </p>
                  </div>
                )}

                {isValid(pkg.chinh_sach_ap_dung) && (
                  <div className="space-y-1.5">
                    <h4 className="font-extrabold text-slate-900">Chính sách sử dụng:</h4>
                    <p className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 leading-relaxed font-medium">
                      {pkg.chinh_sach_ap_dung}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Info Group 4: Cú pháp nhắn tin qua đầu số 191 */}
          {(isValid(pkg.dangky) || isValid(pkg.huygiahan) || isValid(pkg.huygoicuoc)) && (
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 md:p-8 space-y-4 font-medium text-slate-600">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Cú pháp sử dụng</h3>

              <div className="space-y-3 pt-2">
                {isValid(pkg.dangky) && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-1">
                    <span>Đăng ký:</span>
                    <div className="flex items-center space-x-2 self-start sm:self-auto">
                      <span className="font-extrabold text-slate-900 font-mono select-all bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-lg text-[13px]">
                        {pkg.dangky}
                      </span>
                      <button
                        onClick={() => handleCopy(pkg.dangky, 'dangky')}
                        className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 hover:text-slate-900 transition-colors focus:outline-none flex items-center justify-center cursor-pointer"
                        title="Sao chép cú pháp"
                      >
                        {copiedText === 'dangky' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {isValid(pkg.huygoicuoc) && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-1 border-t border-slate-50 pt-3">
                    <span>Hủy gói:</span>
                    <div className="flex items-center space-x-2 self-start sm:self-auto">
                      <span className="font-extrabold text-slate-900 font-mono select-all bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-lg text-[13px]">
                        {pkg.huygoicuoc}
                      </span>
                      <button
                        onClick={() => handleCopy(pkg.huygoicuoc, 'huygoicuoc')}
                        className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 hover:text-slate-900 transition-colors focus:outline-none flex items-center justify-center cursor-pointer"
                        title="Sao chép cú pháp"
                      >
                        {copiedText === 'huygoicuoc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {isValid(pkg.huygiahan) && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-1 border-t border-slate-50 pt-3">
                    <span>Hủy gia hạn:</span>
                    <div className="flex items-center space-x-2 self-start sm:self-auto">
                      <span className="font-extrabold text-slate-900 font-mono select-all bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-lg text-[13px]">
                        {pkg.huygiahan}
                      </span>
                      <button
                        onClick={() => handleCopy(pkg.huygiahan, 'huygiahan')}
                        className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 hover:text-slate-900 transition-colors focus:outline-none flex items-center justify-center cursor-pointer"
                        title="Sao chép cú pháp"
                      >
                        {copiedText === 'huygiahan' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Related Packages Showcase */}
      {relatedPackages.length > 0 && (
        <section className="space-y-6 pt-6 text-left border-t border-slate-150">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Gói cước liên quan</h3>
            <p className="text-slate-500 text-xs font-semibold">Các gói cước cùng thể loại hoặc chu kỳ tương tự</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedPackages.map(rPkg => (
              <PackageCard
                key={rPkg.id}
                pkg={rPkg}
                onSubscribe={handleSubscribeOpenForRelated}
              />
            ))}
          </div>
        </section>
      )}

      {/* Subscription Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-md animate-scale-up z-50 text-left space-y-5">
            <h4 className="text-base font-extrabold text-slate-900 border-b border-slate-50 pb-2">Xác nhận đăng ký</h4>
            
            {/* Nhóm 1 – Thông tin gói cước */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thông tin gói cước</h5>
              <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Tên gói cước:</span>
                  <span className="font-extrabold text-slate-900">{pkg.ten} ({pkg.ma_goi})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Giá gói:</span>
                  <span className="font-extrabold text-slate-900">{pkg.gia.toLocaleString()} VNĐ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Chu kỳ sử dụng:</span>
                  <span className="font-extrabold text-slate-900">{getCycleLabel(pkg.chu_ky_ngay)}</span>
                </div>
              </div>
            </div>

            {/* Nhóm 2 – Thanh toán */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thanh toán</h5>
              <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Phương thức:</span>
                  <span className="font-bold text-slate-900">Số dư tài khoản</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Số dư hiện tại:</span>
                  <span className="font-bold text-slate-900">{(currentUser?.balance || 0).toLocaleString()} VNĐ</span>
                </div>
                {currentUser && currentUser.balance >= pkg.gia ? (
                  <div className="flex justify-between border-t border-slate-100/50 pt-1.5 mt-1.5">
                    <span className="text-slate-500 font-semibold">Số dư dự kiến:</span>
                    <span className="font-bold text-emerald-600">{(currentUser.balance - pkg.gia).toLocaleString()} VNĐ</span>
                  </div>
                ) : (
                  <div className="text-[10px] text-red-650 bg-red-50/60 border border-red-100 rounded-lg p-2 leading-relaxed font-semibold">
                    Số dư hiện tại có thể không đủ để đăng ký gói cước này. Hệ thống sẽ kiểm tra lại khi bạn xác nhận.
                  </div>
                )}
              </div>
            </div>

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

            {/* Nhóm 4 – Lưu ý */}
            {!checkResult && (
              <div className="space-y-1.5">
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lưu ý</h5>
                <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                  Sau khi xác nhận đăng ký, hệ thống sẽ tiến hành kiểm tra xung đột gói cước và trừ số dư trong tài khoản để kích hoạt gói mới.
                </p>
              </div>
            )}

            {/* Nút thao tác */}
            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                disabled={isSubmitting || checkLoading}
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 bg-slate-50 border border-slate-200 text-slate-605 hover:text-slate-950 hover:bg-slate-100 rounded-xl text-xs transition-colors font-bold focus:outline-none cursor-pointer disabled:opacity-50"
              >
                {checkResult?.action === 'REJECT' ? 'Đóng' : 'Hủy'}
              </button>
              {(!checkResult || checkResult.action !== 'REJECT') && (
                <button
                  type="button"
                  disabled={isSubmitting || checkLoading}
                  onClick={handleConfirmSubscribe}
                  className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl text-xs transition-colors focus:outline-none cursor-pointer disabled:opacity-50 flex items-center justify-center"
                >
                  {checkLoading ? 'Đang kiểm tra...' : isSubmitting ? 'Đang xử lý...' : checkResult ? 'Xác nhận' : 'Xác nhận đăng ký'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Related Package RegisterModal */}
      {selectedRelatedPkg && (
        <RegisterModal
          isOpen={isRelatedModalOpen}
          onClose={() => {
            setSelectedRelatedPkg(null);
            setIsRelatedModalOpen(false);
          }}
          pkg={selectedRelatedPkg}
          onSuccess={(msg) => showToast('success', msg)}
          onError={(msg) => showToast('error', msg)}
        />
      )}
    </div>
  );
}
