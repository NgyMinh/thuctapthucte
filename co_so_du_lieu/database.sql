-- =================================================================================
-- HỆ THỐNG TRỰC TUYẾN HỖ TRỢ QUẢN LÝ ĐÀO TẠO NỘI BỘ - CÔNG TY FPT SOFTWARE
-- Cơ sở dữ liệu: quan_ly_dao_tao
-- Quy định đặt tên: Bảng và cột viết dạng snake_case Tiếng Việt không dấu
-- =================================================================================

DROP DATABASE IF EXISTS quan_ly_dao_tao;
CREATE DATABASE quan_ly_dao_tao  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE quan_ly_dao_tao;

-- 1. Bảng người dùng (Lưu trữ tài khoản Thực tập sinh và Người hướng dẫn / Quản lý)
CREATE TABLE IF NOT EXISTS nguoi_dung (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ma_nguoi_dung VARCHAR(50) NOT NULL UNIQUE,
    ho_ten VARCHAR(100) NOT NULL,
    ten_dang_nhap VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    mat_khau VARCHAR(255) NOT NULL,
    so_dien_thoai VARCHAR(20),
    vai_tro ENUM('thuc_tap_sinh', 'nguoi_huong_dan') NOT NULL DEFAULT 'thuc_tap_sinh',
    nhom_thuc_tap VARCHAR(100),
    anh_dai_dien VARCHAR(255) DEFAULT '/giao-dien/hinh-anh/avatar-mac-dinh.png',
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bảng khóa học đào tạo nội bộ
CREATE TABLE IF NOT EXISTS khoa_hoc (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ma_khoa_hoc VARCHAR(50) NOT NULL UNIQUE,
    tieu_de VARCHAR(255) NOT NULL,
    mo_ta TEXT,
    anh_khoa_hoc VARCHAR(255),
    thoi_luong_gio INT DEFAULT 40,
    nguoi_tao_id INT,
    trang_thai ENUM('dang_dien_ra', 'tam_dung', 'hoan_thanh') DEFAULT 'dang_dien_ra',
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_khoa_hoc_nguoi_tao FOREIGN KEY (nguoi_tao_id) REFERENCES nguoi_dung(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bảng chương bài học thuộc khóa học
CREATE TABLE IF NOT EXISTS chuong_bai_hoc (
    id INT AUTO_INCREMENT PRIMARY KEY,
    khoa_hoc_id INT NOT NULL,
    tieu_de_chuong VARCHAR(255) NOT NULL,
    thu_tu INT DEFAULT 1,
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_chuong_khoa_hoc FOREIGN KEY (khoa_hoc_id) REFERENCES khoa_hoc(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Bảng bài học chi tiết (Video, Tài liệu PDF, Slide)
CREATE TABLE IF NOT EXISTS bai_hoc (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chuong_id INT NOT NULL,
    khoa_hoc_id INT NOT NULL,
    tieu_de_bai_hoc VARCHAR(255) NOT NULL,
    loai_bai_hoc ENUM('video', 'tai_lieu_pdf', 'slide', 'van_ban') NOT NULL DEFAULT 'video',
    duong_dan_noi_dung TEXT,
    noi_dung_van_ban LONGTEXT,
    thoi_luong_phut INT DEFAULT 30,
    thu_tu INT DEFAULT 1,
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bai_hoc_chuong FOREIGN KEY (chuong_id) REFERENCES chuong_bai_hoc(id) ON DELETE CASCADE,
    CONSTRAINT fk_bai_hoc_khoa_hoc FOREIGN KEY (khoa_hoc_id) REFERENCES khoa_hoc(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Bảng phân công khóa học cho thực tập sinh
CREATE TABLE IF NOT EXISTS phan_cong_khoa_hoc (
    id INT AUTO_INCREMENT PRIMARY KEY,
    khoa_hoc_id INT NOT NULL,
    nguoi_dung_id INT NOT NULL,
    ngay_phan_cong DATETIME DEFAULT CURRENT_TIMESTAMP,
    han_hoan_thanh DATE,
    trang_thai ENUM('chua_hoc', 'dang_hoc', 'hoan_thanh') DEFAULT 'dang_hoc',
    CONSTRAINT fk_phan_cong_khoa_hoc FOREIGN KEY (khoa_hoc_id) REFERENCES khoa_hoc(id) ON DELETE CASCADE,
    CONSTRAINT fk_phan_cong_nguoi_dung FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Bảng theo dõi tiến độ từng bài học của người học
CREATE TABLE IF NOT EXISTS tien_do_bai_hoc (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nguoi_dung_id INT NOT NULL,
    bai_hoc_id INT NOT NULL,
    khoa_hoc_id INT NOT NULL,
    da_hoan_thanh TINYINT(1) DEFAULT 0,
    thoi_gian_xem_giay INT DEFAULT 0,
    ngay_hoan_thanh DATETIME NULL,
    CONSTRAINT fk_tien_do_nguoi_dung FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung(id) ON DELETE CASCADE,
    CONSTRAINT fk_tien_do_bai_hoc FOREIGN KEY (bai_hoc_id) REFERENCES bai_hoc(id) ON DELETE CASCADE,
    CONSTRAINT fk_tien_do_khoa_hoc FOREIGN KEY (khoa_hoc_id) REFERENCES khoa_hoc(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Bảng danh mục chủ đề câu hỏi (Java, Frontend, Agile, SQL...)
CREATE TABLE IF NOT EXISTS chu_de_cau_hoi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ma_chu_de VARCHAR(50) NOT NULL UNIQUE,
    ten_chu_de VARCHAR(100) NOT NULL,
    mo_ta TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Bảng ngân hàng câu hỏi trắc nghiệm
CREATE TABLE IF NOT EXISTS ngan_hang_cau_hoi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chu_de_id INT NOT NULL,
    noi_dung_cau_hoi TEXT NOT NULL,
    loai_cau_hoi ENUM('mot_dap_an', 'nhieu_dap_an') DEFAULT 'mot_dap_an',
    muc_do ENUM('de', 'trung_binh', 'kho') DEFAULT 'trung_binh',
    giai_thich_dap_an TEXT,
    nguoi_tao_id INT,
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cau_hoi_chu_de FOREIGN KEY (chu_de_id) REFERENCES chu_de_cau_hoi(id) ON DELETE CASCADE,
    CONSTRAINT fk_cau_hoi_nguoi_tao FOREIGN KEY (nguoi_tao_id) REFERENCES nguoi_dung(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Bảng các đáp án lựa chọn cho mỗi câu hỏi
CREATE TABLE IF NOT EXISTS dap_an_lua_chon (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cau_hoi_id INT NOT NULL,
    noi_dung_dap_an TEXT NOT NULL,
    la_dap_an_dung TINYINT(1) DEFAULT 0,
    thu_tu INT DEFAULT 1,
    CONSTRAINT fk_dap_an_cau_hoi FOREIGN KEY (cau_hoi_id) REFERENCES ngan_hang_cau_hoi(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Bảng đề thi đánh giá năng lực
CREATE TABLE IF NOT EXISTS de_thi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ma_de_thi VARCHAR(50) NOT NULL UNIQUE,
    tieu_de_de_thi VARCHAR(255) NOT NULL,
    mo_ta TEXT,
    khoa_hoc_id INT NULL,
    thoi_gian_lam_bai_phut INT DEFAULT 30,
    diem_chuan_dat DECIMAL(5,2) DEFAULT 8.00,
    so_cau_hoi INT DEFAULT 10,
    tong_diem DECIMAL(5,2) DEFAULT 10.00,
    cho_phep_tron_de TINYINT(1) DEFAULT 1,
    trang_thai ENUM('kich_hoat', 'chua_kich_hoat', 'da_dong') DEFAULT 'kich_hoat',
    ngay_bat_dau DATETIME NULL,
    ngay_ket_thuc DATETIME NULL,
    nguoi_tao_id INT,
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_de_thi_khoa_hoc FOREIGN KEY (khoa_hoc_id) REFERENCES khoa_hoc(id) ON DELETE SET NULL,
    CONSTRAINT fk_de_thi_nguoi_tao FOREIGN KEY (nguoi_tao_id) REFERENCES nguoi_dung(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Bảng liên kết câu hỏi được gán vào đề thi (đối với đề cố định hoặc khuôn mẫu đề)
CREATE TABLE IF NOT EXISTS de_thi_cau_hoi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    de_thi_id INT NOT NULL,
    cau_hoi_id INT NOT NULL,
    diem_cau_hoi DECIMAL(5,2) DEFAULT 1.00,
    thu_tu INT DEFAULT 1,
    CONSTRAINT fk_de_thi_cau_hoi_de_thi FOREIGN KEY (de_thi_id) REFERENCES de_thi(id) ON DELETE CASCADE,
    CONSTRAINT fk_de_thi_cau_hoi_cau_hoi FOREIGN KEY (cau_hoi_id) REFERENCES ngan_hang_cau_hoi(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Bảng bài làm của người dùng / thực tập sinh khi thi
CREATE TABLE IF NOT EXISTS bai_thi_nguoi_dung (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ma_bai_thi VARCHAR(60) NOT NULL UNIQUE,
    de_thi_id INT NOT NULL,
    nguoi_dung_id INT NOT NULL,
    thoi_gian_bat_dau DATETIME DEFAULT CURRENT_TIMESTAMP,
    thoi_gian_nop_bai DATETIME NULL,
    thoi_gian_con_lai_giay INT DEFAULT 0,
    tong_diem_dat_duoc DECIMAL(5,2) DEFAULT 0.00,
    ket_qua ENUM('dat', 'khong_dat', 'dang_lam') DEFAULT 'dang_lam',
    trang_thai_nop ENUM('dang_lam', 'da_nop', 'tu_dong_nop') DEFAULT 'dang_lam',
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bai_thi_de_thi FOREIGN KEY (de_thi_id) REFERENCES de_thi(id) ON DELETE CASCADE,
    CONSTRAINT fk_bai_thi_nguoi_dung FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Bảng chi tiết từng câu trả lời trong bài làm
CREATE TABLE IF NOT EXISTS chi_tiet_bai_thi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bai_thi_id INT NOT NULL,
    cau_hoi_id INT NOT NULL,
    dap_an_da_chon TEXT,
    diem_cau_nay DECIMAL(5,2) DEFAULT 0.00,
    la_dung TINYINT(1) DEFAULT 0,
    thoi_diem_luu_tam DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_chi_tiet_bai_thi FOREIGN KEY (bai_thi_id) REFERENCES bai_thi_nguoi_dung(id) ON DELETE CASCADE,
    CONSTRAINT fk_chi_tiet_cau_hoi FOREIGN KEY (cau_hoi_id) REFERENCES ngan_hang_cau_hoi(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================================
-- DỮ LIỆU MẪU BAN ĐẦU (SEED DATA CHUẨN FPT SOFTWARE)
-- Mật khẩu mặc định của tất cả các tài khoản là: password123
-- =================================================================================

-- 1. Nạp người dùng (Mentor và Thực tập sinh)
INSERT INTO nguoi_dung (id, ma_nguoi_dung, ho_ten, ten_dang_nhap, email, mat_khau, so_dien_thoai, vai_tro, nhom_thuc_tap) VALUES
(1, 'FPT_MNT_001', 'Nguyễn Quốc Dũng', 'mentor', 'dungnq@fpt.com', '$2b$10$Djqr4yH7Yx/3I6TlPmrvrOCqK4cZgQLR2R7q1f.meZGlTKzGb62aW', '0981234567', 'nguoi_huong_dan', 'Ban Đào Tạo Fresher Academy'),
(2, 'FPT_MNT_002', 'Trần Thị Mai', 'admin', 'maitt@fpt.com', '$2b$10$Djqr4yH7Yx/3I6TlPmrvrOCqK4cZgQLR2R7q1f.meZGlTKzGb62aW', '0912345678', 'nguoi_huong_dan', 'Quản lý Đào tạo Nội bộ'),
(3, 'FPT_INT_001', 'Minh', 'user', 'anlh@fpt.com', '$2b$10$Djqr4yH7Yx/3I6TlPmrvrOCqK4cZgQLR2R7q1f.meZGlTKzGb62aW', '0934567891', 'thuc_tap_sinh', 'Fresher Java - K18'),
(4, 'FPT_INT_002', 'Phạm Thanh Bình', 'intern_binh', 'binhpt@fpt.com', '$2b$10$Djqr4yH7Yx/3I6TlPmrvrOCqK4cZgQLR2R7q1f.meZGlTKzGb62aW', '0945678912', 'thuc_tap_sinh', 'Fresher Frontend - K18'),
(5, 'FPT_INT_003', 'Đỗ Linh Chi', 'intern_chi', 'chidl@fpt.com', '$2b$10$Djqr4yH7Yx/3I6TlPmrvrOCqK4cZgQLR2R7q1f.meZGlTKzGb62aW', '0956789123', 'thuc_tap_sinh', 'Fresher Agile & Tester - K18')
ON DUPLICATE KEY UPDATE ho_ten=VALUES(ho_ten);

-- 2. Nạp danh mục chủ đề câu hỏi
INSERT INTO chu_de_cau_hoi (id, ma_chu_de, ten_chu_de, mo_ta) VALUES
(1, 'JAVA_CORE', 'Lập trình Java Căn bản & Nâng cao', 'Kiến thức OOP, Collection, Concurrency, Stream API và Spring Framework cơ bản'),
(2, 'FRONTEND_WEB', 'Frontend & Giao diện Người dùng', 'Kiến thức HTML5, CSS3, Flexbox/Grid, JavaScript ES6+ và ReactJS Component'),
(3, 'AGILE_SCRUM', 'Quy trình Agile & Scrum trong Dự án FPT', 'Nguyên lý Agile, các buổi lễ Scrum (Sprint Planning, Daily Scrum, Retrospective), vai trò PO/SM/Dev'),
(4, 'SQL_DATABASE', 'Cơ sở dữ liệu & Truy vấn SQL', 'Thiết kế CSDL quan hệ, Transaction, Indexing, Tối ưu câu lệnh SELECT, JOIN, GROUP BY')
ON DUPLICATE KEY UPDATE ten_chu_de=VALUES(ten_chu_de);

-- 3. Nạp ngân hàng câu hỏi trắc nghiệm
INSERT INTO ngan_hang_cau_hoi (id, chu_de_id, noi_dung_cau_hoi, loai_cau_hoi, muc_do, giai_thich_dap_an, nguoi_tao_id) VALUES
-- Câu 1 (Java - Một đáp án)
(1, 1, 'Trong ngôn ngữ lập trình Java, tính chất nào của OOP cho phép một lớp con kế thừa các thuộc tính và phương thức từ một lớp cha?', 'mot_dap_an', 'de', 'Tính kế thừa (Inheritance) cho phép lớp con tái sử dụng và mở rộng mã nguồn từ lớp cha.', 1),
-- Câu 2 (Java - Một đáp án)
(2, 1, 'Từ khóa nào trong Java được dùng để ngăn chặn việc ghi đè (override) một phương thức hoặc ngăn chặn kế thừa từ một lớp?', 'mot_dap_an', 'trung_binh', 'Từ khóa final khi gắn vào class sẽ ngăn kế thừa, khi gắn vào method sẽ ngăn override, gắn vào biến sẽ biến nó thành hằng số.', 1),
-- Câu 3 (Java - Nhiều đáp án)
(3, 1, 'Những Interface nào sau đây thuộc cấu trúc Java Collections Framework? (Chọn nhiều đáp án)', 'nhieu_dap_an', 'trung_binh', 'List và Set là interface kế thừa trực tiếp từ Collection interface trong gói java.util.', 1),
-- Câu 4 (Java - Một đáp án)
(4, 1, 'Trong Spring Boot, Annotation nào được sử dụng để đánh dấu một lớp là nơi tiếp nhận và xử lý các RESTful API requests?', 'mot_dap_an', 'de', '@RestController là sự kết hợp giữa @Controller và @ResponseBody, tự động serialize kết quả trả về dạng JSON.', 1),
-- Câu 5 (Frontend - Một đáp án)
(5, 2, 'Trong CSS3, thuộc tính nào được sử dụng để căn giữa các phần tử con theo trục chính (Main Axis) khi sử dụng Flexbox?', 'mot_dap_an', 'de', 'justify-content căn chỉnh các phần tử con dọc theo trục chính của container Flexbox.', 1),
-- Câu 6 (Frontend - Nhiều đáp án)
(6, 2, 'Trong JavaScript hiện đại (ES6+), những cách khai báo biến nào có phạm vi khối (Block Scope)? (Chọn nhiều đáp án)', 'nhieu_dap_an', 'de', 'let và const có block scope, còn var có function scope hoặc global scope.', 1),
-- Câu 7 (Frontend - Một đáp án)
(7, 2, 'Trong ReactJS, Hook nào thường được sử dụng để thực thi các tác vụ phụ trợ (Side Effects) như gọi API hoặc đăng ký sự kiện?', 'mot_dap_an', 'trung_binh', 'useEffect nhận một hàm callback và mảng phụ thuộc (dependency array) để xử lý side-effects trong functional component.', 1),
-- Câu 8 (Agile - Một đáp án)
(8, 3, 'Trong khung làm việc Scrum, độ dài chuẩn của một chu kỳ Sprint thường kéo dài trong khoảng thời gian nào?', 'mot_dap_an', 'de', 'Theo Scrum Guide chuẩn, một Sprint thường có độ dài từ 1 đến 4 tuần (phổ biến nhất tại FPT Software là 2 tuần).', 2),
-- Câu 9 (Agile - Một đáp án)
(9, 3, 'Ai là người chịu trách nhiệm tối đa hóa giá trị sản phẩm và quản lý Product Backlog trong nhóm Scrum?', 'mot_dap_an', 'de', 'Product Owner (PO) là người duy nhất chịu trách nhiệm về Product Backlog và định hướng giá trị cho sản phẩm.', 2),
-- Câu 10 (Agile - Nhiều đáp án)
(10, 3, 'Những sự kiện nào sau đây là các buổi lễ (Scrum Events) chính thức trong Scrum? (Chọn nhiều đáp án)', 'nhieu_dap_an', 'trung_binh', 'Sprint Planning, Daily Scrum, Sprint Review và Sprint Retrospective là 4 sự kiện chính thức trong mỗi Sprint.', 2),
-- Câu 11 (SQL - Một đáp án)
(11, 4, 'Trong chuẩn SQL, mệnh đề nào được sử dụng để lọc dữ liệu trên các nhóm sau khi đã thực hiện phép gom nhóm GROUP BY?', 'mot_dap_an', 'trung_binh', 'WHERE lọc dữ liệu trước khi gom nhóm, còn HAVING lọc các nhóm kết quả sau khi đã GROUP BY.', 1),
-- Câu 12 (SQL - Một đáp án)
(12, 4, 'Phép kết nối nào (JOIN) sẽ trả về toàn bộ các bản ghi từ bảng bên trái và các bản ghi khớp từ bảng bên phải?', 'mot_dap_an', 'de', 'LEFT JOIN (hoặc LEFT OUTER JOIN) giữ lại tất cả các hàng từ bảng bên trái.', 1)
ON DUPLICATE KEY UPDATE noi_dung_cau_hoi=VALUES(noi_dung_cau_hoi);

-- 4. Nạp danh sách các lựa chọn đáp án cho các câu hỏi
INSERT INTO dap_an_lua_chon (id, cau_hoi_id, noi_dung_dap_an, la_dap_an_dung, thu_tu) VALUES
-- Câu 1: Tính chất OOP
(1, 1, 'Tính đóng gói (Encapsulation)', 0, 1),
(2, 1, 'Tính kế thừa (Inheritance)', 1, 2),
(3, 1, 'Tính đa hình (Polymorphism)', 0, 3),
(4, 1, 'Tính trừu tượng (Abstraction)', 0, 4),
-- Câu 2: Từ khóa final
(5, 2, 'static', 0, 1),
(6, 2, 'abstract', 0, 2),
(7, 2, 'final', 1, 3),
(8, 2, 'synchronized', 0, 4),
-- Câu 3: Interface Collections (Chọn nhiều)
(9, 3, 'java.util.List', 1, 1),
(10, 3, 'java.util.Set', 1, 2),
(11, 3, 'java.util.ArrayList', 0, 3),
(12, 3, 'java.util.HashMap', 0, 4),
-- Câu 4: RestController
(13, 4, '@Service', 0, 1),
(14, 4, '@Repository', 0, 2),
(15, 4, '@RestController', 1, 3),
(16, 4, '@Component', 0, 4),
-- Câu 5: Flexbox justify-content
(17, 5, 'align-items', 0, 1),
(18, 5, 'justify-content', 1, 2),
(19, 5, 'flex-direction', 0, 3),
(20, 5, 'align-content', 0, 4),
-- Câu 6: Block Scope (Chọn nhiều)
(21, 6, 'let', 1, 1),
(22, 6, 'const', 1, 2),
(23, 6, 'var', 0, 3),
(24, 6, 'function', 0, 4),
-- Câu 7: React useEffect
(25, 7, 'useState', 0, 1),
(26, 7, 'useMemo', 0, 2),
(27, 7, 'useRef', 0, 3),
(28, 7, 'useEffect', 1, 4),
-- Câu 8: Độ dài Sprint
(29, 8, 'Từ 1 đến 4 tuần', 1, 1),
(30, 8, 'Từ 3 đến 6 tháng', 0, 2),
(31, 8, 'Tối thiểu 2 tháng', 0, 3),
(32, 8, 'Từ 1 đến 2 ngày', 0, 4),
-- Câu 9: Trách nhiệm Product Backlog
(33, 9, 'Scrum Master', 0, 1),
(34, 9, 'Product Owner', 1, 2),
(35, 9, 'Development Team', 0, 3),
(36, 9, 'Project Manager', 0, 4),
-- Câu 10: Sự kiện Scrum (Chọn nhiều)
(37, 10, 'Sprint Planning', 1, 1),
(38, 10, 'Daily Scrum', 1, 2),
(39, 10, 'Sprint Retrospective', 1, 3),
(40, 10, 'Yearly Appraisal', 0, 4),
-- Câu 11: Mệnh đề HAVING
(41, 11, 'WHERE', 0, 1),
(42, 11, 'HAVING', 1, 2),
(43, 11, 'ORDER BY', 0, 3),
(44, 11, 'LIMIT', 0, 4),
-- Câu 12: LEFT JOIN
(45, 12, 'INNER JOIN', 0, 1),
(46, 12, 'RIGHT JOIN', 0, 2),
(47, 12, 'LEFT JOIN', 1, 3),
(48, 12, 'CROSS JOIN', 0, 4)
ON DUPLICATE KEY UPDATE noi_dung_dap_an=VALUES(noi_dung_dap_an);

-- 5. Nạp danh sách khóa học
INSERT INTO khoa_hoc (id, ma_khoa_hoc, tieu_de, mo_ta, anh_khoa_hoc, thoi_luong_gio, nguoi_tao_id, trang_thai) VALUES
(1, 'FPT-JV01', 'Chương trình Đào tạo Fresher Java Spring Boot Chuẩn FPT Software', 'Khóa học toàn diện bao gồm kiến thức Java Core, OOP nâng cao, Spring Boot REST API, Microservices và kiểm thử tự động JUnit.', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80', 60, 1, 'dang_dien_ra'),
(2, 'FPT-FE01', 'Lập trình Frontend Chuyên nghiệp với React, Tailwind CSS & TypeScript', 'Làm chủ giao diện người dùng hiện đại, tối ưu trải nghiệm UI/UX, quản lý state với Redux Toolkit và kiến trúc component chuẩn Clean Code.', 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=600&auto=format&fit=crop&q=80', 50, 1, 'dang_dien_ra'),
(3, 'FPT-AG01', 'Văn hóa Doanh nghiệp, Bảo mật Thông tin & Quy trình Agile/Scrum FPT', 'Nắm vững quy trình phát triển phần mềm chuẩn CMMI cấp độ 5, văn hóa FPT 7 chữ vàng, an toàn bảo mật thông tin nội bộ (ISMS ISO 27001).', 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80', 30, 2, 'dang_dien_ra')
ON DUPLICATE KEY UPDATE tieu_de=VALUES(tieu_de);

-- 6. Nạp chương bài học
INSERT INTO chuong_bai_hoc (id, khoa_hoc_id, tieu_de_chuong, thu_tu) VALUES
(1, 1, 'Chương 1: Tổng quan Nền tảng Java & 4 Trụ cột Lập trình Hướng đối tượng', 1),
(2, 1, 'Chương 2: Java Collections Framework & Quản lý Bộ nhớ JVM', 2),
(3, 1, 'Chương 3: Xây dựng RESTful API với Spring Boot & Hibernate JPA', 3),
(4, 2, 'Chương 1: Nền tảng JavaScript ES6+ & Cơ chế DOM', 1),
(5, 2, 'Chương 2: Thành thạo React Components, Props, State và Hooks', 2),
(6, 3, 'Chương 1: Tổng quan Triết lý Agile & Khung làm việc Scrum', 1),
(7, 3, 'Chương 2: Quy định An toàn Thông tin & Bảo mật Dữ liệu FPT', 2)
ON DUPLICATE KEY UPDATE tieu_de_chuong=VALUES(tieu_de_chuong);

-- 7. Nạp bài học chi tiết
INSERT INTO bai_hoc (id, chuong_id, khoa_hoc_id, tieu_de_bai_hoc, loai_bai_hoc, duong_dan_noi_dung, noi_dung_van_ban, thoi_luong_phut, thu_tu) VALUES
(1, 1, 1, 'Bài 1: Khởi động môi trường & 4 Tính chất Hướng đối tượng trong Java', 'video', 'https://www.youtube.com/embed/eIrMbAQSU34', 'Bài học cung cấp cái nhìn tổng quan về 4 nguyên lý OOP quan trọng: Tính đóng gói (Encapsulation), Tính kế thừa (Inheritance), Tính đa hình (Polymorphism) và Tính trừu tượng (Abstraction). Hướng dẫn thiết lập môi trường JDK 17 và IntelliJ IDEA.', 45, 1),
(2, 1, 1, 'Bài 2: Tài liệu Slide - Nguyên lý Thiết kế Phần mềm SOLID', 'slide', 'https://docs.google.com/presentation/d/e/2PACX-1vTf9zK8z-example/embed', 'Slide tổng hợp nguyên lý SOLID trong kiến trúc hệ thống backend: Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, Dependency Inversion.', 30, 2),
(3, 2, 1, 'Bài 3: Phân biệt List, Set, Map & Tối ưu hiệu năng Collection', 'tai_lieu_pdf', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'Tài liệu hướng dẫn chuyên sâu về độ phức tạp thời gian O(1), O(log n), O(n) của các cấu trúc dữ liệu ArrayList, LinkedList, HashSet, HashMap.', 40, 1),
(4, 3, 1, 'Bài 4: Xây dựng Controller RESTful và Xử lý Ngoại lệ tập trung', 'video', 'https://www.youtube.com/embed/9SGDpanrc8U', 'Thực hành tạo các endpoint GET, POST, PUT, DELETE theo chuẩn REST. Cấu hình @ControllerAdvice và @ExceptionHandler để xử lý lỗi nhất quán.', 60, 1),
(5, 4, 2, 'Bài 1: Cú pháp Hiện đại ES6: Destructuring, Spread, Promise & Async/Await', 'video', 'https://www.youtube.com/embed/NCwa_xi0Uuc', 'Học cách viết mã JavaScript ngắn gọn, tối ưu và kiểm soát luồng bất đồng bộ với Promise, Async/Await.', 40, 1),
(6, 5, 2, 'Bài 2: Làm chủ React Hooks: useState, useEffect, useMemo, useCallback', 'video', 'https://www.youtube.com/embed/TNhaISAUy68', 'Tìm hiểu vòng đời của functional component và cách tối ưu re-render trong ứng dụng React.', 50, 1),
(7, 6, 3, 'Bài 1: Quy trình Sprint 2 tuần và 4 buổi lễ chuẩn Scrum tại FPT', 'video', 'https://www.youtube.com/embed/2Vt7Ik8Ublw', 'Hướng dẫn chi tiết cách tham gia các buổi họp Sprint Planning, Daily Scrum 15 phút, Sprint Review và Sprint Retrospective tại các đơn vị phần mềm FPT.', 35, 1),
(8, 7, 3, 'Bài 2: Sổ tay An toàn Thông tin & Tuân thủ Bảo mật Dự án Khách hàng', 'tai_lieu_pdf', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'Quy tắc vàng về bảo mật mật khẩu, không đưa mã nguồn lên GitHub cá nhân, quy định Clean Desk & Clean Screen.', 25, 1)
ON DUPLICATE KEY UPDATE tieu_de_bai_hoc=VALUES(tieu_de_bai_hoc);

-- 8. Phân công khóa học cho thực tập sinh
INSERT INTO phan_cong_khoa_hoc (id, khoa_hoc_id, nguoi_dung_id, ngay_phan_cong, han_hoan_thanh, trang_thai) VALUES
(1, 1, 3, NOW() - INTERVAL 10 DAY, CURDATE() + INTERVAL 20 DAY, 'dang_hoc'),
(2, 3, 3, NOW() - INTERVAL 10 DAY, CURDATE() + INTERVAL 5 DAY, 'dang_hoc'),
(3, 2, 4, NOW() - INTERVAL 7 DAY, CURDATE() + INTERVAL 23 DAY, 'dang_hoc'),
(4, 3, 4, NOW() - INTERVAL 7 DAY, CURDATE() + INTERVAL 5 DAY, 'dang_hoc'),
(5, 3, 5, NOW() - INTERVAL 5 DAY, CURDATE() + INTERVAL 7 DAY, 'dang_hoc')
ON DUPLICATE KEY UPDATE trang_thai=VALUES(trang_thai);

-- 9. Tiến độ bài học mẫu
INSERT INTO tien_do_bai_hoc (id, nguoi_dung_id, bai_hoc_id, khoa_hoc_id, da_hoan_thanh, ngay_hoan_thanh) VALUES
(1, 3, 1, 1, 1, NOW() - INTERVAL 2 DAY),
(2, 3, 2, 1, 1, NOW() - INTERVAL 1 DAY),
(3, 3, 7, 3, 1, NOW() - INTERVAL 3 DAY),
(4, 4, 5, 2, 1, NOW() - INTERVAL 2 DAY)
ON DUPLICATE KEY UPDATE da_hoan_thanh=VALUES(da_hoan_thanh);

-- 10. Nạp danh sách đề thi trắc nghiệm
INSERT INTO de_thi (id, ma_de_thi, tieu_de_de_thi, mo_ta, khoa_hoc_id, thoi_gian_lam_bai_phut, diem_chuan_dat, so_cau_hoi, tong_diem, cho_phep_tron_de, trang_thai, ngay_bat_dau, ngay_ket_thuc, nguoi_tao_id) VALUES
(1, 'DT_FPT_JV01', 'Đánh giá Năng lực Fresher Java Core & OOP', 'Bài kiểm tra kiến thức lập trình Java căn bản, tư duy OOP và các nguyên lý cốt lõi. Yêu cầu đạt từ 8.0/10.0 điểm.', 1, 20, 8.00, 5, 10.00, 1, 'kich_hoat', NOW() - INTERVAL 3 DAY, NOW() + INTERVAL 30 DAY, 1),
(2, 'DT_FPT_FE01', 'Kiểm tra Kiến thức Frontend & Web Standards', 'Đánh giá kỹ năng HTML5, CSS3 Flexbox, ES6+ và React Hooks dành cho Fresher Frontend. Điểm chuẩn 7.5/10.0.', 2, 15, 7.50, 4, 10.00, 1, 'kich_hoat', NOW() - INTERVAL 2 DAY, NOW() + INTERVAL 30 DAY, 1),
(3, 'DT_FPT_AG01', 'Sát hạch Quy trình Agile Scrum & Văn hóa FPT', 'Bài kiểm tra bắt buộc về quy trình phát triển phần mềm Scrum và quy định an toàn bảo mật thông tin ISMS.', 3, 15, 8.00, 4, 10.00, 1, 'kich_hoat', NOW() - INTERVAL 5 DAY, NOW() + INTERVAL 30 DAY, 2)
ON DUPLICATE KEY UPDATE tieu_de_de_thi=VALUES(tieu_de_de_thi);

-- 11. Gán câu hỏi vào đề thi
INSERT INTO de_thi_cau_hoi (id, de_thi_id, cau_hoi_id, diem_cau_hoi, thu_tu) VALUES
-- Đề Java: 5 câu (mỗi câu 2.0 điểm)
(1, 1, 1, 2.00, 1),
(2, 1, 2, 2.00, 2),
(3, 1, 3, 2.00, 3),
(4, 1, 4, 2.00, 4),
(5, 1, 11, 2.00, 5),
-- Đề Frontend: 4 câu (mỗi câu 2.5 điểm)
(6, 2, 5, 2.50, 1),
(7, 2, 6, 2.50, 2),
(8, 2, 7, 2.50, 3),
(9, 2, 12, 2.50, 4),
-- Đề Agile: 4 câu (mỗi câu 2.5 điểm)
(10, 3, 8, 2.50, 1),
(11, 3, 9, 2.50, 2),
(12, 3, 10, 2.50, 3),
(13, 3, 1, 2.50, 4)
ON DUPLICATE KEY UPDATE diem_cau_hoi=VALUES(diem_cau_hoi);

-- 12. Nạp một bài thi mẫu đã nộp để hiển thị ngay trên bảng điểm và lịch sử thi
INSERT INTO bai_thi_nguoi_dung (id, ma_bai_thi, de_thi_id, nguoi_dung_id, thoi_gian_bat_dau, thoi_gian_nop_bai, thoi_gian_con_lai_giay, tong_diem_dat_duoc, ket_qua, trang_thai_nop) VALUES
(1, 'BT_FPT_SAMPLE_001', 3, 3, NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY + INTERVAL 12 MINUTE, 180, 10.00, 'dat', 'da_nop'),
(2, 'BT_FPT_SAMPLE_002', 1, 4, NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 1 DAY + INTERVAL 18 MINUTE, 120, 6.00, 'khong_dat', 'da_nop')
ON DUPLICATE KEY UPDATE tong_diem_dat_duoc=VALUES(tong_diem_dat_duoc);

-- 13. Nạp chi tiết bài thi mẫu
INSERT INTO chi_tiet_bai_thi (id, bai_thi_id, cau_hoi_id, dap_an_da_chon, diem_cau_nay, la_dung) VALUES
(1, 1, 8, '[29]', 2.50, 1),
(2, 1, 9, '[34]', 2.50, 1),
(3, 1, 10, '[37,38,39]', 2.50, 1),
(4, 1, 1, '[2]', 2.50, 1),
(5, 2, 1, '[2]', 2.00, 1),
(6, 2, 2, '[7]', 2.00, 1),
(7, 2, 3, '[9]', 0.00, 0),
(8, 2, 4, '[15]', 2.00, 1),
(9, 2, 11, '[41]', 0.00, 0)
ON DUPLICATE KEY UPDATE diem_cau_nay=VALUES(diem_cau_nay);
