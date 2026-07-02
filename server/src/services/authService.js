const crypto = require('crypto');
const Account = require('../models/Account');
const Subscription = require('../models/Subscription');
const Package = require('../models/Package');
const { generateToken } = require('../middlewares/authMiddleware');

// Helpers for Scrypt password hashing
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash) return false;
  if (!storedHash.includes(':')) {
    return password === storedHash; // Support plain text password from seed_extra.js
  }
  const [salt, hash] = storedHash.split(':');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return derivedKey.toString('hex') === hash;
}

// Map MongoDB Subscription list to frontend activePackages
async function getActivePackages(userId) {
  const activeSubs = await Subscription.find({ 
    user_id: userId, 
    status: 'active' 
  });

  const activePackages = [];
  for (const sub of activeSubs) {
    const pkg = await Package.findOne({ $or: [{ package_id: sub.package_id }, { id: sub.package_id }] });
    if (pkg) {
      activePackages.push({
        packageId: pkg.ma_goi.toLowerCase(),
        activatedAt: sub.registered_at,
        expiresAt: sub.expired_at
      });
    }
  }
  return activePackages;
}

const authService = {
  login: async (phoneNumber, password) => {
    const account = await Account.findOne({ phone_number: phoneNumber });
    if (!account) {
      throw new Error('Số điện thoại không tồn tại trong hệ thống.');
    }

    const isMatch = verifyPassword(password, account.password);
    if (!isMatch) {
      throw new Error('Mật khẩu không chính xác.');
    }

    // Generate payload
    const tokenPayload = {
      userId: account.user_id,
      role: account.role,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours expiry
    };

    const token = generateToken(tokenPayload);
    const activePackages = await getActivePackages(account.user_id);

    return {
      token,
      user: {
        id: String(account.user_id),
        name: account.fullname,
        phoneNumber: account.phone_number,
        email: account.email || '',
        balance: account.balance,
        role: account.role === 'admin' ? 'admin' : 'customer',
        activePackages
      }
    };
  },

  register: async (fullname, phoneNumber, email, password) => {
    // Check if phone number exists
    const existing = await Account.findOne({ phone_number: phoneNumber });
    if (existing) {
      throw new Error('Số điện thoại này đã được đăng ký.');
    }

    // Find next user_id
    const lastUser = await Account.findOne().sort({ user_id: -1 });
    const nextUserId = lastUser ? lastUser.user_id + 1 : 1;

    // Hash password
    const hashedPassword = hashPassword(password);

    const newAccount = await Account.create({
      user_id: nextUserId,
      fullname,
      phone_number: phoneNumber,
      password: hashedPassword,
      email: email || '',
      balance: 50000, // Welcome gift balance
      role: 'user'
    });

    const tokenPayload = {
      userId: newAccount.user_id,
      role: newAccount.role,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
    };

    const token = generateToken(tokenPayload);

    return {
      token,
      user: {
        id: String(newAccount.user_id),
        name: newAccount.fullname,
        phoneNumber: newAccount.phone_number,
        email: newAccount.email || '',
        balance: newAccount.balance,
        role: 'customer',
        activePackages: []
      }
    };
  },

  getMe: async (userId) => {
    const account = await Account.findOne({ user_id: userId });
    if (!account) {
      throw new Error('Không tìm thấy thông tin tài khoản.');
    }

    const activePackages = await getActivePackages(account.user_id);

    return {
      id: String(account.user_id),
      name: account.fullname,
      phoneNumber: account.phone_number,
      email: account.email || '',
      balance: account.balance,
      role: account.role === 'admin' ? 'admin' : 'customer',
      activePackages
    };
  },

  updateProfile: async (userId, fullname, email) => {
    const account = await Account.findOne({ user_id: userId });
    if (!account) {
      throw new Error('Không tìm thấy thông tin tài khoản.');
    }

    account.fullname = fullname;
    account.email = email || '';
    await account.save();

    const activePackages = await getActivePackages(account.user_id);

    return {
      id: String(account.user_id),
      name: account.fullname,
      phoneNumber: account.phone_number,
      email: account.email || '',
      balance: account.balance,
      role: account.role === 'admin' ? 'admin' : 'customer',
      activePackages
    };
  },

  changePassword: async (userId, oldPassword, newPassword) => {
    const account = await Account.findOne({ user_id: userId });
    if (!account) {
      throw new Error('Không tìm thấy thông tin tài khoản.');
    }

    const isMatch = verifyPassword(oldPassword, account.password);
    if (!isMatch) {
      throw new Error('Mật khẩu cũ không chính xác.');
    }

    account.password = hashPassword(newPassword);
    await account.save();
    return true;
  }
};

module.exports = authService;
