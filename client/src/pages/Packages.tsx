import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, RefreshCw, AlertCircle } from 'lucide-react';
import { usePackageStore } from '../store';
import PackageCard from '../components/PackageCard';
import { CardSkeleton } from '../components/Skeleton';
import { packageApi } from '../services/api';
import type { FilterOptions } from '../services/api';

function getPaginationRange(currentPage: number, totalPages: number) {
  const maxButtons = 7;
  if (totalPages <= maxButtons) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const range: (number | string)[] = [];
  
  if (currentPage <= 4) {
    for (let i = 1; i <= 5; i++) {
      range.push(i);
    }
    range.push('...');
    range.push(totalPages);
  } else if (currentPage >= totalPages - 3) {
    range.push(1);
    range.push('...');
    for (let i = totalPages - 4; i <= totalPages; i++) {
      range.push(i);
    }
  } else {
    range.push(1);
    range.push('...');
    range.push(currentPage - 1);
    range.push(currentPage);
    range.push(currentPage + 1);
    range.push('...');
    range.push(totalPages);
  }

  return range;
}

export default function Packages() {
  const { packages, fetchPackages, loading, totalPages, totalItems } = usePackageStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const [filterOpts, setFilterOpts] = useState<FilterOptions>({
    categories: [],
    networks: ['4G/5G', '5G', '4G'],
    durations: []
  });

  const [searchVal, setSearchVal] = useState(searchParams.get('search') || '');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || 'all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [durationFilter, setDurationFilter] = useState('all');
  const [networkFilter, setNetworkFilter] = useState('all');
  const [voiceFilter, setVoiceFilter] = useState('all');
  const [smsFilter, setSmsFilter] = useState('all');
  const [targetFilter, setTargetFilter] = useState('');
  const [promoFilter, setPromoFilter] = useState('all');
  const [sortOption, setSortOption] = useState('popular');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const opts = await packageApi.fetchFilterOptions();
        setFilterOpts(opts);
      } catch (err) {
        console.error("Failed to load backend filter options:", err);
      }
    };
    loadFilters();
  }, []);

  useEffect(() => {
    const params = {
      page: currentPage,
      limit: itemsPerPage,
      search: searchVal,
      category: categoryFilter,
      price: priceFilter,
      duration: durationFilter,
      network: networkFilter,
      voice: voiceFilter,
      sms: smsFilter,
      target: targetFilter,
      promo: promoFilter,
      sort: sortOption
    };

    fetchPackages(params);
  }, [
    currentPage, 
    searchVal, 
    categoryFilter, 
    priceFilter, 
    durationFilter, 
    networkFilter, 
    voiceFilter, 
    smsFilter, 
    targetFilter, 
    promoFilter, 
    sortOption
  ]);

  useEffect(() => {
    const urlSearch = searchParams.get('search');
    const urlCategory = searchParams.get('category');
    
    if (urlSearch !== null) setSearchVal(urlSearch);
    if (urlCategory !== null) setCategoryFilter(urlCategory);
  }, [searchParams]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleSubscribeSuccess = useCallback((msg: string) => {
    showToast('success', msg);
  }, []);

  const handleSubscribeError = useCallback((msg: string) => {
    showToast('error', msg);
  }, []);

  const handleResetFilters = () => {
    setSearchVal('');
    setCategoryFilter('all');
    setPriceFilter('all');
    setDurationFilter('all');
    setNetworkFilter('all');
    setVoiceFilter('all');
    setSmsFilter('all');
    setTargetFilter('');
    setPromoFilter('all');
    setSortOption('popular');
    setSearchParams({});
    setCurrentPage(1);
  };

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
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Danh mục gói cước di động
            <span className="text-[10px] font-bold text-white bg-primary px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Dữ liệu thực
            </span>
          </h1>
          <p className="text-slate-500 text-xs mt-1 font-semibold">
            Tổng hợp tất cả các gói cước data 4G/5G, combo nghe gọi và giải trí từ hệ thống Viettel.
          </p>
        </div>
        <button
          onClick={handleResetFilters}
          className="flex items-center space-x-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors bg-white border border-slate-200 px-3.5 py-2 rounded-lg focus:outline-none cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Đặt lại bộ lọc</span>
        </button>
      </div>

      {/* Filters Control Panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 pb-2 border-b border-slate-100">
          <SlidersHorizontal className="w-4 h-4 text-primary" />
          <span>Bộ lọc tìm kiếm nâng cao (Đồng bộ trực tiếp từ Database)</span>
        </div>

        {/* 1st Row Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-semibold">
          {/* Keyword Search */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Từ khóa</label>
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Tên gói, mã gói, tags..."
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
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-700 focus:outline-none focus:border-primary/50 focus:bg-white transition-colors cursor-pointer"
            >
              <option value="all">Tất cả thể loại</option>
              {filterOpts.categories.map(c => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
              {filterOpts.categories.length === 0 && (
                <>
                  <option value="data">Chỉ DATA</option>
                  <option value="combo">Combo Thoại + Data</option>
                  <option value="social">Mạng xã hội (TikTok/YT)</option>
                </>
              )}
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
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-700 focus:outline-none focus:border-primary/50 focus:bg-white transition-colors cursor-pointer"
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
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-700 focus:outline-none focus:border-primary/50 focus:bg-white transition-colors cursor-pointer"
            >
              <option value="all">Mọi chu kỳ</option>
              {filterOpts.durations.map(d => (
                <option key={d.key} value={d.key}>{d.label}</option>
              ))}
              {filterOpts.durations.length === 0 && (
                <>
                  <option value="daily">Theo Ngày (1 ngày)</option>
                  <option value="weekly">Theo Tuần (3 - 7 ngày)</option>
                  <option value="monthly">Theo Tháng (30 ngày)</option>
                  <option value="yearly">Theo Năm (Chu kỳ dài)</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* 2nd Row Filters (Advanced filters matching requirement) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 text-xs font-semibold pt-2 border-t border-slate-50">
          {/* Network Filter */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Công nghệ mạng</label>
            <select
              value={networkFilter}
              onChange={(e) => {
                setNetworkFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-700 focus:outline-none focus:border-primary/50 focus:bg-white transition-colors cursor-pointer"
            >
              <option value="all">Tất cả mạng</option>
              {filterOpts.networks.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          {/* Voice Filter */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Ưu đãi Gọi thoại</label>
            <select
              value={voiceFilter}
              onChange={(e) => {
                setVoiceFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-700 focus:outline-none focus:border-primary/50 focus:bg-white transition-colors cursor-pointer"
            >
              <option value="all">Không giới hạn</option>
              <option value="yes">Có miễn phí gọi</option>
              <option value="no">Chỉ dùng Data</option>
            </select>
          </div>

          {/* SMS Filter */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Ưu đãi SMS</label>
            <select
              value={smsFilter}
              onChange={(e) => {
                setSmsFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-700 focus:outline-none focus:border-primary/50 focus:bg-white transition-colors cursor-pointer"
            >
              <option value="all">Không giới hạn</option>
              <option value="yes">Có miễn phí SMS</option>
              <option value="no">Không hỗ trợ SMS</option>
            </select>
          </div>

          {/* Promotion Filter */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Khuyến mãi / Tiện ích</label>
            <select
              value={promoFilter}
              onChange={(e) => {
                setPromoFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-700 focus:outline-none focus:border-primary/50 focus:bg-white transition-colors cursor-pointer"
            >
              <option value="all">Tất cả</option>
              <option value="yes">Có Free app (YT/FB/TikTok)</option>
            </select>
          </div>

          {/* Target Audience */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Đối tượng áp dụng</label>
            <input
              type="text"
              placeholder="Ví dụ: trả trước, trả sau..."
              value={targetFilter}
              onChange={(e) => {
                setTargetFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-700 placeholder-slate-400 focus:outline-none focus:border-primary/50 focus:bg-white transition-colors"
            />
          </div>

          {/* Sorting Dropdown */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sắp xếp theo</label>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-700 focus:outline-none focus:border-primary/50 focus:bg-white transition-colors cursor-pointer"
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
          {Array.from({ length: 8 }).map((_, idx) => (
            <CardSkeleton key={idx} />
          ))}
        </div>
      ) : packages.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {packages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                onSubscribeSuccess={handleSubscribeSuccess}
                onSubscribeError={handleSubscribeError}
              />
            ))}
          </div>
          
          <div className="flex justify-between items-center text-slate-550 font-semibold text-[11px] pt-4">
            <div>
              Hiển thị gói cước từ <span className="text-slate-800 font-bold">{Math.min(totalItems, (currentPage - 1) * itemsPerPage + 1)}</span> đến <span className="text-slate-800 font-bold">{Math.min(totalItems, currentPage * itemsPerPage)}</span> trong tổng số <span className="text-primary font-black">{totalItems}</span> gói cước.
            </div>
          </div>
        </>
      ) : (
        /* Empty State Panel */
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm flex flex-col items-center max-w-lg mx-auto space-y-4 animate-scale-up">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-primary border border-red-100">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Không tìm thấy gói cước phù hợp</h3>
            <p className="text-slate-550 text-xs leading-relaxed font-semibold">
              Các bộ lọc bạn chọn hiện không tương thích với gói cước nào trong cơ sở dữ liệu Viettel. Vui lòng bấm Đặt lại bộ lọc hoặc điều chỉnh giá trị lọc khác.
            </p>
          </div>
          <button
            onClick={handleResetFilters}
            className="bg-primary hover:bg-primary-hover text-white font-bold px-5 py-2 rounded-lg text-xs transition-colors cursor-pointer"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      )}

      {/* Truncated 7-button Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 pt-6 border-t border-slate-200">
          <button
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
            className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer focus:outline-none"
          >
            Trước
          </button>
          
          {getPaginationRange(currentPage, totalPages).map((page, idx) => {
            if (page === '...') {
              return (
                <span key={`dots-${idx}`} className="px-2.5 py-1.5 text-slate-400 font-bold select-none text-xs">
                  ...
                </span>
              );
            }
            const pageNum = page as number;
            const isCurrent = currentPage === pageNum;
            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`w-8 h-8 rounded-lg text-xs font-bold border transition-colors cursor-pointer focus:outline-none ${
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
            className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer focus:outline-none"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
}
