const express = require('express');
const router = express.Router();
const favoritController = require('../controllers/favoritController');
const authenticateToken = require('../middleware/authenticateToken');

router.post('/user/favorit', authenticateToken, favoritController.simpanFavorit);
router.post('/user/unfavorit', authenticateToken, favoritController.hapusFavorit);
router.get('/total-favorit/:id_wisata', favoritController.getTotalFavoritByWisataId);


module.exports = router;