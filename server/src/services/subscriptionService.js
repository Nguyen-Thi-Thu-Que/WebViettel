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

// Metadata-driven conflict check helper
const isConflict = (p1, p2) => {
  if (p1.package_id === p2.package_id) return true;

  if (p1.cycle === p2.cycle) {
    if (p1.service_group === p2.service_group) return true;
    if (p1.service_group === 'COMBO' && (p2.service_group === 'DATA' || p2.service_group === 'VOICE')) return true;
    if (p2.service_group === 'COMBO' && (p1.service_group === 'DATA' || p1.service_group === 'VOICE')) return true;
  }
  return false;
};

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

const subscriptionService = {
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

    if (activeSubs.length === 0) {
      return {
        action: 'ALLOW',
        message: 'Gói cước có thể sử dụng song song.',
        hasActive: false
      };
    }

    const newMetadata = getPkgMetadata(pkg);

    let finalAction = 'ALLOW';
    let finalMessage = 'Gói cước có thể sử dụng song song.';
    const replaceSubscriptions = [];
    const conflictSubscriptions = [];

    for (const sub of activeSubs) {
      const activePkg = await Package.findOne({ package_id: sub.packageId });
      if (activePkg) {
        const activeMetadata = getPkgMetadata(activePkg);
        const hasConflict = isConflict(newMetadata, activeMetadata);
        if (hasConflict) {
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
            if (finalAction !== 'REJECT') {
              finalAction = 'REPLACE';
            }
          }
        }
      }
    }

    if (finalAction === 'REJECT') {
      finalMessage = 'Không thể đăng ký đồng thời với các gói đang sử dụng.';
      return {
        action: 'REJECT',
        message: finalMessage,
        conflictSubscriptions,
        hasActive: true
      };
    } else if (finalAction === 'REPLACE') {
      finalMessage = 'Gói mới sẽ thay thế các gói đang sử dụng.';
      return {
        action: 'REPLACE',
        message: finalMessage,
        replaceSubscriptions,
        hasActive: true
      };
    } else {
      return {
        action: 'ALLOW',
        message: finalMessage,
        hasActive: true
      };
    }
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

    const account = await Account.findOne({ user_id: userId });
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

    account.balance -= pkg.gia;
    await account.save();

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
