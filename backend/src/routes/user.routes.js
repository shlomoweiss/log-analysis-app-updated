const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');
const { validatePasswordChange } = require('../middleware/validation.middleware');

// Apply auth middleware to all routes
router.use(verifyToken);

// Get all users (admin only)
router.get('/', isAdmin, userController.getAllUsers);

// Get user by ID (admin only)
router.get('/:id', isAdmin, userController.getUserById);

// Update user
router.put('/:id', userController.updateUser);

// Delete user (admin only)
router.delete('/:id', isAdmin, userController.deleteUser);

// Change password
router.post('/change-password', validatePasswordChange, userController.changePassword);

module.exports = router;
