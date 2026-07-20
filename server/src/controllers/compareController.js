const CompareHistory = require('../models/CompareHistory');
const Package = require('../models/Package');
const aiService = require('../services/ai/ai.service');

const sanitizeMaGoiArray = (arr) => {
  if (!arr || !Array.isArray(arr)) return [];
  return Array.from(new Set(arr.map(item => String(item).trim()).filter(Boolean)));
};

/**
 * 1. Khởi tạo / Cập nhật phiên so sánh (Session Tracking - Upsert)
 * Route: POST /api/compare/session
 */
exports.saveCompareSession = async (req, res, next) => {
  try {
    const {
      session_id,
      guest_id,
      is_guest,
      packages_compared,
      final_packages,
      selected_package,
      compare_duration,
      completed,
      cleared_by_user,
      status,
      cleared_at
    } = req.body;

    if (!session_id) {
      return res.status(400).json({ success: false, message: 'session_id is required' });
    }

    const userId = req.user ? req.user.user_id : null;
    const isGuest = req.user ? false : (is_guest !== undefined ? is_guest : true);

    const cleanPackagesCompared = sanitizeMaGoiArray(packages_compared);
    const cleanFinalPackages = sanitizeMaGoiArray(final_packages);
    const cleanSelectedPkg = selected_package ? String(selected_package).trim() : null;

    const updateFields = {
      updated_at: new Date(),
      is_guest: isGuest,
      status: status || 'ACTIVE'
    };

    if (userId) updateFields.user_id = userId;
    if (guest_id) updateFields.guest_id = String(guest_id).trim();
    if (completed !== undefined) updateFields.completed = completed;
    if (cleared_by_user !== undefined) updateFields.cleared_by_user = cleared_by_user;
    if (cleared_at) updateFields.cleared_at = cleared_at;
    if (cleanSelectedPkg !== null) updateFields.selected_package = cleanSelectedPkg;
    if (compare_duration !== undefined) updateFields.compare_duration = compare_duration;

    // Ghi đè mảng gói so sánh hiện tại trong phiên để duy trì 1 bản ghi duy nhất per session
    if (cleanPackagesCompared.length > 0) {
      updateFields.packages_compared = cleanPackagesCompared;
      updateFields.final_packages = cleanPackagesCompared;
      updateFields.compare_count = cleanPackagesCompared.length;
    }

    if (cleanFinalPackages.length > 0) {
      updateFields.final_packages = cleanFinalPackages;
    }

    const doc = await CompareHistory.findOneAndUpdate(
      { session_id },
      { $set: updateFields },
      { new: true, upsert: true, returnDocument: 'after' }
    );

    return res.json({ success: true, message: 'Session updated successfully', data: doc });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Kết thúc phiên so sánh (Beacon / Navigator safe)
 * Route: POST /api/compare/session/close
 */
exports.closeCompareSession = async (req, res, next) => {
  try {
    const { session_id, compare_duration, status, selected_package } = req.body;

    if (!session_id) {
      return res.status(400).json({ success: false, message: 'session_id is required' });
    }

    const cleanSelectedPkg = selected_package ? String(selected_package).trim() : null;

    const updateFields = {
      status: status || 'ABANDONED',
      updated_at: new Date()
    };

    if (compare_duration !== undefined) {
      updateFields.compare_duration = compare_duration;
    }

    if (status === 'COMPLETED') {
      updateFields.completed = true;
    } else if (status === 'CLEARED') {
      updateFields.cleared_by_user = true;
      updateFields.cleared_at = new Date();
    }

    if (cleanSelectedPkg !== null) {
      updateFields.selected_package = cleanSelectedPkg;
    }

    const doc = await CompareHistory.findOneAndUpdate(
      { session_id },
      { $set: updateFields },
      { new: true, returnDocument: 'after' }
    );

    return res.json({ success: true, message: 'Session closed successfully', data: doc });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Phân tích nhận xét gói cước bằng AI LLM thực tế theo mảng chuỗi ma_goi
 * Route: POST /api/compare/ai-analyze
 */
exports.analyzeCompareAI = async (req, res, next) => {
  try {
    const rawList = req.body.maGoiList || req.body.packageIds || [];

    if (!Array.isArray(rawList) || rawList.length === 0) {
      return res.status(400).json({ success: false, message: 'maGoiList array is required' });
    }

    // Chuẩn hóa mảng ma_goi chuỗi, trim khoảng trắng
    const maGoiList = Array.from(new Set(rawList.map(item => String(item).trim()).filter(Boolean)));

    if (maGoiList.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid maGoiList array' });
    }

    // Truy vấn thông tin gói cước từ CSDL goi_cuoc theo ma_goi duy nhất
    const packages = await Package.find({ ma_goi: { $in: maGoiList } }).lean();

    if (packages.length === 0) {
      return res.json({
        success: true,
        data: {
          summary: "Không tìm thấy thông tin gói cước để phân tích.",
          best_value: "Vui lòng chọn các gói cước hợp lệ trong danh mục.",
          recommendation: "Hãy chọn tối đa 3 gói cước để đối chiếu ưu đãi chi tiết."
        }
      });
    }

    // Dựng Prompt phân tích gửi cho LLM (bóc tách tường minh, không sử dụng uudaitrong)
    const packageDetailsText = packages.map(p => `
=== GÓI CƯỚC: ${p.ma_goi} ===
- Tên gói: ${p.ten}
- Giá tiền đăng ký: ${p.gia} VNĐ
- Chu kỳ sử dụng: ${p.chu_ky_ngay} ngày
- Dung lượng Data tốc độ cao: ${p.data_theo_ngay || 'Không có'}
- Ưu đãi gọi nội mạng: ${p.free_noi_mang && p.free_noi_mang !== '0' ? p.free_noi_mang : 'Không có'}
- Ưu đãi gọi ngoại mạng: ${p.free_ngoai_mang && p.free_ngoai_mang !== '0' ? p.free_ngoai_mang : 'Không có'}
- Tin nhắn SMS miễn phí: ${p.sms && p.sms !== '0' ? p.sms : 'Không có'}
- Tiện ích ứng dụng miễn phí (Free App): ${p.tien_ich_free && p.tien_ich_free !== '0' ? p.tien_ich_free : 'Không có'}
`).join('\n');

    const prompt = `Bạn là chuyên gia tư vấn viễn thông Viettel. Hãy phân tích và so sánh các gói cước di động sau:
${packageDetailsText}

YÊU CẦU NGHIÊM NGẶT VỀ NGHIỆP VỤ & NỘI DUNG:
1. Tính toán logic: Hãy so sánh dựa trên thông số thực tế. Nếu các gói KHÔNG có phút gọi hoặc tin nhắn, TUYỆT ĐỐI không được nhận xét là "tối ưu về phút gọi/sms". Phải quy đổi chu kỳ về cùng một hệ quy chiếu để xem gói nào thực sự rẻ và nhiều data hơn (Ví dụ: 4GB/ngày là 120GB/tháng).
2. Phong cách hành văn: Viết văn tự nhiên, cô đọng. TUYỆT ĐỐI KHÔNG lặp đi lặp lại một mẫu câu rập khuôn (như "phù hợp cho người dùng muốn... mà không lo về chi phí"). Hãy đa dạng hóa từ ngữ để tăng tính thuyết phục.
3. Định dạng JSON bắt buộc trả về duy nhất MỘT CHUỖI JSON SẠCH (KHÔNG dùng markdown codeblock \`\`\`json, KHÔNG kèm văn bản dẫn dắt).
4. Đối với mỗi gói cước, chỉ được phép phân tích dựa trên các thông số định lượng rõ ràng được liệt kê ở các dòng (Tên gói, Giá tiền, Chu kỳ, Dung lượng Data, Tiện ích ứng dụng...). Tuyệt đối không tự suy diễn hoặc bịa đặt thêm các thông số ưu đãi ngoài các dòng dữ liệu trên.

Cấu trúc JSON bắt buộc:
{
  "summary": "Tóm tắt cốt lõi sự khác biệt và điểm đặc trưng của từng gói (Ví dụ: Một gói chuyên Meta mạng xã hội, một gói chuyên giải trí xem phim, một gói chuyên Data khủng kèm Tiktok) tối đa trong 2-3 câu ngắn gọn.",
  "best_value": "Nhận xét khách quan xem gói nào mang lại giá trị sử dụng thực tế cao nhất trên số tiền bỏ ra (Value for money) và phân tích lý do dựa trên thông số data dùng chung hoặc ưu đãi đặc thù.",
  "recommendation": "Trường này BẮT BUỘC phải là một chuỗi văn bản (String). Gợi ý rõ ràng, ngắn gọn phân loại đối tượng cho từng gói cước. Phải phân tách các dòng bằng dấu xuống dòng '\\n' và dấu gạch đầu dòng '-' (Ví dụ: '- Gói A: Dành cho tín đồ mạng xã hội...\\n- Gói B: Lựa chọn giải trí cho...')."
}`;

    let parsedJSON = null;

    try {
      let aiRawResponse = await aiService.generateContent(prompt);

      if (typeof aiRawResponse === 'string') {
        let cleanText = aiRawResponse.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        try {
          parsedJSON = JSON.parse(cleanText);
        } catch (e) {
          const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsedJSON = JSON.parse(jsonMatch[0]);
          }
        }
      }
    } catch (aiErr) {
      console.error('[Compare AI Controller] Error generating AI analysis:', aiErr.message);
    }

    // Fallback an toàn nếu AI parse thất bại
    if (!parsedJSON || !parsedJSON.summary) {
      const cheapestPkg = [...packages].sort((a, b) => a.gia - b.gia)[0];
      parsedJSON = {
        summary: `So sánh ${packages.length} gói cước: ${packages.map(p => p.ma_goi).join(', ')}. Mỗi gói có ưu thế riêng về giá cước, lưu lượng data và các tiện ích đi kèm.`,
        best_value: `Gói ${cheapestPkg.ma_goi} có mức giá tiết kiệm nhất (${new Intl.NumberFormat('vi-VN').format(cheapestPkg.gia)}đ/${cheapestPkg.chu_ky_ngay} ngày) thích hợp cho nhu cầu tài chính tối ưu.`,
        recommendation: packages.map(p => `${p.ma_goi}: Phù hợp thuê bao cần ${p.data_theo_ngay ? 'Data ' + p.data_theo_ngay : 'ưu đãi thoại'}.`).join(' ')
      };
    }

    // Sanitizer: Đảm bảo tất cả các trường trả về đều là String, biến Object thành String nếu AI vi phạm
    if (parsedJSON) {
      if (typeof parsedJSON.recommendation === 'object' && parsedJSON.recommendation !== null) {
        parsedJSON.recommendation = Object.entries(parsedJSON.recommendation)
          .map(([key, val]) => `- ${key}: ${typeof val === 'object' ? JSON.stringify(val) : String(val)}`)
          .join('\n');
      } else if (typeof parsedJSON.recommendation !== 'string') {
        parsedJSON.recommendation = String(parsedJSON.recommendation || '');
      }

      if (typeof parsedJSON.summary === 'object' && parsedJSON.summary !== null) {
        parsedJSON.summary = Object.values(parsedJSON.summary).map(v => String(v)).join(' ');
      } else if (typeof parsedJSON.summary !== 'string') {
        parsedJSON.summary = String(parsedJSON.summary || '');
      }

      if (typeof parsedJSON.best_value === 'object' && parsedJSON.best_value !== null) {
        parsedJSON.best_value = Object.entries(parsedJSON.best_value)
          .map(([key, val]) => `${key}: ${String(val)}`)
          .join('; ');
      } else if (typeof parsedJSON.best_value !== 'string') {
        parsedJSON.best_value = String(parsedJSON.best_value || '');
      }
    }

    return res.json({
      success: true,
      data: parsedJSON
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Lấy thống kê so sánh (Admin Analytics)
 * Route: GET /api/compare/analytics
 */
exports.getCompareAnalytics = async (req, res, next) => {
  try {
    const histories = await CompareHistory.find({});

    const totalSessions = histories.length;
    if (totalSessions === 0) {
      return res.json({
        success: true,
        data: {
          totalSessions: 0,
          mostComparedPackages: [],
          mostPopularPairs: [],
          conversionRate: 0,
          averageDuration: 0,
          resetCount: 0,
          guestUserRatio: { guest: 0, user: 0 },
          lastSelectedPackages: []
        }
      });
    }

    const packageCompareCounts = {};
    const pairCounts = {};
    let totalDuration = 0;
    let resetCount = 0;
    let guestCount = 0;
    let userCount = 0;
    const selectedPackageCounts = {};
    let completedCount = 0;

    histories.forEach(h => {
      if (h.packages_compared && Array.isArray(h.packages_compared)) {
        h.packages_compared.forEach(pkgId => {
          packageCompareCounts[pkgId] = (packageCompareCounts[pkgId] || 0) + 1;
        });

        const uniquePkgs = Array.from(new Set(h.packages_compared)).sort();
        if (uniquePkgs.length >= 2) {
          for (let i = 0; i < uniquePkgs.length; i++) {
            for (let j = i + 1; j < uniquePkgs.length; j++) {
              const pairKey = `${uniquePkgs[i]} - ${uniquePkgs[j]}`;
              pairCounts[pairKey] = (pairCounts[pairKey] || 0) + 1;
            }
          }
        }
      }

      totalDuration += h.compare_duration || 0;

      if (h.status === 'CLEARED' || h.cleared_by_user) {
        resetCount++;
      }

      if (h.is_guest) {
        guestCount++;
      } else {
        userCount++;
      }

      if (h.completed) {
        completedCount++;
      }

      if (h.selected_package) {
        selectedPackageCounts[h.selected_package] = (selectedPackageCounts[h.selected_package] || 0) + 1;
      }
    });

    const mostComparedPackages = Object.entries(packageCompareCounts)
      .map(([pkgId, count]) => ({ packageId: pkgId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const mostPopularPairs = Object.entries(pairCounts)
      .map(([pair, count]) => ({ pair, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const lastSelectedPackages = Object.entries(selectedPackageCounts)
      .map(([pkgId, count]) => ({ packageId: pkgId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const conversionRate = totalSessions > 0 ? (completedCount / totalSessions) * 100 : 0;
    const averageDuration = totalSessions > 0 ? totalDuration / totalSessions : 0;

    return res.json({
      success: true,
      data: {
        totalSessions,
        mostComparedPackages,
        mostPopularPairs,
        conversionRate,
        averageDuration,
        resetCount,
        guestUserRatio: { guest: guestCount, user: userCount },
        lastSelectedPackages
      }
    });
  } catch (error) {
    next(error);
  }
};
