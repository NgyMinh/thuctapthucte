/**
 * Điều khiển quản lý Ngân hàng câu hỏi trắc nghiệm và Danh mục chủ đề
 * Dự án: Hệ thống quản lý đào tạo FPT Software
 */

const { thucThiTruyVan } = require('../cau_hinh/ketNoiCoSoDuLieu');

/**
 * Hàm lấy danh sách tất cả các chủ đề công nghệ (Java, Frontend, Agile, SQL...)
 */
async function layDanhSachChuDe(yeuCau, phanHoi) {
    try {
        const cauLenh = `
            SELECT 
                cd.id, 
                cd.ma_chu_de, 
                cd.ten_chu_de, 
                cd.mo_ta,
                (SELECT COUNT(*) FROM ngan_hang_cau_hoi ch WHERE ch.chu_de_id = cd.id) AS tong_so_cau_hoi
            FROM chu_de_cau_hoi cd
            ORDER BY cd.id ASC
        `;
        const danhSachChuDe = await thucThiTruyVan(cauLenh);

        return phanHoi.status(200).json({
            thanhCong: true,
            duLieu: danhSachChuDe
        });
    } catch (loi) {
        console.error('[LỖI LẤY DANH SÁCH CHỦ ĐỀ]:', loi);
        return phanHoi.status(500).json({
            thanhCong: false,
            thongBao: 'Lỗi máy chủ khi tải danh sách chủ đề câu hỏi.'
        });
    }
}

/**
 * Hàm lấy danh sách câu hỏi trong ngân hàng, hỗ trợ lọc theo chủ đề, độ khó, loại câu hỏi
 */
async function layDanhSachCauHoi(yeuCau, phanHoi) {
    try {
        const { chuDeId, mucDo, loaiCauHoi, tuKhoa } = yeuCau.query;

        let cauLenh = `
            SELECT 
                ch.id, 
                ch.chu_de_id, 
                ch.noi_dung_cau_hoi, 
                ch.loai_cau_hoi, 
                ch.muc_do, 
                ch.giai_thich_dap_an, 
                ch.ngay_tao,
                cd.ten_chu_de,
                nd.ho_ten AS ten_nguoi_tao
            FROM ngan_hang_cau_hoi ch
            JOIN chu_de_cau_hoi cd ON ch.chu_de_id = cd.id
            LEFT JOIN nguoi_dung nd ON ch.nguoi_tao_id = nd.id
            WHERE 1=1
        `;
        const thamSo = [];

        if (chuDeId) {
            cauLenh += ` AND ch.chu_de_id = ?`;
            thamSo.push(chuDeId);
        }

        if (mucDo) {
            cauLenh += ` AND ch.muc_do = ?`;
            thamSo.push(mucDo);
        }

        if (loaiCauHoi) {
            cauLenh += ` AND ch.loai_cau_hoi = ?`;
            thamSo.push(loaiCauHoi);
        }

        if (tuKhoa) {
            cauLenh += ` AND ch.noi_dung_cau_hoi LIKE ?`;
            thamSo.push(`%${tuKhoa}%`);
        }

        cauLenh += ` ORDER BY ch.id DESC`;

        const danhSachCauHoi = await thucThiTruyVan(cauLenh, thamSo);

        // Lấy danh sách đáp án tương ứng của các câu hỏi
        if (danhSachCauHoi.length > 0) {
            const danhSachIdCauHoi = danhSachCauHoi.map(ch => ch.id);
            const cauLenhDapAn = `
                SELECT id, cau_hoi_id, noi_dung_dap_an, la_dap_an_dung, thu_tu 
                FROM dap_an_lua_chon 
                WHERE cau_hoi_id IN (?) 
                ORDER BY thu_tu ASC
            `;
            const danhSachDapAn = await thucThiTruyVan(cauLenhDapAn, [danhSachIdCauHoi]);

            // Gắn đáp án vào từng câu hỏi
            danhSachCauHoi.forEach(cauHoi => {
                cauHoi.danhSachDapAn = danhSachDapAn.filter(da => da.cau_hoi_id === cauHoi.id);
            });
        }

        return phanHoi.status(200).json({
            thanhCong: true,
            duLieu: danhSachCauHoi
        });
    } catch (loi) {
        console.error('[LỖI LẤY NGÂN HÀNG CÂU HỎI]:', loi);
        return phanHoi.status(500).json({
            thanhCong: false,
            thongBao: 'Lỗi máy chủ khi tải ngân hàng câu hỏi.'
        });
    }
}

/**
 * Hàm thêm câu hỏi mới kèm danh sách các lựa chọn đáp án
 */
async function themCauHoiMoi(yeuCau, phanHoi) {
    try {
        const idNguoiTao = yeuCau.nguoiDungHienTai.id;
        const { chuDeId, noiDungCauHoi, loaiCauHoi, mucDo, giaiThichDapAn, danhSachDapAn } = yeuCau.body;

        if (!chuDeId || !noiDungCauHoi || !Array.isArray(danhSachDapAn) || danhSachDapAn.length < 2) {
            return phanHoi.status(400).json({
                thanhCong: false,
                thongBao: 'Vui lòng cung cấp nội dung câu hỏi, chủ đề và ít nhất 2 đáp án lựa chọn!'
            });
        }

        // Kiểm tra xem có ít nhất 1 đáp án đúng được chọn hay không
        const coDapAnDung = danhSachDapAn.some(da => da.laDapAnDung == 1 || da.laDapAnDung === true);
        if (!coDapAnDung) {
            return phanHoi.status(400).json({
                thanhCong: false,
                thongBao: 'Phải có ít nhất một đáp án đúng được đánh dấu!'
            });
        }

        // Thêm câu hỏi vào bảng ngan_hang_cau_hoi
        const cauLenhThemCauHoi = `
            INSERT INTO ngan_hang_cau_hoi (chu_de_id, noi_dung_cau_hoi, loai_cau_hoi, muc_do, giai_thich_dap_an, nguoi_tao_id)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const ketQuaCauHoi = await thucThiTruyVan(cauLenhThemCauHoi, [
            chuDeId,
            noiDungCauHoi.trim(),
            loaiCauHoi || 'mot_dap_an',
            mucDo || 'trung_binh',
            giaiThichDapAn || '',
            idNguoiTao
        ]);

        const idCauHoiVuaTao = ketQuaCauHoi.insertId;

        // Thêm từng đáp án vào bảng dap_an_lua_chon
        for (let chiSo = 0; chiSo < danhSachDapAn.length; chiSo++) {
            const dapAn = danhSachDapAn[chiSo];
            const cauLenhThemDapAn = `
                INSERT INTO dap_an_lua_chon (cau_hoi_id, noi_dung_dap_an, la_dap_an_dung, thu_tu)
                VALUES (?, ?, ?, ?)
            `;
            await thucThiTruyVan(cauLenhThemDapAn, [
                idCauHoiVuaTao,
                dapAn.noiDungDapAn.trim(),
                dapAn.laDapAnDung ? 1 : 0,
                chiSo + 1
            ]);
        }

        return phanHoi.status(201).json({
            thanhCong: true,
            thongBao: 'Thêm câu hỏi mới vào ngân hàng thành công!',
            cauHoiId: idCauHoiVuaTao
        });

    } catch (loi) {
        console.error('[LỖI THÊM CÂU HỎI]:', loi);
        return phanHoi.status(500).json({
            thanhCong: false,
            thongBao: 'Lỗi máy chủ khi thêm câu hỏi mới.'
        });
    }
}

/**
 * Hàm cập nhật câu hỏi và đáp án
 */
async function capNhatCauHoi(yeuCau, phanHoi) {
    try {
        const idCauHoi = yeuCau.params.id;
        const { chuDeId, noiDungCauHoi, loaiCauHoi, mucDo, giaiThichDapAn, danhSachDapAn } = yeuCau.body;

        // Cập nhật thông tin câu hỏi
        const cauLenhSua = `
            UPDATE ngan_hang_cau_hoi 
            SET chu_de_id = ?, noi_dung_cau_hoi = ?, loai_cau_hoi = ?, muc_do = ?, giai_thich_dap_an = ?
            WHERE id = ?
        `;
        await thucThiTruyVan(cauLenhSua, [chuDeId, noiDungCauHoi, loaiCauHoi, mucDo, giaiThichDapAn, idCauHoi]);

        // Nếu có cập nhật danh sách đáp án: xóa đáp án cũ và nạp đáp án mới
        if (Array.isArray(danhSachDapAn) && danhSachDapAn.length >= 2) {
            await thucThiTruyVan('DELETE FROM dap_an_lua_chon WHERE cau_hoi_id = ?', [idCauHoi]);

            for (let chiSo = 0; chiSo < danhSachDapAn.length; chiSo++) {
                const dapAn = danhSachDapAn[chiSo];
                const cauLenhThemDapAn = `
                    INSERT INTO dap_an_lua_chon (cau_hoi_id, noi_dung_dap_an, la_dap_an_dung, thu_tu)
                    VALUES (?, ?, ?, ?)
                `;
                await thucThiTruyVan(cauLenhThemDapAn, [
                    idCauHoi,
                    dapAn.noiDungDapAn.trim(),
                    dapAn.laDapAnDung ? 1 : 0,
                    chiSo + 1
                ]);
            }
        }

        return phanHoi.status(200).json({
            thanhCong: true,
            thongBao: 'Cập nhật câu hỏi thành công!'
        });
    } catch (loi) {
        console.error('[LỖI CẬP NHẬT CÂU HỎI]:', loi);
        return phanHoi.status(500).json({
            thanhCong: false,
            thongBao: 'Lỗi máy chủ khi cập nhật câu hỏi.'
        });
    }
}

/**
 * Hàm xóa câu hỏi khỏi ngân hàng
 */
async function xoaCauHoi(yeuCau, phanHoi) {
    try {
        const idCauHoi = yeuCau.params.id;
        await thucThiTruyVan('DELETE FROM ngan_hang_cau_hoi WHERE id = ?', [idCauHoi]);

        return phanHoi.status(200).json({
            thanhCong: true,
            thongBao: 'Đã xóa câu hỏi khỏi ngân hàng thành công!'
        });
    } catch (loi) {
        console.error('[LỖI XÓA CÂU HỎI]:', loi);
        return phanHoi.status(500).json({
            thanhCong: false,
            thongBao: 'Lỗi máy chủ khi xóa câu hỏi.'
        });
    }
}

module.exports = {
    layDanhSachChuDe,
    layDanhSachCauHoi,
    themCauHoiMoi,
    capNhatCauHoi,
    xoaCauHoi
};
