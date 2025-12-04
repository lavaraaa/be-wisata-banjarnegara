const express  = require('express');
const multer   = require('multer');
const path     = require('path');
const router   = express.Router();
const authenticate = require('../middleware/authenticateToken');
const ratingCtrl   = require('../controllers/ratingController');

const storage = multer.memoryStorage(); 
const upload = multer({ storage });

router.post(  '/user/rating', authenticate, upload.array('images', 3), ratingCtrl.createRating);
router.put(   '/user/rating/:id', authenticate, upload.array('images', 3), ratingCtrl.updateRating);
router.get('/rating/:wisata_id', ratingCtrl.getAllByWisata);
router.get('/rating/status/:wisata_id', authenticate, ratingCtrl.status);

router.get('/admin/rating', authenticate, ratingCtrl.getAllRatingByAdmin);
router.delete('/admin/rating/:id', authenticate, ratingCtrl.deleteRatingByAdmin);
module.exports = router;
