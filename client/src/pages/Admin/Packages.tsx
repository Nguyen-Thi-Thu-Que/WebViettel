import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Wifi, Plus, Edit2, Trash2, X, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import { usePackageStore } from '../../store';
import type { Package } from '../../types';

// Zod Validation Schema for CRUD Packages in Vietnamese
const packageFormSchema = z.object({
  ten: z.string().min(2, { message: 'Tên gói phải chứa từ 2 ký tự' }),
  gia: z.number().min(1000, { message: 'Giá cước tối thiểu là 1.000đ' }),
  phan_loai_goi: z.enum(['Data', 'Combo', 'Social', 'Thoại']),
  data_theo_ngay: z.string().min(1, { message: 'Giới hạn dung lượng không được để trống' }),
  free_noi_mang: z.string(),
  free_ngoai_mang: z.string(),
  sms: z.string(),
  tienich: z.string(),
  dieu_kien_dang_ky: z.string().min(2, { message: 'Điều kiện đăng ký không được để trống' }),
  chinh_sach_ap_dung: z.string().min(5, { message: 'Chính sách áp dụng không được để trống' }),
  noi_dung_ngoai: z.string(),
  tien_ich_free: z.string(),
  uudaitrong: z.string().min(5, { message: 'Mô tả chi tiết tối thiểu 5 ký tự' }),
  chu_ky_ngay: z.string().min(1, { message: 'Chu kỳ không được để trống' }),
  dangky: z.string(),
  huygiahan: z.string(),
  huygoicuoc: z.string(),
  dohot: z.enum(['Hot', 'normal'])
});

type PackageFormValues = z.infer<typeof packageFormSchema>;

export default function AdminPackages() {
  const { packages, addPackage, updatePackage, deletePackage, fetchPackages, loading } = usePackageStore();
  
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState<Package | null>(null);
  const [deleteConfirmPkg, setDeleteConfirmPkg] = useState<Package | null>(null);

  useEffect(() => {
    fetchPackages({ page: 1, limit: 1000, sort: 'price_asc' });
  }, [fetchPackages]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<PackageFormValues>({
    resolver: zodResolver(packageFormSchema),
    defaultValues: {
      ten: '',
      gia: 90000,
      phan_loai_goi: 'Data',
      data_theo_ngay: '30 GB (1 GB/ngày)',
      free_noi_mang: '0',
      free_ngoai_mang: '0',
      sms: '0',
      tienich: '0',
      dieu_kien_dang_ky: 'Dành cho tất cả thuê bao di động Viettel.',
      chinh_sach_ap_dung: 'Tự động gia hạn.',
      noi_dung_ngoai: '0',
      tien_ich_free: '0',
      uudaitrong: '',
      chu_ky_ngay: '30',
      dangky: '',
      huygiahan: '',
      huygoicuoc: '',
      dohot: 'normal'
    }
  });

  const openAddModal = () => {
    setEditingPkg(null);
    reset({
      ten: '',
      gia: 90000,
      phan_loai_goi: 'Data',
      data_theo_ngay: '30 GB (1 GB/ngày)',
      free_noi_mang: '0',
      free_ngoai_mang: '0',
      sms: '0',
      tienich: '0',
      dieu_kien_dang_ky: 'Dành cho tất cả thuê bao di động Viettel.',
      chinh_sach_ap_dung: 'Tự động gia hạn.',
      noi_dung_ngoai: '0',
      tien_ich_free: '0',
      uudaitrong: '',
      chu_ky_ngay: '30',
      dangky: '',
      huygiahan: '',
      huygoicuoc: '',
      dohot: 'normal'
    });
    setShowModal(true);
  };

  const openEditModal = (pkg: Package) => {
    setEditingPkg(pkg);
    reset({
      ten: pkg.ten,
      gia: pkg.gia,
      phan_loai_goi: pkg.phan_loai_goi as any,
      data_theo_ngay: pkg.data_theo_ngay,
      free_noi_mang: pkg.free_noi_mang,
      free_ngoai_mang: pkg.free_ngoai_mang,
      sms: pkg.sms,
      tienich: pkg.tienich,
      dieu_kien_dang_ky: pkg.dieu_kien_dang_ky,
      chinh_sach_ap_dung: pkg.chinh_sach_ap_dung,
      noi_dung_ngoai: pkg.noi_dung_ngoai,
      tien_ich_free: pkg.tien_ich_free,
      uudaitrong: pkg.uudaitrong,
      chu_ky_ngay: pkg.chu_ky_ngay,
      dangky: pkg.dangky,
      huygiahan: pkg.huygiahan,
      huygoicuoc: pkg.huygoicuoc,
      dohot: pkg.dohot as any
    });
    setShowModal(true);
  };

  const handleFormSubmit = (data: PackageFormValues) => {
    const runAsync = async () => {
      if (editingPkg) {
        const success = await updatePackage(editingPkg.id, data);
        if (success) {
          showToast('success', `Đã cập nhật thành công gói cước ${data.ten}!`);
        } else {
          showToast('error', `Lỗi khi cập nhật gói cước ${data.ten}.`);
        }
      } else {
        const success = await addPackage(data);
        if (success) {
          showToast('success', `Đã tạo thành công gói cước mới ${data.ten}!`);
        } else {
          showToast('error', `Lỗi khi tạo gói cước mới ${data.ten}.`);
        }
      }
      setShowModal(false);
    };

    runAsync();
  };

  const handleDeleteClick = (pkg: Package) => {
    setDeleteConfirmPkg(pkg);
  };

  const confirmDelete = async () => {
    if (deleteConfirmPkg) {
      const success = await deletePackage(deleteConfirmPkg.id);
      if (success) {
        showToast('success', `Đã xóa gói cước ${deleteConfirmPkg.ten} ra khỏi danh mục.`);
      } else {
        showToast('error', `Lỗi khi xóa gói cước ${deleteConfirmPkg.ten}.`);
      }
      setDeleteConfirmPkg(null);
    }
  };

  return (
    <div className="space-y-6 relative animate-fade-in text-xs font-semibold">
      {/* Toast Notification */}
      {toastMsg && (
        <div className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-lg shadow-lg border-l-4 text-xs font-semibold animate-scale-up bg-white text-slate-800 ${
          toastMsg.type === 'success' ? 'border-emerald-500' : 'border-red-500'
        }`}>
          {toastMsg.text}
        </div>
      )}

      {/* Header View */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center">
            <Wifi className="w-6 h-6 text-primary mr-2" />
            Danh sách quản lý gói cước
          </h1>
          <p className="text-slate-655 text-xs mt-0.5 font-medium">Thực hiện CRUD gói cước di động Viettel hiển thị ngoài client.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center space-x-1 bg-primary hover:bg-primary-hover text-white font-bold px-4 py-2.5 rounded-lg text-xs transition-colors focus:outline-none cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo gói mới</span>
        </button>
      </div>

      {/* Database Catalog Table */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden relative min-h-[200px]">
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-650 font-bold">
                <th className="p-4">Tên gói</th>
                <th className="p-4">Thể loại</th>
                <th className="p-4">Giá cước</th>
                <th className="p-4">Chu kỳ</th>
                <th className="p-4">Data ưu đãi</th>
                <th className="p-4 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {packages.map((pkg) => (
                <tr key={pkg.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-bold text-slate-900 flex items-center space-x-1.5">
                    <span>{pkg.ten}</span>
                    {pkg.dohot !== 'normal' && (
                      <span className="text-primary" title="Phổ biến">
                        <Sparkles className="w-3.5 h-3.5 fill-primary" />
                      </span>
                    )}
                  </td>
                  <td className="p-4 uppercase font-bold text-[10px]">
                    {pkg.phan_loai_goi === 'Data' ? (
                      <span className="text-blue-650 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">DATA</span>
                    ) : pkg.phan_loai_goi === 'Combo' ? (
                      <span className="text-primary bg-red-50 border border-red-100 px-2 py-0.5 rounded">COMBO</span>
                    ) : (
                      <span className="text-purple-650 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded">SOCIAL</span>
                    )}
                  </td>
                  <td className="p-4 font-black text-slate-900">
                    {new Intl.NumberFormat('vi-VN').format(pkg.gia)}đ
                  </td>
                  <td className="p-4 text-slate-500 font-semibold">{pkg.chu_ky_ngay} ngày</td>
                  <td className="p-4 text-slate-800 font-semibold">{pkg.data_theo_ngay}</td>
                  <td className="p-4 flex items-center justify-center space-x-2">
                    <button
                      onClick={() => openEditModal(pkg)}
                      className="p-2 hover:bg-slate-50 rounded-lg text-blue-650 hover:text-blue-800 transition-colors focus:outline-none cursor-pointer"
                      title="Sửa"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(pkg)}
                      className="p-2 hover:bg-red-50 rounded-lg text-primary hover:text-red-800 transition-colors focus:outline-none cursor-pointer"
                      title="Xóa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {packages.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-450 font-semibold">
                    Không có gói cước nào trong danh mục.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CRUD Form overlay Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 max-w-2xl w-full shadow-md my-8 animate-scale-up space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900">
                {editingPkg ? `Sửa gói cước ${editingPkg.ten}` : 'Tạo gói cước di động mới'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-800 transition-colors focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Ten */}
                <div className="flex flex-col space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wider">Tên gói cước</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: SD135, MXH100..."
                    {...register('ten')}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-primary/50 focus:bg-white rounded-lg py-2 px-3 text-slate-700 focus:outline-none transition-colors"
                  />
                  {errors.ten && <p className="text-[10px] text-red-500 mt-0.5">{errors.ten.message}</p>}
                </div>

                {/* Gia */}
                <div className="flex flex-col space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wider">Giá cước (VND)</label>
                  <input
                    type="number"
                    placeholder="Ví dụ: 90000, 135000..."
                    {...register('gia', { valueAsNumber: true })}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-primary/50 focus:bg-white rounded-lg py-2 px-3 text-slate-700 focus:outline-none transition-colors"
                  />
                  {errors.gia && <p className="text-[10px] text-red-500 mt-0.5">{errors.gia.message}</p>}
                </div>

                {/* Phan loai goi */}
                <div className="flex flex-col space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wider">Thể loại gói</label>
                  <select
                    {...register('phan_loai_goi')}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-primary/50 focus:bg-white rounded-lg py-2 px-3 text-slate-700 focus:outline-none transition-colors cursor-pointer"
                  >
                    <option value="Data">Chỉ DATA</option>
                    <option value="Combo">Combo Thoại + Data</option>
                    <option value="Social">Mạng xã hội</option>
                    <option value="Thoại">Chỉ thoại</option>
                  </select>
                </div>

                {/* Chu ky ngay */}
                <div className="flex flex-col space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wider">Thời hạn (Ngày thực tế)</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 30, 7, 1..."
                    {...register('chu_ky_ngay')}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-primary/50 focus:bg-white rounded-lg py-2 px-3 text-slate-700 focus:outline-none transition-colors"
                  />
                  {errors.chu_ky_ngay && <p className="text-[10px] text-red-500 mt-0.5">{errors.chu_ky_ngay.message}</p>}
                </div>

                {/* Data theo ngay */}
                <div className="flex flex-col space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wider">Mô tả dung lượng Data</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 150 GB (5 GB/ngày), 30 GB..."
                    {...register('data_theo_ngay')}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-primary/50 focus:bg-white rounded-lg py-2 px-3 text-slate-700 focus:outline-none transition-colors"
                  />
                  {errors.data_theo_ngay && <p className="text-[10px] text-red-500 mt-0.5">{errors.data_theo_ngay.message}</p>}
                </div>

                {/* Free noi mang */}
                <div className="flex flex-col space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wider">Gọi nội mạng miễn phí</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 1000 phút nội mạng, hoặc 0"
                    {...register('free_noi_mang')}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-primary/50 focus:bg-white rounded-lg py-2 px-3 text-slate-700 focus:outline-none transition-colors"
                  />
                </div>

                {/* Free ngoai mang */}
                <div className="flex flex-col space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wider">Gọi ngoại mạng miễn phí</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 50 phút ngoại mạng, hoặc 0"
                    {...register('free_ngoai_mang')}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-primary/50 focus:bg-white rounded-lg py-2 px-3 text-slate-700 focus:outline-none transition-colors"
                  />
                </div>

                {/* SMS */}
                <div className="flex flex-col space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wider">Tin nhắn SMS miễn phí</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 100 sms nội mạng, hoặc 0"
                    {...register('sms')}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-primary/50 focus:bg-white rounded-lg py-2 px-3 text-slate-700 focus:outline-none transition-colors"
                  />
                </div>

                {/* Tienich */}
                <div className="flex flex-col space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wider">Tiện ích cơ bản</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Lifebox 100GB, hoặc 0"
                    {...register('tienich')}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-primary/50 focus:bg-white rounded-lg py-2 px-3 text-slate-700 focus:outline-none transition-colors"
                  />
                </div>

                {/* Noi dung ngoai */}
                <div className="flex flex-col space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wider">Free Data Apps (TikTok, YouTube...)</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: TikTok, YouTube, Facebook, hoặc 0"
                    {...register('noi_dung_ngoai')}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-primary/50 focus:bg-white rounded-lg py-2 px-3 text-slate-700 focus:outline-none transition-colors"
                  />
                </div>

                {/* Tien ich free */}
                <div className="flex flex-col space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wider">Chi tiết tiện ích miễn phí</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: TV360 Standard, hoặc 0"
                    {...register('tien_ich_free')}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-primary/50 focus:bg-white rounded-lg py-2 px-3 text-slate-700 focus:outline-none transition-colors"
                  />
                </div>

                {/* Dohot */}
                <div className="flex flex-col space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wider">Độ nổi bật</label>
                  <select
                    {...register('dohot')}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-primary/50 focus:bg-white rounded-lg py-2 px-3 text-slate-700 focus:outline-none transition-colors cursor-pointer"
                  >
                    <option value="normal">Bình thường (Normal)</option>
                    <option value="Hot">Gói nổi bật (Hot)</option>
                  </select>
                </div>

                {/* Dieu kien dang ky */}
                <div className="flex flex-col space-y-1.5 md:col-span-2">
                  <label className="font-bold text-slate-500 uppercase tracking-wider">Đối tượng áp dụng (Điều kiện đăng ký)</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: SIM trả trước kích hoạt mới..."
                    {...register('dieu_kien_dang_ky')}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-primary/50 focus:bg-white rounded-lg py-2 px-3 text-slate-700 focus:outline-none transition-colors"
                  />
                  {errors.dieu_kien_dang_ky && <p className="text-[10px] text-red-500 mt-0.5">{errors.dieu_kien_dang_ky.message}</p>}
                </div>

                {/* Chinh sach ap dung */}
                <div className="flex flex-col space-y-1.5 md:col-span-2">
                  <label className="font-bold text-slate-500 uppercase tracking-wider">Chính sách áp dụng</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Tự động gia hạn khi có đủ tiền..."
                    {...register('chinh_sach_ap_dung')}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-primary/50 focus:bg-white rounded-lg py-2 px-3 text-slate-700 focus:outline-none transition-colors"
                  />
                  {errors.chinh_sach_ap_dung && <p className="text-[10px] text-red-500 mt-0.5">{errors.chinh_sach_ap_dung.message}</p>}
                </div>

                {/* Uudaitrong */}
                <div className="flex flex-col space-y-1.5 md:col-span-2">
                  <label className="font-bold text-slate-500 uppercase tracking-wider">Mô tả tóm tắt ưu đãi</label>
                  <textarea
                    placeholder="Nhập mô tả tóm tắt..."
                    rows={2}
                    {...register('uudaitrong')}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-primary/50 focus:bg-white rounded-lg py-2 px-3 text-slate-700 focus:outline-none resize-none transition-colors"
                  />
                  {errors.uudaitrong && <p className="text-[10px] text-red-500 mt-0.5">{errors.uudaitrong.message}</p>}
                </div>

                {/* Dangky, Huygiahan, Huygoicuoc */}
                <div className="flex flex-col space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wider">Cú pháp đăng ký</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Soạn SD135 gửi 191"
                    {...register('dangky')}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-primary/50 focus:bg-white rounded-lg py-2 px-3 text-slate-700 focus:outline-none transition-colors"
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wider">Cú pháp hủy gia hạn</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Soạn HUY gửi 191"
                    {...register('huygiahan')}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-primary/50 focus:bg-white rounded-lg py-2 px-3 text-slate-700 focus:outline-none transition-colors"
                  />
                </div>

                <div className="flex flex-col space-y-1.5 md:col-span-2">
                  <label className="font-bold text-slate-500 uppercase tracking-wider">Cú pháp hủy hoàn toàn gói cước</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Soạn HUYDATA gửi 191"
                    {...register('huygoicuoc')}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-primary/50 focus:bg-white rounded-lg py-2 px-3 text-slate-700 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-slate-50 border border-slate-200 text-slate-650 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors font-bold focus:outline-none"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg transition-colors focus:outline-none cursor-pointer"
                >
                  {editingPkg ? 'Lưu cập nhật' : 'Tạo mới gói'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmPkg && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-sm w-full shadow-md animate-scale-up z-50">
            <h4 className="text-sm font-extrabold text-primary mb-2 flex items-center space-x-2">
              <AlertCircle className="w-5 h-5" />
              <span>Xóa gói cước</span>
            </h4>
            <p className="text-xs text-slate-650 mb-5 leading-relaxed font-semibold">
              Bạn có chắc chắn muốn xóa gói cước <strong className="text-primary">{deleteConfirmPkg.ten}</strong> hoàn toàn khỏi hệ thống di động Viettel? Hành động này không thể hoàn tác.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setDeleteConfirmPkg(null)}
                className="flex-1 py-2 bg-slate-50 border border-slate-200 text-slate-650 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs transition-colors font-bold focus:outline-none"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg text-xs transition-colors focus:outline-none cursor-pointer"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
