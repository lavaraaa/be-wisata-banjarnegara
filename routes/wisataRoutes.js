const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  tambahWisata,
  getAllWisata,
  getWisataById,
  editWisata,
  deleteWisata,
  updateEvent
} = require('../controllers/wisataController');

// Konfigurasi multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Rute-rute
router.post('/wisata', upload.fields([
  { name: 'gambar', maxCount: 1 },
  { name: 'galeri', maxCount: 10 }
]), tambahWisata);

router.get('/wisata', getAllWisata);
router.get('/wisata/:id', getWisataById);
router.put('/wisata/:id', upload.fields([
  { name: 'gambar', maxCount: 1 },
  { name: 'galeri', maxCount: 10 }
]), editWisata);

router.patch('/wisata/:id/event', updateEvent);

router.delete('/wisata/:id', deleteWisata);

module.exports = router;
