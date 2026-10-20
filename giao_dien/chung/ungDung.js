/**
 * Thư viện JavaScript dùng chung cho toàn bộ giao diện phía Client
 * Dự án: Hệ thống quản lý đào tạo FPT Software
 */

// Định nghĩa màu sắc chủ đạo chuẩn nhận diện thương hiệu FPT
const MAU_SAC_FPT = {
    camChinh: '#F37021',
    camDam: '#D85A0E',
    xanhFpt: '#002C6C',
    xanhNhat: '#0047AB'
};

/**
 * Hàm lấy token xác thực được lưu trong localStorage hoặc cookie
 * @returns {string|null} Chuỗi token JWT
 */
function layTokenXacThuc() {
    return localStorage.getItem('token_fpt');
}

/**
 * Hàm lấy thông tin người dùng hiện tại từ bộ nhớ trình duyệt
 * @returns {Object|null} Đối tượng thông tin người dùng
 */
function layThongTinNguoiDung() {
    const duLieu = localStorage.getItem('nguoi_dung_fpt');
    if (!duLieu) return null;
    try {
        return JSON.parse(duLieu);
    } catch (e) {
        return null;
    }
}

/**
 * Hàm lưu trữ thông tin phiên đăng nhập vào trình duyệt
 * @param {string} token - Mã JWT token
 * @param {Object} nguoiDung - Thông tin người dùng
 */
function luuPhienDangNhap(token, nguoiDung) {
    localStorage.setItem('token_fpt', token);
    localStorage.setItem('nguoi_dung_fpt', JSON.stringify(nguoiDung));
}

/**
 * Hàm xóa phiên làm việc và đăng xuất người dùng
 */
function dangXuatHeThong() {
    localStorage.removeItem('token_fpt');
    localStorage.removeItem('nguoi_dung_fpt');
    // Gọi API đăng xuất để xóa cookie nếu có
    fetch('/api/xac-thuc/dang-xuat', { method: 'POST' }).finally(() => {
        window.location.href = '/giao-dien/dang-nhap.html';
    });
}

/**
 * Hàm kiểm tra bảo vệ trang giao diện theo quyền (RBAC)
 * @param {string} vaiTroYeuCau - 'thuc_tap_sinh' hoặc 'nguoi_huong_dan'
 */
function kiemTraBaoVeTrang(vaiTroYeuCau) {
    const token = layTokenXacThuc();
    const nguoiDung = layThongTinNguoiDung();

    if (!token || !nguoiDung) {
        window.location.href = '/giao-dien/dang-nhap.html';
        return false;
    }

    if (vaiTroYeuCau && nguoiDung.vaiTro !== vaiTroYeuCau) {
        // Điều hướng về đúng phân hệ nếu người dùng cố truy cập sai trang
        if (nguoiDung.vaiTro === 'nguoi_huong_dan') {
            window.location.href = '/giao-dien/quan-tri/tong-quan.html';
        } else {
            window.location.href = '/giao-dien/thuc-tap-sinh/tong-quan.html';
        }
        return false;
    }

    return true;
}

/**
 * Hàm bao bọc gọi API an toàn, tự động đính kèm Token xác thực
 * @param {string} duongDan - URL API cần gọi
 * @param {string} phuongThuc - 'GET', 'POST', 'PUT', 'DELETE', 'PATCH'
 * @param {Object|null} duLieu - Dữ liệu payload gửi kèm
 * @returns {Promise<Object>} Dữ liệu JSON phản hồi từ máy chủ
 */
async function goiApi(duongDan, phuongThuc = 'GET', duLieu = null) {
    const token = layTokenXacThuc();
    const tieuDe = {
        'Content-Type': 'application/json'
    };

    if (token) {
        tieuDe['Authorization'] = `Bearer ${token}`;
    }

    const tuyChon = {
        method: phuongThuc,
        headers: tieuDe
    };

    if (duLieu && phuongThuc !== 'GET') {
        tuyChon.body = JSON.stringify(duLieu);
    }

    try {
        const phanHoi = await fetch(duongDan, tuyChon);
        const ketQuaJson = await phanHoi.json();

        if (phanHoi.status === 401) {
            hienThiThongBao('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!', 'canh_bao');
            setTimeout(() => {
                dangXuatHeThong();
            }, 1200);
            return { thanhCong: false, thongBao: 'Hết phiên đăng nhập' };
        }

        return ketQuaJson;
    } catch (loiKetNoi) {
        console.error('[LỖI GỌI API]:', loiKetNoi);
        hienThiThongBao('Không thể kết nối đến máy chủ. Vui lòng kiểm tra đường truyền mạng!', 'loi');
        return { thanhCong: false, thongBao: loiKetNoi.message };
    }
}

/**
 * Hàm hiển thị thông báo góc màn hình (Toast Notification)
 * @param {string} thongDiep - Nội dung thông báo bằng Tiếng Việt có dấu
 * @param {string} loai - 'thanh_cong', 'loi', 'canh_bao', 'thong_tin'
 */
function hienThiThongBao(thongDiep, loai = 'thanh_cong') {
    let khungChua = document.getElementById('khung-chua-thong-bao');
    if (!khungChua) {
        khungChua = document.createElement('div');
        khungChua.id = 'khung-chua-thong-bao';
        khungChua.className = 'fixed top-5 right-5 z-50 flex flex-col space-y-3 pointer-events-none';
        document.body.appendChild(khungChua);
    }

    const hopThongBao = document.createElement('div');
    hopThongBao.className = `pointer-events-auto flex items-center px-4 py-3 rounded-lg shadow-xl text-white transform transition-all duration-300 translate-x-full text-sm font-medium border`;

    let mauNen = 'bg-emerald-600 border-emerald-500';
    let bieuTuong = `<svg class="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;

    if (loai === 'loi') {
        mauNen = 'bg-rose-600 border-rose-500';
        bieuTuong = `<svg class="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;
    } else if (loai === 'canh_bao') {
        mauNen = 'bg-amber-600 border-amber-500';
        bieuTuong = `<svg class="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`;
    } else if (loai === 'thong_tin') {
        mauNen = 'bg-blue-600 border-blue-500';
        bieuTuong = `<svg class="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
    }

    hopThongBao.className += ` ${mauNen}`;
    hopThongBao.innerHTML = `${bieuTuong}<span>${thongDiep}</span>`;
    khungChua.appendChild(hopThongBao);

    // Kích hoạt hiệu ứng trượt vào
    setTimeout(() => {
        hopThongBao.classList.remove('translate-x-full');
    }, 10);

    // Tự động ẩn sau 3.5 giây
    setTimeout(() => {
        hopThongBao.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => {
            hopThongBao.remove();
        }, 300);
    }, 3500);
}

/**
 * Hàm định dạng ngày giờ hiển thị theo chuẩn Việt Nam (DD/MM/YYYY HH:mm)
 * @param {string|Date} chuoiNgayGio - Thời gian cần định dạng
 * @returns {string} Chuỗi hiển thị thân thiện
 */
function dinhDangNgayGio(chuoiNgayGio) {
    if (!chuoiNgayGio) return '--';
    const doiTuongNgay = new Date(chuoiNgayGio);
    if (isNaN(doiTuongNgay.getTime())) return '--';

    const ngay = String(doiTuongNgay.getDate()).padStart(2, '0');
    const thang = String(doiTuongNgay.getMonth() + 1).padStart(2, '0');
    const nam = doiTuongNgay.getFullYear();
    const gio = String(doiTuongNgay.getHours()).padStart(2, '0');
    const phut = String(doiTuongNgay.getMinutes()).padStart(2, '0');

    return `${ngay}/${thang}/${nam} ${gio}:${phut}`;
}

/**
 * Hàm định dạng số giây còn lại thành chuỗi đếm ngược "Phút : Giây"
 * @param {number} tongSoGiay - Số giây còn lại
 * @returns {string} Ví dụ: "14:59"
 */
function dinhDangDongHoDemNguoc(tongSoGiay) {
    if (tongSoGiay <= 0) return '00:00';
    const soPhut = Math.floor(tongSoGiay / 60);
    const soGiay = tongSoGiay % 60;
    return `${String(soPhut).padStart(2, '0')}:${String(soGiay).padStart(2, '0')}`;
}

/**
 * Hàm thiết lập thanh thông tin người dùng ở góc trên thanh điều hướng
 */
function caiDatThongTinNguoiDungHeader() {
    const nguoiDung = layThongTinNguoiDung();
    if (!nguoiDung) return;

    const theTen = document.getElementById('header-ten-nguoi-dung');
    const theVaiTro = document.getElementById('header-vai-tro');
    const theNhom = document.getElementById('header-nhom');

    if (theTen) theTen.textContent = nguoiDung.hoTen;
    if (theVaiTro) {
        theVaiTro.textContent = nguoiDung.vaiTro === 'nguoi_huong_dan' ? 'Người hướng dẫn / Quản lý' : 'Thực tập sinh (Intern)';
    }
    if (theNhom && nguoiDung.nhomThucTap) {
        theNhom.textContent = nguoiDung.nhomThucTap;
    }
}
