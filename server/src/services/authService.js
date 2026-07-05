const crypto = require('crypto');
const Account = require('../models/Account');
const Subscription = require('../models/Subscription');
const Package = require('../models/Package');
const { generateToken } = require('../middlewares/authMiddleware');

// Plain text password helpers (no hashing)
function hashPassword(password) {
  return password;
}

function verifyPassword(password, storedHash) {
  return password === storedHash;
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
      const err = new Error('Tài khoản không tồn tại.');
      err.statusCode = 404;
      throw err;
    }

    const isMatch = verifyPassword(password, account.password);
    if (!isMatch) {
      const err = new Error('Mật khẩu không chính xác.');
      err.statusCode = 401;
      throw err;
    }

    if (account.status === 'blocked') {
      const err = new Error('Tài khoản này đã bị khóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.');
      err.statusCode = 403;
      throw err;
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
        subscription_type: account.subscription_type || 'tra_truoc',
        is_loyal_customer: account.is_loyal_customer || false,
        status: account.status || 'active',
        activePackages
      }
    };
  },

  register: async (fullname, phoneNumber, email, password, subscriptionType) => {
    // Check if phone number is a valid Viettel format
    const isViettelPhone = (phone) => /^(086|096|097|098|032|033|034|035|036|037|038|039)\d{7}$/.test(phone);
    if (!isViettelPhone(phoneNumber)) {
      throw new Error('Chỉ hỗ trợ đăng ký bằng số điện thoại Viettel.');
    }

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

    // Enforce default values for new account registration
    const newAccount = await Account.create({
      user_id: nextUserId,
      fullname,
      phone_number: phoneNumber,
      password: hashedPassword,
      email: email || '',
      balance: 0,
      role: 'user',
      subscription_type: subscriptionType === 'tra_sau' ? 'tra_sau' : 'tra_truoc',
      is_loyal_customer: false,
      status: 'active'
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
        subscription_type: newAccount.subscription_type || 'tra_truoc',
        is_loyal_customer: newAccount.is_loyal_customer || false,
        status: newAccount.status || 'active',
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
      subscription_type: account.subscription_type || 'tra_truoc',
      is_loyal_customer: account.is_loyal_customer || false,
      status: account.status || 'active',
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
      subscription_type: account.subscription_type || 'tra_truoc',
      is_loyal_customer: account.is_loyal_customer || false,
      status: account.status || 'active',
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
