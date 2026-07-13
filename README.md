# Website cung cấp gói cước di động Viettel tích hợp chatbot

## 1. Giới thiệu dự án
Đồ án xây dựng một nền tảng trực tuyến nhằm hỗ trợ người dùng dễ dàng tìm kiếm, so sánh và đăng ký các gói cước di động Viettel. Hệ thống tích hợp một trợ lý ảo Chatbot thông minh giúp tư vấn gói cước phù hợp dựa trên nhu cầu của khách hàng theo thời gian thực. 

Nền tảng hướng tới mục tiêu tối ưu hóa trải nghiệm khách hàng thông qua giao diện trực quan, các bộ lọc tìm kiếm thông minh, khảo sát nhu cầu cá nhân hóa và giải pháp thanh toán ví giả lập truyền thống hoặc tích hợp ví MetaMask trên mạng thử nghiệm blockchain Sepolia.

---

## 2. Ngăn xếp công nghệ (Tech Stack)
Dự án được xây dựng dựa trên ngăn xếp công nghệ hiện đại, cụ thể:

### Frontend
- **Framework chính**: React (v19.2.7) + TypeScript
- **Công cụ build**: Vite (v8.1.0)
- **Quản lý trạng thái (State Management)**: Zustand (v5.0.14)
- **Định tuyến (Routing)**: React Router Dom (v7.18.1)
- **Xử lý Form & Xác thực**: React Hook Form (v7.80.0) + Zod (v4.4.3) + @hookform/resolvers
- **Giao diện & Styling**: TailwindCSS (v4.3.2) + Framer Motion (v12.42.0) (hiệu ứng chuyển động) + Lucide React (v1.22.0) (icons)
- **Tương tác Web3**: Ethers.js (v6.17.0) kết nối ví MetaMask
- **HTTP Client**: Axios (v1.18.1)

### Backend
- **Môi trường chạy**: Node.js
- **Framework**: Express (v5.2.1)
- **Xác thực mã hóa**: JSON Web Token (JWT) + BcryptJS (v3.0.3)
- **Phân tích dữ liệu**: csv-parser (v3.2.1)
- **Kết nối cơ sở dữ liệu**: Mongoose (v9.7.3)
- **Cổng kết nối HTTP**: Cors + Dotenv

### AI & Database
- **Cơ sở dữ liệu (Database)**: MongoDB
- **Nhà cung cấp dịch vụ AI**: Groq Cloud API
- **Mô hình ngôn ngữ lớn (LLM)**: Llama-3.1-8b-instant (cấu hình qua `.env`)
- **Giải pháp AI dự phòng (Fallback)**: Ollama API (Mô hình Qwen2.5:3b)

---

## 3. Danh sách Chức năng Giao diện (UI Features) hiện có
Người dùng có thể trực tiếp tương tác với các màn hình và tính năng giao diện sau:

- **Trang chủ (Home)**: Banner giới thiệu, hiển thị danh mục nhu cầu (Siêu data, Combo, Mạng xã hội), danh sách thẻ gói cước nổi bật khuyên dùng (lọc theo `dohot !== 'normal'`), và CTA dẫn đến Chatbot và Khảo sát.
- **Trang Danh mục gói cước (Packages)**: Cho phép tìm kiếm, lọc và phân trang gói cước theo danh mục, chu kỳ sử dụng, phân khúc giá, công nghệ mạng (4G/5G) và tiện ích đi kèm.
- **Trang Chi tiết gói cước (Package Detail)**: Hiển thị thông số ưu đãi chi tiết của từng gói cước, điều kiện đăng ký, cú pháp soạn tin nhắn SMS gửi 191 (có nút sao chép nhanh), đề xuất gói cước liên quan và modal đăng ký gói cước trực tiếp.
- **Trang So sánh gói cước (Compare)**: Hỗ trợ đối chiếu các thông số của tối đa 3 gói cước trên một bảng chi tiết, kết hợp hiển thị nhận xét so sánh và khuyên dùng tự động từ thuật toán AI.
- **Trang Khảo sát chọn gói cước (Survey Wizard)**: Giao diện khảo sát 4 bước (Ngân sách -> Data -> Thoại -> Giải trí) để tính toán điểm phù hợp và gợi ý ra 3 gói cước tối ưu nhất từ cơ sở dữ liệu.
- **Hồ sơ cá nhân & Nạp tiền Web3 (Profile)**: 
  - Thay đổi thông tin cá nhân (Họ tên, email) và thay đổi mật khẩu.
  - Kết nối ví MetaMask, chuyển mạng blockchain tự động sang mạng thử nghiệm Sepolia.
  - Thực hiện giao dịch chuyển ETH thực tế trên Sepolia để nạp tiền ví ảo VND và theo dõi lịch sử giao dịch nạp tiền, liên kết link kiểm tra giao dịch trên blockchain qua Etherscan.
  - Quản lý các gói cước đang sử dụng (Bật/tắt tự động gia hạn, hủy gói cước ngay lập tức).
  - Quản lý lịch sử đăng ký gói cước (Xem danh sách, xóa lịch sử).
- **Hệ thống Đăng nhập / Đăng ký / Quên mật khẩu**: Xác thực tài khoản người dùng, chọn loại thuê bao trả trước/trả sau khi đăng ký, và khôi phục mật khẩu giả lập qua OTP tại client.
- **Trang Quản trị (Admin Dashboard)**:
  - Báo cáo thống kê tổng doanh thu, số người dùng, gói cước và lượt đăng ký kèm biểu đồ SVG.
  - Quản lý danh mục gói cước: CRUD (Xem, thêm mới, sửa, xóa) các gói cước trong DB.
  - Quản lý câu hỏi thường gặp: CRUD danh mục câu hỏi FAQ.
  - Quản lý người dùng: Xem danh sách, thay đổi loại thuê bao, chuyển đổi trạng thái khách hàng thân thiết, và khóa/mở khóa tài khoản di động.
  - Cấu hình Chatbot: Thay đổi System Prompt chỉ dẫn cho LLM và quản lý bộ quy tắc từ khóa NLP (Rule-based) để so khớp phản hồi chatbot tự động.

---

## 4. Kiến trúc hệ thống Chatbot (Core RAG Flow)
Hệ thống Chatbot tư vấn gói cước vận hành theo luồng xử lý RAG (Retrieval-Augmented Generation) kết hợp Rule-based:

1. **User Message**: Nhận câu hỏi từ tin nhắn của người dùng qua giao diện Chatbot.
2. **Intent Parser**: Phân tích cú pháp tin nhắn để trích xuất các ý định của người dùng như mã gói cước (`packageCodes[]`), ngân sách (`budget`), các nhu cầu (`needData`, `needVoice`, `needCombo`, `needYoutube`, `needTiktok`), và số ngày chu kỳ tối thiểu (`minDays`).
3. **Package Matcher**:
   - **Hard Filters (Bộ lọc cứng)**: Áp dụng các quy tắc loại bỏ triệt để gói không phù hợp (ví dụ: chặn gói ngoài khoảng `minDays` và `minDays + 30`; loại bỏ gói không có thoại khi cần thoại/combo; loại bỏ gói Combo khi chỉ cần Data; chặn gói 1/3/5/7 ngày khi muốn data rẻ).
   - **Scoring (Tính điểm)**: Chấm điểm các gói cước còn lại dựa trên cấu hình lấy từ file `scoring_config.json` để chọn ra tối đa 3 gói cước tốt nhất.
4. **Prompt Builder**:
   - Chuyển đổi dữ liệu đối tượng gói cước đã khớp thành văn bản thuần dễ đọc qua hàm `formatPackageToText(pkg)`, loại bỏ các trường mang giá trị `'0'` hoặc `'0GB'` để ngăn chặn ảo giác.
   - Nhúng dữ liệu này và dữ liệu intent của người dùng vào một prompt có cấu trúc thẻ XML (`<system_role>`, `<strict_rules>`, `<intent_context>`, `<package_data_context>`) để kiểm soát chặt chẽ câu trả lời của AI.
5. **LLM Provider (Groq API)**: Gửi prompt đã dựng đến Groq API chạy model `llama-3.1-8b-instant` để sinh câu trả lời.
   - Giải mã dữ liệu luồng byte phản hồi thông qua `TextDecoder('utf-8', { stream: true })` để tránh tình trạng chia cắt byte làm bể font chữ Unicode.
6. **Response**: Trả kết quả đã định dạng hiển thị lên giao diện chat cho người dùng kèm theo gợi ý hành động (`suggestedAction`) như nút xem chi tiết gói cước vừa được tư vấn.

---

## 5. Hướng dẫn Cài đặt & Cấu hình

### Các biến môi trường (Environment Variables)

#### Cấu hình Backend (`server/.env`)
Tạo file `.env` đặt tại thư mục `server/` chứa các cấu hình sau:
```env
MONGODB_URI= # Đường dẫn kết nối MongoDB Atlas/Local
PORT= # Cổng khởi chạy dịch vụ backend (VD: 5000)
JWT_SECRET= # Khóa bí mật mã hóa JWT token
RECEIVER_WALLET= # Địa chỉ ví MetaMask nhận ETH Sepolia
ETH_EXCHANGE_RATE= # Tỷ giá quy đổi giả lập giữa VND và ETH
RPC_URL= # RPC URL của mạng Sepolia
AI_PROVIDER= # Driver AI (VD: groq)
GROQ_API_KEY= # API Key đăng ký tại Groq Cloud
GROQ_MODEL= # Model LLM sử dụng (VD: llama-3.1-8b-instant)
```

#### Cấu hình Frontend (`client/.env`)
Tạo file `.env` đặt tại thư mục `client/` chứa các cấu hình sau:
```env
VITE_API_URL= # Địa chỉ API URL của Backend (VD: http://localhost:5000)
VITE_NETWORK_NAME= # Tên mạng blockchain (VD: Sepolia)
VITE_CHAIN_ID= # ID mạng blockchain Sepolia dạng thập phân (11155111)
VITE_RPC_URL= # RPC URL của mạng Sepolia
VITE_BLOCK_EXPLORER= # Explorer mạng Sepolia (VD: https://sepolia.etherscan.io)
VITE_RECEIVER_WALLET= # Ví nhận ETH quy đổi nạp tiền
VITE_ETH_EXCHANGE_RATE= # Tỷ giá quy đổi VND/ETH
```

### Các lệnh chạy Dự án (Commands)

#### Khởi chạy Backend
1. Mở terminal và di chuyển vào thư mục backend:
   ```bash
   cd server
   ```
2. Cài đặt các gói phụ thuộc:
   ```bash
   npm install
   ```
3. Chạy dữ liệu mẫu ban đầu (seeding data) vào MongoDB:
   ```bash
   npm run seed
   ```
4. Khởi chạy server ở chế độ phát triển:
   ```bash
   npm start
   ```

#### Khởi chạy Frontend
1. Mở terminal mới và di chuyển vào thư mục frontend:
   ```bash
   cd client
   ```
2. Cài đặt các gói phụ thuộc:
   ```bash
   npm install
   ```
3. Khởi chạy ứng dụng client ở chế độ phát triển:
   ```bash
   npm run dev
   ```
4. Xây dựng phiên bản sản xuất (Production Build):
   ```bash
   npm run build
   ```
