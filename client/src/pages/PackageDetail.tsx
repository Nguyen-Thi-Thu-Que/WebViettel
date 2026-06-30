import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Wifi, Phone, ShieldCheck, ArrowLeft, Star, ArrowRightLeft, CreditCard, Sparkles, Users, Award } from 'lucide-react';
import { usePackageStore, useAuthStore } from '../store';
import PackageCard from '../components/PackageCard';

export default function PackageDetail() {
  const { id } = useParams<{ id: string }>();
  const { packages, addToCompare, compareList, removeFromCompare } = usePackageStore();
  const { currentUser, subscribePackage } = useAuthStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const pkg = packages.find(p => p.id === id);

  // Scroll to top when package changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  if (!pkg) {
    return (
      <div className="bg-white border border-slate-200 p-12 rounded-xl max-w-lg mx-auto text-center space-y-4 shadow-sm my-12 text-xs font-semibold">
        <h3 className="text-xl font-bold text-primary">Gói cước không tồn tại</h3>
        <p className="text-slate-500 text-xs">
          Gói cước bạn tìm kiếm không có trong hệ thống dữ liệu Viettel hoặc đã tạm ngưng cung cấp.
        </p>
        <Link
          to="/packages"
          className="inline-flex items-center space-x-1.5 bg-white border border-slate-200 text-slate-655 hover:bg-slate-50 hover:text-slate-900 font-bold px-5 py-2.5 rounded-lg text-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh mục</span>
        </Link>
      </div>
    );
  }

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 3000);
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

  const handleConfirmSubscribe = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      const res = subscribePackage(pkg);
      setIsSubmitting(false);
      setShowConfirm(false);
      if (res.success) {
        showToast('success', res.message);
      } else {
        showToast('error', res.message);
      }
    }, 800);
  };

  // Find 3 related packages from the same category or similarly priced
  const relatedPackages = packages
    .filter(p => p.id !== pkg.id && (p.category === pkg.category || Math.abs(p.price - pkg.price) <= 50000))
    .slice(0, 3);

  const getDurationLabel = (duration: typeof pkg.duration) => {
    switch (duration) {
      case 'daily': return 'Ngày';
      case 'weekly': return 'Tuần';
      case 'monthly': return 'Tháng';
      case 'yearly': return 'Năm';
    }
  };

  return (
    <div className="space-y-10 pb-16 relative animate-fade-in text-xs font-semibold">
      {/* Toast Notification */}
      {toastMsg && (
        <div className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-lg shadow-lg border-l-4 text-xs font-semibold animate-scale-up bg-white text-slate-800 ${
          toastMsg.type === 'success' ? 'border-emerald-500' : 'border-red-500'
        }`}>
          {toastMsg.text}
        </div>
      )}

      {/* Back link */}
      <div>
        <Link
          to="/packages"
          className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách gói cước</span>
        </Link>
      </div>

      {/* Main Details Panel */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Visual and Primary Action Card */}
        <div className="lg:col-span-1 bg-white border border-slate-200 shadow-sm rounded-xl p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <span className="bg-red-55 border border-red-100 text-primary text-[10px] font-bold px-3 py-1 rounded uppercase tracking-wider">
                {pkg.category === 'data' ? 'Siêu Data' : pkg.category === 'combo' ? 'Combo Gọi + Data' : 'Giải trí MXH'}
              </span>
              <div className="flex items-center text-xs text-slate-500">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500 mr-1.5" />
                <span className="font-bold text-slate-900">{pkg.rating}</span>
                <span className="ml-1">/5.0</span>
              </div>
            </div>

            <h2 className="text-3xl font-extrabold text-slate-900">{pkg.name}</h2>
            <p className="text-slate-600 text-xs leading-relaxed font-medium">{pkg.description}</p>

            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 flex items-center font-medium">
                  <Users className="w-4 h-4 mr-2 text-slate-400" />
                  Lượt đăng ký
                </span>
                <span className="font-bold text-slate-800">{pkg.registrationsCount.toLocaleString()} người</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 flex items-center font-medium">
                  <Award className="w-4 h-4 mr-2 text-slate-400" />
                  Độ ổn định sóng
                </span>
                <span className="font-bold text-emerald-600">99.9% 5G</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 border-t border-slate-100 pt-6 mt-6">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl font-black text-primary">
                {new Intl.NumberFormat('vi-VN').format(pkg.price)}
              </span>
              <span className="text-slate-500 text-xs font-bold">
                đ / {getDurationLabel(pkg.duration)} ({pkg.durationDays} ngày)
              </span>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={handleSubscribeClick}
                className="flex-1 bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-lg text-xs transition-colors flex items-center justify-center space-x-2 focus:outline-none"
              >
                <CreditCard className="w-4 h-4" />
                <span>Đăng ký ngay</span>
              </button>
              <button
                onClick={handleCompareToggle}
                className={`p-3 rounded-lg border transition-colors focus:outline-none ${
                  isInCompare
                    ? 'bg-red-50 border-red-100 text-primary'
                    : 'bg-slate-55 border-slate-200 text-slate-500 hover:text-slate-850 hover:bg-slate-100'
                }`}
                title={isInCompare ? "Xóa khỏi so sánh" : "Thêm vào so sánh"}
              >
                <ArrowRightLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Benefits and Conditions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Box 1: Detailed Allowances */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 md:p-8 space-y-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span>Chi tiết ưu đãi ưu việt</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Data Detail Block */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center space-x-2">
                  <Wifi className="w-5 h-5 text-primary" />
                  <h4 className="text-xs font-bold text-slate-600">Dung lượng Data</h4>
                </div>
                <p className="text-lg font-black text-slate-950">{pkg.dataLimit}</p>
                <p className="text-[10px] text-slate-500 font-medium">Tốc độ cao 4G/5G chất lượng hàng đầu.</p>
              </div>

              {/* Calls Detail Block */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center space-x-2">
                  <Phone className="w-5 h-5 text-primary" />
                  <h4 className="text-xs font-bold text-slate-600">Thoại Nội & Ngoại mạng</h4>
                </div>
                <p className="text-lg font-black text-slate-955">
                  {pkg.voiceFreeInternalMin > 0 ? 'Nội mạng Free' : 'Không có'}
                </p>
                <p className="text-[10px] text-slate-505 font-medium">
                  {pkg.voiceFreeInternalMin > 0 ? `Miễn phí gọi dưới ${pkg.id === 'v50c' || pkg.id === 'mxh120' ? '10' : '20'}p. ` : ''}
                  {pkg.voiceFreeExternalMin > 0 ? `Tặng ${pkg.voiceFreeExternalMin} phút ngoại mạng.` : ''}
                </p>
              </div>

              {/* Social Detail Block */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <h4 className="text-xs font-bold text-slate-600">Dịch vụ tích hợp</h4>
                </div>
                <p className="text-lg font-black text-slate-955">
                  {pkg.socialFreeApps.length > 0 ? 'Free Social Data' : 'Cơ bản'}
                </p>
                <p className="text-[10px] text-slate-505 font-medium">
                  {pkg.socialFreeApps.length > 0
                    ? `Miễn phí data app: ${pkg.socialFreeApps.join(', ')}`
                    : 'Tính dung lượng data bình thường.'}
                </p>
              </div>
            </div>
          </div>

          {/* Box 2: Terms and Conditions */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 md:p-8 space-y-5">
            <h3 className="text-lg font-bold text-slate-900">Điều kiện và điều khoản chi tiết</h3>
            
            <div className="space-y-4 text-xs text-slate-700 font-medium">
              <div>
                <h4 className="font-bold text-slate-800 mb-1.5">Đối tượng áp dụng:</h4>
                <p className="bg-slate-50 border border-slate-200 rounded-lg p-3 leading-relaxed text-slate-600 font-medium">
                  {pkg.conditions}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2">Quy định sử dụng chi tiết:</h4>
                <ul className="list-disc pl-5 space-y-2 text-slate-600 leading-relaxed font-medium">
                  {pkg.terms.map((term, i) => (
                    <li key={i}>{term}</li>
                  ))}
                  <li>Gói cước có tính năng tự động gia hạn sau chu kỳ đăng ký thành công nếu tài khoản gốc lớn hơn hoặc bằng giá gói cước.</li>
                  <li>Cú pháp hủy gia hạn soạn: HUY [TênGói] gửi 191.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Packages Showcase */}
      {relatedPackages.length > 0 && (
        <section className="space-y-6 pt-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Gói cước liên quan</h3>
            <p className="text-slate-500 text-xs mt-1 font-semibold">Các gói cước cùng chuyên mục hoặc phân khúc giá tương tự</p>
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-sm w-full shadow-md animate-scale-up z-50">
            <h4 className="text-base font-extrabold text-slate-900 mb-2">Xác nhận đăng ký</h4>
            <p className="text-xs text-slate-650 mb-5 leading-relaxed font-semibold">
              Bạn có chắc chắn muốn đăng ký gói cước <strong className="text-primary">{pkg.name}</strong> với giá{' '}
              <strong className="text-slate-900">{new Intl.NumberFormat('vi-VN').format(pkg.price)}đ</strong>? 
              Số tiền này sẽ được trừ trực tiếp vào tài khoản ví ảo của bạn.
            </p>
            <div className="flex space-x-3">
              <button
                disabled={isSubmitting}
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs transition-colors font-bold"
              >
                Hủy
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleConfirmSubscribe}
                className="flex-1 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg text-xs transition-colors"
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
