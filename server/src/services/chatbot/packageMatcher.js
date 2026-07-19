/**
 * packageMatcher.js — Hard-controlled RAG Package Matcher
 *
 * Truy vấn trực tiếp MongoDB bằng query động được build từ intent.
 * KHÔNG dùng scoring_config. KHÔNG trả về dữ liệu ngẫu nhiên.
 *
 * Chiến lược sắp xếp (Sorting):
 *   - Có ngân sách (minPrice/maxPrice): sort gia ASC — gói rẻ nhất trong tầm tiền trước
 *   - Không ngân sách (hỏi app/feature): sort gia ASC — gói dễ tiếp cận trước (TV7K, TV35K...)
 *   - Có ngân sách + features cụ thể: bỏ bộ lọc cứng data/voice để quét toàn bộ hệ Data/Combo
 *
 * Sàng lọc: lấy TỐI ĐA 3 GÓI CƯỚC phù hợp nhất.
 * Nếu không tìm thấy gói nào: trả về { noMatchFound: true, packages: [] }.
 */

const Package        = require('../../models/Package');
const PackageFeature = require('../../models/PackageFeature');

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Kiểm tra giá trị có phải zero/rỗng/null không.
 */
function isNonZero(val) {
  if (!val) return false;
  const s = String(val).trim().toUpperCase();
  return (
    s !== '0'        &&
    s !== '0GB'      &&
    s !== '0 GB'     &&
    s !== '0 PHÚT'   &&
    s !== '0 PHUT'   &&
    s !== '0 SMS'    &&
    s !== 'KHÔNG'    &&
    s !== 'KHONG'    &&
    !s.startsWith('0')
  );
}

/**
 * Chuẩn hoá một gói cước từ Mongoose document thành plain object
 * với đầy đủ các trường để Frontend render PackageCard.
 */
function normalizePackage(pkg) {
  const raw = typeof pkg.toObject === 'function' ? pkg.toObject() : pkg;
  return {
    id:                    raw.package_id ? String(raw.package_id) : String(raw._id),
    numericId:             raw.package_id ? Number(raw.package_id) : undefined,
    ma_goi:                raw.ma_goi              || '',
    ten:                   raw.ten                 || '',
    gia:                   raw.gia   != null        ? Number(raw.gia)   : 0,
    chu_ky_ngay:           raw.chu_ky_ngay != null  ? String(raw.chu_ky_ngay) : '30',
    dohot:                 raw.dohot               || 'normal',
    phan_loai_goi:         raw.phan_loai_goi       || 'Data',
    data_theo_ngay:        raw.data_theo_ngay       || '',
    free_noi_mang:         raw.free_noi_mang        || '',
    free_ngoai_mang:       raw.free_ngoai_mang      || '',
    sms:                   raw.sms                  || '',
    tien_ich_free:         raw.tien_ich_free         || '',
    uudaitrong:            raw.uudaitrong            || '',
    dieu_kien_dang_ky:     raw.dieu_kien_dang_ky    || '',
    dangky:                raw.dangky               || '',
    huygiahan:             raw.huygiahan            || '',
    huygoicuoc:            raw.huygoicuoc           || '',
    diem_noi_bat:          raw.diem_noi_bat         || '',
    doi_tuong_ap_dung:     raw.doi_tuong_ap_dung    || '',
    loai_mang:             raw.loai_mang            || '',
    system_type:           raw.system_type          || '',
    benefit_group:         raw.benefit_group        || '',
    is_addon:              raw.is_addon             || false,
    is_long_term:          raw.is_long_term         || false,
    requires_base_package: raw.requires_base_package || false,
    do_uu_tien:            raw.do_uu_tien           || 0
  };
}

// ─── Truncation Filter (Bộ lọc giới hạn 3 gói tốt nhất) ─────────────────────

/**
 * Sắp xếp và cắt mảng gói cước:
 *   - Luôn sort GIÁ TIỀN TĂNG DẦN để đề xuất gói dễ tiếp cận trước.
 *   - Trong cùng mức giá: ưu tiên gói "Hot", rồi do_uu_tien giảm dần.
 *   - Cắt tối đa 3 gói.
 */
function truncatePackages(packages) {
  const sorted = [...packages].sort((a, b) => {
    // Trước tiên: giá tăng dần (gói rẻ / dễ tiếp cận trước)
    const aGia = Number(a.gia) || 0;
    const bGia = Number(b.gia) || 0;
    if (aGia !== bGia) return aGia - bGia;

    // Cùng giá: Hot lên trước
    const aHot = (a.dohot || '').toLowerCase() === 'hot' ? 1 : 0;
    const bHot = (b.dohot || '').toLowerCase() === 'hot' ? 1 : 0;
    if (bHot !== aHot) return bHot - aHot;

    // Cùng giá + Hot: do_uu_tien giảm dần
    const aP = Number(a.do_uu_tien) || 0;
    const bP = Number(b.do_uu_tien) || 0;
    return bP - aP;
  });

  return sorted.slice(0, 3);
}

// ─── Tìm theo mã gói cụ thể ───────────────────────────────────────────────────

/**
 * Tìm kiếm gói cước theo mã gói cụ thể (exact match, case-insensitive).
 */
async function findByPackageCodes(codes) {
  if (!codes || codes.length === 0) return [];
  const packages = await Package.find({
    ma_goi: { $in: codes.map(c => new RegExp(`^${c}$`, 'i')) }
  }).lean();
  return packages.map(normalizePackage);
}

// ─── Build query động từ intent ───────────────────────────────────────────────

/**
 * Build và thực thi MongoDB query động từ intent.
 *
 * @param {object}  intent         — Intent object từ intentParser
 * @param {boolean} hasPriceBudget — true nếu người dùng có chỉ định khoảng giá
 * @returns {Array} mảng gói cước chuẩn hoá (chưa truncate)
 */
async function findByIntent(intent, hasPriceBudget) {
  const { minPrice, maxPrice, cycleDays, networkType, apps, features } = intent;

  // ── 1. Build query cơ bản trên collection goi_cuoc ────────────────────────
  const buildBaseQuery = (giaFilter) => {
    const q = {};

    // Bộ lọc giá được truyền vào từ bên ngoài (exact hoặc range)
    if (giaFilter !== undefined) {
      if (typeof giaFilter === 'object' && giaFilter !== null) {
        q.gia = { ...giaFilter };
      } else {
        q.gia = { $eq: giaFilter };
      }
    }

    // Khi có kết quả tìm giá: loại trừ gói giá 0 (đổi điểm Viettel++ như MP100GB, MP30GB)
    // vì các gói này có gia = 0 và sẽ chiếm hết top 3 nếu không lọc
    if (hasPriceBudget) {
      if (q.gia) {
        q.gia.$gt = 0;
      } else {
        q.gia = { $gt: 0 };
      }
    }

    // Lọc theo chu kỳ ngày (exact match — DB lưu dạng String)
    if (cycleDays != null && cycleDays > 0) {
      q.chu_ky_ngay = String(cycleDays);
    }

    // Lọc theo loại mạng
    if (networkType) {
      q.loai_mang = new RegExp(networkType, 'i');
    }

    // Bộ lọc data/voice — CHỈ áp dụng khi KHÔNG có khoảng giá để tránh lọc nhầm
    // gói Data hệ chính (SD120, SD150...) có free_noi_mang = "0"
    if (!hasPriceBudget) {
      if (features && features.voice) {
        q.$or = [
          { free_noi_mang:   { $nin: ['0', '', '0 phút', '0 Phút', null] } },
          { free_ngoai_mang: { $nin: ['0', '', '0 phút', '0 Phút', null] } }
        ];
      }
      if (features && features.data) {
        q.data_theo_ngay = { $nin: ['0', '', '0GB', '0 GB', null] };
      }
    }

    return q;
  };

  // ── 2. Nếu có yêu cầu ứng dụng: join với collection package_features ──────
  let appPackageIdFilter = null; // null = không lọc theo app

  if (apps && apps.length > 0) {
    const featureQuery = {};
    for (const app of apps) {
      switch (app) {
        case 'youtube':  featureQuery.has_youtube  = true; break;
        case 'tiktok':   featureQuery.has_tiktok   = true; break;
        case 'facebook': featureQuery.has_facebook = true; break;
        case 'tv360':    featureQuery.has_tv360    = true; break;
        case 'movie':    featureQuery.has_movie    = true; break;
        default: break;
      }
    }

    if (Object.keys(featureQuery).length > 0) {
      const featureDocs = await PackageFeature.find(featureQuery, { package_id: 1 }).lean();
      const ids = featureDocs.map(f => f.package_id);

      if (ids.length > 0) {
        appPackageIdFilter = { $in: ids };
      } else {
        // Fallback: quét tien_ich_free / uudaitrong bằng regex
        const appPatterns  = apps.filter(a => a !== 'movie').map(a => new RegExp(a, 'i'));
        const moviePattern = apps.includes('movie') ? [/phim/i, /movie/i] : [];
        const allPatterns  = [...appPatterns, ...moviePattern];
        if (allPatterns.length > 0) {
          appPackageIdFilter = 'regex_fallback'; // marker
        }
      }
    }
  }

  // ── Hàm thực thi query với giaFilter cụ thể ──────────────────────────────
  const executeQuery = async (giaFilter) => {
    const q = buildBaseQuery(giaFilter);

    // Gán app filter
    if (appPackageIdFilter && appPackageIdFilter !== 'regex_fallback') {
      q.package_id = appPackageIdFilter;
    } else if (appPackageIdFilter === 'regex_fallback') {
      const appPatterns  = apps.filter(a => a !== 'movie').map(a => new RegExp(a, 'i'));
      const moviePattern = apps.includes('movie') ? [/phim/i, /movie/i] : [];
      const orClauses = [...appPatterns, ...moviePattern].flatMap(p => [
        { tien_ich_free: p },
        { uudaitrong:    p }
      ]);
      if (orClauses.length > 0) {
        q.$or = q.$or ? [...q.$or, ...orClauses] : orClauses;
      }
    }

    return Package.find(q)
      .sort({ gia: 1, do_uu_tien: -1 })
      .limit(10)
      .lean();
  };

  // ── 3. Xác định kiểu tìm kiếm giá và thực thi query ──────────────────────────
  //
  // Kiểu A — Giá đơn (VD: "giá 120k", "gói 120k"):
  //   maxPrice có giá trị, minPrice = null hoặc 0 (không phải khoảng từ-đến).
  //   → Sử dụng cơ chế TRUY VẤN 2 TẦNG (Two-Pass Query) để cam kết lấy chính xác gói cước.
  //
  // Kiểu B — Khoảng giá (VD: "100k - 200k", "dưới 150k"):
  //   minPrice và/hoặc maxPrice xác định bởi intentParser — query thông thường.

  const isSinglePriceSearch = (
    hasPriceBudget &&
    maxPrice != null && maxPrice > 0 &&
    (minPrice === null || minPrice === 0) // chưa có giới hạn dưới rõ ràng
  );

  let rawPackages = [];

  if (isSinglePriceSearch) {
    // Khớp chính xác 100% mức giá yêu cầu (Exact Match)
    rawPackages = await executeQuery(maxPrice);
  } else {
    // Kiểu B: Khoảng giá thông thường (minPrice ↔ maxPrice)
    let giaFilter;
    if (minPrice != null || maxPrice != null) {
      giaFilter = {};
      if (minPrice != null && minPrice > 0)  giaFilter.$gte = minPrice;
      if (maxPrice != null && maxPrice > 0)  giaFilter.$lte = maxPrice;
      if (Object.keys(giaFilter).length === 0) giaFilter = undefined;
    }
    rawPackages = await executeQuery(giaFilter);
  }

  return rawPackages.map(normalizePackage);
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * matchPackages — Entry point chính.
 *
 * Luồng:
 *   1. Nếu hỏi mã gói cụ thể → tìm exact match
 *   2. Nếu không có tiêu chí nào → noMatchFound
 *   3. Tính flag hasPriceBudget → truyền sang findByIntent để điều chỉnh bộ lọc
 *   4. Query động theo intent → truncate về tối đa 3 gói (sort giá ASC)
 *   5. Nếu kết quả rỗng → noMatchFound
 *
 * @param   {object} intent — Kết quả từ intentParser
 * @returns {Promise<{ noMatchFound: boolean, packages: Array }>}
 */
const matchPackages = async (intent) => {
  if (!intent) {
    return { noMatchFound: true, packages: [] };
  }

  // ── Nếu người dùng hỏi mã gói cụ thể ─────────────────────────────────────
  if (intent.packageCodes && intent.packageCodes.length > 0) {
    const found = await findByPackageCodes(intent.packageCodes);
    if (found.length === 0) {
      return { noMatchFound: true, packages: [] };
    }
    return { noMatchFound: false, packages: truncatePackages(found) };
  }

  // ── Kiểm tra: intent có đủ tiêu chí để query không? ──────────────────────
  const hasAnyFilter = (
    intent.minPrice    != null  ||
    intent.maxPrice    != null  ||
    intent.cycleDays   != null  ||
    intent.networkType != null  ||
    (intent.apps     && intent.apps.length > 0) ||
    (intent.features && (intent.features.data || intent.features.voice || intent.features.sms))
  );

  if (!hasAnyFilter) {
    return { noMatchFound: true, packages: [] };
  }

  // ── Flag: người dùng có chỉ định ngân sách rõ ràng không? ─────────────────
  // Khi có ngân sách → bỏ bộ lọc cứng data/voice để quét toàn bộ hệ Data/Combo
  const hasPriceBudget = (intent.minPrice != null || intent.maxPrice != null);

  // ── Query theo intent ──────────────────────────────────────────────────────
  const matched = await findByIntent(intent, hasPriceBudget);

  // ── ZERO-MATCH ─────────────────────────────────────────────────────────────
  if (matched.length === 0) {
    return { noMatchFound: true, packages: [] };
  }

  // ── Truncation Filter: tối đa 3 gói, sort giá ASC ─────────────────────────
  const packages = truncatePackages(matched);

  return { noMatchFound: false, packages };
};

module.exports = { matchPackages, normalizePackage };
