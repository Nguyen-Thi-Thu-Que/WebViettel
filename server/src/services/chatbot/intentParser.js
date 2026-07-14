/**
 * Trích xuất TẤT CẢ mã gói cước từ tin nhắn người dùng.
 * VD: "ST90N là gói gì? 3FB50K là gói gì?" => ["ST90N", "3FB50K"]
 */
function extractPackageCodes(message) {
  if (!message) return [];
  const cleanMsg = message.toUpperCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ');
  const words = cleanMsg.split(/\s+/).filter(Boolean);
  const codes = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    if (!/^[A-Z0-9]+$/.test(word)) continue;
    if (/^\d+$/.test(word)) continue;
    if (/^\d+(K|Đ|D|DONG|VND)$/.test(word)) continue;
    if (/^\d+NGAY$/.test(word) || /^\d+NGÀY$/.test(word)) continue;
    if (word === '5G') continue;

    // 1. Đối với từ dạng số + N viết liền (ví dụ: 7N, 30N, 360N)
    if (/^\d+N$/.test(word)) {
      // Chỉ chấp nhận làm mã gói nếu thỏa mãn context detection:
      // - Đứng một mình (tin nhắn chỉ gồm từ này)
      // - Hoặc có các từ khóa chỉ định phía trước (gói, mã, đăng ký, cú pháp,...)
      const hasOnlyWord = words.length === 1;

      let hasIndicator = false;
      const idx = message.toUpperCase().indexOf(word);
      if (idx !== -1) {
        const beforeStr = message.substring(0, idx).toLowerCase().trim();
        const indicators = [
          'gói cước', 'goi cuoc', 'mã gói', 'ma goi',
          'gói', 'goi', 'mã', 'ma',
          'đăng ký', 'dang ky', 'đk', 'dk',
          'cú pháp', 'cu phap'
        ];
        hasIndicator = indicators.some(ind => {
          const regex = new RegExp(`(?:${ind.replace(/\s+/g, '\\s*')})\\s*$`, 'i');
          return regex.test(beforeStr);
        });
      }

      if (hasOnlyWord || hasIndicator) {
        if (!codes.includes(word)) codes.push(word);
      }
      continue;
    }

    // 2. Các mã gói phức hợp có cả chữ và số (ví dụ: 12T5G230B, 5GGA40, SD135, V120C)
    if (/[A-Z]/.test(word) && /\d/.test(word)) {
      if (!codes.includes(word)) codes.push(word);
    } else if (word === '5GPHIM') {
      if (!codes.includes(word)) codes.push(word);
    }
  }

  return codes;
}

/**
 * Trích xuất số ngày tối thiểu từ tin nhắn người dùng.
 * VD: "90 ngày" => 90, "6 tháng" => 180, "1 năm" => 360
 */
function extractMinDays(message) {
  const lower = message.toLowerCase();

  // Các từ khóa đặc biệt cho năm
  if (/\b1\s*(năm|nam)\b/i.test(lower) || /\bmột\s*(năm|nam)\b/i.test(lower) || /\bcả\s*(năm|nam)/i.test(lower) || /\b12\s*(tháng|thang)\b/i.test(lower)) {
    return 360;
  }

  // Các từ khóa đặc biệt cho tháng/nửa năm
  if (/\b6\s*(tháng|thang)\b/i.test(lower) || /\bnửa\s*(năm|nam)/i.test(lower)) {
    return 180;
  }
  if (/\b3\s*(tháng|thang)\b/i.test(lower) || /quý/i.test(lower)) {
    return 90;
  }
  if (/\b1\s*(tháng|thang)\b/i.test(lower)) {
    return 30;
  }

  // Quét theo mẫu số ngày: "X ngày", "X ngay", "X n"
  const dayMatch = lower.match(/\b(\d+)\s*(ngày|ngay|n)\b/i);
  if (dayMatch) {
    const days = parseInt(dayMatch[1], 10);
    // Nếu là 365 hoặc 360 ngày, trả về 360 theo chuẩn Viettel
    if (days === 360 || days === 360) return 360;
    return days;
  }

  return null;
}

/**
 * Phân tích ý định (Intent) của người dùng từ tin nhắn chat
 * Sprint 6 Hotfix: packageCodes[] thay thế packageCode đơn
 */
const intentParser = (message) => {
  const result = {
    budget: null,
    budgetMin: null,
    budgetMax: null,
    cheap: false,
    expensive: false,
    needData: false,
    needVoice: false,
    needSms: false,
    needYoutube: false,
    needTiktok: false,
    needFacebook: false,
    needTV360: false,
    needMovie: false,
    needSocial: false,
    need5G: false,
    needLongTerm: false,
    needShortTerm: false,
    needCombo: false,
    needAddon: false,
    needYearly: false,
    minDays: null,
    packageCodes: []   // Sprint 6 Hotfix: mảng, hỗ trợ nhiều mã gói trong 1 tin nhắn
  };

  if (!message) return result;
  const lowerMessage = message.toLowerCase();

  // 1. Phân tích ngân sách
  const cleanMsg = lowerMessage.replace(/\./g, '');

  // Kiểm tra khoảng giá trước (ví dụ: "3 đến 4 triệu", "3-4tr")
  const rangeMatch = cleanMsg.match(/(\d+)\s*(tr|triệu|k|nghìn|đ|đồng)?\s*(?:đến|to|-)\s*(\d+)\s*(k|đ|đồng|nghìn|tr|triệu)/i);
  if (rangeMatch) {
    const num1 = parseInt(rangeMatch[1], 10);
    const unit1 = rangeMatch[2] ? rangeMatch[2].toLowerCase() : null;
    const num2 = parseInt(rangeMatch[3], 10);
    const unit2 = rangeMatch[4].toLowerCase();
    const effectiveUnit1 = unit1 || unit2;

    if (effectiveUnit1 === 'k' || effectiveUnit1 === 'nghìn') result.budgetMin = num1 * 1000;
    else if (effectiveUnit1 === 'tr' || effectiveUnit1 === 'triệu') result.budgetMin = num1 * 1000000;
    else if (effectiveUnit1 === 'đ' || effectiveUnit1 === 'đồng') result.budgetMin = num1 < 1000 ? num1 * 1000 : num1;

    if (unit2 === 'k' || unit2 === 'nghìn') result.budgetMax = num2 * 1000;
    else if (unit2 === 'tr' || unit2 === 'triệu') result.budgetMax = num2 * 1000000;
    else if (unit2 === 'đ' || unit2 === 'đồng') result.budgetMax = num2 < 1000 ? num2 * 1000 : num2;

    result.budget = result.budgetMax;
  } else {
    const priceMatch = cleanMsg.match(/(\d+)\s*(k|đ|đồng|nghìn|tr|triệu)/i);
    if (priceMatch) {
      const num = parseInt(priceMatch[1], 10);
      const unit = priceMatch[2].toLowerCase();
      if (unit === 'k' || unit === 'nghìn') result.budget = num * 1000;
      else if (unit === 'tr' || unit === 'triệu') result.budget = num * 1000000;
      else if (unit === 'đ' || unit === 'đồng') result.budget = num < 1000 ? num * 1000 : num;
    } else {
      const standalonePriceMatch = cleanMsg.match(/(?:khoảng|tầm|giá|dưới|hơn|khoang|tam|gia|duoi|hon)\s*(\d+)\b/i);
      if (standalonePriceMatch) {
        const num = parseInt(standalonePriceMatch[1], 10);
        if (num >= 5 && num <= 1000) result.budget = num * 1000;
        else if (num > 1000) result.budget = num;
      }
    }
  }

  // 2. Phân khúc rẻ / cao cấp
  const cheapKeywords = [
    'rẻ', 'tiết kiệm', 'giá thấp', 'học sinh', 'sinh viên', 'sv', 'hs',
    're', 'tiet kiem', 'gia thap', 'hoc sinh', 'sinh vien',
    'ít tiền', 'it tien', 'tiền ít', 'tien it', 'túi tiền', 'tui tien',
    'thấp', 'thap', 'bình dân', 'binh dan',
    'phổ thông', 'pho thong', 'data rẻ', 'data re', 'giá rẻ', 'gia re'
  ];
  const expensiveKeywords = [
    'cao cấp', 'đắt', 'nhiều tiền', 'vip', 'khủng',
    'cao cap', 'nhieu tien', 'khung', 'premium', 'mạnh nhất', 'manh nhat',
    'nhiều data', 'nhieu data', 'data lớn', 'data lon', 'tốt nhất', 'tot nhat'
  ];

  if (cheapKeywords.some(kw => lowerMessage.includes(kw))) result.cheap = true;
  if (expensiveKeywords.some(kw => lowerMessage.includes(kw))) result.expensive = true;

  if (result.cheap && result.expensive) {
    if (lowerMessage.includes('rẻ') || lowerMessage.includes('tiết kiệm') ||
      lowerMessage.includes('sinh viên') || lowerMessage.includes('học sinh') ||
      lowerMessage.includes('data rẻ') || lowerMessage.includes('giá rẻ')) {
      result.expensive = false;
    } else {
      result.cheap = false;
    }
  }

  // 3. Nhu cầu Data / Thoại / SMS
  const dataKeywords = [
    'data', 'mạng', 'internet', 'dung lượng', 'gb', 'mb', 'gbs', 'mbs',
    'lướt web', 'online', 'web', 'mang', 'dung luong', 'luot web',
    'truy cập', 'streaming', 'tải', 'download'
  ];
  const voiceKeywords = [
    'gọi', 'thoại', 'phút', 'nội mạng', 'ngoại mạng', 'alo', 'call',
    'đàm thoại', 'goi', 'thoai', 'phut', 'noi mang', 'ngoai mang', 'dam thoai',
    'gọi nhiều', 'goi nhieu', 'gọi điện', 'goi dien', 'nghe gọi', 'nghe goi'
  ];
  const smsKeywords = ['sms', 'tin nhắn', 'nhắn tin', 'tin nhan', 'nhan tin'];

  if (dataKeywords.some(kw => lowerMessage.includes(kw))) result.needData = true;
  if (voiceKeywords.some(kw => lowerMessage.includes(kw))) result.needVoice = true;
  if (smsKeywords.some(kw => lowerMessage.includes(kw))) result.needSms = true;

  // 4. Mạng xã hội & Giải trí — CHỈ match keyword chính xác, không suy diễn
  if (lowerMessage.includes('youtube') || lowerMessage.includes('ytb') ||
    /\byt\b/.test(lowerMessage) || lowerMessage.includes('xem youtube') ||
    lowerMessage.includes('lướt youtube')) {
    result.needYoutube = true;
  }
  if (lowerMessage.includes('tiktok') || lowerMessage.includes('tik tok') ||
    lowerMessage.includes('lướt tiktok') || lowerMessage.includes('xem tiktok') ||
    /\btik\b/.test(lowerMessage)) {
    result.needTiktok = true;
  }
  if (lowerMessage.includes('facebook') || lowerMessage.includes('face book') ||
    /\bfb\b/.test(lowerMessage) || lowerMessage.includes('lướt facebook')) {
    result.needFacebook = true;
  }
  if (lowerMessage.includes('tv360') || lowerMessage.includes('tv 360')) {
    result.needTV360 = true;
  }
  if (lowerMessage.includes('phim') || lowerMessage.includes('movie') ||
    lowerMessage.includes('cinema') || lowerMessage.includes('cày phim') ||
    lowerMessage.includes('cay phim') || lowerMessage.includes('xem phim')) {
    result.needMovie = true;
  }
  if (lowerMessage.includes('social') || lowerMessage.includes('mxh') ||
    lowerMessage.includes('mạng xã hội') || lowerMessage.includes('mang xa hoi')) {
    result.needSocial = true;
  }

  // 5. Mạng 5G
  if (/\b5g\b/.test(lowerMessage)) result.need5G = true;

  // 6. Chu kỳ thời gian — minDays là bộ lọc cứng
  result.minDays = extractMinDays(message);

  const specificLongTermRegex = [
    /\b90\s*(ngày|ngay|n)\b/i, /\b180\s*(ngày|ngay|n)\b/i, /\b360\s*(ngày|ngay|n)\b/i, /\b360\s*(ngày|ngay|n)\b/i,
    /\b6\s*(tháng|thang)\b/i, /\b12\s*(tháng|thang)\b/i,
    /nửa\s*(năm|nam)/i, /\b1\s*(năm|nam)\b/i, /\bmột\s*(năm|nam)\b/i,
    /cả\s*(năm|nam)/i, /quý/i, /\b3\s*(tháng|thang)\b/i
  ];
  const specificShortTermRegex = [
    /\b1\s*(ngày|ngay|n)\b/i, /\b3\s*(ngày|ngay|n)\b/i, /\b5\s*(ngày|ngay|n)\b/i,
    /\b7\s*(ngày|ngay|n)\b/i, /\b15\s*(ngày|ngay|n)\b/i
  ];
  const yearlyRegex = [
    /\b1\s*(năm|nam)\b/i, /\bmột\s*(năm|nam)\b/i,
    /\b12\s*(tháng|thang)\b/i, /\b360\s*(ngày|ngay|n)\b/i, /\b360\s*(ngày|ngay|n)\b/i, /cả\s*(năm|nam)/i
  ];
  const longUsageKeywords = ['dùng lâu', 'dung lau', 'lâu dài', 'lau dai', 'dài hạn', 'dai han'];

  if (specificLongTermRegex.some(p => p.test(lowerMessage)) ||
    longUsageKeywords.some(kw => lowerMessage.includes(kw))) {
    result.needLongTerm = true;
    result.needShortTerm = false;
  } else if (specificShortTermRegex.some(p => p.test(lowerMessage))) {
    result.needShortTerm = true;
    result.needLongTerm = false;
  } else {
    const longTermKeywords = ['năm', 'nam', 'tháng', 'thang'];
    const shortTermKeywords = ['ngắn hạn', 'ngan han', 'tuần', 'tuan', 'tạm thời', 'tam thoi'];
    if (longTermKeywords.some(kw => lowerMessage.includes(kw))) result.needLongTerm = true;
    if (shortTermKeywords.some(kw => lowerMessage.includes(kw))) {
      result.needShortTerm = true;
      result.needLongTerm = false;
    }
  }

  if (yearlyRegex.some(p => p.test(lowerMessage))) result.needYearly = true;

  // 7. Combo
  const comboKeywords = [
    'combo', 'tích hợp', 'trọn gói', 'tich hop', 'tron goi',
    'vừa data vừa gọi', 'vua data vua goi',
    'cả data lẫn gọi', 'ca data lan goi',
    'vừa gọi vừa data', 'vua goi vua data',
    'data và gọi', 'data va goi',
    'gọi và data', 'goi va data'
  ];
  if (comboKeywords.some(kw => lowerMessage.includes(kw))) {
    result.needCombo = true;
    result.needData = true;
    result.needVoice = true;
  }

  if (lowerMessage.includes('addon') || lowerMessage.includes('gói phụ') ||
    lowerMessage.includes('mua thêm') || lowerMessage.includes('bổ sung') ||
    lowerMessage.includes('goi phu') || lowerMessage.includes('mua them') ||
    lowerMessage.includes('bo sung') || lowerMessage.includes('tiện ích')) {
    result.needAddon = true;
  }

  // 8. Ngữ cảnh bổ sung
  if (lowerMessage.includes('sinh viên') || lowerMessage.includes('sinh vien') ||
    lowerMessage.includes('học sinh') || lowerMessage.includes('hoc sinh') ||
    /\bsv\b/.test(lowerMessage) || /\bhs\b/.test(lowerMessage)) {
    result.cheap = true;
    result.needData = true;
    result.expensive = false;
  }

  if (lowerMessage.includes('văn phòng') || lowerMessage.includes('van phong') ||
    lowerMessage.includes('công việc') || lowerMessage.includes('cong viec') ||
    lowerMessage.includes('làm việc') || lowerMessage.includes('lam viec')) {
    result.needData = true;
    result.needVoice = true;
  }

  if (lowerMessage.includes('game') || lowerMessage.includes('chơi game') ||
    lowerMessage.includes('choi game') || lowerMessage.includes('gaming')) {
    result.needData = true;
    result.need5G = true;
  }

  if (lowerMessage.includes('du lịch') || lowerMessage.includes('du lich') ||
    lowerMessage.includes('roaming') || lowerMessage.includes('nước ngoài') ||
    lowerMessage.includes('nuoc ngoai') || lowerMessage.includes('quốc tế') ||
    lowerMessage.includes('quoc te')) {
    result.needVoice = true;
    result.needData = true;
  }

  if (lowerMessage.includes('gia đình') || lowerMessage.includes('gia dinh') ||
    lowerMessage.includes('người lớn tuổi') || lowerMessage.includes('nguoi lon tuoi') ||
    lowerMessage.includes('người già') || lowerMessage.includes('nguoi gia') ||
    lowerMessage.includes('ba mẹ') || lowerMessage.includes('ông bà') ||
    lowerMessage.includes('bố mẹ')) {
    result.needVoice = true;
  }

  if (lowerMessage.includes('bóng đá') || lowerMessage.includes('bong da') ||
    lowerMessage.includes('xem bóng') || lowerMessage.includes('xem bong') ||
    lowerMessage.includes('trực tiếp bóng') || lowerMessage.includes('truc tiep bong')) {
    result.needTV360 = true;
    result.needMovie = true;
  }

  if (lowerMessage.includes('gọi nhiều') || lowerMessage.includes('goi nhieu') ||
    lowerMessage.includes('hay gọi') || lowerMessage.includes('hay goi') ||
    lowerMessage.includes('thường xuyên gọi') || lowerMessage.includes('thuong xuyen goi')) {
    result.needVoice = true;
  }

  // 9. Trích xuất mã gói — Sprint 6 Hotfix: mảng packageCodes[]
  // KHÔNG override budget/cheap/intent — tất cả được giữ nguyên để tư vấn bổ sung
  result.packageCodes = extractPackageCodes(message);

  return result;
};

module.exports = intentParser;
