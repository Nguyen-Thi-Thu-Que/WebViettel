const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  package_id: { type: Number, required: true, unique: true, alias: 'id' },
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
  chu_ky_ngay: { type: String, default: '30' },
  dangky: { type: String, default: '' },
  huygiahan: { type: String, default: '' },
  huygoicuoc: { type: String, default: '' },
  diem_noi_bat: { type: String, default: '' },
  do_uu_tien: { type: String, default: '1' },
  goi_thay_the: { type: String, default: '' },
  
  // Hỗ trợ thêm các trường từ CSV nếu có
  loai: { type: String },
  dulieu: { type: String },
  thoai: { type: String },
  noidung: { type: String },
  uudaingoai: { type: String },
  thoigian: { type: String },
  tang: { type: String },
  taggoiy: { type: String },
  Nhom_Goi: { type: String }
}, { 
  collection: 'goi_cuoc', 
  timestamps: true 
});

module.exports = mongoose.model('Package', packageSchema);
