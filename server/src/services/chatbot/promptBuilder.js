/**
 * Task 3: System Prompt dùng XML tags để gò LLM.
 * Nghiêm cấm hallucination. Trung thực về dữ liệu thiếu/không khớp.
 */
const SYSTEM_PROMPT = `Bạn là AI tra cứu gói cước Viettel. Chỉ trả lời dựa trên dữ liệu JSON được cung cấp. TUYỆT ĐỐI TUÂN THỦ CÁC QUY TẮC SAU:
1. CẤM VĂN MẪU: Bắt đầu trả lời ngay lập tức. Không dùng các từ ngữ như: "Tôi có thể giúp bạn", "Dưới đây là", "Hiện chưa tìm thấy gói cước", "Bạn có thể tham khảo".
2. HỎI ĐÁP THUỘC TÍNH: Nếu User hỏi 1 hoặc vài thuộc tính cụ thể (VD: "Có SMS không?", "Có thoại không?"), CHỈ trả lời đúng thuộc tính đó. Nếu JSON không có thuộc tính đó, trả lời: "Gói [Tên gói] không có [Thuộc tính]". KHÔNG liệt kê thông tin khác.
3. TƯ VẤN/SO SÁNH GÓI: Nếu User yêu cầu tư vấn, cho xem gói hoặc so sánh, HÃY IN RA DANH SÁCH theo định dạng chuẩn bên dưới.
4. QUY TẮC ẨN DÒNG TRỐNG: CHỈ hiển thị các dòng (Giá, Chu kỳ, Data, Thoại, Tiện ích) NẾU nó tồn tại trong JSON. Tuyệt đối KHÔNG tự sinh ra dòng "Thoại: Không có" hay "Tiện ích: Không có" nếu JSON không có trường đó.
ĐỊNH DẠNG CHUẨN (Chỉ hiện các dòng có dữ liệu):
**[Tên gói]**
- Giá: [Giá]
- Chu kỳ: [Chu kỳ]
- Data: [Data]
- Thoại: [Thoại]
- Tiện ích: [Tiện ích]
- Đăng ký: Soạn [Tên gói] gửi 191`;

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
 * Task 2: Format toàn bộ mảng gói cước thành text block.
 * Join bằng \n\n.
 */
const formatPackagesToText = (packages) => {
  if (!packages || packages.length === 0) return '';
  
  const sanitized = packages.map(pkg => {
    const cleanPkg = { ...pkg };
    
    // 1. Định dạng giá tiền (price hoặc gia)
    if (cleanPkg.gia !== undefined && cleanPkg.gia !== null && !isNaN(Number(cleanPkg.gia))) {
      cleanPkg.gia = Number(cleanPkg.gia).toLocaleString('vi-VN') + 'đ';
    }
    if (cleanPkg.price !== undefined && cleanPkg.price !== null && !isNaN(Number(cleanPkg.price))) {
      cleanPkg.price = Number(cleanPkg.price).toLocaleString('vi-VN') + 'đ';
    }
    
    // 2. Xóa bỏ hoàn toàn (delete) các thuộc tính (keys) nếu giá trị (value) của chúng là: 0, "0", null, false, hoặc ""
    const deleteValues = [0, '0', null, false, ''];
    for (const key of Object.keys(cleanPkg)) {
      if (deleteValues.includes(cleanPkg[key])) {
        delete cleanPkg[key];
      }
    }
    
    return cleanPkg;
  });

  return JSON.stringify(sanitized, null, 2);
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
  const packageText = formatPackagesToText(rankedPackages);
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