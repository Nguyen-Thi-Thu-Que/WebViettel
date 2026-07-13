/**
 * Task 3: System Prompt dùng XML tags để gò LLM.
 * Nghiêm cấm hallucination. Trung thực về dữ liệu thiếu/không khớp.
 */
const SYSTEM_PROMPT = `<system_role>
Bạn là chuyên viên tư vấn gói cước di động Viettel nhiệt tình, chuyên nghiệp và chính xác 100%. 
Nhiệm vụ của bạn là dựa TRỰC TIẾP VÀ DUY NHẤT vào thông tin DỮ LIỆU GÓI CƯỚC được cung cấp để trả lời câu hỏi của người dùng.
</system_role>
<strict_rules>
1. KHÔNG ẢO GIÁC (NO HALLUCINATION): Tuyệt đối KHÔNG ĐƯỢC tự sáng tạo, bịa đặt số liệu, giá tiền, dung lượng, phút gọi hoặc tiện ích không có trong DỮ LIỆU GÓI CƯỚC.
2. ĐỊNH DANH ỨNG DỤNG & GIỚI HẠN: Tuyệt đối không đánh tráo tên ứng dụng (Ví dụ: TV360 khác hoàn toàn với YouTube/TikTok). KHÔNG dùng từ "thả ga", "không giới hạn" hay "miễn phí" nếu gói cước có quy định số phút/GB cụ thể (ví dụ: 35 phút thì phải báo chính xác là 35 phút).
3. TRUNG THỰC: Nếu gói cước trong dữ liệu không đáp ứng đúng yêu cầu của khách (ví dụ khách cần gọi ngoại mạng nhưng gói cước ghi '0'), phải nói rõ: "Dạ, gói cước này chỉ ưu đãi data/nội mạng, chưa bao gồm ưu đãi ngoại mạng ạ".
4. THỜI GIAN VÀ ĐƠN VỊ DATA: Hiểu chính xác 30 ngày = 1 tháng, 90 ngày = 3 tháng, 180 ngày = 6 tháng, 360 ngày = 1 năm. Phải đọc kỹ dung lượng cấp theo "Ngày" (VD: 1GB/ngày) hay theo "Chu kỳ" (VD: 15GB/15 ngày).
5. LỜI VĂN KHÁCH QUAN: TUYỆT ĐỐI KHÔNG dùng các từ ngữ mang tính chủ quan, đánh giá như: "phù hợp nếu", "dùng vừa phải", "nhiều hơn", "tốt hơn", "dành cho sinh viên", "đáp ứng nhu cầu", "lý tưởng cho", "có thể phù hợp" — TRỪ KHI dữ liệu cung cấp có ghi chính xác mô tả đó.
6. GIỚI HẠN NGỮ CẢNH: Chỉ tư vấn ĐÚNG những gói có trong <package_data_context>. Không nhắc, không đề xuất bất kỳ gói nào ngoài danh sách này. Nếu danh sách chỉ có 1 gói, chỉ giới thiệu duy nhất gói đó.
7. XỬ LÝ KHI TRỐNG: Nếu <package_data_context> trống hoặc không có dữ liệu, trả lời đúng nguyên văn câu sau: "Hiện chưa tìm thấy gói đúng với yêu cầu của bạn. Bạn muốn ưu tiên data, gọi thoại hay ngân sách bao nhiêu?"
8. FORMAT: Trình bày ngắn gọn, lịch sự. Dùng gạch đầu dòng (-) cho tên gói cước, giá, chu kỳ, và ưu đãi. Luôn kết thúc bằng một câu hỏi gợi mở xem khách hàng có muốn biết cú pháp đăng ký không.
</strict_rules>`;

/**
 * Task 2: Hàm `formatPackageToText(pkg)` — convert object gói cước thành Text thuần túy.
 * KHÔNG truyền JSON thô vào LLM.
 * Format yêu cầu đúng từng ký tự.
 */
const formatPackageToText = (pkg) => {
  if (!pkg) return '';

  const ten = String(pkg.ten || pkg.ma_goi || '').trim();
  const gia = pkg.gia != null ? Number(pkg.gia).toLocaleString('vi-VN') : '0';
  const chu_ky_ngay = String(pkg.chu_ky_ngay != null ? pkg.chu_ky_ngay : '30').trim();

  // Tên gói, Giá, Chu kỳ: Bắt buộc in ra. Format Giá có dấu chấm hàng nghìn.
  const lines = [
    `- Tên gói: ${ten}`,
    `- Giá: ${gia} VNĐ`,
    `- Chu kỳ: ${chu_ky_ngay} ngày`
  ];

  // Data: Bỏ qua nếu là '0' hoặc '0GB' (không phân biệt hoa thường)
  const cleanData = String(pkg.data_theo_ngay != null ? pkg.data_theo_ngay : '').trim();
  const isDataValid = cleanData && cleanData !== '0' && cleanData.toUpperCase() !== '0GB';

  // Chi tiết ưu đãi (uudaitrong): Bỏ qua nếu là '0'
  const cleanUuDai = String(pkg.uudaitrong != null ? pkg.uudaitrong : '').trim();
  const isUuDaiValid = cleanUuDai && cleanUuDai !== '0';

  if (isDataValid) {
    if (isUuDaiValid) {
      lines.push(`- Data: ${cleanData} (Tổng quan: ${cleanUuDai})`);
    } else {
      lines.push(`- Data: ${cleanData}`);
    }
  } else if (isUuDaiValid) {
    lines.push(`- Chi tiết ưu đãi: ${cleanUuDai}`);
  }

  // Gọi nội mạng, Gọi ngoại mạng, SMS, Tiện ích khác: Chỉ thêm vào chuỗi nếu khác '0'
  const cleanNoiMang = String(pkg.free_noi_mang != null ? pkg.free_noi_mang : '').trim();
  if (cleanNoiMang && cleanNoiMang !== '0') {
    lines.push(`- Gọi nội mạng: ${cleanNoiMang}`);
  }

  const cleanNgoaiMang = String(pkg.free_ngoai_mang != null ? pkg.free_ngoai_mang : '').trim();
  if (cleanNgoaiMang && cleanNgoaiMang !== '0') {
    lines.push(`- Gọi ngoại mạng: ${cleanNgoaiMang}`);
  }

  const cleanSms = String(pkg.sms != null ? pkg.sms : '').trim();
  if (cleanSms && cleanSms !== '0') {
    lines.push(`- SMS: ${cleanSms}`);
  }

  const cleanTienIch = String(pkg.tien_ich_free != null ? pkg.tien_ich_free : '').trim();
  if (cleanTienIch && cleanTienIch !== '0') {
    lines.push(`- Tiện ích khác: ${cleanTienIch}`);
  }

  const cleanDangKy = String(pkg.dangky != null ? pkg.dangky : '').trim();
  if (cleanDangKy && cleanDangKy !== '0') {
    lines.push(`- Đăng ký: ${cleanDangKy}`);
  }

  return lines.join('\n');
};

/**
 * Task 2: Format toàn bộ mảng gói cước thành text block.
 * Join bằng \n\n, tối đa 3 gói.
 */
const formatPackagesToText = (packages) => {
  if (!packages || packages.length === 0) return '';
  return packages.slice(0, 3).map(formatPackageToText).join('\n\n');
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
  if (intent.budget !== null && intent.budget !== undefined) {
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
const buildPrompt = (userMessage, packages, intent) => {
  // Task 2: text thuần túy — KHÔNG truyền JSON thô
  const packageText = formatPackagesToText(packages);
  const intentBlock = formatIntent(intent);

  // Task 3: Cấu trúc XML gò LLM chặt chẽ
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