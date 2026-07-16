import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightLeft, X, Plus, Check, ShieldAlert } from 'lucide-react';
import { usePackageStore, useAuthStore } from '../store';
import type { Package } from '../types';
import SEO from '../components/SEO';
import RegisterModal from '../components/RegisterModal';
import { compareAIService } from '../services/compareAIService';
import CompareAI from '../components/CompareAI';
import { compareApi } from '../services/api';

interface RowSpec {
  key: string;
  label: string;
  getValue: (pkg: Package) => any;
  renderCell: (pkg: Package) => React.ReactNode;
}

export default function Compare() {
  const { compareList, packages, removeFromCompare, addToCompare, clearCompare, fetchPackages, loading, error } = usePackageStore();
  const { currentUser } = useAuthStore();
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showAddSelector, setShowAddSelector] = useState(false);
  const [selectedPkgIdToAdd, setSelectedPkgIdToAdd] = useState('');
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState('');

  const aiAnalysis = useMemo(() => {
    if (compareList.length < 2) return null;
    try {
      return compareAIService.analyzePackages(compareList);
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [compareList]);

  // Helper: Generate unique IDs
  const generateId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  // Session tracking refs
  const sessionIdRef = useRef<string>('');
  const guestIdRef = useRef<string>('');
  const packagesComparedRef = useRef<Set<string>>(new Set());
  const viewedDetailPackagesRef = useRef<Set<string>>(new Set());
  const startTimeRef = useRef<number>(0);
  const hasSavedRef = useRef<boolean>(false);
  const compareListRef = useRef<Package[]>([]);

  // Sync compare list ref
  useEffect(() => {
    compareListRef.current = compareList;
    compareList.forEach(pkg => {
      packagesComparedRef.current.add(pkg.id);
    });
  }, [compareList]);

  // Initialize Session
  useEffect(() => {
    sessionIdRef.current = 'sess_' + generateId();
    startTimeRef.current = Date.now();
    hasSavedRef.current = false;
    packagesComparedRef.current = new Set(compareList.map(p => p.id));
    viewedDetailPackagesRef.current = new Set();

    let gId = localStorage.getItem('guest_compare_id');
    if (!gId) {
      gId = 'guest_' + generateId();
      localStorage.setItem('guest_compare_id', gId);
    }
    guestIdRef.current = gId;
  }, []);

  const saveSessionSync = (finalState: {
    completed: boolean;
    status: string;
    selected_package?: string | null;
    cleared_by_user?: boolean;
    cleared_at?: string | null;
  }) => {
    if (hasSavedRef.current) return;
    hasSavedRef.current = true;

    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    const payload = {
      session_id: sessionIdRef.current,
      user_id: currentUser ? parseInt(currentUser.id, 10) : null,
      guest_id: guestIdRef.current,
      is_guest: !currentUser,
      packages_compared: Array.from(packagesComparedRef.current),
      final_packages: compareListRef.current.map(p => p.id),
      selected_package: finalState.selected_package || null,
      compare_count: packagesComparedRef.current.size,
      compare_duration: duration,
      viewed_detail_packages: Array.from(viewedDetailPackagesRef.current),
      completed: finalState.completed,
      cleared_by_user: finalState.cleared_by_user || false,
      status: finalState.status,
      cleared_at: finalState.cleared_at || null
    };

    const token = localStorage.getItem('token');
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch('/api/compare/session', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(err => console.error('Error saving compare session keepalive:', err));
  };

  const saveSessionAsync = async (finalState: {
    completed: boolean;
    status: string;
    selected_package?: string | null;
    cleared_by_user?: boolean;
    cleared_at?: string | null;
  }) => {
    if (hasSavedRef.current) return;
    hasSavedRef.current = true;

    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    const payload = {
      session_id: sessionIdRef.current,
      user_id: currentUser ? parseInt(currentUser.id, 10) : null,
      guest_id: guestIdRef.current,
      is_guest: !currentUser,
      packages_compared: Array.from(packagesComparedRef.current),
      final_packages: compareListRef.current.map(p => p.id),
      selected_package: finalState.selected_package || null,
      compare_count: packagesComparedRef.current.size,
      compare_duration: duration,
      viewed_detail_packages: Array.from(viewedDetailPackagesRef.current),
      completed: finalState.completed,
      cleared_by_user: finalState.cleared_by_user || false,
      status: finalState.status,
      cleared_at: finalState.cleared_at || null
    };

    try {
      await compareApi.saveSession(payload);
    } catch (err) {
      console.error('Error saving compare session async:', err);
    }
  };

  // Save session on page leave
  useEffect(() => {
    return () => {
      saveSessionSync({ completed: false, status: 'ABANDONED' });
    };
  }, []);

  // Save session on browser refresh/close
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveSessionSync({ completed: false, status: 'ABANDONED' });
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Inactivity tracking (60 seconds)
  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;

    const resetInactivityTimer = () => {
      if (hasSavedRef.current) return;
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        saveSessionAsync({ completed: false, status: 'ABANDONED' });
      }, 60000);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, resetInactivityTimer);
    });

    resetInactivityTimer();

    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(event => {
        window.removeEventListener(event, resetInactivityTimer);
      });
    };
  }, [compareList]);

  const handleClearCompare = () => {
    saveSessionSync({
      completed: false,
      status: 'CLEARED',
      cleared_by_user: true,
      cleared_at: new Date().toISOString()
    });

    clearCompare();
    sessionIdRef.current = 'sess_' + generateId();
    startTimeRef.current = Date.now();
    hasSavedRef.current = false;
    packagesComparedRef.current = new Set();
    viewedDetailPackagesRef.current = new Set();
  };

  useEffect(() => {
    if (packages.length === 0) {
      fetchPackages();
    }
  }, [packages.length, fetchPackages]);

  if (loading && packages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-xs font-semibold text-slate-500 space-y-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="animate-pulse">Đang tải dữ liệu...</span>
      </div>
    );
  }

  if (error && packages.length === 0) {
    return (
      <div className="bg-white border border-slate-200 p-12 rounded-2xl max-w-lg mx-auto text-center space-y-5 shadow-sm my-12 text-xs font-semibold">
        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-primary mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-extrabold text-slate-900">Không thể tải dữ liệu</h3>
        <p className="text-slate-500 font-medium">{error}</p>
        <button
          onClick={() => fetchPackages()}
          className="inline-flex items-center space-x-1.5 bg-primary hover:bg-primary-hover text-white font-bold px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
        >
          Thử lại
        </button>
      </div>
    );
  }

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
        setModalSearchQuery('');
      } else {
        showToast('error', res.message);
      }
    }
  };

  const handleSubscribeOpen = (pkg: Package) => {
    if (!currentUser) {
      showToast('error', 'Vui lòng đăng nhập để đăng ký gói cước.');
      return;
    }
    
    // Save session as completed
    saveSessionAsync({
      completed: true,
      status: 'COMPLETED',
      selected_package: pkg.id
    });

    setSelectedPkg(pkg);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setSelectedPkg(null);
    setIsModalOpen(false);
  };

  const isValid = (val: any) => {
    return val !== 0 && val !== '0' && val !== null && val !== undefined && val !== '' && val !== false;
  };


  // Normalization Helpers
  const normalizeStringList = (str: string) => {
    if (!str || str === '0') return '';
    return str
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => {
        const lower = s.toLowerCase();
        if (lower === 'youtube' || lower === 'yt') return 'YouTube';
        if (lower === 'tiktok') return 'TikTok';
        if (lower === 'facebook' || lower === 'fb') return 'Facebook';
        if (lower === 'tv360') return 'TV360';
        return s.charAt(0).toUpperCase() + s.slice(1);
      })
      .join(' • ');
  };

  const normalizeDataLimit = (str: string) => {
    if (!str || str === '0') return '';
    return str
      .replace(/(\d+)\s*(GB|MB|KB)/gi, '$1 $2')
      .replace(/ngày/gi, 'ngày');
  };

  const formatCycle = (daysStr: string) => {
    const days = parseInt(daysStr);
    if (isNaN(days)) return daysStr;
    if (days === 1) return 'Hàng ngày (1 ngày)';
    if (days === 7) return 'Tuần (7 ngày)';
    if (days === 30) return 'Tháng (30 ngày)';
    if (days === 90) return '3 tháng (90 ngày)';
    if (days === 180) return '6 tháng (180 ngày)';
    if (days >= 360) return `Năm (${days} ngày)`;
    return `${days} ngày`;
  };

  const getUtilitiesValue = (pkg: Package) => {
    const parts: string[] = [];
    if (isValid(pkg.tien_ich_free)) parts.push(pkg.tien_ich_free);
    if (isValid(pkg.noi_dung_ngoai)) parts.push(pkg.noi_dung_ngoai);
    if (parts.length === 0) return null;
    return normalizeStringList(parts.join(','));
  };



  const availablePackagesToSelect = packages.filter(p => !compareList.some(cp => cp.id === p.id));

  const filteredAvailablePackages = availablePackagesToSelect.filter(p => {
    const q = modalSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (p.ma_goi || '').toLowerCase().includes(q) || p.ten.toLowerCase().includes(q);
  });

  // Dynamic comparison criteria rows specification
  const rowSpecs: RowSpec[] = [
    {
      key: 'price',
      label: 'Giá cước',
      getValue: (pkg) => pkg.gia,
      renderCell: (pkg) => (
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="text-base font-black text-primary">
            {new Intl.NumberFormat('vi-VN').format(pkg.gia)}đ
          </span>
          {aiAnalysis?.bestTags[pkg.id]?.isCheapest && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/15">
              Tốt nhất
            </span>
          )}
        </div>
      )
    },
    {
      key: 'cycle',
      label: 'Chu kỳ sử dụng',
      getValue: (pkg) => pkg.chu_ky_ngay,
      renderCell: (pkg) => (
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="font-bold text-slate-800">
            {formatCycle(pkg.chu_ky_ngay)}
          </span>
          {aiAnalysis?.bestTags[pkg.id]?.isLongestCycle && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/15">
              Tốt nhất
            </span>
          )}
        </div>
      )
    },
    {
      key: 'data',
      label: 'Data',
      getValue: (pkg) => pkg.has_data ? pkg.data_theo_ngay : null,
      renderCell: (pkg) => (
        <div className="flex items-center flex-wrap gap-1.5">
          <p className="font-extrabold text-slate-900 text-[13px]">
            {normalizeDataLimit(pkg.data_theo_ngay)}
          </p>
          {aiAnalysis?.bestTags[pkg.id]?.isMaxData && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/15">
              Tốt nhất
            </span>
          )}
        </div>
      )
    },
    {
      key: 'voice_internal',
      label: 'Gọi nội mạng',
      getValue: (pkg) => pkg.has_voice && isValid(pkg.free_noi_mang) ? pkg.free_noi_mang : null,
      renderCell: (pkg) => (
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="flex items-center text-emerald-600 font-bold">
            <Check className="w-3.5 h-3.5 mr-1" />
            {pkg.free_noi_mang}
          </span>
          {aiAnalysis?.bestTags[pkg.id]?.isMaxVoice && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/15">
              Tốt nhất
            </span>
          )}
        </div>
      )
    },
    {
      key: 'voice_external',
      label: 'Gọi ngoại mạng',
      getValue: (pkg) => pkg.has_voice && isValid(pkg.free_ngoai_mang) ? pkg.free_ngoai_mang : null,
      renderCell: (pkg) => (
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="flex items-center text-emerald-600 font-bold">
            <Check className="w-3.5 h-3.5 mr-1" />
            {pkg.free_ngoai_mang}
          </span>
          {aiAnalysis?.bestTags[pkg.id]?.isMaxVoice && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/15">
              Tốt nhất
            </span>
          )}
        </div>
      )
    },
    {
      key: 'sms',
      label: 'SMS',
      getValue: (pkg) => pkg.has_sms && isValid(pkg.sms) ? pkg.sms : null,
      renderCell: (pkg) => (
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="flex items-center text-emerald-600 font-bold">
            <Check className="w-3.5 h-3.5 mr-1" />
            {pkg.sms}
          </span>
          {aiAnalysis?.bestTags[pkg.id]?.isMaxSms && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/15">
              Tốt nhất
            </span>
          )}
        </div>
      )
    },
    {
      key: 'utilities',
      label: 'Tiện ích miễn phí',
      getValue: (pkg) => getUtilitiesValue(pkg),
      renderCell: (pkg) => (
        <span className="font-bold text-slate-800">
          {getUtilitiesValue(pkg)}
        </span>
      )
    },
    {
      key: 'conditions',
      label: 'Điều kiện đăng ký',
      getValue: (pkg) => isValid(pkg.dieu_kien_dang_ky) ? pkg.dieu_kien_dang_ky : null,
      renderCell: (pkg) => (
        <span className="text-slate-600 leading-relaxed font-semibold">
          {pkg.dieu_kien_dang_ky}
        </span>
      )
    },
    {
      key: 'dangky',
      label: 'Cú pháp đăng ký',
      getValue: (pkg) => isValid(pkg.dangky) ? pkg.dangky : null,
      renderCell: (pkg) => (
        <span className="text-primary font-extrabold">{pkg.dangky}</span>
      )
    },
    {
      key: 'description',
      label: 'Mô tả ngắn',
      getValue: (pkg) => isValid(pkg.uudaitrong) ? pkg.uudaitrong : null,
      renderCell: (pkg) => (
        <span className="text-slate-500 leading-relaxed font-medium">
          {pkg.uudaitrong}
        </span>
      )
    }
  ];

  // A row is visible if at least one selected package has valid data for it
  const visibleRows = rowSpecs.filter((row) =>
    compareList.some((pkg) => {
      const val = row.getValue(pkg);
      return val !== 0 && val !== '0' && val !== null && val !== undefined && val !== '' && val !== false;
    })
  );

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
            onClick={handleClearCompare}
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
                  {visibleRows.map((row) => (
                    <tr key={row.key} className="hover:bg-slate-50/20 transition-colors">
                      <td className="p-4.5 font-bold text-slate-500 bg-slate-50/30">{row.label}</td>
                      {compareList.map((pkg) => {
                        const val = row.getValue(pkg);
                        const hasVal = val !== 0 && val !== '0' && val !== null && val !== undefined && val !== '' && val !== false;
                        return (
                          <td key={pkg.id} className="p-4.5 border-l border-slate-100">
                            {hasVal ? row.renderCell(pkg) : <span className="text-slate-400 font-medium">Không hỗ trợ</span>}
                          </td>
                        );
                      })}
                      {compareList.length < 3 && <td className="p-4.5 bg-slate-50/10 border-l border-slate-100"></td>}
                    </tr>
                  ))}

                  {/* Row: Quick Subscribe Actions */}
                  <tr className="bg-slate-50/50">
                    <td className="p-4.5 font-bold text-slate-500 bg-slate-50/50">Thao tác nhanh</td>
                    {compareList.map((pkg) => (
                      <td key={pkg.id} className="p-4.5 border-l border-slate-100 bg-white">
                        <button
                          onClick={() => handleSubscribeOpen(pkg)}
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
          <CompareAI compareList={compareList} onSubscribe={handleSubscribeOpen} />
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
              {/* Search input in modal */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tìm kiếm nhanh</label>
                <input
                  type="text"
                  placeholder="Nhập mã gói hoặc tên gói..."
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-primary transition-all"
                />
              </div>

              {filteredAvailablePackages.length > 0 ? (
                <div className="flex flex-col space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kết quả tìm kiếm (tối đa 10)</label>
                  <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/50">
                    {filteredAvailablePackages.slice(0, 10).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPkgIdToAdd(p.id)}
                        className={`w-full text-left p-3 transition-colors flex flex-col space-y-1 focus:outline-none ${
                          selectedPkgIdToAdd === p.id 
                            ? 'bg-red-50/70 border-l-4 border-primary' 
                            : 'hover:bg-slate-100/70'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-slate-900 text-xs">{p.ma_goi || p.id.toUpperCase()}</span>
                          {p.dohot === 'Hot' && (
                            <span className="bg-red-100 text-primary text-[8px] font-extrabold px-1.5 py-0.5 rounded border border-red-200">
                              Hot
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold">
                          <span>{new Intl.NumberFormat('vi-VN').format(p.gia)}đ</span>
                          <span>{p.chu_ky_ngay} ngày</span>
                          <span>{normalizeDataLimit(p.data_theo_ngay) || 'Không data'}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-xs text-amber-800 bg-amber-50/50 border border-amber-200 p-3 rounded-xl font-bold">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>
                    {availablePackagesToSelect.length === 0 
                      ? 'Đã chọn so sánh toàn bộ gói cước khả dụng!' 
                      : 'Không tìm thấy gói cước nào phù hợp!'}
                  </span>
                </div>
              )}

              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => {
                    setShowAddSelector(false);
                    setSelectedPkgIdToAdd('');
                    setModalSearchQuery('');
                  }}
                  className="flex-1 py-2.5 bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-950 hover:bg-slate-100 rounded-xl text-xs transition-colors font-bold focus:outline-none"
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
