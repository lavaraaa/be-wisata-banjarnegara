const express = require('express');
const router = express.Router();
const likeController = require('../controllers/likeController');
const authenticateToken = require('../middleware/authenticateToken');

router.post('/user/like', authenticateToken, likeController.likeWisata);
router.post('/user/unlike', authenticateToken, likeController.unlikeWisata);
router.get('/total-like/:id_wisata', likeController.getTotalLikesByWisataId);


module.exports = router;