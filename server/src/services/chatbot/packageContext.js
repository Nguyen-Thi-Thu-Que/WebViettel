const mongoose = require('mongoose');

/**
 * In-memory cache để tránh query MongoDB nhiều lần trong cùng một lifecycle.
 * Cache hết hạn sau 5 phút để đảm bảo dữ liệu không quá cũ.
 */
let _packageCache = null;
let _cacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 phút

/**
 * Lấy danh sách gói cước từ database (có cache in-memory).
 */
const getPackageContext = async () => {
  const now = Date.now();
  if (_packageCache && (now - _cacheTime) < CACHE_TTL_MS) {
    return _packageCache;
  }
  const db = mongoose.connection.db;
  const packages = await db.collection('goi_cuoc').find({}).toArray();
  _packageCache = packages;
  _cacheTime = now;
  return packages;
};

/**
 * Sprint 6: sanitizePackage — giữ đủ trường để:
 * - matchPackages scoring chính xác (system_type, phan_khuc_gia, service_group, is_long_term, ...)
 * - promptBuilder chỉ expose trường được phép (ma_goi, ten, gia, chu_ky_ngay, ...)
 *
 * Lưu ý: các trường nội bộ (system_type, phan_khuc_gia, ...) dùng cho scoring,
 * formatPackages trong promptBuilder chỉ gửi các trường được phép lên AI.
 */
const sanitizePackage = (pkg) => {
  if (!pkg) return null;
  return {
    // Trường hiển thị cho AI (Sprint 6 §7)
    ma_goi: pkg.ma_goi,
    ten: pkg.ten,
    gia: pkg.gia,
    chu_ky_ngay: pkg.chu_ky_ngay,
    data_theo_ngay: pkg.data_theo_ngay,
    free_noi_mang: pkg.free_noi_mang,
    free_ngoai_mang: pkg.free_ngoai_mang,
    tien_ich_free: pkg.tien_ich_free,
    uudaitrong: pkg.uudaitrong,       // Sprint 6: thêm uudaitrong để AI trích dẫn ưu đãi
    dangky: pkg.dangky,
    sms: pkg.sms,                     // Expose SMS to promptBuilder
    benefit_group: pkg.benefit_group,
    // Trường nội bộ cho matchPackages (không gửi trực tiếp lên AI)
    loai_mang: pkg.loai_mang,
    is_long_term: pkg.is_long_term,
    requires_base_package: pkg.requires_base_package,
    system_type: pkg.system_type,
    phan_khuc_gia: pkg.phan_khuc_gia,
    service_group: pkg.service_group,
    phan_loai_goi: pkg.phan_loai_goi,
    do_uu_tien: pkg.do_uu_tien
  };
};

module.exports = {
  getPackageContext,
  sanitizePackage
};
