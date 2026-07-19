const SurveyConfig = require('../models/SurveyConfig');
const SurveyHistory = require('../models/SurveyHistory');
const Package = require('../models/Package');
const Account = require('../models/Account');
const PackageFeature = require('../models/PackageFeature');
const { getPackageContext } = require('./chatbot/packageContext');
const { canViewPackage } = require('../utils/permission');
const { mapToEnglish } = require('../controllers/packageController');

/**
 * Các hàm tiện ích hỗ trợ suy luận đặc trưng gói cước một lần (sync)
 */
function hasRealData(pkg) {
  if (!pkg.data_theo_ngay) return false;
  const s = String(pkg.data_theo_ngay).trim().toUpperCase();
  if (s === '0' || s === '0GB' || s === '0 GB' || s.startsWith('0')) return false;
  return true;
}

function hasRealVoice(pkg) {
  const check = (val) => {
    if (!val) return false;
    const s = String(val).trim().toUpperCase();
    return s !== '0' && s !== '0 PHÚT' && s !== '0 PHUT' && !s.startsWith('0');
  };
  return check(pkg.free_noi_mang) || check(pkg.free_ngoai_mang);
}

function hasRealSms(pkg) {
  if (!pkg.sms) return false;
  const s = String(pkg.sms).trim().toUpperCase();
  return s !== '0' && s !== '0 SMS' && s !== '0 TIN NHẮN' && !s.startsWith('0');
}

function getDailyGb(pkg) {
  if (!pkg.data_theo_ngay) return 0;
  const str = String(pkg.data_theo_ngay).trim().toUpperCase();
  const matchDay = str.match(/([\d.]+)\s*GB\s*\/\s*(NGÀY|NGAY|D|DAY)/i);
  if (matchDay) return parseFloat(matchDay[1]);
  const matchMonth = str.match(/([\d.]+)\s*GB\s*\/\s*(THÁNG|THANG|M|MONTH)/i);
  if (matchMonth) return parseFloat(matchMonth[1]) / 30;
  const matchRaw = str.match(/([\d.]+)\s*GB/i);
  if (matchRaw) return parseFloat(matchRaw[1]) / (parseInt(pkg.chu_ky_ngay) || 30);
  return 0;
}

function checkKeyword(pkg, keyword) {
  const regex = new RegExp(keyword, 'i');
  return !!(
    (pkg.benefit_group && regex.test(pkg.benefit_group)) ||
    (pkg.tien_ich_free && regex.test(pkg.tien_ich_free)) ||
    (pkg.uudaitrong && regex.test(pkg.uudaitrong)) ||
    (pkg.dieu_kien_dang_ky && regex.test(pkg.dieu_kien_dang_ky)) ||
    (pkg.ten && regex.test(pkg.ten))
  );
}

/**
 * Đồng bộ hóa dữ liệu từ goi_cuoc sang package_features
 */
async function syncPackageFeatures() {
  const packages = await Package.find();
  for (const pkg of packages) {
    const dailyGb = getDailyGb(pkg);
    const hasData = hasRealData(pkg);
    const hasVoice = hasRealVoice(pkg);
    const hasSms = hasRealSms(pkg);
    const hasYoutube = checkKeyword(pkg, 'youtube');
    const hasTiktok = checkKeyword(pkg, 'tiktok');
    const hasFacebook = checkKeyword(pkg, 'facebook');
    const hasTv360 = checkKeyword(pkg, 'tv360');
    const hasMovie = checkKeyword(pkg, 'movie|phim|cinema');
    const hasSocial = hasYoutube || hasTiktok || hasFacebook || hasTv360 || hasMovie || checkKeyword(pkg, 'social');
    const has5g = !!(pkg.loai_mang && pkg.loai_mang.toUpperCase().includes('5G'));
    
    const isCombo = pkg.phan_loai_goi === 'Combo' || pkg.service_group === 'COMBO' || (hasData && hasVoice);
    const isDataOnly = hasData && !hasVoice;
    const isSocial = ['YOUTUBE', 'TIKTOK', 'FACEBOOK', 'MOVIE', 'SOCIAL'].includes(pkg.benefit_group ? pkg.benefit_group.toUpperCase() : '') || pkg.phan_loai_goi === 'Social';
    const isAddon = pkg.is_addon === true || pkg.requires_base_package === true;
    
    const cycleDays = parseInt(pkg.chu_ky_ngay) || 30;
    const price = pkg.gia;
    
    let priceLevel = 'medium';
    if (pkg.phan_khuc_gia === 'Gia_re' || price < 50000) priceLevel = 'cheap';
    else if (pkg.phan_khuc_gia === 'Cao_cap' || price >= 200000) priceLevel = 'expensive';
    
    let dataLevel = 'none';
    if (hasData) {
      const text = (pkg.data_theo_ngay || '' + pkg.dulieu || '').toLowerCase();
      if (text.includes('không giới hạn') || text.includes('unlimited') || text.includes('kgh') || dailyGb >= 5) {
        dataLevel = 'unlimited';
      } else if (dailyGb >= 3) {
        dataLevel = 'high';
      } else if (dailyGb >= 1) {
        dataLevel = 'medium';
      } else {
        dataLevel = 'low';
      }
    }
    
    let voiceLevel = 'none';
    if (hasVoice) {
      const parseMins = (val) => {
        if (!val) return 0;
        const match = String(val).match(/(\d+)\s*(phút|phut|min)/i);
        return match ? parseInt(match[1]) : 0;
      };
      const mins = parseMins(pkg.free_noi_mang) + parseMins(pkg.free_ngoai_mang);
      if (mins >= 1000) voiceLevel = 'high';
      else if (mins >= 500) voiceLevel = 'medium';
      else voiceLevel = 'low';
    }
    
    let smsLevel = 'none';
    if (hasSms) {
      const parseSms = (val) => {
        if (!val) return 0;
        const match = String(val).match(/(\d+)\s*(sms|tin nhắn|tin nhan|message)/i);
        return match ? parseInt(match[1]) : 0;
      };
      const smsCount = parseSms(pkg.sms);
      smsLevel = smsCount >= 100 ? 'high' : 'low';
    }
    
    const searchableTags = [
      pkg.phan_khuc_gia,
      pkg.phan_loai_goi,
      pkg.loai_mang,
      pkg.service_group,
      pkg.benefit_group
    ].filter(Boolean).map(t => t.toLowerCase());

    await PackageFeature.findOneAndUpdate(
      { package_id: pkg.package_id },
      {
        package_id: pkg.package_id,
        ma_goi: pkg.ma_goi,
        has_data: hasData,
        has_voice: hasVoice,
        has_sms: hasSms,
        has_youtube: hasYoutube,
        has_tiktok: hasTiktok,
        has_facebook: hasFacebook,
        has_tv360: hasTv360,
        has_movie: hasMovie,
        has_social: hasSocial,
        has_5g: has5g,
        is_combo: isCombo,
        is_data_only: isDataOnly,
        is_social: isSocial,
        is_addon: isAddon,
        cycle_days: cycleDays,
        price,
        price_level: priceLevel,
        data_level: dataLevel,
        voice_level: voiceLevel,
        sms_level: smsLevel,
        searchable_tags: searchableTags
      },
      { upsert: true, returnDocument: 'after' }
    );
  }
  console.log(`Successfully synced ${packages.length} packages to package_features.`);
}

/**
 * Kiểm tra xem gói cước có đáp ứng tùy chọn riêng lẻ (single value) của câu hỏi hay không
 */
function matchSingleOption(pkg, field, value) {
  if (field === 'category') {
    if (value === 'DATA') return pkg.has_data === true;
    if (value === 'COMBO') return pkg.is_combo === true;
    if (value === 'VOICE') return pkg.has_voice === true;
    if (value === 'SMS') return pkg.has_sms === true;
    if (value === 'MXH') return pkg.has_social === true || pkg.is_social === true;
    if (value === 'APP') return pkg.has_tv360 === true || pkg.has_movie === true;
    if (value === 'ADDON') return pkg.is_addon === true;
    return true;
  }
  if (field === 'dataDemand') {
    if (value === 'none') return !pkg.has_data;
    if (value === 'low') return pkg.data_level === 'low';
    if (value === 'medium') return pkg.data_level === 'medium';
    if (value === 'high') return pkg.data_level === 'high';
    if (value === 'unlimited') return pkg.data_level === 'unlimited';
    return true;
  }
  if (field === 'voiceDemand') {
    if (value === 'none') return !pkg.has_voice;
    if (value === 'low') return pkg.voice_level === 'low' || pkg.voice_level === 'medium';
    if (value === 'high') return pkg.voice_level === 'high';
    return true;
  }
  if (field === 'smsDemand') {
    if (value === 'none') return !pkg.has_sms;
    if (value === 'sms') return pkg.has_sms;
    return true;
  }
  if (field === 'cycle') {
    if (value === 'short') return pkg.cycle_days < 15;
    if (value === 'monthly') return pkg.cycle_days >= 15 && pkg.cycle_days <= 30;
    if (value === 'long') return pkg.cycle_days > 30 && pkg.cycle_days < 360;
    if (value === 'yearly') return pkg.cycle_days >= 360;
    return true;
  }
  if (field === 'utilities') {
    if (value === 'any') return true;
    if (value === 'none') {
      return !pkg.has_tiktok && !pkg.has_youtube && !pkg.has_facebook && !pkg.has_tv360 && !pkg.has_movie;
    }
    if (value === 'TikTok') return pkg.has_tiktok === true;
    if (value === 'YouTube') return pkg.has_youtube === true;
    if (value === 'Facebook') return pkg.has_facebook === true;
    if (value === 'TV360') return pkg.has_tv360 === true;
    if (value === 'Movie') return pkg.has_movie === true;
    return true;
  }
  if (field === 'budget') {
    if (value === 'under_50') return pkg.price <= 50000;
    if (value === '50_100') return pkg.price > 50000 && pkg.price <= 100000;
    if (value === '100_200') return pkg.price > 100000 && pkg.price <= 200000;
    if (value === 'above_200') return pkg.price > 200000;
    if (value === 'any') return true;
    return true;
  }
  return true;
}

/**
 * Kiểm tra xem gói cước có khớp với câu trả lời (có thể là mảng lựa chọn) hay không
 */
function matchAnswer(pkg, field, answer) {
  if (answer === undefined || answer === null) return true;
  if (Array.isArray(answer)) {
    if (answer.includes('any')) return true;
    if (answer.includes('none')) {
      return !pkg.has_tiktok && !pkg.has_youtube && !pkg.has_facebook && !pkg.has_tv360 && !pkg.has_movie;
    }
    for (const val of answer) {
      if (!matchSingleOption(pkg, field, val)) {
        return false;
      }
    }
    return true;
  }
  return matchSingleOption(pkg, field, answer);
}

function areSubsetsEqual(sub1, sub2) {
  if (sub1.length !== sub2.length) return false;
  const ids1 = sub1.map(p => p.package_id).sort();
  const ids2 = sub2.map(p => p.package_id).sort();
  for (let i = 0; i < ids1.length; i++) {
    if (ids1[i] !== ids2[i]) return false;
  }
  return true;
}

function getValidQuestionMeta(questionMeta, currentRemaining) {
  const validOptions = [];
  const subsets = [];

  for (const opt of questionMeta.options) {
    const matchedPkgs = currentRemaining.filter(pkg => matchSingleOption(pkg, questionMeta.field, opt.value));
    if (matchedPkgs.length > 0) {
      // Kiểm tra trùng lặp tập kết quả với các tùy chọn đã duyệt qua
      const isDuplicate = subsets.some(sub => areSubsetsEqual(sub, matchedPkgs));
      if (!isDuplicate) {
        validOptions.push(opt);
        subsets.push(matchedPkgs);
      }
    }
  }

  // Một câu hỏi hợp lệ khi và chỉ khi:
  // 1. Có từ 2 lựa chọn hợp lệ trở lên (cho ra tập package khác nhau)
  if (validOptions.length < 2) {
    return null;
  }

  // 2. Ít nhất một lựa chọn có khả năng lọc/thu hẹp tập package
  const canFilter = subsets.some(sub => sub.length < currentRemaining.length);
  if (!canFilter) {
    return null;
  }

  // Tính điểm phân loại (khả năng loại bỏ gói cước trung bình của câu hỏi)
  let totalRemovedFraction = 0;
  for (const sub of subsets) {
    totalRemovedFraction += (currentRemaining.length - sub.length) / currentRemaining.length;
  }
  const score = totalRemovedFraction / subsets.length;

  return {
    questionMeta: {
      ...questionMeta,
      options: validOptions.map(opt => ({ ...opt, disabled: false }))
    },
    score
  };
}

function buildSurveyTree(answers, allFeatures, configMap) {
  const activeQuestions = [];
  const unansweredFields = ['category', 'cycle', 'dataDemand', 'voiceDemand', 'smsDemand', 'utilities', 'budget'];
  let currentRemaining = [...allFeatures];
  let isEarlyTerminated = false;

  // 1. Câu hỏi đầu tiên luôn là Nhu cầu chính (category)
  const categoryMeta = configMap['category'];
  if (categoryMeta) {
    const validQ = getValidQuestionMeta(categoryMeta, currentRemaining);
    if (validQ) {
      activeQuestions.push(validQ.questionMeta);
    }
  }

  const categoryAns = answers && answers.category;
  if (!categoryAns) {
    return { activeQuestions, remainingPackages: currentRemaining, isEarlyTerminated: false };
  }

  // Áp dụng lựa chọn category
  currentRemaining = currentRemaining.filter(pkg => matchAnswer(pkg, 'category', categoryAns));
  const catIdx = unansweredFields.indexOf('category');
  if (catIdx > -1) unansweredFields.splice(catIdx, 1);

  // 2. Vòng lặp sinh động các câu hỏi tiếp theo dựa trên Decision Tree
  while (unansweredFields.length > 0) {
    if (currentRemaining.length <= 4) {
      isEarlyTerminated = true;
      break;
    }

    const candidates = [];
    for (const field of unansweredFields) {
      const qMeta = configMap[field];
      if (!qMeta) continue;

      const validQ = getValidQuestionMeta(qMeta, currentRemaining);
      if (validQ) {
        candidates.push({
          field,
          questionMeta: validQ.questionMeta,
          score: validQ.score
        });
      }
    }

    if (candidates.length === 0) {
      // Dừng do không còn câu hỏi nào có khả năng phân loại thêm
      isEarlyTerminated = true;
      break;
    }

    // Sắp xếp theo thứ tự ưu tiên: câu hỏi lọc được nhiều package nhất lên trước
    candidates.sort((a, b) => b.score - a.score);

    const best = candidates[0];
    const userAns = answers && answers[best.field];

    if (userAns !== undefined && userAns !== null && userAns !== '' && (!Array.isArray(userAns) || userAns.length > 0)) {
      // Câu hỏi này đã được trả lời
      activeQuestions.push(best.questionMeta);

      // Áp dụng bộ lọc của câu trả lời
      currentRemaining = currentRemaining.filter(pkg => matchAnswer(pkg, best.field, userAns));

      // Loại ra khỏi danh sách chưa trả lời
      const idx = unansweredFields.indexOf(best.field);
      if (idx > -1) unansweredFields.splice(idx, 1);
    } else {
      // Câu hỏi tốt nhất tiếp theo chưa trả lời -> Add vào wizard list và DỪNG để chờ user chọn
      activeQuestions.push(best.questionMeta);
      break;
    }
  }

  return {
    activeQuestions,
    remainingPackages: currentRemaining,
    isEarlyTerminated
  };
}

const surveyService = {
  getSurveyConfig: async (answers = null, user = null) => {
    const allPackages = await getPackageContext();
    const visiblePackages = allPackages.filter(pkg => {
      const mapped = mapToEnglish(pkg);
      return canViewPackage(user, mapped);
    });
    const visibleIds = visiblePackages.map(pkg => pkg.package_id || pkg.id);
    const allFeatures = await PackageFeature.find({ package_id: { $in: visibleIds } });

    const activeAnswers = answers || {};

    const rawConfigs = await SurveyConfig.find().sort({ order: 1 });
    const configMap = {};
    for (const conf of rawConfigs) {
      configMap[conf.field] = conf.toObject();
    }

    const { activeQuestions } = buildSurveyTree(activeAnswers, allFeatures, configMap);
    return activeQuestions;
  },

  submitSurveyAnswers: async (userId, answers) => {
    const userObj = userId ? await Account.findOne({ user_id: userId }) : null;
    const allPackages = await getPackageContext();
    const visiblePackages = allPackages.filter(pkg => {
      const mapped = mapToEnglish(pkg);
      return canViewPackage(userObj, mapped);
    });
    const visibleIds = visiblePackages.map(pkg => pkg.package_id || pkg.id);
    const allFeatures = await PackageFeature.find({ package_id: { $in: visibleIds } });

    const rawConfigs = await SurveyConfig.find().sort({ order: 1 });
    const configMap = {};
    for (const conf of rawConfigs) {
      configMap[conf.field] = conf.toObject();
    }

    const { remainingPackages, isEarlyTerminated } = buildSurveyTree(answers, allFeatures, configMap);

    remainingPackages.sort((a, b) => a.price - b.price);

    const matchedPackages = [];
    for (const feat of remainingPackages) {
      const pkg = await Package.findOne({ package_id: feat.package_id });
      if (pkg) {
        matchedPackages.push(pkg);
      }
    }

    const mappedPackages = matchedPackages.map(pkg => mapToEnglish(pkg));

    let surveyHistory;
    if (userId) {
      surveyHistory = await SurveyHistory.findOneAndUpdate(
        { userId },
        {
          userId,
          answers,
          filters: {},
          recommendedPackages: mappedPackages,
          deleted: false,
          deletedAt: null,
          isEarlyTerminated
        },
        { upsert: true, returnDocument: 'after' }
      );
    } else {
      surveyHistory = await SurveyHistory.create({
        answers,
        filters: {},
        recommendedPackages: mappedPackages,
        deleted: false,
        deletedAt: null,
        isEarlyTerminated
      });
    }

    return {
      surveyHistory,
      packages: mappedPackages
    };
  },

  getSurveyHistory: async (userId) => {
    const history = await SurveyHistory.findOne({ userId, deleted: { $ne: true } });
    if (!history) {
      return null;
    }
    return {
      history,
      packages: history.recommendedPackages || []
    };
  },

  deleteSurveyHistory: async (userId) => {
    const result = await SurveyHistory.updateOne(
      { userId, deleted: { $ne: true } },
      {
        $set: {
          deleted: true,
          deletedAt: new Date()
        }
      }
    );
    return result.modifiedCount > 0;
  },

  checkAndSeedSurveyConfigs: async () => {
    try {
      await syncPackageFeatures();
    } catch (err) {
      console.error("Auto-sync package features failed:", err);
    }

    console.log("Seeding default Survey Configurations into database...");
    await SurveyConfig.deleteMany({});

    const defaultConfigs = [
      {
        title: "Nhu cầu chính",
        description: "Lựa chọn loại dịch vụ phù hợp với nhu cầu chính của bạn",
        field: "category",
        component: "single-choice",
        order: 1,
        multiple: false,
        options: [
          { label: "Gói cước chỉ có Data di động", value: "DATA", detail: "Chỉ lướt web, không cần gọi thoại miễn phí" },
          { label: "Gói cước Combo (Cả Data và Thoại)", value: "COMBO", detail: "Combo đầy đủ data dung lượng cao và thoại miễn phí" },
          { label: "Gói cước chuyên đàm thoại", value: "VOICE", detail: "Chỉ đàm thoại, không có dung lượng data" },
          { label: "Gói cước tin nhắn SMS", value: "SMS", detail: "Chuyên gửi tin nhắn SMS truyền thống" },
          { label: "Gói cước chuyên biệt Mạng xã hội", value: "MXH", detail: "Tập trung truy cập Facebook, TikTok, YouTube" },
          { label: "Gói cước Tiện ích / Ứng dụng", value: "APP", detail: "Xem truyền hình TV360, xem phim giải trí" },
          { label: "Gói cước mua thêm (Add-on)", value: "ADDON", detail: "Gói cước mua thêm song song với gói chính" }
        ]
      },
      {
        title: "Dung lượng Data",
        description: "Nhu cầu truy cập Internet, lướt web hàng ngày của bạn",
        field: "dataDemand",
        component: "single-choice",
        order: 2,
        multiple: false,
        options: [
          { label: "Không dùng Data di động", value: "none", detail: "Chỉ dùng Wi-Fi ở nhà hoặc nơi làm việc" },
          { label: "Dùng ít (Dưới 1 GB/ngày)", value: "low", detail: "Chỉ đọc tin nhắn, tin tức cơ bản khi ra ngoài" },
          { label: "Trung bình (1 - 3 GB/ngày)", value: "medium", detail: "Lướt web, nghe nhạc, mạng xã hội liên tục" },
          { label: "Nhiều (Từ 3 - 5 GB/ngày)", value: "high", detail: "Xem video HD, livestream, làm việc di động nhiều" },
          { label: "Không giới hạn dung lượng", value: "unlimited", detail: "Tốc độ cao nhất để chơi game, download lớn" }
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
          { label: "Sử dụng ngắn hạn (Gói ngày/tuần)", value: "short", detail: "Chu kỳ cước dưới 15 ngày" },
          { label: "Sử dụng tháng (30 ngày)", value: "monthly", detail: "Chu kỳ cước phổ thông 30 ngày" },
          { label: "Sử dụng dài hạn (3 - 6 tháng)", value: "long", detail: "Chu kỳ cước từ 90 đến 180 ngày" },
          { label: "Sử dụng chu kỳ năm (12 tháng)", value: "yearly", detail: "Tiết kiệm chi phí, không lo quên nạp tiền gia hạn" }
        ]
      },
      {
        title: "Gọi thoại miễn phí",
        description: "Nhu cầu đàm thoại, gọi điện nội/ngoại mạng của bạn",
        field: "voiceDemand",
        component: "single-choice",
        order: 4,
        multiple: false,
        options: [
          { label: "Không gọi nhiều", value: "none", detail: "Chủ yếu liên lạc online qua MXH" },
          { label: "Gọi ít (Dưới 500 phút)", value: "low", detail: "Liên hệ ngắn công việc hoặc gia đình" },
          { label: "Gọi nhiều (Trên 1000 phút)", value: "high", detail: "Tần suất gọi cao, bán hàng, CSKH" }
        ]
      },
      {
        title: "Ưu đãi tin nhắn SMS",
        description: "Nhu cầu sử dụng tin nhắn SMS nội mạng và ngoại mạng",
        field: "smsDemand",
        component: "single-choice",
        order: 5,
        multiple: false,
        options: [
          { label: "Không cần nhắn tin SMS", value: "none", detail: "Chủ yếu liên lạc qua ứng dụng OTT" },
          { label: "Cần miễn phí nhắn tin SMS", value: "sms", detail: "Thường xuyên gửi tin nhắn SMS truyền thống" }
        ]
      },
      {
        title: "Mạng xã hội và Tiện ích miễn phí",
        description: "Lựa chọn các ứng dụng bạn muốn được miễn cước data 100%",
        field: "utilities",
        component: "multi-choice",
        order: 6,
        multiple: true,
        options: [
          { label: "TikTok", value: "TikTok", detail: "Miễn phí 100% dung lượng TikTok" },
          { label: "YouTube", value: "YouTube", detail: "Miễn phí 100% dung lượng YouTube" },
          { label: "Facebook", value: "Facebook", detail: "Miễn phí 100% dung lượng Facebook" },
          { label: "TV360", value: "TV360", detail: "Xem TV di động trực tuyến trên TV360" },
          { label: "Xem phim giải trí", value: "Movie", detail: "Truy cập các ứng dụng xem phim giải trí" },
          { label: "Tiện ích nào cũng được", value: "any", detail: "Không giới hạn lựa chọn các tiện ích" },
          { label: "Không có nhu cầu tiện ích", value: "none", detail: "Ưu tiên các gói không kèm tiện ích để tối ưu chi phí" }
        ]
      },
      {
        title: "Ngân sách cước phí",
        description: "Mức chi phí tối đa bạn muốn bỏ ra hàng tháng",
        field: "budget",
        component: "single-choice",
        order: 7,
        multiple: false,
        options: [
          { label: "Dưới 50.000đ / tháng", value: "under_50", detail: "Nhu cầu nghe gọi hoặc data cơ bản" },
          { label: "Từ 50.000đ - 100.000đ / tháng", value: "50_100", detail: "Tiết kiệm, có lướt web & mạng xã hội" },
          { label: "Từ 100.000đ - 200.000đ / tháng", value: "100_200", detail: "Combo thoại thoải mái và dung lượng lớn" },
          { label: "Trên 200.000đ / tháng", value: "above_200", detail: "Nhu cầu đàm thoại VIP và không giới hạn" },
          { label: "Mức ngân sách nào cũng được", value: "any", detail: "Đặt hiệu năng và dung lượng lên hàng đầu" }
        ]
      }
    ];

    await SurveyConfig.insertMany(defaultConfigs);
    console.log("Successfully seeded default Survey Configurations.");
  }
};

SurveyHistory.collection.dropIndex('userId_1').catch(err => {
  // Bỏ qua
});

module.exports = surveyService;
