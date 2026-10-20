# HỆ THỐNG TRỰC TUYẾN HỖ TRỢ QUẢN LÝ ĐÀO TẠO NỘI BỘ - FPT SOFTWARE

> **Tên đề tài:** Phát triển hệ thống trực tuyến hỗ trợ quản lý đào tạo nội bộ tại Công ty FPT Software  
> **Công nghệ cốt lõi:** Node.js (Express.js), MySQL / phpMyAdmin, Tailwind CSS, Google Fonts (Inter / Roboto).

---

## 📌 1. QUY CHUẨN ĐẶT TÊN ĐÃ TUÂN THỦ NGHIÊM NGẶT (NAMING CONVENTIONS)

1. **Giao diện người dùng (UI), các thông báo, nhãn (label):** Hiển thị **100% bằng Tiếng Việt có dấu** rõ ràng, chuẩn phong cách doanh nghiệp FPT.
2. **Ghi chú trong mã nguồn (Comments):** **100% bằng Tiếng Việt có dấu** giải thích chi tiết mục đích, tham số và logic nghiệp vụ của từng hàm.
3. **Cơ sở dữ liệu, tên bảng (tables), tên cột (columns):** Đặt bằng **Tiếng Việt không dấu, viết dạng `snake_case`**:
    - `nguoi_dung`: Lưu trữ tài khoản và phân quyền vai trò.
    - `khoa_hoc`: Quản lý các chương trình đào tạo nội bộ.
    - `chuong_bai_hoc`: Danh mục các chương bài giảng.
    - `bai_hoc`: Chi tiết bài học đa phương tiện (Video YouTube, Tài liệu PDF, Slide).
    - `phan_cong_khoa_hoc`: Bảng gán khóa học cho thực tập sinh.
    - `tien_do_bai_hoc`: Ghi nhận trạng thái hoàn thành bài học và % tiến độ.
    - `chu_de_cau_hoi`: Danh mục chủ đề công nghệ (Java, Frontend, Agile, SQL...).
    - `ngan_hang_cau_hoi`: Ngân hàng câu hỏi trắc nghiệm (độ khó, loại câu hỏi, giải thích).
    - `dap_an_lua_chon`: Danh sách các phương án trả lời và đánh dấu đáp án đúng.
    - `de_thi`: Đề thi đánh giá năng lực, thời gian phút, điểm chuẩn đạt, cờ trộn đề.
    - `de_thi_cau_hoi`: Danh sách câu hỏi và trọng số điểm mỗi câu.
    - `bai_thi_nguoi_dung`: Phiên làm bài của thí sinh, thời gian nộp, tổng điểm, trạng thái Đạt/Không đạt.
    - `chi_tiet_bai_thi`: Lưu tạm thời câu trả lời từng câu (Auto-save) và điểm chi tiết.
4. **Tên hàm (functions) và tên biến (variables):** Đặt bằng **Tiếng Việt không dấu, viết dạng `camelCase`**:
    - Ví dụ hàm: `kiemTraDangNhap()`, `layDanhSachKhoaHoc()`, `layDanhSachCauHoi()`, `taoDeThiMoi()`, `batDauLamBaiThi()`, `luuTamDapAnCauHoi()`, `nopBaiThiTrucTuyen()`, `tinhDiemChiTiet()`, `layBangDiemTongHop()`, `layThongKeKetQuaThi()`...
    - Ví dụ biến: `danhSachKhoaHoc`, `thongTinNguoiDung`, `cauHoiHienTai`, `ketQuaBaiThi`, `soCauDung`, `tongDiemDatDuoc`, `thoiGianConLaiGiay`...

---

## 🔐 2. DANH SÁCH TÀI KHOẢN ĐĂNG NHẬP PHÂN QUYỀN (RBAC)

Hệ thống sử dụng **cơ chế đăng nhập một cổng duy nhất** (Single Login Form). Khi người dùng đăng nhập bằng Username hoặc Email kèm Mật khẩu, hệ thống tự động kiểm tra vai trò lưu trong mã Token JWT và điều hướng chính xác:

| Vai trò                       | Tên đăng nhập | Email            | Mật khẩu mặc định | Phân hệ điều hướng                        |
| :---------------------------- | :------------ | :--------------- | :---------------- | :---------------------------------------- |
| **Người hướng dẫn / Quản lý** | `mentor_dung` | `dungnq@fpt.com` | `password123`     | `/giao-dien/quan-tri/tong-quan.html`      |
| **Quản lý Đào tạo**           | `admin_fpt`   | `maitt@fpt.com`  | `password123`     | `/giao-dien/quan-tri/tong-quan.html`      |
| **Thực tập sinh Java**        | `intern_an`   | `anlh@fpt.com`   | `password123`     | `/giao-dien/thuc-tap-sinh/tong-quan.html` |
| **Thực tập sinh Frontend**    | `intern_binh` | `binhpt@fpt.com` | `password123`     | `/giao-dien/thuc-tap-sinh/tong-quan.html` |
| **Thực tập sinh Agile & QA**  | `intern_chi`  | `chidl@fpt.com`  | `password123`     | `/giao-dien/thuc-tap-sinh/tong-quan.html` |

_(Trên màn hình đăng nhập có tích hợp sẵn 2 nút chọn nhanh tài khoản kiểm thử để ban giám khảo / người đánh giá dễ dàng trải nghiệm demo)._

---

## 🌟 3. CÁC TÍNH NĂNG VÀ CÔNG NGHỆ NỔI BẬT

### I. Phân hệ Thực tập sinh / Người học (Intern / User)

1. **Trang tổng quan & Thống kê cá nhân:** Hiển thị 4 thẻ số liệu thoáng đãng (Khóa học được gán, Bài thi sắp đến hạn, Tiến độ học tập %, Điểm thi trung bình).
2. **Khóa học & E-Learning:**
    - Trình xem bài giảng kích thước lớn tích hợp (Video YouTube, Slide bài thuyết trình, Tài liệu PDF).
    - Nút "Đánh dấu đã hoàn thành bài học" tự động cập nhật thanh tiến độ % của khóa học theo thời gian thực.
3. **Phân hệ Thi trắc nghiệm trực tuyến (Exam Focus Mode - Chức năng cốt lõi):**
    - **Giao diện phòng thi tập trung:** Toàn màn hình, không có thanh menu gây xao nhãng, phông chữ Inter rõ nét.
    - **Đa dạng câu hỏi:** Hỗ trợ câu hỏi 1 đáp án (radio) và nhiều đáp án (checkbox).
    - **Đồng hồ đếm ngược thời gian thực (Countdown Timer):** Tính chính xác từng giây, tự động nhấp nháy chuyển màu đỏ cảnh báo khi còn dưới 5 phút.
    - **Tự động lưu đáp án (Auto-save):** Ngay khi chọn câu trả lời, hệ thống tự động gọi API lưu tạm về server kèm biểu tượng "Đã lưu tạm" chống mất dữ liệu khi rớt mạng.
    - **Bảng điều hướng câu hỏi:** Lưới số thứ tự trực quan: màu xanh (đã làm), màu xám (chưa làm), viền cam (câu đang xem), click nhảy ngay tới câu hỏi.
    - **Thu bài tự động:** Tự động thu bài và chấm điểm khi đồng hồ về `00:00`.
4. **Xem kết quả & Lịch sử thi:**
    - Hiển thị điểm số ngay lập tức sau khi nộp bài.
    - Huy hiệu Đạt / Không đạt (Pass/Fail) nổi bật dựa trên điểm chuẩn quy định.
    - Xem lại chi tiết từng câu: câu đã chọn, đáp án đúng và lời giải thích nghiệp vụ chi tiết.

### II. Phân hệ Người hướng dẫn / Quản lý (Mentor / Admin)

1. **Bảng điều khiển Quản trị (Dashboard):** Thống kê tổng số học viên, khóa học, đề thi, tỷ lệ Đạt/Không đạt toàn công ty, danh sách các bài thi vừa nộp.
2. **Quản lý Khóa học & Bài học:**
    - Thêm/Sửa/Xóa khóa học đào tạo.
    - Quản lý chương và bài học chi tiết (link video, slide, tài liệu PDF, ghi chú).
    - Phân công khóa học cho thực tập sinh kèm hạn hoàn thành.
3. **Ngân hàng câu hỏi & Trộn đề tự động (Chức năng cốt lõi):**
    - Phân loại câu hỏi theo chủ đề (Java Core, Frontend, Agile Scrum, SQL...).
    - Lọc theo độ khó (Dễ, Trung bình, Khó) và loại câu hỏi.
    - **Tạo đề thi & Trộn đề tự động:** Bốc ngẫu nhiên câu hỏi từ ngân hàng câu hỏi để tạo đề thi riêng biệt cho từng thực tập sinh, xáo trộn thứ tự các đáp án nhằm hạn chế tối đa việc trao đổi bài.
4. **Theo dõi & Thống kê kết quả:**
    - Bảng điểm tổng hợp dạng Table rộng rãi, dễ dàng tra cứu.
    - Lọc theo đề thi, nhóm học viên, trạng thái Đạt/Chưa đạt, tìm kiếm từ khóa.
    - Xem lại bài làm chi tiết của bất kỳ thực tập sinh nào.
    - Thống kê tỷ lệ Đạt/Chưa đạt (Pass/Fail) trực quan.
5. **Quản lý danh sách thực tập sinh:** Danh sách tài khoản, nhóm phụ trách, số khóa học đã gán, số bài thi đã làm và điểm trung bình.

---

## 🚀 4. HƯỚNG DẪN CÀI ĐẶT VÀ VẬN HÀNH HỆ THỐNG

### Bước 1: Khởi động Cơ sở dữ liệu MySQL

1. Khởi động MySQL từ **XAMPP Control Panel** (hoặc dịch vụ MySQL trên máy tính).
2. Mặc định dự án kết nối đến cổng MySQL `3309` hoặc `3306` (Tập tin `.env` đã được cấu hình sẵn).

### Bước 2: Nạp Cơ sở dữ liệu và Dữ liệu mẫu

Có 2 cách nạp dữ liệu:

- **Cách 1 (Tự động bằng script Node.js):**
    ```bash
    npm run khoi-tao-csdl
    ```
- **Cách 2 (Sử dụng phpMyAdmin):**
    - Mở phpMyAdmin trên trình duyệt: `http://localhost/phpmyadmin/`
    - Nhập tập tin: `co_so_du_lieu/database.sql`

### Bước 3: Khởi chạy Máy chủ Express

Mở cửa sổ dòng lệnh tại thư mục dự án và chạy:

```bash
npm start
```

### Bước 4: Truy cập ứng dụng

Mở trình duyệt web và truy cập địa chỉ:
👉 **`http://localhost:3000`**  
_(Hệ thống sẽ tự động chuyển hướng đến trang Đăng nhập phân quyền)_
