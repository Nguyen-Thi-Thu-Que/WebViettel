import type { Package, User, FAQ, ChatbotConfig, Transaction } from '../types';

export const MOCK_PACKAGES: Package[] = [
  {
    id: 'mxh100',
    name: 'MXH100',
    price: 100000,
    duration: 'monthly',
    durationDays: 30,
    dataLimit: '30 GB (1 GB/ngày)',
    dataPerDayGb: 1,
    voiceFreeInternalMin: 0,
    voiceFreeExternalMin: 0,
    socialFreeApps: ['TikTok', 'YouTube', 'Facebook'],
    description: 'Miễn phí 100% dung lượng data tốc độ cao truy cập TikTok, YouTube, Facebook và nhắn tin Messenger. Tặng thêm 30 GB data/tháng.',
    terms: [
      'Gói cước áp dụng cho thuê bao di động trả trước kích hoạt mới từ ngày 01/07/2023.',
      'Data miễn phí mạng xã hội chỉ áp dụng trên app chính thức.',
      'Hết 1GB/ngày dừng truy cập Internet, hôm sau cộng tiếp.'
    ],
    conditions: 'Thuê bao thuộc danh sách ưu đãi hoặc kích hoạt mới.',
    isPopular: true,
    category: 'social',
    rating: 4.9,
    registrationsCount: 245000,
    tags: ['Mạng xã hội', 'Bán chạy nhất', 'Free TikTok']
  },
  {
    id: 'sd135',
    name: 'SD135',
    price: 135000,
    duration: 'monthly',
    durationDays: 30,
    dataLimit: '150 GB (5 GB/ngày)',
    dataPerDayGb: 5,
    voiceFreeInternalMin: 0,
    voiceFreeExternalMin: 0,
    socialFreeApps: [],
    description: 'Siêu ưu đãi DATA dung lượng khủng 5GB tốc độ cao mỗi ngày (tổng 150GB/tháng). Giá rẻ nhất phân khúc siêu data.',
    terms: [
      'Áp dụng cho thuê bao di động trả trước kích hoạt mới hoặc nhận được tin nhắn khuyến mại.',
      'Hết 5GB/ngày ngừng truy cập. Có thể mua thêm gói ngày.',
      'Gói tự động gia hạn sau 30 ngày.'
    ],
    conditions: 'Thuê bao nhận được tin nhắn hoặc kích hoạt từ ngày 01/01/2024.',
    isPopular: true,
    category: 'data',
    rating: 4.8,
    registrationsCount: 189000,
    tags: ['Siêu Data', 'Data khủng', '5GB/Ngày']
  },
  {
    id: 'v120c',
    name: 'V120C',
    price: 120000,
    duration: 'monthly',
    durationDays: 30,
    dataLimit: '60 GB (2 GB/ngày)',
    dataPerDayGb: 2,
    voiceFreeInternalMin: 1000, // free calls under 20m, max 1000m
    voiceFreeExternalMin: 50,
    socialFreeApps: ['TikTok'],
    description: 'Gói combo Quốc dân: 2GB data/ngày, miễn phí các cuộc gọi nội mạng dưới 20 phút (tối đa 1000 phút), miễn phí 50 phút gọi ngoại mạng và miễn phí data xem TikTok.',
    terms: [
      'Áp dụng cho thuê bao trả trước kích hoạt mới.',
      'Ưu đãi thoại nội mạng áp dụng cho cuộc gọi dưới 20 phút, nếu quá sẽ tính cước từ phút 20.',
      'Hết 2GB/ngày dừng truy cập Internet.'
    ],
    conditions: 'Thuê bao thuộc danh sách khuyến mãi của hệ thống.',
    isPopular: true,
    category: 'combo',
    rating: 4.7,
    registrationsCount: 312000,
    tags: ['Combo', 'Quốc Dân', 'Thoại + Data']
  },
  {
    id: 'mxh120',
    name: 'MXH120',
    price: 120000,
    duration: 'monthly',
    durationDays: 30,
    dataLimit: '30 GB (1 GB/ngày)',
    dataPerDayGb: 1,
    voiceFreeInternalMin: 1000, // calls under 10m
    voiceFreeExternalMin: 30,
    socialFreeApps: ['TikTok', 'YouTube', 'Facebook'],
    description: 'Bản nâng cấp của MXH100: Miễn phí TikTok, YouTube, Facebook cộng thêm miễn phí thoại nội mạng (cuộc gọi < 10 phút, tối đa 1000 phút) và 30 phút ngoại mạng.',
    terms: [
      'Gói cước có tính năng tự động gia hạn.',
      'Hết 1GB/ngày dừng truy cập, hôm sau cộng tiếp.',
      'Thoại nội mạng quá 10 phút/cuộc sẽ tính cước từ phút thứ 10.'
    ],
    conditions: 'Thuê bao kích hoạt mới hoặc được ưu đãi đặc biệt.',
    isPopular: false,
    category: 'combo',
    rating: 4.8,
    registrationsCount: 95000,
    tags: ['Combo MXH', 'Thoại Tẹt Ga']
  },
  {
    id: 'v200c',
    name: 'V200C',
    price: 200000,
    duration: 'monthly',
    durationDays: 30,
    dataLimit: '120 GB (4 GB/ngày)',
    dataPerDayGb: 4,
    voiceFreeInternalMin: 1000,
    voiceFreeExternalMin: 100,
    socialFreeApps: ['TikTok'],
    description: 'Combo VIP cho người dùng bận rộn: 4GB data tốc độ cao/ngày, miễn phí cuộc gọi nội mạng dưới 20 phút, 100 phút gọi ngoại mạng và miễn phí data xem TikTok.',
    terms: [
      'Miễn phí 100GB lưu trữ trên Lifebox.',
      'Hết 4GB/ngày dừng truy cập Internet.',
      'Gia hạn tự động khi tài khoản gốc đủ 200.000đ.'
    ],
    conditions: 'Thuê bao di động trả trước kích hoạt mới hoặc thuộc danh sách.',
    isPopular: false,
    category: 'combo',
    rating: 4.6,
    registrationsCount: 64000,
    tags: ['VIP', 'Data cực lớn', '100 phút Ngoại mạng']
  },
  {
    id: 'umax300',
    name: 'UMAX300',
    price: 300000,
    duration: 'monthly',
    durationDays: 30,
    dataLimit: 'Không giới hạn tốc độ cao',
    dataPerDayGb: 99,
    voiceFreeInternalMin: 0,
    voiceFreeExternalMin: 0,
    socialFreeApps: [],
    description: 'Trải nghiệm Internet không giới hạn đúng nghĩa. Không hạ băng thông, không giới hạn dung lượng ở tốc độ cao nhất.',
    terms: [
      'Áp dụng cho mọi thuê bao di động trả trước và trả sau Viettel.',
      'Dung lượng sử dụng tốc độ cao thực tế không giới hạn.',
      'Không bao gồm phút gọi miễn phí.'
    ],
    conditions: 'Tất cả thuê bao di động Viettel đang hoạt động 2 chiều.',
    isPopular: false,
    category: 'data',
    rating: 4.5,
    registrationsCount: 42000,
    tags: ['Không Giới Hạn', 'Max Speed']
  },
  {
    id: 'st90n',
    name: 'ST90N',
    price: 90000,
    duration: 'monthly',
    durationDays: 30,
    dataLimit: '120 GB (4 GB/ngày)',
    dataPerDayGb: 4,
    voiceFreeInternalMin: 0,
    voiceFreeExternalMin: 0,
    socialFreeApps: [],
    description: 'Gói siêu data tiết kiệm: Chỉ với 90k/tháng có ngay 4GB data tốc độ cao/ngày (tổng 120GB/tháng). Thích hợp cho học sinh, sinh viên.',
    terms: [
      'Áp dụng cho thuê bao kích hoạt mới từ 01/06/2022.',
      'Hết 4GB dừng truy cập trong ngày.',
      'Gia hạn tự động hàng tháng.'
    ],
    conditions: 'Thuê bao trả trước mới kích hoạt.',
    isPopular: true,
    category: 'data',
    rating: 4.7,
    registrationsCount: 173000,
    tags: ['Giá rẻ', 'Sinh viên', '4GB/Ngày']
  },
  {
    id: 'v90c',
    name: 'V90C',
    price: 90000,
    duration: 'monthly',
    durationDays: 30,
    dataLimit: '30 GB (1 GB/ngày)',
    dataPerDayGb: 1,
    voiceFreeInternalMin: 1000, // calls < 20m
    voiceFreeExternalMin: 0,
    socialFreeApps: ['TikTok'],
    description: 'Gói combo tiết kiệm: 1GB data/ngày, miễn phí thoại nội mạng dưới 20 phút (tối đa 1000 phút) và miễn phí data truy cập ứng dụng TikTok.',
    terms: [
      'Gói cước tự động gia hạn sau 30 ngày.',
      'Hết 1GB dừng truy cập Internet.',
      'Không bao gồm phút gọi ngoại mạng miễn phí.'
    ],
    conditions: 'Thuê bao trả trước nằm trong danh sách khuyến mãi.',
    isPopular: false,
    category: 'combo',
    rating: 4.4,
    registrationsCount: 88000,
    tags: ['Combo Rẻ', 'Thoại Nội Mạng']
  },
  {
    id: 'st5k',
    name: 'ST5K',
    price: 5000,
    duration: 'daily',
    durationDays: 1,
    dataLimit: '500 MB',
    dataPerDayGb: 0.5,
    voiceFreeInternalMin: 0,
    voiceFreeExternalMin: 0,
    socialFreeApps: [],
    description: 'Gói data ngày siêu tốc: 500MB sử dụng đến 24h ngày đăng ký. Thích hợp chữa cháy khi ra đường không có wifi.',
    terms: [
      'Sử dụng đến 24h cùng ngày đăng ký.',
      'Hết 500MB tính cước theo gói Mobile Internet đang sử dụng (nếu có).',
      'Tự động gia hạn hàng ngày.'
    ],
    conditions: 'Dành cho tất cả thuê bao di động Viettel.',
    isPopular: false,
    category: 'data',
    rating: 4.3,
    registrationsCount: 520000,
    tags: ['Gói Ngày', 'Siêu rẻ']
  },
  {
    id: 'st15k',
    name: 'ST15K',
    price: 15000,
    duration: 'weekly',
    durationDays: 3,
    dataLimit: '3 GB',
    dataPerDayGb: 1,
    voiceFreeInternalMin: 0,
    voiceFreeExternalMin: 0,
    socialFreeApps: [],
    description: 'Gói data ngắn hạn 3 ngày: 3GB data tốc độ cao sử dụng trong vòng 3 ngày kể từ thời điểm đăng ký thành công.',
    terms: [
      'Sử dụng trong 3 ngày.',
      'Hết 3GB ngừng truy cập hoặc tính theo gói chính.',
      'Có tính năng tự động gia hạn.'
    ],
    conditions: 'Dành cho mọi thuê bao di động trả trước và trả sau.',
    isPopular: false,
    category: 'data',
    rating: 4.5,
    registrationsCount: 142000,
    tags: ['Gói 3 Ngày', 'Ngắn hạn']
  },
  {
    id: 'st30k',
    name: 'ST30K',
    price: 30000,
    duration: 'weekly',
    durationDays: 7,
    dataLimit: '7 GB',
    dataPerDayGb: 1,
    voiceFreeInternalMin: 0,
    voiceFreeExternalMin: 0,
    socialFreeApps: [],
    description: 'Gói data tuần tiện lợi: Có ngay 7GB data tốc độ cao sử dụng trong vòng 7 ngày. Phù hợp cho những chuyến du lịch ngắn ngày.',
    terms: [
      'Sử dụng trong 7 ngày.',
      'Hết 7GB ngừng truy cập Internet.',
      'Tự động gia hạn vào ngày thứ 7.'
    ],
    conditions: 'Dành cho tất cả thuê bao di động trả trước và trả sau Viettel.',
    isPopular: true,
    category: 'data',
    rating: 4.6,
    registrationsCount: 231000,
    tags: ['Gói Tuần', 'Du lịch']
  },
  {
    id: 'v50c',
    name: 'V50C',
    price: 50000,
    duration: 'monthly',
    durationDays: 30,
    dataLimit: '3 GB (100 MB/ngày)',
    dataPerDayGb: 0.1,
    voiceFreeInternalMin: 1000, // calls < 10m
    voiceFreeExternalMin: 0,
    socialFreeApps: [],
    description: 'Gói combo giá siêu rẻ chỉ 50k/tháng: 3GB data tốc độ cao, miễn phí tất cả cuộc gọi nội mạng dưới 10 phút (tối đa 1000 phút).',
    terms: [
      'Áp dụng cho thuê bao nằm trong danh sách khuyến mãi.',
      'Hết 3GB dừng truy cập hoặc trừ vào gói data chính.',
      'Mỗi cuộc gọi nội mạng được miễn phí tối đa 10 phút.'
    ],
    conditions: 'Thuê bao trả trước kích hoạt lâu năm hoặc thuộc danh sách ưu đãi.',
    isPopular: false,
    category: 'combo',
    rating: 4.2,
    registrationsCount: 67000,
    tags: ['Siêu Rẻ', 'Gọi nội mạng', '50k']
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
