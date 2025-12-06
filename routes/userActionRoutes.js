const express = require('express');
const router = express.Router();
const userActionController = require('../controllers/userActionController');
const authenticateToken = require('../middleware/authenticateToken');

router.get('/user/status/:id_wisata', authenticateToken, userActionController.getStatusLikeFavorit);
router.post('/update-photo', ...userActionController.updatePhoto);
router.get('/user-wisata', authenticateToken, userActionController.getUserWisataData);
router.post('/delete-photo', authenticateToken, userActionController.deletePhoto);
router.get('/user-wisata-lain', userActionController.getUserWisataById);


module.exports = router;