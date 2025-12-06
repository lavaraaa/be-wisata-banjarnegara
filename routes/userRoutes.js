const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticateToken = require('../middleware/authenticateToken');

router.get('/users/:id', userController.getUserById); 
router.get('/users', authenticateToken, userController.getAllUsers);
router.delete('/users/:id', authenticateToken, userController.deleteUser);

module.exports = router;
