/**
 * intentParser.js — Hard-controlled RAG Intent Extractor
 *
 * Trích xuất dữ liệu có cấu trúc từ câu hỏi tự nhiên của người dùng.
 * Trả về object chuẩn dùng để build MongoDB query động trong packageMatcher.
 *
 * Output schema:
 * {
 *   minPrice:    Number | null,
 *   maxPrice:    Number | null,
 *   cycleDays:   Number | null,
 *   networkType: '4G' | '5G' | null,
 *   apps:        string[],   // ['youtube', 'tiktok', 'facebook', 'tv360']
 *   features: {
 *     data:  boolean,
 *     voice: boolean,
 *     sms:   boolean
 *   },
 *   packageCodes: string[]   // Mã gói cước cụ thể được hỏi (ví dụ: ['SD135'])
 * }
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Chuẩn hoá chuỗi: bỏ dấu tiếng Việt, lowercase, chuẩn hoá khoảng trắng.
 */
function normalize(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Danh sách từ khóa ứng dụng/dịch vụ PHẢI được xử lý bởi extractApps,
 * KHÔNG được lọt vào packageCodes dù chúng có dạng alphanum.
 */
const APP_KEYWORDS_UPPER = new Set([
  'TV360', 'TIVI360', 'TIVI 360',
  'TIKTOK', 'TIK', 'TOK',
  'YOUTUBE', 'YTB', 'YT',
  'FACEBOOK', 'FB',
  'INSTAGRAM', 'IG',
  'ZALO'
]);

/**
 * Trích xuất mã gói cước cụ thể từ tin nhắn.
 * Mã gói hợp lệ: gồm cả chữ và số, ví dụ SD135, ST90N, MXH100, V120C, 3FB50K.
 * Tuyệt đối KHÔNG chứa các từ khóa ứng dụng (tv360, tiktok, youtube, facebook...).
 */
function extractPackageCodes(message) {
  if (!message) return [];
  const upper = message.toUpperCase().replace(/[.,\/#!$%\^&\*;:{}=`~()]/g, ' ');
  const words  = upper.split(/\s+/).filter(Boolean);
  const codes  = [];

  for (const word of words) {
    if (!/^[A-Z0-9]+$/.test(word)) continue;
    if (/^\d+$/.test(word)) continue;                   // Số thuần
    if (/^\d+(K|Đ|D|VND)$/i.test(word)) continue;      // Đơn vị tiền
    if (word === '5G' || word === '4G') continue;       // Tên mạng
    if (APP_KEYWORDS_UPPER.has(word)) continue;         // Từ khóa ứng dụng — xử lý bởi extractApps

    // Mã gói hợp lệ: có cả chữ lẫn số
    if (/[A-Z]/.test(word) && /\d/.test(word)) {
      if (!codes.includes(word)) codes.push(word);
    }
  }

  return codes;
}

/**
 * Chuyển số + đơn vị thành VND.
 * Trả về số nguyên hoặc null nếu không nhận dạng được.
 */
function convertToVND(num, unit) {
  if (!num || num <= 0) return null;
  const u = (unit || '').toLowerCase().trim();

  // Nghìn / k
  if (u === 'k' || u === 'nghìn' || u === 'nghin' || u === 'ngàn' || u === 'ngan') return Math.round(num * 1000);

  // Triệu / tr
  if (u === 'tr' || u === 'triệu' || u === 'trieu') return Math.round(num * 1000000);

  // Đồng / đ / d / vnd — phân biệt số nhỏ (< 1000 → nhân 1000) với số nguyên đầy đủ
  if (u === 'đ' || u === 'd' || u === 'dong' || u === 'vnd') {
    return num < 1000 ? Math.round(num * 1000) : Math.round(num);
  }

  // Không có đơn vị — tự nhận diện theo độ lớn
  if (num >= 10000) return Math.round(num);  // Đã là VND (e.g. 90000)
  if (num >= 1 && num <= 9999) return null;  // Không rõ đơn vị → bỏ qua

  return null;
}

/**
 * Trích xuất khoảng giá từ câu hỏi người dùng.
 * Hỗ trợ các dạng:
 *   - "từ 100k - 200k" / "100k đến 200k"     → { minPrice: 100000, maxPrice: 200000 }
 *   - "100-200k", "100k-200k"                  → { minPrice: 100000, maxPrice: 200000 }
 *   - "khoảng 2 - 3 triệu"                    → { minPrice: 2000000, maxPrice: 3000000 }
 *   - "2-3tr", "2-3 triệu"                    → { minPrice: 2000000, maxPrice: 3000000 }
 *   - "dưới 100k" / "tối đa 50k"              → { minPrice: 0, maxPrice: 100000 }
 *   - "trên 90k" / "ít nhất 90k"              → { minPrice: 90000, maxPrice: null }
 *   - "khoảng 150k" / "tầm 2 triệu"           → { minPrice: null, maxPrice: 150000 }
 * Trả về { minPrice: null, maxPrice: null } nếu không tìm thấy.
 */
function extractPriceRange(text) {
  // Chuẩn hoá: xóa dấu chấm ngăn cách ngàn, loại các từ khóa gây nhiễu
  const lower = text
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/,/g, '')
    .replace(/\btv\s*360\b/gi, '')
    .replace(/\b5g\b/gi, '')
    .replace(/\b4g\b/gi, '');

  const UNIT = '(k|nghìn|nghin|ngàn|ngan|tr|triệu|trieu|đ|d|dong|\\bvnd\\b)';
  const NUM  = '(\\d+(?:[.,]\\d+)?)';

  // ── Dạng khoảng viết liền / viết cách: "100-200k", "100k-200k", "từ X đến/- Y" ─
  const rangePatterns = [
    // "từ X k đến Y k" hoặc "X k - Y k" hoặc "X - Y k" (đơn vị cuối)
    new RegExp(`(?:từ\\s*|tu\\s*)?${NUM}\\s*${UNIT}?\\s*(?:đến|den|-|to|~)\\s*${NUM}\\s*${UNIT}`, 'i'),
    // "khoảng X - Y triệu"
    new RegExp(`(?:khoảng|khoang|tầm|tam|từ|tu|trong\\s+khoảng)\\s*${NUM}\\s*${UNIT}?\\s*(?:-|đến|den|~)\\s*${NUM}\\s*${UNIT}`, 'i')
  ];

  for (const rp of rangePatterns) {
    const m = lower.match(rp);
    if (m) {
      const nums  = [];
      const units = [];
      let i = 1;
      while (i < m.length) {
        if (m[i] && /^\d/.test(m[i])) {
          nums.push(parseFloat(m[i].replace(',', '.')));
          units.push(m[i + 1] || '');
          i += 2;
        } else {
          i++;
        }
      }
      if (nums.length >= 2) {
        // Nếu số đầu không có đơn vị, mượn đơn vị của số sau
        const unitA = units[0] || units[1];
        const unitB = units[1] || units[0];
        const vA = convertToVND(nums[0], unitA);
        const vB = convertToVND(nums[1], unitB);
        if (vA !== null && vB !== null) {
          return { minPrice: Math.min(vA, vB), maxPrice: Math.max(vA, vB) };
        }
      }
    }
  }

  // ── Dạng giới hạn trên: "dưới X", "không quá X", "tối đa X" ──────────────
  const upperPattern = new RegExp(
    `(?:dưới|duoi|không\\s*quá|khong\\s*qua|tối\\s*đa|toi\\s*da)\\s*${NUM}\\s*${UNIT}?`,
    'i'
  );
  const upperMatch = lower.match(upperPattern);
  if (upperMatch) {
    const num  = parseFloat(upperMatch[1].replace(',', '.'));
    const unit = upperMatch[2] || '';
    const maxV = convertToVND(num, unit);
    if (maxV !== null) return { minPrice: 0, maxPrice: maxV };
  }

  // ── Dạng giới hạn dưới: "trên X", "ít nhất X", "từ X trở lên" ──────────────
  const lowerPattern = new RegExp(
    `(?:trên|tren|ít\\s*nhất|it\\s*nhat)\\s*${NUM}\\s*${UNIT}?`,
    'i'
  );
  const lowerMatch = lower.match(lowerPattern);
  if (lowerMatch) {
    const num  = parseFloat(lowerMatch[1].replace(',', '.'));
    const unit = lowerMatch[2] || '';
    const minV = convertToVND(num, unit);
    if (minV !== null) return { minPrice: minV, maxPrice: null };
  }

  // ── Dạng ước lượng: "khoảng X", "tầm X", "giá X" ─────────────────────────
  const approxPattern = new RegExp(
    `(?:khoảng|khoang|tầm|tam|giá|gia|cỡ|co)\\s*${NUM}\\s*${UNIT}?`,
    'i'
  );
  const approxMatch = lower.match(approxPattern);
  if (approxMatch) {
    const num  = parseFloat(approxMatch[1].replace(',', '.'));
    const unit = approxMatch[2] || '';
    const v    = convertToVND(num, unit);
    if (v !== null) return { minPrice: null, maxPrice: v };
  }

  // ── Dạng đơn thuần có đơn vị: "90k", "150.000đ" ────────────────────────────
  const standalonePattern = new RegExp(`${NUM}\\s*${UNIT}`, 'i');
  const standaloneMatch   = lower.match(standalonePattern);
  if (standaloneMatch) {
    const num  = parseFloat(standaloneMatch[1].replace(',', '.'));
    const unit = standaloneMatch[2] || '';
    const v    = convertToVND(num, unit);
    if (v !== null) return { minPrice: null, maxPrice: v };
  }

  return { minPrice: null, maxPrice: null };
}

/**
 * Trích xuất số ngày chu kỳ từ câu hỏi.
 * Bắt các trường hợp đặc biệt trong database: 1,3,5,7,15,30,90,180,360 ngày.
 * Trả về số nguyên hoặc null.
 */
function extractCycleDays(text) {
  const lower = text.toLowerCase();

  // Năm / 12 tháng / 360 ngày
  if (
    /\b1\s*(năm|nam)\b/i.test(lower)    ||
    /\bmột\s*(năm|nam)\b/i.test(lower)   ||
    /\bcả\s*(năm|nam)/i.test(lower)      ||
    /\b12\s*(tháng|thang)\b/i.test(lower)||
    /\b360\s*(ngày|ngay|n)\b/i.test(lower)
  ) {
    return 360;
  }

  // 6 tháng / nửa năm / 180 ngày
  if (
    /\b6\s*(tháng|thang)\b/i.test(lower) ||
    /\bnửa\s*(năm|nam)/i.test(lower)      ||
    /\b180\s*(ngày|ngay|n)\b/i.test(lower)
  ) {
    return 180;
  }

  // 3 tháng / quý / 90 ngày
  if (
    /\b3\s*(tháng|thang)\b/i.test(lower) ||
    /\bquý\b/i.test(lower)               ||
    /\b90\s*(ngày|ngay|n)\b/i.test(lower)
  ) {
    return 90;
  }

  // 2 tháng / 60 ngày
  if (
    /\b2\s*(tháng|thang)\b/i.test(lower) ||
    /\b60\s*(ngày|ngay|n)\b/i.test(lower)
  ) {
    return 60;
  }

  // 1 tháng / tháng / 30 ngày
  if (
    /\b1\s*(tháng|thang)\b/i.test(lower) ||
    /\bmột\s*(tháng|thang)\b/i.test(lower)||
    /\b30\s*(ngày|ngay|n)\b/i.test(lower)
  ) {
    return 30;
  }

  // Nửa tháng / 15 ngày / 2 tuần
  if (
    /\bnửa\s*(tháng|thang)/i.test(lower) ||
    /\b15\s*(ngày|ngay|n)\b/i.test(lower)||
    /\b2\s*(tuần|tuan)\b/i.test(lower)
  ) {
    return 15;
  }

  // Tuần (1 tuần) / 7 ngày
  if (
    /\b1\s*(tuần|tuan)\b/i.test(lower) ||
    /\bmột\s*(tuần|tuan)\b/i.test(lower)||
    /\btuần\b/i.test(lower)            ||   // "tuần" đơn thuần
    /\b7\s*(ngày|ngay|n)\b/i.test(lower)
  ) {
    return 7;
  }

  // 5 ngày
  if (/\b5\s*(ngày|ngay|n)\b/i.test(lower)) return 5;

  // 3 ngày
  if (/\b3\s*(ngày|ngay|n)\b/i.test(lower)) return 3;

  // "ngày" / 1 ngày / theo ngày / gói ngày
  if (
    /\b1\s*(ngày|ngay|n)\b/i.test(lower)   ||
    /\btheo\s*(ngày|ngay)\b/i.test(lower)  ||
    /\bgói\s*(ngày|ngay)\b/i.test(lower)   ||
    /\bgoi\s*(ngay)\b/i.test(normalize(lower))  ||
    /\bngày\b/i.test(lower)                       // "ngày" đơn thuần → 1 ngày
  ) {
    // Đảm bảo không bị nhầm với các pattern có số trước đó
    // Nếu text đã match các pattern dài hơn ở trên thì không vào đây
    return 1;
  }

  // Các số ngày tự do khác: "X ngày"
  const dayMatch = lower.match(/\b(\d+)\s*(ngày|ngay)\b/i);
  if (dayMatch) {
    const days = parseInt(dayMatch[1], 10);
    if (days > 0 && days <= 365) return days;
  }

  return null;
}

/**
 * Trích xuất loại mạng: '5G' | '4G' | null
 */
function extractNetworkType(text) {
  if (/\b5g\b/i.test(text)) return '5G';
  if (/\b4g\b/i.test(text)) return '4G';
  return null;
}

/**
 * Trích xuất danh sách ứng dụng được nhắc đến.
 * Ưu tiên đưa vào apps[], TUYỆT ĐỐI KHÔNG để lọt vào packageCodes.
 */
function extractApps(text) {
  const lower = text.toLowerCase();
  const apps  = [];

  // YouTube
  if (
    /\byoutube\b/i.test(lower)          ||
    /\bytb\b/i.test(lower)              ||
    /\byt\b(?!\w)/i.test(lower)         ||
    /xem\s+youtube/i.test(lower)        ||
    /lướt\s+youtube/i.test(lower)
  ) {
    apps.push('youtube');
  }

  // TikTok
  if (
    /\btiktok\b/i.test(lower)           ||
    /\btik\s*tok\b/i.test(lower)        ||
    /xem\s+tiktok/i.test(lower)         ||
    /lướt\s+tiktok/i.test(lower)
  ) {
    apps.push('tiktok');
  }

  // Facebook
  if (
    /\bfacebook\b/i.test(lower)         ||
    /\bface\s*book\b/i.test(lower)      ||
    /\bfb\b(?!\w)/i.test(lower)         ||
    /lướt\s+facebook/i.test(lower)
  ) {
    apps.push('facebook');
  }

  // TV360 — bao gồm "tv360", "tv 360", "tivi360", "tivi 360", "tivi 360"
  // Ưu tiên đưa vào apps, KHÔNG để lọt vào packageCodes
  if (
    /\btv\s*360\b/i.test(lower)         ||
    /\btv360\b/i.test(lower)            ||
    /\btivi\s*360\b/i.test(lower)       ||
    /\btivi360\b/i.test(lower)          ||
    /xem\s+tv\s*360/i.test(lower)       ||
    /đăng\s+ký\s+tv\s*360/i.test(lower)
  ) {
    apps.push('tv360');
  }

  // Movie / phim (map tới has_movie trong package_features)
  if (
    /\bxem\s+phim\b/i.test(lower)       ||
    /\bcày\s+phim\b/i.test(lower)       ||
    /\bphim\s+(lẻ|bộ|online)\b/i.test(lower) ||
    /\bmovie\b/i.test(lower)
  ) {
    apps.push('movie');
  }

  return apps;
}

/**
 * Trích xuất nhu cầu tính năng: data, voice, sms.
 */
function extractFeatures(text) {
  const lower = text.toLowerCase();
  const norm  = normalize(text);

  const data = (
    /\bdata\b/i.test(lower)             ||
    /\binternet\b/i.test(lower)         ||
    /\bmang\b/i.test(norm)              ||   // mạng
    /\bgb\b/i.test(lower)               ||
    /\bmbps\b/i.test(lower)             ||
    /lướt\s+web/i.test(lower)           ||
    /\bdownload\b/i.test(lower)         ||
    /\bstreaming\b/i.test(lower)        ||
    /\bonline\b/i.test(lower)           ||
    /dung\s+luong/i.test(norm)               // dung lượng
  );

  const voice = (
    /\bgọi\b/i.test(lower)              ||
    /\bthoại\b/i.test(lower)            ||
    /\bphút\b/i.test(lower)             ||
    /\bcall\b/i.test(lower)             ||
    /\balo\b/i.test(lower)              ||
    /nội\s+mạng/i.test(lower)           ||
    /ngoại\s+mạng/i.test(lower)         ||
    /\bgoi\s+nhieu\b/i.test(norm)       ||   // gọi nhiều
    /\bgoi\s+dien\b/i.test(norm)        ||   // gọi điện
    /nghe\s+goi/i.test(norm)                 // nghe gọi
  );

  const sms = (
    /\bsms\b/i.test(lower)              ||
    /tin\s+nhan/i.test(norm)            ||   // tin nhắn
    /nhan\s+tin/i.test(norm)                 // nhắn tin
  );

  // Ngữ cảnh bổ sung ngầm định (combo)
  const isCombo = (
    /\bcombo\b/i.test(lower)            ||
    /vừa\s+data\s+vừa\s+gọi/i.test(lower) ||
    /vừa\s+gọi\s+vừa\s+data/i.test(lower) ||
    /data\s+và\s+gọi/i.test(lower)      ||
    /gọi\s+và\s+data/i.test(lower)      ||
    /trọn\s+gói/i.test(lower)           ||
    /tích\s+hợp/i.test(lower)           ||
    /\bvan\s+phong\b/i.test(norm)       ||   // văn phòng
    /\bcong\s+viec\b/i.test(norm)       ||   // công việc
    /\blam\s+viec\b/i.test(norm)             // làm việc
  );

  return {
    data:  data  || isCombo,
    voice: voice || isCombo,
    sms
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Phân tích intent từ tin nhắn người dùng.
 * Trả về object chuẩn để packageMatcher dùng build MongoDB query.
 */
const intentParser = (userText) => {
  const result = {
    minPrice:     null,
    maxPrice:     null,
    cycleDays:    null,
    networkType:  null,
    apps:         [],
    features: {
      data:  false,
      voice: false,
      sms:   false
    },
    packageCodes: []
  };

  if (!userText || typeof userText !== 'string') return result;

  // Trích xuất apps TRƯỚC packageCodes để bảo đảm tv360/tiktok/youtube/facebook
  // không bị nhầm vào mảng packageCodes.
  result.apps         = extractApps(userText);

  const priceRange    = extractPriceRange(userText);
  result.minPrice     = priceRange.minPrice;
  result.maxPrice     = priceRange.maxPrice;

  result.packageCodes = extractPackageCodes(userText);
  result.cycleDays    = extractCycleDays(userText);
  result.networkType  = extractNetworkType(userText);
  result.features     = extractFeatures(userText);

  return result;
};

module.exports = intentParser;
