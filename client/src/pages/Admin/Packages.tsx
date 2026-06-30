import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Wifi, Plus, Edit2, Trash2, X, AlertCircle, Sparkles } from 'lucide-react';
import { usePackageStore } from '../../store';
import type { Package } from '../../types';

// Zod Validation Schema for CRUD Packages
const packageFormSchema = z.object({
  name: z.string().min(2, { message: 'Tên gói phải chứa từ 2 ký tự' }),
  price: z.number().min(1000, { message: 'Giá cước tối thiểu là 1.000đ' }),
  duration: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  durationDays: z.number().min(1, { message: 'Thời hạn tối thiểu là 1 ngày' }),
  dataLimit: z.string().min(1, { message: 'Giới hạn dung lượng không được để trống' }),
  dataPerDayGb: z.number(),
  voiceFreeInternalMin: z.number(),
  voiceFreeExternalMin: z.number(),
  socialFreeApps: z.string(), // comma separated
  description: z.string().min(5, { message: 'Mô tả chi tiết tối thiểu 5 ký tự' }),
  conditions: z.string().min(2, { message: 'Điều kiện đăng ký không được để trống' }),
  terms: z.string().min(5, { message: 'Quy định sử dụng chi tiết không được để trống' }), // newline separated
  tags: z.string(), // comma separated
  isPopular: z.boolean()
});

type PackageFormValues = z.infer<typeof packageFormSchema>;

export default function AdminPackages() {
  const { packages, addPackage, updatePackage, deletePackage } = usePackageStore();
  
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState<Package | null>(null);
  const [deleteConfirmPkg, setDeleteConfirmPkg] = useState<Package | null>(null);

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
      name: '',
      price: 90000,
      duration: 'monthly',
      durationDays: 30,
      dataLimit: '30 GB (1 GB/ngày)',
      dataPerDayGb: 1,
      voiceFreeInternalMin: 1000,
      voiceFreeExternalMin: 0,
      socialFreeApps: '',
      description: '',
      conditions: 'Dành cho tất cả thuê bao di động Viettel.',
      terms: 'Hết 1GB dừng truy cập trong ngày.',
      tags: 'Data, Giá rẻ',
      isPopular: false
    }
  });

  const openAddModal = () => {
    setEditingPkg(null);
    reset({
      name: '',
      price: 90000,
      duration: 'monthly',
      durationDays: 30,
      dataLimit: '30 GB (1 GB/ngày)',
      dataPerDayGb: 1,
      voiceFreeInternalMin: 1000,
      voiceFreeExternalMin: 0,
      socialFreeApps: '',
      description: '',
      conditions: 'Dành cho tất cả thuê bao di động Viettel.',
      terms: 'Hết 1GB dừng truy cập trong ngày.',
      tags: 'Data, Giá rẻ',
      isPopular: false
    });
    setShowModal(true);
  };

  const openEditModal = (pkg: Package) => {
    setEditingPkg(pkg);
    reset({
      name: pkg.name,
      price: pkg.price,
      duration: pkg.duration,
      durationDays: pkg.durationDays,
      dataLimit: pkg.dataLimit,
      dataPerDayGb: pkg.dataPerDayGb || 0,
      voiceFreeInternalMin: pkg.voiceFreeInternalMin,
      voiceFreeExternalMin: pkg.voiceFreeExternalMin,
      socialFreeApps: pkg.socialFreeApps.join(', '),
      description: pkg.description,
      conditions: pkg.conditions,
      terms: pkg.terms.join('\n'),
      tags: pkg.tags.join(', '),
      isPopular: pkg.isPopular
    });
    setShowModal(true);
  };

  const handleFormSubmit = (data: PackageFormValues) => {
    // Process string arrays
    const socialAppsArr = data.socialFreeApps
      ? data.socialFreeApps.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    const tagsArr = data.tags
      ? data.tags.split(',').map(t => t.trim()).filter(Boolean)
      : [];
    const termsArr = data.terms
      ? data.terms.split('\n').map(t => t.trim()).filter(Boolean)
      : [];

    const processedPkg = {
      name: data.name,
      price: data.price,
      duration: data.duration,
      durationDays: data.durationDays,
      dataLimit: data.dataLimit,
      dataPerDayGb: data.dataPerDayGb,
      voiceFreeInternalMin: data.voiceFreeInternalMin,
      voiceFreeExternalMin: data.voiceFreeExternalMin,
      socialFreeApps: socialAppsArr,
      description: data.description,
      conditions: data.conditions,
      terms: termsArr,
      tags: tagsArr,
      isPopular: data.isPopular,
      category: socialAppsArr.length > 0 ? 'social' : data.voiceFreeInternalMin > 0 ? 'combo' : 'data' as 'data' | 'voice' | 'combo' | 'social'
    };

    if (editingPkg) {
      updatePackage(editingPkg.id, processedPkg);
      showToast('success', `Đã cập nhật thành công gói cước ${data.name}!`);
    } else {
      addPackage(processedPkg);
      showToast('success', `Đã tạo thành công gói cước mới ${data.name}!`);
    }
    setShowModal(false);
  };

  const handleDeleteClick = (pkg: Package) => {
    setDeleteConfirmPkg(pkg);
  };

  const confirmDelete = () => {
    if (deleteConfirmPkg) {
      deletePackage(deleteConfirmPkg.id);
      showToast('success', `Đã xóa gói cước ${deleteConfirmPkg.name} ra khỏi danh mục.`);
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
          className="flex items-center space-x-1 bg-primary hover:bg-primary-hover text-white font-bold px-4 py-2.5 rounded-lg text-xs transition-colors focus:outline-none"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo gói mới</span>
        </button>
      </div>

      {/* Database Catalog Table */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <th className="p-4">Tên gói</th>
                <th className="p-4">Thể loại</th>
                <th className="p-4">Giá cước</th>
                <th className="p-4">Chu kỳ</th>
                <th className="p-4">Data ưu đãi</th>
                <th className="p-4">Lượt đ.ký</th>
                <th className="p-4 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {packages.map((pkg) => (
                <tr key={pkg.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-bold text-slate-900 flex items-center space-x-1.5">
                    <span>{pkg.name}</span>
                    {pkg.isPopular && (
                      <span className="text-primary" title="Phổ biến">
                        <Sparkles className="w-3.5 h-3.5 fill-primary" />
                      </span>
                    )}
                  </td>
                  <td className="p-4 uppercase font-bold text-[10px]">
                    {pkg.category === 'data' ? (
                      <span className="text-blue-650 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">DATA</span>
                    ) : pkg.category === 'combo' ? (
                      <span className="text-primary bg-red-50 border border-red-100 px-2 py-0.5 rounded">COMBO</span>
                    ) : (
                      <span className="text-purple-650 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded">SOCIAL</span>
                    )}
                  </td>
                  <td className="p-4 font-black text-slate-900">
                    {new Intl.NumberFormat('vi-VN').format(pkg.price)}đ
                  </td>
                  <td className="p-4 text-slate-500 font-semibold">{pkg.durationDays} ngày</td>
                  <td className="p-4 text-slate-800 font-semibold">{pkg.dataLimit}</td>
                  <td className="p-4 text-slate-500 font-semibold">{pkg.registrationsCount.toLocaleString()}</td>
                  <td className="p-4 flex items-center justify-center space-x-2">
                    <button
                      onClick={() => openEditModal(pkg)}
                      className="p-2 hover:bg-slate-50 rounded-lg text-blue-650 hover:text-blue-800 transition-colors focus:outline-none"
                      title="Sửa"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(pkg)}
                      className="p-2 hover:bg-red-50 rounded-lg text-primary hover:text-red-800 transition-colors focus:outline-none"
                      title="Xóa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CRUD Form overlay Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto z-50">
          <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 max-w-2xl w-full shadow-md my-8 animate-scale-up space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">
                {editingPkg ? `Sửa gói cước ${editingPkg.name}` : 'Tạo gói cước di động mới'}
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
                {/* Name */}
                <div className="flex flex-col space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wider">Tên gói cước</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: SD135, MXH100..."
                    {...register('name')}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-primary/50 focus:bg-white rounded-lg py-2 px-3 text-slate-700 focus:outline-none transition-colors"
                  />
                  {errors.name && <p className="text-[10px] text-red-500 mt-0.5">{errors.name.message}</p>}
                </div>

                {/* Price */}
                <div className="flex flex-col space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wider">Giá cước (VND)</label>
                  <input
                    type="number"
                    placeholder="Ví dụ: 90000, 135000..."
                    {...register('price', { valueAsNumber: true })}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-primary/50 focus:bg-white rounded-lg py-2 px-3 text-slate-700 focus:outline-none transition-colors"
                  />
                  {errors.price && <p className="text-[10px] text-red-500 mt-0.5">{errors.price.message}</p>}
                </div>

                {/* Duration */}
                <div className="flex flex-col space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wider">Chu kỳ (Gốc)</label>
                  <select
                    {...register('duration')}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-primary/50 focus:bg-white rounded-lg py-2 px-3 text-slate-700 focus:outline-none transition-colors"
                  >
                    <option value="daily">Theo Ngày</option>
                    <option value="weekly">Theo Tuần</option>
                    <option value="monthly">Theo Tháng</option>
                    <option value="yearly">Theo Năm</option>
                  </select>
                </div>

                {/* Duration Days */}
                <div className="flex flex-col space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wider">Thời hạn (Ngày thực tế)</label>
                  <input
                    type="number"
                    placeholder="Ví dụ: 30, 7, 1..."
                    {...register('durationDays', { valueAsNumber: true })}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-primary/50 focus:bg-white rounded-lg py-2 px-3 text-slate-700 focus:outline-none transition-colors"
                  />
                  {errors.durationDays && <p className="text-[10px] text-red-500 mt-0.5">{errors.durationDays.message}</p>}
                </div>

                {/* Data Limit */}
                <div className="flex flex-col space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wider">Mô tả dung lượng Data</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 150 GB (5 GB/ngày), 30 GB..."
                    {...register('dataLimit')}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-primary/50 focus:bg-white rounded-lg py-2 px-3 text-slate-700 focus:outline-none transition-colors"
                  />
                  {errors.dataLimit && <p className="text-[10px] text-red-500 mt-0.5">{errors.dataLimit.message}</p>}
                </div>

                {/* Data raw per day */}
                <div className="flex flex-col space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wider">Dung lượng GB/Ngày (Dùng để lọc)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ví dụ: 5, 1, 0..."
                    {...register('dataPerDayGb', { valueAsNumber: true })}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-primary/50 focus:bg-white rounded-lg py-2 px-3 text-slate-700 focus:outline-none transition-colors"
                  />
                </div>

                {/* Voice Internal */}
                <div className="flex flex-col space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wider">Gọi nội mạng tối đa (Phút)</label>
                  <input
                    type="number"
                    {...register('voiceFreeInternalMin', { valueAsNumber: true })}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-primary/50 focus:bg-white rounded-lg py-2 px-3 text-slate-700 focus:outline-none transition-colors"
                  />
                </div>

                {/* Voice External */}
                <div className="flex flex-col space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wider">Gọi ngoại mạng miễn phí (Phút)</label>
                  <input
                    type="number"
                    {...register('voiceFreeExternalMin', { valueAsNumber: true })}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-primary/50 focus:bg-white rounded-lg py-2 px-3 text-slate-700 focus:outline-none transition-colors"
                  />
                </div>

                {/* Free Apps */}
                <div className="flex flex-col space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wider">Ứng dụng miễn phí data (Cách nhau bằng dấu phẩy)</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: TikTok, YouTube, Facebook"
                    {...register('socialFreeApps')}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-primary/50 focus:bg-white rounded-lg py-2 px-3 text-slate-700 focus:outline-none transition-colors"
                  />
                </div>

                {/* Tags */}
                <div className="flex flex-col space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wider">Tags nhãn dán (Cách nhau bằng dấu phẩy)</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Siêu Data, Bán chạy, Giá rẻ"
                    {...register('tags')}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-primary/50 focus:bg-white rounded-lg py-2 px-3 text-slate-700 focus:outline-none transition-colors"
                  />
                </div>

                {/* Conditions */}
                <div className="flex flex-col space-y-1.5 md:col-span-2">
                  <label className="font-bold text-slate-500 uppercase tracking-wider">Đối tượng áp dụng (Điều kiện)</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Thuê bao trả trước kích hoạt mới..."
                    {...register('conditions')}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-primary/50 focus:bg-white rounded-lg py-2 px-3 text-slate-700 focus:outline-none transition-colors"
                  />
                  {errors.conditions && <p className="text-[10px] text-red-500 mt-0.5">{errors.conditions.message}</p>}
                </div>

                {/* Description */}
                <div className="flex flex-col space-y-1.5 md:col-span-2">
                  <label className="font-bold text-slate-500 uppercase tracking-wider">Mô tả tóm tắt ngắn</label>
                  <textarea
                    placeholder="Nhập giới thiệu tóm tắt..."
                    rows={2}
                    {...register('description')}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-primary/50 focus:bg-white rounded-lg py-2 px-3 text-slate-700 focus:outline-none resize-none transition-colors"
                  />
                  {errors.description && <p className="text-[10px] text-red-500 mt-0.5">{errors.description.message}</p>}
                </div>

                {/* Terms */}
                <div className="flex flex-col space-y-1.5 md:col-span-2">
                  <label className="font-bold text-slate-500 uppercase tracking-wider">Điều khoản chi tiết (Mỗi quy định một dòng)</label>
                  <textarea
                    placeholder="Ví dụ: Hết 1GB dừng kết nối&#10;Gói gia hạn tự động hàng tháng..."
                    rows={3}
                    {...register('terms')}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-primary/50 focus:bg-white rounded-lg py-2 px-3 text-slate-700 focus:outline-none resize-none transition-colors"
                  />
                  {errors.terms && <p className="text-[10px] text-red-500 mt-0.5">{errors.terms.message}</p>}
                </div>

                {/* Popular checkbox */}
                <div className="flex items-center space-x-2 pt-2 md:col-span-2">
                  <input
                    type="checkbox"
                    id="isPopular"
                    {...register('isPopular')}
                    className="w-4 h-4 rounded bg-white border-slate-350 text-primary focus:ring-primary"
                  />
                  <label htmlFor="isPopular" className="font-bold text-slate-700 select-none">Đánh dấu gói cước nổi bật (Phổ biến)</label>
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors font-bold focus:outline-none"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg transition-colors focus:outline-none"
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
            <h4 className="text-base font-extrabold text-primary mb-2 flex items-center space-x-2">
              <AlertCircle className="w-5 h-5" />
              <span>Xóa gói cước</span>
            </h4>
            <p className="text-xs text-slate-650 mb-5 leading-relaxed font-semibold">
              Bạn có chắc chắn muốn xóa gói cước <strong className="text-primary">{deleteConfirmPkg.name}</strong> hoàn toàn khỏi hệ thống di động Viettel? Hành động này không thể hoàn tác.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setDeleteConfirmPkg(null)}
                className="flex-1 py-2 bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs transition-colors font-bold focus:outline-none"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg text-xs transition-colors focus:outline-none"
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
