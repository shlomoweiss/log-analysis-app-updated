const express = require('express');
const router = express.Router();
const queryController = require('../controllers/query.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { validateQuery, validateSavedQuery } = require('../middleware/validation.middleware');
const { queryLimiter } = require('../middleware/rateLimit.middleware');

// Apply auth middleware to all routes
router.use(verifyToken);

// Apply query rate limiting to execute endpoint
router.post('/execute', queryLimiter, validateQuery, queryController.executeQuery);

// Get query history for current user
router.get('/history', queryController.getQueryHistory);

// Save a query
router.post('/save', validateSavedQuery, queryController.saveQuery);

// Get saved queries for current user
router.get('/saved', queryController.getSavedQueries);

// Delete a saved query
router.delete('/saved/:id', queryController.deleteSavedQuery);

// Clear LLM context for current user
router.post('/clear-context', queryController.clearContext);

module.exports = router;
