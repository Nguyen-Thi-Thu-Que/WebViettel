# Viettel Mobile Package Management System (Monorepo)

Hệ thống quản lý, tra cứu, so sánh và đăng ký các gói cước di động Viettel trên nền tảng monorepo (React + Express + MongoDB).

## 1. Giới thiệu dự án
Hệ thống cung cấp giải pháp trực tuyến hỗ trợ người dùng di động tra cứu và lựa chọn các gói cước data 4G/5G, combo thoại, mạng xã hội từ nhà mạng Viettel. Hệ thống tích hợp các công cụ hỗ trợ tư vấn như trợ lý ảo AI Chatbot và bộ khảo sát nhu cầu đề xuất gói cước cá nhân hóa, đồng thời cung cấp môi trường ví ảo giả lập giúp khách hàng thực hiện đăng ký và hủy gia hạn gói cước trực tiếp.

### Công nghệ chính sử dụng
* **Frontend**: React (phiên bản 19.2.7), TypeScript, Vite, Tailwind CSS v4 (qua `@tailwindcss/vite`), Zustand (quản lý trạng thái), React Router DOM (v7.18.1), Framer Motion (hiệu ứng chuyển động).
* **Backend**: Express.js (phiên bản 5.2.1), Node.js.
* **Database & ORM**: MongoDB, Mongoose (phiên bản 9.7.3).

---

## 2. Cấu hình dự án

### Yêu cầu môi trường
* Node.js (khuyên dùng phiên bản LTS v20 trở lên)
* MongoDB (phiên bản 5.x trở lên, cài đặt cục bộ hoặc MongoDB Atlas)
* Hệ điều hành hỗ trợ: Windows, macOS, Linux

### Framework & Package Manager
* Backend Framework: Express.js (v5.2.1)
* Frontend Framework: React (v19.2.7)
* Package Manager: npm (v8+ hoặc yarn/pnpm tương thích)

### Biến môi trường (.env)

#### Phân hệ Server (`server/.env`)
* `MONGO_URI`: Đường dẫn kết nối cơ sở dữ liệu MongoDB.
* `MONGODB_URI`: Đường dẫn kết nối cơ sở dữ liệu MongoDB (dùng dự phòng).
* `PORT`: Cổng dịch vụ chạy Backend API (mặc định là 5000).

#### Phân hệ Client (`client/.env`)
* `VITE_API_URL`: URL Endpoint trỏ về cổng chạy Backend API (mặc định là http://localhost:5000).

### Các file cấu hình quan trọng
* Root: `package.json` (quản lý monorepo workspace)
* Server: `server/package.json`, `server/.env`, `server/src/index.js`
* Client: `client/package.json`, `client/vite.config.ts`, `client/tsconfig.json`, `client/.env`

### Hướng dẫn cài đặt
Cài đặt dependencies cho từng phân hệ trong thư mục dự án:
```bash
# Cài đặt dependencies cho phân hệ Client
cd client
npm install

# Cài đặt dependencies cho phân hệ Server
cd ../server
npm install
```

### Cách chạy project

#### Chạy phân hệ Backend (Server)
```bash
cd server
npm start
```
Cổng dịch vụ Backend mặc định sẽ khởi chạy tại: `http://localhost:5000`

#### Chạy phân hệ Frontend (Client) ở chế độ Phát triển (Dev Mode)
```bash
cd client
npm run dev
```
Cổng dịch vụ Client mặc định sẽ khởi chạy tại: `http://localhost:5173`

### Cách build
Build phiên bản production cho phân hệ Frontend:
```bash
cd client
npm run build
```
Sau khi build hoàn tất, các file tĩnh sẽ được tạo ra tại thư mục `client/dist`. Bạn có thể chạy thử bản build bằng lệnh:
```bash
npm run preview
```

### Cách chạy migration/seed
Hệ thống sử dụng cơ chế tự động seed dữ liệu mẫu khi khởi động Backend Server (thông qua các hàm kiểm tra cơ sở dữ liệu trong `server/src/services/faqService.js` và `server/src/services/chatbotService.js`). Nếu bảng dữ liệu `faqs` hoặc `chatbot_configs` trống, hệ thống sẽ tự động nạp các bản ghi mẫu từ tệp tin định cấu hình sẵn. Không cần chạy câu lệnh migration thủ công.

---

## 3. Cấu trúc thư mục

### Mã nguồn Frontend (`client/`)
* `client/public/`: Chứa các tài nguyên tĩnh như hình ảnh, favicon, file cấu hình của client.
* `client/src/components/`: Chứa các components React dùng chung (như SEO, Breadcrumb, AdvancedFilter, RegisterModal, PackageCard, PackageGrid, LoadingSkeleton, EmptyState, Pagination, PackageToolbar).
* `client/src/pages/`: Chứa các trang giao diện nghiệp vụ.
* `client/src/services/`: Khởi tạo instance Axios và chứa các hàm gọi API tương tác với Backend (`api.ts`).
* `client/src/store/`: Quản lý các trạng thái toàn cục của ứng dụng thông qua thư viện Zustand (`index.ts`).
* `client/src/types/`: Định nghĩa các kiểu dữ liệu và interfaces TypeScript (`index.ts`).
* `client/src/index.css`: Cấu hình Tailwind CSS, định nghĩa màu sắc và các hiệu ứng chuyển động.

### Mã nguồn Backend (`server/`)
* `server/src/controllers/`: Xử lý logic nghiệp vụ và định dạng dữ liệu trả về cho các API endpoints.
* `server/src/models/`: Định nghĩa các Mongoose schemas cấu trúc dữ liệu MongoDB.
* `server/src/routes/`: Cấu hình các API endpoints và gán middleware xử lý định tuyến.
* `server/src/middlewares/`: Bộ lọc trung gian quản lý phiên đăng nhập, phân quyền người dùng, giới hạn rate limit và xử lý lỗi hệ thống.
* `server/src/services/`: Quản lý dữ liệu mẫu (Seeding) câu hỏi hỗ trợ và kịch bản chatbot.

---

## 4. Chức năng của từng giao diện

### Trang chủ
* **Route**: `/`
* **Mục đích**: Trang giới thiệu tổng quan hệ thống.
* **Chức năng chính**: 
  * Hiển thị danh sách các gói cước nổi bật (HOT).
  * Tìm kiếm nhanh gói cước di động.
  * Điều hướng sang trang so sánh gói cước và khảo sát nhu cầu.
* **API sử dụng**: `GET /api/packages`
* **Quyền truy cập**: Public (Mọi đối tượng).

### Tra cứu danh sách gói cước
* **Route**: `/packages`
* **Mục đích**: Hiển thị chi tiết danh mục gói cước và cung cấp bảng tìm kiếm đa tiêu chí.
* **Chức năng chính**:
  * Tìm kiếm theo từ khóa (debounced search).
  * Lọc theo Phân loại, Mức giá cước, Chu kỳ sử dụng, Công nghệ mạng (4G/5G), Ưu đãi gọi thoại, Ưu đãi SMS, Khuyến mãi App và Đối tượng áp dụng.
  * Sắp xếp danh sách gói cước theo các tiêu chí (Đăng ký nhiều, AI Khuyên dùng, Mới nhất, Giá tăng/giảm, Tên A-Z).
  * Phân trang và kích hoạt Modal đăng ký trực tiếp.
* **API sử dụng**: `GET /api/packages`, `GET /api/packages/filter`
* **Quyền truy cập**: Public (Mọi đối tượng).

### Chi tiết gói cước
* **Route**: `/packages/:id`
* **Mục đích**: Hiển thị đầy đủ thông tin của một gói cước di động cụ thể.
* **Chức năng chính**:
  * Hiển thị tên gói, giá cước, chu kỳ, dung lượng data chi tiết, gọi thoại, SMS.
  * Hiển thị cú pháp đăng ký, hủy gia hạn và hủy gói cước.
  * Hiển thị điều kiện đăng ký và chính sách áp dụng.
  * Đề xuất danh sách các gói cước tương tự.
  * Tích hợp nút Đăng ký và Thêm vào bảng so sánh.
* **API sử dụng**: `GET /api/packages/:id`
* **Quyền truy cập**: Public (Mọi đối tượng).

### So sánh gói cước
* **Route**: `/compare`
* **Mục đích**: So sánh chi tiết các thông số kỹ thuật giữa các gói cước do khách hàng chọn.
* **Chức năng chính**:
  * Hiển thị bảng so sánh trực quan theo hàng dọc (Giá, Chu kỳ, Data, Cuộc gọi, SMS, Khuyến mãi đi kèm).
  * Đưa ra nhận xét, đánh giá tư vấn tự động (Simulated AI commentary).
  * Cho phép đăng ký trực tiếp từ bảng so sánh.
* **API sử dụng**: `GET /api/packages` (lấy dữ liệu so sánh từ store), `POST /api/auth/subscribe`
* **Quyền truy cập**: Public (Chức năng đăng ký yêu cầu đăng nhập tài khoản).

### Khảo sát nhu cầu
* **Route**: `/survey`
* **Mục đích**: Tìm kiếm gói cước tối ưu thông qua khảo sát nhu cầu sử dụng thực tế.
* **Chức năng chính**:
  * Thực hiện bộ câu hỏi trắc nghiệm gồm 4 bước (Khả năng chi trả, Nhu cầu dung lượng data, Nhu cầu đàm thoại, Các ứng dụng mạng xã hội thường dùng).
  * Áp dụng thuật toán tính điểm đối chiếu với cơ sở dữ liệu gói cước và đề xuất top 3 gói cước có điểm số phù hợp nhất.
* **API sử dụng**: `GET /api/packages` (để tính điểm đối chiếu), `POST /api/auth/subscribe`
* **Quyền truy cập**: Public (Chức năng đăng ký yêu cầu đăng nhập tài khoản).

### Trang cá nhân người dùng
* **Route**: `/profile`
* **Mục đích**: Quản lý tài khoản cá nhân, lịch sử giao dịch và gói cước đang sử dụng.
* **Chức năng chính**:
  * Xem và cập nhật thông tin cá nhân (Họ tên, Email), thay đổi mật khẩu tài khoản.
  * Hiển thị số dư ví ảo hiện tại.
  * Thực hiện nạp tiền ảo vào tài khoản (Mô phỏng quét mã VietQR hoặc chuyển khoản Crypto).
  * Liệt kê lịch sử giao dịch (bao gồm giao dịch nạp tiền và giao dịch đăng ký dịch vụ).
  * Quản lý gói cước đang sử dụng, hỗ trợ nút bấm hủy gia hạn trực tuyến.
* **API sử dụng**: `GET /api/auth/me`, `PUT /api/auth/profile`, `PUT /api/auth/change-password`, `POST /api/auth/deposit`, `DELETE /api/auth/unsubscribe/:packageId`, `GET /api/transactions`
* **Quyền truy cập**: Thành viên đã đăng nhập (`user` hoặc `admin`).

### Đăng nhập
* **Route**: `/login`
* **Mục đích**: Đăng nhập vào hệ thống để sử dụng các tính năng liên quan đến ví và đăng ký gói cước.
* **Chức năng chính**:
  * Nhập số điện thoại và mật khẩu cá nhân để lấy Access Token.
* **API sử dụng**: `POST /api/auth/login`
* **Quyền truy cập**: Public (Mọi đối tượng).

### Đăng ký tài khoản
* **Route**: `/register`
* **Mục đích**: Tạo tài khoản thành viên mới.
* **Chức năng chính**:
  * Đăng ký số điện thoại, họ tên, email, mật khẩu.
  * Tự động cộng 50.000đ khuyến mãi khởi tạo vào ví số dư ảo của tài khoản mới.
* **API sử dụng**: `POST /api/auth/register`
* **Quyền truy cập**: Public (Mọi đối tượng).

### Khôi phục mật khẩu (Mục giả lập)
* **Route**: `/forgot-password`
* **Mục đích**: Đặt lại mật khẩu tài khoản (Giao diện mock ảo).
* **Chức năng chính**:
  * Điền số điện thoại nhận mã OTP ảo (Mã mặc định: 123456) và thiết lập mật khẩu mới.
* **API sử dụng**: Chưa xác định từ source hiện tại (Màn hình xử lý hoàn toàn bằng trạng thái giả lập tại Client).
* **Quyền truy cập**: Public (Mọi đối tượng).

### Trang tổng quan quản trị (Admin Dashboard)
* **Route**: `/admin`
* **Mục đích**: Xem các số liệu thống kê hoạt động của hệ thống.
* **Chức năng chính**:
  * Hiển thị tổng số tài khoản, tổng số gói cước, tổng số giao dịch, tổng doanh thu của ví ảo.
  * Hiển thị danh sách 10 giao dịch đăng ký hoặc nạp tiền gần nhất trên hệ thống.
* **API sử dụng**: `GET /api/transactions/admin/stats`
* **Quyền truy cập**: Quản trị viên (`admin`).

### Quản trị danh sách gói cước (Admin Packages)
* **Route**: `/admin/packages`
* **Mục đích**: Quản lý cơ sở dữ liệu các gói cước di động Viettel.
* **Chức năng chính**:
  * Xem danh sách tất cả các gói cước đang lưu trữ trong cơ sở dữ liệu.
  * Thêm mới gói cước, chỉnh sửa thông tin chi tiết các trường dữ liệu và xóa gói cước khỏi hệ thống.
* **API sử dụng**: `GET /api/packages`, `POST /api/packages`, `PUT /api/packages/:id`, `DELETE /api/packages/:id`
* **Quyền truy cập**: Quản trị viên (`admin`).

### Quản trị danh sách tài khoản (Admin Users)
* **Route**: `/admin/users`
* **Mục đích**: Quản lý thông tin thành viên đăng ký trên hệ thống.
* **Chức năng chính**:
  * Xem danh sách các tài khoản người dùng, vai trò, số điện thoại, ngày tạo và gói cước họ đang đăng ký sử dụng.
  * Hỗ trợ chức năng cộng/trừ số dư ví ảo trực tiếp cho từng người dùng cụ thể.
* **API sử dụng**: `GET /api/users`, `PUT /api/users/:id/balance`
* **Quyền truy cập**: Quản trị viên (`admin`).

### Quản trị câu hỏi FAQ (Admin FAQs)
* **Route**: `/admin/faqs`
* **Mục đích**: Quản lý ngân hàng câu hỏi hỗ trợ khách hàng.
* **Chức năng chính**:
  * Xem danh sách các câu hỏi, phân loại danh mục, nội dung câu hỏi và câu trả lời.
  * Thêm mới, chỉnh sửa thông tin hoặc xóa câu hỏi FAQ.
* **API sử dụng**: `GET /api/faqs`, `POST /api/faqs`, `PUT /api/faqs/:id`, `DELETE /api/faqs/:id`
* **Quyền truy cập**: Quản trị viên (`admin`).

### Quản trị cấu hình Chatbot (Admin Chatbot Config)
* **Route**: `/admin/chatbot`
* **Mục đích**: Định nghĩa hệ thống prompt và từ khóa phản hồi của trợ lý ảo.
* **Chức năng chính**:
  * Xem và thay đổi System Prompt để hướng dẫn chatbot ứng xử và trả lời.
  * Quản lý danh sách các từ khóa đặc biệt (Training Keywords): khi chatbot phát hiện từ khóa trong tin nhắn của khách hàng, nó sẽ đưa ra câu trả lời lập trình sẵn và đề xuất liên kết đến gói cước được gán trước.
* **API sử dụng**: `GET /api/chatbot/config`, `PUT /api/chatbot/config`
* **Quyền truy cập**: Quản trị viên (`admin`).

---

## 5. Database hiện tại

Tên cơ sở dữ liệu sử dụng: `goicuocviettel`

### Bảng accounts
Lưu trữ thông tin chi tiết của người dùng và quản trị viên.
* **Các trường chính**:
  * `user_id`: Kiểu số (Number), bắt buộc, duy nhất (Primary Key ảo).
  * `fullname`: Kiểu chuỗi (String), bắt buộc. Họ và tên người dùng.
  * `phone_number`: Kiểu chuỗi (String), bắt buộc, duy nhất, đánh chỉ mục (Index). Dùng làm tài khoản đăng nhập.
  * `password`: Kiểu chuỗi (String), bắt buộc. Mật khẩu đã băm.
  * `balance`: Kiểu số (Number), mặc định là 0. Số dư ví ảo dùng để đăng ký gói cước.
  * `role`: Kiểu chuỗi (String), giá trị gồm 'user' hoặc 'admin', mặc định là 'user'. Vai trò phân quyền.
  * `created_at`: Kiểu chuỗi (String), ISO Date String. Thời gian đăng ký tài khoản.
* **Quan hệ**:
  * Một tài khoản trong bảng `accounts` có thể sở hữu nhiều bản ghi trong bảng `subscriptions` (thông qua liên kết cột `user_id`).
  * Một tài khoản có thể sở hữu nhiều bản ghi trong bảng `deposits` (thông qua liên kết cột `user_id`).

### Bảng goi_cuoc
Lưu trữ toàn bộ danh sách gói cước di động và thông số kỹ thuật của Viettel.
* **Các trường chính**:
  * `package_id`: Kiểu số (Number), bắt buộc, duy nhất. Mã số nhận diện gói cước.
  * `ma_goi`: Kiểu chuỗi (String), bắt buộc, đánh chỉ mục (Index). Ví dụ: 'SD90', 'V200C'.
  * `ten`: Kiểu chuỗi (String), bắt buộc. Tên đầy đủ gói cước.
  * `dohot`: Kiểu chuỗi (String), mặc định là 'normal'. Phân loại độ nổi bật (ví dụ: 'Hot' hoặc 'normal').
  * `phan_loai_goi`: Kiểu chuỗi (String), mặc định là 'Data'. Phân loại thể loại gói (Data, Combo, Social, Thoại).
  * `gia`: Kiểu số (Number), bắt buộc. Giá cước thanh toán (VND).
  * `phan_khuc_gia`: Kiểu chuỗi (String), mặc định là 'Trung_binh'. Phân khúc giá cước.
  * `data_theo_ngay`: Kiểu chuỗi (String), mặc định rỗng. Dung lượng data giới hạn theo ngày/chu kỳ.
  * `free_ngoai_mang`: Kiểu chuỗi (String), mặc định '0'. Số phút gọi ngoại mạng miễn phí.
  * `free_noi_mang`: Kiểu chuỗi (String), mặc định '0'. Số phút gọi nội mạng miễn phí.
  * `tienich`: Kiểu chuỗi (String), mặc định '0'. Ưu đãi tiện ích đi kèm.
  * `sms`: Kiểu chuỗi (String), mặc định '0'. Số lượng SMS miễn phí đi kèm.
  * `doi_tuong_ap_dung`: Kiểu chuỗi (String), mặc định rỗng. Đối tượng thuê bao được đăng ký.
  * `dieu_kien_dang_ky`: Kiểu chuỗi (String), mặc định rỗng. Điều kiện kỹ thuật để đăng ký thành công.
  * `chinh_sach_ap_dung`: Kiểu chuỗi (String), mặc định rỗng. Các chính sách điều khoản đi kèm.
  * `noi_dung_ngoai`: Kiểu chuỗi (String), mặc định '0'. Quyền lợi sử dụng ứng dụng mạng xã hội ngoài.
  * `tien_ich_free`: Kiểu chuỗi (String), mặc định '0'. Các tiện ích phụ được miễn phí.
  * `uudaitrong`: Kiểu chuỗi (String), mô tả chi tiết các ưu đãi của gói cước.
  * `chu_ky_ngay`: Kiểu chuỗi (String), mặc định là '30'. Số ngày sử dụng của chu kỳ gói cước.
  * `dangky`: Kiểu chuỗi (String). Cú pháp tin nhắn đăng ký gói cước.
  * `huygiahan`: Kiểu chuỗi (String). Cú pháp hủy tính năng tự động gia hạn.
  * `huygoicuoc`: Kiểu chuỗi (String). Cú pháp tin nhắn hủy hoàn toàn gói cước.
  * `diem_noi_bat`: Kiểu chuỗi (String). Điểm nhấn tiếp thị của gói cước.
  * `do_uu_tien`: Kiểu chuỗi (String), mặc định '1'. Trọng số ưu tiên hiển thị gói.
  * `goi_thay_the`: Kiểu chuỗi (String). Mã gói đề xuất thay thế khi không đăng ký được.
  * `loai`: Kiểu chuỗi (String). Công nghệ mạng hỗ trợ (4G/5G).
  * `taggoiy`: Kiểu chuỗi (String). Các nhãn/tags tìm kiếm đi kèm.
* **Quan hệ**:
  * Một gói cước có thể liên kết với nhiều bản ghi trong bảng `subscriptions` (thông qua liên kết cột `package_id` đối chiếu với `package_id` của Subscription).

### Bảng subscriptions
Lưu trữ thông tin chi tiết các gói cước đang được kích hoạt sử dụng bởi người dùng.
* **Các trường chính**:
  * `subscription_id`: Kiểu số (Number), bắt buộc, duy nhất.
  * `user_id`: Kiểu số (Number), bắt buộc, đánh chỉ mục (Index). Tham chiếu đến tài khoản người dùng.
  * `package_id`: Kiểu số (Number), bắt buộc, đánh chỉ mục (Index). Tham chiếu đến gói cước đăng ký.
  * `registered_at`: Kiểu chuỗi (String), ISO Date String. Ngày đăng ký gói cước.
  * `expired_at`: Kiểu chuỗi (String), ISO Date String. Ngày hết hạn chu kỳ gói cước.
  * `is_auto_renew`: Kiểu Boolean, mặc định true. Trạng thái tự động gia hạn khi hết hạn.
  * `status`: Kiểu chuỗi (String), giá trị gồm 'active' hoặc 'expired', mặc định là 'active'. Trạng thái hiệu lực hiện tại.
* **Quan hệ**:
  * Bảng trung gian móc nối giữa `accounts` (thông qua trường `user_id` liên kết với `accounts.user_id`) và `goi_cuoc` (thông qua trường `package_id` liên kết với `goi_cuoc.package_id`).

### Bảng deposits
Ghi nhận toàn bộ các giao dịch nạp tiền ảo hoặc trừ phí đăng ký gói cước di động trên hệ thống.
* **Các trường chính**:
  * `deposit_id`: Kiểu số (Number), bắt buộc, duy nhất.
  * `user_id`: Kiểu số (Number), bắt buộc, đánh chỉ mục (Index). Tham chiếu đến tài khoản người dùng phát sinh giao dịch.
  * `amount`: Kiểu số thập phân (Decimal128), bắt buộc. Số tiền giao dịch phát sinh.
  * `fiat_equivalent`: Kiểu số thập phân (Decimal128), bắt buộc. Giá trị quy đổi fiat tương đương (phục vụ mô phỏng ví).
  * `tx_hash`: Kiểu chuỗi (String). Mã băm giao dịch (đối với nạp tiền mô phỏng qua tiền mã hóa).
  * `network`: Kiểu chuỗi (String). Mạng thanh toán sử dụng.
  * `status`: Kiểu chuỗi (String), mặc định là 'success'. Trạng thái xử lý giao dịch.
  * `created_at`: Kiểu chuỗi (String), mặc định là thời gian hiện tại dưới dạng ISO String.
* **Quan hệ**:
  * Bản ghi phụ thuộc vào một tài khoản cụ thể trong bảng `accounts` thông qua trường liên kết `user_id`.

### Bảng faqs
Lưu trữ các câu hỏi và câu trả lời hỗ trợ khách hàng trực tuyến.
* **Các trường chính**:
  * `id`: Kiểu chuỗi (String), bắt buộc, duy nhất.
  * `question`: Kiểu chuỗi (String), bắt buộc. Nội dung câu hỏi hỗ trợ.
  * `answer`: Kiểu chuỗi (String), bắt buộc. Nội dung câu trả lời tương ứng.
  * `category`: Kiểu chuỗi (String), bắt buộc. Thể loại câu hỏi FAQ.
* **Quan hệ**:
  * Bảng độc lập, không thiết lập mối quan hệ khóa ngoại với các bảng khác.

### Bảng chatbot_configs
Lưu trữ cấu hình Prompt chỉ dẫn và các kịch bản phản hồi từ khóa của hệ thống Chatbot di động.
* **Các trường chính**:
  * `systemPrompt`: Kiểu chuỗi (String), bắt buộc. Nội dung Prompt hệ thống dẫn dắt thái độ và cách trả lời của AI.
  * `trainingKeywords`: Kiểu mảng (Array). Chứa danh sách các đối tượng từ khóa phản hồi nhanh gồm:
    * `keyword`: Kiểu chuỗi (String), bắt buộc. Từ khóa nhận diện trong tin nhắn.
    * `response`: Kiểu chuỗi (String), bắt buộc. Nội dung trả lời tương ứng lập trình sẵn.
    * `suggestedPackageId`: Kiểu chuỗi (String). Mã gói cước Viettel đề xuất gán kèm khi phát hiện từ khóa này.
* **Quan hệ**:
  * Bảng độc lập, không thiết lập mối quan hệ khóa ngoại với các bảng khác.

---

## 6. Danh sách API hệ thống

| Method | Endpoint | Mục đích | Authentication |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/login` | Xác thực đăng nhập tài khoản khách hàng/quản trị. Trả về mã JWT Token. | Không |
| **POST** | `/api/auth/register` | Đăng ký tài khoản khách hàng mới. Tự động tặng 50.000đ vào ví ảo. | Không |
| **GET** | `/api/auth/me` | Lấy thông tin tài khoản hiện tại của phiên đăng nhập. | Có (JWT) |
| **PUT** | `/api/auth/profile` | Thay đổi thông tin cá nhân (Họ tên, Email). | Có (JWT) |
| **PUT** | `/api/auth/change-password` | Thay đổi mật khẩu tài khoản hiện tại. | Có (JWT) |
| **POST** | `/api/auth/deposit` | Nạp tiền vào tài khoản ví ảo (mô phỏng giao dịch thành công). | Có (JWT) |
| **POST** | `/api/auth/subscribe` | Đăng ký gói cước di động Viettel (trừ tiền ảo vào ví, tạo subscription). | Có (JWT) |
| **DELETE** | `/api/auth/unsubscribe/:packageId` | Hủy gói cước đang hoạt động hoặc cập nhật tắt tính năng tự động gia hạn. | Có (JWT) |
| **GET** | `/api/packages` | Lấy danh sách gói cước. Hỗ trợ đầy đủ tìm kiếm từ khóa, các tiêu chí lọc nâng cao, các tùy chọn sắp xếp và phân trang dữ liệu. | Không |
| **GET** | `/api/packages/search` | Tìm kiếm nhanh gói cước di động theo từ khóa ngắn. | Không |
| **GET** | `/api/packages/filter` | Lấy danh sách các tùy chọn lọc có sẵn được tổng hợp từ cơ sở dữ liệu. | Không |
| **GET** | `/api/packages/categories` | Lấy danh sách các thể loại/danh mục gói cước hiện tại. | Không |
| **GET** | `/api/packages/providers` | Lấy nhà mạng (Chưa xác định từ source hiện tại). | Không |
| **GET** | `/api/packages/:id` | Lấy thông tin đầy đủ, chi tiết của một gói cước di động cụ thể qua ID. | Không |
| **POST** | `/api/packages` | Thêm mới gói cước di động vào cơ sở dữ liệu hệ thống. | Có (JWT + Admin) |
| **PUT** | `/api/packages/:id` | Cập nhật thông tin chi tiết một gói cước di động qua ID. | Có (JWT + Admin) |
| **DELETE** | `/api/packages/:id` | Xóa gói cước di động khỏi cơ sở dữ liệu hệ thống qua ID. | Có (JWT + Admin) |
| **GET** | `/api/faqs` | Lấy danh sách toàn bộ các câu hỏi thường gặp FAQ. | Không |
| **POST** | `/api/faqs` | Thêm mới câu hỏi thường gặp FAQ vào hệ thống. | Có (JWT + Admin) |
| **PUT** | `/api/faqs/:id` | Sửa đổi nội dung câu hỏi thường gặp FAQ qua ID. | Có (JWT + Admin) |
| **DELETE** | `/api/faqs/:id` | Xóa bỏ câu hỏi thường gặp FAQ qua ID. | Có (JWT + Admin) |
| **GET** | `/api/users` | Lấy danh sách tất cả các tài khoản thành viên trong hệ thống. | Có (JWT + Admin) |
| **PUT** | `/api/users/:id/balance` | Điều chỉnh, thay đổi số dư ví tiền ảo của một tài khoản người dùng qua ID. | Có (JWT + Admin) |
| **GET** | `/api/transactions` | Lấy danh sách các giao dịch (nạp tiền, đăng ký gói) của tài khoản đang đăng nhập. | Có (JWT) |
| **GET** | `/api/transactions/admin/stats`| Thống kê tổng hợp số liệu giao dịch, tài khoản, doanh thu cho trang quản trị. | Có (JWT + Admin) |
| **POST** | `/api/chatbot/message` | Gửi tin nhắn chat từ người dùng, nhận câu trả lời phân tích từ chatbot. | Không |
| **GET** | `/api/chatbot/config` | Lấy cấu hình System Prompt và các từ khóa phản hồi của Chatbot. | Có (JWT + Admin) |
| **PUT** | `/api/chatbot/config` | Cập nhật Prompt và tập từ khóa huấn luyện phản hồi nhanh của Chatbot. | Có (JWT + Admin) |

---

## 7. Phân quyền truy cập

Hệ thống triển khai phân quyền dựa trên thuộc tính vai trò (`role`) đính kèm trong mã JWT token của tài khoản:

### Vai trò user (Khách hàng)
* **Quyền hạn**: Được phép tra cứu, tìm kiếm, so sánh và thực hiện các câu hỏi khảo sát lựa chọn gói cước di động. Có quyền trò chuyện với trợ lý ảo chatbot. Được phép truy cập các chức năng quản lý tài khoản cá nhân, nạp tiền giả lập vào ví, đăng ký gói cước và thực hiện hủy gia hạn.
* **Màn hình được phép truy cập**:
  * Trang chủ (`/`)
  * Trang Danh mục gói cước (`/packages`)
  * Trang Chi tiết gói cước (`/packages/:id`)
  * Trang So sánh gói cước (`/compare`)
  * Trang Khảo sát đề xuất gói (`/survey`)
  * Trang Đăng nhập (`/login`)
  * Trang Đăng ký (`/register`)
  * Trang Khôi phục mật khẩu (`/forgot-password`)
  * Trang Cá nhân (`/profile`)

### Vai trò admin (Quản trị viên)
* **Quyền hạn**: Sở hữu toàn bộ quyền hạn truy cập của vai trò `user`. Có quyền truy cập chuyên biệt vào phân hệ trang quản trị (Admin Panel), sửa đổi số dư ví ảo của các khách hàng, cập nhật danh sách gói cước (thêm/sửa/xóa), quản lý câu hỏi FAQ, điều khiển hệ thống prompt chỉ đạo chatbot và các từ khóa kích hoạt phản hồi chatbot.
* **Màn hình được phép truy cập**:
  * Tất cả các màn hình dành cho vai trò `user`.
  * Trang quản trị tổng quan (`/admin`)
  * Trang quản lý gói cước (`/admin/packages`)
  * Trang quản lý tài khoản thành viên (`/admin/users`)
  * Trang quản lý câu hỏi FAQ (`/admin/faqs`)
  * Trang quản lý cấu hình chatbot (`/admin/chatbot`)

---

## 8. Luồng xử lý chính của hệ thống

### Đăng ký tài khoản mới
1. Người dùng điền thông tin họ tên, số điện thoại, mật khẩu trên giao diện Client và ấn Đăng ký.
2. Client gửi yêu cầu HTTP POST chứa dữ liệu đăng ký đến endpoint `/api/auth/register` của Server.
3. Server kiểm tra tính hợp lệ của số điện thoại (đảm bảo không bị trùng lặp trong database).
4. Server thực hiện băm mật khẩu bảo mật (sử dụng thuật toán băm nội bộ).
5. Server tạo bản ghi tài khoản mới trong bảng `accounts`, thiết lập số dư khởi tạo mặc định là 50.000đ, gán vai trò `user`, lưu thông tin xuống database và trả về thông báo thành công cho Client.

### Đăng nhập hệ thống
1. Người dùng điền số điện thoại và mật khẩu tại giao diện Đăng nhập.
2. Client gửi yêu cầu HTTP POST chứa thông tin đăng nhập đến endpoint `/api/auth/login`.
3. Server truy vấn thông tin tài khoản từ bảng `accounts` theo số điện thoại cung cấp.
4. Server đối chiếu mật khẩu băm đã lưu trữ trong database với mật khẩu người dùng vừa nhập.
5. Nếu khớp, Server sinh mã JSON Web Token (JWT) chứa thông tin vai trò, ID tài khoản, thời gian hết hạn và trả về Client. Client lưu token này vào LocalStorage để làm bằng chứng xác thực cho các yêu cầu API tiếp theo.

### Nạp tiền giả lập vào ví tài khoản
1. Người dùng đã đăng nhập, truy cập trang Cá nhân, chọn số tiền cần nạp và hình thức nạp (VietQR hoặc Crypto).
2. Client gửi yêu cầu HTTP POST kèm token xác thực và số tiền nạp đến endpoint `/api/auth/deposit`.
3. Middleware kiểm tra và giải mã JWT token để xác minh danh tính người dùng.
4. Server tạo mới một bản ghi giao dịch thành công trong bảng `deposits` chứa thông tin người dùng, số tiền nạp, mã băm giao dịch giả lập.
5. Server thực hiện cập nhật bản ghi tài khoản tương ứng trong bảng `accounts`, tăng giá trị số dư ví ảo cột `balance` tương đương với số tiền nạp, sau đó lưu thay đổi xuống database và phản hồi thành công về Client.

### Đăng ký gói cước di động
1. Người dùng nhấn nút Đăng ký trên Card gói cước di động.
2. Client hiển thị Modal xác nhận đăng ký thông tin gói cước.
3. Khi người dùng ấn Xác nhận, Client gửi yêu cầu HTTP POST chứa ID gói cước và token xác thực đến endpoint `/api/auth/subscribe`.
4. Middleware kiểm tra và giải mã JWT token để lấy thông tin tài khoản người dùng.
5. Server truy vấn thông tin gói cước từ bảng `goi_cuoc` để lấy thông tin đơn giá, và truy vấn tài khoản từ bảng `accounts` để kiểm tra số dư ví ảo.
6. Nếu số dư tài khoản nhỏ hơn đơn giá gói cước, Server từ chối và trả về lỗi không đủ số dư.
7. Nếu số dư hợp lệ, Server thực hiện trừ tiền trong số dư `balance` của tài khoản tại bảng `accounts`.
8. Server ghi nhận một bản ghi giao dịch trừ tiền phí đăng ký mới trong bảng `deposits`.
9. Server tạo mới bản ghi gói cước sử dụng trong bảng `subscriptions`, thiết lập ngày kích hoạt, ngày hết hạn dựa theo chu kỳ ngày của gói cước, trạng thái kích hoạt hoạt động và lưu dữ liệu xuống database.
10. Server phản hồi trạng thái đăng ký thành công về Client để cập nhật giao diện.

### Hủy gia hạn gói cước
1. Người dùng truy cập danh sách gói cước đang hoạt động tại trang Cá nhân và nhấn Hủy gia hạn.
2. Client gửi yêu cầu HTTP DELETE chứa ID gói cước cần hủy và token xác thực đến endpoint `/api/auth/unsubscribe/:packageId`.
3. Middleware kiểm tra và xác minh quyền truy cập thông qua giải mã JWT token.
4. Server truy vấn bản ghi tương ứng trong bảng `subscriptions` khớp với `user_id` và `package_id` đang hoạt động.
5. Server thực hiện cập nhật thuộc tính `is_auto_renew` thành `false` nhằm tắt tính năng tự động trừ phí khi hết chu kỳ sử dụng, lưu thay đổi xuống database và trả về phản hồi thành công cho Client.

---

## 9. Các tính năng chính của hệ thống

* **Tra cứu và tìm kiếm gói cước di động**: Bộ lọc đa tiêu chí (Thể loại, Mức giá, Chu kỳ, Loại mạng 4G/5G, Tiêu chí cuộc gọi, SMS, Khuyến mãi App, Đối tượng áp dụng, Sắp xếp tiêu chí) giúp người dùng nhanh chóng tìm được gói cước phù hợp nhất.
* **So sánh thông số kỹ thuật gói cước**: Bảng so sánh song song nhiều gói cước giúp nhận biết sự khác biệt về lưu lượng data, số phút gọi miễn phí, giá cước chu kỳ và kèm theo nhận xét tư vấn tự động.
* **Bộ khảo sát nhu cầu người dùng**: Trắc nghiệm nhu cầu thực tế giúp tính toán điểm số và đề xuất top 3 gói cước tối ưu nhất dựa trên thuật toán so khớp đặc tính gói.
* **Trợ lý ảo AI Chatbot tư vấn trực tuyến**: Trò chuyện tự động giải đáp thắc mắc của khách hàng, tích hợp nhận diện từ khóa huấn luyện để đề xuất trực tiếp gói cước Viettel tương ứng.
* **Hệ thống ví ảo mô phỏng giao dịch**: Giả lập các cổng thanh toán VietQR và Crypto nạp tiền vào tài khoản để người dùng trải nghiệm thực tế luồng đăng ký gói cước và hủy gia hạn gói cước trực tuyến.
* **Trang quản trị vận hành hệ thống**: Cung cấp giao diện toàn diện cho quản trị viên theo dõi doanh thu ảo, quản trị dữ liệu gói cước di động (CRUD), quản trị thông tin số dư ví thành viên, quản lý danh sách FAQs hỗ trợ và cấu hình kịch bản từ khóa chatbot.

---

## 10. Ghi chú kỹ thuật

* **Cron Job**: Chưa xác định từ source hiện tại.
* **Queue**: Chưa xác định từ source hiện tại.
* **Scheduler**: Chưa xác định từ source hiện tại.
* **Cache**: Chưa xác định từ source hiện tại.
* **Redis**: Chưa xác định từ source hiện tại.
* **WebSocket**: Chưa xác định từ source hiện tại.
* **Upload File**: Chưa xác định từ source hiện tại.
* **Email**: Địa chỉ email được ghi nhận trong form đăng ký tài khoản nhưng không liên kết với dịch vụ gửi email thực tế nào ở Backend (Chưa xác định từ source hiện tại).
* **Logging**: Sử dụng middleware ghi nhận nhật ký hoạt động cơ bản của Express, hiển thị thời gian, phương thức HTTP và URL yêu cầu ra console máy chủ phục vụ giám sát và debug (`[Timestamp] METHOD URL`).
* **Authentication (Xác thực)**: Cơ chế xác thực sử dụng JSON Web Token (JWT). Token được sinh ra khi đăng nhập thành công và đính kèm trong header `Authorization: Bearer <token>` đối với các yêu cầu API cần bảo mật.
* **Authorization (Phân quyền)**: Gán middleware `requireRole(['admin'])` tại các endpoints quản trị để giải mã token kiểm tra trường `role` của tài khoản, chỉ cho phép tiếp tục xử lý khi vai trò tài khoản là `admin`.
