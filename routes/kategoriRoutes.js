const express = require('express');
const router = express.Router();

const authenticateToken = require('../middleware/authenticateToken');
const kategoriController = require('../controllers/kategoriController');

// Public endpoint (no auth required)
router.get('/kategori', kategoriController.getPublicKategori);

// Admin endpoints (auth required)
router.post('/admin/kategori', authenticateToken, kategoriController.createKategori);
router.get('/admin/kategori', authenticateToken, kategoriController.getAllKategori);
router.put('/admin/kategori/:id', authenticateToken, kategoriController.updateKategori);
router.delete('/admin/kategori/:id', authenticateToken, kategoriController.deleteKategori);

module.exports = router;
