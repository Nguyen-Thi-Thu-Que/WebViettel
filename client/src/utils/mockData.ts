import type { Package, User, FAQ, ChatbotConfig, Transaction } from '../types';

export const MOCK_PACKAGES: Package[] = [
  {
    id: 'mxh100',
    ten: 'MXH100',
    dohot: 'Hot',
    phan_loai_goi: 'Social',
    gia: 100000,
    phan_khuc_gia: 'Trung_binh',
    data_theo_ngay: '30 GB (1 GB/ngày)',
    free_ngoai_mang: '0',
    free_noi_mang: '0',
    tienich: '0',
    sms: '0',
    dieu_kien_dang_ky: 'Thuê bao thuộc danh sách ưu đãi hoặc kích hoạt mới.',
    chinh_sach_ap_dung: 'Gói cước áp dụng cho thuê bao di động trả trước kích hoạt mới từ ngày 01/07/2023.',
    noi_dung_ngoai: 'TikTok, YouTube, Facebook',
    tien_ich_free: '0',
    uudaitrong: 'Miễn phí 100% dung lượng data tốc độ cao truy cập TikTok, YouTube, Facebook và nhắn tin Messenger. Tặng thêm 30 GB data/tháng.',
    chu_ky_ngay: '30',
    dangky: 'Soạn MXH100 gửi 191',
    huygiahan: 'Soạn HUY MXH100 gửi 191',
    huygoicuoc: 'Soạn HUYDATA MXH100 gửi 191'
  },
  {
    id: 'sd135',
    ten: 'SD135',
    dohot: 'Hot',
    phan_loai_goi: 'Data',
    gia: 135000,
    phan_khuc_gia: 'Trung_binh',
    data_theo_ngay: '150 GB (5 GB/ngày)',
    free_ngoai_mang: '0',
    free_noi_mang: '0',
    tienich: '0',
    sms: '0',
    dieu_kien_dang_ky: 'Thuê bao di động trả trước kích hoạt mới hoặc nhận được tin nhắn khuyến mại.',
    chinh_sach_ap_dung: 'Hết 5GB/ngày ngừng truy cập. Có thể mua thêm gói ngày.',
    noi_dung_ngoai: '0',
    tien_ich_free: '0',
    uudaitrong: 'Siêu ưu đãi DATA dung lượng khủng 5GB tốc độ cao mỗi ngày (tổng 150GB/tháng). Giá rẻ nhất phân khúc siêu data.',
    chu_ky_ngay: '30',
    dangky: 'Soạn SD135 gửi 191',
    huygiahan: 'Soạn HUY SD135 gửi 191',
    huygoicuoc: 'Soạn HUYDATA SD135 gửi 191'
  },
  {
    id: 'v120c',
    ten: 'V120C',
    dohot: 'Hot',
    phan_loai_goi: 'Combo',
    gia: 120000,
    phan_khuc_gia: 'Trung_binh',
    data_theo_ngay: '60 GB (2 GB/ngày)',
    free_ngoai_mang: '50 phút ngoại mạng',
    free_noi_mang: '1000 phút nội mạng',
    tienich: 'Lifebox 100GB',
    sms: '0',
    dieu_kien_dang_ky: 'Thuê bao di động trả trước kích hoạt mới hoặc nhận được tin nhắn hệ thống.',
    chinh_sach_ap_dung: 'Miễn phí cuộc gọi nội mạng dưới 20 phút (tối đa 1000 phút), miễn phí data xem TikTok.',
    noi_dung_ngoai: 'TikTok',
    tien_ich_free: 'Lifebox 100GB',
    uudaitrong: 'Gói combo Quốc dân: 2GB data/ngày, miễn phí các cuộc gọi nội mạng dưới 20 phút, 50 phút gọi ngoại mạng và miễn phí data xem TikTok.',
    chu_ky_ngay: '30',
    dangky: 'Soạn V120C gửi 191',
    huygiahan: 'Soạn HUY V120C gửi 191',
    huygoicuoc: 'Soạn HUYDATA V120C gửi 191'
  },
  {
    id: 'mxh120',
    ten: 'MXH120',
    dohot: 'normal',
    phan_loai_goi: 'Combo',
    gia: 120000,
    phan_khuc_gia: 'Trung_binh',
    data_theo_ngay: '30 GB (1 GB/ngày)',
    free_ngoai_mang: '30 phút ngoại mạng',
    free_noi_mang: '1000 phút nội mạng',
    tienich: '0',
    sms: '0',
    dieu_kien_dang_ky: 'Thuê bao kích hoạt mới hoặc được ưu đãi đặc biệt.',
    chinh_sach_ap_dung: 'Thoại nội mạng quá 10 phút/cuộc sẽ tính cước từ phút thứ 10. Miễn phí data app MXH.',
    noi_dung_ngoai: 'TikTok, YouTube, Facebook',
    tien_ich_free: '0',
    uudaitrong: 'Bản nâng cấp của MXH100: Miễn phí TikTok, YouTube, Facebook cộng thêm miễn phí thoại nội mạng (cuộc gọi < 10 phút) và 30 phút ngoại mạng.',
    chu_ky_ngay: '30',
    dangky: 'Soạn MXH120 gửi 191',
    huygiahan: 'Soạn HUY MXH120 gửi 191',
    huygoicuoc: 'Soạn HUYDATA MXH120 gửi 191'
  },
  {
    id: 'v200c',
    ten: 'V200C',
    dohot: 'normal',
    phan_loai_goi: 'Combo',
    gia: 200000,
    phan_khuc_gia: 'Cao_cap',
    data_theo_ngay: '120 GB (4 GB/ngày)',
    free_ngoai_mang: '100 phút ngoại mạng',
    free_noi_mang: '1000 phút nội mạng',
    tienich: 'Lifebox 100GB',
    sms: '100 sms nội mạng',
    dieu_kien_dang_ky: 'Thuê bao di động trả trước kích hoạt mới hoặc thuộc danh sách ưu đãi VIP.',
    chinh_sach_ap_dung: 'Miễn phí cuộc gọi nội mạng dưới 20 phút, tặng 100 phút ngoại mạng và miễn phí data xem TikTok.',
    noi_dung_ngoai: 'TikTok',
    tien_ich_free: 'Lifebox 100GB',
    uudaitrong: 'Combo VIP cho người dùng bận rộn: 4GB data tốc độ cao/ngày, miễn phí cuộc gọi nội mạng dưới 20 phút, 100 phút gọi ngoại mạng, 100 SMS và miễn phí data xem TikTok.',
    chu_ky_ngay: '30',
    dangky: 'Soạn V200C gửi 191',
    huygiahan: 'Soạn HUY V200C gửi 191',
    huygoicuoc: 'Soạn HUYDATA V200C gửi 191'
  },
  {
    id: 'umax300',
    ten: 'UMAX300',
    dohot: 'normal',
    phan_loai_goi: 'Data',
    gia: 300000,
    phan_khuc_gia: 'Cao_cap',
    data_theo_ngay: 'Không giới hạn tốc độ cao',
    free_ngoai_mang: '0',
    free_noi_mang: '0',
    tienich: '0',
    sms: '0',
    dieu_kien_dang_ky: 'Tất cả thuê bao di động Viettel đang hoạt động 2 chiều.',
    chinh_sach_ap_dung: 'Dung lượng sử dụng tốc độ cao thực tế không giới hạn. Không bao gồm thoại.',
    noi_dung_ngoai: '0',
    tien_ich_free: '0',
    uudaitrong: 'Trải nghiệm Internet không giới hạn đúng nghĩa. Không hạ băng thông, không giới hạn dung lượng ở tốc độ cao nhất.',
    chu_ky_ngay: '30',
    dangky: 'Soạn UMAX300 gửi 191',
    huygiahan: 'Soạn HUY UMAX300 gửi 191',
    huygoicuoc: 'Soạn HUYDATA UMAX300 gửi 191'
  },
  {
    id: 'st90n',
    ten: 'ST90N',
    dohot: 'Hot',
    phan_loai_goi: 'Data',
    gia: 90000,
    phan_khuc_gia: 'Trung_binh',
    data_theo_ngay: '120 GB (4 GB/ngày)',
    free_ngoai_mang: '0',
    free_noi_mang: '0',
    tienich: '0',
    sms: '0',
    dieu_kien_dang_ky: 'Thuê bao di động trả trước mới kích hoạt từ ngày 01/06/2022.',
    chinh_sach_ap_dung: 'Hết 4GB dừng truy cập trong ngày, hôm sau cộng tiếp.',
    noi_dung_ngoai: '0',
    tien_ich_free: '0',
    uudaitrong: 'Gói siêu data tiết kiệm: Chỉ với 90k/tháng có ngay 4GB data tốc độ cao/ngày. Thích hợp cho học sinh, sinh viên.',
    chu_ky_ngay: '30',
    dangky: 'Soạn ST90N gửi 191',
    huygiahan: 'Soạn HUY ST90N gửi 191',
    huygoicuoc: 'Soạn HUYDATA ST90N gửi 191'
  },
  {
    id: 'v90c',
    ten: 'V90C',
    dohot: 'normal',
    phan_loai_goi: 'Combo',
    gia: 90000,
    phan_khuc_gia: 'Trung_binh',
    data_theo_ngay: '30 GB (1 GB/ngày)',
    free_ngoai_mang: '0',
    free_noi_mang: '1000 phút nội mạng',
    tienich: '0',
    sms: '0',
    dieu_kien_dang_ky: 'Thuê bao trả trước nằm trong danh sách khuyến mãi.',
    chinh_sach_ap_dung: 'Miễn phí cuộc gọi nội mạng dưới 20 phút, miễn phí data xem TikTok.',
    noi_dung_ngoai: 'TikTok',
    tien_ich_free: '0',
    uudaitrong: 'Gói combo tiết kiệm: 1GB data/ngày, miễn phí thoại nội mạng dưới 20 phút và miễn phí data truy cập ứng dụng TikTok.',
    chu_ky_ngay: '30',
    dangky: 'Soạn V90C gửi 191',
    huygiahan: 'Soạn HUY V90C gửi 191',
    huygoicuoc: 'Soạn HUYDATA V90C gửi 191'
  },
  {
    id: 'st5k',
    ten: 'ST5K',
    dohot: 'normal',
    phan_loai_goi: 'Data',
    gia: 5000,
    phan_khuc_gia: 'Gia_re',
    data_theo_ngay: '500 MB',
    free_ngoai_mang: '0',
    free_noi_mang: '0',
    tienich: '0',
    sms: '0',
    dieu_kien_dang_ky: 'Dành cho tất cả thuê bao di động Viettel.',
    chinh_sach_ap_dung: 'Sử dụng đến 24h cùng ngày đăng ký.',
    noi_dung_ngoai: '0',
    tien_ich_free: '0',
    uudaitrong: 'Gói data ngày siêu tốc: 500MB sử dụng đến 24h ngày đăng ký. Thích hợp chữa cháy khi ra đường không có wifi.',
    chu_ky_ngay: '1',
    dangky: 'Soạn ST5K gửi 191',
    huygiahan: 'Soạn HUY ST5K gửi 191',
    huygoicuoc: 'Soạn HUYDATA ST5K gửi 191'
  },
  {
    id: 'st15k',
    ten: 'ST15K',
    dohot: 'normal',
    phan_loai_goi: 'Data',
    gia: 15000,
    phan_khuc_gia: 'Gia_re',
    data_theo_ngay: '3 GB',
    free_ngoai_mang: '0',
    free_noi_mang: '0',
    tienich: '0',
    sms: '0',
    dieu_kien_dang_ky: 'Dành cho mọi thuê bao di động trả trước và trả sau.',
    chinh_sach_ap_dung: 'Hết 3GB ngừng truy cập hoặc tính theo gói chính.',
    noi_dung_ngoai: '0',
    tien_ich_free: '0',
    uudaitrong: 'Gói data ngắn hạn 3 ngày: 3GB data tốc độ cao sử dụng trong vòng 3 ngày kể từ thời điểm đăng ký thành công.',
    chu_ky_ngay: '3',
    dangky: 'Soạn ST15K gửi 191',
    huygiahan: 'Soạn HUY ST15K gửi 191',
    huygoicuoc: 'Soạn HUYDATA ST15K gửi 191'
  },
  {
    id: 'st30k',
    ten: 'ST30K',
    dohot: 'Hot',
    phan_loai_goi: 'Data',
    gia: 30000,
    phan_khuc_gia: 'Gia_re',
    data_theo_ngay: '7 GB',
    free_ngoai_mang: '0',
    free_noi_mang: '0',
    tienich: '0',
    sms: '0',
    dieu_kien_dang_ky: 'Dành cho tất cả thuê bao di động trả trước và trả sau Viettel.',
    chinh_sach_ap_dung: 'Sử dụng trong 7 ngày, hết dung lượng dừng truy cập.',
    noi_dung_ngoai: '0',
    tien_ich_free: '0',
    uudaitrong: 'Gói data tuần tiện lợi: Có ngay 7GB data tốc độ cao sử dụng trong vòng 7 ngày. Phù hợp cho những chuyến du lịch ngắn ngày.',
    chu_ky_ngay: '7',
    dangky: 'Soạn ST30K gửi 191',
    huygiahan: 'Soạn HUY ST30K gửi 191',
    huygoicuoc: 'Soạn HUYDATA ST30K gửi 191'
  },
  {
    id: 'v50c',
    ten: 'V50C',
    dohot: 'normal',
    phan_loai_goi: 'Combo',
    gia: 50000,
    phan_khuc_gia: 'Gia_re',
    data_theo_ngay: '3 GB (100 MB/ngày)',
    free_ngoai_mang: '0',
    free_noi_mang: '1000 phút nội mạng',
    tienich: '0',
    sms: '0',
    dieu_kien_dang_ky: 'Thuê bao trả trước nằm trong danh sách khuyến mãi hoặc lâu năm.',
    chinh_sach_ap_dung: 'Miễn phí cuộc gọi nội mạng dưới 10 phút (tối đa 1000 phút).',
    noi_dung_ngoai: '0',
    tien_ich_free: '0',
    uudaitrong: 'Gói combo giá siêu rẻ chỉ 50k/tháng: 3GB data tốc độ cao, miễn phí tất cả cuộc gọi nội mạng dưới 10 phút.',
    chu_ky_ngay: '30',
    dangky: 'Soạn V50C gửi 191',
    huygiahan: 'Soạn HUY V50C gửi 191',
    huygoicuoc: 'Soạn HUYDATA V50C gửi 191'
  },
  {
    id: 'st70n',
    ten: 'ST70N',
    dohot: 'normal',
    phan_loai_goi: 'Data',
    gia: 70000,
    phan_khuc_gia: 'Trung_binh',
    data_theo_ngay: '90 GB (3 GB/ngày)',
    free_ngoai_mang: '0',
    free_noi_mang: '0',
    tienich: '0',
    sms: '0',
    dieu_kien_dang_ky: 'Thuê bao di động trả trước thuộc danh sách ưu đãi đặc biệt.',
    chinh_sach_ap_dung: 'Hết 3GB dừng truy cập trong ngày, hôm sau cộng tiếp.',
    noi_dung_ngoai: '0',
    tien_ich_free: '0',
    uudaitrong: 'Gói data ưu đãi tầm trung: Có ngay 3GB data tốc độ cao mỗi ngày (tổng 90GB/tháng) với chi phí vô cùng phải chăng.',
    chu_ky_ngay: '30',
    dangky: 'Soạn ST70N gửi 191',
    huygiahan: 'Soạn HUY ST70N gửi 191',
    huygoicuoc: 'Soạn HUYDATA ST70N gửi 191'
  },
  {
    id: 'st120n',
    ten: 'ST120N',
    dohot: 'Hot',
    phan_loai_goi: 'Data',
    gia: 120000,
    phan_khuc_gia: 'Trung_binh',
    data_theo_ngay: '120 GB (4 GB/ngày)',
    free_ngoai_mang: '0',
    free_noi_mang: '0',
    tienich: 'TV360 Standard',
    sms: '0',
    dieu_kien_dang_ky: 'Tất cả các thuê bao trả trước Viettel kích hoạt mới.',
    chinh_sach_ap_dung: 'Miễn phí xem truyền hình trên ứng dụng TV360.',
    noi_dung_ngoai: 'TV360',
    tien_ich_free: 'TV360 Standard',
    uudaitrong: 'Gói siêu data giải trí: 4GB/ngày tốc độ cao kèm miễn phí xem truyền hình Standard trên ứng dụng TV360.',
    chu_ky_ngay: '30',
    dangky: 'Soạn ST120N gửi 191',
    huygiahan: 'Soạn HUY ST120N gửi 191',
    huygoicuoc: 'Soạn HUYDATA ST120N gửi 191'
  },
  {
    id: 'v150c',
    ten: 'V150C',
    dohot: 'normal',
    phan_loai_goi: 'Combo',
    gia: 150000,
    phan_khuc_gia: 'Trung_binh',
    data_theo_ngay: '90 GB (3 GB/ngày)',
    free_ngoai_mang: '50 phút ngoại mạng',
    free_noi_mang: '1000 phút nội mạng',
    tienich: 'Lifebox 25GB',
    sms: '0',
    dieu_kien_dang_ky: 'Thuê bao trả trước nằm trong danh sách khuyến mãi của hệ thống.',
    chinh_sach_ap_dung: 'Miễn phí các cuộc gọi nội mạng dưới 20 phút, miễn phí 25GB lưu trữ Lifebox.',
    noi_dung_ngoai: '0',
    tien_ich_free: 'Lifebox 25GB',
    uudaitrong: 'Combo tiện ích vượt trội: 3GB/ngày, miễn phí cuộc gọi dưới 20 phút nội mạng, 50 phút ngoại mạng và 25GB dung lượng Lifebox.',
    chu_ky_ngay: '30',
    dangky: 'Soạn V150C gửi 191',
    huygiahan: 'Soạn HUY V150C gửi 191',
    huygoicuoc: 'Soạn HUYDATA V150C gửi 191'
  }
];

export const MOCK_USERS: User[] = [
  {
    id: 'user_01',
    name: 'Nguyễn Văn A',
    phoneNumber: '0987654321',
    email: 'vana@gmail.com',
    balance: 150000,
    activePackages: [
      {
        packageId: 'mxh100',
        activatedAt: '2026-06-15T08:00:00Z',
        expiresAt: '2026-07-15T08:00:00Z'
      },
      {
        packageId: 'st5k',
        activatedAt: '2026-07-01T08:00:00Z',
        expiresAt: '2026-07-02T08:00:00Z'
      },
      {
        packageId: 'st15k',
        activatedAt: '2026-06-30T10:00:00Z',
        expiresAt: '2026-07-03T10:00:00Z'
      }
    ],
    role: 'customer'
  },
  {
    id: 'user_02',
    name: 'Trần Thị B',
    phoneNumber: '0912345678',
    email: 'thib@gmail.com',
    balance: 500000,
    activePackages: [
      {
        packageId: 'sd135',
        activatedAt: '2026-06-20T10:00:00Z',
        expiresAt: '2026-07-20T10:00:00Z'
      },
      {
        packageId: 'v120c',
        activatedAt: '2026-06-25T12:00:00Z',
        expiresAt: '2026-07-25T12:00:00Z'
      }
    ],
    role: 'customer'
  },
  {
    id: 'admin_01',
    name: 'Lê Văn Quản Trị',
    phoneNumber: '0900000001',
    email: 'admin@viettel.vn',
    balance: 0,
    activePackages: [],
    role: 'admin'
  }
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_01',
    userId: 'user_01',
    type: 'deposit',
    amount: 200000,
    paymentMethod: 'VietQR',
    status: 'success',
    createdAt: '2026-06-15T07:45:00Z'
  },
  {
    id: 'tx_02',
    userId: 'user_01',
    type: 'subscribe',
    amount: 100000,
    packageName: 'MXH100',
    status: 'success',
    createdAt: '2026-06-15T08:00:00Z'
  },
  {
    id: 'tx_03',
    userId: 'user_01',
    type: 'deposit',
    amount: 50000,
    paymentMethod: 'Momo',
    status: 'success',
    createdAt: '2026-06-25T14:30:00Z'
  },
  {
    id: 'tx_04',
    userId: 'user_02',
    type: 'deposit',
    amount: 500000,
    paymentMethod: 'VietQR',
    status: 'success',
    createdAt: '2026-06-20T09:50:00Z'
  },
  {
    id: 'tx_05',
    userId: 'user_02',
    type: 'subscribe',
    amount: 135000,
    packageName: 'SD135',
    status: 'success',
    createdAt: '2026-06-20T10:00:00Z'
  },
  {
    id: 'tx_06',
    userId: 'user_02',
    type: 'subscribe',
    amount: 120000,
    packageName: 'V120C',
    status: 'success',
    createdAt: '2026-06-25T12:00:00Z'
  },
  {
    id: 'tx_07',
    userId: 'user_01',
    type: 'subscribe',
    amount: 5000,
    packageName: 'ST5K',
    status: 'success',
    createdAt: '2026-07-01T08:00:00Z'
  },
  {
    id: 'tx_08',
    userId: 'user_01',
    type: 'subscribe',
    amount: 15000,
    packageName: 'ST15K',
    status: 'success',
    createdAt: '2026-06-30T10:00:00Z'
  },
  {
    id: 'tx_09',
    userId: 'user_02',
    type: 'deposit',
    amount: 100000,
    paymentMethod: 'Momo',
    status: 'success',
    createdAt: '2026-06-28T16:00:00Z'
  },
  {
    id: 'tx_10',
    userId: 'user_01',
    type: 'deposit',
    amount: 50000,
    paymentMethod: 'VietQR',
    status: 'success',
    createdAt: '2026-06-29T11:00:00Z'
  }
];

export const MOCK_FAQS: FAQ[] = [
  {
    id: 'faq_01',
    question: 'Làm thế nào để đăng ký gói cước di động?',
    answer: 'Bạn chỉ cần chọn gói cước phù hợp trên trang danh sách gói cước, nhấn nút "Đăng ký" và xác nhận thanh toán. Yêu cầu là tài khoản chính của bạn phải đủ số dư bằng giá trị gói cước.',
    category: 'Đăng ký'
  },
  {
    id: 'faq_02',
    question: 'Sau khi hết dung lượng tốc độ cao trong ngày, tôi có truy cập tiếp được không?',
    answer: 'Tùy thuộc vào gói cước bạn đăng ký. Đối với hầu hết các gói như SD135, V120C, hệ thống sẽ tạm dừng kết nối Internet để tránh phát sinh cước. Đối với gói UMAX300, bạn vẫn tiếp tục sử dụng bình thường không giới hạn tốc độ cao.',
    category: 'Đăng ký'
  },
  {
    id: 'faq_03',
    question: 'Làm thế nào để nạp tiền vào tài khoản ảo trên website?',
    answer: 'Bạn vào trang "Hồ sơ cá nhân", chọn mục "Nạp tiền". Sau đó nhập số tiền mong muốn, chọn hình thức thanh toán (VietQR, ví điện tử) và bấm xác nhận. Tài khoản của bạn sẽ lập tức được cộng số dư để trải nghiệm thử.',
    category: 'Nạp tiền'
  },
  {
    id: 'faq_04',
    question: 'Hủy gói cước Viettel như thế nào?',
    answer: 'Bạn có thể hủy gia hạn gói bằng cách soạn tin HUY [TênGói] gửi 191, hoặc hủy hoàn toàn gói cước soạn HUYDATA [TênGói] gửi 191. Trên giao diện này, bạn cũng có thể xem danh sách gói đã đăng ký và nhấn nút Hủy gia hạn nhanh.',
    category: 'Hỗ trợ chung'
  },
  {
    id: 'faq_05',
    question: 'Tôi có thể dùng chung gói cước mạng xã hội với gói data thường không?',
    answer: 'Hoàn toàn được. Ví dụ bạn có thể đăng ký gói MXH100 để được miễn phí 100% dung lượng YouTube/TikTok/Facebook và đăng ký thêm gói ST5K/ST15K để sử dụng data thông thường cho các nhu cầu lướt web khác.',
    category: 'Hỗ trợ chung'
  }
];

export const DEFAULT_CHATBOT_CONFIG: ChatbotConfig = {
  systemPrompt: 'Bạn là trợ lý ảo thông minh Viettel AI, chuyên tư vấn các gói cước di động phù hợp nhất với nhu cầu sử dụng mạng, cuộc gọi và mạng xã hội của khách hàng. Hãy trả lời thân thiện, ngắn gọn và cung cấp nút đăng ký nhanh cho người dùng.',
  trainingKeywords: [
    {
      keyword: 'data',
      response: 'Nếu bạn có nhu cầu lướt web dung lượng lớn, tôi xin đề xuất gói **SD135** (5GB/ngày, 135k/tháng) hoặc **ST90N** (4GB/ngày, 90k/tháng). Bạn có muốn đăng ký ngay không?',
      suggestedPackageId: 'sd135'
    },
    {
      keyword: 'mạng xã hội',
      response: 'Đối với nhu cầu giải trí, xem video nhiều, bạn nên chọn gói **MXH100** (100k/tháng) hoặc **MXH120** (120k/tháng) để được miễn phí không giới hạn dung lượng truy cập TikTok, YouTube, Facebook nhé!',
      suggestedPackageId: 'mxh100'
    },
    {
      keyword: 'gọi',
      response: 'Nếu bạn thường xuyên gọi điện, gói **V120C** (120k/tháng) sẽ miễn phí cuộc gọi dưới 20 phút nội mạng và tặng thêm 50 phút ngoại mạng kèm 2GB/ngày. Hoặc gói **V50C** chỉ với 50k/tháng!',
      suggestedPackageId: 'v120c'
    },
    {
      keyword: 'rẻ',
      response: 'Gói cước rẻ nhất tháng là **V50C** (50k/tháng) có 3GB data và gọi nội mạng thoải mái. Nếu dùng theo ngày, bạn có thể tham khảo gói **ST5K** chỉ với 5.000đ/ngày!',
      suggestedPackageId: 'v50c'
    },
    {
      keyword: 'khảo sát',
      response: 'Nếu bạn chưa chắc chắn về gói cước mình cần, hãy thực hiện khảo sát nhu cầu ngắn của chúng tôi để nhận gợi ý chính xác nhất nhé.',
      suggestedPackageId: 'survey'
    }
  ]
};
