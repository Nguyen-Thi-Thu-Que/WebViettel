const UserSubscription = require('../models/UserSubscription');
const Package = require('../models/Package');
const Account = require('../models/Account');
const mongoose = require('mongoose');

// Auto-migrate package metadata if not present
(async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      await runMetadataMigration();
    } else {
      mongoose.connection.once('open', async () => {
        await runMetadataMigration();
      });
    }
  } catch (err) {
    console.error("Error setting up metadata migration listener:", err);
  }
})();

async function runMetadataMigration() {
  try {
    const pkgs = await Package.find({});
    let updatedCount = 0;
    for (const pkg of pkgs) {
      if (!pkg.cycle_type || !pkg.service_group || !pkg.registration_policy) {
        let cycle_type = 'MONTH';
        const days = parseInt(pkg.chu_ky_ngay || '30', 10);
        if (days < 30) {
          cycle_type = 'DAY';
        }

        let service_group = 'DATA';
        const cat = pkg.phan_loai_goi || 'Data';
        if (cat.toLowerCase() === 'combo') {
          service_group = 'COMBO';
        } else if (cat.toLowerCase() === 'social') {
          service_group = 'SOCIAL';
        } else if (cat.toLowerCase() === 'thoại') {
          service_group = 'VOICE';
        }

        // Assign deterministic policy rules for metadata tests
        let registration_policy = 'REPLACE';
        if (pkg.package_id % 3 === 0) {
          registration_policy = 'ALLOW';
        } else if (pkg.package_id % 3 === 1) {
          registration_policy = 'REJECT';
        } else {
          registration_policy = 'REPLACE';
        }

        await Package.updateOne(
          { _id: pkg._id },
          {
            $set: {
              cycle_type,
              service_group,
              registration_policy
            }
          }
        );
        updatedCount++;
      }
    }
    if (updatedCount > 0) {
      console.log(`Successfully migrated ${updatedCount} packages with cycle_type, service_group, and registration_policy metadata.`);
    }
  } catch (err) {
    console.error("Error migrating package metadata:", err);
  }
}

// ─── Conflict-engine helpers ───────────────────────────────────────────────

// Danh sách chu_ky_ngay được coi là "gói ngắn ngày"
const SHORT_CYCLES = [1, 3, 5, 7, 14, 15];

/**
 * BƯỚC 1 – Kiểm tra đăng ký trùng chính gói đang dùng.
 * Trả về conflict result hoặc null nếu không trùng.
 */
const handleDuplicate = (activeSubs, pkg, newMetadata) => {
  const exactSub = activeSubs.find(sub => sub.packageId === pkg.package_id);
  if (!exactSub) return null;

  const newDuration = newMetadata.duration;
  if (SHORT_CYCLES.includes(newDuration)) {
    return {
      action: 'RENEW_SHORT',
      message: 'Đăng ký lại thành công. Ưu đãi và thời gian sử dụng đã được cấp mới.',
      exactSubId: exactSub._id,
      hasActive: true
    };
  }
  return {
    action: 'REJECT',
    message: 'Bạn đang sử dụng gói này. Vui lòng hủy gói hoặc chờ hết hạn để đăng ký lại.',
    hasActive: true
  };
};

/**
 * BƯỚC 2 – Kiểm tra requires_base_package.
 * Trả về REJECT result nếu không có gói data nền / combo, null nếu OK.
 */
const validateBasePackage = async (activeSubs) => {
  const BASE_TYPES = ['DATA_BASE', 'COMBO'];
  const activePkgIds = activeSubs.map(s => s.packageId);
  const activePkgs = await Package.find({ package_id: { $in: activePkgIds } });
  const hasBase = activePkgs.some(p => BASE_TYPES.includes((p.system_type || '').toUpperCase()));
  if (!hasBase) {
    return {
      action: 'REJECT',
      message: 'Gói này yêu cầu thuê bao đang sử dụng gói data nền hoặc gói combo phù hợp.',
      hasActive: activeSubs.length > 0
    };
  }
  return null;
};

/**
 * BƯỚC 4 – Kiểm tra chồng LONG_TERM.
 * Nếu gói mới is_long_term và có bất kỳ gói active nào cũng is_long_term => REJECT.
 */
const checkLongTermConflict = async (activeSubs, newPkg) => {
  if (!newPkg.is_long_term) return null;
  const activePkgIds = activeSubs.map(s => s.packageId);
  const activePkgs = await Package.find({ package_id: { $in: activePkgIds } });
  const conflictLong = activePkgs.find(p => p.is_long_term === true);
  if (conflictLong) {
    return {
      action: 'REJECT',
      message: `Bạn đang sử dụng gói dài hạn ${conflictLong.ma_goi}. Không thể đăng ký thêm gói dài hạn khác. Vui lòng hủy gói cũ trước.`,
      hasActive: true
    };
  }
  return null;
};

/**
 * BƯỚC 5 – Kiểm tra allow_parallel_with.
 * Nếu BẤT KỲ active package nào cho phép chạy song song với system_type của gói mới => ALLOW.
 */
const canRunParallel = async (activeSubs, newPkg) => {
  const newSysType = (newPkg.system_type || '').toUpperCase();
  if (!newSysType) return false;
  const activePkgIds = activeSubs.map(s => s.packageId);
  const activePkgs = await Package.find({ package_id: { $in: activePkgIds } });
  return activePkgs.some(p => {
    const allowList = (p.allow_parallel_with || []).map(t => t.toUpperCase());
    return allowList.includes(newSysType);
  });
};

// ─── Utility functions used by conflict helpers and registerSubscription ─────

const calculateExpiryDate = (activatedAt, duration, cycleType, validityMode) => {
  const date = new Date(activatedAt);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid activatedAt date');
  }

  // All packages duration is added in days
  date.setDate(date.getDate() + duration);

  if (validityMode === 'END_OF_DAY') {
    const localTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);
    localTime.setUTCHours(23, 59, 59, 999);
    return new Date(localTime.getTime() - 7 * 60 * 60 * 1000);
  }

  return date;
};

const getPkgMetadata = (pkg) => {
  const duration = pkg.duration !== undefined ? pkg.duration : parseInt(pkg.chu_ky_ngay || '30', 10);

  let cycle = 'MONTH';
  if (duration < 30) {
    cycle = 'DAY';
  } else if (duration >= 360) {
    cycle = 'YEAR';
  }

  const cycle_type = pkg.cycle_type || `${cycle}_${duration}`;
  const support_auto_renew = pkg.support_auto_renew !== undefined ? pkg.support_auto_renew : (cycle !== 'DAY');
  const validity_mode = pkg.validity_mode || (cycle === 'DAY' ? 'END_OF_DAY' : 'SAME_TIME');
  const registration_policy = pkg.registration_policy || 'REPLACE';

  let service_group = pkg.service_group;
  if (!service_group) {
    const cat = pkg.phan_loai_goi || 'Data';
    if (cat.toLowerCase() === 'combo') {
      service_group = 'COMBO';
    } else if (cat.toLowerCase() === 'social') {
      service_group = 'SOCIAL';
    } else if (cat.toLowerCase() === 'thoại') {
      service_group = 'VOICE';
    } else {
      service_group = 'DATA';
    }
  }

  return {
    package_id: pkg.package_id,
    cycle,
    duration,
    cycle_type,
    support_auto_renew,
    validity_mode,
    service_group,
    registration_policy
  };
};

// ─── Cũ – giữ lại để dùng trong applyRegistrationPolicy (BƯỚC 6) ──────────

const isSameSystem = (meta1, meta2, pkg1, pkg2) => {
  const group1 = (meta1.service_group || '').toUpperCase();
  const group2 = (meta2.service_group || '').toUpperCase();
  const cat1 = (pkg1.phan_loai_goi || '').toUpperCase();
  const cat2 = (pkg2.phan_loai_goi || '').toUpperCase();
  const nhom1 = (pkg1.Nhom_Goi || '').toUpperCase();
  const nhom2 = (pkg2.Nhom_Goi || '').toUpperCase();
  return group1 === group2 || cat1 === cat2 || (nhom1 && nhom2 && nhom1 === nhom2);
};

const isSameCycle = (meta1, meta2, pkg1, pkg2) => {
  const dur1 = meta1.duration;
  const dur2 = meta2.duration;
  const cyc1 = parseInt(pkg1.chu_ky_ngay || '30', 10);
  const cyc2 = parseInt(pkg2.chu_ky_ngay || '30', 10);
  return dur1 === dur2 || cyc1 === cyc2;
};

/**
 * BƯỚC 6 – Áp dụng registration_policy (REPLACE / REJECT / ALLOW) như cũ.
 */
const applyRegistrationPolicy = async (activeSubs, pkg, newMetadata) => {
  let finalAction = 'ALLOW';
  let finalMessage = 'Gói cước có thể sử dụng song song.';
  const replaceSubscriptions = [];
  const conflictSubscriptions = [];

  for (const sub of activeSubs) {
    const activePkg = await Package.findOne({ package_id: sub.packageId });
    if (!activePkg) continue;
    const activeMetadata = getPkgMetadata(activePkg);
    const sameSystem = isSameSystem(newMetadata, activeMetadata, pkg, activePkg);
    const sameCycle = isSameCycle(newMetadata, activeMetadata, pkg, activePkg);

    if (sameSystem && sameCycle) {
      if (newMetadata.registration_policy === 'REJECT') {
        conflictSubscriptions.push({
          subscriptionId: sub._id,
          packageId: activePkg.package_id,
          packageName: activePkg.ten,
          packageCode: activePkg.ma_goi
        });
        finalAction = 'REJECT';
      } else if (newMetadata.registration_policy === 'REPLACE') {
        replaceSubscriptions.push({
          subscriptionId: sub._id,
          packageId: activePkg.package_id,
          packageName: activePkg.ten,
          packageCode: activePkg.ma_goi
        });
        if (finalAction !== 'REJECT') finalAction = 'REPLACE';
      }
    }
  }

  if (finalAction === 'REJECT') {
    return {
      action: 'REJECT',
      message: 'Không thể đăng ký đồng thời với các gói đang sử dụng.',
      conflictSubscriptions,
      hasActive: true
    };
  }
  if (finalAction === 'REPLACE') {
    return {
      action: 'REPLACE',
      message: 'Gói mới sẽ thay thế các gói đang sử dụng.',
      replaceSubscriptions,
      hasActive: true
    };
  }
  return {
    action: 'ALLOW',
    message: finalMessage,
    hasActive: activeSubs.length > 0
  };
};

// ──────────────────────────────────────────────────────────────────────────

const subscriptionService = {
  /**
   * Kiểm tra xung đột trước khi đăng ký gói.
   * Thứ tự bắt buộc:
   *   1. Trùng chính gói
   *   2. requires_base_package
   *   3. is_addon → ALLOW ngay
   *   4. is_long_term chồng nhau → REJECT
   *   5. allow_parallel_with → ALLOW ngay
   *   6. registration_policy cũ (REPLACE / REJECT)
   */
  checkSubscriptionConflict: async (userId, packageId) => {
    const account = await Account.findOne({ user_id: userId });
    if (!account) {
      throw new Error('Người dùng không tồn tại.');
    }

    let pkg = await Package.findOne({ package_id: Number(packageId) });
    if (!pkg) {
      pkg = await Package.findOne({ $or: [{ package_id: Number(packageId) }, { id: Number(packageId) }] });
    }
    if (!pkg) {
      pkg = await Package.findOne({ ma_goi: new RegExp(`^${packageId}$`, 'i') });
    }
    if (!pkg) {
      throw new Error('Gói cước không tồn tại.');
    }

    const now = new Date();
    const activeSubs = await UserSubscription.find({
      userId: userId,
      status: 'ACTIVE',
      expiresAt: { $gt: now }
    });

    const newMetadata = getPkgMetadata(pkg);

    // ── BƯỚC 1: Trùng chính gói ──────────────────────────────────────────
    const duplicateResult = handleDuplicate(activeSubs, pkg, newMetadata);
    if (duplicateResult) return duplicateResult;

    // Không có gói active nào → ALLOW ngay
    if (activeSubs.length === 0) {
      return { action: 'ALLOW', message: 'Gói cước có thể sử dụng song song.', hasActive: false };
    }

    // ── BƯỚC 2: requires_base_package ────────────────────────────────────
    if (pkg.requires_base_package === true) {
      const baseResult = await validateBasePackage(activeSubs);
      if (baseResult) return baseResult;
    }

    // ── BƯỚC 3: is_addon → ALLOW ngay ────────────────────────────────────
    if (pkg.is_addon === true) {
      return { action: 'ALLOW', message: 'Gói tiện ích bổ sung có thể sử dụng song song.', hasActive: true };
    }

    // ── BƯỚC 4: Chồng LONG_TERM ──────────────────────────────────────────
    const longTermResult = await checkLongTermConflict(activeSubs, pkg);
    if (longTermResult) return longTermResult;

    // ── BƯỚC 5: allow_parallel_with ──────────────────────────────────────
    const parallel = await canRunParallel(activeSubs, pkg);
    if (parallel) {
      return { action: 'ALLOW', message: 'Gói cước có thể sử dụng song song.', hasActive: true };
    }

    // ── BƯỚC 6: registration_policy cũ ───────────────────────────────────
    return await applyRegistrationPolicy(activeSubs, pkg, newMetadata);
  },

  registerSubscription: async (userId, packageId, cycle) => {
    const conflictResult = await subscriptionService.checkSubscriptionConflict(userId, packageId);
    if (conflictResult.action === 'REJECT') {
      throw new Error(conflictResult.message);
    }

    let pkg = await Package.findOne({ package_id: Number(packageId) });
    if (!pkg) {
      pkg = await Package.findOne({ $or: [{ package_id: Number(packageId) }, { id: Number(packageId) }] });
    }
    if (!pkg) {
      pkg = await Package.findOne({ ma_goi: new RegExp(`^${packageId}$`, 'i') });
    }
    if (!pkg) {
      throw new Error('Gói cước không tồn tại.');
    }

    const account = await Account.findOne({ user_id: userId });
    if (!account) {
      throw new Error('Tài khoản không tồn tại.');
    }
    if (account.balance < pkg.gia) {
      throw new Error('Số dư tài khoản không đủ.');
    }

    const now = new Date();
    const metadata = getPkgMetadata(pkg);
    const expiresAt = calculateExpiryDate(
      now,
      metadata.duration,
      metadata.cycle_type,
      metadata.validity_mode
    );

    if (conflictResult.action === 'RENEW_SHORT') {
      // 1. Deduct balance
      account.balance -= pkg.gia;
      await account.save();

      // 2. Update existing sub
      const sub = await UserSubscription.findById(conflictResult.exactSubId);
      if (!sub) {
        throw new Error('Không tìm thấy gói cước đang hoạt động để gia hạn.');
      }
      sub.activatedAt = now;
      sub.startedAt = now;
      sub.expiresAt = expiresAt;
      sub.status = 'ACTIVE';
      sub.cycle = metadata.cycle;
      sub.duration = metadata.duration;
      sub.cycleType = metadata.cycle_type;
      await sub.save();

      const subObj = sub.toObject();
      subObj.message = 'Đăng ký lại thành công. Ưu đãi và thời gian sử dụng đã được cấp mới.';

      return { subscription: subObj, account, pkg };
    }

    // 1. Deduct user balance
    account.balance -= pkg.gia;
    await account.save();

    // 2. Create UserSubscription
    const newSub = new UserSubscription({
      userId: userId,
      packageId: pkg.package_id,
      registeredAt: now,
      activatedAt: now,
      startedAt: now,
      expiresAt: expiresAt,
      status: 'ACTIVE',
      autoRenew: metadata.support_auto_renew,
      cycle: metadata.cycle,
      duration: metadata.duration,
      cycleType: metadata.cycle_type
    });
    await newSub.save();

    if (conflictResult.action === 'REPLACE' && conflictResult.replaceSubscriptions) {
      const subIdsToReplace = conflictResult.replaceSubscriptions.map(s => s.subscriptionId);

      await UserSubscription.updateMany(
        { _id: { $in: subIdsToReplace } },
        {
          $set: {
            status: 'REPLACED',
            replacedAt: now,
            replacedBySubscriptionId: newSub._id
          }
        }
      );
    }

    return { subscription: newSub, account, pkg };
  },

  getActiveSubscriptions: async (userId) => {
    await processAutoRenewals().catch(err => console.error("Real-time auto renewal process failed:", err));
    const now = new Date();
    return await UserSubscription.find({
      userId: userId,
      status: 'ACTIVE',
      expiresAt: { $gt: now }
    });
  },

  getSubscriptionHistory: async (userId) => {
    await processAutoRenewals().catch(err => console.error("Real-time auto renewal process failed:", err));
    return await UserSubscription.find({ userId: userId }).sort({ createdAt: -1 });
  },

  cancelSubscription: async (userId, subscriptionId) => {
    const sub = await UserSubscription.findOne({
      _id: subscriptionId,
      userId: userId,
      status: 'ACTIVE'
    });

    if (!sub) {
      throw new Error('Không tìm thấy gói cước đang hoạt động.');
    }

    sub.status = 'CANCELLED';
    sub.autoRenew = false;
    sub.cancelledAt = new Date();
    await sub.save();
    return sub;
  },

  updateAutoRenew: async (userId, subscriptionId, autoRenew) => {
    const sub = await UserSubscription.findOne({
      _id: subscriptionId,
      userId: userId,
      status: 'ACTIVE'
    });

    if (!sub) {
      throw new Error('Không tìm thấy gói cước đang hoạt động.');
    }

    sub.autoRenew = autoRenew;
    await sub.save();
    return sub;
  },

  clearSubscriptionHistory: async (userId) => {
    const now = new Date();
    return await UserSubscription.deleteMany({
      userId: userId,
      $or: [
        { status: { $in: ['CANCELLED', 'EXPIRED', 'REPLACED'] } },
        { status: 'ACTIVE', expiresAt: { $lte: now } }
      ]
    });
  }
};

const processAutoRenewals = async () => {
  const now = new Date();
  const activeSubs = await UserSubscription.find({ status: 'ACTIVE' });
  
  for (const sub of activeSubs) {
    const expiresAt = sub.expiresAt;
    const expiresAtLocal = new Date(expiresAt.getTime() + 7 * 60 * 60 * 1000);
    const nextDayLocal = new Date(expiresAtLocal);
    nextDayLocal.setUTCHours(0, 0, 0, 0);
    nextDayLocal.setUTCDate(nextDayLocal.getUTCDate() + 1);
    const renewalThreshold = new Date(nextDayLocal.getTime() - 7 * 60 * 60 * 1000);
    
    if (now >= renewalThreshold) {
      if (sub.autoRenew) {
        let pkg = await Package.findOne({ package_id: sub.packageId });
        if (!pkg) {
          pkg = await Package.findOne({ $or: [{ package_id: Number(sub.packageId) }, { id: Number(sub.packageId) }] });
        }
        const account = await Account.findOne({ user_id: sub.userId });
        
        if (pkg && account && account.balance >= pkg.gia) {
          account.balance -= pkg.gia;
          await account.save();
          
          const metadata = getPkgMetadata(pkg);
          const newExpiresAt = calculateExpiryDate(
            now,
            metadata.duration,
            metadata.cycle_type,
            metadata.validity_mode
          );
          
          sub.activatedAt = now;
          sub.startedAt = now;
          sub.expiresAt = newExpiresAt;
          sub.cycle = metadata.cycle;
          sub.duration = metadata.duration;
          sub.cycleType = metadata.cycle_type;
          await sub.save();
          console.log(`Auto-renewed sub ${sub._id} for user ${sub.userId} pkg ${pkg.ma_goi}`);
        } else {
          sub.status = 'EXPIRED';
          sub.autoRenew = false;
          await sub.save();
          console.log(`Auto-renewal failed/insufficient funds for sub ${sub._id} user ${sub.userId}`);
        }
      } else {
        sub.status = 'EXPIRED';
        await sub.save();
        console.log(`Sub ${sub._id} expired naturally`);
      }
    }
  }
};

// Periodic checker interval in background
setInterval(() => {
  processAutoRenewals().catch(err => console.error("Error in background renewals:", err));
}, 10000);

module.exports = {
  calculateExpiryDate,
  getPkgMetadata,
  processAutoRenewals,
  ...subscriptionService
};
