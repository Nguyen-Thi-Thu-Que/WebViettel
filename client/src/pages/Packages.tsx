import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePackageStore } from '../store';
import type { Package } from '../types';

// Component imports
import SEO from '../components/SEO';
import Breadcrumb from '../components/Breadcrumb';
import AdvancedFilter from '../components/AdvancedFilter';
import PackageToolbar from '../components/PackageToolbar';
import PackageGrid from '../components/PackageGrid';
import PackageCard from '../components/PackageCard';
import RegisterModal from '../components/RegisterModal';
import Pagination from '../components/Pagination';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';

export default function Packages() {
  const {
    packages,
    loading,
    pagination,
    search,
    filters,
    fetchPackages,
    setPage,
    reset
  } = usePackageStore();

  const [searchParams, setSearchParams] = useSearchParams();

  // State for Managing active Subscription Modal
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Toast Notification state
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSuccess = useCallback((msg: string) => {
    showToast('success', msg);
  }, []);

  const handleError = useCallback((msg: string) => {
    showToast('error', msg);
  }, []);

  // Sync URL search params to Zustand store on mount & URL changes
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    const urlCategory = searchParams.get('category') || 'all';

    const storeState = usePackageStore.getState();
    let hasChanges = false;

    if (urlSearch !== storeState.search) {
      storeState.setSearch(urlSearch);
      hasChanges = true;
    }
    if (urlCategory !== storeState.filters.category) {
      storeState.setFilter('category', urlCategory);
      hasChanges = true;
    }

    if (hasChanges) {
      fetchPackages();
    }
  }, [searchParams, fetchPackages]);

  // Sync Zustand store changes (search, category) back to URL searchParams
  useEffect(() => {
    const currentParams: Record<string, string> = {};
    if (search) currentParams.search = search;
    if (filters.category !== 'all') currentParams.category = filters.category;

    // Only update if search params differ from current URL
    const prevSearch = searchParams.get('search') || '';
    const prevCategory = searchParams.get('category') || 'all';

    if (search !== prevSearch || filters.category !== prevCategory) {
      setSearchParams(currentParams, { replace: true });
    }
  }, [search, filters.category, setSearchParams, searchParams]);

  // Initial packages fetch on mount and page number change
  useEffect(() => {
    fetchPackages();
  }, [pagination.page, fetchPackages]);

  const handleSubscribeOpen = (pkg: Package) => {
    setSelectedPkg(pkg);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setSelectedPkg(null);
    setIsModalOpen(false);
  };

  const handleResetAll = () => {
    reset();
    setSearchParams({}, { replace: true });
    fetchPackages();
  };

  // Structured breadcrumbs schema for Packages Page (SEO)
  const packageBreadcrumbsSchema = {
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
        "name": "Danh mục gói cước di động",
        "item": `${window.location.origin}/packages`
      }
    ]
  };

  return (
    <div className="space-y-8 pb-16 animate-fade-in text-xs font-semibold max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* SEO Optimization */}
      <SEO
        title="Danh Mục Gói Cước Di Động Viettel - Đăng Ký 4G/5G Tốc Độ Cao"
        description="Tra cứu, chọn lọc, so sánh và đăng ký các gói cước siêu tốc data di động 4G/5G, combo thoại, social từ Viettel. Thông tin chính xác từ DB."
        schema={packageBreadcrumbsSchema}
      />

      {/* Floating Toast Notification */}
      {toast && (
        <div
          role="alert"
          className={`fixed top-20 right-6 z-[9999] px-4.5 py-3.5 rounded-xl shadow-xl border-l-4 text-xs font-bold animate-scale-up bg-white text-slate-800 border ${toast.type === 'success' ? 'border-emerald-250 border-l-emerald-500' : 'border-red-250 border-l-red-500'
            }`}
        >
          <span>{toast.text}</span>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <Breadcrumb items={[{ label: 'Gói cước di động', path: '/packages' }]} />

      {/* Hero Section */}
      <header className="relative bg-gradient-premium text-white rounded-3xl p-8 sm:p-12 overflow-hidden shadow-sm flex flex-col items-start justify-center min-h-[220px]">
        {/* Background visual details */}
        <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-radial from-red-600/10 to-transparent opacity-60 pointer-events-none" />

        <div className="max-w-2xl text-left space-y-3 relative z-10">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
            Danh mục gói cước di động
          </h1>
          <p className="text-slate-350 text-xs sm:text-sm font-medium leading-relaxed">
            Khám phá và đăng ký các gói cước data 4G/5G siêu tốc, combo đàm thoại thả ga và giải trí không giới hạn từ nhà mạng Viettel với chi phí tối ưu nhất.
          </p>
        </div>
      </header>

      {/* Main Content Grid Layout */}
      <main className="space-y-6">
        {/* Unified Search & Filters Card */}
        <section>
          <AdvancedFilter />
        </section>

        {/* List Toolbar (Counts, Reset) */}
        <section>
          <PackageToolbar />
        </section>

        {/* Cards Grid / Shimmer Loading / Empty Alert */}
        <section className="min-h-[400px]">
          {loading ? (
            /* Render 8 Cards Skeleton */
            <PackageGrid>
              {Array.from({ length: 8 }).map((_, idx) => (
                <LoadingSkeleton key={idx} />
              ))}
            </PackageGrid>
          ) : packages.length > 0 ? (
            /* Render Actual Package Cards list */
            <PackageGrid>
              {packages.map((pkg) => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  onSubscribe={handleSubscribeOpen}
                />
              ))}
            </PackageGrid>
          ) : (
            /* Render SaaS styled Empty Search state */
            <EmptyState onReset={handleResetAll} />
          )}
        </section>

        {/* Pagination Section */}
        <section className="pt-4">
          {!loading && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={setPage}
            />
          )}
        </section>
      </main>

      {/* Single Portal-Mounted Register Confirmation Modal */}
      <RegisterModal
        isOpen={isModalOpen}
        pkg={selectedPkg}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
        onError={handleError}
      />
    </div>
  );
}
