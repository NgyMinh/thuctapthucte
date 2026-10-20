/**
 * Cấu hình tổng thể của hệ thống quản lý đào tạo FPT Software
 */

require('dotenv').config();

module.exports = {
    congMayChu: process.env.PORT || 3000,
    khoaBiMatJwt: process.env.JWT_SECRET || 'fpt_software_training_system_secret_key_2026_secured',
    thoiHanToken: process.env.JWT_EXPIRES_IN || '7d'
};
