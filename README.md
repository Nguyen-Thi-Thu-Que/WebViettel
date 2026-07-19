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
│   │   │   ├── CompareAI.tsx
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
│   │   │   ├── Contact.tsx
│   │   │   ├── Home.tsx
│   │   │   ├── PackageDetail.tsx
│   │   │   ├── Packages.tsx
│   │   │   ├── Profile.tsx
│   │   │   └── Survey.tsx
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── axiosInstance.ts
│   │   │   ├── compareAIService.ts
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
  - `package.json`: Danh sách phụ thuộc và script khởi chạy server Node/Express. Gồm: `express`, `mongoose`, `bcryptjs`, `cors`, `dotenv`, `ethers`, `@google/generative-ai`, `csv-parser`.
  - `.env`: Chứa cấu hình cổng chạy, DB MongoDB, xác thực JWT, và API key của AI chatbot.
  - `src/services/chatbot/scoring_config.json`: Cấu hình hệ số điểm khớp gói cước của chatbot.

### Chi tiết cấu hình biến môi trường (`.env`):

- **Cấu hình Backend (`server/.env`)**:
  - `MONGODB_URI`: Địa chỉ kết nối đến cơ sở dữ liệu MongoDB.
  - `PORT`: Cổng khởi chạy dịch vụ backend (mặc định `5000`).
  - `JWT_SECRET`: Chuỗi khóa bảo mật dùng để ký và xác thực JSON Web Token (JWT). JWT được triển khai thủ công theo chuẩn HMAC-SHA256, không phụ thuộc thư viện bên ngoài.
  - `RECEIVER_WALLET`: Địa chỉ ví MetaMask nhận ETH Sepolia cho giao dịch nạp tiền.
  - `ETH_EXCHANGE_RATE`: Tỷ giá quy đổi giả lập giữa tiền VND và ETH Sepolia (ví dụ: `75000000` VND/ETH).
  - `RPC_URL`: RPC URL kết nối mạng blockchain thử nghiệm Sepolia.
  - `AI_PROVIDER`: Nhà cung cấp dịch vụ AI (VD: `groq`). Nếu không đặt, mặc định là `groq`.
  - `GROQ_API_KEY`: API Key đăng ký của dịch vụ Groq Cloud.
  - `GROQ_MODEL`: Mô hình ngôn ngữ lớn Groq sử dụng (mặc định `llama-3.1-8b-instant`).
  - `OLLAMA_MODEL`: Mô hình ngôn ngữ lớn Ollama dùng khi fallback (mặc định `qwen2.5:3b`).
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
- **Hồ sơ cá nhân & Nạp tiền (Profile.tsx)**: Khu vực quản lý tài khoản của người dùng, chia làm nhiều tab:
  - Hồ sơ cá nhân (thông tin tài khoản di động)
  - Nạp tiền tài khoản (cổng kết nối MetaMask)
  - Gói cước đang dùng (quản lý trạng thái và tự động gia hạn)
  - Lịch sử đăng ký gói cước
  - Lịch sử giao dịch (danh sách nạp tiền ví ảo)
  - Đổi mật khẩu
- **Trang Liên hệ hỗ trợ (Contact.tsx)**: Form liên hệ gửi yêu cầu hỗ trợ (họ tên, số điện thoại, nội dung) kết nối trực tiếp với API Backend. Tự động điền thông tin nếu người dùng đã đăng nhập. Xác thực đầu vào cả phía client và backend trước khi lưu vào CSDL.
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

- `Navbar`: Thanh điều hướng đầu trang, hiển thị logo ViettelAI, các liên kết trang chủ, gói cước, so sánh, khảo sát, tư vấn AI, liên hệ, và góc hiển thị số dư ví ảo kèm nút trang cá nhân hoặc đăng nhập.
- `Footer`: Chứa các thông tin liên hệ, liên kết nhanh bản quyền dự án.
- `PackageCard`: Thẻ hiển thị tóm tắt thông tin gói cước (tên, giá, dung lượng data, cuộc gọi, nút đăng ký nhanh, nút so sánh).
- `AdvancedFilter`: Bộ lọc nâng cao trên trang duyệt gói cước (lọc theo loại gói, chu kỳ, giá cước, công nghệ mạng, dịch vụ...).
- `Chatbot`: Hộp thoại bong bóng chat nhỏ cố định ở góc màn hình phục vụ chat nhanh với trợ lý ảo từ mọi trang.
- `CompareAI`: Panel hiển thị phân tích nhận xét thông minh (client-side) cho trang so sánh gói cước, gồm tóm tắt sự khác biệt, gợi ý lựa chọn và highlight ưu điểm từng gói (giá rẻ nhất, data nhiều nhất, gọi nhiều nhất...).
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
   - Xử lý xung đột gói cước (Conflict Engine) ở backend qua 5 bước nghiêm ngặt theo thứ tự:
     1. *Trùng chính gói*: Reject nếu đăng ký trùng gói dài hạn đang hoạt động; tự động cấp mới ưu đãi (`RENEW_SHORT`) nếu là gói ngắn ngày.
     2. *Bắt buộc gói nền*: Reject nếu gói yêu cầu nền (`requires_base_package=true`) nhưng thuê bao chưa có gói `DATA_BASE` hoặc `COMBO` đang hoạt động.
     3. *Gói Add-on*: Nếu gói mới có `is_addon=true` thì ALLOW ngay, bỏ qua toàn bộ kiểm tra xung đột còn lại.
     4. *Trùng nhóm ưu đãi (benefit_group)*: Reject nếu đăng ký 2 gói cùng `benefit_group` và cả hai đều dài hạn (>= 30 ngày). Cho phép nếu gói mới là ngắn ngày hoặc khác hệ ưu đãi.
     5. *Registration Policy*: Áp dụng trường `registration_policy` cấu hình trên gói (`REPLACE` để tự động chấm dứt và thay thế gói cũ cùng hệ, `REJECT` để từ chối đăng ký song song, `ALLOW` để chạy song song).
   - Cho phép người dùng bật/tắt tính năng Tự động gia hạn gói cước, hoặc bấm Hủy gói cước ngay lập tức trên giao diện. Hỗ trợ thêm thao tác **xóa lịch sử đăng ký** (xóa các bản ghi trạng thái `CANCELLED`, `EXPIRED`, `REPLACED`) từ giao diện Profile.
   - Cơ chế background `setInterval` tự động chạy mỗi 10 giây (tại `subscriptionService.js`) quét toàn bộ thuê bao để xử lý tự động gia hạn hoặc chuyển trạng thái `EXPIRED` khi hết hạn. Đồng thời, quá trình gia hạn cũng được kích hoạt real-time mỗi khi người dùng truy vấn gói đang dùng.
6. **AI Chatbot tư vấn gói cước thông minh**:
   - Chatbot tự động trả lời câu hỏi của người dùng thời gian thực dựa trên API Backend kết nối Groq Cloud API (mô hình `llama-3.1-8b-instant`) và Ollama API (`qwen2.5:3b`) dự phòng.
   - Tích hợp luồng xử lý RAG kết hợp NLP: Phân tích intent người dùng (trích xuất khoảng giá, nhu cầu data/thoại, ứng dụng), áp dụng bộ lọc cứng (Hard Filters) để lọc bớt gói cước và tính điểm ưu tiên (Scoring), sau đó biên dịch gói cước thành khối XML sạch để nhúng vào Prompt gửi AI sinh phản hồi (giảm ảo giác).
   - Tự động gắn các nút hành động đề xuất (`suggestedAction`) ở cuối câu trả lời chatbot (ví dụ: nút "Xem chi tiết gói..." hoặc nút "Làm khảo sát ngay").
   - Lưu trữ lịch sử trò chuyện vào MongoDB và hỗ trợ xóa lịch sử chat của tài khoản.
7. **Khảo sát chọn gói cước AI (Survey.tsx)**:
   - Câu hỏi khảo sát hiển thị động theo thuật toán Decision Tree từ backend: hệ thống tự động lựa chọn và sắp xếp câu hỏi tiếp theo dựa trên tập gói cước còn lại sau mỗi lượt lọc (chỉ hỏi câu hỏi có khả năng phân loại được thêm).
   - Kết quả đề xuất gói cước (tối đa 3) được tính toán và khớp tại Backend thông qua `surveyService` trước khi trả về Frontend.
   - Hỗ trợ dừng sớm khảo sát (`isEarlyTerminated`) khi số lượng gói cước còn lại đã đủ nhỏ để hiển thị kết quả mà không cần hỏi thêm.
   - Lưu trữ lịch sử khảo sát và kết quả vào MongoDB (collection `survey_histories`) cho người dùng đã đăng nhập; hỗ trợ xóa lịch sử khảo sát từ giao diện.
8. **Trang Liên hệ hỗ trợ (Contact.tsx)**:
   - Form nhập thông tin liên hệ (Họ tên, Số điện thoại, Nội dung) kết nối trực tiếp API Backend `/api/contact`.
   - Xác thực đầu vào hai lớp (client-side validation + backend validation) trước khi lưu vào collection `contacts` MongoDB.
   - Tự động điền thông tin họ tên và số điện thoại nếu người dùng đã đăng nhập.
9. **Bảng điều khiển Quản trị (Admin Panel)**:
   - Dashboard: Báo cáo số liệu tổng quan về tổng người dùng, tổng gói cước, số lượt đăng ký và tổng doanh thu thực tế từ cơ sở dữ liệu. Hiển thị danh sách 10 giao dịch gần nhất (tổng hợp từ cả nạp tiền và đăng ký gói cước).
   - Quản lý gói cước: CRUD (Xem, thêm mới, sửa, xóa) gói cước di động trong MongoDB.
   - Quản lý câu hỏi thường gặp: CRUD danh mục câu hỏi FAQ.
   - Quản lý người dùng di động: Xem danh sách, thay đổi số dư ví, đổi loại thuê bao, bật/tắt KHTT, khóa/mở khóa tài khoản.
   - Cấu hình Chatbot: Chỉnh sửa System Prompt chỉ dẫn AI và cấu hình các từ khóa NLP rule-based.

### 🟡 Các chức năng đang dùng dữ liệu giả lập (Mock Data) / Chưa kết nối Backend:

1. **Khôi phục mật khẩu qua OTP (ForgotPassword.tsx)**:
   - Giao diện gửi mã OTP và đổi mật khẩu hoạt động giả lập hoàn toàn ở phía client thông qua hàm `setTimeout`.
   - Không kết nối SMS Gateway gửi tin nhắn thực tế đến điện thoại và không gọi API Backend (mã OTP mặc định là `123456`).
2. **Phân tích nhận xét trang So sánh (CompareAI)**:
   - Panel "Gợi Ý Từ Trợ Lý Ảo" trên trang so sánh sử dụng logic phân tích quy tắc cứng được lập trình bằng mã Javascript tại client (`compareAIService.ts`) để hiển thị nhận xét về chi phí thấp nhất, data khủng nhất, gói nghe gọi nhiều, các tiện ích...
   - Chưa có API kết nối gửi thông tin so sánh lên AI ở backend để trả kết quả nhận xét tự nhiên.
3. **Biểu đồ SVG xu hướng doanh thu Admin (Dashboard.tsx)**:
   - Biểu đồ tăng trưởng doanh thu SVG dạng đường vẽ trên Dashboard hoạt động bằng cách lấy tổng doanh số doanh thu tĩnh rồi nhân chia theo tỷ lệ phần trăm tương đối giả định cho các thứ trong tuần (`Math.round(totalRevenueVal * 0.4)`...) để hiển thị đường biểu đồ.
   - Chưa kết nối với nguồn dữ liệu thống kê phân chia doanh thu chính xác theo từng ngày thực tế từ API.
4. **Nạp tiền ví bằng cổng thanh toán truyền thống (fiat)**:
   - Backend đã có API `depositFiat` (tạo giao dịch ảo ghi nhận nạp tiền loại VietQR) nhưng frontend chưa dựng giao diện tương ứng. Hiện chỉ có duy nhất giao diện nạp tiền qua cổng blockchain MetaMask ở trang cá nhân.

### ⚙️ Cơ chế bảo mật & hiệu năng Backend (`server/src/index.js`)
- **Security Headers thủ công**: Server tự thiết lập các header bảo mật tiêu chuẩn (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security`) mà không phụ thuộc thư viện Helmet.
- **Rate Limiter tự viết**: Giới hạn tối đa 120 request/phút cho mỗi địa chỉ IP trên tất cả các route `/api/`. Trả về HTTP 429 kèm thông báo tiếng Việt khi vượt ngưỡng.
- **JWT tự triển khai**: Ký và xác thực token theo chuẩn HMAC-SHA256 hoàn toàn bằng module `crypto` gốc của Node.js, không dùng thư viện `jsonwebtoken`.


### CSDL hiện có trong API MongoDB

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
   - `cancelledAt` (Date): Thời điểm hủy gói (nếu có).
   - `cancelReason` (String): Lý do hủy gói (nếu có).
   - `replacedAt` (Date): Thời điểm bị thay thế bởi gói khác (nếu có).
   - `replacedBySubscriptionId` (ObjectId): ID lượt đăng ký mới thay thế gói này.
4. **`chat_histories` (Lịch sử hội thoại chatbot)**:
   - `userId` (ObjectId, ref: `Account`): Liên kết đến tài khoản người dùng chat.
   - `sender` (String, enum: `['user', 'bot']`): Người gửi tin nhắn.
   - `text` (String): Nội dung tin nhắn chat.
   - `suggestedAction` (Mixed): Gợi ý hành động kèm theo tin nhắn bot.
   - `packages` (Array): Danh sách gói cước mà AI đề xuất kèm theo tin nhắn bot (chuẩn hoá đầy đủ các trường để frontend render thẻ gói).
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
8. **`compare_histories` (Lịch sử phiên so sánh gói cước)**:
   - `session_id` (String, unique, index): ID phiên so sánh duy nhất.
   - `user_id` (Number): ID người dùng đã đăng nhập (null nếu là khách).
   - `guest_id` (String): ID định danh khách chưa đăng nhập (lưu LocalStorage).
   - `is_guest` (Boolean): Đánh dấu phiên so sánh của khách.
   - `packages_compared` ([String]): Danh sách ID các gói đã được xem xét so sánh.
   - `final_packages` ([String]): Danh sách ID các gói còn lại khi kết thúc phiên.
   - `selected_package` (String): ID gói cước mà người dùng đã chọn đăng ký (nếu có).
   - `compare_count` (Number): Số lượng gói cước đã so sánh.
   - `compare_duration` (Number): Thời gian phiên so sánh tính bằng giây.
   - `viewed_detail_packages` ([String]): Các gói đã xem chi tiết trong phiên.
   - `completed` (Boolean): Phiên đã hoàn tất (người dùng đăng ký gói).
   - `cleared_by_user` (Boolean): Người dùng chủ động xóa danh sách so sánh.
   - `cleared_at` (Date): Thời điểm người dùng xóa danh sách so sánh (nếu có).
   - `status` (String): Trạng thái phiên (`ACTIVE`, `COMPLETED`, `ABANDONED`, `CLEARED`).
   - `source` (String): Nguồn gốc phiên (mặc định `'compare'`).
   - `created_at`, `updated_at` (Date): Timestamps.
9. **`contacts` (Yêu cầu liên hệ hỗ trợ)**:
   - `contact_id` (String, unique, index): ID yêu cầu liên hệ.
   - `user_id` (Number): ID người dùng gửi (null nếu là khách).
   - `full_name` (String): Họ và tên người gửi.
   - `phone` (String): Số điện thoại liên hệ.
   - `message` (String): Nội dung yêu cầu liên hệ.
   - `status` (String, enum: `['NEW', 'READ', 'PROCESSING', 'DONE', 'CLOSED']`): Trạng thái xử lý.
   - `source` (String, enum: `['guest', 'user']`): Nguồn gốc yêu cầu.
   - `handled_by` (Number): ID admin xử lý.
   - `handled_at` (Date): Thời gian xử lý.
   - `admin_note` (String): Ghi chú nội bộ của admin.
   - `created_at`, `updated_at` (Date): Timestamps.
10. **`package_features` (Đặc trưng gói cước cho gợi ý khảo sát)**:
    - `package_id` (Number, unique, index): ID gói cước tương ứng.
    - `ma_goi` (String, index): Mã gói cước.
    - Các trường boolean đặc trưng: `has_data`, `has_voice`, `has_sms`, `has_youtube`, `has_tiktok`, `has_facebook`, `has_tv360`, `has_movie`, `has_social`, `has_5g`, `is_combo`, `is_data_only`, `is_social`, `is_addon`.
    - `cycle_days` (Number): Số ngày chu kỳ.
    - `price` (Number): Giá gói cước.
    - `price_level` (String, enum: `['cheap', 'medium', 'expensive']`): Phân khúc giá.
    - `data_level` (String, enum: `['none', 'low', 'medium', 'high', 'unlimited']`): Mức data.
    - `voice_level` (String, enum: `['none', 'low', 'high']`): Mức thoại.
    - `sms_level` (String, enum: `['none', 'low', 'high']`): Mức SMS.
    - `searchable_tags` ([String]): Thẻ tìm kiếm tổng hợp.
    - Tự động đồng bộ từ collection `goi_cuoc` khi server khởi động.
11. **`survey_configs` (Cấu hình câu hỏi khảo sát)**:
    - `title` (String): Tiêu đề câu hỏi.
    - `description` (String): Mô tả câu hỏi.
    - `field` (String, unique, index): Tên trường câu hỏi (VD: `category`, `dataDemand`, `budget`...).
    - `component` (String): Loại component hiển thị (`'single-choice'` hoặc `'multi-choice'`).
    - `order` (Number): Thứ tự ưu tiên câu hỏi trong Decision Tree.
    - `multiple` (Boolean): Cho phép chọn nhiều đáp án.
    - `options` ([Object]): Danh sách lựa chọn gồm `{ label, value, detail, mapping }`.
    - Tự động seed dữ liệu mặc định (7 câu hỏi) khi server khởi động lần đầu.
12. **`survey_histories` (Lịch sử khảo sát người dùng)**:
    - `userId` (Number, index): ID người dùng đã đăng nhập (tùy chọn).
    - `answers` (Mixed): Câu trả lời khảo sát của người dùng.
    - `filters` (Mixed): Bộ lọc tổng hợp từ câu trả lời.
    - `recommendedPackages` ([Mixed]): Danh sách gói cước được gợi ý.
    - `isEarlyTerminated` (Boolean): Khảo sát dừng sớm do đã đủ lọc.
    - `deleted` (Boolean): Đánh dấu đã xóa mềm.
    - `deletedAt` (Date): Thời điểm xóa.
