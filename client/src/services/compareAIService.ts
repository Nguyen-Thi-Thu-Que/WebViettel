import type { Package } from '../types';

// Helper: Parse data limit from string to GB per day
export const parseDataPerDay = (pkg: Package): number => {
  const str = pkg.data_theo_ngay;
  if (!str || str === '0') return 0;
  const lower = str.toLowerCase();

  // If unlimited data
  if (
    lower.includes('không giới hạn') ||
    lower.includes('unlimited') ||
    lower.includes('trọn gói') ||
    lower.includes('free data') ||
    pkg.uudaitrong?.toLowerCase().includes('không giới hạn dung lượng')
  ) {
    return 9999;
  }

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
    return 1000;
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

export interface AIAnalysisResult {
  title: string;
  summary: string;
  differences: string[];
  suggestion: string;
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

    const getVoiceTotal = (p: Package) => parseMinutes(p.free_noi_mang) + parseMinutes(p.free_ngoai_mang);
    const getCycleDays = (p: Package) => parseInt(p.chu_ky_ngay, 10) || 0;

    const minGia = Math.min(...list.map(p => p.gia));
    const maxDataVal = Math.max(...list.map(p => parseDataPerDay(p)));
    const maxVoiceVal = Math.max(...list.map(p => getVoiceTotal(p)));
    const maxSmsVal = Math.max(...list.map(p => parseSms(p.sms)));
    const maxCycleVal = Math.max(...list.map(p => getCycleDays(p)));

    const cheapestPkgs = list.filter(p => p.gia === minGia);
    const maxDataPkgs = list.filter(p => maxDataVal > 0 && parseDataPerDay(p) === maxDataVal);
    const maxVoicePkgs = list.filter(p => maxVoiceVal > 0 && getVoiceTotal(p) === maxVoiceVal);
    const tv360Pkgs = list.filter(p => p.has_tv360 || p.tien_ich_free?.toLowerCase().includes('tv360') || p.tienich?.toLowerCase().includes('tv360'));
    const tiktokPkgs = list.filter(p => p.has_tiktok || p.tien_ich_free?.toLowerCase().includes('tiktok') || p.tienich?.toLowerCase().includes('tiktok'));
    const facebookPkgs = list.filter(p => p.has_facebook || p.tien_ich_free?.toLowerCase().includes('facebook') || p.tienich?.toLowerCase().includes('facebook'));
    const youtubePkgs = list.filter(p => p.has_youtube || p.tien_ich_free?.toLowerCase().includes('youtube') || p.tienich?.toLowerCase().includes('youtube'));
    const longCyclePkgs = list.filter(p => getCycleDays(p) > 30 || p.is_long_term);
    const shortCyclePkgs = list.filter(p => getCycleDays(p) < 30);

    const prices = list.map(p => p.gia);
    const datas = list.map(p => parseDataPerDay(p));
    const voices = list.map(p => getVoiceTotal(p));

    const priceRange = Math.max(...prices) - Math.min(...prices);
    const dataRange = Math.max(...datas) - Math.min(...datas);
    const voiceRange = Math.max(...voices) - Math.min(...voices);

    const allSamePrice = list.every(p => p.gia === list[0].gia);
    const allSameData = list.every(p => parseDataPerDay(p) === parseDataPerDay(list[0]));
    const allSameVoice = list.every(p => getVoiceTotal(p) === getVoiceTotal(list[0]));
    const allSameCycle = list.every(p => getCycleDays(p) === getCycleDays(list[0]));

    // Determine if packages are nearly identical
    const isNearlyIdentical =
      (priceRange === 0 || (priceRange / Math.max(...prices) < 0.1)) &&
      (dataRange === 0 || (dataRange / Math.max(...datas) < 0.1)) &&
      (voiceRange === 0 || (voiceRange / Math.max(...voices) < 0.1));

    const title = 'Gợi Ý Từ Trợ Lý Ảo:';
    let summary = '';
    let suggestion = '';
    const differences: string[] = [];

    if (isNearlyIdentical) {
      summary = 'Các gói cước đang so sánh có cước phí và ưu đãi cốt lõi gần như tương đương nhau.';

      let decidingFactor = 'nhu cầu sử dụng thực tế và chu kỳ đóng cước của bạn';
      if (!allSameCycle) {
        decidingFactor = 'chu kỳ sử dụng dài hay ngắn hạn mà bạn mong muốn';
      } else if (tv360Pkgs.length !== list.length || tiktokPkgs.length !== list.length || facebookPkgs.length !== list.length) {
        decidingFactor = 'các tiện ích mạng xã hội đi kèm được miễn phí lưu lượng như TikTok, Facebook hay TV360';
      }

      suggestion = `Các gói này gần như tương đương, lựa chọn chủ yếu phụ thuộc vào ${decidingFactor}.`;
    } else {
      summary = 'Các gói cước đang phục vụ các phân khúc nhu cầu và mức ngân sách khác nhau.';

      // Generate differences (ignore fields that are 0 or null)
      if (!allSamePrice) {
        cheapestPkgs.forEach(p => {
          if (p.gia > 0) {
            differences.push(`Gói ${p.ten} giúp tiết kiệm chi phí tối đa với giá đăng ký thấp nhất (${new Intl.NumberFormat('vi-VN').format(p.gia)}đ).`);
          }
        });
      }

      if (!allSameData && maxDataVal > 0) {
        maxDataPkgs.forEach(p => {
          if (p.data_theo_ngay && p.data_theo_ngay !== '0') {
            differences.push(`Gói ${p.ten} nổi bật với lưu lượng Data tốc độ cao vượt trội (${p.data_theo_ngay}).`);
          }
        });
      }

      if (!allSameVoice && maxVoiceVal > 0) {
        maxVoicePkgs.forEach(p => {
          const details = [];
          if (p.free_noi_mang && p.free_noi_mang !== '0') details.push(p.free_noi_mang);
          if (p.free_ngoai_mang && p.free_ngoai_mang !== '0') details.push(p.free_ngoai_mang);
          if (details.length > 0) {
            differences.push(`Gói ${p.ten} vượt trội về ưu đãi gọi thoại tự do (${details.join(', ')}).`);
          }
        });
      }

      // App differences
      if (tv360Pkgs.length > 0 && tv360Pkgs.length < list.length) {
        differences.push(`Ưu đãi xem truyền hình giải trí TV360 chỉ tích hợp ở gói: ${tv360Pkgs.map(p => p.ten).join(', ')}.`);
      }
      if (tiktokPkgs.length > 0 && tiktokPkgs.length < list.length) {
        differences.push(`Ưu đãi truy cập TikTok không giới hạn dung lượng chỉ có ở gói: ${tiktokPkgs.map(p => p.ten).join(', ')}.`);
      }
      if (youtubePkgs.length > 0 && youtubePkgs.length < list.length) {
        differences.push(`Ưu đãi xem YouTube miễn phí chỉ hỗ trợ ở gói: ${youtubePkgs.map(p => p.ten).join(', ')}.`);
      }
      if (facebookPkgs.length > 0 && facebookPkgs.length < list.length) {
        differences.push(`Ưu đãi lướt Facebook miễn cước data chỉ áp dụng cho gói: ${facebookPkgs.map(p => p.ten).join(', ')}.`);
      }

      // Cycle differences
      if (!allSameCycle) {
        if (longCyclePkgs.length > 0 && longCyclePkgs.length < list.length) {
          differences.push(`Gói dài hạn phù hợp để sử dụng lâu dài tránh gián đoạn chu kỳ: ${longCyclePkgs.map(p => p.ten).join(', ')}.`);
        }
        if (shortCyclePkgs.length > 0 && shortCyclePkgs.length < list.length) {
          differences.push(`Gói chu kỳ ngắn linh hoạt cho nhu cầu sử dụng đột xuất: ${shortCyclePkgs.map(p => p.ten).join(', ')}.`);
        }
      }

      // Standout suggestions
      const cheapestAndMaxData = list.find(p => p.gia === minGia && parseDataPerDay(p) === maxDataVal && maxDataVal > 0);
      if (cheapestAndMaxData) {
        suggestion = `Gói ${cheapestAndMaxData.ten} có sự kết hợp lý tưởng giữa giá rẻ và lưu lượng lớn. Bạn nên cân nhắc gói này nếu muốn tiết kiệm mà vẫn có nhiều data.`;
      } else {
        const sortedByScore = [...list].sort((a, b) => {
          let scoreA = 0;
          let scoreB = 0;
          // Score logic (cheaper + more data)
          scoreA += (cheapestPkgs.includes(a) ? 2 : 0) + (maxDataPkgs.includes(a) ? 3 : 0) + (maxVoicePkgs.includes(a) ? 1 : 0);
          scoreB += (cheapestPkgs.includes(b) ? 2 : 0) + (maxDataPkgs.includes(b) ? 3 : 0) + (maxVoicePkgs.includes(b) ? 1 : 0);
          return scoreB - scoreA;
        });
        const bestOption = sortedByScore[0];
        suggestion = `Gói ${bestOption.ten} thể hiện sự cân đối hợp lý cho hầu hết nhu cầu thông thường. Hãy đưa ra quyết định dựa trên việc bạn cần thêm dung lượng data hay ưu tiên thời lượng gọi thoại liên lạc.`;
      }
    }

    // 7. Best Tags for comparison grid highlight
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
      if (maxSmsVal > 0 && parseSms(p.sms) === maxSmsVal) {
        bestTags[p.id].isMaxSms = true;
      }
      if (maxCycleVal > 30 && getCycleDays(p) === maxCycleVal) {
        bestTags[p.id].isLongestCycle = true;
      }
    });

    return {
      title,
      summary,
      differences,
      suggestion,
      bestTags
    };
  }
};
