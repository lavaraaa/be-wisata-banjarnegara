const express = require('express');
const router = express.Router();
const laporanKomentarController = require('../controllers/laporanKomentarController');
const authenticateToken = require('../middleware/authenticateToken');

// USER
router.post('/user/laporkan-komentar', authenticateToken, laporanKomentarController.laporkanKomentar);

// ADMIN
router.get('/admin/laporan-komentar', authenticateToken, laporanKomentarController.getLaporanKomentar);
router.delete('/admin/laporan-komentar/:id', authenticateToken, laporanKomentarController.hapusLaporanKomentar);
router.delete('/admin/laporan-komentar/komentar/:komentar_id', authenticateToken, laporanKomentarController.hapusKomentarDanLaporan);

module.exports = router;
