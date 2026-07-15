const SurveyConfig = require('../models/SurveyConfig');
const SurveyHistory = require('../models/SurveyHistory');
const Package = require('../models/Package');
const Account = require('../models/Account');
const { getPackageContext } = require('./chatbot/packageContext');
const { matchPackages } = require('./chatbot/packageMatcher');
const { canViewPackage } = require('../utils/permission');
const { mapToEnglish } = require('../controllers/packageController');

/**
 * Tiện ích hỗ trợ gộp các bộ lọc (mapping) của các câu trả lời hiện tại
 */
function getFilterFromAnswers(configs, answers) {
  const intentFilter = {};
  for (const config of configs) {
    const field = config.field;
    const userAnswer = answers[field];

    if (userAnswer === undefined || userAnswer === null) {
      continue;
    }

    if (config.multiple && Array.isArray(userAnswer)) {
      for (const val of userAnswer) {
        const matchedOpt = config.options.find(opt => opt.value === val);
        if (matchedOpt && matchedOpt.mapping) {
          Object.assign(intentFilter, matchedOpt.mapping);
        }
      }
    } else {
      const matchedOpt = config.options.find(opt => opt.value === userAnswer);
      if (matchedOpt && matchedOpt.mapping) {
        Object.assign(intentFilter, matchedOpt.mapping);
      }
    }
  }
  return intentFilter;
}

const surveyService = {
  /**
   * Lấy toàn bộ cấu hình câu hỏi của Survey, sắp xếp theo thứ tự (order).
   * Đồng thời tự động cập nhật các tùy chọn khả dụng (disabled: true/false) dựa trên câu trả lời hiện tại.
   */
  getSurveyConfig: async (answers = null, user = null) => {
    // 1. Lấy toàn bộ cấu hình câu hỏi
    const rawConfigs = await SurveyConfig.find().sort({ order: 1 });
    const configs = rawConfigs.map(c => c.toObject());

    // 2. Lấy toàn bộ danh sách gói cước và lọc theo quyền xem của user
    const allPackages = await getPackageContext();
    const visiblePackages = allPackages.filter(pkg => {
      const mapped = mapToEnglish(pkg);
      return canViewPackage(user, mapped);
    });

    const activeAnswers = answers || {};

    // 3. Với mỗi câu hỏi, kiểm tra tính khả dụng của từng option
    for (const config of configs) {
      // Xây dựng bộ lọc cơ sở bằng cách loại trừ câu trả lời của chính câu hỏi này
      const otherAnswers = { ...activeAnswers };
      delete otherAnswers[config.field];
      const baseFilter = getFilterFromAnswers(configs, otherAnswers);

      for (const opt of config.options) {
        // Thử nghiệm ghép mapping của option này vào bộ lọc cơ sở
        const testFilter = { ...baseFilter, ...opt.mapping };
        
        // Sử dụng packageMatcher hiện có để kiểm tra kết quả trả về
        const matched = matchPackages(visiblePackages, testFilter);
        
        // Nếu không có gói cước nào phù hợp, đánh dấu option này bị vô hiệu hóa
        opt.disabled = matched.length === 0;
      }
    }

    return configs;
  },

  submitSurveyAnswers: async (userId, answers) => {
    // 1. Lấy tất cả cấu hình câu hỏi để đối chiếu mapping
    const configs = await SurveyConfig.find();
    const intentFilter = {};

    // 2. Duyệt qua từng câu hỏi để ánh xạ câu trả lời của user sang filter cho packageMatcher
    for (const config of configs) {
      const field = config.field;
      const userAnswer = answers[field];

      if (userAnswer === undefined || userAnswer === null) {
        continue;
      }

      // Xử lý câu hỏi có nhiều lựa chọn (multi-choice)
      if (config.multiple && Array.isArray(userAnswer)) {
        for (const val of userAnswer) {
          const matchedOpt = config.options.find(opt => opt.value === val);
          if (matchedOpt && matchedOpt.mapping) {
            Object.assign(intentFilter, matchedOpt.mapping);
          }
        }
      } else {
        // Xử lý câu hỏi đơn lựa chọn (single-choice)
        const matchedOpt = config.options.find(opt => opt.value === userAnswer);
        if (matchedOpt && matchedOpt.mapping) {
          Object.assign(intentFilter, matchedOpt.mapping);
        }
      }
    }

    // 3. Lấy toàn bộ gói cước từ cơ sở dữ liệu (sử dụng context sẵn có của chatbot để đảm bảo tính nhất quán)
    const allPackages = await getPackageContext();

    // 4. Lấy thông tin user để lọc gói cước được xem theo quyền hạn
    const user = await Account.findOne({ user_id: userId });
    const visiblePackages = allPackages.filter(pkg => {
      const mapped = mapToEnglish(pkg);
      return canViewPackage(user, mapped);
    });

    // 5. Gọi hàm so khớp gói cước dùng chung với Chatbot
    const matchedRawPackages = matchPackages(visiblePackages, intentFilter);

    // Chuyển đổi các gói cước sang chuẩn tiếng Anh dùng cho UI để lưu trữ
    const mappedPackages = matchedRawPackages.map(pkg => mapToEnglish(pkg));

    // 6. Lưu hoặc cập nhật lịch sử khảo sát của User
    // Mỗi user chỉ tồn tại tối đa một bản ghi khảo sát hiện hành
    const surveyHistory = await SurveyHistory.findOneAndUpdate(
      { userId },
      {
        userId,
        answers,
        filters: intentFilter,
        recommendedPackages: mappedPackages
      },
      { upsert: true, new: true }
    );

    return {
      surveyHistory,
      packages: mappedPackages
    };
  },

  /**
   * Lấy lịch sử khảo sát hiện tại của User cùng thông tin chi tiết các gói cước gợi ý
   */
  getSurveyHistory: async (userId) => {
    const history = await SurveyHistory.findOne({ userId });
    if (!history) {
      return null;
    }

    return {
      history,
      packages: history.recommendedPackages || []
    };
  },

  /**
   * Xóa lịch sử khảo sát của User khỏi hệ thống
   */
  deleteSurveyHistory: async (userId) => {
    const result = await SurveyHistory.deleteOne({ userId });
    return result.deletedCount > 0;
  },

  /**
   * Helper tự động tạo dữ liệu câu hỏi mẫu ban đầu nếu collection trống
   */
  checkAndSeedSurveyConfigs: async () => {
    const count = await SurveyConfig.countDocuments();
    // Nếu không có đúng 7 câu hỏi, tiến hành xóa và seed lại để cập nhật đầy đủ tiêu chí
    if (count === 7) {
      return;
    }

    console.log("Seeding default Survey Configurations into database...");
    await SurveyConfig.deleteMany({});

    const defaultConfigs = [
      {
        title: "Ngân sách cước phí",
        description: "Mức chi phí tối đa bạn muốn bỏ ra hàng tháng",
        field: "budget",
        component: "single-choice",
        order: 1,
        multiple: false,
        options: [
          {
            label: "Dưới 50.000đ / tháng",
            value: "under_50",
            detail: "Nhu cầu nghe gọi hoặc data cơ bản",
            mapping: { budgetMin: 0, budgetMax: 50000, cheap: true }
          },
          {
            label: "Từ 50.000đ - 100.050đ / tháng",
            value: "50_100",
            detail: "Tiết kiệm, có lướt web & mạng xã hội",
            mapping: { budgetMin: 50000, budgetMax: 100000 }
          },
          {
            label: "Từ 100.000đ - 200.000đ / tháng",
            value: "100_200",
            detail: "Combo thoại thoải mái và dung lượng lớn",
            mapping: { budgetMin: 100001, budgetMax: 200000 }
          },
          {
            label: "Trên 200.000đ / tháng",
            value: "above_200",
            detail: "Nhu cầu đàm thoại VIP và không giới hạn",
            mapping: { budgetMin: 200001, budgetMax: 1000000, expensive: true }
          },
          {
            label: "Mức ngân sách nào cũng được",
            value: "any",
            detail: "Đặt hiệu năng và dung lượng lên hàng đầu",
            mapping: {}
          }
        ]
      },
      {
        title: "Loại gói cước mong muốn",
        description: "Lựa chọn loại dịch vụ phù hợp với nhu cầu chính của bạn",
        field: "category",
        component: "single-choice",
        order: 2,
        multiple: false,
        options: [
          {
            label: "Gói cước chỉ có Data di động",
            value: "data",
            detail: "Chỉ lướt web, không cần gọi thoại miễn phí",
            mapping: { needData: true, needVoice: false, needCombo: false }
          },
          {
            label: "Gói cước Combo (Cả Data và Thoại)",
            value: "combo",
            detail: "Combo đầy đủ data dung lượng cao và thoại miễn phí",
            mapping: { needData: true, needVoice: true, needCombo: true }
          },
          {
            label: "Gói cước chuyên biệt Mạng xã hội",
            value: "social",
            detail: "Tập trung truy cập Facebook, TikTok, YouTube",
            mapping: { needSocial: true }
          },
          {
            label: "Gói cước chuyên đàm thoại",
            value: "voice",
            detail: "Chỉ đàm thoại, không có dung lượng data",
            mapping: { needVoice: true, needData: false }
          }
        ]
      },
      {
        title: "Chu kỳ sử dụng",
        description: "Thời gian chu kỳ cước gói cước bạn mong muốn",
        field: "cycle",
        component: "single-choice",
        order: 3,
        multiple: false,
        options: [
          {
            label: "Sử dụng ngắn hạn (Gói ngày/tuần)",
            value: "short",
            detail: "Chu kỳ cước dưới 15 ngày",
            mapping: { needShortTerm: true, needLongTerm: false, needYearly: false }
          },
          {
            label: "Sử dụng tháng (30 ngày)",
            value: "monthly",
            detail: "Chu kỳ cước phổ thông 30 ngày",
            mapping: { needShortTerm: false, needLongTerm: false, needYearly: false, minDays: 30 }
          },
          {
            label: "Sử dụng dài hạn (3 - 6 tháng)",
            value: "long",
            detail: "Chu kỳ cước từ 90 đến 180 ngày",
            mapping: { needLongTerm: true, needYearly: false, minDays: 90 }
          },
          {
            label: "Sử dụng chu kỳ năm (12 tháng)",
            value: "yearly",
            detail: "Tiết kiệm chi phí, không lo quên nạp tiền gia hạn",
            mapping: { needYearly: true, needLongTerm: true }
          }
        ]
      },
      {
        title: "Dung lượng Data",
        description: "Nhu cầu truy cập Internet, lướt web hàng ngày của bạn",
        field: "dataDemand",
        component: "single-choice",
        order: 4,
        multiple: false,
        options: [
          {
            label: "Không dùng Data di động",
            value: "none",
            detail: "Chỉ dùng Wi-Fi ở nhà hoặc nơi làm việc",
            mapping: { needData: false }
          },
          {
            label: "Dùng ít (Dưới 1 GB/ngày)",
            value: "low",
            detail: "Chỉ đọc tin nhắn, tin tức cơ bản khi ra ngoài",
            mapping: { needData: true }
          },
          {
            label: "Trung bình (1 - 3 GB/ngày)",
            value: "medium",
            detail: "Lướt web, nghe nhạc, mạng xã hội liên tục",
            mapping: { needData: true }
          },
          {
            label: "Nhiều (Từ 3 - 5 GB/ngày)",
            value: "high",
            detail: "Xem video HD, livestream, làm việc di động nhiều",
            mapping: { needData: true }
          },
          {
            label: "Không giới hạn dung lượng",
            value: "unlimited",
            detail: "Tốc độ cao nhất để chơi game, download lớn",
            mapping: { needData: true }
          }
        ]
      },
      {
        title: "Gọi thoại miễn phí",
        description: "Nhu cầu đàm thoại, gọi điện nội/ngoại mạng của bạn",
        field: "voiceDemand",
        component: "single-choice",
        order: 5,
        multiple: false,
        options: [
          {
            label: "Không gọi nhiều",
            value: "none",
            detail: "Chủ yếu liên lạc online qua MXH",
            mapping: { needVoice: false }
          },
          {
            label: "Gọi ít (Dưới 500 phút)",
            value: "low",
            detail: "Liên hệ ngắn công việc hoặc gia đình",
            mapping: { needVoice: true }
          },
          {
            label: "Gọi nhiều (Trên 1000 phút)",
            value: "high",
            detail: "Tần suất gọi cao, bán hàng, CSKH",
            mapping: { needVoice: true }
          }
        ]
      },
      {
        title: "Ưu đãi tin nhắn SMS",
        description: "Nhu cầu sử dụng tin nhắn SMS nội mạng và ngoại mạng",
        field: "smsDemand",
        component: "single-choice",
        order: 6,
        multiple: false,
        options: [
          {
            label: "Không cần nhắn tin SMS",
            value: "none",
            detail: "Chủ yếu liên lạc qua ứng dụng OTT",
            mapping: { needSms: false }
          },
          {
            label: "Cần miễn phí nhắn tin SMS",
            value: "sms",
            detail: "Thường xuyên gửi tin nhắn SMS truyền thống",
            mapping: { needSms: true }
          }
        ]
      },
      {
        title: "Mạng xã hội và Tiện ích miễn phí",
        description: "Lựa chọn các ứng dụng bạn muốn được miễn cước data 100%",
        field: "utilities",
        component: "multi-choice",
        order: 7,
        multiple: true,
        options: [
          {
            label: "TikTok",
            value: "TikTok",
            detail: "Miễn phí 100% dung lượng TikTok",
            mapping: { needTiktok: true, needSocial: true }
          },
          {
            label: "YouTube",
            value: "YouTube",
            detail: "Miễn phí 100% dung lượng YouTube",
            mapping: { needYoutube: true, needSocial: true }
          },
          {
            label: "Facebook",
            value: "Facebook",
            detail: "Miễn phí 100% dung lượng Facebook",
            mapping: { needFacebook: true, needSocial: true }
          },
          {
            label: "TV360",
            value: "TV360",
            detail: "Xem TV di động trực tuyến trên TV360",
            mapping: { needTV360: true }
          },
          {
            label: "Xem phim giải trí",
            value: "Movie",
            detail: "Truy cập các ứng dụng xem phim giải trí",
            mapping: { needMovie: true }
          }
        ]
      }
    ];

    await SurveyConfig.insertMany(defaultConfigs);
    console.log("Successfully seeded 7 default Survey Configurations.");
  }
};

module.exports = surveyService;
