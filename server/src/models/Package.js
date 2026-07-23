const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  package_id: { type: Number, required: true, unique: true, alias: 'id' },
  is_auto_renew: { type: Boolean, default: true },
  ma_goi: { type: String, required: true, index: true },
  ten: { type: String, required: true },
  dohot: { type: String, default: 'normal' },
  phan_loai_goi: { type: String, default: 'Data' }, // Tương ứng category
  gia: { type: Number, required: true },
  phan_khuc_gia: { type: String, default: 'Trung_binh' },
  data_theo_ngay: { type: String, default: '' },
  free_ngoai_mang: { type: String, default: '0' },
  free_noi_mang: { type: String, default: '0' },
  tienich: { type: String, default: '0' },
  sms: { type: String, default: '0' },
  doi_tuong_ap_dung: { type: String, default: '' },
  dieu_kien_dang_ky: { type: String, default: '' },
  chinh_sach_ap_dung: { type: String, default: '' },
  noi_dung_ngoai: { type: String, default: '0' },
  tien_ich_free: { type: String, default: '0' },
  uudaitrong: { type: String, default: '' },
  chu_ky_ngay: { type: mongoose.Schema.Types.Mixed, default: 30 },
  dangky: { type: String, default: '' },
  huygiahan: { type: String, default: '' },
  huygoicuoc: { type: String, default: '' },
  diem_noi_bat: { type: String, default: '' },
  do_uu_tien: { type: String, default: '1' },
  goi_thay_the: { type: String, default: '' },
  
  // Hỗ trợ thêm các trường từ CSV nếu có
  loai: { type: String },
  loai_mang: { type: String },
  dulieu: { type: String },
  thoai: { type: String },
  noidung: { type: String },
  uudaingoai: { type: String },
  thoigian: { type: String },
  tang: { type: String },
  taggoiy: { type: String },
  Nhom_Goi: { type: String },
  cycle_type: { type: String, default: '' },
  service_group: { type: String, default: '' },
  registration_policy: { type: String, default: '' },
  duration: { type: Number },
  support_auto_renew: { type: Boolean },
  validity_mode: { type: String },

  // --- Subscription Conflict Engine fields ---
  // Phân loại hệ thống để kiểm tra xung đột song song
  // Ví dụ: 'DATA_BASE', 'DATA_UTILITY', 'COMBO', 'VOICE_SMS', 'ADDON'
  system_type: { type: String, default: '' },

  // Gói tiện ích bổ sung — luôn ALLOW song song với mọi gói khác
  is_addon: { type: Boolean, default: false },

  // Gói dài hạn — không cho phép chồng với is_long_term khác
  is_long_term: { type: Boolean, default: false },

  // Gói này yêu cầu user đang có gói DATA_BASE hoặc COMBO active
  requires_base_package: { type: Boolean, default: false },

  // Danh sách system_type được phép chạy song song với gói này
  allow_parallel_with: { type: [String], default: [] },

  // Hệ ưu đãi của gói — dùng để kiểm tra xung đột cùng hệ
  // Giá trị: GENERAL_DATA | FACEBOOK | YOUTUBE | TIKTOK | SPORT | MOVIE | VOICE_SMS | COMBO | ADDON_DATA
  benefit_group: { type: String, default: '' }
}, { 
  collection: 'goi_cuoc', 
  timestamps: true 
});

packageSchema.index({ ten: 1 });
packageSchema.index({ phan_loai_goi: 1 });
packageSchema.index({ system_type: 1 });

module.exports = mongoose.model('Package', packageSchema);
