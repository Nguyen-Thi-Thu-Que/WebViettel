const { packageSanitizer } = require('./packageSanitizer');

/**
 * Task 3: System Prompt cải tiến cho tư vấn viên Viettel.
 */
const SYSTEM_PROMPT = `Bạn là nhân viên tư vấn gói cước Viettel. Nhiệm vụ duy nhất của bạn là tư vấn các gói cước dựa trên dữ liệu JSON được cung cấp trong thẻ <package_data_context>.
Hãy tuân thủ nghiêm ngặt các quy tắc sau:
1. TRẢ LỜI NHƯ NHÂN VIÊN TƯ VẤN THẬT:
   - Đi thẳng vào câu trả lời một cách tự nhiên, chuyên nghiệp và thân thiện.
   - TUYỆT ĐỐI KHÔNG sử dụng văn phong máy móc của AI. Không bắt đầu bằng "Xin chào! Tôi là trợ lý ảo...", "Hy vọng câu trả lời này...", "Tôi có thể giúp gì thêm...".
   - Không lặp lại các câu chào hỏi rập khuôn ở mỗi câu trả lời.
2. CHỈ TƯ VẤN GÓI TRONG CONTEXT:
   - Chỉ được sử dụng thông tin gói cước xuất hiện trong <package_data_context> để tư vấn. Tuyệt đối không tự suy diễn, tạo gói cước hoặc tự thêm ưu đãi ngoài dữ liệu.
   - Dữ liệu trong <package_data_context> đã được backend lọc và sắp xếp theo độ phù hợp giảm dần. Chỉ tư vấn tối đa 2-4 gói cước xuất hiện trong dữ liệu này. Không tự giới thiệu các gói ngoài danh sách.
   - Nếu trong <package_data_context> trống hoặc không có gói nào, hãy trả lời lịch sự rằng chưa tìm thấy gói cước nào phù hợp nhất với yêu cầu và khuyên khách hàng thay đổi khoảng giá hoặc nhu cầu.
3. ĐI SÂU VÀO NHU CẦU CỦA KHÁCH HÀNG:
   - Hiểu đúng nhu cầu của khách hàng (data, thoại, SMS, ngân sách, ứng dụng giải trí...). Chỉ giới thiệu các ưu đãi liên quan trực tiếp đến nhu cầu đó của gói cước, không liệt kê tràn lan toàn bộ thông số.
   - Ví dụ:
     * Khách hàng cần data: Tập trung nói về dung lượng data (data_theo_ngay) và giá cước. Không nói về phút gọi hay SMS nếu khách không hỏi.
     * Khách hàng cần gọi điện: Tập trung nói về phút gọi nội mạng (free_noi_mang) và ngoại mạng (free_ngoai_mang). Không nói về các tiện ích khác.
     * Khách hàng hỏi chi tiết một gói cước cụ thể: Lúc này mới giới thiệu chi tiết đầy đủ các ưu đãi có giá trị của gói đó, bỏ qua các mục không có hoặc mang giá trị "0" không liên quan.
     * Khách hàng hỏi trực tiếp câu hỏi Có/Không (ví dụ: "Có gọi nội mạng không?", "Có kèm SMS không?", "Có free Youtube không?"): Hãy nhìn vào dữ liệu gói cước tương ứng để trả lời chính xác (nếu trường đó có giá trị 0 hoặc "Không" hoặc không tồn tại, hãy khẳng định rõ là gói đó không hỗ trợ ưu đãi này).
4. ĐỊNH DẠNG CÂU TRẢ LỜI:
   - Trình bày ngắn gọn, dễ đọc, tự nhiên. Sử dụng markdown cơ bản và xuống dòng hợp lý.
   - Không gạch đầu dòng quá dài, không sử dụng icon rườm rà.
   - Mỗi gói cước trình bày ngắn gọn các thông tin: Tên gói, Giá, Ưu đãi chính liên quan, Cú pháp đăng ký.
Ví dụ tư vấn:
Gói SD135 phù hợp nếu bạn cần nhiều data sử dụng hàng ngày:
- Giá: 135.000đ / 30 ngày
- Data: 5GB/ngày (tổng 150GB/tháng)
- Cú pháp đăng ký: Soạn SD135 gửi 191`;

const hasRealData = (pkg) => {
  if (!pkg.data_theo_ngay) return false;
  const s = String(pkg.data_theo_ngay).trim().toUpperCase();
  return s !== '0' && s !== '0GB' && s !== '0 GB' && !s.startsWith('0');
};

const hasRealVoice = (pkg) => {
  const check = (val) => {
    if (!val) return false;
    const s = String(val).trim().toUpperCase();
    return s !== '0' && s !== '0 PHÚT' && s !== '0 PHUT' && !s.startsWith('0');
  };
  return check(pkg.free_noi_mang) || check(pkg.free_ngoai_mang);
};

const hasRealSms = (pkg) => {
  if (!pkg.sms) return false;
  const s = String(pkg.sms).trim().toUpperCase();
  return s !== '0' && s !== '0 SMS' && !s.startsWith('0');
};

/**
 * Task 2: Hàm `formatPackageToText(pkg)` — convert object gói cước thành Text thuần túy.
 * KHÔNG truyền JSON thô vào LLM.
 */
const formatPackageToText = (pkg) => {
  if (!pkg) return '';

  const dataValid = hasRealData(pkg);
  const voiceValid = hasRealVoice(pkg);
  const smsValid = hasRealSms(pkg);

  const tienIch = String(pkg.tien_ich_free || '').toUpperCase() + ' ' + String(pkg.uudaitrong || '').toUpperCase();
  const hasTv360 = tienIch.includes('TV360');
  const hasFb = tienIch.includes('FACEBOOK') || tienIch.includes('FB');
  const hasYtb = tienIch.includes('YOUTUBE') || tienIch.includes('YT');
  const hasTiktok = tienIch.includes('TIKTOK');
  const hasMovie = tienIch.includes('PHIM') || tienIch.includes('MOVIE') || tienIch.includes('CINEMA') || (pkg.benefit_group && pkg.benefit_group.toUpperCase() === 'MOVIE');

  return `<package>
  <ma_goi>${pkg.ma_goi || ''}</ma_goi>
  <ten>${pkg.ten || ''}</ten>
  <gia>${pkg.gia != null ? pkg.gia : 0}</gia>
  <chu_ky_ngay>${pkg.chu_ky_ngay || ''}</chu_ky_ngay>
  <data_theo_ngay>${pkg.data_theo_ngay || ''}</data_theo_ngay>
  <free_noi_mang>${pkg.free_noi_mang || ''}</free_noi_mang>
  <free_ngoai_mang>${pkg.free_ngoai_mang || ''}</free_ngoai_mang>
  <sms>${pkg.sms || ''}</sms>
  <tien_ich_free>${pkg.tien_ich_free || ''}</tien_ich_free>
  <uudaitrong>${pkg.uudaitrong || ''}</uudaitrong>
  <dieu_kien_dang_ky>${pkg.dieu_kien_dang_ky || ''}</dieu_kien_dang_ky>
  <dangky>${pkg.dangky || ''}</dangky>
  <huygiahan>${pkg.huygiahan || ''}</huygiahan>
  <huygoicuoc>${pkg.huygoicuoc || ''}</huygoicuoc>
  <hasData>${dataValid}</hasData>
  <hasVoice>${voiceValid}</hasVoice>
  <hasSms>${smsValid}</hasSms>
  <hasTV360>${hasTv360}</hasTV360>
  <hasFacebook>${hasFb}</hasFacebook>
  <hasYoutube>${hasYtb}</hasYoutube>
  <hasTiktok>${hasTiktok}</hasTiktok>
  <hasMovie>${hasMovie}</hasMovie>
</package>`;
};

/**
 * Task 2: Format toàn bộ mảng gói cước thành text block dạng JSON rút gọn cho AI.
 */
const formatPackagesToText = (packages, intent, userMessage) => {
  if (!packages || packages.length === 0) return '[]';

  // Lọc gói cước thành AI View Model sạch sẽ, có truyền thêm intent và userMessage để giữ lại các field 0 liên quan
  const sanitized = packageSanitizer(packages, intent, userMessage);

  // Định dạng lại các trường hiển thị cho AI
  const formatted = sanitized.map(pkg => {
    const cleanPkg = { ...pkg };

    if (cleanPkg.gia !== undefined && cleanPkg.gia !== null && !isNaN(Number(cleanPkg.gia))) {
      cleanPkg.gia = Number(cleanPkg.gia).toLocaleString('vi-VN') + 'đ';
    }
    if (cleanPkg.price !== undefined && cleanPkg.price !== null && !isNaN(Number(cleanPkg.price))) {
      cleanPkg.price = Number(cleanPkg.price).toLocaleString('vi-VN') + 'đ';
    }

    return cleanPkg;
  });

  return JSON.stringify(formatted, null, 2);
};

/**
 * Format khối Intent để AI hiểu ngữ cảnh và không suy diễn thêm.
 */
const formatIntent = (intent) => {
  if (!intent) return '';
  const lines = [];
  if (intent.packageCodes && intent.packageCodes.length > 0) {
    lines.push(`Mã gói được hỏi: ${intent.packageCodes.join(', ')}`);
  }
  if (intent.budgetMin !== null && intent.budgetMin !== undefined && intent.budgetMax !== null && intent.budgetMax !== undefined) {
    lines.push(`Khoảng ngân sách: ${Number(intent.budgetMin).toLocaleString('vi-VN')}đ - ${Number(intent.budgetMax).toLocaleString('vi-VN')}đ`);
  } else if (intent.budget !== null && intent.budget !== undefined) {
    lines.push(`Ngân sách: ${Number(intent.budget).toLocaleString('vi-VN')}đ`);
  }
  if (intent.cheap) lines.push('Phân khúc: Giá rẻ');
  if (intent.needData) lines.push('Nhu cầu: Data');
  if (intent.needVoice) lines.push('Nhu cầu: Gọi thoại');
  if (intent.needCombo) lines.push('Nhu cầu: Combo (data + gọi)');
  if (intent.needYoutube) lines.push('Nội dung: YouTube');
  if (intent.needTiktok) lines.push('Nội dung: TikTok');
  if (intent.needLongTerm) lines.push('Chu kỳ: Dài hạn');
  if (intent.minDays !== null && intent.minDays !== undefined) {
    lines.push(`Chu kỳ tối thiểu: ${intent.minDays} ngày`);
  }
  return lines.length > 0 ? lines.join('\n') : 'Không xác định';
};

/**
 * Task 2 + Task 3: Xây dựng prompt gửi AI.
 */
const getDailyGb = (pkg) => {
  if (!pkg.data_theo_ngay) return 0;
  const str = String(pkg.data_theo_ngay).trim().toUpperCase();
  const matchDay = str.match(/([\d.]+)\s*GB\s*\/\s*(NGÀY|NGAY|D|DAY)/i);
  if (matchDay) return parseFloat(matchDay[1]);
  const matchMonth = str.match(/([\d.]+)\s*GB\s*\/\s*(THÁNG|THANG|M|MONTH)/i);
  if (matchMonth) return parseFloat(matchMonth[1]) / 30;
  const matchRaw = str.match(/([\d.]+)\s*GB/i);
  if (matchRaw) return parseFloat(matchRaw[1]) / (parseInt(pkg.chu_ky_ngay) || 30);
  return 0;
};

const packageRanking = (packages, intent) => {
  if (!packages || packages.length <= 1 || !intent) return packages;

  const ranked = [...packages];

  ranked.sort((a, b) => {
    // 1. YouTube/TikTok/Facebook check
    if (intent.needYoutube || intent.needTiktok || intent.needFacebook) {
      const matchBenefit = (pkg) => {
        const bg = pkg.benefit_group ? pkg.benefit_group.toUpperCase() : '';
        const tienIch = String(pkg.tien_ich_free || '').toUpperCase() + ' ' + String(pkg.uudaitrong || '').toUpperCase();
        if (intent.needYoutube && (bg === 'YOUTUBE' || tienIch.includes('YOUTUBE') || tienIch.includes('YT'))) return 1;
        if (intent.needTiktok && (bg === 'TIKTOK' || tienIch.includes('TIKTOK'))) return 1;
        if (intent.needFacebook && (bg === 'FACEBOOK' || tienIch.includes('FACEBOOK') || tienIch.includes('FB'))) return 1;
        return 0;
      };
      const mbA = matchBenefit(a);
      const mbB = matchBenefit(b);
      if (mbB !== mbA) return mbB - mbA;
    }

    // 2. Combo check
    if (intent.needCombo) {
      const dA = hasRealData(a) ? 1 : 0;
      const dB = hasRealData(b) ? 1 : 0;
      if (dB !== dA) return dB - dA;

      const vA = hasRealVoice(a) ? 1 : 0;
      const vB = hasRealVoice(b) ? 1 : 0;
      if (vB !== vA) return vB - vA;

      const sA = hasRealSms(a) ? 1 : 0;
      const sB = hasRealSms(b) ? 1 : 0;
      if (sB !== sA) return sB - sA;
    }

    // 3. Need Data check
    if (intent.needData) {
      const gbA = getDailyGb(a);
      const gbB = getDailyGb(b);
      if (gbB !== gbA) return gbB - gbA;

      const rdA = hasRealData(a) ? 1 : 0;
      const rdB = hasRealData(b) ? 1 : 0;
      if (rdB !== rdA) return rdB - rdA;

      const cbA = (hasRealData(a) && hasRealVoice(a)) ? 1 : 0;
      const cbB = (hasRealData(b) && hasRealVoice(b)) ? 1 : 0;
      if (cbB !== cbA) return cbB - cbA;

      if (a.gia !== b.gia) return a.gia - b.gia;
    }

    // 4. Need Voice check
    if (intent.needVoice) {
      const vA = hasRealVoice(a) ? 1 : 0;
      const vB = hasRealVoice(b) ? 1 : 0;
      if (vB !== vA) return vB - vA;

      const cbA = (hasRealData(a) && hasRealVoice(a)) ? 1 : 0;
      const cbB = (hasRealData(b) && hasRealVoice(b)) ? 1 : 0;
      if (cbB !== cbA) return cbB - cbA;
    }

    return 0;
  });

  return ranked;
};

const buildPrompt = (userMessage, packages, intent) => {
  const rankedPackages = packageRanking(packages, intent);

  // Chỉ giới thiệu tối đa 2-4 gói có điểm Scoring cao nhất từ backend
  const topPackages = rankedPackages.slice(0, 4);

  const packageText = formatPackagesToText(topPackages, intent, userMessage);
  const intentBlock = formatIntent(intent);

  const prompt = `${SYSTEM_PROMPT}

<intent_context>
${intentBlock}
</intent_context>

<package_data_context>
${packageText}
</package_data_context>

Câu hỏi của khách hàng: ${userMessage}`;

  if (prompt.length > 3000) {
    console.warn('[Chatbot] Prompt dài:', prompt.length, 'ký tự');
  }

  return prompt;
};

module.exports = { buildPrompt, formatPackageToText, formatPackagesToText };