const mongoose = require('mongoose');
const Package = require('../models/Package');
const PackageFeature = require('../models/PackageFeature');
const { canViewPackage } = require('../utils/permission');

function normalizeNetwork(loaiMangVal) {
  if (!loaiMangVal) return [];
  const parts = loaiMangVal
    .trim()
    .toUpperCase()
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  return Array.from(new Set(parts)).sort();
}

function compareArrays(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }
  return true;
}

// Mapping function: Tiếng Việt (DB) -> Tiếng Anh (Frontend)
function mapToEnglish(pkg) {
  if (!pkg) return null;
  const doc = pkg.toObject ? pkg.toObject() : pkg;

  // Trích xuất mã gói cước làm ID string
  const idStr = doc.ma_goi ? doc.ma_goi.toLowerCase() : `pkg_${doc.package_id}`;

  // Trích xuất duration và durationDays
  const durationDays = parseInt(doc.chu_ky_ngay) || 30;
  let duration = 'monthly';
  if (durationDays <= 1) duration = 'daily';
  else if (durationDays <= 15) duration = 'weekly';
  else if (durationDays <= 90) duration = 'monthly';
  else duration = 'yearly';

  // Trích xuất raw data limit GB/day
  let dataPerDayGb = 0;
  if (doc.data_theo_ngay) {
    const match = doc.data_theo_ngay.replace(',', '.').match(/(\d+(\.\d+)?)\s*GB\/ngày/i);
    if (match) {
      dataPerDayGb = parseFloat(match[1]);
    } else {
      const matchTotal = doc.data_theo_ngay.replace(',', '.').match(/(\d+(\.\d+)?)\s*GB/i);
      if (matchTotal) {
        dataPerDayGb = parseFloat(matchTotal[1]) / durationDays;
      }
    }
  }

  // Trích xuất thoại
  let voiceFreeInternalMin = 0;
  let voiceFreeExternalMin = 0;
  if (doc.free_noi_mang && doc.free_noi_mang !== '0') {
    const match = doc.free_noi_mang.match(/(\d+)\s*p/i) || doc.free_noi_mang.match(/(\d+)\s*phút/i);
    voiceFreeInternalMin = match ? parseInt(match[1]) : 1000; // fallback
  }
  if (doc.free_ngoai_mang && doc.free_ngoai_mang !== '0') {
    const match = doc.free_ngoai_mang.match(/(\d+)\s*p/i) || doc.free_ngoai_mang.match(/(\d+)\s*phút/i);
    voiceFreeExternalMin = match ? parseInt(match[1]) : 50; // fallback
  }

  // Tách các app miễn phí data
  let socialFreeApps = [];
  if (doc.noi_dung_ngoai && doc.noi_dung_ngoai !== '0') {
    socialFreeApps = doc.noi_dung_ngoai.split(',').map(s => s.trim()).filter(Boolean);
  } else if (doc.uudaingoai && doc.uudaingoai !== '0') {
    socialFreeApps = doc.uudaingoai.split(',').map(s => s.trim()).filter(Boolean);
  }

  // Tách tags
  let tags = [];
  if (doc.taggoiy) {
    tags = doc.taggoiy.split(',').map(t => t.trim()).filter(Boolean);
  } else if (doc.diem_noi_bat) {
    tags = [doc.diem_noi_bat];
  }
  if (doc.dohot === 'Hot') {
    tags.unshift('Hot');
  }

  // Tạo các giá trị giả lập ổn định cho rating và registrationsCount dựa trên id
  const pkgId = doc.package_id || doc.id || 0;
  const rating = (4.3 + ((pkgId * 7) % 7) / 10).toFixed(1);
  const registrationsCount = 5000 + ((pkgId * 123) % 495000);

  // Terms array
  const terms = [
    doc.chinh_sach_ap_dung || 'Áp dụng cho thuê bao Viettel di động.',
    doc.dangky ? `Cách đăng ký: ${doc.dangky}` : `Đăng ký: Soạn ${doc.ma_goi} gửi 191`,
    doc.huygiahan ? `Hủy gia hạn: ${doc.huygiahan}` : 'Hủy gia hạn: Soạn HUY gửi 191',
    doc.huygoicuoc ? `Hủy gói: ${doc.huygoicuoc}` : 'Hủy gói cước: Soạn HUYDATA gửi 191'
  ].filter(Boolean);

  // Map category
  let category = 'data';
  const loaiLower = (doc.phan_loai_goi || '').toLowerCase();
  if (loaiLower.includes('combo') || voiceFreeInternalMin > 0) {
    category = 'combo';
  } else if (loaiLower.includes('social') || loaiLower.includes('trí') || socialFreeApps.length > 0) {
    category = 'social';
  } else if (loaiLower.includes('thoại') || loaiLower.includes('voice')) {
    category = 'voice';
  }

  return {
    id: idStr, // string ID cho frontend
    dbId: doc._id, // lưu MongoDB _id
    numericId: doc.package_id || doc.id, // lưu id số gốc
    is_auto_renew: doc.is_auto_renew !== undefined ? doc.is_auto_renew : true,
    ma_goi: doc.ma_goi,
    name: doc.ten,
    price: doc.gia,
    duration,
    durationDays,
    dataLimit: doc.data_theo_ngay || '0 GB',
    dataPerDayGb: parseFloat(dataPerDayGb.toFixed(2)),
    voiceFreeInternalMin,
    voiceFreeExternalMin,
    socialFreeApps,
    description: doc.uudaitrong || doc.ten,
    terms,
    conditions: doc.doi_tuong_ap_dung || 'Dành cho tất cả thuê bao di động Viettel.',
    isPopular: doc.dohot === 'Hot',
    category,
    rating: parseFloat(rating),
    registrationsCount,
    tags,
    loaiMạng: doc.loai || '4G/5G',
    loai_mang: doc.loai_mang !== undefined && doc.loai_mang !== null ? doc.loai_mang : (doc.loai ? doc.loai.replace(/\//g, ',') : ''),
    diem_noi_bat: doc.diem_noi_bat || '',
    tien_ich_free: doc.tien_ich_free || doc.tienich || '0',
    noi_dung_ngoai: doc.noi_dung_ngoai || '0',
    goi_thay_the: doc.goi_thay_the || '',
    dieu_kien_dang_ky: doc.dieu_kien_dang_ky || '',
    chinh_sach_ap_dung: doc.chinh_sach_ap_dung || ''
  };
}

// Mapping function: Tiếng Anh (Frontend) -> Tiếng Việt (DB)
function mapToVietnamese(englishData) {
  const ma_goi = englishData.ma_goi || (englishData.name ? englishData.name.split('-')[0].trim().toUpperCase() : 'NEW_PKG');

  // Map category back to phan_loai_goi
  let phan_loai_goi = 'Data';
  if (englishData.category === 'combo') phan_loai_goi = 'Combo';
  else if (englishData.category === 'social') phan_loai_goi = 'Social';
  else if (englishData.category === 'voice') phan_loai_goi = 'Thoại';

  const socialAppsStr = Array.isArray(englishData.socialFreeApps)
    ? englishData.socialFreeApps.join(',')
    : englishData.socialFreeApps || '0';

  const tagsStr = Array.isArray(englishData.tags)
    ? englishData.tags.join(',')
    : englishData.tags || '';

  return {
    ma_goi,
    ten: englishData.name,
    dohot: englishData.isPopular ? 'Hot' : 'normal',
    phan_loai_goi,
    gia: parseInt(englishData.price) || 0,
    data_theo_ngay: englishData.dataLimit || '',
    free_noi_mang: englishData.voiceFreeInternalMin ? `${englishData.voiceFreeInternalMin} phút nội mạng` : '0',
    free_ngoai_mang: englishData.voiceFreeExternalMin ? `${englishData.voiceFreeExternalMin} phút ngoại mạng` : '0',
    sms: englishData.sms || '0',
    doi_tuong_ap_dung: englishData.conditions || 'Tất cả SIM di động',
    uudaitrong: englishData.description || '',
    chu_ky_ngay: String(englishData.durationDays || 30),
    dangky: englishData.terms && englishData.terms[1] ? englishData.terms[1].replace('Cách đăng ký: ', '') : `Soạn ${ma_goi} gửi 191`,
    huygiahan: englishData.terms && englishData.terms[2] ? englishData.terms[2].replace('Hủy gia hạn: ', '') : 'Soạn HUY gửi 191',
    huygoicuoc: englishData.terms && englishData.terms[3] ? englishData.terms[3].replace('Hủy gói: ', '') : 'Soạn HUYDATA gửi 191',
    taggoiy: tagsStr,
    Nhom_Goi: phan_loai_goi === 'Data' ? 'Gói Data Tháng' : phan_loai_goi === 'Combo' ? 'Gói Combo Thoại + Data' : 'Gói Tiết Kiệm MXH/Giải Trí',
    loai: englishData.loaiMạng || '4G/5G',
    loai_mang: englishData.loai_mang || ''
  };
}

// 1. GET /packages - Get list of packages with pagination, search, filters, sorting
exports.getPackages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;
    const skip = (page - 1) * limit;

    const mongoQuery = {};

    // A. Keyword Search
    const searchVal = req.query.search || req.query.q;
    if (searchVal && searchVal.trim()) {
      const searchRegex = new RegExp(searchVal.trim(), 'i');
      mongoQuery.$or = [
        { ten: searchRegex },
        { ma_goi: searchRegex },
        { taggoiy: searchRegex },
        { uudaitrong: searchRegex }
      ];
    }

    // B. Category Filter (phan_loai_goi)
    if (req.query.category && req.query.category !== 'all') {
      const cat = req.query.category.toLowerCase();
      if (cat === 'data') {
        mongoQuery.phan_loai_goi = 'Data';
      } else if (cat === 'combo') {
        mongoQuery.phan_loai_goi = 'Combo';
      } else if (cat === 'social') {
        mongoQuery.phan_loai_goi = 'Social';
      } else if (cat === 'voice') {
        mongoQuery.phan_loai_goi = { $in: ['Combo', 'Thoại'] };
      } else {
        // Fallback exact regex check
        mongoQuery.phan_loai_goi = new RegExp(`^${cat}$`, 'i');
      }
    }

    // C. Price Filter (Lọc theo gia, không dựa vào phan_khuc_gia)
    if (req.query.price && req.query.price !== 'all') {
      const priceOpt = req.query.price;
      if (priceOpt === 'Gia_re') {
        mongoQuery.gia = { $lt: 50000 };
      } else if (priceOpt === 'Trung_binh') {
        mongoQuery.gia = { $gte: 50000, $lte: 150000 };
      } else if (priceOpt === 'Cao_cap') {
        mongoQuery.gia = { $gt: 150000 };
      } else if (priceOpt === 'under_50') {
        mongoQuery.gia = { $lt: 50000 };
      } else if (priceOpt === '50_100') {
        mongoQuery.gia = { $gte: 50000, $lte: 100000 };
      } else if (priceOpt === '100_200') {
        mongoQuery.gia = { $gt: 100000, $lte: 200000 };
      } else if (priceOpt === 'above_200') {
        mongoQuery.gia = { $gt: 200000 };
      }
    }

    // D. Cycle / Duration Filter (chu_ky_ngay)
    const cycleOpt = req.query.cycle || req.query.duration;
    if (cycleOpt && cycleOpt !== 'all') {
      if (/^\d+$/.test(cycleOpt)) {
        const daysNum = parseInt(cycleOpt);
        mongoQuery.$expr = { $eq: [{ $toInt: "$chu_ky_ngay" }, daysNum] };
      } else if (cycleOpt === 'daily') {
        mongoQuery.$expr = { $lte: [{ $toInt: "$chu_ky_ngay" }, 1] };
      } else if (cycleOpt === 'weekly') {
        mongoQuery.$expr = {
          $and: [
            { $gt: [{ $toInt: "$chu_ky_ngay" }, 1] },
            { $lte: [{ $toInt: "$chu_ky_ngay" }, 15] }
          ]
        };
      } else if (cycleOpt === 'monthly') {
        mongoQuery.$expr = {
          $and: [
            { $gt: [{ $toInt: "$chu_ky_ngay" }, 15] },
            { $lte: [{ $toInt: "$chu_ky_ngay" }, 90] }
          ]
        };
      } else if (cycleOpt === 'yearly') {
        mongoQuery.$expr = { $gt: [{ $toInt: "$chu_ky_ngay" }, 90] };
      }
    }

    // E. Network Filter (removed from MongoDB query, filtered in-memory with normalized data below)

    // F. Data Filter
    if (req.query.data && req.query.data !== 'all') {
      if (req.query.data === 'yes' || req.query.data === 'true') {
        mongoQuery.data_theo_ngay = { $ne: '0', $exists: true };
      } else if (req.query.data === 'no' || req.query.data === 'false') {
        mongoQuery.$or = [
          { data_theo_ngay: '0' },
          { data_theo_ngay: '' },
          { data_theo_ngay: null }
        ];
      }
    }

    // G. Call Filter (has voice benefit)
    if (req.query.call && req.query.call !== 'all') {
      if (req.query.call === 'yes' || req.query.call === 'true') {
        mongoQuery.$or = [
          { free_noi_mang: { $ne: '0', $exists: true } },
          { free_ngoai_mang: { $ne: '0', $exists: true } }
        ];
      } else if (req.query.call === 'no' || req.query.call === 'false') {
        mongoQuery.free_noi_mang = '0';
        mongoQuery.free_ngoai_mang = '0';
      }
    }

    // H. SMS Filter (has SMS benefit)
    if (req.query.sms && req.query.sms !== 'all') {
      if (req.query.sms === 'yes' || req.query.sms === 'true') {
        mongoQuery.sms = { $ne: '0' };
      } else if (req.query.sms === 'no' || req.query.sms === 'false') {
        mongoQuery.sms = '0';
      }
    }

    // I. Hot Filter
    if (req.query.hot && req.query.hot !== 'all') {
      if (req.query.hot === 'yes' || req.query.hot === 'true') {
        mongoQuery.dohot = 'Hot';
      } else if (req.query.hot === 'no' || req.query.hot === 'false') {
        mongoQuery.dohot = { $ne: 'Hot' };
      }
    }

    // J. Recommended Filter
    if (req.query.recommended && req.query.recommended !== 'all') {
      if (req.query.recommended === 'yes' || req.query.recommended === 'true') {
        mongoQuery.$or = [
          { dohot: 'Hot' },
          { do_uu_tien: { $ne: '1' } },
          { taggoiy: /gợi ý/i }
        ];
      }
    }

    // K. Target Filter (Audience target)
    if (req.query.target && req.query.target.trim() && req.query.target.trim() !== 'all') {
      mongoQuery.doi_tuong_ap_dung = new RegExp(req.query.target.trim(), 'i');
    }

    // L. Promo Filter (App Promotion / free utilities)
    if (req.query.promo && req.query.promo !== 'all') {
      if (req.query.promo === 'yes' || req.query.promo === 'true') {
        mongoQuery.$or = [
          { tien_ich_free: { $ne: '0', $exists: true } },
          { tienich: { $ne: '0', $exists: true } }
        ];
      } else {
        const appRegex = new RegExp(req.query.promo.trim(), 'i');
        mongoQuery.$or = [
          { tien_ich_free: appRegex },
          { tienich: appRegex }
        ];
      }
    }

    // Execute queries (using MongoDB aggregation to support computed sorting)
    const pipeline = [
      { $match: mongoQuery },
      // Project computed fields for stable sorting
      {
        $addFields: {
          rating: { $add: [4.2, { $divide: [{ $mod: ["$package_id", 8] }, 10] }] },
          registrationsCount: { $add: [2000, { $mod: [{ $multiply: ["$package_id", 456] }, 250000] }] }
        }
      }
    ];

    // Sorting Logic
    const sortOpt = req.query.sort || 'popular';
    const normalizedSort = sortOpt.toLowerCase().trim();

    if (normalizedSort === 'price_asc' || normalizedSort === 'price asc') {
      pipeline.push({ $sort: { gia: 1, package_id: 1 } });
    } else if (normalizedSort === 'price_desc' || normalizedSort === 'price desc') {
      pipeline.push({ $sort: { gia: -1, package_id: 1 } });
    } else if (normalizedSort === 'name' || normalizedSort === 'name asc') {
      pipeline.push({ $sort: { ten: 1, package_id: 1 } });
    } else if (normalizedSort === 'newest' || normalizedSort === 'newest') {
      pipeline.push({ $sort: { createdAt: -1, package_id: -1 } });
    } else if (normalizedSort === 'recommended' || normalizedSort === 'recommended') {
      pipeline.push({ $sort: { rating: -1, package_id: 1 } });
    } else { // default 'popular' / 'most_registered'
      pipeline.push({ $sort: { registrationsCount: -1, package_id: 1 } });
    }

    const resultRaw = await Package.aggregate(pipeline);

    // Convert raw docs using English mapper
    const packagesMapped = resultRaw.map(pkg => mapToEnglish(pkg));

    // Filter packages through the permission service
    let filteredPackages = packagesMapped.filter(pkg => canViewPackage(req.user, pkg));

    // Fetch and merge features from package_features
    const packageIds = filteredPackages.map(p => p.numericId);
    const features = await PackageFeature.find({ package_id: { $in: packageIds } });
    const featuresMap = new Map();
    features.forEach(f => {
      featuresMap.set(f.package_id, f);
    });
    filteredPackages = filteredPackages.map(pkg => {
      const feat = featuresMap.get(pkg.numericId) || {};
      return {
        ...pkg,
        has_data: feat.has_data !== undefined ? feat.has_data : false,
        has_voice: feat.has_voice !== undefined ? feat.has_voice : false,
        has_sms: feat.has_sms !== undefined ? feat.has_sms : false,
        has_tv360: feat.has_tv360 !== undefined ? feat.has_tv360 : false,
        has_youtube: feat.has_youtube !== undefined ? feat.has_youtube : false,
        has_tiktok: feat.has_tiktok !== undefined ? feat.has_tiktok : false,
        has_facebook: feat.has_facebook !== undefined ? feat.has_facebook : false
      };
    });

    // Filter by loai_mang in-memory using normalized values
    const netOpt = req.query.network || req.query.loai_mang;
    if (netOpt && netOpt !== 'all' && netOpt !== '') {
      const netLower = netOpt.toLowerCase();
      filteredPackages = filteredPackages.filter(pkg => {
        const normalized = normalizeNetwork(pkg.loai_mang);
        if (netLower === '4g') {
          return normalized.includes('4G');
        } else if (netLower === '5g') {
          return normalized.includes('5G');
        } else if (netLower === 'both' || netLower === '4g,5g' || netLower === '5g,4g') {
          return normalized.includes('4G') && normalized.includes('5G');
        }
        return true;
      });
    }

    const total = filteredPackages.length;
    const paginatedPackages = filteredPackages.slice(skip, skip + limit);

    res.json({
      packages: paginatedPackages,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalItems: total
    });
  } catch (error) {
    console.error("Error in getPackages API:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ khi tải danh sách gói cước." });
  }
};

// 2. GET /packages/search - Fast keyword search
exports.searchPackages = async (req, res) => {
  try {
    const keyword = req.query.q || '';
    if (!keyword.trim()) {
      return res.json([]);
    }

    const searchRegex = new RegExp(keyword, 'i');
    const matches = await Package.find({
      $or: [
        { ten: searchRegex },
        { ma_goi: searchRegex },
        { taggoiy: searchRegex }
      ]
    }).limit(10);

    const mapped = matches.map(m => mapToEnglish(m));
    const filtered = mapped.filter(p => canViewPackage(req.user, p));
    res.json(filtered);
  } catch (error) {
    console.error("Error in searchPackages API:", error);
    res.status(500).json({ success: false, message: "Lỗi tìm kiếm." });
  }
};

// 3. GET /packages/filter - Dynamic filter options from DB
exports.getFilterOptions = async (req, res) => {
  try {
    // Get unique categories (phan_loai_goi)
    const phanLoaiValues = await Package.distinct('phan_loai_goi');
    const categoriesMap = new Map();
    phanLoaiValues.forEach(v => {
      if (!v) return;
      const lower = v.toLowerCase();
      if (lower === 'data') {
        categoriesMap.set('data', { key: 'data', label: 'Data' });
      } else if (lower === 'combo') {
        categoriesMap.set('combo', { key: 'combo', label: 'Combo' });
      } else if (lower === 'mxh' || lower === 'mxh') {
        categoriesMap.set('mxh', { key: 'mxh', label: 'Mạng xã hội' });
      } else {
        categoriesMap.set(lower, { key: lower, label: v });
      }
    });
    const categories = Array.from(categoriesMap.values());

    // Get unique network technology types (loai)
    const loaiValues = await Package.distinct('loai');
    const networks = loaiValues.filter(Boolean).map(v => v.trim());

    // Get unique cycle durations (chu_ky_ngay) dynamically
    const cycleValues = await Package.distinct('chu_ky_ngay');
    const durations = cycleValues
      .filter(Boolean)
      .map(v => parseInt(v))
      .filter(v => !isNaN(v))
      .sort((a, b) => a - b)
      .map(days => ({
        key: String(days),
        label: `${days} ngày`
      }));

    // Get unique app promos and utilities dynamically from tien_ich_free only
    const distinctTienIch = await Package.distinct('tien_ich_free');

    const combined = new Set();
    distinctTienIch.forEach(val => {
      if (!val || val === '0') return;
      val.split(',').forEach(item => {
        const trimmed = item.trim();
        if (
          !trimmed ||
          trimmed === '0' ||
          trimmed === '0GB' ||
          trimmed === '0 GB' ||
          trimmed === 'null' ||
          trimmed === 'undefined'
        ) {
          return;
        }

        // Exclude description details
        const lower = trimmed.toLowerCase();
        if (
          lower.includes(':') ||
          lower.includes('ngày') ||
          lower.includes('tốc độ') ||
          lower.includes('đổi') ||
          lower.includes('tài khoản') ||
          lower.includes('miễn phí') ||
          lower.includes('truy cập') ||
          lower.includes('gb')
        ) {
          return;
        }

        let normalized = trimmed;
        if (lower === 'youtube' || lower === 'yt') normalized = 'Youtube';
        else if (lower === 'tiktok') normalized = 'TikTok';
        else if (lower === 'facebook' || lower === 'fb') normalized = 'Facebook';
        else if (lower === 'messenger') normalized = 'Messenger';
        else if (lower === 'tv360') normalized = 'TV360';
        else if (lower === 'zalo') normalized = 'Zalo';
        else if (lower === 'spotify') normalized = 'Spotify';
        else if (lower === 'netflix') normalized = 'Netflix';
        else {
          normalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
        }
        combined.add(normalized);
      });
    });

    const appPromos = [...combined].sort((a, b) => a.localeCompare(b));

    res.json({
      categories,
      networks: networks.length > 0 ? networks : ['4G/5G', '5G', '4G'],
      durations,
      appPromos
    });
  } catch (error) {
    console.error("Error in getFilterOptions API:", error);
    res.status(500).json({ success: false, message: "Lỗi tải cấu hình bộ lọc." });
  }
};

// 4. GET /packages/categories - Endpoint for client categories
exports.getCategories = async (req, res) => {
  try {
    res.json([
      { id: 'data', name: 'Chỉ DATA', count: await Package.countDocuments({ phan_loai_goi: 'Data' }) },
      { id: 'combo', name: 'Combo Thoại + Data', count: await Package.countDocuments({ phan_loai_goi: 'Combo' }) },
      { id: 'social', name: 'Mạng xã hội', count: await Package.countDocuments({ phan_loai_goi: 'Social' }) }
    ]);
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi tải categories." });
  }
};

// 5. GET /packages/providers - Providers list
exports.getProviders = (req, res) => {
  res.json(['Viettel']);
};

// 6. GET /packages/:id - Get detail package
exports.getPackageById = async (req, res) => {
  try {
    const idParam = req.params.id;

    // Find by _id (if valid ObjectId), by ma_goi, or by numeric id
    let pkg = null;
    if (mongoose.Types.ObjectId.isValid(idParam)) {
      pkg = await Package.findById(idParam);
    }

    if (!pkg) {
      let numericId = -1;
      if (idParam.startsWith('pkg_')) {
        const parsed = parseInt(idParam.replace('pkg_', ''));
        if (!isNaN(parsed)) numericId = parsed;
      } else if (!isNaN(idParam)) {
        numericId = parseInt(idParam);
      }

      pkg = await Package.findOne({
        $or: [
          { ma_goi: new RegExp(`^${idParam}$`, 'i') },
          { package_id: numericId }
        ]
      });
    }

    if (!pkg) {
      return res.status(404).json({ success: false, message: "Không tìm thấy gói cước." });
    }

    const mapped = mapToEnglish(pkg);
    if (!canViewPackage(req.user, mapped)) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền xem gói cước này." });
    }

    const feat = await PackageFeature.findOne({ package_id: mapped.numericId });
    if (feat) {
      mapped.has_data = feat.has_data !== undefined ? feat.has_data : false;
      mapped.has_voice = feat.has_voice !== undefined ? feat.has_voice : false;
      mapped.has_sms = feat.has_sms !== undefined ? feat.has_sms : false;
      mapped.has_tv360 = feat.has_tv360 !== undefined ? feat.has_tv360 : false;
      mapped.has_youtube = feat.has_youtube !== undefined ? feat.has_youtube : false;
      mapped.has_tiktok = feat.has_tiktok !== undefined ? feat.has_tiktok : false;
      mapped.has_facebook = feat.has_facebook !== undefined ? feat.has_facebook : false;
    }

    res.json(mapped);
  } catch (error) {
    console.error("Error in getPackageById API:", error);
    res.status(500).json({ success: false, message: "Lỗi lấy chi tiết gói cước." });
  }
};

// 7. POST /packages - Create package (Admin)
exports.createPackage = async (req, res) => {
  try {
    const englishData = req.body;

    if (!englishData.name || !englishData.price) {
      return res.status(400).json({ success: false, message: "Tên gói cước và giá cước là bắt buộc." });
    }

    // Find next numeric id
    const lastPkg = await Package.findOne().sort({ package_id: -1 });
    const nextId = lastPkg ? lastPkg.package_id + 1 : 1;

    // Convert from English to Vietnamese
    const vnData = mapToVietnamese(englishData);
    vnData.package_id = nextId;

    // Double check unique package code
    const existing = await Package.findOne({ ma_goi: vnData.ma_goi });
    if (existing) {
      return res.status(400).json({ success: false, message: `Mã gói cước ${vnData.ma_goi} đã tồn tại.` });
    }

    const created = await Package.create(vnData);
    console.log(`[Admin] Created package: ${created.ma_goi} (${created.ten})`);

    res.status(201).json({
      success: true,
      message: "Tạo gói cước thành công!",
      package: mapToEnglish(created)
    });
  } catch (error) {
    console.error("Error in createPackage API:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ khi tạo gói cước." });
  }
};

// 8. PUT /packages/:id - Update package (Admin)
exports.updatePackage = async (req, res) => {
  try {
    const idParam = req.params.id;
    const englishData = req.body;

    let pkg = null;
    if (mongoose.Types.ObjectId.isValid(idParam)) {
      pkg = await Package.findById(idParam);
    }

    if (!pkg) {
      let numericId = -1;
      if (idParam.startsWith('pkg_')) {
        const parsed = parseInt(idParam.replace('pkg_', ''));
        if (!isNaN(parsed)) numericId = parsed;
      } else if (!isNaN(idParam)) {
        numericId = parseInt(idParam);
      }

      pkg = await Package.findOne({
        $or: [
          { ma_goi: new RegExp(`^${idParam}$`, 'i') },
          { package_id: numericId }
        ]
      });
    }

    if (!pkg) {
      return res.status(404).json({ success: false, message: "Không tìm thấy gói cước để cập nhật." });
    }

    const vnData = mapToVietnamese(englishData);

    // Perform update
    const updated = await Package.findByIdAndUpdate(pkg._id, vnData, { returnDocument: 'after' });
    console.log(`[Admin] Updated package: ${updated.ma_goi}`);

    res.json({
      success: true,
      message: "Cập nhật gói cước thành công!",
      package: mapToEnglish(updated)
    });
  } catch (error) {
    console.error("Error in updatePackage API:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ khi cập nhật gói cước." });
  }
};

// 9. DELETE /packages/:id - Delete package (Admin)
exports.deletePackage = async (req, res) => {
  try {
    const idParam = req.params.id;

    let pkg = null;
    if (mongoose.Types.ObjectId.isValid(idParam)) {
      pkg = await Package.findById(idParam);
    }
    if (!pkg) {
      let numericId = -1;
      if (idParam.startsWith('pkg_')) {
        const parsed = parseInt(idParam.replace('pkg_', ''));
        if (!isNaN(parsed)) numericId = parsed;
      } else if (!isNaN(idParam)) {
        numericId = parseInt(idParam);
      }

      pkg = await Package.findOne({
        $or: [
          { ma_goi: new RegExp(`^${idParam}$`, 'i') },
          { package_id: numericId }
        ]
      });
    }

    if (!pkg) {
      return res.status(404).json({ success: false, message: "Không tìm thấy gói cước để xóa." });
    }

    await Package.findByIdAndDelete(pkg._id);
    console.log(`[Admin] Deleted package: ${pkg.ma_goi}`);

    res.json({
      success: true,
      message: `Đã xóa thành công gói cước ${pkg.ma_goi}.`
    });
  } catch (error) {
    console.error("Error in deletePackage API:", error);
    res.status(500).json({ success: false, message: "Lỗi máy chủ khi xóa gói cước." });
  }
};

exports.mapToEnglish = mapToEnglish;
