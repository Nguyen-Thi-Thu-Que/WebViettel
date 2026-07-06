# Tổng quan hệ thống

Hệ thống quản lý, tra cứu, so sánh và đăng ký các gói cước di động là nền tảng trực tuyến hỗ trợ người dùng di động tra cứu và lựa chọn các gói cước dữ liệu tốc độ cao, các gói cước kết hợp nghe gọi và gói cước chuyên biệt cho mạng xã hội của nhà mạng. Hệ thống tích hợp các công cụ tư vấn như bộ khảo sát nhu cầu đề xuất gói cước cá nhân hóa, trợ lý ảo tư vấn tự động đối khớp từ khóa, đồng thời cung cấp môi trường ví ảo mô phỏng giúp người dùng thực hiện nạp tiền và đăng ký dịch vụ trực tiếp.

## 1. Kiến trúc hệ thống

* **Tổng quan kiến trúc**: Hệ thống được tổ chức theo mô hình phân tách rõ ràng giữa Phân hệ máy khách (giao diện người dùng) và Phân hệ máy chủ (xử lý logic nghiệp vụ và quản trị cơ sở dữ liệu), giao tiếp với nhau qua giao thức mạng thông qua các cổng truyền tải thông tin.
* **Các thành phần chính**:
  * **Phân hệ máy khách**: Chịu trách nhiệm hiển thị giao diện người dùng, quản lý luồng màn hình và duy trì trạng thái ứng dụng cục bộ (như thông tin người dùng hiện tại, giỏ so sánh gói cước và các cấu hình bộ lọc danh sách).
  * **Phân hệ máy chủ**: Tiếp nhận các yêu cầu từ máy khách, chạy qua bộ lọc giới hạn tần suất yêu cầu để bảo vệ máy chủ, xử lý xác thực phiên đăng nhập của người dùng, thực thi các quy tắc nghiệp vụ dịch vụ và thao tác với cơ sở dữ liệu.
  * **Cơ sở dữ liệu**: Cơ sở dữ liệu lưu trữ dưới dạng tài liệu bao gồm các bảng lưu trữ thông tin về tài khoản thành viên, danh sách các gói cước di động, thông tin các gói cước đang được kích hoạt bởi người dùng, lịch sử giao dịch nạp tiền ví ảo, ngân hàng câu hỏi thường gặp và cấu hình kịch bản phản hồi của trợ lý ảo.
* **Mối quan hệ giữa các thành phần**:
  * Khách hàng thực hiện các thao tác trên giao diện của Phân hệ máy khách. Máy khách gửi các yêu cầu nghiệp vụ kèm theo mã khóa xác thực phiên (nếu có) đến Phân hệ máy chủ.
  * Phân hệ máy chủ kiểm tra tính hợp lệ của mã khóa xác thực phiên và vai trò của tài khoản thông qua bộ lọc bảo mật. Nếu hợp lệ, yêu cầu được chuyển đến tệp điều khiển nghiệp vụ để truy vấn và thay đổi dữ liệu trong cơ sở dữ liệu.
  * Kết quả xử lý từ cơ sở dữ liệu được phản hồi về Phân hệ máy khách để cập nhật giao diện người dùng tương ứng.

## 2. Cấu hình hệ thống

* **Công nghệ sử dụng**:
  * **Phân hệ máy khách**: Được xây dựng trên nền tảng thư viện hiển thị giao diện React sử dụng ngôn ngữ TypeScript và công cụ đóng gói Vite. Định kiểu giao diện sử dụng khung Tailwind CSS. Trạng thái toàn cục được quản lý tập trung bằng thư viện Zustand, điều hướng màn hình bằng thư viện React Router DOM, hiệu ứng chuyển động bằng thư viện Framer Motion. Biểu mẫu nhập liệu và kiểm tra tính hợp lệ của dữ liệu được hỗ trợ bởi các thư viện React Hook Form và Zod.
  * **Phân hệ máy chủ**: Sử dụng khung phát triển ứng dụng Express chạy trên môi trường Node.js.
  * **Cơ sở dữ liệu & Ánh xạ dữ liệu**: Hệ quản trị cơ sở dữ liệu tài liệu MongoDB kết hợp với thư viện ánh xạ đối tượng Mongoose để quản lý cấu trúc dữ liệu.
  * **Công cụ bổ trợ**: Sử dụng thư viện chia sẻ tài nguyên nguồn gốc chéo (CORS) để kết nối máy khách và máy chủ, thư viện phân tích dữ liệu dạng bảng CSV (csv-parser) để hỗ trợ nhập danh sách gói cước từ tệp dữ liệu ngoài.
* **Môi trường chạy hệ thống**:
  * Phân hệ máy chủ chạy cục bộ trên môi trường Node.js với cổng kết nối mạng mặc định là năm nghìn.
  * Phân hệ máy khách chạy trong chế độ phát triển trên trình duyệt web thông qua máy chủ Vite với cổng mặc định là năm mốt bảy ba.
  * Cơ sở dữ liệu MongoDB được kết nối cục bộ hoặc qua đám mây với tên cơ sở dữ liệu là goicuocviettel.
* **Các cấu hình chính**:
  * **Phân hệ máy chủ**: Các biến cấu hình bao gồm đường dẫn kết nối cơ sở dữ liệu MongoDB, số hiệu cổng chạy dịch vụ và khóa bí mật dùng cho thuật toán ký mã khóa xác thực phiên đăng nhập của người dùng.
  * **Phân hệ máy khách**: Chứa đường dẫn địa chỉ URL trỏ về dịch vụ máy chủ để thực hiện các yêu cầu truyền thông tin.
  * **Cơ chế nạp dữ liệu mẫu**: Khi khởi động máy chủ, hệ thống tự động kiểm tra bảng câu hỏi thường gặp và bảng cấu hình trợ lý ảo. Nếu trống, máy chủ sẽ tự động ghi các bản ghi mặc định vào cơ sở dữ liệu. Ngoài ra, dự án có sẵn các tập lệnh độc lập giúp đọc dữ liệu gói cước từ tệp dữ liệu ngoài dạng CSV và nạp các tài khoản thành viên mẫu, lịch sử nạp tiền mẫu, lịch sử đăng ký gói cước mẫu vào cơ sở dữ liệu để phục vụ kiểm thử.

## 3. Các chức năng đã hoàn thành

* **Đăng ký tài khoản thành viên mới**:
  * **Mô tả**: Khách hàng điền họ tên, số điện thoại, địa chỉ hòm thư điện tử, mật khẩu và loại hình thuê bao (trả trước hoặc trả sau) để tạo tài khoản mới.
  * **Luồng hoạt động**: Khách hàng gửi thông tin từ giao diện đăng ký. Máy chủ kiểm tra số điện thoại (chỉ hỗ trợ các đầu số di động của nhà mạng Viettel) và đảm bảo số điện thoại này chưa tồn tại trong cơ sở dữ liệu. Mật khẩu được lưu trực tiếp dưới dạng văn bản thuần túy không qua mã hóa vào cơ sở dữ liệu. Số dư ví ảo ban đầu của tài khoản mới được gán mặc định là không đồng và vai trò tài khoản được thiết lập mặc định là thành viên thông thường. Sau khi ghi nhận tài khoản thành công, máy chủ tự tạo mã khóa phiên đăng nhập gửi về máy khách để tự động chuyển tiếp vào giao diện chính.
* **Đăng nhập hệ thống**:
  * **Mô tả**: Xác thực người dùng bằng số điện thoại di động và mật khẩu để cấp quyền truy cập các tính năng ví và đăng ký gói cước.
  * **Luồng hoạt động**: Người dùng nhập số điện thoại và mật khẩu. Yêu cầu gửi lên máy chủ để truy vấn tài khoản tương ứng. Mật khẩu người dùng nhập vào được so khớp trực tiếp với chuỗi mật khẩu văn bản thuần lưu trong cơ sở dữ liệu. Nếu khớp và tài khoản không ở trạng thái bị khóa, máy chủ tạo mã khóa phiên đăng nhập có hiệu lực trong vòng hai mươi bốn giờ ký bằng thuật toán băm chữ ký số tự tạo và gửi lại cho máy khách. Máy khách lưu trữ mã này vào bộ nhớ cục bộ để đính kèm vào tiêu đề xác thực cho các thao tác tiếp theo.
* **Xem và cập nhật hồ sơ cá nhân**:
  * **Mô tả**: Thành viên sau khi đăng nhập có thể xem chi tiết thông tin tài khoản và cập nhật họ tên hoặc địa chỉ hòm thư điện tử của mình.
  - **Luồng hoạt động**: Máy khách gửi yêu cầu xác minh kèm mã khóa phiên. Máy chủ giải mã xác thực để lấy định dạng người dùng, truy vấn dữ liệu chi tiết (số điện thoại, họ tên, số dư ví ảo hiện tại, danh sách gói cước đang kích hoạt) và gửi lại cho máy khách hiển thị trên trang cá nhân. Khi người dùng chỉnh sửa thông tin liên lạc và nhấn lưu, máy khách gửi yêu cầu cập nhật lên máy chủ để chỉnh sửa cơ sở dữ liệu và đồng bộ lại giao diện.
* **Thay đổi mật khẩu tài khoản**:
  - **Mô tả**: Cho phép thành viên thay đổi mật khẩu đăng nhập hiện tại.
  - **Luồng hoạt động**: Người dùng nhập mật khẩu cũ và mật khẩu mới trên trang cá nhân. Máy khách gửi yêu cầu lên máy chủ kèm mã khóa xác thực phiên. Máy chủ đối chiếu mật khẩu cũ với mật khẩu văn bản thuần lưu trong cơ sở dữ liệu. Nếu khớp, máy chủ lưu mật khẩu mới dưới dạng văn bản thuần và phản hồi trạng thái đổi mật khẩu thành công về máy khách để làm mới trạng thái biểu mẫu.
* **Tra cứu và tìm kiếm gói cước di động**:
  - **Mô tả**: Cung cấp giao diện hiển thị danh mục gói cước với bộ lọc đa tiêu chí và tính năng phân trang, sắp xếp kết quả.
  - **Luồng hoạt động**: Máy khách gửi yêu cầu tải danh sách gói cước. Máy chủ truy vấn cơ sở dữ liệu, tự động tính toán điểm đánh giá trung bình giả lập và số lượt đăng ký giả lập cho từng gói cước dựa trên mã số định danh của gói. Máy chủ thực hiện lọc bỏ các gói cước không phù hợp với loại hình thuê bao của người dùng đăng nhập (người dùng trả trước không được xem gói dành riêng cho trả sau và ngược lại; các gói cước dành cho khách hàng thân thiết chỉ hiển thị khi tài khoản có đánh dấu khách hàng thân thiết). Danh sách gói cước được phản hồi về máy khách. Tại trình duyệt, máy khách thực hiện việc lọc chi tiết (theo danh mục, khoảng giá cước, chu kỳ ngày, công nghệ mạng, ưu đãi cuộc gọi, tin nhắn SMS, khuyến mãi ứng dụng) và sắp xếp kết quả (theo giá cước tăng/giảm, tên gói cước, độ phổ biến, gợi ý của hệ thống) trước khi phân chia thành các trang hiển thị (mỗi trang tám gói cước).
* **Xem chi tiết gói cước di động**:
  - **Mô tả**: Hiển thị đầy đủ thông tin về một gói cước di động cụ thể, các cú pháp tin nhắn thao tác di động và các gói cước liên quan đề xuất.
  - **Luồng hoạt động**: Người dùng nhấp xem một gói cước. Máy khách gửi định danh gói hoặc mã gói cước lên máy chủ. Máy chủ kiểm tra quyền hạn xem của tài khoản hiện tại và trả về toàn bộ thông tin chi tiết. Trình duyệt hiển thị tên gói, giá cước, chu kỳ sử dụng, giới hạn dung lượng data tốc độ cao, số phút gọi nội/ngoại mạng miễn phí, đối tượng áp dụng, điều kiện đăng ký, chính sách sử dụng và hiển thị cú pháp nhắn tin di động để đăng ký, hủy gia hạn hoặc hủy hoàn toàn gói cước. Đồng thời, máy khách chạy thuật toán tính điểm tương đồng (dựa trên thể loại gói cước, chu kỳ sử dụng, khoảng cách giá cước) để lọc ra tối đa ba gói cước liên quan nhất trong danh sách khả dụng để hiển thị ở mục đề xuất.
* **So sánh các gói cước di động**:
  - **Mô tả**: Cho phép đặt tối đa ba gói cước lên bảng đối chiếu chi tiết các ưu đãi và hiển thị nhận xét tư vấn tiêu dùng thông minh tự động.
  - **Luồng hoạt động**: Người dùng bấm thêm các gói cước mong muốn vào giỏ so sánh (lưu trong bộ nhớ trạng thái máy khách). Khi truy cập trang so sánh, hệ thống hiển thị bảng dọc chi tiết các thông số: Giá cước, chu kỳ sử dụng, phân loại gói, dung lượng data, gọi nội mạng, ngoại mạng, ứng dụng miễn cước, tiện ích và mô tả. Máy khách sử dụng một tập hợp logic so khớp cố định để phân tích danh sách các gói đang chọn, tự động xác định gói cước có chi phí thấp nhất (tiết kiệm nhất), gói cung cấp dung lượng dữ liệu lớn nhất, gói tối ưu cho nhu cầu nghe gọi hoặc giải trí mạng xã hội để đưa ra nhận xét tư vấn cụ thể dưới dạng tin nhắn của trợ lý ảo. Người dùng có thể thực hiện đăng ký trực tiếp ngay tại bảng so sánh này.
* **Khảo sát nhu cầu chọn gói cước**:
  - **Mô tả**: Hỗ trợ người dùng trả lời bốn câu hỏi nhanh về thói quen tiêu dùng để hệ thống đề xuất ba gói cước phù hợp nhất.
  - **Luồng hoạt động**: Người dùng thực hiện bộ câu hỏi trắc nghiệm qua bốn bước: lựa chọn mức ngân sách hàng tháng, nhu cầu sử dụng dung lượng data di động hàng ngày, nhu cầu đàm thoại nghe gọi và các ứng dụng mạng xã hội truy cập thường xuyên. Khi hoàn thành, máy khách sử dụng thuật toán tính điểm đối khớp câu trả lời khảo sát với danh sách tất cả các gói cước đang lưu trữ cục bộ (cộng điểm khi mức giá nằm trong phân khúc, đáp ứng được dung lượng mạng yêu cầu, có phút gọi miễn phí, miễn cước data cho các ứng dụng đã chọn). Hệ thống sắp xếp điểm số giảm dần và đề xuất ba gói cước tối ưu nhất để người dùng đăng ký trực tiếp.
* **Nạp tiền ví ảo giả lập**:
  - **Mô tả**: Người dùng nạp tiền ảo vào tài khoản ví để trải nghiệm tính năng đăng ký gói cước.
  - **Luồng hoạt động**: Người dùng nhập số tiền nạp (tối thiểu mười nghìn đồng) và chọn cổng thanh toán mô phỏng (Quét mã ngân hàng hoặc ví điện tử). Giao diện hiển thị mã QR giả lập và bộ đếm ngược thời gian chờ. Khi người dùng nhấn nút xác nhận đã chuyển khoản thành công, trình duyệt gửi yêu cầu lên máy chủ. Máy chủ chạy quy trình giao dịch an toàn: cập nhật số dư ví tài khoản trong cơ sở dữ liệu tăng thêm tương ứng với số tiền nạp, đồng thời ghi nhận một bản ghi giao dịch nạp tiền thành công chứa mã băm giao dịch ngẫu nhiên, số tiền giao dịch, cổng thanh toán sử dụng và ngày giờ thực hiện. Trình duyệt tải lại thông tin ví mới để làm mới giao diện và hiển thị giao dịch trong lịch sử ví.
* **Đăng ký gói cước di động**:
  - **Mô tả**: Người dùng sử dụng số dư ví ảo để thực hiện đăng ký và kích hoạt gói cước dịch vụ di động.
  - **Luồng hoạt động**: Người dùng nhấn nút đăng ký gói cước trên giao diện. Yêu cầu gửi lên máy chủ kèm mã khóa xác thực phiên. Máy chủ kiểm tra tính hợp lệ của gói cước di động và truy vấn số dư tài khoản người dùng trong cơ sở dữ liệu. Nếu số dư không đủ thanh toán hoặc người dùng đang sử dụng gói cước đó ở trạng thái kích hoạt, máy chủ phản hồi thông báo lỗi. Nếu hợp lệ, máy chủ thực hiện trừ số dư tài khoản tương ứng với giá gói cước, tạo một bản ghi đăng ký dịch vụ mới có hiệu lực hoạt động trong cơ sở dữ liệu (chứa ngày đăng ký, ngày hết hạn tính theo chu kỳ gói cước, trạng thái hoạt động và tự động gia hạn gán mặc định là có), đồng thời ghi nhận một bản ghi giao dịch trừ phí dịch vụ. Máy chủ phản hồi thành công về trình duyệt để cập nhật số dư ví ảo mới và hiển thị gói cước đang hoạt động trên trang cá nhân của khách hàng.
* **Xem lịch sử giao dịch cá nhân**:
  - **Mô tả**: Hiển thị bảng nhật ký chi tiết các giao dịch nạp ví ảo và giao dịch trừ phí đăng ký gói cước di động của người dùng.
  - **Luồng hoạt động**: Trình duyệt gửi yêu cầu tải nhật ký giao dịch kèm mã khóa phiên. Máy chủ truy vấn toàn bộ các bản ghi giao dịch nạp tiền và các bản ghi đăng ký dịch vụ của người dùng đó từ cơ sở dữ liệu, ánh xạ các trường thông tin hiển thị chung, sắp xếp theo thời gian mới nhất và gửi về máy khách hiển thị dưới dạng bảng lịch sử (bao gồm mã giao dịch, thời gian, loại giao dịch, biến động số dư, cổng thanh toán hoặc tên gói cước tương ứng và trạng thái thành công).
* **Trang báo cáo thống kê dành cho quản trị viên (Admin Dashboard)**:
  - **Mô tả**: Cung cấp biểu đồ và các thẻ số liệu thống kê hoạt động vận hành của toàn bộ hệ thống cho quản trị viên.
  - **Luồng hoạt động**: Khi quản trị viên truy cập trang tổng quan, máy khách gửi yêu cầu tải dữ liệu báo cáo thống kê. Máy chủ truy vấn cơ sở dữ liệu và trả về các chỉ số: tổng số tài khoản đăng ký, tổng số gói cước hiện có, tổng lượt đăng ký dịch vụ, tổng doanh thu ví ảo (tổng tiền ảo nạp thành công) cùng danh sách mười giao dịch nạp tiền hoặc đăng ký gói cước gần nhất trên hệ thống. Máy khách nhận dữ liệu hiển thị các thẻ thống kê tổng số và sử dụng mã đồ họa vectơ SVG vẽ biểu đồ đường xu hướng doanh thu ảo qua các mốc thời gian một cách trực quan, kèm theo bảng chi tiết mười giao dịch gần nhất của các thành viên.
* **Quản lý danh sách câu hỏi hỗ trợ (Admin FAQs CRUD)**:
  - **Mô tả**: Giao diện quản trị hỗ trợ quản trị viên thêm mới, cập nhật hoặc xóa bỏ các câu hỏi thường gặp trong ngân hàng câu hỏi hỗ trợ khách hàng.
  - **Luồng hoạt động**: Quản trị viên xem danh sách các câu hỏi hỗ trợ. Khi thêm mới hoặc chỉnh sửa, biểu mẫu yêu cầu nhập nội dung câu hỏi, câu trả lời và chọn phân loại danh mục hỗ trợ (Đăng ký, Nạp tiền, Hỗ trợ chung). Khi lưu thông tin, máy khách gửi yêu cầu lên máy chủ kèm mã khóa phiên quản trị. Máy chủ thực hiện tạo mới, sửa đổi hoặc xóa bản ghi câu hỏi thường gặp trong cơ sở dữ liệu và phản hồi kết quả về giao diện để làm mới danh sách hiển thị.
* **Quản lý cấu hình trợ lý ảo (Admin Chatbot Config)**:
  - **Mô tả**: Quản trị viên thay đổi prompt chỉ dẫn hành vi hệ thống và tập từ khóa huấn luyện đối khớp cùng câu trả lời phản hồi và gói cước liên kết tương ứng của chatbot.
  - **Luồng hoạt động**: Quản trị viên xem prompt hệ thống hiện tại và danh sách các từ khóa đối khớp. Giao diện hỗ trợ quản trị viên thêm, sửa đổi nội dung phản hồi, gán mã gói cước liên kết cho từ khóa hoặc xóa từ khóa đó. Khi nhấn lưu cấu hình, máy khách gửi toàn bộ cấu hình mới lên máy chủ qua API cấu hình chatbot. Máy chủ kiểm tra quyền quản trị viên, lưu thông tin cập nhật vào cơ sở dữ liệu cấu hình chatbot và phản hồi thông báo lưu thành công về máy khách để áp dụng cho Trợ lý ảo chatbot.

## 4. Các chức năng hoạt động một phần

* **Quản lý danh sách tài khoản thành viên (Admin Users)**:
  * **Phần đã triển khai**: Giao diện quản trị hiển thị danh sách toàn bộ tài khoản người dùng đã đăng ký trên hệ thống bao gồm họ tên, số điện thoại, loại hình thuê bao (trả trước hoặc trả sau), trạng thái khách hàng thân thiết, số dư ví hiện có, trạng thái hoạt động tài khoản, vai trò (người dùng hoặc quản trị viên) và ngày đăng ký. Cho phép quản trị viên nhấp chuột thực hiện bật/tắt ưu đãi khách hàng thân thiết, chuyển đổi loại hình thuê bao (trả trước sang trả sau và ngược lại) và khóa hoặc mở khóa hoạt động của tài khoản khách hàng thông qua việc gửi các yêu cầu cập nhật thông tin tài khoản tương ứng lên máy chủ để chỉnh sửa cơ sở dữ liệu.
  * **Phần còn thiếu**: Theo đặc tả nghiệp vụ, quản trị viên có khả năng trực tiếp cộng hoặc trừ số dư ví ảo cho từng khách hàng cụ thể (phía máy chủ đã xây dựng hoàn chỉnh logic nghiệp vụ nhận dữ liệu số dư mới và lưu vào cơ sở dữ liệu). Tuy nhiên, trên giao diện quản lý người dùng phía máy khách, cột số dư ví hoàn toàn hiển thị dưới dạng chỉ đọc, không có nút bấm, trường nhập liệu hay hộp thoại biểu mẫu nào được thiết kế để hỗ trợ thao tác cập nhật điều chỉnh số dư ví của thành viên. Vì vậy, tính năng điều chỉnh số dư ví thành viên bởi quản trị viên hiện chỉ mới hoạt động một phần ở phía máy chủ.
* **Trợ lý ảo AI Chatbot tư vấn trực tuyến**:
  * **Phần đã triển khai**: Khung trò chuyện di động ở góc màn hình cho phép người dùng gửi tin nhắn trao đổi. Trình duyệt gửi tin nhắn lên máy chủ. Máy chủ đối khớp tin nhắn với tập hợp các từ khóa huấn luyện đã cấu hình trong cơ sở dữ liệu để trả về câu trả lời đã biên soạn sẵn kèm theo nút liên kết đăng ký gói cước di động tương ứng. Nếu không khớp từ khóa, chatbot sẽ đối khớp một số câu chào hỏi, so sánh, nạp tiền thông thường và cuối cùng phản hồi bằng câu trả lời mặc định. Quản trị viên có giao diện cấu hình prompt chỉ dẫn hệ thống và tập từ khóa đối khớp này.
  * **Phần còn thiếu**: 
    * Chatbot hoạt động hoàn toàn dựa trên các quy tắc đối khớp từ khóa cứng được cấu hình thủ công trong cơ sở dữ liệu hoặc logic lập trình cố định chứ không kết nối đến bất kỳ mô hình trí tuệ nhân tạo sinh chữ thực tế nào. 
    * Đặc biệt, **nút hành động đề xuất của chatbot đang bị lỗi liên kết điều hướng nghiêm trọng**: Nút đề xuất do chatbot trả về được gán đường dẫn chuyển trang dạng /packages/:id (ví dụ: /packages/sd135), tuy nhiên tệp định tuyến chính của ứng dụng chỉ có đường dẫn hiển thị chi tiết gói cước dưới dạng /goi-cuoc/:ma_goi (ví dụ: /goi-cuoc/sd135). Do đó, khi người dùng nhấp vào nút liên kết do chatbot gợi ý, trình duyệt sẽ chuyển hướng đến đường dẫn không tồn tại và hiển thị trang báo lỗi không tìm thấy trang (lỗi bốn trăm lẻ bốn).

## 5. Các chức năng chưa hoàn thiện

* **Bộ lọc bảo mật bảo vệ các cổng kết nối quản trị gói cước (Admin Packages CRUD APIs)**:
  * **Hiện trạng trong source code**: Trên giao diện máy khách, các nút bấm tạo mới, chỉnh sửa thông tin chi tiết và xóa gói cước chỉ hiển thị cho tài khoản quản trị. Tuy nhiên, tại tệp định nghĩa các tuyến đường quản lý gói cước của phân hệ máy chủ, các dịch vụ tạo mới, cập nhật thông tin và xóa gói cước hoàn toàn **không được gán các bộ lọc trung gian kiểm tra xác thực phiên đăng nhập và kiểm tra vai trò tài khoản quản trị**. Bất kỳ ai không cần đăng nhập tài khoản cũng có thể gửi yêu cầu trực tiếp qua giao thức mạng đến các cổng này để thay đổi hoặc xóa bỏ toàn bộ cơ sở dữ liệu gói cước của hệ thống. Chức năng bảo mật này được xếp vào mục chưa hoàn thiện do thiếu hụt logic bảo vệ an toàn dữ liệu phía máy chủ.
* **Khôi phục mật khẩu tài khoản di động**:
  * **Hiện trạng trong source code**: Màn hình quên mật khẩu di động đã được thiết lập giao diện hoàn chỉnh cho phép điền số điện thoại di động, nhập mã xác thực OTP giả lập (mã cố định là 123456 sau một khoảng thời gian chờ mô phỏng) và nhập mật khẩu mới. Tuy nhiên, toàn bộ luồng xử lý này hoạt động bằng các khoảng thời gian chờ giả lập trên trình duyệt máy khách. Máy chủ hoàn toàn **chưa xây dựng bất kỳ cổng API nào phục vụ việc nhận thông tin đổi mật khẩu do quên mật khẩu, không có logic gửi tin nhắn mã xác thực thực tế hay cập nhật mật khẩu mới của người dùng trong cơ sở dữ liệu** cho trường hợp này. Chức năng này được xếp vào nhóm chưa hoàn thiện do mới chỉ dừng lại ở giao diện giả lập phía máy khách.
* **Thanh toán nạp tiền ảo bằng tiền mã hóa (Crypto)**:
  * **Hiện trạng trong source code**: Trong tệp định nghĩa mô hình dữ liệu giao dịch nạp tiền và tệp nạp dữ liệu mẫu của máy chủ có khai báo các trường thông tin lưu trữ liên quan đến tiền mã hóa (như mã băm giao dịch, mạng thanh toán blockchain, số lượng coin giao dịch). Tuy nhiên, trên giao diện nạp tiền ví ảo ở trang cá nhân phía máy khách, hệ thống chỉ hỗ trợ hai cổng thanh toán giả lập là VietQR và ví điện tử Momo. Phân hệ máy khách không có chức năng kết nối ví blockchain hay gửi thông tin giao dịch blockchain nào, cũng như không có dịch vụ bên thứ ba nào liên quan đến chuỗi khối được tích hợp.
* **Hủy gia hạn gói cước và duy trì dịch vụ**:
  - **Hiện trạng trong source code**: Khi người dùng nhấn nút hủy gia hạn gói cước đang sử dụng tại trang cá nhân, máy khách gửi yêu cầu hủy đến máy chủ. Tại tệp xử lý nghiệp vụ ví điện tử phía máy chủ, hàm xử lý hủy gói cước thực hiện cập nhật trạng thái bản ghi đăng ký của người dùng trong cơ sở dữ liệu thành hết hạn (`expired`) ngay lập tức, làm gói cước mất hiệu lực truy cập ngay lập tức, thay vì chỉ tắt thuộc tính tự động gia hạn (`is_auto_renew = false`) để cho phép người dùng tiếp tục sử dụng dung lượng còn lại cho đến hết chu kỳ như đặc tả nghiệp vụ thông thường.

## 6. Đánh giá tổng thể

* **Mức độ hoàn thiện của toàn bộ hệ thống**:
  * Hệ thống đã xây dựng được một bộ khung monorepo hoàn chỉnh gồm cả Phân hệ máy khách (React + Tailwind CSS v4 + Zustand) và Phân hệ máy chủ (Express + MongoDB).
  * Khoảng 70% các nghiệp vụ cốt lõi từ góc nhìn người dùng đã hoạt động tốt: việc hiển thị danh mục, tìm kiếm, lọc gói cước, bảng so sánh đối chiếu, bộ câu hỏi trắc nghiệm đề xuất gói cước, đăng ký gói cước và nạp tiền ví ảo mô phỏng đã hoàn thành trọn vẹn luồng từ đầu đến cuối và có tính đồng bộ dữ liệu tốt.
* **Những phần đã hoạt động ổn định**:
  * Luồng lọc, tìm kiếm và phân trang gói cước di động hoạt động mượt mà ở máy khách.
  * Các giao dịch ví ảo mô phỏng (Nạp tiền ảo qua VietQR/Momo, Đăng ký dịch vụ trừ tiền ví ảo) hoạt động ổn định, ghi nhận chính xác biến động số dư và nhật ký giao dịch trong cơ sở dữ liệu.
  * Trang quản trị đã hoàn thiện ổn định các tính năng thống kê số liệu, CRUD câu hỏi hỗ trợ FAQ và CRUD cấu hình từ khóa chatbot.
* **Những phần còn đang trong quá trình phát triển (Chưa hoàn thiện hoặc lỗi logic)**:
  * **Lỗ hổng bảo mật**: Chưa áp dụng các bộ lọc xác thực để bảo vệ các cổng API quản trị gói cước phía máy chủ.
  * **Lưu trữ mật khẩu**: Chưa băm mật khẩu bảo mật trong cơ sở dữ liệu, vẫn lưu trữ dạng văn bản thuần túy.
  * **Lỗi điều hướng Chatbot**: Nút đề xuất của chatbot dẫn đến trang báo lỗi 404 do lệch cấu trúc định tuyến URL.
  * **Thiếu giao diện**: Thiếu biểu mẫu điều chỉnh số dư người dùng trực tiếp trên giao diện quản trị thành viên mặc dù API máy chủ đã có sẵn.
  * **Lỗi logic nghiệp vụ**: Logic hủy gia hạn gói cước phía máy chủ tắt gói ngay lập tức thay vì chỉ tắt tự động gia hạn khi hết chu kỳ sử dụng.
  * **Chỉ có giao diện máy khách (Thiếu logic máy chủ)**: Chức năng quên mật khẩu hoàn toàn chạy giả lập trên máy khách mà không được kết nối với cơ sở dữ liệu hay API máy chủ thực tế.
