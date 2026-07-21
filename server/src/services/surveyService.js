const SurveyConfig = require('../models/SurveyConfig');
const SurveyHistory = require('../models/SurveyHistory');
const Package = require('../models/Package');
const Account = require('../models/Account');
const PackageFeature = require('../models/PackageFeature');
const { getPackageContext } = require('./chatbot/packageContext');
const { canViewPackage } = require('../utils/permission');
const { mapToEnglish } = require('../controllers/packageController');

/**
 * Tiện ích kiểm tra thông số gói cước thực tế từ CSDL
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
    (pkg.ten && regex.test(pkg.ten)) ||
    (pkg.noi_dung_ngoai && regex.test(pkg.noi_dung_ngoai)) ||
    (pkg.tienich && regex.test(pkg.tienich))
  );
}

/**
 * Đồng bộ hóa dữ liệu gói cước sang bảng PackageFeature
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
    const isSocial = ['YOUTUBE', 'TIKTOK', 'FACEBOOK', 'MOVIE', 'SOCIAL'].includes(pkg.benefit_group ? pkg.benefit_group.toUpperCase() : '') || pkg.phan_loai_goi === 'Social' || pkg.phan_loai_goi === 'MXH';
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
        sms_level: smsLevel
      },
      { upsert: true, returnDocument: 'after' }
    );
  }
}

/**
 * QUY TRÌNH 3 BƯỚC CỐ ĐỊNH BAN ĐẦU (FIXED BASE PHASES)
 */
const FIXED_QUESTIONS = {
  phan_loai_goi: {
    field: 'phan_loai_goi',
    title: 'Bước 1: Nhu cầu cốt lõi',
    description: 'Lựa chọn loại hình dịch vụ di động chính bạn muốn sử dụng',
    component: 'single-choice',
    options: [
      { label: 'Chỉ Data lướt web', value: 'Data', detail: 'Chỉ lướt web, học tập & làm việc di động' },
      { label: 'Combo (Data + Gọi thoại)', value: 'Combo', detail: 'Tích hợp cả Data dung lượng lớn và phút gọi miễn phí' },
      { label: 'Mạng xã hội & Tiện ích', value: 'MXH', detail: 'Tập trung ưu đãi cước TikTok, YouTube, Facebook, TV360' }
    ]
  },
  phan_khuc_gia: {
    field: 'phan_khuc_gia',
    title: 'Bước 2: Khoảng Ngân Sách',
    description: 'Lựa chọn mức cước phí hàng tháng phù hợp khả năng tài chính',
    component: 'single-choice',
    options: [
      { label: 'Giá rẻ (Dưới 50.000đ / tháng)', value: 'Gia_re', detail: 'Tiết kiệm chi phí cước hàng tháng tối đa' },
      { label: 'Trung bình (50.000đ - 150.000đ)', value: 'Trung_binh', detail: 'Phân khúc phổ biến nhất với nhiều ưu đãi hot' },
      { label: 'Cao cấp (Trên 150.000đ / tháng)', value: 'Cao_cap', detail: 'Nhu cầu cao, Data dung lượng lớn & đàm thoại thả ga' }
    ]
  },
  chu_ky_ngay: {
    field: 'chu_ky_ngay',
    title: 'Bước 3: Chu Kỳ Sử Dụng',
    description: 'Lựa chọn thời hạn chu kỳ cước gói cước bạn mong muốn',
    component: 'single-choice',
    options: [
      { label: 'Dùng theo Ngày/Tuần (<= 15 ngày)', value: 'short', detail: 'Gói cước ngắn hạn khi đi du lịch hoặc công tác' },
      { label: 'Theo Tháng (30 ngày)', value: 'monthly', detail: 'Chu kỳ cước phổ thông thanh toán từng tháng' },
      { label: 'Chu kỳ dài (>= 90 ngày)', value: 'long', detail: 'Chu kỳ đa tháng / năm tiết kiệm chi phí gia hạn' }
    ]
  }
};

/**
 * CÁC BƯỚC TỰ SINH ĐỘNG TỪ BƯỚC 4 TRỞ ĐI (DYNAMIC PHASES)
 */
const DYNAMIC_QUESTIONS = {
  tien_ich_free: {
    field: 'tien_ich_free',
    title: 'Ứng dụng thường dùng được miễn cước Data 100%',
    description: 'Lựa chọn ứng dụng bạn sử dụng thường xuyên nhất',
    component: 'single-choice',
    options: [
      { label: 'TikTok', value: 'TikTok', detail: 'Miễn phí 100% cước Data lướt video TikTok' },
      { label: 'YouTube', value: 'YouTube', detail: 'Miễn phí 100% cước Data xem video YouTube HD' },
      { label: 'Facebook', value: 'Facebook', detail: 'Miễn phí 100% cước Data Facebook & Messenger' },
      { label: 'TV360', value: 'TV360', detail: 'Xem phim & truyền hình trực tuyến TV360' }
    ]
  },
  loai_mang: {
    field: 'loai_mang',
    title: 'Hạ tầng mạng di động ưu tiên',
    description: 'Lựa chọn công nghệ mạng ưu tiên cho thiết bị',
    component: 'single-choice',
    options: [
      { label: 'Mạng 4G LTE', value: '4G', detail: 'Tốc độ cao phổ thông toàn quốc' },
      { label: 'Mạng 5G siêu tốc', value: '5G', detail: 'Tốc độ vượt trội trên hạ tầng 5G Viettel' }
    ]
  },
  free_noi_mang: {
    field: 'free_noi_mang',
    title: 'Nhu cầu gọi thoại miễn phí',
    description: 'Nhu cầu gọi điện liên lạc nội/ngoại mạng của bạn',
    component: 'single-choice',
    options: [
      { label: 'Không cần phút gọi miễn phí', value: 'none', detail: 'Chủ yếu liên lạc online qua các ứng dụng OTT' },
      { label: 'Cần miễn phí phút gọi thoại', value: 'voice', detail: 'Tần suất đàm thoại liên lạc thoại nhiều' }
    ]
  }
};

/**
 * Kiểm tra tiêu chí ánh xạ chính xác với CSDL goi_cuoc
 */
function matchPackageCriteria(pkg, feat, field, value) {
  if (!value) return true;

  if (field === 'phan_loai_goi') {
    if (value === 'Data') {
      return pkg.phan_loai_goi === 'Data' || feat.is_data_only || (feat.has_data && !feat.has_voice);
    }
    if (value === 'Combo') {
      return pkg.phan_loai_goi === 'Combo' || feat.is_combo || hasRealVoice(pkg) || (feat.has_data && feat.has_voice);
    }
    if (value === 'MXH') {
      return pkg.phan_loai_goi === 'Social' || pkg.phan_loai_goi === 'MXH' || (pkg.tien_ich_free && pkg.tien_ich_free !== '0') || feat.is_social || feat.has_social || feat.has_tiktok || feat.has_youtube || feat.has_facebook || feat.has_tv360;
    }
    return true;
  }

  if (field === 'phan_khuc_gia') {
    const price = pkg.gia;
    if (value === 'Gia_re') return price <= 50000 || pkg.phan_khuc_gia === 'Gia_re';
    if (value === 'Trung_binh') return (price > 50000 && price <= 150000) || pkg.phan_khuc_gia === 'Trung_binh';
    if (value === 'Cao_cap') return price > 150000 || pkg.phan_khuc_gia === 'Cao_cap';
    return true;
  }

  if (field === 'chu_ky_ngay') {
    const days = parseInt(pkg.chu_ky_ngay) || feat.cycle_days || 30;
    if (value === 'short') return days <= 15;
    if (value === 'monthly') return days === 30 || (days > 15 && days <= 30);
    if (value === 'long') return days >= 90;
    return true;
  }

  if (field === 'tien_ich_free') {
    if (value === 'TikTok') return feat.has_tiktok || checkKeyword(pkg, 'tiktok');
    if (value === 'YouTube') return feat.has_youtube || checkKeyword(pkg, 'youtube');
    if (value === 'Facebook') return feat.has_facebook || checkKeyword(pkg, 'facebook');
    if (value === 'TV360') return feat.has_tv360 || checkKeyword(pkg, 'tv360');
    return true;
  }

  if (field === 'loai_mang') {
    const loai = (pkg.loai_mang || '').toUpperCase();
    if (value === '5G') return feat.has_5g || loai.includes('5G');
    if (value === '4G') return !loai.includes('5G') || loai.includes('4G') || loai.includes('LTE');
    return true;
  }

  if (field === 'free_noi_mang') {
    if (value === 'none') return !hasRealVoice(pkg);
      if (value === 'voice') return hasRealVoice(pkg);
    return true;
  }

  return true;
}

/**
 * Lọc danh sách gói cước thỏa mãn các tiêu chí trong answers
 */
function filterCurrentPackages(allPackages, allFeaturesMap, answers) {
  return allPackages.filter(pkg => {
    const feat = allFeaturesMap[pkg.package_id || pkg.id] || {};
    for (const [field, value] of Object.entries(answers || {})) {
      if (value && !matchPackageCriteria(pkg, feat, field, value)) {
        return false;
      }
    }
    return true;
  });
}

function getSmartFallbackPackages(visiblePackages, allFeaturesMap, answers) {
  const fallbackList = [];
  const addedIds = new Set();

  const answersNoCycle = { ...answers };
  delete answersNoCycle.chu_ky_ngay;
  const matchNoCycle = filterCurrentPackages(visiblePackages, allFeaturesMap, answersNoCycle);
  matchNoCycle.sort((a, b) => a.gia - b.gia);

  for (const pkg of matchNoCycle) {
    const id = pkg.package_id || pkg.id;
    if (!addedIds.has(id)) {
      const mapped = mapToEnglish(pkg);
      fallbackList.push(mapped);
      addedIds.add(id);
      if (fallbackList.length >= 1) break;
    }
  }

  const answersNoPrice = { ...answers };
  delete answersNoPrice.phan_khuc_gia;
  const matchNoPrice = filterCurrentPackages(visiblePackages, allFeaturesMap, answersNoPrice);
  matchNoPrice.sort((a, b) => Math.abs(a.gia - 100000) - Math.abs(b.gia - 100000));

  for (const pkg of matchNoPrice) {
    const id = pkg.package_id || pkg.id;
    if (!addedIds.has(id)) {
      const mapped = mapToEnglish(pkg);
      fallbackList.push(mapped);
      addedIds.add(id);
      if (fallbackList.length >= 2) break;
    }
  }

  const answersOnlyCat = { phan_loai_goi: answers.phan_loai_goi };
  const matchCatOnly = filterCurrentPackages(visiblePackages, allFeaturesMap, answersOnlyCat);
  matchCatOnly.sort((a, b) => a.gia - b.gia);

  for (const pkg of matchCatOnly) {
    const id = pkg.package_id || pkg.id;
    if (!addedIds.has(id)) {
      const mapped = mapToEnglish(pkg);
      fallbackList.push(mapped);
      addedIds.add(id);
      if (fallbackList.length >= 3) break;
    }
  }

  if (fallbackList.length < 3) {
    for (const pkg of visiblePackages) {
      const id = pkg.package_id || pkg.id;
      if (!addedIds.has(id)) {
        const mapped = mapToEnglish(pkg);
        fallbackList.push(mapped);
        addedIds.add(id);
        if (fallbackList.length >= 3) break;
      }
    }
  }

  return fallbackList.slice(0, 3);
}

/**
 * TỰ SINH BƯỚC ĐỘNG TỪ BƯỚC 4 (ĐẢM BẢO KHÔNG LẶP LẠI TRƯỜNG ĐÃ HỎI)
 */
function generateNextDynamicQuestion(currentPackages, allFeaturesMap, answeredFields) {
  const dynamicCandidateKeys = ['tien_ich_free', 'loai_mang', 'free_noi_mang'];
  const unansweredKeys = dynamicCandidateKeys.filter(k => !answeredFields.includes(k));

  let bestQuestion = null;
  let bestScore = -1;

  for (const key of unansweredKeys) {
    const def = DYNAMIC_QUESTIONS[key];
    if (!def) continue;

    const validOptions = [];
    const optionCounts = [];

    for (const opt of def.options) {
      const matched = currentPackages.filter(pkg => {
        const feat = allFeaturesMap[pkg.package_id || pkg.id] || {};
        return matchPackageCriteria(pkg, feat, key, opt.value);
      });

      if (matched.length > 0) {
        validOptions.push({
          ...opt,
          count: matched.length,
          detail: `${opt.detail} (${matched.length} gói cước)`
        });
        optionCounts.push(matched.length);
      }
    }

    if (validOptions.length >= 2) {
      let totalEliminated = 0;
      for (const count of optionCounts) {
        totalEliminated += (currentPackages.length - count);
      }
      const score = totalEliminated / optionCounts.length;

      if (score > bestScore) {
        bestScore = score;
        bestQuestion = {
          ...def,
          options: validOptions
        };
      }
    }
  }

  return bestQuestion;
}

const surveyService = {
  /**
   * Hybrid Adaptive Decision Tree Engine + Immediate Early Exit at Every Step
   */
  evaluateState: async (user, answers = {}) => {
    const allPackages = await getPackageContext();
    const visiblePackages = allPackages.filter(pkg => {
      const mapped = mapToEnglish(pkg);
      return canViewPackage(user, mapped);
    });

    const visibleIds = visiblePackages.map(pkg => pkg.package_id || pkg.id);
    const featuresList = await PackageFeature.find({ package_id: { $in: visibleIds } });

    const allFeaturesMap = {};
    featuresList.forEach(feat => {
      allFeaturesMap[feat.package_id] = feat;
    });

    const answeredFields = Object.keys(answers).filter(k => answers[k] !== undefined && answers[k] !== null && answers[k] !== '');
    const currentPackages = filterCurrentPackages(visiblePackages, allFeaturesMap, answers);
    currentPackages.sort((a, b) => a.gia - b.gia);

    // KÍCH HOẠT KIỂM TRA DỪNG SỚM / SMART FALLBACK TỨC THÌ
    if (answeredFields.length > 0) {
      if (currentPackages.length === 0) {
        const fallbackPkgs = getSmartFallbackPackages(visiblePackages, allFeaturesMap, answers);
        return {
          isCompleted: true,
          status: 'SMART_FALLBACK',
          message: 'Không có gói cước thỏa mãn 100% tất cả tiêu chí. Hệ thống đã tự động chọn các gói cước gần nhất với nhu cầu.',
          packages: fallbackPkgs,
          nextQuestion: null,
          remainingCount: fallbackPkgs.length,
          currentStepNum: answeredFields.length
        };
      }

      if (currentPackages.length <= 3) {
        const mappedPkgs = currentPackages.map(pkg => mapToEnglish(pkg));

        return {
          isCompleted: true,
          status: 'EXACT_MATCH',
          message: `⚡ Đã khoanh vùng được ${currentPackages.length} gói cước phù hợp nhất!`,
          packages: mappedPkgs,
          nextQuestion: null,
          remainingCount: currentPackages.length,
          currentStepNum: answeredFields.length
        };
      }
    }

    if (!answers.phan_loai_goi) {
      return {
        isCompleted: false,
        currentStepNum: 1,
        totalFixedSteps: 3,
        isDynamicPhase: false,
        nextQuestion: FIXED_QUESTIONS.phan_loai_goi,
        remainingCount: visiblePackages.length,
        answeredFields: []
      };
    }

    if (!answers.phan_khuc_gia) {
      return {
        isCompleted: false,
        currentStepNum: 2,
        totalFixedSteps: 3,
        isDynamicPhase: false,
        nextQuestion: FIXED_QUESTIONS.phan_khuc_gia,
        remainingCount: currentPackages.length,
        answeredFields: ['phan_loai_goi']
      };
    }

    if (!answers.chu_ky_ngay) {
      return {
        isCompleted: false,
        currentStepNum: 3,
        totalFixedSteps: 3,
        isDynamicPhase: false,
        nextQuestion: FIXED_QUESTIONS.chu_ky_ngay,
        remainingCount: currentPackages.length,
        answeredFields: ['phan_loai_goi', 'phan_khuc_gia']
      };
    }

    const dynamicNextQuestion = generateNextDynamicQuestion(currentPackages, allFeaturesMap, answeredFields);

    if (!dynamicNextQuestion) {
      const mappedPkgs = currentPackages.map(pkg => mapToEnglish(pkg));

      return {
        isCompleted: true,
        status: 'EXACT_MATCH',
        message: '✨ Đã hiển thị toàn bộ các gói cước đáp ứng tiêu chí lọc!',
        packages: mappedPkgs,
        nextQuestion: null,
        remainingCount: currentPackages.length,
        currentStepNum: answeredFields.length
      };
    }

    return {
      isCompleted: false,
      currentStepNum: answeredFields.length + 1,
      totalFixedSteps: 3,
      isDynamicPhase: true,
      nextQuestion: dynamicNextQuestion,
      remainingCount: currentPackages.length,
      answeredFields
    };
  },

  submitSurveyAnswers: async (userId, answers) => {
    const userObj = userId ? await Account.findOne({ user_id: userId }) : null;
    const result = await surveyService.evaluateState(userObj, answers);

    let surveyHistory = null;
    // CHỈ LƯU VÀO CSDL KHI KHẢO SÁT ĐÃ HOÀN THÀNH KẾT QUẢ (isCompleted === true) VÀ LÀ USER ĐÃ ĐĂNG NHẬP
    if (result.isCompleted && userId) {
      surveyHistory = await SurveyHistory.create({
        userId,
        answers,
        filters: { isCompleted: result.isCompleted, remainingCount: result.remainingCount },
        recommendedPackages: result.packages || [],
        deleted: false,
        deletedAt: null,
        isEarlyTerminated: result.remainingCount <= 3
      });
    }

    return {
      ...result,
      surveyHistory
    };
  },

  getSurveyHistory: async (userId) => {
    const history = await SurveyHistory.findOne({ userId, deleted: { $ne: true } }).sort({ createdAt: -1 });
    if (!history) {
      return null;
    }
    return {
      history,
      packages: history.recommendedPackages || []
    };
  },

  deleteSurveyHistory: async (userId) => {
    const result = await SurveyHistory.updateMany(
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
    console.log("Successfully seeded default Survey Configurations.");
  }
};

SurveyHistory.collection.dropIndex('userId_1').catch(err => {
  // Bỏ qua
});

module.exports = surveyService;
