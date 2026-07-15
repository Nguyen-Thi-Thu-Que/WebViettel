# Website cung cấp gói cước di động Viettel tích hợp chatbot

## 1. Cấu Trúc Cây Thư Mục (Directory Tree)
```text
WebViettel/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   │   ├── hero.png
│   │   │   ├── react.svg
│   │   │   └── vite.svg
│   │   ├── components/
│   │   │   ├── AdvancedFilter.tsx
│   │   │   ├── Breadcrumb.tsx
│   │   │   ├── Chatbot.tsx
│   │   │   ├── CompareDrawer.tsx
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
│   │   │   ├── Home.tsx
│   │   │   ├── PackageDetail.tsx
│   │   │   ├── Packages.tsx
│   │   │   ├── Profile.tsx
│   │   │   └── Survey.tsx
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── axiosInstance.ts
│   │   │   └── web3Service.ts
│   │   ├── store/
│   │   │   └── index.ts
│   │   ├── types/
│   │   │   ├── index.ts
│   │   │   └── web3.ts
│   │   ├── utils/
│   │   │   ├── chatbotEngine.ts
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
│   │   │   ├── faqController.js
│   │   │   ├── packageController.js
│   │   │   ├── subscriptionController.js
│   │   │   ├── transactionController.js
│   │   │   └── userController.js
│   │   ├── middlewares/
│   │   │   ├── authMiddleware.js
│   │   │   └── errorMiddleware.js
│   │   ├── models/
│   │   │   ├── Account.js
│   │   │   ├── ChatHistory.js
│   │   │   ├── ChatbotConfig.js
│   │   │   ├── Deposit.js
│   │   │   ├── FAQ.js
│   │   │   ├── Package.js
│   │   │   └── UserSubscription.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── chatbotRoutes.js
│   │   │   ├── faqRoutes.js
│   │   │   ├── packageRoutes.js
│   │   │   ├── subscriptionRoutes.js
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
│   │   │   │   ├── promptBuilder.js
│   │   │   │   └── scoring_config.json
│   │   │   ├── authService.js
│   │   │   ├── chatbotService.js
│   │   │   ├── faqService.js
│   │   │   ├── subscriptionService.js
│   │   │   ├── transactionService.js
│   │   │   └── userService.js
│   │   ├── utils/
│   │   │   └── permission.js
│   │   ├── index.js
│   │   ├── seed.js
│   │   └── seed_extra.js
│   ├── .env
│   └── package.json
├── .gitignore
├── package-lock.json
├── package.json
└── README.md
```

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
- **Thư mục Backend (`server/`)**:
  - `package.json`: Danh sách phụ thuộc và script khởi chạy server Node/Express.
  - `.env`: Chứa cấu hình cổng chạy, DB MongoDB, xác thực JWT, và API key của AI chatbot.
  - `src/services/chatbot/scoring_config.json`: Cấu hình hệ số điểm khớp gói cước của chatbot.

### Chi tiết cấu hình biến môi trường (`.env`):
- **Cấu hình Backend (`server/.env`)**:
  - `MONGODB_URI`: Địa chỉ kết nối đến cơ sở dữ liệu MongoDB.
  - `PORT`: Cổng khởi chạy dịch vụ backend (mặc định `5000`).
  - `JWT_SECRET`: Chuỗi khóa bảo mật dùng để mã hóa và giải mã JSON Web Token (JWT).
  - `RECEIVER_WALLET`: Địa chỉ ví MetaMask nhận ETH Sepolia cho giao dịch nạp tiền.
  - `ETH_EXCHANGE_RATE`: Tỷ giá quy đổi giả lập giữa tiền VND và ETH Sepolia (ví dụ: `75000000` VND/ETH).
  - `RPC_URL`: RPC URL kết nối mạng blockchain thử nghiệm Sepolia.
  - `AI_PROVIDER`: Nhà cung cấp dịch vụ AI (VD: `groq`).
  - `GROQ_API_KEY`: API Key đăng ký của dịch vụ Groq Cloud.
  - `GROQ_MODEL`: Mô hình ngôn ngữ lớn sử dụng (mặc định `llama-3.1-8b-instant`).
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
- **Trang So sánh gói cước (Compare.tsx)**: Giao diện so sánh trực quan dưới dạng bảng cho tối đa 3 gói cước di động cùng lúc, kèm bảng phân tích nhận xét tự động từ trợ lý ảo.
- **Trang Khảo sát chọn gói (Survey.tsx)**: Giao diện khảo sát 4 bước (wizard) giúp thu thập thông tin thói quen tiêu dùng và đề xuất 3 gói cước di động phù hợp nhất.
- **Hồ sơ cá nhân & Nạp tiền (Profile.tsx)**: Khu vực quản lý tài khoản của người dùng, chia làm nhiều tab:
  - Hồ sơ cá nhân (thông tin tài khoản di động)
  - Nạp tiền tài khoản (cổng kết nối MetaMask)
  - Gói cước đang dùng (quản lý trạng thái và tự động gia hạn)
  - Lịch sử đăng ký gói cước
  - Lịch sử giao dịch (danh sách nạp tiền ví ảo)
  - Đổi mật khẩu
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
- `Navbar`: Thanh điều hướng đầu trang, hiển thị logo ViettelAI, các liên kết trang chủ, gói cước, so sánh, khảo sát, và góc hiển thị số dư ví ảo kèm nút trang cá nhân hoặc đăng nhập.
- `Footer`: Chứa các thông tin liên hệ, liên kết nhanh bản quyền dự án.
- `PackageCard`: Thẻ hiển thị tóm tắt thông tin gói cước (tên, giá, dung lượng data, cuộc gọi, nút đăng ký nhanh, nút so sánh).
- `AdvancedFilter`: Bộ lọc nâng cao trên trang duyệt gói cước (lọc theo loại gói, chu kỳ, giá cước, công nghệ mạng, dịch vụ...).
- `Chatbot`: Hộp thoại bong bóng chat nhỏ cố định ở góc màn hình phục vụ chat nhanh với trợ lý ảo từ mọi trang.
- `RegisterModal`: Modal xác nhận và xử lý đăng ký gói cước cho người dùng di động.
- `CompareDrawer`: Khay trượt chứa danh sách các gói cước đang chọn so sánh nằm cố định bên dưới màn hình.
- `SEO`: Thành phần cấu hình thẻ tiêu đề, mô tả và cấu trúc Schema JSON-LD hỗ trợ chuẩn hóa SEO cho từng trang.
- `Breadcrumb`: Thanh dẫn hướng đường dẫn giúp xác định vị trí trang hiện tại.
- Các thành phần skeleton (`Skeleton`, `LoadingSkeleton`): Hiển thị trạng thái tải dữ liệu giả lập cho các thẻ gói cước và bảng biểu.

### Trạng thái trực quan (Responsive):
- Giao diện được thiết kế hoàn chỉnh theo cơ chế Responsive trên nền tảng Tailwind CSS.
- Layout và các cấu trúc lưới (grid) hoạt động ổn định trên cả 3 phân khúc kích thước màn hình phổ biến:
  - **Màn hình lớn (Desktop / Laptop)**: Hiển thị đầy đủ sidebar quản trị, bảng so sánh đa cột, lưới 3-4 gói cước trên một hàng.
  - **Màn hình trung bình (Tablet)**: Các lưới gói cước tự động chuyển về 2 cột, bảng so sánh hỗ trợ cuộn ngang mượt mà, sidebar tài khoản chuyển về dạng menu xếp chồng.
  - **Màn hình nhỏ (Mobile)**: Giao diện chuyển tối giản, ẩn các chi tiết phụ, các thẻ và cột hiển thị dạng dọc (block), menu điều hướng chuyển đổi linh hoạt để đảm bảo không bị vỡ bố cục hay tràn viền.

---

## 4. Chức Năng Hiện Có (Current Features & Functionalities)

### 🟢 Các chức năng đã hoạt động ổn định:
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
4. **Nạp tiền ví ảo qua ví MetaMask (Web3 Blockchain)**:
   - Kết nối ví MetaMask trực tiếp từ giao diện Profile, tự động liên kết ví vào tài khoản DB MongoDB.
   - Tự động kiểm tra mạng và yêu cầu chuyển đổi mạng sang Sepolia Testnet (Chain ID `11155111`).
   - Chọn các mệnh giá nạp từ 10.000đ đến 500.000đ, tự động quy đổi ra lượng ETH tương ứng dựa trên tỷ giá cấu hình.
   - Thực hiện giao dịch chuyển ETH Sepolia đến ví đích cấu hình bằng thư viện Ethers.js.
   - Chờ xác nhận giao dịch thành công trên Blockchain (đọc trạng thái Receipt status 1), gửi mã hash giao dịch lên backend để xác thực và tự động cộng tiền VND vào số dư tài khoản.
   - Xem lịch sử các lần nạp tiền kèm link dẫn sang trang Etherscan.io để đối chiếu.
5. **Đăng ký và hủy gói cước di động (Conflict Engine)**:
   - Sử dụng số dư ví ảo VND để đăng ký mua gói cước di động trực tiếp.
   - Xử lý xung đột gói cước (Conflict Engine) ở backend qua 5 bước nghiêm ngặt:
     1. *Trùng chính gói*: Reject nếu đăng ký trùng gói dài hạn; tự động cho phép gia hạn sớm (`RENEW_SHORT`) nếu là gói ngắn ngày.
     2. *Bắt buộc gói nền*: Reject nếu gói yêu cầu nền nhưng thuê bao chưa có gói `DATA_BASE` hoặc `COMBO` hoạt động.
     3. *Gói Add-on*: Bỏ qua xung đột và cho phép đăng ký song song.
     4. *Trùng nhóm ưu đãi (benefit_group)*: Reject nếu đăng ký 2 gói cùng nhóm dài hạn (ví dụ: cùng hệ Facebook/TikTok/YouTube/Data). Cho phép nếu có 1 gói ngắn ngày.
     5. *Registration Policy*: Áp dụng quy tắc cấu hình của gói (REPLACE để tự động chấm dứt và thay thế gói cũ, REJECT để từ chối đăng ký song song, ALLOW để chạy song song).
   - Cho phép người dùng bật/tắt tính năng Tự động gia hạn gói cước, hoặc bấm Hủy gói cước ngay lập tức trên giao diện.
   - Cơ chế background cron job tự động chạy mỗi 10 giây quét toàn bộ thuê bao để xử lý tự động gia hạn hoặc chấm dứt gói cước (chuyển trạng thái `EXPIRED`) khi hết hạn.
6. **AI Chatbot tư vấn gói cước thông minh**:
   - Chatbot tự động trả lời câu hỏi của người dùng thời gian thực dựa trên API Backend kết nối Groq Cloud API (mô hình `llama-3.1-8b-instant`) và Ollama API (`qwen2.5:3b`) dự phòng.
   - Tích hợp luồng xử lý RAG kết hợp NLP: Phân tích intent người dùng (trích xuất khoảng giá, nhu cầu data/thoại, ứng dụng), áp dụng bộ lọc cứng (Hard Filters) để lọc bớt gói cước và tính điểm ưu tiên (Scoring), sau đó biên dịch gói cước thành khối XML sạch để nhúng vào Prompt gửi AI sinh phản hồi (giảm ảo giác).
   - Tự động gắn các nút hành động đề xuất (`suggestedAction`) ở cuối câu trả lời chatbot (ví dụ: nút "Xem chi tiết gói..." hoặc nút "Làm khảo sát ngay").
   - Lưu trữ lịch sử trò chuyện vào MongoDB và hỗ trợ xóa lịch sử chat của tài khoản.
7. **Bảng điều khiển Quản trị (Admin Panel)**:
   - Dashboard: Báo cáo số liệu tổng quan về tổng người dùng, tổng gói cước, số lượt đăng ký và tổng doanh thu thực tế từ cơ sở dữ liệu.
   - Quản lý gói cước: CRUD (Xem, thêm mới, sửa, xóa) gói cước di động trong MongoDB.
   - Quản lý câu hỏi thường gặp: CRUD danh mục câu hỏi FAQ.
   - Quản lý người dùng di động: Xem danh sách, thay đổi số dư ví, đổi loại thuê bao, bật/tắt KHTT, khóa/mở khóa tài khoản.
   - Cấu hình Chatbot: Chỉnh sửa System Prompt chỉ dẫn AI và cấu hình các từ khóa NLP rule-based.

### 🟡 Các chức năng đang dùng dữ liệu giả lập (Mock Data) / Chưa kết nối Backend:
1. **Khôi phục mật khẩu qua OTP (ForgotPassword.tsx)**:
   - Giao diện gửi mã OTP và đổi mật khẩu hoạt động giả lập hoàn toàn ở phía client thông qua hàm `setTimeout`.
   - Không kết nối SMS Gateway gửi tin nhắn thực tế đến điện thoại và không gọi API Backend (mã OTP mặc định là `123456`).
2. **Khảo sát chọn gói cước (Survey.tsx)**:
   - Quá trình khảo sát gồm 4 bước và nút "Xem kết quả" đề xuất 3 gói cước chạy logic tính toán hoàn toàn ở phía Client thông qua thuật toán chấm điểm đơn giản (`calculateRecommendations` trong store frontend) dựa trên danh sách gói cước được tải về máy.
   - Chưa tích hợp luồng xử lý AI/LLM ở backend cho tính năng khảo sát này (giao diện hiển thị cảnh báo thông tin thử nghiệm ở Sprint 8.1).
3. **So sánh gói cước thông minh (Compare.tsx)**:
   - Khung "Nhận xét thông minh từ Viettel AI" trên trang so sánh thực chất là logic phân tích quy tắc cứng được lập trình trực tiếp bằng mã Javascript ở phía Client (`generateAIAnalysis` trong `Compare.tsx`) để tự động hiển thị nhận xét về chi phí thấp nhất, data khủng nhất, gói nghe gọi nhiều, gói giải trí...
   - Chưa có API kết nối gửi thông tin so sánh lên AI ở backend để trả kết quả nhận xét tự nhiên.
4. **Biểu đồ SVG xu hướng doanh thu Admin (Dashboard.tsx)**:
   - Biểu đồ tăng trưởng doanh thu SVG dạng đường vẽ trên Dashboard hoạt động bằng cách lấy tổng doanh số doanh thu tĩnh rồi nhân chia theo tỷ lệ phần trăm tương đối giả định cho các thứ trong tuần (`Math.round(totalRevenueVal * 0.4)`...) để hiển thị đường biểu đồ.
   - Chưa kết nối với nguồn dữ liệu thống kê phân chia doanh thu chính xác theo từng ngày thực tế từ API.
5. **Nạp tiền ví bằng cổng thanh toán truyền thống khác (fiat)**:
   - Backend hỗ trợ API `depositFiat` nhưng frontend chưa dựng giao diện cho các phương thức thanh toán truyền thống như cổng VietQR (chỉ có duy nhất giao diện nạp tiền qua cổng blockchain MetaMask ở trang cá nhân).

### CSDL hiện có trong API MongoDB
Cơ sở dữ liệu gồm 7 collection chính trong MongoDB:
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
   - `activatedAt` (Date): Thời điểm kích hoạt gói cước.
   - `expiresAt` (Date): Thời điểm hết hạn gói cước.
   - `status` (String, enum: `['ACTIVE', 'PENDING_PAYMENT', 'EXPIRED', 'CANCELLED', 'REPLACED']`): Trạng thái gói đăng ký.
   - `autoRenew` (Boolean): Trạng thái tự động gia hạn gói cước.
   - `cycle` (String, enum: `['DAY', 'MONTH', 'YEAR']`): Chu kỳ gói.
   - `duration` (Number): Số ngày thời gian sử dụng gói cước.
   - `cycleType` (String): Tên định danh chu kỳ chi tiết.
   - `cancelledAt` (Date): Thời điểm hủy gói (nếu có).
   - `replacedAt` (Date): Thời điểm bị thay thế bởi gói khác (nếu có).
   - `replacedBySubscriptionId` (ObjectId): ID lượt đăng ký mới thay thế gói này.
4. **`chat_histories` (Lịch sử hội thoại chatbot)**:
   - `userId` (ObjectId, ref: `Account`): Liên kết đến tài khoản người dùng chat.
   - `sender` (String, enum: `['user', 'bot']`): Người gửi tin nhắn.
   - `text` (String): Nội dung tin nhắn chat.
   - `suggestedAction` (Mixed): Gợi ý hành động kèm theo tin nhắn bot.
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
   - `status` (String): Trạng thái giao dịch (`'success'`, `'pending'`,...).
   - `walletAddress` (String): Địa chỉ ví gửi tiền MetaMask.
   - `created_at` (String): Thời gian giao dịch.
7. **`faqs` (Danh mục câu hỏi thường gặp)**:
   - `id` (String, unique): ID câu hỏi FAQ.
   - `question` (String): Câu hỏi thường gặp.
   - `answer` (String): Câu trả lời tương ứng.
   - `category` (String): Phân mục chủ đề câu hỏi.
