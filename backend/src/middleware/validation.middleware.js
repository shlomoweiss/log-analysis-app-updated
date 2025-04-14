const { body, validationResult } = require('express-validator');

// Middleware for input validation and sanitization
exports.validateQuery = [
  // Validate and sanitize query text
  body('query')
    .trim()
    .notEmpty().withMessage('Query text is required')
    .isLength({ min: 3, max: 500 }).withMessage('Query must be between 3 and 500 characters')
    .escape(), // Sanitize against XSS
  
  // Process validation results
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }
    next();
  }
];

// Validate saved query
exports.validateSavedQuery = [
  // Validate and sanitize query name
  body('name')
    .trim()
    .notEmpty().withMessage('Query name is required')
    .isLength({ min: 3, max: 100 }).withMessage('Name must be between 3 and 100 characters')
    .escape(), // Sanitize against XSS
  
  // Validate and sanitize query text
  body('query')
    .trim()
    .notEmpty().withMessage('Query text is required')
    .isLength({ min: 3, max: 500 }).withMessage('Query must be between 3 and 500 characters')
    .escape(), // Sanitize against XSS
  
  // Process validation results
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }
    next();
  }
];

// Validate user registration
exports.validateUserRegistration = [
  // Validate and sanitize username
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters')
    .isAlphanumeric().withMessage('Username must contain only letters and numbers')
    .escape(), // Sanitize against XSS
  
  // Validate and sanitize password
  body('password')
    .trim()
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
    .matches(/\d/).withMessage('Password must contain at least one number')
    .matches(/[a-zA-Z]/).withMessage('Password must contain at least one letter'),
  
  // Validate role if provided
  body('role')
    .optional()
    .isIn(['user', 'admin']).withMessage('Role must be either user or admin'),
  
  // Process validation results
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }
    next();
  }
];

// Validate login
exports.validateLogin = [
  // Validate and sanitize username
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .escape(), // Sanitize against XSS
  
  // Validate password
  body('password')
    .trim()
    .notEmpty().withMessage('Password is required'),
  
  // Process validation results
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }
    next();
  }
];

// Validate password change
exports.validatePasswordChange = [
  // Validate current password
  body('currentPassword')
    .trim()
    .notEmpty().withMessage('Current password is required'),
  
  // Validate and sanitize new password
  body('newPassword')
    .trim()
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
    .matches(/\d/).withMessage('New password must contain at least one number')
    .matches(/[a-zA-Z]/).withMessage('New password must contain at least one letter'),
  
  // Process validation results
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: errors.array() 
      });
    }
    next();
  }
];
