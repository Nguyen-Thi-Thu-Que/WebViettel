import type { Package } from '../types';

// Helper: Parse data limit from string to GB per day
export const parseDataPerDay = (pkg: Package): number => {
  const str = pkg.data_theo_ngay;
  if (!str || str === '0') return 0;
  const lower = str.toLowerCase();
  
  // Extract numeric value
  const match = lower.replace(',', '.').match(/(\d+(\.\d+)?)/);
  if (!match) return 0;
  let val = parseFloat(match[1]);
  
  if (lower.includes('mb')) {
    val = val / 1024;
  }
  
  // If it's a daily limit (e.g. 1 GB/ngày, 2GB/ngay, 1.5GB/ngày)
  if (lower.includes('ngày') || lower.includes('ngay') || lower.includes('/ngày') || lower.includes('/ngay')) {
    return val;
  }
  
  // If it's a total cycle limit (e.g. 60 GB / 30 days)
  const durationDays = parseInt(pkg.chu_ky_ngay, 10) || 30;
  return durationDays > 0 ? val / durationDays : val;
};

// Helper: Parse talk minutes to number
export const parseMinutes = (str: string): number => {
  if (!str || str === '0' || str.toLowerCase() === 'không hỗ trợ' || str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined' || str.trim() === '') {
    return 0;
  }
  const lower = str.toLowerCase();
  if (lower.includes('không giới hạn') || lower.includes('miễn phí cuộc gọi') || lower.includes('miễn phí các cuộc gọi')) {
    return 1000; // Large number for unlimited
  }
  const match = lower.match(/(\d+)\s*phút/);
  return match ? parseInt(match[1], 10) : 0;
};

// Helper: Parse SMS count to number
export const parseSms = (str: string): number => {
  if (!str || str === '0' || str.toLowerCase() === 'không hỗ trợ' || str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined' || str.trim() === '') {
    return 0;
  }
  const lower = str.toLowerCase();
  const match = lower.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
};

// Helper: Count package utilities
export const getUtilitiesCount = (pkg: Package): number => {
  let count = 0;
  if (pkg.has_youtube) count++;
  if (pkg.has_tiktok) count++;
  if (pkg.has_facebook) count++;
  if (pkg.has_tv360) count++;
  
  const countFromCsv = (str?: string) => {
    if (!str || str === '0' || str.toLowerCase() === 'không hỗ trợ' || str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined') return 0;
    return str.split(',').map(s => s.trim()).filter(Boolean).length;
  };

  count += countFromCsv(pkg.tien_ich_free);
  count += countFromCsv(pkg.noi_dung_ngoai);
  count += countFromCsv(pkg.tienich);
  return count;
};

// Helper: Check if string value is valid
export const isValidString = (val: any): boolean => {
  if (val === null || val === undefined) return false;
  if (typeof val === 'string') {
    const clean = val.trim().toLowerCase();
    return clean !== '' && clean !== '0' && clean !== 'không hỗ trợ' && clean !== 'null' && clean !== 'undefined' && clean !== 'không có';
  }
  if (typeof val === 'number') {
    return val !== 0;
  }
  if (typeof val === 'boolean') {
    return val;
  }
  return true;
};

export interface AIAnalysisResult {
  paragraphs: string[];
  recommendedPackage: Package;
  recommendationReasons: string[];
  insights: {
    type: string;
    label: string;
    icon: string;
    packageName: string;
    pkgId: string;
  }[];
  bestTags: {
    [packageId: string]: {
      isCheapest?: boolean;
      isMaxData?: boolean;
      isMaxVoice?: boolean;
      isMaxSms?: boolean;
      isLongestCycle?: boolean;
    };
  };
}

export const compareAIService = {
  analyzePackages: (list: Package[]): AIAnalysisResult => {
    if (!list || list.length < 2) {
      throw new Error('AI Analysis requires at least 2 packages.');
    }

    // 1. Calculate best criteria packages
    // 1.1 Cheapest package
    const sortedByPrice = [...list].sort((a, b) => a.gia - b.gia);
    const cheapestPkg = sortedByPrice[0];
    const minGia = cheapestPkg.gia;

    // 1.2 Max Data package
    const sortedByData = [...list].sort((a, b) => parseDataPerDay(b) - parseDataPerDay(a));
    const maxDataPkg = sortedByData[0];
    const maxDataVal = parseDataPerDay(maxDataPkg);

    // 1.3 Max Voice package (combining internal + external)
    const getVoiceTotal = (p: Package) => parseMinutes(p.free_noi_mang) + parseMinutes(p.free_ngoai_mang);
    const sortedByVoice = [...list].sort((a, b) => getVoiceTotal(b) - getVoiceTotal(a));
    const maxVoicePkg = sortedByVoice[0];
    const maxVoiceVal = getVoiceTotal(maxVoicePkg);

    // 1.4 SMS package
    const getSmsVal = (p: Package) => parseSms(p.sms);
    const sortedBySms = [...list].sort((a, b) => getSmsVal(b) - getSmsVal(a));
    const maxSmsPkg = sortedBySms[0];
    const maxSmsVal = getSmsVal(maxSmsPkg);


    // 1.6 Longest Cycle package
    const getCycleDays = (p: Package) => parseInt(p.chu_ky_ngay, 10) || 0;
    const sortedByCycle = [...list].sort((a, b) => getCycleDays(b) - getCycleDays(a));
    const longestCyclePkg = sortedByCycle[0];
    const longestCycleVal = getCycleDays(longestCyclePkg);

    // 2. Identify Packages that match specific apps
    const tv360Pkgs = list.filter(p => p.has_tv360 || (p.tien_ich_free && p.tien_ich_free.toLowerCase().includes('tv360')) || (p.tienich && p.tienich.toLowerCase().includes('tv360')));
    const youtubePkgs = list.filter(p => p.has_youtube || (p.tien_ich_free && p.tien_ich_free.toLowerCase().includes('youtube')) || (p.tienich && p.tienich.toLowerCase().includes('youtube')));
    const tiktokPkgs = list.filter(p => p.has_tiktok || (p.tien_ich_free && p.tien_ich_free.toLowerCase().includes('tiktok')) || (p.tienich && p.tienich.toLowerCase().includes('tiktok')));
    const facebookPkgs = list.filter(p => p.has_facebook || (p.tien_ich_free && p.tien_ich_free.toLowerCase().includes('facebook')) || (p.tienich && p.tienich.toLowerCase().includes('facebook')));

    // 3. Formulate Insights List
    const insights: AIAnalysisResult['insights'] = [];
    if (minGia > 0) {
      insights.push({
        type: 'cheapest',
        label: 'Rẻ nhất',
        icon: '💰',
        packageName: cheapestPkg.ten,
        pkgId: cheapestPkg.id
      });
    }
    if (maxDataVal > 0) {
      insights.push({
        type: 'max_data',
        label: 'Data nhiều nhất',
        icon: '📶',
        packageName: maxDataPkg.ten,
        pkgId: maxDataPkg.id
      });
    }
    if (tv360Pkgs.length > 0) {
      insights.push({
        type: 'tv360',
        label: 'Có TV360',
        icon: '📺',
        packageName: tv360Pkgs[0].ten,
        pkgId: tv360Pkgs[0].id
      });
    }
    if (youtubePkgs.length > 0) {
      insights.push({
        type: 'youtube',
        label: 'Có Youtube',
        icon: '🎬',
        packageName: youtubePkgs[0].ten,
        pkgId: youtubePkgs[0].id
      });
    }
    if (tiktokPkgs.length > 0) {
      insights.push({
        type: 'tiktok',
        label: 'Có TikTok',
        icon: '🎵',
        packageName: tiktokPkgs[0].ten,
        pkgId: tiktokPkgs[0].id
      });
    }
    if (facebookPkgs.length > 0) {
      insights.push({
        type: 'facebook',
        label: 'Có Facebook',
        icon: '📱',
        packageName: facebookPkgs[0].ten,
        pkgId: facebookPkgs[0].id
      });
    }
    if (maxVoiceVal > 0) {
      insights.push({
        type: 'max_voice',
        label: 'Nhiều thoại',
        icon: '☎️',
        packageName: maxVoicePkg.ten,
        pkgId: maxVoicePkg.id
      });
    }
    if (maxSmsVal > 0) {
      insights.push({
        type: 'has_sms',
        label: 'Có SMS',
        icon: '✉️',
        packageName: maxSmsPkg.ten,
        pkgId: maxSmsPkg.id
      });
    }
    if (longestCycleVal > 30) {
      insights.push({
        type: 'longest_cycle',
        label: 'Chu kỳ dài',
        icon: '⏳',
        packageName: longestCyclePkg.ten,
        pkgId: longestCyclePkg.id
      });
    }

    // 4. Formulate Best Tags for Comparison Grid
    const bestTags: AIAnalysisResult['bestTags'] = {};
    list.forEach(p => {
      bestTags[p.id] = {};
      if (p.gia === minGia) {
        bestTags[p.id].isCheapest = true;
      }
      if (maxDataVal > 0 && parseDataPerDay(p) === maxDataVal) {
        bestTags[p.id].isMaxData = true;
      }
      if (maxVoiceVal > 0 && getVoiceTotal(p) === maxVoiceVal) {
        bestTags[p.id].isMaxVoice = true;
      }
      if (maxSmsVal > 0 && getSmsVal(p) === maxSmsVal) {
        bestTags[p.id].isMaxSms = true;
      }
      if (longestCycleVal > 30 && getCycleDays(p) === longestCycleVal) {
        bestTags[p.id].isLongestCycle = true;
      }
    });

    // 5. Select Recommended Package via Scoring System
    const scorePackage = (pkg: Package): number => {
      let score = 0;
      
      // 5.1 Price score (inverse proportion)
      const maxPrice = Math.max(...list.map(p => p.gia));
      const minPrice = Math.min(...list.map(p => p.gia));
      if (maxPrice !== minPrice) {
        score += ((maxPrice - pkg.gia) / (maxPrice - minPrice)) * 3.5;
      } else {
        score += 2;
      }
      
      // 5.2 Data score
      const dataPerDay = parseDataPerDay(pkg);
      const maxData = Math.max(...list.map(p => parseDataPerDay(p)));
      if (maxData > 0) {
        score += (dataPerDay / maxData) * 4.5;
      }
      
      // 5.3 Voice score
      const voiceMins = getVoiceTotal(pkg);
      const maxVoice = Math.max(...list.map(p => getVoiceTotal(p)));
      if (maxVoice > 0) {
        score += (voiceMins / maxVoice) * 3;
      }
      
      // 5.4 Utilities score
      const utilsCount = getUtilitiesCount(pkg);
      const maxUtils = Math.max(...list.map(p => getUtilitiesCount(p)));
      if (maxUtils > 0) {
        score += (utilsCount / maxUtils) * 2.5;
      }
      
      // 5.5 Hot status priority
      if (pkg.dohot === 'Hot') {
        score += 1.5;
      }
      
      return score;
    };

    const scoredPackages = list.map(pkg => ({
      pkg,
      score: scorePackage(pkg)
    })).sort((a, b) => b.score - a.score);

    const recommendedPackage = scoredPackages[0].pkg;

    // Determine reasons for recommended package
    const recommendationReasons: string[] = [];
    if (recommendedPackage.gia === minGia) {
      recommendationReasons.push('Giá cước tiết kiệm nhất trong các gói so sánh');
    } else if (recommendedPackage.gia <= 120000) {
      recommendationReasons.push('Mức giá cước hợp lý và vừa vặn túi tiền');
    }

    const recDataVal = parseDataPerDay(recommendedPackage);
    if (recDataVal === maxDataVal && maxDataVal > 0) {
      recommendationReasons.push(`Dung lượng data vượt trội với ${recommendedPackage.data_theo_ngay}`);
    } else if (recDataVal >= 1) {
      recommendationReasons.push(`Tích hợp dung lượng data thoải mái sử dụng hàng ngày (${recommendedPackage.data_theo_ngay})`);
    }

    if (recommendedPackage.has_tv360) {
      recommendationReasons.push('Miễn phí data xem truyền hình giải trí TV360');
    }
    if (recommendedPackage.has_youtube || recommendedPackage.has_tiktok || recommendedPackage.has_facebook) {
      const apps = [];
      if (recommendedPackage.has_youtube) apps.push('YouTube');
      if (recommendedPackage.has_tiktok) apps.push('TikTok');
      if (recommendedPackage.has_facebook) apps.push('Facebook');
      recommendationReasons.push(`Miễn phí data tốc độ cao cho các ứng dụng ${apps.join(', ')}`);
    }

    const recVoiceTotal = getVoiceTotal(recommendedPackage);
    if (recVoiceTotal === maxVoiceVal && maxVoiceVal > 0) {
      recommendationReasons.push('Ưu đãi gọi nội mạng và ngoại mạng miễn phí nhiều nhất');
    } else if (recVoiceTotal > 0) {
      recommendationReasons.push('Hỗ trợ nghe gọi miễn phí đáp ứng tốt nhu cầu liên lạc');
    }

    if (longestCycleVal > 30 && getCycleDays(recommendedPackage) === longestCycleVal) {
      recommendationReasons.push(`Chu kỳ sử dụng dài hạn lên tới ${recommendedPackage.chu_ky_ngay} ngày tiện lợi`);
    }

    // Keep between 2 and 4 reasons
    let cleanReasons = recommendationReasons.filter(Boolean);
    if (cleanReasons.length < 2) {
      cleanReasons.push('Đáp ứng toàn diện các tiêu chí sử dụng cơ bản hàng ngày');
      cleanReasons.push('Dễ dàng đăng ký và quản lý chu kỳ sử dụng linh hoạt');
    }
    if (cleanReasons.length > 4) {
      cleanReasons = cleanReasons.slice(0, 4);
    }

    // 6. Generate natural chatbot text (maximum 5 paragraphs, NO markdown)
    const paragraphs: string[] = [];

    // Paragraph 1: Intro
    const packageNames = list.map(p => p.ten).join(', ');
    paragraphs.push(
      `Chào bạn! Tôi là Viettel AI Advisor. Rất vui được hỗ trợ bạn so sánh chi tiết ${list.length} gói cước di động gồm ${packageNames}. Dựa trên các thông số kỹ thuật thực tế từ hệ thống dữ liệu, tôi xin đưa ra phân tích khách quan giúp bạn đưa ra lựa chọn sáng suốt nhất.`
    );

    // Paragraph 2: Cost Analysis
    if (cheapestPkg) {
      const formatPrice = new Intl.NumberFormat('vi-VN').format(cheapestPkg.gia);
      if (list.every(p => p.gia === minGia)) {
        paragraphs.push(
          `Về mặt chi phí, tất cả các gói cước trong danh sách so sánh đều có mức giá tương đương là ${formatPrice} đồng. Vì vậy, yếu tố quyết định lựa chọn của bạn sẽ phụ thuộc hoàn toàn vào lưu lượng data và các tiện ích liên lạc đi kèm.`
        );
      } else {
        paragraphs.push(
          `Xem xét khía cạnh tài chính, gói cước ${cheapestPkg.ten} hiện là lựa chọn kinh tế nhất với cước phí chỉ ${formatPrice} đồng cho mỗi chu kỳ sử dụng. Đây là phương án lý tưởng nếu bạn muốn tối ưu hóa chi phí hàng tháng mà vẫn duy trì kết nối di động ổn định.`
        );
      }
    }

    // Paragraph 3: Data & Apps Analysis
    if (maxDataVal > 0) {
      const dataDetails: string[] = [];
      list.forEach(p => {
        if (isValidString(p.data_theo_ngay)) {
          dataDetails.push(`gói ${p.ten} có ${p.data_theo_ngay}`);
        }
      });
      
      let dataText = `Đối với nhu cầu truy cập Internet di động, sự khác biệt giữa các gói cước thể hiện khá rõ rệt: ${dataDetails.join(', ')}. `;
      if (maxDataPkg) {
        dataText += `Trong đó, gói cước ${maxDataPkg.ten} dẫn đầu về dung lượng tốc độ cao, cực kỳ phù hợp cho những ai thường xuyên xem phim, chơi game trực tuyến hoặc làm việc di động cường độ cao.`;
      }
      paragraphs.push(dataText);
    }

    // Paragraph 4: Social / Utilities & Voice Analysis
    const socialDetails: string[] = [];
    list.forEach(p => {
      const apps = [];
      if (p.has_youtube) apps.push('YouTube');
      if (p.has_tiktok) apps.push('TikTok');
      if (p.has_facebook) apps.push('Facebook');
      if (p.has_tv360) apps.push('TV360');
      if (apps.length > 0) {
        socialDetails.push(`gói ${p.ten} miễn phí data cho ${apps.join(', ')}`);
      }
    });

    const voiceDetails: string[] = [];
    list.forEach(p => {
      const hasVoice = isValidString(p.free_noi_mang) || isValidString(p.free_ngoai_mang);
      if (hasVoice) {
        const details = [];
        if (isValidString(p.free_noi_mang)) details.push(`gọi nội mạng (${p.free_noi_mang})`);
        if (isValidString(p.free_ngoai_mang)) details.push(`gọi ngoại mạng (${p.free_ngoai_mang})`);
        voiceDetails.push(`gói ${p.ten} hỗ trợ ${details.join(' và ')}`);
      }
    });

    let utilityVoiceText = '';
    if (socialDetails.length > 0) {
      utilityVoiceText += `Bên cạnh data chính, các gói cước còn tích hợp thêm tiện ích giải trí đặc sắc. Cụ thể, ${socialDetails.join(', ')}. `;
    }
    if (voiceDetails.length > 0) {
      utilityVoiceText += `Nếu liên lạc là ưu tiên của bạn, ${voiceDetails.join(', ')}. `;
      if (maxVoicePkg && getVoiceTotal(maxVoicePkg) > 0) {
        utilityVoiceText += `Gói cước ${maxVoicePkg.ten} sẽ giúp bạn trò chuyện thoải mái nhất mà không sợ phát sinh hóa đơn phát sinh cuối tháng.`;
      }
    }
    
    if (utilityVoiceText.trim()) {
      paragraphs.push(utilityVoiceText.trim());
    }

    // Paragraph 5: Cycle duration & final suggestion
    if (longestCycleVal > 30) {
      paragraphs.push(
        `Cuối cùng, nếu bạn ngại việc phải gia hạn hoặc nạp tiền thuê bao hàng tháng, gói cước ${longestCyclePkg.ten} với thời gian sử dụng dài hạn lên tới ${longestCyclePkg.chu_ky_ngay} ngày là giải pháp tiện ích tối đa, giúp bạn an tâm trải nghiệm dịch vụ thông suốt trong suốt chu kỳ.`
      );
    } else {
      paragraphs.push(
        `Nhìn chung, việc lựa chọn gói cước tối ưu phụ thuộc sát sườn vào thói quen sử dụng hàng ngày của bạn. Hãy cân đối giữa mức cước phí sẵn sàng chi trả và nhu cầu thực tế về data hay thoại để đưa ra quyết định phù hợp nhất.`
      );
    }

    // Enforce maximum 5 paragraphs limit and make sure they do not have markdown format
    const cleanParagraphs = paragraphs
      .map(p => p.replace(/\*\*/g, '').replace(/\*/g, '').replace(/•/g, '').trim())
      .filter(Boolean)
      .slice(0, 5);

    return {
      paragraphs: cleanParagraphs,
      recommendedPackage,
      recommendationReasons: cleanReasons,
      insights,
      bestTags
    };
  }
};
