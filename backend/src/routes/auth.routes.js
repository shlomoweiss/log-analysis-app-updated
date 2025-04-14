const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { validateUserRegistration, validateLogin, validatePasswordChange } = require('../middleware/validation.middleware');
const { authLimiter } = require('../middleware/rateLimit.middleware');

// Apply rate limiting to authentication routes
router.use(authLimiter);

// Register a new user
router.post('/register', validateUserRegistration, authController.register);

// Login user
router.post('/login', validateLogin, authController.login);

// Get current user profile
router.get('/profile', verifyToken, authController.getProfile);

module.exports = router;
