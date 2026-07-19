/**
 * promptBuilder.js — Hard-controlled RAG Prompt Builder
 *
 * Đóng gói tối đa 3 gói cước đã lọc từ DB thành định dạng XML thuần túy
 * để nhúng vào prompt gửi LLM, ngăn chặn hoàn toàn hiện tượng ảo giác.
 *
 * System Prompt tích hợp chỉ thị cứng: LLM CHỈ ĐƯỢC tư vấn trong danh sách XML.
 */

// ─── System Prompt mệnh lệnh tuyệt đối (chống ảo giác + lặp từ) ──────────────

const HARD_SYSTEM_PROMPT = `Bạn là Trợ lý ảo tư vấn gói cước di động chuyên nghiệp của Viettel, giao tiếp lịch sự và luôn bắt đầu bằng từ 'Dạ'.
Nhiệm vụ của bạn là đọc dữ liệu XML được cung cấp để giới thiệu các gói cước cho khách hàng. Hãy tuân thủ nghiêm ngặt quy định định dạng đầu ra sau đây:

QUY TẮC PHÁT NGÔN THEO SỐ LƯỢNG GÓI:

TRƯỜNG HỢP 1: KHI CÓ NHIỀU GÓI CƯỚC CÙNG LÚC (Từ 2 đến 3 gói)
- Bắt đầu bằng câu dẫn thân thiện: 'Dạ, Viettel xin gửi bạn danh sách các gói cước phù hợp nhất trong phân khúc yêu cầu. Bạn có thể xem nhanh các ưu đãi nổi bật và thực hiện đăng ký nhanh theo cú pháp dưới đây nhé:'
- Trình bày mỗi gói cước thành một khối danh sách thụt lề rõ ràng (Bullet points), bắt buộc phải ghi rõ Cú pháp đăng ký lấy từ thẻ <dangky> của gói đó. Định dạng chuẩn:
  * Gói [TÊN MÃ GÓI] (Giá: [GIÁ TIỀN]đ / Chu kỳ: [CHU KỲ]):
    + Ưu đãi: [Mô tả ngắn gọn, dễ đọc về dung lượng data, thoại]
    + Cú pháp đăng ký: [In ra chính xác nội dung trong thẻ <dangky> của XML, ví dụ: Soạn MÃGÓI gửi 191]

TRƯỜNG HỢP 2: CHỈ CÓ 1 GÓI CƯỚC DUY NHẤT
- Trình bày chi tiết cấu trúc:
  Dạ, Viettel xin gửi bạn thông tin ưu đãi chi tiết của gói [MÃ GÓI]:
  + Ưu đãi chính: [Mô tả chi tiết ưu đãi]
  + Chu kỳ sử dụng: [Số ngày]
  + Cú pháp đăng ký: [In ra chính xác nội dung trong thẻ <dangky>]
  + Cú pháp hủy: [In ra chính xác nội dung trong thẻ <huygoi>]

KỶ LUẬT AN TOÀN DỮ LIỆU:
1. TUYỆT ĐỐI NGHIÊM CẤM lặp lại câu hỏi xác nhận của người dùng ở câu mở đầu (Không nói: 'Bạn đang tìm gói..., đúng không?').
2. Xuất văn bản thuần túy (Plain Text), nghiêm cấm rò rỉ các thẻ code như '<dangky>', '<card-goi-cuoc>'.
3. Không tự ý viết thêm các câu lưu ý hoặc cảnh báo tự bịa ở cuối văn bản phản hồi.`;

// ─── Helpers ──────────────────────────────────────────────────────────────────



/**
 * Format số tiền VND thành chuỗi hiển thị.
 * Ví dụ: 135000 → "135.000đ"
 */
function formatPrice(price) {
  if (price == null || isNaN(Number(price))) return '0đ';
  return Number(price).toLocaleString('vi-VN') + 'đ';
}

/**
 * Format chu kỳ ngày thành chuỗi thân thiện.
 * Ví dụ: "30" → "30 ngày", "360" → "360 ngày (1 năm)"
 */
function formatCycle(chu_ky_ngay) {
  const days = parseInt(chu_ky_ngay, 10);
  if (isNaN(days) || days <= 0) return chu_ky_ngay || '';
  if (days === 360) return '360 ngày (1 năm)';
  if (days === 180) return '180 ngày (6 tháng)';
  if (days === 90) return '90 ngày (3 tháng)';
  if (days === 30) return '30 ngày (1 tháng)';
  if (days === 15) return '15 ngày (nửa tháng)';
  if (days === 7) return '7 ngày (1 tuần)';
  return `${days} ngày`;
}

/**
 * Lấy giá trị field nếu có thực, bỏ qua zero/rỗng/null.
 */
function nonZero(val) {
  if (!val) return null;
  const s = String(val).trim();
  if (
    s === '0' || s === '' || s === '0GB' || s === '0 GB' ||
    s.toLowerCase() === 'không' || s.toLowerCase() === 'khong' ||
    s === '0 phút' || s === '0 Phút' || s === '0 SMS'
  ) return null;
  return s;
}

/**
 * Tạo thẻ <uu_dai> tổng hợp ưu đãi nổi bật nhất của gói.
 * Ưu tiên: data_theo_ngay, uudaitrong, tien_ich_free.
 */
function buildUuDai(pkg) {
  const parts = [];
  const data = nonZero(pkg.data_theo_ngay);
  if (data) parts.push(`${data} tốc độ cao`);

  const them = nonZero(pkg.uudaitrong);
  if (them) parts.push(them);

  const apps = nonZero(pkg.tien_ich_free);
  if (apps) parts.push(apps);

  return parts.length > 0 ? parts.join('; ') : '';
}

/**
 * Xây dựng cú pháp đăng ký an toàn:
 * - Nếu field dangky đã bao gồm "Soạn" → dùng nguyên văn
 * - Nếu chưa có → thêm "Soạn ... gửi 191"
 * - Nếu là "0" → trả về "0" để hệ thống render My Viettel
 */
function buildDangKy(dangky) {
  if (!dangky) return null;
  const s = String(dangky).trim();
  if (s === '0') return '0';
  // Nếu đã có "Soạn" (case-insensitive) → xuất nguyên văn
  if (/^soạn\s/i.test(s)) return s;
  // Nếu chưa có → bọc lại
  return `Soạn ${s} gửi 191`;
}

/**
 * Chuyển một object gói cước thành thẻ XML chuẩn.
 * Cấu trúc bám sát yêu cầu: ma_goi, gia, chu_ky, uu_dai, dangky.
 */
function packageToXml(pkg) {
  const lines = [];
  lines.push('  <goi_cuoc>');
  lines.push(`    <ma_goi>${pkg.ma_goi || ''}</ma_goi>`);
  lines.push(`    <gia>${pkg.gia != null ? Number(pkg.gia) : 0}</gia>`);
  lines.push(`    <chu_ky>${formatCycle(pkg.chu_ky_ngay)}</chu_ky>`);

  // Tên gói (tùy chọn, bổ sung ngữ cảnh)
  const ten = nonZero(pkg.ten);
  if (ten) lines.push(`    <ten>${ten}</ten>`);

  // Ưu đãi nổi bật
  const uuDai = buildUuDai(pkg);
  if (uuDai) lines.push(`    <uu_dai>${uuDai}</uu_dai>`);

  // Gọi thoại
  const voiceIn = nonZero(pkg.free_noi_mang);
  const voiceOut = nonZero(pkg.free_ngoai_mang);
  if (voiceIn) lines.push(`    <goi_noi_mang>${voiceIn}</goi_noi_mang>`);
  if (voiceOut) lines.push(`    <goi_ngoai_mang>${voiceOut}</goi_ngoai_mang>`);

  // SMS
  const sms = nonZero(pkg.sms);
  if (sms) lines.push(`    <sms>${sms}</sms>`);

  // Loại mạng
  const loaiMang = nonZero(pkg.loai_mang);
  if (loaiMang) lines.push(`    <loai_mang>${loaiMang}</loai_mang>`);

  // Điều kiện đăng ký
  const dieuKien = nonZero(pkg.dieu_kien_dang_ky);
  if (dieuKien) lines.push(`    <dieu_kien>${dieuKien}</dieu_kien>`);

  // Cú pháp đăng ký (an toàn — tránh lặp "Soạn Soạn")
  const dk = buildDangKy(pkg.dangky);
  if (dk) lines.push(`    <dangky>${dk}</dangky>`);

  // Cú pháp hủy gia hạn
  const huyGH = pkg.huygiahan ? buildDangKy(pkg.huygiahan) : null;
  if (huyGH) lines.push(`    <huy_gia_han>${huyGH}</huy_gia_han>`);

  // Cú pháp hủy gói
  const huyGC = pkg.huygoicuoc ? buildDangKy(pkg.huygoicuoc) : null;
  if (huyGC) lines.push(`    <huy_goi>${huyGC}</huy_goi>`);

  lines.push('  </goi_cuoc>');
  return lines.join('\n');
}

/**
 * Chuyển toàn bộ danh sách gói cước (tối đa 3) thành khối XML.
 */
function packagesToXml(packages) {
  if (!packages || packages.length === 0) {
    return '<danh_sach_goi_cuoc>\n  <!-- Không có gói cước nào phù hợp -->\n</danh_sach_goi_cuoc>';
  }
  const items = packages.map(packageToXml).join('\n');
  return `<danh_sach_goi_cuoc>\n${items}\n</danh_sach_goi_cuoc>`;
}

/**
 * Tóm tắt intent của người dùng thành block text ngắn gọn cho AI.
 */
function formatIntentSummary(intent) {
  if (!intent) return '';
  const lines = [];

  if (intent.packageCodes && intent.packageCodes.length > 0) {
    lines.push(`Mã gói được hỏi: ${intent.packageCodes.join(', ')}`);
  }
  if (intent.minPrice != null) {
    lines.push(`Ngân sách tối thiểu: ${Number(intent.minPrice).toLocaleString('vi-VN')}đ`);
  }
  if (intent.maxPrice != null) {
    lines.push(`Ngân sách tối đa: ${Number(intent.maxPrice).toLocaleString('vi-VN')}đ`);
  }
  if (intent.cycleDays != null) {
    lines.push(`Chu kỳ yêu cầu: ${formatCycle(String(intent.cycleDays))}`);
  }
  if (intent.networkType) {
    lines.push(`Loại mạng: ${intent.networkType}`);
  }
  if (intent.apps && intent.apps.length > 0) {
    lines.push(`Ứng dụng cần miễn phí: ${intent.apps.join(', ')}`);
  }
  if (intent.features) {
    const needs = [];
    if (intent.features.data) needs.push('data');
    if (intent.features.voice) needs.push('gọi thoại');
    if (intent.features.sms) needs.push('SMS');
    if (needs.length > 0) lines.push(`Nhu cầu: ${needs.join(', ')}`);
  }

  return lines.length > 0 ? lines.join('\n') : 'Không xác định cụ thể';
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * buildPrompt — Xây dựng prompt hoàn chỉnh gửi LLM.
 *
 * Cấu trúc: System Prompt → Nhu cầu khách hàng → XML gói cước → Câu hỏi gốc
 *
 * @param {string} userMessage — Câu hỏi gốc của người dùng
 * @param {Array}  packages    — Danh sách tối đa 3 gói cước đã lọc từ DB
 * @param {object} intent      — Intent object từ intentParser
 * @returns {string}           — Chuỗi prompt hoàn chỉnh
 */
const buildPrompt = (userMessage, packages, intent) => {
  const xmlBlock = packagesToXml(packages);
  const intentSummary = formatIntentSummary(intent);

  const prompt = `${HARD_SYSTEM_PROMPT}

<nhu_cau_khach_hang>
${intentSummary}
</nhu_cau_khach_hang>

${xmlBlock}

Câu hỏi của khách hàng: ${userMessage}`;

  if (prompt.length > 4000) {
    console.warn('[PromptBuilder] Prompt dài:', prompt.length, 'ký tự — xem xét giảm số gói.');
  }

  return prompt;
};

module.exports = { buildPrompt, packagesToXml, formatIntentSummary, HARD_SYSTEM_PROMPT };