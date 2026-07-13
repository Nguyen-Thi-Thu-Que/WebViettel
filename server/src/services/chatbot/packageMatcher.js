const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'scoring_config.json');
const scoringConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

/**
 * Tiện ích kiểm tra data thực tế của gói cước
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

/**
 * Kiểm tra gói có phải tiện ích mạng xã hội (YOUTUBE/TIKTOK/FACEBOOK/MOVIE) không
 */
function isAddonSocialPackage(pkg) {
  if (!pkg.benefit_group) return false;
  const bg = pkg.benefit_group.toUpperCase();
  return ['YOUTUBE', 'TIKTOK', 'FACEBOOK', 'MOVIE', 'SOCIAL'].includes(bg);
}

/**
 * Sprint 6 Hotfix: matchPackages
 * - packageCodes[]: tìm tất cả mã gói được hỏi, KHÔNG return sớm
 * - minDays: bộ lọc CỨNG (loại hoàn toàn, không dùng score âm)
 * - addon/requiresBase: loại hoàn toàn khi người dùng chỉ hỏi data/voice chung
 * - data rẻ: loại mạnh gói 1,3,5,7 ngày
 */
const matchPackages = (packages, intent) => {
  const {
    budget = null,
    cheap = false,
    expensive = false,
    needData = false,
    needVoice = false,
    needSms = false,
    needYoutube = false,
    needTiktok = false,
    needFacebook = false,
    needTV360 = false,
    needMovie = false,
    needSocial = false,
    need5G = false,
    needLongTerm = false,
    needShortTerm = false,
    needCombo = false,
    needAddon = false,
    needYearly = false,
    minDays = null,
    packageCodes = []
  } = intent || {};

  // Xác định user đang hỏi nội dung giải trí cụ thể
  const askedSpecificSocial = needYoutube || needTiktok || needFacebook || needMovie || needSocial;

  // Sprint 6 Hotfix: data giá rẻ
  const wantCheapData = cheap && needData && !needCombo;

  // Sprint 6 Hotfix: Người dùng chỉ hỏi data/voice chung (không hỏi social)
  // => loại HOÀN TOÀN addon + requiresBase (không dùng score phạt nhẹ)
  const pureDataVoiceQuery = (needData || needVoice) && !askedSpecificSocial && !needAddon;

  // PHẦN A — packageCodes: tìm tất cả gói được hỏi
  let exactPackages = [];
  if (packageCodes.length > 0) {
    exactPackages = packageCodes
      .map(code => packages.find(p => p.ma_goi && p.ma_goi.toLowerCase() === code.toLowerCase()))
      .filter(Boolean);
  }

  // PHẦN B — tư vấn bổ sung theo intent (kể cả khi có packageCodes)
  // Chỉ bỏ qua nếu packageCodes dùng hết và không có intent nào khác
  const hasOtherIntent = needData || needVoice || needCombo || cheap || expensive ||
    needYoutube || needTiktok || needFacebook || needTV360 || needMovie ||
    needSocial || needLongTerm || budget !== null;

  let advisoryPackages = [];
  if (packageCodes.length === 0 || hasOtherIntent) {
    // Loại các gói đã tìm thấy chính xác (tránh trùng)
    const exactCodes = new Set(exactPackages.map(p => p.ma_goi && p.ma_goi.toLowerCase()));

    const scoredPackages = packages
      .filter(pkg => {
        // Không chấm điểm gói đã có trong exactPackages
        if (pkg.ma_goi && exactCodes.has(pkg.ma_goi.toLowerCase())) return false;

        const cycleDay = parseInt(pkg.chu_ky_ngay) || 0;
        const isAddon = isAddonSocialPackage(pkg);
        const requiresBase = pkg.requires_base_package === true;

        // BỘ LỌC CỨNG #1: Thời gian (minDays window)
        // Loại gói < minDays VÀ gói vượt quá xa (> minDays + 30 ngày)
        // Tránh hỏi 3 tháng (90 ngày) lại ra gói 6 tháng (180 ngày)
        if (minDays !== null) {
          if (cycleDay < minDays) return false;
          if (cycleDay > minDays + 30) return false;
        }

        // BỘ LỌC CỨNG #2: addon/requiresBase khi chỉ hỏi data/voice chung
        if (pureDataVoiceQuery && (isAddon || requiresBase)) return false;

        // BỘ LỌC CỨNG #3: data rẻ — loại hoàn toàn gói 1,3,5,7 ngày
        if (wantCheapData && (cycleDay === 1 || cycleDay === 3 || cycleDay === 5 || cycleDay === 7)) return false;

        // BỘ LỌC CỨNG #4: Voice/Combo — gói bắt buộc phải có thoại thực
        if ((needVoice || needCombo) && !hasRealVoice(pkg)) return false;

        // BỘ LỌC CỨNG #5: Data Only — Loại bỏ gói Combo khi người dùng chỉ cần data
        const isComboPkg = pkg.phan_loai_goi === 'Combo' || 
                           (pkg.phan_loai_goi && pkg.phan_loai_goi.toUpperCase() === 'COMBO') ||
                           pkg.service_group === 'COMBO' ||
                           (pkg.service_group && pkg.service_group.toUpperCase() === 'COMBO');
        if (needData && !needVoice && !needCombo && isComboPkg) return false;

        return true;
      })
      .map(pkg => {
        let score = 0;
        const cycleDay = parseInt(pkg.chu_ky_ngay) || 0;
        const bg = pkg.benefit_group ? pkg.benefit_group.toUpperCase() : '';
        const isAddon = isAddonSocialPackage(pkg);

        // Benefit group
        if (needYoutube && bg === 'YOUTUBE') score += scoringConfig.benefit_group.youtube;
        if (needTiktok && bg === 'TIKTOK') score += scoringConfig.benefit_group.tiktok;
        if (needFacebook && bg === 'FACEBOOK') score += scoringConfig.benefit_group.facebook;
        if (needMovie && bg === 'MOVIE') score += scoringConfig.benefit_group.movie;
        if (needSocial && ['YOUTUBE', 'TIKTOK', 'FACEBOOK', 'SOCIAL', 'MOVIE'].includes(bg)) score += scoringConfig.benefit_group.social_any;

        // TV360
        if (needTV360) {
          const hasTv = (pkg.tien_ich_free && pkg.tien_ich_free.toUpperCase().includes('TV360')) ||
                        (pkg.uudaitrong && pkg.uudaitrong.toUpperCase().includes('TV360'));
          if (hasTv) score += scoringConfig.tv360;
        }

        // Youtube / Tiktok / Facebook trong tien_ich_free & uudaitrong
        if (needYoutube) {
          if ((pkg.tien_ich_free && /youtube/i.test(pkg.tien_ich_free)) ||
              (pkg.uudaitrong && /youtube/i.test(pkg.uudaitrong))) score += scoringConfig.description_keywords;
        }
        if (needTiktok) {
          if ((pkg.tien_ich_free && /tiktok/i.test(pkg.tien_ich_free)) ||
              (pkg.uudaitrong && /tiktok/i.test(pkg.uudaitrong))) score += scoringConfig.description_keywords;
        }
        if (needFacebook) {
          if ((pkg.tien_ich_free && /facebook/i.test(pkg.tien_ich_free)) ||
              (pkg.uudaitrong && /facebook/i.test(pkg.uudaitrong))) score += scoringConfig.description_keywords;
        }
        if (needMovie) {
          if ((pkg.tien_ich_free && /phim|movie|cinema/i.test(pkg.tien_ich_free)) ||
              (pkg.uudaitrong && /phim|movie|cinema/i.test(pkg.uudaitrong))) score += scoringConfig.description_keywords;
        }

        // Data
        if (needData) {
          if (hasRealData(pkg)) score += scoringConfig.data_features.has_real_data;
          if (pkg.system_type === 'DATA_BASE') score += scoringConfig.data_features.is_data_base;
        }

        // Voice
        if (needVoice && hasRealVoice(pkg)) score += scoringConfig.voice_features;

        // 5G
        if (need5G && pkg.loai_mang && pkg.loai_mang.toUpperCase().includes('5G')) score += scoringConfig.five_g;

        // Combo
        if (needCombo) {
          if (pkg.service_group === 'COMBO') score += scoringConfig.combo.is_combo;
          if (hasRealData(pkg) && hasRealVoice(pkg)) score += scoringConfig.combo.both_data_voice;
        }

        // Addon
        if (needAddon && pkg.requires_base_package === true) score += scoringConfig.addon;

        // Data giá rẻ — ưu tiên Gia_re + DATA_BASE + chu_ky >= 30
        if (wantCheapData) {
          if (pkg.phan_khuc_gia === 'Gia_re') score += scoringConfig.cheap_data.is_cheap;
          if (pkg.system_type === 'DATA_BASE') score += scoringConfig.cheap_data.is_base;
          if (cycleDay >= 30) score += scoringConfig.cheap_data.long_cycle;
          if (cycleDay < 30) score += scoringConfig.cheap_data.short_cycle_penalty;
        }

        // Chu kỳ dài hạn
        if (needLongTerm && cycleDay >= 90) {
          score += scoringConfig.long_term.base;
          if (pkg.system_type === 'DATA_BASE' || pkg.service_group === 'COMBO') score += scoringConfig.long_term.data_combo_bonus;
        }

        // minDays bonus (đã qua bộ lọc cứng ở trên)
        if (minDays !== null && cycleDay >= minDays) score += scoringConfig.min_days_bonus;

        // Chu kỳ năm
        if (needYearly && cycleDay >= 360) score += scoringConfig.yearly;

        // Phân khúc giá chung
        if (!wantCheapData) {
          if (cheap && pkg.phan_khuc_gia === 'Gia_re') score += scoringConfig.price_segment.cheap;
          if (expensive && pkg.phan_khuc_gia === 'Cao_cap') score += scoringConfig.price_segment.expensive;
        }

        // Thưởng dung lượng
        if (needData || needLongTerm || need5G) {
          const dailyGb = getDailyGb(pkg);
          score += dailyGb >= 4 ? 5 : dailyGb * 1.25;
        }

        // Budget matching
        if (budget !== null) {
          const diff = Math.abs(pkg.gia - budget);
          const maxDiff = Math.max(50000, budget * 0.5);
          if (diff > maxDiff) return { pkg, score: 0 };
          score += Math.max(1, Math.round((1 - diff / maxDiff) * 20));
        }

        // Phạt chu kỳ không phù hợp
        if (!needShortTerm && cycleDay <= 3) score += scoringConfig.penalties.too_short;
        if (!needLongTerm && !needYearly && cycleDay >= 90 && cycleDay < 360) score += scoringConfig.penalties.mid_term_unwanted;
        if (!needYearly && cycleDay >= 360) score += scoringConfig.penalties.yearly_unwanted;

        // Phạt addon sai loại
        if (askedSpecificSocial && isAddon) {
          let wrongType = false;
          if (needYoutube && bg !== 'YOUTUBE') wrongType = true;
          if (needTiktok && bg !== 'TIKTOK') wrongType = true;
          if (needFacebook && bg !== 'FACEBOOK') wrongType = true;
          if (needMovie && bg !== 'MOVIE') wrongType = true;
          if (wrongType) score += scoringConfig.penalties.wrong_addon;
        }

        return { pkg, score };
      });

    // Lọc score > 0
    const filtered = scoredPackages.filter(item => item.score > 0);

    // Sắp xếp
    filtered.sort((a, b) => {
      if (budget !== null) {
        const da = Math.abs(a.pkg.gia - budget);
        const db = Math.abs(b.pkg.gia - budget);
        if (da !== db) return da - db;
      }
      if (needCombo && budget === null) {
        if (a.pkg.gia !== b.pkg.gia) return a.pkg.gia - b.pkg.gia;
      }
      if (b.score !== a.score) return b.score - a.score;
      const ua = parseInt(a.pkg.do_uu_tien) || 1;
      const ub = parseInt(b.pkg.do_uu_tien) || 1;
      if (ub !== ua) return ub - ua;
      if (needLongTerm || minDays !== null) {
        const ca = parseInt(a.pkg.chu_ky_ngay) || 0;
        const cb = parseInt(b.pkg.chu_ky_ngay) || 0;
        if (cb !== ca) return cb - ca;
      }
      return a.pkg.gia - b.pkg.gia;
    });

    // Tối đa 3 gói tư vấn
    advisoryPackages = filtered.slice(0, 3).map(item => item.pkg);
  }

  // Ghép: exactPackages đứng trước, advisoryPackages sau (tổng tối đa 3)
  const combined = [...exactPackages];
  for (const pkg of advisoryPackages) {
    if (combined.length >= 3) break;
    if (!combined.find(p => p.ma_goi === pkg.ma_goi)) {
      combined.push(pkg);
    }
  }

  return combined;
};

module.exports = { matchPackages };
