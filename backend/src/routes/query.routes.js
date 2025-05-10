const express = require('express');
const router = express.Router();
const queryController = require('../controllers/query.controller');
const { validateQuery, validateSavedQuery } = require('../middleware/validation.middleware');
const { queryLimiter } = require('../middleware/rateLimit.middleware');

// Apply query rate limiting to execute endpoint
router.post('/execute', queryLimiter, validateQuery, queryController.executeQuery);

// Get query history
router.get('/history', queryController.getQueryHistory);

// Save a query
router.post('/save', validateSavedQuery, queryController.saveQuery);

// Get saved queries
router.get('/saved', queryController.getSavedQueries);

// Delete a saved query
router.delete('/saved/:id', queryController.deleteSavedQuery);

// Get log context
router.post('/context', queryController.getLogContext);

module.exports = router;
