import type { Package, User } from '../types';

/**
   * Evaluates if a user (or guest if null) has permission to view a package.
   * Rules:
   * 1. Admin has unrestricted access.
   * 2. KHTT (khach_hang_than_thiet) packages require user.is_loyal_customer === true.
   *    If the package also mentions tra_truoc or tra_sau, the corresponding subscription type must match too.
   * 3. Guest (user is null/undefined) can view general, tra_truoc, tra_sau packages and KHTT.
   * 4. User prepaid (tra_truoc) can view general and tra_truoc packages, but CANNOT view tra_sau.
   *    If package is KHTT, must also be is_loyal_customer === true.
   * 5. User postpaid (tra_sau) can view general and tra_sau packages, but CANNOT view tra_truoc.
   *    If package is KHTT, must also be is_loyal_customer === true.
 */
export function canViewPackage(user: User | null | undefined, pkg: Package): boolean {
  if (!pkg) return false;

  // 1. Guest & Admin have unrestricted access
  if (!user) return true;
  if (user.role === 'admin') return true;

  const targetStr = (pkg.doi_tuong_ap_dung || '').toLowerCase();
  const descStr = (pkg.dieu_kien_dang_ky || pkg.uudaitrong || '').toLowerCase();

  const isLoyalPkg = targetStr.includes('khach_hang_than_thiet') || descStr.includes('khach_hang_than_thiet');
  const isPrepaidPkg = targetStr.includes('tra_truoc') || descStr.includes('tra_truoc');
  const isPostpaidPkg = targetStr.includes('tra_sau') || descStr.includes('tra_sau');

  const userType = user.subscription_type || 'tra_truoc';
  const isLoyalUser = !!user.is_loyal_customer;

  // 2. Prepaid subscriber
  if (userType === 'tra_truoc') {
    if (isPostpaidPkg && !isPrepaidPkg) return false; // Hide postpaid-only
    if (isLoyalPkg) return isLoyalUser; // Hide KHTT if not loyal customer
  } 
  // 3. Postpaid subscriber
  else if (userType === 'tra_sau') {
    if (isPrepaidPkg && !isPostpaidPkg) return false; // Hide prepaid-only
    if (isLoyalPkg) return isLoyalUser; // Hide KHTT if not loyal customer
  }

  return true;
}
