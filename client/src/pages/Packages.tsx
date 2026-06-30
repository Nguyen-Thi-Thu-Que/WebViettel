import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, RefreshCw, AlertCircle } from 'lucide-react';
import { usePackageStore } from '../store';
import PackageCard from '../components/PackageCard';
import { CardSkeleton } from '../components/Skeleton';

export default function Packages() {
  const { packages } = usePackageStore();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search & Filter state
  const [searchVal, setSearchVal] = useState(searchParams.get('search') || '');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || 'all');
  const [priceFilter, setPriceFilter] = useState('all'); // all, under_50, 50_100, 100_200, above_200
  const [durationFilter, setDurationFilter] = useState('all'); // all, daily, weekly, monthly
  const [sortOption, setSortOption] = useState('popular'); // popular, price_asc, price_desc, rating
  
  // Loading & Pagination states
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Keep search input in sync with URL param changes
  useEffect(() => {
    setSearchVal(searchParams.get('search') || '');
    if (searchParams.get('category')) {
      setCategoryFilter(searchParams.get('category') || 'all');
    }
  }, [searchParams]);

  // Simulate loading state when filters change for modern UX feel
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, [searchVal, categoryFilter, priceFilter, durationFilter, sortOption]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleResetFilters = () => {
    setSearchVal('');
    setCategoryFilter('all');
    setPriceFilter('all');
    setDurationFilter('all');
    setSortOption('popular');
    setSearchParams({});
    setCurrentPage(1);
  };

  // Perform Filtering
  const filteredPackages = packages.filter((pkg) => {
    // 1. Keyword search
    if (searchVal.trim()) {
      const matchQuery = searchVal.toLowerCase();
      const matchName = pkg.name.toLowerCase().includes(matchQuery);
      const matchDesc = pkg.description.toLowerCase().includes(matchQuery);
      const matchTags = pkg.tags.some(t => t.toLowerCase().includes(matchQuery));
      if (!matchName && !matchDesc && !matchTags) return false;
    }

    // 2. Category filter
    if (categoryFilter !== 'all' && pkg.category !== categoryFilter) {
      return false;
    }

    // 3. Price filter
    if (priceFilter === 'under_50' && pkg.price > 50000) return false;
    if (priceFilter === '50_100' && (pkg.price <= 50000 || pkg.price > 100000)) return false;
    if (priceFilter === '100_200' && (pkg.price <= 100000 || pkg.price > 200000)) return false;
    if (priceFilter === 'above_200' && pkg.price <= 200000) return false;

    // 4. Duration filter
    if (durationFilter !== 'all' && pkg.duration !== durationFilter) {
      return false;
    }

    return true;
  });

  // Perform Sorting
  const sortedPackages = [...filteredPackages].sort((a, b) => {
    if (sortOption === 'popular') {
      return b.registrationsCount - a.registrationsCount;
    }
    if (sortOption === 'price_asc') {
      return a.price - b.price;
    }
    if (sortOption === 'price_desc') {
      return b.price - a.price;
    }
    if (sortOption === 'rating') {
      return b.rating - a.rating;
    }
    return 0;
  });

  // Perform Pagination
  const totalPages = Math.ceil(sortedPackages.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPackages = sortedPackages.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-8 pb-12 relative animate-fade-in text-xs font-semibold">
      {/* Toast Notification */}
      {toastMsg && (
        <div className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-lg shadow-lg border-l-4 text-xs font-semibold animate-scale-up bg-white text-slate-800 ${
          toastMsg.type === 'success' ? 'border-emerald-500' : 'border-red-500'
        }`}>
          {toastMsg.text}
        </div>
      )}

      {/* Header and Title */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Danh mục gói cước di động</h1>
          <p className="text-slate-500 text-xs mt-1 font-semibold">
            Tổng hợp tất cả các gói cước data 4G/5G, combo nghe gọi và giải trí của Viettel.
          </p>
        </div>
        <button
          onClick={handleResetFilters}
          className="flex items-center space-x-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors bg-white border border-slate-200 px-3.5 py-2 rounded-lg focus:outline-none"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Đặt lại bộ lọc</span>
        </button>
      </div>

      {/* Filters Control Panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 pb-2 border-b border-slate-100">
          <SlidersHorizontal className="w-4 h-4 text-primary" />
          <span>Bộ lọc tìm kiếm nâng cao</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs font-semibold">
          {/* Keyword Search */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Từ khóa</label>
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Nhập tên gói, từ khóa..."
                value={searchVal}
                onChange={(e) => {
                  setSearchVal(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-3 pr-9 text-slate-700 placeholder-slate-400 focus:outline-none focus:border-primary/50 focus:bg-white transition-colors"
              />
              <Search className="absolute right-3 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Loại gói cước</label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-700 focus:outline-none focus:border-primary/50 focus:bg-white transition-colors"
            >
              <option value="all">Tất cả thể loại</option>
              <option value="data">Chỉ DATA</option>
              <option value="combo">Combo Thoại + Data</option>
              <option value="social">Mạng xã hội (TikTok/YT)</option>
            </select>
          </div>

          {/* Price Range Filter */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mức giá cước</label>
            <select
              value={priceFilter}
              onChange={(e) => {
                setPriceFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-700 focus:outline-none focus:border-primary/50 focus:bg-white transition-colors"
            >
              <option value="all">Mọi giá tiền</option>
              <option value="under_50">Dưới 50.000đ</option>
              <option value="50_100">Từ 50.000đ - 100.000đ</option>
              <option value="100_200">Từ 100.000đ - 200.000đ</option>
              <option value="above_200">Trên 200.000đ</option>
            </select>
          </div>

          {/* Duration Cycle Filter */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Chu kỳ sử dụng</label>
            <select
              value={durationFilter}
              onChange={(e) => {
                setDurationFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-700 focus:outline-none focus:border-primary/50 focus:bg-white transition-colors"
            >
              <option value="all">Mọi chu kỳ</option>
              <option value="daily">Theo Ngày (1 ngày)</option>
              <option value="weekly">Theo Tuần (3 - 7 ngày)</option>
              <option value="monthly">Theo Tháng (30 ngày)</option>
            </select>
          </div>

          {/* Sorting Dropdown */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sắp xếp theo</label>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-700 focus:outline-none focus:border-primary/50 focus:bg-white transition-colors"
            >
              <option value="popular">Lượt đăng ký (Phổ biến)</option>
              <option value="price_asc">Giá tiền: Thấp đến Cao</option>
              <option value="price_desc">Giá tiền: Cao đến Thấp</option>
              <option value="rating">Đánh giá sao (Cao nhất)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Package Listing Section */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, idx) => (
            <CardSkeleton key={idx} />
          ))}
        </div>
      ) : paginatedPackages.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {paginatedPackages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              onSubscribeSuccess={(msg) => showToast('success', msg)}
              onSubscribeError={(msg) => showToast('error', msg)}
            />
          ))}
        </div>
      ) : (
        /* Empty State Panel */
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm flex flex-col items-center max-w-lg mx-auto space-y-4">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-primary border border-red-100">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Không tìm thấy gói cước phù hợp</h3>
            <p className="text-slate-500 text-xs leading-relaxed font-semibold">
              Các bộ lọc bạn chọn hiện không tương thích với gói cước nào của Viettel. Vui lòng bấm Đặt lại bộ lọc hoặc điều chỉnh giá trị lọc khác.
            </p>
          </div>
          <button
            onClick={handleResetFilters}
            className="bg-primary hover:bg-primary-hover text-white font-bold px-5 py-2 rounded-lg text-xs transition-colors"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 pt-6 border-t border-slate-200">
          <button
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
            className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            Trước
          </button>
          
          {Array.from({ length: totalPages }).map((_, idx) => {
            const pageNum = idx + 1;
            const isCurrent = currentPage === pageNum;
            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`w-8 h-8 rounded-lg text-xs font-bold border transition-colors ${
                  isCurrent
                    ? 'bg-primary border-primary text-white'
                    : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50 hover:text-slate-905'
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
            className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
}
