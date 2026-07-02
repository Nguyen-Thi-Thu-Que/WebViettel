const mongoose = require('mongoose');
const Package = require('../models/Package');

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
    loaiMạng: doc.loai || '4G/5G'
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
    loai: englishData.loaiMạng || '4G/5G'
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
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      mongoQuery.$or = [
        { ten: searchRegex },
        { ma_goi: searchRegex },
        { taggoiy: searchRegex },
        { uudaitrong: searchRegex }
      ];
    }

    // B. Category Filter (phan_loai_goi)
    if (req.query.category && req.query.category !== 'all') {
      const cat = req.query.category;
      if (cat === 'data') {
        mongoQuery.phan_loai_goi = 'Data';
      } else if (cat === 'combo') {
        mongoQuery.phan_loai_goi = 'Combo';
      } else if (cat === 'social') {
        mongoQuery.phan_loai_goi = 'Social';
      } else if (cat === 'voice') {
        mongoQuery.phan_loai_goi = { $in: ['Combo', 'Thoại'] }; // voice can be combo
      }
    }

    // C. Price Filter
    if (req.query.price && req.query.price !== 'all') {
      const priceOpt = req.query.price;
      if (priceOpt === 'under_50') {
        mongoQuery.gia = { $lt: 50000 };
      } else if (priceOpt === '50_100') {
        mongoQuery.gia = { $gte: 50000, $lte: 100000 };
      } else if (priceOpt === '100_200') {
        mongoQuery.gia = { $gt: 100000, $lte: 200000 };
      } else if (priceOpt === 'above_200') {
        mongoQuery.gia = { $gt: 200000 };
      }
    }

    // D. Duration Filter (chu_ky_ngay)
    if (req.query.duration && req.query.duration !== 'all') {
      const dur = req.query.duration;
      // Convert chu_ky_ngay to numeric comparisons in query
      if (dur === 'daily') {
        mongoQuery.$expr = { $lte: [{ $toInt: "$chu_ky_ngay" }, 1] };
      } else if (dur === 'weekly') {
        mongoQuery.$expr = { 
          $and: [
            { $gt: [{ $toInt: "$chu_ky_ngay" }, 1] },
            { $lte: [{ $toInt: "$chu_ky_ngay" }, 15] }
          ]
        };
      } else if (dur === 'monthly') {
        mongoQuery.$expr = { 
          $and: [
            { $gt: [{ $toInt: "$chu_ky_ngay" }, 15] },
            { $lte: [{ $toInt: "$chu_ky_ngay" }, 90] }
          ]
        };
      } else if (dur === 'yearly') {
        mongoQuery.$expr = { $gt: [{ $toInt: "$chu_ky_ngay" }, 90] };
      }
    }

    // E. 5G/4G Filter (loai)
    if (req.query.network && req.query.network !== 'all') {
      mongoQuery.loai = new RegExp(req.query.network, 'i');
    }

    // F. Thoại Filter (has voice benefit)
    if (req.query.voice === 'yes') {
      mongoQuery.free_noi_mang = { $ne: '0' };
    } else if (req.query.voice === 'no') {
      mongoQuery.free_noi_mang = '0';
    }

    // G. SMS Filter (has SMS benefit)
    if (req.query.sms === 'yes') {
      mongoQuery.sms = { $ne: '0' };
    } else if (req.query.sms === 'no') {
      mongoQuery.sms = '0';
    }

    // H. Đối tượng áp dụng
    if (req.query.target && req.query.target !== 'all') {
      mongoQuery.doi_tuong_ap_dung = new RegExp(req.query.target, 'i');
    }

    // I. Khuyến mại (has utilities or extra social apps)
    if (req.query.promo === 'yes') {
      mongoQuery.$or = [
        { noi_dung_ngoai: { $ne: '0' } },
        { tienich: { $ne: '0' } }
      ];
    }

    // Execute queries (using MongoDB aggregation to support computed sorting)
    const pipeline = [
      { $match: mongoQuery },
      // Project computed fields for stable sorting
      {
        $addFields: {
          rating: { $add: [4.2, { $divide: [ { $mod: ["$package_id", 8] }, 10 ] }] },
          registrationsCount: { $add: [ 2000, { $mod: [ { $multiply: ["$package_id", 456] }, 250000 ] } ] }
        }
      }
    ];

    // Sorting Logic
    const sortOpt = req.query.sort || 'popular';
    if (sortOpt === 'price_asc') {
      pipeline.push({ $sort: { gia: 1 } });
    } else if (sortOpt === 'price_desc') {
      pipeline.push({ $sort: { gia: -1 } });
    } else if (sortOpt === 'rating') {
      pipeline.push({ $sort: { rating: -1, package_id: 1 } });
    } else { // default 'popular'
      pipeline.push({ $sort: { registrationsCount: -1, package_id: 1 } });
    }

    // Pagination
    pipeline.push({
      $facet: {
        metadata: [{ $count: "total" }],
        data: [{ $skip: skip }, { $limit: limit }]
      }
    });

    const result = await Package.aggregate(pipeline);
    
    const total = result[0].metadata[0] ? result[0].metadata[0].total : 0;
    const packagesRaw = result[0].data;

    // Convert raw docs using English mapper
    const packagesMapped = packagesRaw.map(pkg => mapToEnglish(pkg));

    res.json({
      packages: packagesMapped,
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

    res.json(matches.map(m => mapToEnglish(m)));
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
    const categories = phanLoaiValues.map(v => {
      if (v === 'Data') return { key: 'data', label: 'Chỉ DATA' };
      if (v === 'Combo') return { key: 'combo', label: 'Combo Thoại + Data' };
      if (v === 'Social') return { key: 'social', label: 'Mạng xã hội (TikTok/YT)' };
      return { key: v.toLowerCase(), label: v };
    });

    // Get unique network technology types (loai)
    const loaiValues = await Package.distinct('loai');
    const networks = loaiValues.filter(Boolean).map(v => v.trim());

    // Get unique cycle durations (chu_ky_ngay)
    const cycleValues = await Package.distinct('chu_ky_ngay');
    const durations = cycleValues.filter(Boolean).map(v => {
      const days = parseInt(v);
      if (days <= 1) return { key: 'daily', label: 'Theo Ngày (1 ngày)' };
      if (days <= 15) return { key: 'weekly', label: 'Theo Tuần (3 - 7 ngày)' };
      if (days <= 90) return { key: 'monthly', label: 'Theo Tháng (30 ngày)' };
      return { key: 'yearly', label: 'Chu kỳ dài (> 90 ngày)' };
    });

    // Filter duplicate duration labels
    const uniqueDurations = [];
    const durKeys = new Set();
    for (const d of durations) {
      if (!durKeys.has(d.key)) {
        durKeys.add(d.key);
        uniqueDurations.push(d);
      }
    }

    res.json({
      categories,
      networks: networks.length > 0 ? networks : ['4G/5G', '5G', '4G'],
      durations: uniqueDurations.length > 0 ? uniqueDurations : [
        { key: 'daily', label: 'Theo Ngày (1 ngày)' },
        { key: 'weekly', label: 'Theo Tuần (3 - 7 ngày)' },
        { key: 'monthly', label: 'Theo Tháng (30 ngày)' }
      ]
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

    res.json(mapToEnglish(pkg));
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
    const updated = await Package.findByIdAndUpdate(pkg._id, vnData, { new: true });
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
