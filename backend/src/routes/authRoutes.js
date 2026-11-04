const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { validateLoginInput } = require('../middleware/validationMiddleware');

router.post('/login', validateLoginInput, authController.login);
router.post('/register', authController.register);
router.get('/me', authenticateToken, authController.getMe);

module.exports = router;
