# Báo cáo Phân tích Cấu trúc Mã nguồn WebViettel

Hệ thống quản lý, tra cứu, so sánh và đăng ký các gói cước di động Viettel là nền tảng trực tuyến giúp người dùng dễ dàng tìm kiếm và lựa chọn gói cước tối ưu. Website tích hợp các bộ lọc thông minh, công cụ khảo sát nhu cầu cá nhân hóa và tính năng thanh toán ví điện tử giả lập. Hệ thống cũng hỗ trợ kết nối ví MetaMask để mang lại trải nghiệm thanh toán hiện đại trên mạng thử nghiệm Sepolia.

---

## Công nghệ sử dụng

- **Frontend**: React + TypeScript + TailwindCSS
- **Backend**: Node.js + Express
- **Database**: MongoDB
- **Web3 Integration**: MetaMask + Sepolia

---

## 1. Luồng Cấu hình (Configuration Flows)

### Các file cấu hình chính
- **`server/.env`**: Thiết lập cấu hình kết nối cơ sở dữ liệu, cổng chạy dịch vụ, bảo mật token và tích hợp blockchain tại backend.
- **`client/.env`**: Thiết lập cấu hình kết nối API backend, thông số mạng blockchain thử nghiệm và ví nhận coin ảo tại frontend.

### Các biến/thông số cấu hình quan trọng
- **Cấu hình Backend (`server/.env`)**:
  - `MONGODB_URI`: Đường dẫn kết nối tới cơ sở dữ liệu MongoDB Atlas (`mongodb+srv://root:Que231104@cluster0.e02x0sj.mongodb.net/goicuocviettel?retryWrites=true&w=majority`).
  - `PORT`: Cổng khởi chạy dịch vụ backend Express (`5000`).
  - `JWT_SECRET`: Khóa bí mật dùng để mã hóa và xác thực chữ ký token JWT (`@Viettel231104`).
  - `RECEIVER_WALLET`: Địa chỉ ví nhận tiền mã hóa ETH Sepolia giả lập (`0x26FE0B08bB4d0BCc05e04248770e6E2731a04137`).
  - `ETH_EXCHANGE_RATE`: Tỷ giá quy đổi giả định giữa VND và ETH (`75000000`).
  - `RPC_URL`: Đường dẫn kết nối node mạng thử nghiệm Sepolia (`https://sepolia.drpc.org`).
- **Cấu hình Frontend (`client/.env`)**:
  - `VITE_API_URL`: Địa chỉ API của backend (`http://localhost:5000`).
  - `VITE_NETWORK_NAME`: Tên mạng blockchain được sử dụng (`Sepolia`).
  - `VITE_CHAIN_ID`: ID mạng của blockchain Sepolia dạng thập phân (`11155111`).
  - `VITE_RPC_URL`: Đường dẫn kết nối node mạng Sepolia (`https://sepolia.drpc.org`).
  - `VITE_BLOCK_EXPLORER`: Địa chỉ trang theo dõi khối giao dịch Sepolia (`https://sepolia.etherscan.io`).
  - `VITE_RECEIVER_WALLET`: Địa chỉ ví nhận tiền mã hóa Sepolia giả lập (`0x26FE0B08bB4d0BCc05e04248770e6E2731a04137`).
  - `VITE_ETH_EXCHANGE_RATE`: Tỷ giá quy đổi giữa VND và ETH (`75000000`).

## 2. Luồng Cơ sở dữ liệu (Database Flows)

### Các bảng (collections) / model được định nghĩa
- **`Account`** (collection `accounts`): Quản lý tài khoản người dùng và quản trị viên.
  - Các trường: `user_id`, `fullname`, `phone_number`, `password`, `balance`, `role`, `subscription_type`, `is_loyal_customer`, `status`, `wallet_address`, `created_at`.
- **`Package`** (collection `goi_cuoc`): Lưu trữ thông tin chi tiết và cú pháp sử dụng của các gói cước di động Viettel.
  - Các trường chính: `package_id` (alias: `id`), `ma_goi`, `ten`, `gia`, `chu_ky_ngay`, `data_theo_ngay`, `free_noi_mang`, `free_ngoai_mang`, `noi_dung_ngoai`, `tien_ich_free`, `dohot`, `phan_loai_goi`, `dieu_kien_dang_ky`, `chinh_sach_ap_dung`, `dangky`, `huygiahan`, `huygoicuoc`, `doi_tuong_ap_dung`, `uudaitrong`, `is_auto_renew`, `goi_thay_the`, `do_uu_tien`, `Nhom_Goi`.
  - Các trường mở rộng từ file CSV: `loai`, `loai_mang`, `dulieu`, `thoai`, `noidung`, `uudaingoai`, `thoigian`, `tang`, `taggoiy`, `cycle_type`, `service_group`, `registration_policy`, `duration`, `support_auto_renew`, `validity_mode`.
- **`UserSubscription`** (collection `user_subscriptions`): Quản lý trạng thái và thời hạn sử dụng các gói cước mà người dùng đã đăng ký.
  - Các trường: `userId`, `packageId`, `registeredAt`, `activatedAt`, `startedAt`, `expiresAt`, `status`, `autoRenew`, `cycle`, `duration`, `cycleType`, `cancelledAt`, `cancelReason`, `replacedAt`, `replacedBySubscriptionId`.
- **`Deposit`** (collection `deposits`): Lưu trữ nhật ký nạp tiền từ cổng thanh toán truyền thống hoặc blockchain.
  - Các trường: `deposit_id`, `user_id`, `amountVND`, `amountETH`, `exchangeRate`, `txHash`, `network`, `status`, `walletAddress`, `amount` (legacy), `fiat_equivalent` (legacy), `tx_hash` (legacy), `created_at`.
- **`FAQ`** (collection `faqs`): Quản lý các câu hỏi thường gặp hỗ trợ khách hàng.
  - Các trường: `id`, `question`, `answer`, `category`.
- **`ChatbotConfig`** (collection `chatbot_configs`): Lưu trữ cấu hình hoạt động và huấn luyện phản hồi của chatbot AI.
  - Các trường: `systemPrompt`, `trainingKeywords` (gồm: `keyword`, `response`, `suggestedPackageId`).

### Mối quan hệ chính giữa các bảng
- **`UserSubscription` -> `Account`**: Trường `userId` trong model `UserSubscription` tham chiếu đến trường `user_id` của model `Account`.
- **`UserSubscription` -> `Package`**: Trường `packageId` trong model `UserSubscription` tham chiếu đến trường `package_id` của model `Package`.
- **`UserSubscription` -> `UserSubscription` (đệ quy)**: Trường `replacedBySubscriptionId` tham chiếu đến `_id` của chính bảng `UserSubscription` để xác định gói cước thay thế.
- **`Deposit` -> `Account`**: Trường `user_id` trong model `Deposit` tham chiếu đến trường `user_id` của model `Account`.

## 3. Trạng thái Tính năng (Feature Status)

### Tính năng đã hoàn thiện
- **Xác thực và phân quyền tài khoản**: Đăng nhập, đăng ký tài khoản (hỗ trợ phân biệt loại thuê bao trả trước/trả sau), lấy thông tin cá nhân (`getMe`), cập nhật thông tin cá nhân (họ tên, email), đổi mật khẩu.
- **Quản lý danh sách gói cước**:
  - Tìm kiếm, lọc và phân trang gói cước di động theo danh mục, mức giá, chu kỳ, mạng công nghệ, và các tiện ích đi kèm.
  - Xem chi tiết gói cước di động gồm: Ưu đãi data/gọi thoại, điều kiện áp dụng, chính sách sử dụng, và cú pháp SMS (Đăng ký, Hủy gói, Hủy gia hạn gửi 191).
- **So sánh gói cước**: So sánh thông số chi tiết giữa tối đa 3 gói cước di động và hiển thị nhận xét/khuyên dùng được phân tích tự động bằng thuật toán AI.
- **Khảo sát chọn gói cước (Survey Wizard)**: Khảo sát thói quen sử dụng điện thoại qua 4 bước (ngân sách, data, gọi thoại, ứng dụng mạng xã hội giải trí) để đề xuất ra 3 gói cước tối ưu chi phí từ cơ sở dữ liệu.
- **Tương tác Blockchain Web3**: Kết nối ví MetaMask (hỗ trợ kiểm tra và chuyển đổi mạng sang Sepolia); thực hiện nạp tiền ảo VND vào tài khoản thông qua giao dịch chuyển ETH trên mạng Sepolia; kiểm tra trạng thái xác nhận giao dịch trên blockchain và ghi nhận số dư tài khoản trên backend.
- **Đăng ký & Kiểm tra xung đột gói cước**:
  - Đăng ký gói cước trực tiếp bằng số dư tài khoản.
  - Tự động kiểm tra xung đột gói cước đang sử dụng (Đăng ký song song - ALLOW, Hủy gói cũ và thay thế - REPLACE, Từ chối đăng ký - REJECT).
  - Quản lý trạng thái gói cước (bật/tắt tự động gia hạn, hủy gói cước ngay lập tức, gia hạn lại gói cước).
  - Xem lịch sử đăng ký gói cước, xem lịch sử giao dịch nạp tiền, xem chi tiết giao dịch (Ví gửi, ví nhận, txHash, block explorer).
  - Xóa lịch sử đăng ký gói cước.
- **Quản trị viên (Admin Dashboard & CRUD)**:
  - Dashboard thống kê tổng quan doanh thu, số người dùng, số gói cước, số lượt đăng ký; vẽ biểu đồ SVG theo dõi doanh số doanh thu theo ngày; hiển thị danh sách các hoạt động đăng ký/nạp ví gần đây.
  - CRUD gói cước di động (Xem danh sách, Thêm mới, Sửa thông tin, Xóa gói cước khỏi danh mục).
  - CRUD câu hỏi thường gặp FAQ (Xem danh sách, Thêm mới, Sửa thông tin, Xóa câu hỏi FAQ).
  - Quản lý tài khoản người dùng thuê bao (Xem danh sách, thay đổi loại thuê bao trả trước/sau, thay đổi trạng thái khách hàng thân thiết KHTT, Khóa/Mở khóa tài khoản người dùng).
  - Cấu hình trợ lý ảo Chatbot (Thay đổi chỉ dẫn hệ thống `systemPrompt`, thêm/sửa/xóa từ khóa NLP rule-based huấn luyện đối sánh câu trả lời tự động và liên kết gợi ý gói cước).

### Tính năng chưa hoàn thiện
- **Gia hạn gói cước**: Hàm `renew` trong file `subscriptionController.js` (Dòng 126-132) chưa được viết logic xử lý thực tế, hiện tại chỉ trả về thông báo lỗi "Chức năng gia hạn gói chưa được triển khai" kèm mã trạng thái 501.
- **Khôi phục mật khẩu**: Trang quên mật khẩu (`ForgotPassword.tsx` tại client) chưa được liên kết với API backend. Logic gửi mã OTP di động ảo được hardcode cố định với mã `123456` và sử dụng `setTimeout` giả lập tại giao diện client.

## 4. Nội dung & Tính năng theo từng Trang Giao diện (UI Pages Content)

### Trang chủ (Home) - File `Home.tsx`
- **Các thành phần/nội dung đang hiển thị trên trang**:
  - Banner Hero: Tiêu đề "Lựa chọn gói cước Thông minh hơn cùng AI", đoạn mô tả giới thiệu.
  - Thẻ mẫu mockup của gói cước MXH100 xoay góc nghiêng, chứa nhãn "Đề xuất nhiều nhất", tên gói, giá cước, ưu đãi miễn phí data MXH và dung lượng.
  - Hai nút chuyển hướng: "Tìm gói cước phù hợp (Khảo sát)" và "Xem tất cả gói cước".
  - Danh mục nhu cầu sử dụng: "Gói siêu DATA", "Gói COMBO", "Mạng xã hội" kèm mô tả ngắn và icon biểu diễn tương ứng.
  - Danh sách 4 thẻ gói cước nổi bật khuyên dùng (lọc theo các gói có `dohot !== 'normal'`).
  - Hai thẻ kêu gọi hành động (CTA): Trò chuyện với Trợ lý ảo Viettel AI, Khảo sát tìm gói cước phù hợp.
  - Khối thông tin hạ tầng mạng (KẾT NỐI 5G SIÊU TỐC, PHỦ SÓNG TOÀN QUỐC, HỖ TRỢ CSKH 24/7).
  - Modal đăng ký gói cước (`RegisterModal`).
  - Thanh thông báo trạng thái nổi (Toast Notification).
- **Các tính năng/hành động**:
  - Click nút "Tìm gói cước phù hợp (Khảo sát)" hoặc nút "Bắt đầu khảo sát nhanh" -> Chuyển hướng sang trang `/survey`.
  - Click nút "Xem tất cả gói cước" hoặc liên kết "Tất cả gói cước" -> Chuyển hướng sang trang `/packages`.
  - Click vào ô danh mục nhu cầu -> Chuyển hướng sang `/packages?category=<id_danh_muc>`.
  - Click nút "Đăng ký" trên thẻ gói cước nổi bật -> Mở Modal đăng ký gói cước (nếu chưa đăng nhập, hiển thị thông báo lỗi yêu cầu đăng nhập).
  - Click nút "Bắt đầu Chat ngay" -> Kích hoạt hiển thị khung chat chatbot trợ lý ảo.

### Trang Danh sách gói cước (Packages) - File `Packages.tsx`
- **Các thành phần/nội dung đang hiển thị trên trang**:
  - Thanh điều hướng Breadcrumb.
  - Banner tiêu đề trang "Danh mục gói cước di động" kèm đoạn mô tả ngắn.
  - Thanh bộ lọc và tìm kiếm nâng cao (`AdvancedFilter`): ô tìm kiếm từ khóa, bộ chọn danh mục, bộ chọn chu kỳ, bộ chọn mức giá, bộ chọn mạng di động, bộ chọn tiện ích đi kèm.
  - Thanh công cụ danh sách gói cước (`PackageToolbar`) hiển thị số lượng kết quả tìm thấy và nút đặt lại bộ lọc.
  - Lưới hiển thị danh sách các thẻ gói cước (`PackageCard`).
  - Trạng thái chờ tải dữ liệu dạng khung xương (`LoadingSkeleton`).
  - Trạng thái trống (`EmptyState`) khi không có kết quả tìm kiếm nào phù hợp.
  - Bộ phân trang (`Pagination`).
  - Modal đăng ký gói cước (`RegisterModal`).
  - Thanh thông báo trạng thái nổi (Toast Notification).
- **Các tính năng/hành động**:
  - Tìm kiếm gói cước bằng từ khóa.
  - Lọc danh sách gói cước theo nhiều tiêu chí (Danh mục, mức giá, chu kỳ, mạng công nghệ 4G/5G, tiện ích).
  - Tự động lọc gói cước phù hợp với loại thuê bao và trạng thái khách hàng thân thiết của người dùng đang đăng nhập.
  - Sắp xếp thứ tự gói cước theo giá tăng dần, giá giảm dần, tên gói, gói mới nhất, gói khuyên dùng hoặc gói phổ biến nhất.
  - Đặt lại toàn bộ bộ lọc và từ khóa về mặc định (nút "Đặt lại bộ lọc").
  - Thay đổi trang hiển thị thông qua bộ phân trang.
  - Click đăng ký gói cước -> Mở Modal đăng ký gói cước.

### Trang Chi tiết gói cước (PackageDetail) - File `PackageDetail.tsx`
- **Các thành phần/nội dung đang hiển thị trên trang**:
  - Thanh điều hướng Breadcrumb.
  - Cột bên trái: Hiển thị tên gói, giá cước, chu kỳ sử dụng, ưu đãi data (nếu có), nút "Đăng ký ngay" và nút "Thêm vào so sánh".
  - Cột bên phải:
    - Khối "Nội dung ưu đãi" hiển thị chi tiết quyền lợi của gói cước.
    - Khối "Điều kiện & quy định sử dụng" hiển thị đối tượng áp dụng và chính sách gia hạn.
    - Khối "Cú pháp sử dụng" hiển thị cú pháp gửi 191 (Đăng ký, Hủy gói, Hủy gia hạn) kèm nút sao chép nhanh.
  - Khối "Gói cước liên quan": hiển thị tối đa 3 thẻ gói cước có độ tương đồng cao nhất (tính toán dựa trên thuật toán so sánh category và chu kỳ).
  - Modal xác nhận đăng ký gói cước: hiển thị chi tiết tên gói, giá gói, chu kỳ, phương thức thanh toán, số dư tài khoản hiện tại, số dư dự kiến sau khi trừ tiền, cảnh báo xung đột (Đăng ký song song - ALLOW, thay thế gói cũ - REPLACE, từ chối đăng ký - REJECT), và các nút "Hủy / Xác nhận".
  - Thanh thông báo trạng thái nổi (Toast Notification).
- **Các tính năng/hành động**:
  - Đăng ký gói cước: Click "Đăng ký ngay" -> Thực hiện kiểm tra xung đột gói cước với hệ thống -> Hiển thị Modal xác nhận chi tiết -> Trừ số dư ví ảo và kích hoạt gói cước.
  - Thêm hoặc xóa gói cước khỏi danh sách so sánh (click biểu tượng mũi tên đối lập).
  - Sao chép nhanh cú pháp tin nhắn gửi 191 vào clipboard.
  - Xem và click đăng ký trực tiếp các gói cước liên quan trong danh sách đề xuất.

### Trang So sánh gói cước (Compare) - File `Compare.tsx`
- **Các thành phần/nội dung đang hiển thị trên trang**:
  - Tiêu đề trang "So sánh gói cước" kèm mô tả ngắn.
  - Nút "Xóa danh sách so sánh" (hiển thị khi danh sách đang có gói cước).
  - Trạng thái trống (chưa chọn gói cước nào) hiển thị thông báo, nút "Thêm gói nhanh tại đây" và liên kết duyệt gói cước.
  - Bảng so sánh gói cước đối chiếu các thuộc tính: Giá cước, Chu kỳ sử dụng, Phân loại gói, Ưu đãi DATA, Gọi nội mạng, Gọi ngoại mạng, Free Data Ứng dụng, Tiện ích đi kèm, Mô tả tóm tắt, Thao tác nhanh (Nút đăng ký ngay của từng gói). Tiêu đề mỗi cột gói cước có nút X để xóa gói.
  - Khối "Nhận xét thông minh từ Viettel AI": hiển thị phân tích tự động (Chỉ ra gói rẻ nhất, gói nhiều data nhất, gói tối ưu nghe gọi, gói tối ưu giải trí, và đưa ra gợi ý khuyên dùng cụ thể).
  - Modal chọn thêm nhanh gói cước so sánh (hiển thị danh sách các gói chưa được thêm để chọn và bấm nút "Thêm gói cước").
  - Modal đăng ký gói cước (`RegisterModal`).
  - Thanh thông báo trạng thái nổi (Toast Notification).
- **Các tính năng/hành động**:
  - Xem bảng so sánh các thuộc tính của tối đa 3 gói cước di động cùng một lúc.
  - Thêm gói cước mới vào bảng so sánh (bằng cách click nút "Thêm gói" hoặc nút thêm nhanh).
  - Xóa một gói cước cụ thể ra khỏi bảng so sánh (click nút X trên đầu cột).
  - Xóa toàn bộ danh sách gói cước đang so sánh (click "Xóa danh sách so sánh").
  - Đăng ký nhanh gói cước trực tiếp từ hàng cuối của bảng so sánh.

### Trang Khảo sát chọn gói cước (Survey) - File `Survey.tsx`
- **Các thành phần/nội dung đang hiển thị trên trang**:
  - Nhãn "HỆ THỐNG GỢI Ý GÓI CƯỚC THÔNG MINH BẰNG THUẬT TOÁN AI".
  - Tiêu đề trang "Khảo sát chọn gói cước" kèm mô tả ngắn.
  - Khung giao diện khảo sát (Wizard Card Panel):
    - Trình hiển thị tiến trình (Số thứ tự bước hiện tại / 4, mô tả ngắn của từng bước).
    - Nội dung các bước khảo sát:
      - Bước 1 (Ngân sách cước phí): Gồm 5 ô lựa chọn giá tiền (Dưới 50k, 50k-100k, 100k-200k, Trên 200k, Tùy ý).
      - Bước 2 (Dung lượng Data): Gồm 5 ô lựa chọn nhu cầu data (Không dùng, Dưới 1GB/ngày, 1-3GB/ngày, 3-5GB/ngày, Không giới hạn).
      - Bước 3 (Gọi thoại miễn phí): Gồm 3 ô lựa chọn thời lượng gọi (Không gọi nhiều, Dưới 500 phút, Trên 1000 phút).
      - Bước 4 (Mạng xã hội giải trí): Các hộp kiểm chọn ứng dụng (TikTok, YouTube, Facebook).
    - Bộ nút điều hướng dưới cùng: Nút "Trước" (quay lại bước trước) và nút "Tiếp theo / Xem kết quả" (sang bước sau).
    - Trang kết quả gợi ý: Tiêu đề "Đã tìm thấy các gói cước tối ưu!", lưới hiển thị tối đa 3 thẻ gói cước phù hợp nhất và nút "Thực hiện lại khảo sát".
  - Modal đăng ký gói cước (`RegisterModal`).
  - Thanh thông báo trạng thái nổi (Toast Notification).
- **Các tính năng/hành động**:
  - Click chọn câu trả lời ở mỗi bước.
  - Điều hướng tiến hoặc lùi giữa các bước khảo sát.
  - Click "Xem kết quả" -> Hệ thống tự động tính toán điểm phù hợp của từng gói cước dựa trên câu trả lời khảo sát và hiển thị danh sách 3 gói cước tốt nhất.
  - Thực hiện lại khảo sát từ đầu (bấm nút "Thực hiện lại khảo sát").
  - Click nút "Đăng ký" trên các gói cước được đề xuất để mở Modal đăng ký nhanh.

### Trang Quản lý tài khoản (Profile) - File `Profile.tsx`
- **Các thành phần/nội dung đang hiển thị trên trang**:
  - Sidebar bên trái hiển thị ảnh đại diện (chữ cái đầu của tên), họ tên, vai trò tài khoản, danh sách 6 tab điều hướng.
  - Giao diện nội dung tab được chọn ở bên phải:
    - **Tab Hồ sơ cá nhân**:
      - Các ô hiển thị thông tin không thể sửa: Số điện thoại, Loại tài khoản, Loại thuê bao, Trạng thái KHTT, Trạng thái tài khoản.
      - Form nhập thông tin có thể sửa: Họ và tên, Địa chỉ Email, và nút "Cập nhật thông tin".
    - **Tab Nạp tiền tài khoản**:
      - Khối liên kết ví MetaMask: Hiển thị địa chỉ ví và trạng thái ví (Cài đặt, kết nối, chuyển mạng Sepolia, đã kết nối).
      - Khối nạp tiền: 8 nút chọn số tiền định sẵn (10k, 20k, 30k, 50k, 100k, 200k, 300k, 500k), ô nhập số tiền tùy chỉnh, thông tin tổng hợp số tiền sẽ nạp (quy đổi VND) và nút "Nạp tiền".
    - **Tab Gói cước đang dùng**:
      - Danh sách các gói cước đang kích hoạt. Mỗi mục hiển thị: tên gói, nhãn trạng thái "ĐANG HOẠT ĐỘNG", mô tả gói cước, ngày kích hoạt, ngày hết hạn, chu kỳ sử dụng, trạng thái gia hạn (Tự động / Đã tắt gia hạn tự động), các nút hành động (Hủy gia hạn, Hủy đăng ký, Gia hạn lại).
      - Trạng thái trống hiển thị nút "Xem các gói cước ngay".
    - **Tab Lịch sử đăng ký gói cước**:
      - Bảng danh sách lịch sử gồm: Tên gói, Ngày đăng ký, Ngày hết hạn, Chu kỳ, Trạng thái (Bị thay thế, Đã hủy, Hết hạn).
      - Nút "Xóa lịch sử" ở tiêu đề tab (hiển thị khi có dữ liệu lịch sử).
      - Trạng thái trống hiển thị thông báo.
    - **Tab Lịch sử giao dịch**:
      - Bảng danh sách giao dịch nạp tiền: Thời gian, Số tiền nạp (+), Trạng thái (Thành công, Đang xử lý, Thất bại), Mã giao dịch thu gọn.
      - Trạng thái trống hiển thị thông báo.
    - **Tab Đổi mật khẩu**:
      - Form đổi mật khẩu gồm: Mật khẩu hiện tại, Mật khẩu mới, Nhập lại mật khẩu, nút ẩn/hiển thị mật khẩu (mắt), nút "Thay đổi mật khẩu".
  - Các Modal xác nhận:
    - Modal xác nhận Hủy đăng ký gói cước.
    - Modal xác nhận Hủy gia hạn gói cước.
    - Modal xác nhận Xóa lịch sử đăng ký gói cước.
    - Modal Chi tiết giao dịch: Hiển thị chi tiết (Trạng thái, Số tiền nạp, Thời gian, Mã giao dịch, Ví gửi, Ví nhận, Mạng Blockchain), nút "Sao chép mã giao dịch", nút "Xem Explorer" để chuyển tới Sepolia Etherscan.
  - Thanh thông báo trạng thái nổi (Toast Notification).
- **Các tính năng/hành động**:
  - Chuyển đổi giữa các tab quản lý tài khoản.
  - Cập nhật Họ và tên, Email (submit Form Hồ sơ cá nhân).
  - Liên kết ví MetaMask với tài khoản hệ thống.
  - Chuyển đổi mạng blockchain ví MetaMask sang mạng Sepolia.
  - Nạp tiền ví ảo bằng cách gửi ETH Sepolia thông qua MetaMask (gửi tới ví nhận, ký duyệt giao dịch, chờ blockchain xác nhận và tự động cập nhật số dư).
  - Tắt tự động gia hạn gói cước đang hoạt động (Click "Hủy gia hạn" -> Xác nhận).
  - Bật lại tự động gia hạn gói cước (Click "Gia hạn lại").
  - Hủy ngay lập tức gói cước đang hoạt động (Click "Hủy đăng ký" -> Xác nhận).
  - Xóa sạch nhật ký lịch sử đăng ký gói cước (Click "Xóa lịch sử" -> Xác nhận).
  - Thay đổi mật khẩu tài khoản (submit Form Đổi mật khẩu).
  - Xem chi tiết giao dịch nạp tiền, sao chép hash giao dịch và xem lịch sử trên Etherscan.

### Trang Đăng nhập (Login) - File `Login.tsx`
- **Các thành phần/nội dung đang hiển thị trên trang**:
  - Logo chữ V màu đỏ và thương hiệu "ViettelAI".
  - Tiêu đề "Đăng nhập" và mô tả ngắn.
  - Thanh thông báo lỗi màu đỏ (nếu đăng nhập sai hoặc lỗi hệ thống).
  - Form đăng nhập: Ô nhập Số điện thoại di động (có icon điện thoại), ô nhập Mật khẩu tài khoản (có icon ổ khóa và nút ẩn/hiện mật khẩu).
  - Liên kết "Quên mật khẩu?" cạnh nhãn mật khẩu.
  - Nút "Đăng nhập" (hiển thị trạng thái "Đang xử lý..." kèm spinner quay tròn khi đang submit).
  - Liên kết chuyển hướng ở chân trang: "Đăng ký thuê bao mới", "Quay lại trang chủ".
- **Các tính năng/hành động**:
  - Nhập thông tin tài khoản và gửi yêu cầu đăng nhập (submit form).
  - Xem/ẩn mật khẩu bằng cách click biểu tượng con mắt.
  - Chuyển hướng nhanh sang trang Đăng ký (`/register`), Quên mật khẩu (`/forgot-password`), hoặc Trang chủ (`/`).

### Trang Đăng ký (Register) - File `Register.tsx`
- **Các thành phần/nội dung đang hiển thị trên trang**:
  - Logo chữ V màu đỏ và thương hiệu "ViettelAI".
  - Tiêu đề "Đăng ký" và mô tả ngắn.
  - Thanh thông báo thành công màu xanh lá cây hoặc thông báo lỗi màu đỏ.
  - Form đăng ký:
    - Ô nhập Họ và tên (có icon người dùng).
    - Ô nhập Số điện thoại di động (có icon điện thoại).
    - Bộ chọn Loại thuê bao dạng thẻ trượt (Trả trước / Trả sau).
    - Ô nhập Mật khẩu (có icon ổ khóa và nút ẩn/hiện mật khẩu).
    - Ô nhập lại Mật khẩu (có icon ổ khóa).
  - Nút "Đăng ký tài khoản" (hiển thị trạng thái "Đang xử lý..." kèm spinner quay tròn khi đang submit).
  - Liên kết ở chân trang: "Đăng nhập ngay", "Quay lại trang chủ".
- **Các tính năng/hành động**:
  - Nhập thông tin và gửi yêu cầu đăng ký tài khoản thuê bao mới (submit form).
  - Chọn nhanh loại thuê bao đăng ký (Trả trước hoặc Trả sau).
  - Click biểu tượng con mắt để xem/ẩn mật khẩu nhập vào.
  - Chuyển hướng nhanh sang trang Đăng nhập (`/login`) hoặc Trang chủ (`/`).

### Trang Quên mật khẩu (ForgotPassword) - File `ForgotPassword.tsx`
- **Các thành phần/nội dung đang hiển thị trên trang**:
  - Logo chữ V màu đỏ và thương hiệu "ViettelAI".
  - Tiêu đề "Quên mật khẩu" và mô tả ngắn "Xác thực mã OTP để thiết lập lại mật khẩu".
  - Thanh thông báo thành công màu xanh lá cây (khi gửi OTP hoặc đổi mật khẩu thành công).
  - **Nội dung Bước 1 (Gửi OTP)**: Ô nhập Số điện thoại di động (có icon điện thoại) và nút "Gửi mã xác thực OTP".
  - **Nội dung Bước 2 (Đặt lại mật khẩu - sau khi gửi OTP)**: Ô nhập Mã xác thực OTP (yêu cầu nhập mã 123456), ô nhập Mật khẩu mới (có nút ẩn/hiện mật khẩu) và nút "Xác nhận đổi mật khẩu".
  - Liên kết ở chân trang: "Đăng nhập ngay".
- **Các tính năng/hành động**:
  - Nhập số điện thoại để yêu cầu gửi mã OTP di động ảo (giả lập tại client chuyển sang Bước 2).
  - Nhập mã xác thực OTP di động ảo `123456` và nhập mật khẩu mới.
  - Click nút "Xác nhận đổi mật khẩu" để hoàn thành đổi mật khẩu giả lập và chuyển hướng về trang Đăng nhập sau 1.5 giây.
  - Bật/tắt ẩn hiển thị mật khẩu mới.

### Trang Quản trị Dashboard (AdminDashboard) - File `Dashboard.tsx`
- **Các thành phần/nội dung đang hiển thị trên trang**:
  - Tiêu đề trang "Hệ thống báo cáo tổng quan" kèm mô tả ngắn.
  - Bốn thẻ thống kê: Doanh thu (VND), Số lượng Người dùng, Tổng số Gói cước, Lượt đăng ký gói.
  - Biểu đồ đường SVG trực quan hóa xu hướng doanh thu & đăng ký gói gần đây theo các ngày trong tuần (T2 đến T7), chứa các điểm chấm tròn và thông số doanh thu quy đổi dạng nghìn đồng (k).
  - Bảng "Giao dịch đăng ký & Nạp ví gần đây": hiển thị danh sách các giao dịch gồm các cột: Giao dịch (Nạp ví ảo/Đăng ký gói), Số điện thoại, Số tiền, Mô tả, Ngày thực hiện, Trạng thái.
- **Các tính năng/hành động**:
  - Theo dõi số liệu thống kê thời gian thực của hệ thống.
  - Xem biểu đồ xu hướng biến động doanh số.
  - Xem nhật ký các giao dịch đăng ký gói cước và nạp tiền tài khoản gần đây nhất của toàn bộ người dùng.

### Trang Quản trị Gói cước (AdminPackages) - File `Packages.tsx` (trong thư mục `Admin`)
- **Các thành phần/nội dung đang hiển thị trên trang**:
  - Tiêu đề trang "Danh sách quản lý gói cước" kèm mô tả ngắn.
  - Nút "Tạo gói mới".
  - Bảng danh mục gói cước: hiển thị các cột Tên gói (có biểu tượng ngôi sao nếu là Hot), Thể loại (DATA, COMBO, SOCIAL), Giá cước, Chu kỳ, Data ưu đãi, và Thao tác (Nút sửa bút chì, nút xóa thùng rác).
  - Trạng thái chờ tải dữ liệu (Loader2 spinner) và thông báo bảng trống.
  - Modal Form CRUD (Thêm/Sửa gói cước):
    - Các ô nhập dữ liệu: Tên gói cước, Giá cước, Thể loại gói (dropdown), Thời hạn (ngày), Mô tả dung lượng, Gọi nội mạng, Gọi ngoại mạng, Tin nhắn SMS, Tiện ích cơ bản, Free Data Apps, Chi tiết tiện ích miễn phí, Độ nổi bật (dropdown), Đối tượng áp dụng, Chính sách áp dụng, Mô tả tóm tắt ưu đãi, Cú pháp đăng ký, Cú pháp hủy gia hạn, Cú pháp hủy hoàn toàn.
    - Nút "Hủy bỏ" và nút "Lưu cập nhật / Tạo mới gói".
  - Modal xác nhận xóa gói cước: hiển thị thông tin cảnh báo và nút "Hủy bỏ / Xác nhận xóa".
  - Thanh thông báo trạng thái nổi (Toast Notification).
- **Các tính năng/hành động**:
  - Xem danh sách các gói cước đang lưu trong cơ sở dữ liệu.
  - Click nút "Tạo gói mới" -> Hiển thị Modal Form để nhập thông tin và lưu thêm gói cước mới vào DB.
  - Click biểu tượng sửa -> Hiển thị Modal Form chứa sẵn thông tin gói cước để cập nhật chỉnh sửa lưu lại vào DB.
  - Click biểu tượng xóa -> Hiển thị Modal xác nhận xóa gói cước khỏi cơ sở dữ liệu.

### Trang Quản trị Người dùng (AdminUsers) - File `Users.tsx` (trong thư mục `Admin`)
- **Các thành phần/nội dung đang hiển thị trên trang**:
  - Tiêu đề trang "Quản lý người dùng thuê bao" và mô tả ngắn.
  - Nút "Làm mới danh sách".
  - Bảng thông tin người dùng di động: hiển thị các cột Họ và tên (kèm icon người dùng), Số điện thoại, Loại thuê bao (nút bấm), Khách hàng thân thiết (nút bấm kèm icon ngôi sao), Số dư ví (VND), Trạng thái (nhãn Hoạt động/Chờ kích hoạt/Bị khóa), Vai trò (nhãn ADMIN/USER), Ngày đăng ký, và cột Hành động (Nút Khóa/Mở tài khoản).
  - Modal xác nhận hành động: tiêu đề modal, nội dung cảnh báo hành động và nút "Hủy bỏ / Xác nhận".
  - Thanh thông báo trạng thái nổi (Toast Notification).
- **Các tính năng/hành động**:
  - Xem và theo dõi danh sách tất cả các tài khoản thuê bao di động đăng ký trên hệ thống.
  - Click nút "Làm mới danh sách" -> Gửi yêu cầu tải lại dữ liệu người dùng từ máy chủ.
  - Click nút Loại thuê bao trong bảng -> Hiển thị modal xác nhận đổi loại thuê bao của người dùng (Trả trước <=> Trả sau) và cập nhật xuống DB.
  - Click nút Khách hàng thân thiết trong bảng -> Hiển thị modal xác nhận thay đổi trạng thái thành viên (Thường <=> Thân thiết) và cập nhật xuống DB.
  - Click nút Khóa tài khoản hoặc Mở tài khoản ở cột Hành động -> Hiển thị modal xác nhận thay đổi trạng thái hoạt động tài khoản (Active <=> Blocked) và cập nhật xuống DB.

### Trang Quản trị FAQs (AdminFAQs) - File `FAQs.tsx` (trong thư mục `Admin`)
- **Các thành phần/nội dung đang hiển thị trên trang**:
  - Tiêu đề trang "Quản lý câu hỏi thường gặp (FAQ)" và mô tả ngắn.
  - Nút "Thêm FAQ mới".
  - Bảng danh mục FAQ: hiển thị các cột Phân loại danh mục, Câu hỏi, Câu trả lời, và Thao tác (Nút sửa bút chì, nút xóa thùng rác).
  - Trạng thái chờ tải dữ liệu (Loader2 spinner) và thông báo bảng trống.
  - Modal Form CRUD (Thêm/Sửa FAQ):
    - Các ô nhập dữ liệu: Phân loại danh mục (dropdown Hỗ trợ Đăng ký/Hỗ trợ Nạp tiền/Hỗ trợ chung), nội dung câu hỏi, nội dung câu trả lời.
    - Nút "Hủy bỏ" và nút "Lưu chỉnh sửa / Thêm mới".
  - Modal xác nhận xóa câu hỏi FAQ: thông tin cảnh báo và nút "Hủy bỏ / Xác nhận xóa".
  - Thanh thông báo trạng thái nổi (Toast Notification).
- **Các tính năng/hành động**:
  - Xem danh sách các FAQ hỗ trợ trong cơ sở dữ liệu.
  - Click nút "Thêm FAQ mới" -> Hiển thị Modal Form để nhập và lưu câu hỏi thường gặp mới vào DB.
  - Click biểu tượng sửa -> Hiển thị Modal Form chứa thông tin FAQ để cập nhật chỉnh sửa lưu lại vào DB.
  - Click biểu tượng xóa -> Hiển thị Modal xác nhận xóa FAQ ra khỏi cơ sở dữ liệu.

### Trang Quản trị Chatbot (AdminChatbot) - File `Chatbot.tsx` (trong thư mục `Admin`)
- **Các thành phần/nội dung đang hiển thị trên trang**:
  - Tiêu đề trang "Cấu hình trợ lý ảo AI Chatbot" và mô tả ngắn.
  - Nút "Lưu cấu hình" ở góc trên bên phải.
  - Textarea "System Behavior Prompt" cho phép nhập chỉ dẫn hệ thống huấn luyện phong cách giao tiếp cho AI.
  - Lưới bảng "Dữ liệu huấn luyện từ khóa NLP (Rule-based)":
    - Nút "Thêm từ khóa".
    - Các cột của bảng: Từ khóa bắt được, Câu trả lời phản hồi của Chatbot, Gói cước liên kết, và Thao tác (Sửa/Xóa).
  - Modal Form CRUD từ khóa: ô nhập từ khóa kích hoạt, ô nhập nội dung phản hồi, bộ chọn gói cước gợi ý đi kèm (dropdown danh sách các gói cước đang có và tùy chọn "Wizard Khảo sát"), nút "Hủy bỏ" và nút "Lưu chỉnh sửa / Thêm mới".
  - Thanh thông báo trạng thái nổi (Toast Notification).
- **Các tính năng/hành động**:
  - Xem toàn bộ cấu hình chatbot hiện tại (Prompt chỉ dẫn và các từ khóa huấn luyện).
  - Nhập chỉnh sửa System Prompt chỉ dẫn phong cách chatbot.
  - Click "Thêm từ khóa" -> Hiển thị Modal Form để nhập từ khóa, câu phản hồi tương ứng, liên kết gói cước gợi ý và thêm vào bảng danh sách local.
  - Click sửa từ khóa -> Mở Modal Form chứa thông tin từ khóa để cập nhật chỉnh sửa local.
  - Click xóa từ khóa -> Loại bỏ từ khóa ra khỏi bảng danh sách local.
  - Click nút "Lưu cấu hình" -> Gửi toàn bộ dữ liệu chỉ dẫn prompt và danh sách từ khóa cập nhật lưu trữ cố định lên DB máy chủ.
