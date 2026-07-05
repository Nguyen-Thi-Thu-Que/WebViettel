/**
 * Evaluates if a user (or guest if null) has permission to view a package.
 * Rules:
 * 1. Admin has unrestricted access.
 * 2. KHTT (khach_hang_than_thiet) packages require user.is_loyal_customer === true.
 *    If the package also mentions tra_truoc or tra_sau, the corresponding subscription type must match too.
 * 3. Guest (user is null/undefined) can view general, tra_truoc, tra_sau packages but CANNOT view KHTT packages.
 * 4. User prepaid (tra_truoc) can view general and tra_truoc packages, but CANNOT view tra_sau.
 *    If package is KHTT, must also be is_loyal_customer === true.
 * 5. User postpaid (tra_sau) can view general and tra_sau packages, but CANNOT view tra_truoc.
 *    If package is KHTT, must also be is_loyal_customer === true.
 */
function canViewPackage(user, pkg) {
  if (!pkg) return false;

  const targetStr = (pkg.doi_tuong_ap_dung || pkg.conditions || '').toLowerCase();
  const descStr = (pkg.dieu_kien_dang_ky || pkg.description || '').toLowerCase();

  const isLoyalPkg = targetStr.includes('khach_hang_than_thiet') || descStr.includes('khach_hang_than_thiet');
  const isPrepaidPkg = targetStr.includes('tra_truoc') || descStr.includes('tra_truoc');
  const isPostpaidPkg = targetStr.includes('tra_sau') || descStr.includes('tra_sau');

  // 1. Guest (unauthenticated)
  if (!user) {
    if (isLoyalPkg) return false; // Khách vãng lai không nhìn thấy gói KHTT
    return true;
  }

  // 2. Admin has unrestricted access
  if (user.role === 'admin' || user.role === 'Admin') return true;

  const userType = user.subscription_type || 'tra_truoc';
  const isLoyalUser = !!user.is_loyal_customer;

  // 3. Prepaid Subscriber
  if (userType === 'tra_truoc') {
    if (isPostpaidPkg && !isPrepaidPkg) return false; // Hide postpaid-only
    if (isLoyalPkg) return isLoyalUser; // Hide KHTT if not KHTT subscriber
  } 
  // 4. Postpaid Subscriber
  else if (userType === 'tra_sau') {
    if (isPrepaidPkg && !isPostpaidPkg) return false; // Hide prepaid-only
    if (isLoyalPkg) return isLoyalUser; // Hide KHTT if not KHTT subscriber
  }

  return true;
}

module.exports = { canViewPackage };
