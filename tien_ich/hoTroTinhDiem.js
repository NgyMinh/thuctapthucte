/**
 * Tập tin chứa các hàm tiện ích hỗ trợ tính điểm và trộn đề thi ngẫu nhiên
 * Dự án: Hệ thống quản lý đào tạo FPT Software
 */

/**
 * Hàm trộn ngẫu nhiên một mảng theo thuật toán Fisher-Yates
 * Sử dụng để tạo đề thi riêng biệt cho từng thực tập sinh, hạn chế gian lận
 * @param {Array} mangGoc - Mảng dữ liệu ban đầu
 * @returns {Array} Mảng mới đã được hoán đổi ngẫu nhiên
 */
function tronNgauNhienMang(mangGoc) {
    const mangKetQua = [...mangGoc];
    for (let chiSo = mangKetQua.length - 1; chiSo > 0; chiSo--) {
        const chiSoNgauNhien = Math.floor(Math.random() * (chiSo + 1));
        const phanTuTam = mangKetQua[chiSo];
        mangKetQua[chiSo] = mangKetQua[chiSoNgauNhien];
        mangKetQua[chiSoNgauNhien] = phanTuTam;
    }
    return mangKetQua;
}

/**
 * Hàm kiểm tra so khớp đáp án thí sinh đã chọn với danh sách đáp án đúng
 * @param {Array<number|string>} danhSachDaChon - Mảng ID các đáp án thí sinh chọn
 * @param {Array<number|string>} danhSachDapAnDung - Mảng ID các đáp án đúng từ CSDL
 * @param {string} loaiCauHoi - 'mot_dap_an' hoặc 'nhieu_dap_an'
 * @returns {boolean} true nếu đúng hoàn toàn, false nếu sai hoặc thiếu
 */
function kiemTraDapAnDung(danhSachDaChon, danhSachDapAnDung, loaiCauHoi) {
    if (!Array.isArray(danhSachDaChon) || danhSachDaChon.length === 0) {
        return false;
    }

    // Chuẩn hóa ID về dạng số nguyên để so sánh chính xác
    const tapHopDaChon = danhSachDaChon.map(id => parseInt(id, 10)).sort();
    const tapHopDung = danhSachDapAnDung.map(id => parseInt(id, 10)).sort();

    if (tapHopDaChon.length !== tapHopDung.length) {
        return false;
    }

    for (let chiSo = 0; chiSo < tapHopDung.length; chiSo++) {
        if (tapHopDaChon[chiSo] !== tapHopDung[chiSo]) {
            return false;
        }
    }

    return true;
}

module.exports = {
    tronNgauNhienMang,
    kiemTraDapAnDung
};
