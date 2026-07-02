import axios from 'axios';
import type { Package } from '../types';

const API_BASE_URL = '/api/packages';

export interface FetchPackagesResponse {
  packages: Package[];
  page: number;
  limit: number;
  totalPages: number;
  totalItems: number;
}

export interface FilterOptions {
  categories: { key: string; label: string }[];
  networks: string[];
  durations: { key: string; label: string }[];
}

export function toVietnamesePackage(apiPkg: any): Package {
  if (!apiPkg) return {} as Package;
  const price = apiPkg.price || 0;
  const phan_khuc_gia = price < 50000 ? 'Gia_re' : price <= 150000 ? 'Trung_binh' : 'Cao_cap';

  const termsList = apiPkg.terms || [];
  const chinh_sach_ap_dung = termsList[0] || 'Áp dụng cho thuê bao Viettel di động.';
  
  let dangky = apiPkg.dangky || '';
  let huygiahan = apiPkg.huygiahan || '';
  let huygoicuoc = apiPkg.huygoicuoc || '';

  termsList.forEach((term: string) => {
    if (term.toLowerCase().startsWith('cách đăng ký:')) {
      dangky = term.replace(/cách đăng ký:\s*/i, '').trim();
    } else if (term.toLowerCase().startsWith('hủy gia hạn:')) {
      huygiahan = term.replace(/hủy gia hạn:\s*/i, '').trim();
    } else if (term.toLowerCase().startsWith('hủy gói:')) {
      huygoicuoc = term.replace(/hủy gói:\s*/i, '').trim();
    } else if (term.toLowerCase().startsWith('hủy gói cước:')) {
      huygoicuoc = term.replace(/hủy gói cước:\s*/i, '').trim();
    }
  });

  if (!dangky) {
    dangky = `Soạn ${apiPkg.ma_goi || apiPkg.id?.toUpperCase()} gửi 191`;
  }
  if (!huygiahan) {
    huygiahan = 'Soạn HUY gửi 191';
  }
  if (!huygoicuoc) {
    huygoicuoc = 'Soạn HUYDATA gửi 191';
  }

  const free_noi_mang = apiPkg.voiceFreeInternalMin ? `${apiPkg.voiceFreeInternalMin} phút nội mạng` : '0';
  const free_ngoai_mang = apiPkg.voiceFreeExternalMin ? `${apiPkg.voiceFreeExternalMin} phút ngoại mạng` : '0';
  const noi_dung_ngoai = apiPkg.socialFreeApps?.length > 0 ? apiPkg.socialFreeApps.join(', ') : '0';

  return {
    id: apiPkg.id,
    ten: apiPkg.name || '',
    dohot: apiPkg.isPopular ? 'Hot' : 'normal',
    phan_loai_goi: apiPkg.category === 'data' ? 'Data' : apiPkg.category === 'combo' ? 'Combo' : apiPkg.category === 'social' ? 'Social' : 'Thoại',
    gia: price,
    phan_khuc_gia,
    data_theo_ngay: apiPkg.dataLimit || '',
    free_ngoai_mang,
    free_noi_mang,
    tienich: apiPkg.tienich || '0',
    sms: apiPkg.sms || '0',
    dieu_kien_dang_ky: apiPkg.conditions || 'Thuê bao di động hoạt động bình thường',
    chinh_sach_ap_dung,
    noi_dung_ngoai,
    tien_ich_free: apiPkg.tien_ich_free || apiPkg.tienich || '0',
    uudaitrong: apiPkg.description || '',
    chu_ky_ngay: String(apiPkg.durationDays || 30),
    dangky,
    huygiahan,
    huygoicuoc
  };
}

export function toEnglishPackage(vnPkg: Partial<Package>): any {
  const price = vnPkg.gia || 0;
  const durationDays = parseInt(vnPkg.chu_ky_ngay || '30') || 30;
  let duration = 'monthly';
  if (durationDays <= 1) duration = 'daily';
  else if (durationDays <= 15) duration = 'weekly';
  else if (durationDays <= 90) duration = 'monthly';
  else duration = 'yearly';

  const voiceFreeInternalMin = vnPkg.free_noi_mang ? (parseInt(vnPkg.free_noi_mang.replace(/\D/g, '')) || 0) : 0;
  const voiceFreeExternalMin = vnPkg.free_ngoai_mang ? (parseInt(vnPkg.free_ngoai_mang.replace(/\D/g, '')) || 0) : 0;
  const socialFreeApps = vnPkg.noi_dung_ngoai && vnPkg.noi_dung_ngoai !== '0'
    ? vnPkg.noi_dung_ngoai.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const category = socialFreeApps.length > 0 ? 'social' : voiceFreeInternalMin > 0 ? 'combo' : 'data';

  return {
    id: vnPkg.id,
    name: vnPkg.ten,
    price,
    duration,
    durationDays,
    dataLimit: vnPkg.data_theo_ngay || '0 GB',
    dataPerDayGb: vnPkg.data_theo_ngay ? (parseFloat(vnPkg.data_theo_ngay.replace(',', '.').match(/(\d+(\.\d+)?)/)?.[1] || '0')) : 0,
    voiceFreeInternalMin,
    voiceFreeExternalMin,
    socialFreeApps,
    description: vnPkg.uudaitrong || '',
    conditions: vnPkg.dieu_kien_dang_ky || '',
    terms: [
      vnPkg.chinh_sach_ap_dung || 'Áp dụng cho thuê bao Viettel di động.',
      vnPkg.dangky ? `Cách đăng ký: ${vnPkg.dangky}` : '',
      vnPkg.huygiahan ? `Hủy gia hạn: ${vnPkg.huygiahan}` : '',
      vnPkg.huygoicuoc ? `Hủy gói: ${vnPkg.huygoicuoc}` : ''
    ].filter(Boolean),
    isPopular: vnPkg.dohot === 'Hot',
    category,
    tags: vnPkg.dohot === 'Hot' ? ['Hot'] : []
  };
}

export const packageApi = {
  fetchPackages: async (params: Record<string, any>): Promise<FetchPackagesResponse> => {
    const response = await axios.get<any>(API_BASE_URL, { params });
    const rawData = response.data;
    return {
      packages: (rawData.packages || []).map(toVietnamesePackage),
      page: rawData.page,
      limit: rawData.limit,
      totalPages: rawData.totalPages,
      totalItems: rawData.totalItems,
    };
  },

  fetchPackageById: async (id: string): Promise<Package> => {
    const response = await axios.get<any>(`${API_BASE_URL}/${id}`);
    return toVietnamesePackage(response.data);
  },

  fetchFilterOptions: async (): Promise<FilterOptions> => {
    const response = await axios.get<FilterOptions>(`${API_BASE_URL}/filter`);
    return response.data;
  },

  fetchCategories: async (): Promise<{ id: string; name: string; count: number }[]> => {
    const response = await axios.get(`${API_BASE_URL}/categories`);
    return response.data;
  },

  createPackage: async (pkg: Omit<Package, 'id' | 'phan_khuc_gia'>): Promise<{ success: boolean; package: Package }> => {
    const englishPkg = toEnglishPackage(pkg);
    const response = await axios.post<{ success: boolean; package: any }>(API_BASE_URL, englishPkg);
    return {
      success: response.data.success,
      package: toVietnamesePackage(response.data.package),
    };
  },

  updatePackage: async (id: string, pkg: Partial<Package>): Promise<{ success: boolean; package: Package }> => {
    const englishPkg = toEnglishPackage(pkg);
    const response = await axios.put<{ success: boolean; package: any }>(`${API_BASE_URL}/${id}`, englishPkg);
    return {
      success: response.data.success,
      package: toVietnamesePackage(response.data.package),
    };
  },

  deletePackage: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await axios.delete<{ success: boolean; message: string }>(`${API_BASE_URL}/${id}`);
    return response.data;
  },
};
