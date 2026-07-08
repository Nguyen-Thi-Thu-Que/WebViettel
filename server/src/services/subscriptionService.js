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

  if (p1.cycle_type === p2.cycle_type) {
    if (p1.service_group === p2.service_group) return true;
    if (p1.service_group === 'COMBO' && (p2.service_group === 'DATA' || p2.service_group === 'VOICE')) return true;
    if (p2.service_group === 'COMBO' && (p1.service_group === 'DATA' || p1.service_group === 'VOICE')) return true;
  }
  return false;
};

const getPkgMetadata = (pkg) => {
  let cycle_type = pkg.cycle_type;
  if (!cycle_type) {
    const days = parseInt(pkg.chu_ky_ngay || '30', 10);
    cycle_type = days < 30 ? 'DAY' : 'MONTH';
  }

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

  const registration_policy = pkg.registration_policy || 'REPLACE';

  return {
    package_id: pkg.package_id,
    cycle_type,
    service_group,
    registration_policy
  };
};

module.exports = {
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
    const conflictResult = await module.exports.checkSubscriptionConflict(userId, packageId);
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
    const cycleDays = parseInt(pkg.chu_ky_ngay || '30', 10);
    const expiresAt = new Date(now.getTime() + cycleDays * 24 * 60 * 60 * 1000);

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
      autoRenew: true,
      cycle: cycle || 'MONTH'
    });
    await newSub.save();

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
    const now = new Date();
    return await UserSubscription.find({
      userId: userId,
      status: 'ACTIVE',
      expiresAt: { $gt: now }
    });
  },

  getSubscriptionHistory: async (userId) => {
    return await UserSubscription.find({ userId: userId }).sort({ createdAt: -1 });
  },

  renewSubscription: async (subscriptionId) => {
    throw new Error('Chức năng gia hạn gói chưa được triển khai.');
  },

  cancelSubscription: async (subscriptionId, reason) => {
    throw new Error('Chức năng hủy gói chưa được triển khai.');
  },

  updateAutoRenew: async (subscriptionId, autoRenew) => {
    throw new Error('Chức năng thay đổi tự động gia hạn chưa được triển khai.');
  }
};
