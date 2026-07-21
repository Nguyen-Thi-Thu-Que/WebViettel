# Website Cung Cấp Gói Cước Di Động Viettel Tích Hợp Chatbot

## 1. Cấu Trúc Cây Thư Mục (Directory Tree)

```text
WebViettel/
├── client/
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── src/
│   │   ├── assets/
│   │   │   ├── hero.png
│   │   │   ├── react.svg (unused)
│   │   │   └── vite.svg (unused)
│   │   ├── components/
│   │   │   ├── AdvancedFilter.tsx
│   │   │   ├── Breadcrumb.tsx
│   │   │   ├── Chatbot.tsx
│   │   │   ├── CompareAI.tsx
│   │   │   ├── CompareDrawer.tsx
│   │   │   ├── DevTimeWidget.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── LoadingSkeleton.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── PackageCard.tsx
│   │   │   ├── PackageGrid.tsx
│   │   │   ├── PackageSearch.tsx
│   │   │   ├── PackageToolbar.tsx
│   │   │   ├── Pagination.tsx
│   │   │   ├── QuickFilter.tsx
│   │   │   ├── RegisterModal.tsx
│   │   │   ├── SEO.tsx
│   │   │   └── Skeleton.tsx
│   │   ├── hooks/
│   │   │   └── useWeb3.ts
│   │   ├── image/
│   │   │   └── AI.png
│   │   ├── layouts/
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── AuthLayout.tsx
│   │   │   └── ClientLayout.tsx
│   │   ├── pages/
│   │   │   ├── Admin/
│   │   │   │   ├── Chatbot.tsx
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── FAQs.tsx
│   │   │   │   ├── Packages.tsx
│   │   │   │   └── Users.tsx
│   │   │   ├── Auth/
│   │   │   │   ├── ForgotPassword.tsx
│   │   │   │   ├── Login.tsx
│   │   │   │   └── Register.tsx
│   │   │   ├── ChatbotPage.tsx
│   │   │   ├── Compare.tsx
│   │   │   ├── Contact.tsx
│   │   │   ├── Home.tsx
│   │   │   ├── PackageDetail.tsx
│   │   │   ├── Packages.tsx
│   │   │   ├── Profile.tsx
│   │   │   └── Survey.tsx
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── axiosInstance.ts
│   │   │   ├── compareAIService.ts (unused)
│   │   │   └── web3Service.ts
│   │   ├── store/
│   │   │   └── index.ts
│   │   ├── types/
│   │   │   ├── index.ts
│   │   │   └── web3.ts
│   │   ├── utils/
│   │   │   ├── chatbotEngine.ts (unused)
│   │   │   ├── filterHelper.ts
│   │   │   ├── permission.ts
│   │   │   └── similarity.ts
│   │   ├── App.css
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── .env
│   ├── .gitignore
│   ├── .oxlintrc.json
│   ├── index.html
│   ├── package.json
│   ├── README.md
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
├── server/
│   ├── docs/
│   │   ├── chatbot-requirements.md
│   │   ├── package-schema.md
│   │   ├── project-context.md
│   │   ├── subscription-rules.md
│   │   └── subscription-schema.md
│   ├── scripts/
│   │   ├── migrate_benefit_group.js
│   │   └── seed_benefit_group.js
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── chatHistoryController.js
│   │   │   ├── chatbotController.js
│   │   │   ├── compareController.js
│   │   │   ├── contactController.js
│   │   │   ├── faqController.js
│   │   │   ├── packageController.js
│   │   │   ├── subscriptionController.js
│   │   │   ├── surveyController.js
│   │   │   ├── transactionController.js
│   │   │   └── userController.js
│   │   ├── middlewares/
│   │   │   ├── authMiddleware.js
│   │   │   └── errorMiddleware.js
│   │   ├── models/
│   │   │   ├── Account.js
│   │   │   ├── ChatHistory.js
│   │   │   ├── ChatbotConfig.js
│   │   │   ├── CompareHistory.js
│   │   │   ├── Contact.js
│   │   │   ├── Deposit.js
│   │   │   ├── FAQ.js
│   │   │   ├── Package.js
│   │   │   ├── PackageFeature.js
│   │   │   ├── SurveyConfig.js
│   │   │   ├── SurveyHistory.js
│   │   │   └── UserSubscription.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── chatbotRoutes.js
│   │   │   ├── compareRoutes.js
│   │   │   ├── contactRoutes.js
│   │   │   ├── faqRoutes.js
│   │   │   ├── packageRoutes.js
│   │   │   ├── subscriptionRoutes.js
│   │   │   ├── surveyRoutes.js
│   │   │   ├── transactionRoutes.js
│   │   │   └── userRoutes.js
│   │   ├── services/
│   │   │   ├── ai/
│   │   │   │   ├── ai.service.js
│   │   │   │   ├── groq.provider.js
│   │   │   │   └── ollama.provider.js
│   │   │   ├── chatbot/
│   │   │   │   ├── intentParser.js
│   │   │   │   ├── packageContext.js
│   │   │   │   ├── packageMatcher.js
│   │   │   │   ├── packageSanitizer.js
│   │   │   │   ├── promptBuilder.js
│   │   │   │   └── scoring_config.json
│   │   │   ├── authService.js
│   │   │   ├── chatbotService.js
│   │   │   ├── contactService.js
│   │   │   ├── faqService.js
│   │   │   ├── subscriptionService.js
│   │   │   ├── surveyService.js
│   │   │   ├── transactionService.js
│   │   │   └── userService.js
│   │   ├── utils/
│   │   │   ├── permission.js
│   │   │   └── virtualTime.js
│   │   ├── index.js
│   │   ├── seed.js
│   │   └── seed_extra.js (unused)
│   ├── .env
│   └── package.json
├── .gitignore
├── package-lock.json
└── package.json
```

---

## 2. Cấu Hình Hệ Thống (Configurations)

Hệ thống sử dụng các file cấu hình và các biến môi trường sau đây:

### Danh sách các file cấu hình hiện có:

- **Thư mục gốc (Root)**:
  - `package.json` và `package-lock.json`: Định nghĩa và quản lý các package phụ thuộc của dự án.
  - `.gitignore`: Cấu hình các tệp tin và thư mục không được Git theo dõi.
- **Thư mục Frontend (`client/`)**:
  - `package.json`: Danh sách phụ thuộc và script chạy của frontend (React + Vite + Tailwind CSS).
  - `vite.config.ts`: Cấu hình công cụ build Vite.
  - `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`: Cấu hình trình biên dịch TypeScript.
  - `.gitignore`: Cấu hình Git bỏ qua cho frontend.
  - `.env`: Chứa các biến môi trường cấu hình kết nối API và Blockchain của frontend.
  - `.oxlintrc.json`: Cấu hình linter Oxlint cho kiểm tra mã nguồn nhanh.
  - `README.md`: Hướng dẫn riêng cho thư mục client.
- **Thư mục Backend (`server/`)**:
  - `package.json`: Danh sách phụ thuộc và script khởi chạy server Node/Express. Gồm: `express`, `mongoose`, `bcryptjs`, `cors`, `dotenv`, `ethers`, `@google/generative-ai`, `csv-parser`.
  - `.env`: Chứa cấu hình cổng chạy, DB MongoDB, xác thực JWT, địa chỉ ví nhận, tỷ giá quy đổi ETH/VND, RPC URL và API key của AI chatbot.
  - `src/services/chatbot/scoring_config.json`: Cấu hình hệ số điểm khớp gói cước của chatbot.

### Chi tiết cấu hình biến môi trường (`.env`):

- **Cấu hình Backend (`server/.env`)**:
  - `MONGODB_URI`: Địa chỉ kết nối đến cơ sở dữ liệu MongoDB.
  - `PORT`: Cổng khởi chạy dịch vụ backend (mặc định `5000`).
  - `JWT_SECRET`: Chuỗi khóa bảo mật dùng để ký và xác thực JSON Web Token (JWT). JWT được triển khai thủ công theo chuẩn HMAC-SHA256, không phụ thuộc thư viện bên ngoài.
  - `RECEIVER_WALLET`: Địa chỉ ví MetaMask nhận ETH Sepolia cho giao dịch nạp tiền.
  - `ETH_EXCHANGE_RATE`: Tỷ giá quy đổi giả lập giữa tiền VND và ETH Sepolia (mặc định `75000000` VND/ETH).
  - `RPC_URL`: RPC URL kết nối mạng blockchain thử nghiệm Sepolia.
  - `AI_PROVIDER`: Nhà cung cấp dịch vụ AI (VD: `groq`). Nếu không đặt, mặc định là `groq`.
  - `GROQ_API_KEY`: API Key đăng ký của dịch vụ Groq Cloud.
  - `GROQ_MODEL`: Mô hình ngôn ngữ lớn Groq sử dụng (mặc định `llama-3.1-8b-instant`).
  - `OLLAMA_MODEL`: Mô hình ngôn ngữ lớn Ollama dùng khi fallback (mặc định `qwen2.5:3b`, hỗ trợ tùy chỉnh qua biến môi trường).
  - `OLLAMA_HOST`: URL host của dịch vụ Ollama (mặc định `http://127.0.0.1:11434`, hỗ trợ tùy chỉnh qua biến môi trường).
- **Cấu hình Frontend (`client/.env`)**:
  - `VITE_API_URL`: URL API Backend (mặc định `http://localhost:5000`).
  - `VITE_NETWORK_NAME`: Tên mạng blockchain thử nghiệm (mặc định `Sepolia`).
  - `VITE_CHAIN_ID`: ID mạng blockchain Sepolia dạng thập phân (mặc định `11155111`).
  - `VITE_RPC_URL`: RPC URL kết nối mạng Sepolia tương ứng với backend.
  - `VITE_BLOCK_EXPLORER`: URL trang tra cứu blockchain Explorer Sepolia (mặc định `https://sepolia.etherscan.io`).
  - `VITE_RECEIVER_WALLET`: Địa chỉ ví nhận ETH quy đổi nạp tiền tương ứng với backend.
  - `VITE_ETH_EXCHANGE_RATE`: Tỷ giá quy đổi VND/ETH tương ứng với backend.

---

## 3. Giao Diện & Thành Phần UI (Frontend & Components)

### Danh sách các trang (Pages/Screens) đã dựng:

- **Trang chủ (Home.tsx)**: Hiển thị banner lớn giới thiệu, danh sách phân loại nhu cầu sử dụng, danh sách thẻ các gói cước nổi bật (hot), và các CTA điều hướng đến Chatbot và Khảo sát.
- **Trang Danh mục gói cước (Packages.tsx)**: Nơi hiển thị tất cả các gói cước với bộ lọc tìm kiếm nâng cao ở phần đầu trang.
- **Trang Chi tiết gói cước (PackageDetail.tsx)**: Hiển thị đầy đủ thông số ưu đãi của gói cước, điều kiện đăng ký, cú pháp soạn tin nhắn SMS, các gói cước tương tự và nút Đăng ký gói cước trực tiếp.
- **Trang So sánh gói cước (Compare.tsx)**: Giao diện so sánh trực quan dưới dạng bảng cho tối đa 3 gói cước di động cùng lúc, kèm bảng phân tích nhận xét tự động từ trợ lý ảo. Trang tự động ghi nhận phiên so sánh (session analytics) và gửi lên backend API khi người dùng rời trang hoặc đăng ký gói cước.
- **Trang Khảo sát chọn gói (Survey.tsx)**: Giao diện khảo sát wizard giúp thu thập thông tin thói quen tiêu dùng và đề xuất gói cước phù hợp nhất. Câu hỏi hiển thị động theo thuật toán Decision Tree từ backend.
- **Hồ sơ cá nhân & Quản lý giao dịch (Profile.tsx)**: Khu vực quản lý tài khoản của người dùng, được tổ chức thành các tab sidebar:
  - **Hồ sơ cá nhân**: Chỉnh sửa thông tin tài khoản di động.
  - **Nạp tiền tài khoản**: Cổng kết nối MetaMask, nạp số dư ví ảo và quản lý ô nhập số tiền phân cách hàng nghìn chuẩn.
  - **Lịch sử đăng ký gói cước**: Tab gộp quản lý duy nhất phân làm 2 phần từ trên xuống:
    - *⚡ GÓI CƯỚC ĐANG SỬ DỤNG*: Danh sách gói active, nút bật/tắt tự động gia hạn, hủy gói cước và bộ công cụ Dev Test chỉnh sửa thời gian hết hạn (`expiresAt`) qua ô chọn lịch `datetime-local`.
    - *📜 LỊCH SỬ GIAO DỊCH GÓI CƯỚC*: Bảng lịch sử các lượt đăng ký cùng nút "Xóa tất cả lịch sử đã hủy/hết hạn" (Xóa mềm).
  - **Lịch sử giao dịch**: Bảng tổng hợp siêu gọn gàng 5 cột (`Thời gian`, `Loại giao dịch`, `Mô tả`, `Số tiền`, `Trạng thái`), chống rớt dòng (`whitespace-nowrap`). Hỗ trợ bộ lọc chip (*Tất cả*, *Nạp tiền (+)*, *Trừ tiền (-)*, *Đã hủy*). Click trực tiếp vào dòng mở Modal xem đầy đủ chi tiết giao dịch kèm nút **"Hủy lệnh nạp này"** cho giao dịch đang xử lý (`PENDING`). Bổ sung nút "Xóa tất cả lịch sử giao dịch" (Xóa mềm).
  - **Đổi mật khẩu**: Thay đổi mật khẩu tài khoản trực tiếp (xác thực mật khẩu cũ).
- **Trang Liên hệ hỗ trợ (Contact.tsx)**: Giao diện Layout 2 cột truyền thống cân đối (`grid grid-cols-1 md:grid-cols-2 gap-8`):
  - *Cột trái*: Form nhập thông tin liên hệ (Họ và tên, Số điện thoại, Dropdown Chủ đề hỗ trợ ["Tư vấn & Đăng ký gói cước", "Sự cố Nạp tiền & Số dư ví", "Quản lý tài khoản thuê bao", "Góp ý & Khiếu nại dịch vụ", "Khác"], Nội dung chi tiết).
  - *Cột phải*: Thẻ thông tin CSKH Viettel chính thức (Tổng đài `198` / `1800 8098` 24/7 miễn phí, email `cskh@viettel.com.vn`, giờ làm việc 24/7, trụ sở Tòa nhà Viettel Cần Thơ). Loại bỏ hoàn toàn các nút/gợi ý liên quan tới AI.
- **Hệ thống xác thực tài khoản (Auth)**:
  - Đăng nhập (Login.tsx)
  - Đăng ký tài khoản (Register.tsx)
  - Quên mật khẩu (ForgotPassword.tsx)
- **Trang Quản trị (Admin Pages)**:
  - Báo cáo thống kê (Dashboard.tsx): Biểu thị số liệu tổng quan hệ thống và biểu đồ tăng trưởng doanh thu SVG.
  - Quản lý gói cước (Packages.tsx): Giao diện CRUD gói cước di động.
  - Quản lý câu hỏi thường gặp (FAQs.tsx): Giao diện CRUD danh mục câu hỏi FAQ.
  - Quản lý người dùng di động (Users.tsx): Xem danh sách, cập nhật số dư, phân loại thuê bao, khách hàng thân thiết và khóa/mở khóa tài khoản.
  - Cấu hình Chatbot AI (Chatbot.tsx): Điều chỉnh System Prompt và các từ khóa rule-based cho chatbot.

### Các thành phần giao diện chính (Components):

- `Navbar`: Thanh điều hướng đầu trang, hiển thị logo Viettel, các liên kết trang chủ, gói cước, so sánh, khảo sát, tư vấn AI, liên hệ, và góc hiển thị số dư ví ảo kèm nút trang cá nhân hoặc đăng nhập. Dropdown menu cá nhân điều hướng trực tiếp về tab quản lý gói cước duy nhất `/profile?tab=subscriptions`.
- `Footer`: Chứa các thông tin liên hệ, liên kết nhanh bản quyền dự án.
- `DevTimeWidget`: Widget nổi góc dưới bên phải màn hình (Global Virtual Time Controller) phục vụ việc tua nhanh thời gian hệ thống, đặt mốc thời gian ảo cố định hoặc khôi phục thời gian thực.
- `PackageCard`: Thẻ hiển thị tóm tắt thông tin gói cước (tên, giá, dung lượng data, cuộc gọi, nút đăng ký nhanh, nút so sánh).
- `AdvancedFilter`: Bộ lọc nâng cao trên trang duyệt gói cước (lọc theo loại gói, chu kỳ, giá cước, công nghệ mạng, dịch vụ...).
- `Chatbot`: Hộp thoại bong bóng chat nhỏ cố định ở góc màn hình phục vụ chat nhanh với trợ lý ảo từ mọi trang.
- `CompareAI`: Panel hiển thị phân tích nhận xét thông minh (client-side) cho trang so sánh gói cước, gồm tóm tắt sự khác biệt, gợi ý lựa chọn và highlight ưu điểm từng gói.
- `RegisterModal`: Modal xác nhận và xử lý đăng ký gói cước cho người dùng di động.
- `CompareDrawer`: Khay trượt chứa danh sách các gói cước đang chọn so sánh nằm cố định bên dưới màn hình.
- `SEO`: Thành phần cấu hình thẻ tiêu đề, mô tả và cấu trúc Schema JSON-LD hỗ trợ chuẩn hóa SEO cho từng trang.
- `Breadcrumb`: Thanh dẫn hướng đường dẫn giúp xác định vị trí trang hiện tại.
- Các thành phần skeleton (`Skeleton`, `LoadingSkeleton`): Hiển thị trạng thái tải dữ liệu cho các thẻ gói cước và bảng biểu.

### Trạng thái trực quan (Responsive):

- Giao diện được thiết kế hoàn chỉnh theo cơ chế Responsive trên nền tảng Tailwind CSS.
- Layout và các cấu trúc lưới (grid) hoạt động ổn định trên cả 3 phân khúc kích thước màn hình phổ biến:
  - **Màn hình lớn (Desktop / Laptop)**: Hiển thị đầy đủ sidebar quản trị, bảng so sánh đa cột, lưới 3-4 gói cước trên một hàng, layout 2 cột trang Liên hệ.
  - **Màn hình trung bình (Tablet)**: Các lưới gói cước tự động chuyển về 2 cột, bảng so sánh hỗ trợ cuộn ngang mượt mà, sidebar tài khoản chuyển về dạng menu xếp chồng.
  - **Màn hình nhỏ (Mobile)**: Giao diện chuyển tối giản, các thẻ và cột hiển thị dạng dọc (block), menu điều hướng chuyển đổi linh hoạt.

---

## 4. Chức Năng Hiện Có (Current Features & Functionalities)

### 🟢 Các chức năng đã hoạt động ổn định với Backend / Database thật:

1. **Duyệt và Lọc tìm kiếm gói cước di động**:
   - Hiển thị danh sách gói cước động tải trực tiếp từ MongoDB.
   - Tìm kiếm theo từ khóa tên gói/mã gói; lọc phân trang theo danh mục (Data, Combo, Social, Thoại), khoảng giá, chu kỳ sử dụng và công nghệ mạng.
2. **Chi tiết gói cước & Sao chép cú pháp**:
   - Hiển thị đầy đủ thông số kỹ thuật ưu đãi thực tế của gói cước di động.
   - Sao chép nhanh cú pháp SMS (Đăng ký soạn cú pháp gửi 191, Hủy gia hạn, Hủy gói cước).
3. **Đăng nhập, Đăng ký & Quản lý thông tin cá nhân**:
   - Đăng ký tài khoản mới (hỗ trợ nhập họ tên, số điện thoại, mật khẩu, email và chọn loại thuê bao trả trước/trả sau).
   - Đăng nhập hệ thống bảo mật bằng JWT lưu trữ token ở LocalStorage.
   - Chức năng sửa đổi Họ tên, Email trong Hồ sơ cá nhân.
   - Thay đổi mật khẩu tài khoản trực tiếp (yêu cầu xác thực mật khẩu cũ trước khi cập nhật).
4. **Nạp tiền ví ảo qua ví MetaMask (Web3 Blockchain) & Lệnh Nạp Pending/Cancelled**:
   - Kết nối ví MetaMask trực tiếp từ giao diện Profile, tự động liên kết ví vào tài khoản DB MongoDB.
   - Tự động kiểm tra mạng và yêu cầu chuyển đổi mạng sang Sepolia Testnet (Chain ID `11155111`).
   - Chọn các mệnh giá nạp từ 10.000đ đến 500.000đ, tự động quy đổi ra lượng ETH tương ứng dựa trên tỷ giá cấu hình.
   - Khi mở quy trình nạp tiền, hệ thống tạo bản ghi `Deposit` với trạng thái `pending` (Đang xử lý).
   - Nếu từ chối trên MetaMask hoặc bấm Hủy trong Modal: Chuyển trạng thái giao dịch sang `cancelled` (Đã hủy).
   - Khi hoàn tất trên Blockchain (Receipt status 1): Chuyển trạng thái sang `success`, tự động cộng tiền VND vào tài khoản và trả về `updatedBalance` làm mới số dư trên Navbar và Profile thời gian thực.
5. **Đăng ký và hủy gói cước di động (Conflict Engine)**:
   - Sử dụng số dư ví ảo VND để đăng ký mua gói cước di động trực tiếp.
   - Xử lý xung đột gói cước (Conflict Engine) ở backend qua 5 bước nghiêm ngặt theo thứ tự:
     1. *Trùng chính gói*: Reject nếu đăng ký trùng gói dài hạn đang hoạt động; tự động cấp mới ưu đãi (`RENEW_SHORT`) nếu là gói ngắn ngày.
     2. *Bắt buộc gói nền*: Reject nếu gói yêu cầu nền (`requires_base_package=true`) nhưng thuê bao chưa có gói `DATA_BASE` hoặc `COMBO` đang hoạt động.
     3. *Gói Add-on*: Nếu gói mới có `is_addon=true` thì ALLOW ngay, bỏ qua toàn bộ kiểm tra xung đột còn lại.
     4. *Trùng nhóm ưu đãi (benefit_group)*: Reject nếu đăng ký 2 gói cùng `benefit_group` và cả hai đều dài hạn (>= 30 ngày). Cho phép nếu gói mới là ngắn ngày hoặc khác hệ ưu đãi.
     5. *Registration Policy*: Áp dụng trường `registration_policy` cấu hình trên gói (`REPLACE` để tự động chấm dứt và thay thế gói cũ cùng hệ, `REJECT` để từ chối đăng ký song song, `ALLOW` để chạy song song).
   - Cho phép người dùng bật/tắt tính năng Tự động gia hạn gói cước, hoặc bấm Hủy gói cước ngay lập tức trên giao diện.
6. **Cơ chế Xóa Mềm (Soft Delete) Lịch Sử**:
   - Tất cả các thao tác xóa lịch sử gói cước (`DELETE /api/subscriptions/history`) và xóa lịch sử giao dịch (`DELETE /api/transactions`) đều áp dụng cơ chế Xóa Mềm (Soft Delete): cập nhật `isDeleted: true` và `deletedAt: Date` trong DB MongoDB, tuyệt đối không xóa cứng bản ghi. Các API truy vấn chỉ trả về dữ liệu `{ isDeleted: { $ne: true } }`.
7. **Trình Điều Khiển Thời Gian Hệ Thống Toàn Cục (Global Virtual Time Controller)**:
   - Toàn bộ backend sử dụng mô-đun `server/src/utils/virtualTime.js` (`getVirtualDate()`) cho mọi tính toán mốc thời gian (hết hạn gói, tự động gia hạn, tua thời gian).
   - Widget nổi `DevTimeWidget.tsx` cho phép admin/dev nhảy thời gian (+1 ngày, +7 ngày, +30 ngày, +90 ngày), nhập ngày tùy chọn hoặc reset thời gian. Khi tua thời gian khiến tự động gia hạn phát sinh, backend tự động trừ tiền và trả về số dư mới để frontend làm mới tức thì.
8. **AI Chatbot tư vấn gói cước thông minh**:
   - Chatbot tự động trả lời câu hỏi của người dùng thời gian thực dựa trên API Backend kết nối Groq Cloud API (mô hình `llama-3.1-8b-instant`) và Ollama API (`qwen2.5:3b`) dự phòng.
   - Tích hợp luồng xử lý RAG kết hợp NLP: Phân tích intent người dùng (trích xuất khoảng giá, nhu cầu data/thoại, ứng dụng), áp dụng bộ lọc cứng (Hard Filters) để lọc bớt gói cước và tính điểm ưu tiên (Scoring), sau đó biên dịch gói cước thành khối XML sạch để nhúng vào Prompt gửi AI sinh phản hồi.
   - Tự động gắn các nút hành động đề xuất (`suggestedAction`) ở cuối câu trả lời chatbot.
   - Lưu trữ lịch sử trò chuyện vào MongoDB và hỗ trợ xóa lịch sử chat của tài khoản.
9. **Khảo sát chọn gói cước AI (Survey.tsx)**:
   - Câu hỏi khảo sát hiển thị động theo thuật toán Decision Tree từ backend.
   - Kết quả đề xuất gói cước (tối đa 3) được tính toán và khớp tại Backend thông qua `surveyService`.
   - Lưu trữ lịch sử khảo sát và kết quả vào MongoDB (collection `survey_histories`).
10. **Trang Liên hệ hỗ trợ (Contact.tsx)**:
    - Form nhập thông tin liên hệ (Họ tên, Số điện thoại, Dropdown Chủ đề hỗ trợ, Nội dung) kết nối trực tiếp API Backend `/api/contact`.
    - Tự động điền thông tin họ tên và số điện thoại nếu người dùng đã đăng nhập.
11. **Bảng điều khiển Quản trị (Admin Panel)**:
    - Dashboard: Báo cáo số liệu tổng quan về tổng người dùng, tổng gói cước, số lượt đăng ký và tổng doanh thu thực tế từ cơ sở dữ liệu.
    - Quản lý gói cước: CRUD gói cước di động trong MongoDB.
    - Quản lý câu hỏi thường gặp: CRUD danh mục câu hỏi FAQ.
    - Quản lý người dùng di động: Xem danh sách, cập nhật số dư, phân loại thuê bao, khách hàng thân thiết và khóa/mở khóa tài khoản.
    - Cấu hình Chatbot: Chỉnh sửa System Prompt chỉ dẫn AI và cấu hình các từ khóa NLP rule-based.

### 🟡 Các chức năng đang dùng dữ liệu giả lập (Mock Data) / Chưa kết nối Backend:

1. **Khôi phục mật khẩu qua OTP (ForgotPassword.tsx)**:
   - Giao diện gửi mã OTP và đổi mật khẩu hoạt động giả lập hoàn toàn ở phía client thông qua hàm `setTimeout`.
   - Chưa kết nối SMS Gateway gửi tin nhắn thực tế đến điện thoại và chưa gọi API Backend (mã OTP mặc định là `123456`).
2. **Phân tích nhận xét trang So sánh (CompareAI)**:
   - Panel "Gợi Ý Từ Trợ Lý Ảo" trên trang so sánh sử dụng logic phân tích quy tắc cứng được lập trình trực tiếp trong component `CompareAI.tsx` để hiển thị nhận xét về chi phí thấp nhất, data khủng nhất, gói nghe gọi nhiều, các tiện ích...
   - Chưa gửi thông tin so sánh lên AI ở backend để sinh nhận xét động.
3. **Biểu đồ SVG xu hướng doanh thu Admin (Dashboard.tsx)**:
   - Biểu đồ tăng trưởng doanh thu SVG dạng đường vẽ trên Dashboard lấy tổng doanh thu thực tế rồi tính tỷ lệ phần trăm tương đối giả định cho các ngày trong tuần để hiển thị đường biểu đồ.
   - Chưa kết nối với API phân tích doanh thu theo chuỗi thời gian ngày/tháng thực tế.
4. **Nạp tiền ví bằng cổng thanh toán truyền thống (fiat)**:
   - Backend có API `depositFiat` (tạo giao dịch giả lập loại VietQR) nhưng frontend chưa mở rộng giao diện nạp tiền VietQR. Hiện tại frontend hỗ trợ cổng nạp MetaMask Web3.

---

## 5. Cơ Sở Dữ Liệu Hiện Có (Database Schema & Collections)

Cơ sở dữ liệu gồm 12 collection chính trong MongoDB:

1. **`accounts` (Thông tin tài khoản)**:
   - `user_id` (Number, unique): ID định danh người dùng.
   - `fullname` (String): Họ và tên đầy đủ.
   - `phone_number` (String, unique, index): Số điện thoại dùng làm tài khoản đăng nhập.
   - `password` (String): Mật khẩu đã mã hóa bcrypt.
   - `balance` (Number): Số dư ví ảo VND.
   - `role` (String, enum: `['user', 'admin']`): Vai trò phân quyền.
   - `subscription_type` (String, enum: `['tra_truoc', 'tra_sau']`): Loại thuê bao.
   - `is_loyal_customer` (Boolean): Đánh dấu khách hàng thân thiết.
   - `status` (String, enum: `['active', 'blocked', 'pending']`): Trạng thái tài khoản.
   - `wallet_address` (String): Địa chỉ ví MetaMask liên kết.
   - `created_at` (String): Thời gian đăng ký tài khoản.
2. **`goi_cuoc` (Danh mục gói cước)**:
   - `package_id` (Number, unique): ID gói cước.
   - `ma_goi` (String, index): Mã viết tắt của gói cước di động (ví dụ: `SD135`, `MXH100`).
   - `ten` (String): Tên hiển thị của gói.
   - `gia` (Number): Giá tiền đăng ký gói cước.
   - `chu_ky_ngay` (String): Số ngày chu kỳ sử dụng.
   - `data_theo_ngay` (String): Giới hạn data.
   - `free_noi_mang` (String): Số phút gọi nội mạng miễn phí.
   - `free_ngoai_mang` (String): Số phút gọi ngoại mạng miễn phí.
   - `sms` (String): Số lượng tin nhắn miễn phí.
   - `tien_ich_free` (String): Các tiện ích app được miễn phí data.
   - `uudaitrong` (String): Mô tả nội dung ưu đãi chi tiết.
   - `dohot` (String): Đánh dấu mức độ nổi bật (`'Hot'` hoặc `'normal'`).
   - `phan_loai_goi` (String): Nhóm gói (`'Data'`, `'Combo'`, `'Social'`, `'Thoại'`).
   - `system_type` (String): Nhóm phân hệ (VD: `DATA_BASE`, `COMBO`, `VOICE_SMS`, `ADDON`).
   - `is_addon` (Boolean): Đánh dấu gói cước là tiện ích bổ trợ.
   - `is_long_term` (Boolean): Đánh dấu gói dài hạn.
   - `requires_base_package` (Boolean): Gói yêu cầu có gói data nền hoạt động.
   - `allow_parallel_with` ([String]): Danh sách system_type được chạy song song.
   - `benefit_group` (String): Nhóm ưu đãi dùng để check trùng hệ dài hạn (VD: `FACEBOOK`, `YOUTUBE`, `TIKTOK`, `GENERAL_DATA`).
   - `loai_mang` (String): Công nghệ mạng hỗ trợ (`4G` hoặc `5G`).
   - `dangky`, `huygiahan`, `huygoicuoc` (String): Các cú pháp SMS tương ứng gửi 191.
3. **`user_subscriptions` (Đăng ký gói cước)**:
   - `userId` (Number, index): ID người dùng đăng ký.
   - `packageId` (Number, index): ID gói cước đăng ký.
   - `registeredAt` (Date): Thời điểm người dùng thực hiện thao tác đăng ký.
   - `activatedAt` (Date): Thời điểm kích hoạt gói cước.
   - `startedAt` (Date): Thời điểm bắt đầu tính chu kỳ sử dụng.
   - `expiresAt` (Date): Thời điểm hết hạn gói cước.
   - `status` (String, enum: `['ACTIVE', 'PENDING_PAYMENT', 'EXPIRED', 'CANCELLED', 'REPLACED']`): Trạng thái gói đăng ký.
   - `autoRenew` (Boolean): Trạng thái tự động gia hạn gói cước.
   - `cycle` (String, enum: `['DAY', 'MONTH', 'YEAR']`): Chu kỳ gói.
   - `duration` (Number): Số ngày thời gian sử dụng gói cước.
   - `cycleType` (String): Tên định danh chu kỳ chi tiết.
   - `cancelledAt` (Date): Thời điểm hủy gói.
   - `cancelReason` (String): Lý do hủy gói.
   - `replacedAt` (Date): Thời điểm bị thay thế bởi gói khác.
   - `replacedBySubscriptionId` (ObjectId): ID lượt đăng ký mới thay thế.
   - `isDeleted` (Boolean, default `false`): Đánh dấu xóa mềm.
   - `deletedAt` (Date, default `null`): Thời điểm thực hiện xóa mềm.
4. **`chat_histories` (Lịch sử hội thoại chatbot)**:
   - `userId` (ObjectId, ref: `Account`): Liên kết đến tài khoản người dùng chat.
   - `sender` (String, enum: `['user', 'bot']`): Người gửi tin nhắn.
   - `text` (String): Nội dung tin nhắn chat.
   - `suggestedAction` (Mixed): Gợi ý hành động kèm theo tin nhắn bot.
   - `packages` (Array): Danh sách gói cước mà AI đề xuất kèm theo tin nhắn bot.
   - `createdAt`, `updatedAt` (Date): Thời gian gửi tin nhắn.
5. **`chatbot_configs` (Cấu hình chatbot AI)**:
   - `systemPrompt` (String): Lời nhắc hệ thống chỉ dẫn hành vi cho mô hình LLM.
   - `trainingKeywords` (Array): Quy tắc từ khóa NLP rule-based gồm `{ keyword, response, suggestedPackageId }`.
6. **`deposits` (Lịch sử nạp tiền ví di động)**:
   - `deposit_id` (Number, unique): ID giao dịch nạp tiền.
   - `user_id` (Number, index): ID người dùng nạp tiền.
   - `amountVND` (Number): Số tiền VND được nạp vào tài khoản.
   - `amountETH` (String): Số lượng ETH Sepolia giao dịch trên Blockchain.
   - `exchangeRate` (Number): Tỷ giá quy đổi tại thời điểm nạp.
   - `txHash` (String, unique, index): Mã băm (hash) giao dịch blockchain Sepolia dùng để verify.
   - `network` (String): Tên mạng nạp tiền (mạng blockchain hoặc VietQR).
   - `status` (String): Trạng thái giao dịch (`'success'`, `'pending'`, `'cancelled'`, `'failed'`).
   - `walletAddress` (String): Địa chỉ ví gửi tiền MetaMask.
   - `isDeleted` (Boolean, default `false`): Đánh dấu xóa mềm.
   - `deletedAt` (Date, default `null`): Thời điểm xóa mềm.
   - `created_at` (String): Thời gian giao dịch.
7. **`faqs` (Danh mục câu hỏi thường gặp)**:
   - `id` (String, unique): ID câu hỏi FAQ.
   - `question` (String): Câu hỏi thường gặp.
   - `answer` (String): Câu trả lời tương ứng.
   - `category` (String): Phân mục chủ đề câu hỏi.
8. **`compare_histories` (Lịch sử phiên so sánh gói cước)**:
   - `session_id` (String, unique, index): ID phiên so sánh duy nhất.
   - `user_id` (Number): ID người dùng đã đăng nhập (null nếu là khách).
   - `guest_id` (String): ID định danh khách chưa đăng nhập.
   - `is_guest` (Boolean): Đánh dấu phiên so sánh của khách.
   - `packages_compared` ([String]): Danh sách ID các gói đã so sánh.
   - `final_packages` ([String]): Danh sách ID các gói còn lại.
   - `selected_package` (String): ID gói cước đã chọn đăng ký.
   - `compare_count` (Number): Số lượng gói cước đã so sánh.
   - `compare_duration` (Number): Thời gian phiên so sánh (giây).
   - `status` (String): Trạng thái phiên (`ACTIVE`, `COMPLETED`, `ABANDONED`, `CLEARED`).
   - `created_at`, `updated_at` (Date): Timestamps.
9. **`contacts` (Yêu cầu liên hệ hỗ trợ)**:
   - `contact_id` (String, unique, index): ID yêu cầu liên hệ.
   - `user_id` (Number): ID người dùng gửi (null nếu là khách).
   - `full_name` (String): Họ và tên người gửi.
   - `phone` (String): Số điện thoại liên hệ.
   - `topic` (String): Chủ đề hỗ trợ yêu cầu.
   - `message` (String): Nội dung yêu cầu liên hệ.
   - `status` (String, enum: `['NEW', 'READ', 'PROCESSING', 'DONE', 'CLOSED']`): Trạng thái xử lý.
   - `created_at`, `updated_at` (Date): Timestamps.
10. **`package_features` (Đặc trưng gói cước cho gợi ý khảo sát)**:
    - `package_id` (Number, unique, index): ID gói cước tương ứng.
    - `ma_goi` (String, index): Mã gói cước.
    - Các trường boolean đặc trưng (`has_data`, `has_voice`, `is_combo`, `is_social`,...).
    - `price_level`, `data_level`, `voice_level`, `sms_level`: Các mức phân loại.
    - `searchable_tags` ([String]): Thẻ tìm kiếm tổng hợp.
11. **`survey_configs` (Cấu hình câu hỏi khảo sát)**:
    - `title`, `description`, `field`, `component`, `order`, `multiple`, `options`.
12. **`survey_histories` (Lịch sử khảo sát người dùng)**:
    - `userId`, `answers`, `filters`, `recommendedPackages`, `isEarlyTerminated`, `deleted`, `deletedAt`.

---

## 6. Phân Tích Mã Nguồn Dư Thừa (Unused / Dead Files)

Qua quá trình rà soát và kiểm toán toàn bộ mã nguồn của dự án, các file sau đây hiện tồn tại trong thư mục dự án nhưng **hoàn toàn không tham gia vào bất kỳ tác vụ hay luồng xử lý thực tế nào**:

1. **`client/src/services/compareAIService.ts`**:
   - *Lý do*: Chứa các hàm hỗ trợ phân tích AI client-side cho tính năng so sánh gói cước. Tuy nhiên, component `client/src/components/CompareAI.tsx` đã trực tiếp triển khai logic phân tích quy tắc ngay bên trong component. Do đó, `compareAIService.ts` không còn được `import` hay sử dụng ở bất kỳ trang/component nào.
2. **`client/src/utils/chatbotEngine.ts`**:
   - *Lý do*: File xử lý logic chatbot giả lập offline phiên bản cũ ở client. Hiện tại, toàn bộ hội thoại chatbot được chuyển sang gọi API trực tiếp với backend AI (`/api/chatbot/chat`). `chatbotEngine.ts` là mã nguồn cũ còn sót lại và không có liên kết nào đến nó.
3. **`server/src/seed_extra.js`**:
   - *Lý do*: Kịch bản khởi tạo dữ liệu mở rộng riêng lẻ được tạo trong giai đoạn thử nghiệm ban đầu. Hiện tại, toàn bộ logic seed dữ liệu chuẩn đã được tích hợp tập trung vào `server/src/seed.js` (tự động chạy khi khởi động server), làm cho `seed_extra.js` trở thành file dư thừa không được thực thi.
4. **`client/src/assets/react.svg` và `client/src/assets/vite.svg`**:
   - *Lý do*: Các file hình ảnh icon mặc định được tạo tự động bởi công cụ Vite khi khởi tạo dự án React. Chúng không được render hoặc sử dụng trong bất kỳ component nào của ứng dụng WebViettel.
