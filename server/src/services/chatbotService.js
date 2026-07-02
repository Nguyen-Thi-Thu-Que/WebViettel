const ChatbotConfig = require('../models/ChatbotConfig');

const chatbotService = {
  getConfig: async () => {
    let config = await ChatbotConfig.findOne();
    if (!config) {
      // Return temporary default object if database query returned nothing (and seeder has not run yet)
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

  processMessage: async (text) => {
    const normalizedText = text.toLowerCase().trim();
    const config = await chatbotService.getConfig();

    // 1. Check for specific keywords defined in training
    for (const item of config.trainingKeywords) {
      if (normalizedText.includes(item.keyword.toLowerCase())) {
        let suggestedAction;
        
        if (item.suggestedPackageId) {
          if (item.suggestedPackageId === 'survey') {
            suggestedAction = {
              type: 'survey',
              payload: '/survey',
              label: 'Làm khảo sát ngay'
            };
          } else {
            suggestedAction = {
              type: 'view_details',
              payload: item.suggestedPackageId,
              label: `Xem chi tiết gói ${item.suggestedPackageId.toUpperCase()}`
            };
          }
        }

        return {
          text: item.response,
          suggestedAction
        };
      }
    }

    // 2. Intent detection for specific greetings or general topics
    if (normalizedText.includes('chào') || normalizedText.includes('hi') || normalizedText.includes('hello') || normalizedText.includes('bot')) {
      return {
        text: 'Xin chào! Tôi là trợ lý ảo Viettel AI. Tôi có thể giúp bạn tìm kiếm gói cước di động phù hợp (data tốc độ cao, gọi thoại, hay gói chuyên biệt MXH). Bạn muốn tôi tư vấn gói cước như thế nào?',
        suggestedAction: {
          type: 'survey',
          payload: '/survey',
          label: 'Khảo sát tìm gói cước'
        }
      };
    }

    if (normalizedText.includes('so sánh') || normalizedText.includes('khác nhau')) {
      return {
        text: 'Bạn có thể thêm tối đa 3 gói cước vào danh sách so sánh để đối chiếu trực quan về giá, data và phút gọi thoại, kèm theo nhận xét hữu ích từ AI. Hãy truy cập trang gói cước để chọn nhé!',
        suggestedAction: {
          type: 'view_details',
          payload: '',
          label: 'Xem danh sách gói cước'
        }
      };
    }

    if (normalizedText.includes('nạp tiền') || normalizedText.includes('số dư') || normalizedText.includes('tài khoản')) {
      return {
        text: 'Để nạp tiền vào tài khoản ảo Viettel của bạn, hãy truy cập vào Trang cá nhân -> Chọn Nạp tiền. Bạn có thể chọn quét VietQR hoặc ví điện tử để được cộng số dư lập tức.',
        suggestedAction: {
          type: 'survey',
          payload: '/profile?tab=topup',
          label: 'Nạp tiền ngay'
        }
      };
    }

    // 3. Fallback default response
    return {
      text: 'Cảm ơn bạn đã nhắn tin. Hiện tại tôi chưa hiểu ý của bạn. Bạn có thể hỏi về các chủ đề như: "gói data nhiều", "gói cước mạng xã hội", "gói gọi điện rẻ", "so sánh gói cước", hoặc nhấp vào nút dưới đây để làm khảo sát nhanh.',
      suggestedAction: {
        type: 'survey',
        payload: '/survey',
        label: 'Tìm gói cước phù hợp'
      }
    };
  },

  // Auto seed helper
  checkAndSeedChatbot: async () => {
    const count = await ChatbotConfig.countDocuments();
    if (count > 0) return;

    console.log("Seeding default Chatbot Configuration...");
    const DEFAULT_CHATBOT_CONFIG = {
      systemPrompt: 'Bạn là trợ lý ảo thông minh Viettel AI, chuyên tư vấn các gói cước di động phù hợp nhất với nhu cầu sử dụng mạng, cuộc gọi và mạng xã hội của khách hàng. Hãy trả lời thân thiện, ngắn gọn và cung cấp nút đăng ký nhanh cho người dùng.',
      trainingKeywords: [
        {
          keyword: 'data',
          response: 'If you have heavy internet needs, I suggest SD135 (5GB/day, 135k/month) or ST90N (4GB/day, 90k/month). Do you want to subscribe now?',
          suggestedPackageId: 'sd135'
        },
        {
          keyword: 'mạng xã hội',
          response: 'For social entertainment or video watching, you should choose MXH100 (100k/month) or MXH120 (120k/month) to get free unlimited access to TikTok, YouTube, and Facebook!',
          suggestedPackageId: 'mxh100'
        },
        {
          keyword: 'gọi',
          response: 'If you call often, V120C (120k/month) gives free internal calls under 20 mins, 50 external mins, and 2GB/day. Or V50C for only 50k/month!',
          suggestedPackageId: 'v120c'
        },
        {
          keyword: 'rẻ',
          response: 'The cheapest monthly package is V50C (50k/month) with 3GB data and comfortable internal calls. For daily use, consider ST5K for only 5,000VND/day!',
          suggestedPackageId: 'v50c'
        },
        {
          keyword: 'khảo sát',
          response: 'If you are unsure of your needs, take our short survey to receive custom suggestions.',
          suggestedPackageId: 'survey'
        }
      ]
    };

    await ChatbotConfig.create(DEFAULT_CHATBOT_CONFIG);
    console.log("Successfully seeded Chatbot Configuration.");
  }
};

module.exports = chatbotService;
