const ChatbotConfig = require('../models/ChatbotConfig');
const intentParser = require('./chatbot/intentParser');
const { getPackageContext, sanitizePackage } = require('./chatbot/packageContext');
const { matchPackages } = require('./chatbot/packageMatcher');
const { buildPrompt } = require('./chatbot/promptBuilder');
const { generateContent } = require('./ai/ai.service');

const chatbotService = {
  getConfig: async () => {
    const config = await ChatbotConfig.findOne();
    if (!config) {
      return {
        systemPrompt: 'Bạn là trợ lý ảo thông minh Viettel AI...',
        trainingKeywords: []
      };
    }
    return config;
  },

  updateConfig: async (configData) => {
    let config = await ChatbotConfig.findOne();
    if (!config) {
      config = new ChatbotConfig({
        systemPrompt: configData.systemPrompt,
        trainingKeywords: configData.trainingKeywords || []
      });
    } else {
      config.systemPrompt = configData.systemPrompt;
      config.trainingKeywords = configData.trainingKeywords || [];
    }
    await config.save();
    return config;
  },

  processMessage: async (message) => {
    console.time('[Chatbot] Total');
    try {
      console.log('[Chatbot] User message:', message);

      const lowerMessage = message.toLowerCase().trim();

      // Bypass nhanh — hội thoại không liên quan đến gói cước
      const isPackageQuery = /gói|cước|data|mạng|internet|gb|gọi|thoại|phút|sms|tin nhắn|đ|đồng|k|tiền|giá/i.test(lowerMessage)
                          || /[a-zA-Z]+\d+/i.test(lowerMessage)
                          || /youtube|tiktok|facebook|fb|yt|movie|phim|tv360|combo|addon|sinh viên|sinh vien|văn phòng|van phong|game|5g/i.test(lowerMessage);

      if (!isPackageQuery) {
        const greetings = ['xin chào', 'chào', 'hello', 'hi', 'chào bạn', 'cảm ơn', 'tạm biệt', 'bye', 'ok', 'oke'];
        if (greetings.includes(lowerMessage)) {
          console.timeEnd('[Chatbot] Total');
          return {
            text: 'Xin chào! Tôi là tư vấn viên gói cước Viettel. Bạn đang cần gói data, gọi thoại, hay có mức ngân sách cụ thể nào không?',
            suggestedAction: null
          };
        }

        if (/đăng nhập|login|vào tài khoản/i.test(lowerMessage)) {
          console.timeEnd('[Chatbot] Total');
          return {
            text: 'Để đăng nhập, bạn nhấn nút Đăng nhập ở góc trên phải, điền số điện thoại và mật khẩu là xong.',
            suggestedAction: null
          };
        }

        if (/thanh toán|nạp tiền|nạp ví|wallet|blockchain|nap tien/i.test(lowerMessage)) {
          console.timeEnd('[Chatbot] Total');
          return {
            text: 'Bạn có thể nạp tiền vào tài khoản qua mục Nạp tiền trên thanh điều hướng, hỗ trợ thanh toán cổng VietQR hoặc Blockchain.',
            suggestedAction: {
              type: 'survey',
              payload: '/dashboard',
              label: 'Đến trang Dashboard'
            }
          };
        }

        if (/đăng ký gói|mua gói|subscribe/i.test(lowerMessage)) {
          console.timeEnd('[Chatbot] Total');
          return {
            text: 'Để đăng ký gói cước, bạn nhấn nút Đăng ký trực tiếp trên trang gói cước, hoặc soạn cú pháp đăng ký gửi 191.',
            suggestedAction: null
          };
        }

        if (/số dư|tài khoản của tôi|thông tin thuê bao|kiểm tra tài khoản/i.test(lowerMessage)) {
          console.timeEnd('[Chatbot] Total');
          return {
            text: 'Bạn xem thông tin tài khoản, số dư ví và lịch sử đăng ký trong mục Tài khoản cá nhân.',
            suggestedAction: {
              type: 'survey',
              payload: '/dashboard',
              label: 'Kiểm tra tài khoản'
            }
          };
        }

        // Hỏi ngoài phạm vi Viettel
        console.timeEnd('[Chatbot] Total');
        return {
          text: 'Tôi chỉ có thể hỗ trợ tư vấn gói cước Viettel. Bạn có nhu cầu gói data, gọi thoại hay mức giá cụ thể nào không?',
          suggestedAction: null
        };
      }

      // 1. Phân tích intent
      const intent = intentParser(message);
      console.log('[Chatbot] Intent:', JSON.stringify(intent));

      // 2. Lấy toàn bộ gói (có cache)
      const allPackages = await getPackageContext();

      // 3. Khớp và xếp hạng — Sprint 6 Hotfix: packageCodes[]
      const topPackages = matchPackages(allPackages, intent);
      console.log('[Chatbot] Matched:', topPackages.map(p => p.ma_goi));
      if (intent.packageCodes && intent.packageCodes.length > 0) {
        console.log('[Chatbot] PackageCodes hỏi:', intent.packageCodes);
      }

      // 4. Xử lý khi không tìm thấy gói — Sprint 6 §8
      if (topPackages.length === 0) {
        console.timeEnd('[Chatbot] Total');
        return {
          text: 'Hiện tại chưa tìm thấy gói cước nào phù hợp với yêu cầu của bạn. Bạn vui lòng điều chỉnh lại điều kiện tìm kiếm (ví dụ: thay đổi khoảng giá, dung lượng data hoặc thời gian chu kỳ cước) để tìm được gói phù hợp nhé.',
          suggestedAction: null
        };
      }

      // 5. Sanitize và tính toán các cờ boolean ở backend
      const cleanPackages = topPackages.map(pkg => {
        const hasRealData = (p) => {
          if (!p.data_theo_ngay) return false;
          const s = String(p.data_theo_ngay).trim().toUpperCase();
          return s !== '0' && s !== '0GB' && s !== '0 GB' && !s.startsWith('0') && s !== 'KHÔNG' && s !== 'KHONG';
        };

        const hasRealVoice = (p) => {
          const check = (val) => {
            if (!val) return false;
            const s = String(val).trim().toUpperCase();
            return s !== '0' && s !== '0 PHÚT' && s !== '0 PHUT' && !s.startsWith('0') && s !== 'KHÔNG' && s !== 'KHONG';
          };
          return !!(check(p.free_noi_mang) || check(p.free_ngoai_mang));
        };

        const hasRealSms = (p) => {
          if (!p.sms) return false;
          const s = String(p.sms).trim().toUpperCase();
          return s !== '0' && s !== '0 SMS' && s !== '0 TIN NHẮN' && s !== '0 TIN NHAN' && !s.startsWith('0') && s !== 'KHÔNG' && s !== 'KHONG';
        };

        const hasTV360 = (p) => {
          const check = (val) => val && /tv360/i.test(String(val));
          return !!(check(p.tien_ich_free) || check(p.uudaitrong));
        };

        const hasFacebook = (p) => {
          const check = (val) => val && /facebook|fb/i.test(String(val));
          return !!(check(p.tien_ich_free) || check(p.uudaitrong) || (p.benefit_group && /facebook|fb/i.test(String(p.benefit_group))));
        };

        const hasYoutube = (p) => {
          const check = (val) => val && /youtube|yt/i.test(String(val));
          return !!(check(p.tien_ich_free) || check(p.uudaitrong) || (p.benefit_group && /youtube|yt/i.test(String(p.benefit_group))));
        };

        const hasTiktok = (p) => {
          const check = (val) => val && /tiktok/i.test(String(val));
          return !!(check(p.tien_ich_free) || check(p.uudaitrong) || (p.benefit_group && /tiktok/i.test(String(p.benefit_group))));
        };

        const hasMovie = (p) => {
          const check = (val) => val && /phim|movie|cinema/i.test(String(val));
          return !!(check(p.tien_ich_free) || check(p.uudaitrong) || (p.benefit_group && /movie/i.test(String(p.benefit_group))));
        };

        return {
          ma_goi: pkg.ma_goi || '',
          ten: pkg.ten || '',
          gia: pkg.gia != null ? Number(pkg.gia) : 0,
          chu_ky_ngay: pkg.chu_ky_ngay != null ? String(pkg.chu_ky_ngay) : '',
          data_theo_ngay: pkg.data_theo_ngay || '',
          free_noi_mang: pkg.free_noi_mang || '',
          free_ngoai_mang: pkg.free_ngoai_mang || '',
          sms: pkg.sms || '',
          tien_ich_free: pkg.tien_ich_free || '',
          uudaitrong: pkg.uudaitrong || '',
          dieu_kien_dang_ky: pkg.dieu_kien_dang_ky || '',
          dangky: pkg.dangky || '',
          huygiahan: pkg.huygiahan || '',
          huygoicuoc: pkg.huygoicuoc || '',
          hasData: hasRealData(pkg),
          hasVoice: hasRealVoice(pkg),
          hasSms: hasRealSms(pkg),
          hasTV360: hasTV360(pkg),
          hasFacebook: hasFacebook(pkg),
          hasYoutube: hasYoutube(pkg),
          hasTiktok: hasTiktok(pkg),
          hasMovie: hasMovie(pkg)
        };
      });

      // 6. Xây dựng prompt — Sprint 6 Hotfix: truyền intent vào buildPrompt
      const prompt = buildPrompt(message, cleanPackages, intent);

      // 7. Gọi Groq
      const replyText = await generateContent(prompt);

      // 8. Phát hiện suggestedAction — chỉ tạo khi AI nhắc đúng mã gói tồn tại
      let suggestedAction = null;
      const lowerReply = replyText.toLowerCase();

      for (const p of topPackages) {
        if (p.ma_goi && lowerReply.includes(p.ma_goi.toLowerCase())) {
          suggestedAction = {
            type: 'view_details',
            payload: p.ma_goi.toLowerCase(),
            label: `Xem chi tiết gói ${p.ma_goi.toUpperCase()}`
          };
          break;
        }
      }

      // Fallback: nếu AI đề cập khảo sát
      if (!suggestedAction && (lowerReply.includes('khảo sát') || lowerMessage.includes('khảo sát'))) {
        suggestedAction = {
          type: 'survey',
          payload: '/survey',
          label: 'Làm khảo sát ngay'
        };
      }

      console.timeEnd('[Chatbot] Total');
      return { text: replyText, suggestedAction };

    } catch (error) {
      console.timeEnd('[Chatbot] Total');
      console.error('[Chatbot AI] Error:', error);
      return {
        text: 'Xin lỗi, hiện tại tôi không thể xử lý yêu cầu của bạn. Vui lòng thử lại sau.'
      };
    }
  },

  // Auto seed helper
  checkAndSeedChatbot: async () => {
    const count = await ChatbotConfig.countDocuments();
    if (count > 0) return;

    console.log('Seeding default Chatbot Configuration...');
    await ChatbotConfig.create({
      systemPrompt: 'Bạn là trợ lý ảo thông minh Viettel AI, chuyên tư vấn các gói cước di động phù hợp nhất với nhu cầu sử dụng mạng, cuộc gọi và mạng xã hội của khách hàng. Hãy trả lời thân thiện, ngắn gọn và cung cấp nút đăng ký nhanh cho người dùng.',
      trainingKeywords: [
        {
          keyword: 'data',
          response: 'Với nhu cầu data cao, bạn có thể xem gói SD135 (5GB/ngày, 135k/tháng) hoặc ST90N (4GB/ngày, 90k/tháng).',
          suggestedPackageId: 'sd135'
        },
        {
          keyword: 'mạng xã hội',
          response: 'Nếu thích lướt TikTok, YouTube, Facebook, bạn có thể tham khảo các gói MXH chuyên biệt.',
          suggestedPackageId: 'mxh100'
        },
        {
          keyword: 'gọi',
          response: 'Nếu gọi nhiều, gói V120C (120k/tháng) miễn phí nội mạng dưới 20 phút, 50 phút ngoại mạng và 2GB/ngày.',
          suggestedPackageId: 'v120c'
        },
        {
          keyword: 'rẻ',
          response: 'Gói tiết kiệm nhất là V50C (50k/tháng) với 3GB data và gọi nội mạng thoải mái.',
          suggestedPackageId: 'v50c'
        }
      ]
    });
    console.log('Successfully seeded Chatbot Configuration.');
  }
};

module.exports = chatbotService;
