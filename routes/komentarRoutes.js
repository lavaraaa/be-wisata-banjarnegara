const express = require('express');
const router = express.Router();
const komentarController = require('../controllers/komentarController');
const authenticateToken = require('../middleware/authenticateToken');

// Tambah komentar
router.post('/user/komentar', authenticateToken, komentarController.komentarWisata);

// Edit komentar (oleh pemilik)
router.put('/user/komentar/:id_komentar', authenticateToken, komentarController.editKomentar);

// Hapus komentar (oleh pemilik atau admin)
router.delete('/user/komentar/:id_komentar', authenticateToken, komentarController.hapusKomentar);

// Ambil komentar berdasarkan ID wisata
router.get('/user/komentar/:id_wisata', komentarController.getKomentarByWisata);

router.get('/admin/komentar', authenticateToken, komentarController.getAllKomentarForAdmin);
router.delete('/admin/komentar/:id_komentar', authenticateToken, komentarController.hapusKomentarByAdmin);

module.exports = router;
