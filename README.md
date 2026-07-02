# Viettel Mobile Package Management - Hệ thống Quản lý Gói cước Viettel

Hệ thống quản lý và tra cứu gói cước di động Viettel, hỗ trợ tìm kiếm nâng cao, bộ lọc động từ cơ sở dữ liệu, so sánh gói cước, và quản trị viên CRUD gói cước trực tiếp. Dự án được phát triển dưới dạng Monorepo sử dụng Node.js, Express, MongoDB ở Backend và React, TypeScript, Zustand ở Frontend.

---

## 1. Kiến trúc Hệ thống

### Sơ đồ luồng dữ liệu
```
[Frontend Client (React)] 
      │ (Zustand Store)
      ▼
[Vite Dev Server Proxy (/api)]
      │
      ▼
[Express Server (Cổng 5000)]
      │
      ▼ (Mongoose Model mapping DTO)
[MongoDB Atlas (Database: goicuocviettel -> Collection: goi_cuoc)]
```

### Chi tiết thành phần:
* **Backend**:
  * **Express API Server**: Khởi chạy trên cổng `5000` (hoặc cổng cấu hình qua `PORT`).
  * **MongoDB & Mongoose**: Kết nối tới cơ sở dữ liệu MongoDB Atlas thực tế qua chuỗi kết nối an toàn `MONGODB_URI`.
* **Frontend**:
  * **React & Vite**: Ứng dụng client-side SPA.
  * **Zustand**: Quản lý State tập trung, đồng bộ các thay đổi API về giao diện người dùng.
  * **Proxy**: Cấu hình trong `vite.config.ts` giúp định tuyến các API request `/api/*` về cổng `5000` để tránh lỗi CORS.

---

## 2. Cấu trúc Database & Model

Dữ liệu gói cước được lưu trữ trong collection `goi_cuoc` thuộc database `goicuocviettel` nhằm đồng bộ với dữ liệu gói cước hiện tại của hệ thống. Để bảo vệ dữ liệu gốc, cấu trúc lưu trữ Mongoose sử dụng trực tiếp các trường tiếng Việt khớp với file dữ liệu nguồn CSV.

### Mongoose Model (`Package.js`)
* **id**: `Number` (Số thứ tự gói cước)
* **ma_goi**: `String` (Mã gói cước, ví dụ: SD90, MXH100)
* **ten**: `String` (Tên gói cước hiển thị đầy đủ)
* **dohot**: `String` (normal / Hot)
* **phan_loai_goi**: `String` (Phân loại gói: Data / Combo / Social / Thoại)
* **gia**: `Number` (Giá cước, đơn vị VND)
* **phan_khuc_gia**: `String` (Gia_re / Trung_binh / Cao_cap)
* **data_theo_ngay**: `String` (Dung lượng data ưu đãi)
* **free_noi_mang** / **free_ngoai_mang**: `String` (Thông tin cuộc gọi miễn phí)
* **sms**: `String` (Thông tin SMS miễn phí)
* **doi_tuong_ap_dung**: `String` (Điều kiện đăng ký)
* **uudaitrong**: `String` (Mô tả chi tiết ưu đãi)
* **chu_ky_ngay**: `String` (Số ngày của chu kỳ gói cước)
* **dangky** / **huygiahan** / **huygoicuoc**: `String` (Cú pháp SMS đăng ký/hủy)
* **taggoiy**: `String` (Danh sách tag gợi ý phân tách bởi dấu phẩy)

---

## 3. Danh sách REST API Backend

Toàn bộ các API được xây dựng chuẩn RESTful, hỗ trợ mapping DTO từ các trường cơ sở dữ liệu tiếng Việt sang định dạng JSON tiếng Anh mong muốn ở Frontend:

### API Gói cước (Packages)
* **GET `/api/packages`**: Lấy danh sách gói cước.
  * **Query Params**:
    * `page`: Trang hiện tại (mặc định: `1`).
    * `limit`: Số gói cước trên một trang (mặc định: `8`).
    * `search`: Từ khóa tìm kiếm (tên, mã gói, tags...).
    * `category`: Loại gói cước (`data` / `combo` / `social` / `all`).
    * `price`: Khoảng giá (`under_50` / `50_100` / `100_200` / `above_200` / `all`).
    * `duration`: Chu kỳ sử dụng (`daily` / `weekly` / `monthly` / `yearly` / `all`).
    * `network`: Công nghệ mạng (`4G` / `5G` / `4G/5G` / `all`).
    * `voice`: Có ưu đãi thoại (`yes` / `no` / `all`).
    * `sms`: Có ưu đãi SMS (`yes` / `no` / `all`).
    * `target`: Đối tượng áp dụng (chuỗi tìm kiếm).
    * `promo`: Có ưu đãi mạng xã hội (`yes` / `all`).
    * `sort`: Tiêu chí sắp xếp (`popular` / `price_asc` / `price_desc` / `rating`).
* **GET `/api/packages/search?q={keyword}`**: Tìm kiếm gói cước nhanh (trả về tối đa 10 kết quả phù hợp).
* **GET `/api/packages/filter`**: Trả về các tùy chọn bộ lọc động lấy trực tiếp từ các bản ghi hiện có trong database (loại gói, chu kỳ, công nghệ mạng).
* **GET `/api/packages/categories`**: Trả về danh sách thể loại kèm số lượng gói cước thực tế.
* **GET `/api/packages/providers`**: Danh sách nhà cung cấp (mặc định: `['Viettel']`).
* **GET `/api/packages/:id`**: Xem chi tiết gói cước theo ID (hỗ trợ ID số database hoặc mã gói cước).
* **POST `/api/packages`**: Tạo gói cước mới (Admin).
* **PUT `/api/packages/:id`**: Cập nhật thông tin gói cước (Admin).
* **DELETE `/api/packages/:id`**: Xóa gói cước khỏi hệ thống (Admin).

---

## 4. Hướng dẫn chuyển đổi từ Mock Data sang API thực tế

Hệ thống đã loại bỏ hoàn toàn mock data tĩnh ở phía Frontend và tích hợp API thật thông qua các bước:
1. **API Service (`client/src/services/api.ts`)**: Định nghĩa các API request bằng `axios` giao tiếp với Backend `/api/packages`.
2. **Zustand Store (`client/src/store/index.ts`)**: 
   * Xóa mock data `MOCK_PACKAGES` tĩnh.
   * Thêm các trạng thái async `loading`, `error`, `totalPages`, `totalItems`.
   * Thêm action `fetchPackages` gọi API Backend kèm theo query filters giúp phân trang và tìm kiếm hoàn toàn từ database.
   * Sửa các hàm CRUD `addPackage`, `updatePackage`, `deletePackage` thành hàm bất đồng bộ tương tác trực tiếp với API Backend.
3. **Trang danh sách (`client/src/pages/Packages.tsx`)**:
   * Thiết kế lại thanh công cụ lọc nâng cao để chứa đầy đủ các bộ lọc (tên gói, loại gói, thời hạn, giá, dung lượng, 5G/4G, thoại, SMS, đối tượng, khuyến mại).
   * Lấy động các tùy chọn của bộ lọc qua API `GET /api/packages/filter`.
   * Thêm UI `CardSkeleton` khi dữ liệu đang tải, Empty State khi không có kết quả phù hợp, và hiển thị thông báo lỗi nếu API gặp sự cố.
4. **Trang Admin (`client/src/pages/Admin/Packages.tsx`)**:
   * Gọi API tải danh sách toàn bộ khi mở trang.
   * Tích hợp async CRUD với hiển thị trạng thái loading spinner mượt mà trên bảng dữ liệu.

---

## 5. Hướng dẫn cài đặt và Chạy hệ thống

### Khai báo biến môi trường (`server/.env`)
Tạo hoặc cập nhật file `.env` trong thư mục `server`:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.e02x0sj.mongodb.net/goicuocviettel?retryWrites=true&w=majority
PORT=5000
```

### Cài đặt Dependencies
Từ thư mục gốc của dự án, chạy lệnh:
```bash
npm install
```

### Seed dữ liệu thực (CSV -> Database)
Dữ liệu gốc 96 gói cước được lưu trong file `d:\webviettel\goicuocviettel.csv` được bảo vệ tuyệt đối. Chạy script seed độc lập sau để đồng bộ các gói cước CSV chưa có trong Database:
```bash
# Di chuyển vào server và chạy script seed
cd server
npm run seed  # Hoặc: node src/seed.js
```
*Lưu ý*: Script seed chỉ thực hiện `INSERT` các bản ghi chưa tồn tại dựa trên `ma_goi` / `id` và hoàn toàn không thực hiện `UPDATE`, `DELETE` hay `REPLACE` dữ liệu gốc.

### Khởi chạy dự án (Local Dev)
* **Chạy API Server (Backend)**:
  ```bash
  cd server
  npm start
  ```
* **Chạy React Client (Frontend)**:
  ```bash
  cd client
  npm run dev
  ```
  Truy cập ứng dụng tại địa chỉ: `http://localhost:5173` (hoặc cổng Vite cung cấp).
