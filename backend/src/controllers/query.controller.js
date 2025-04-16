const Query = require('../models/query.model');
const SavedQuery = require('../models/savedQuery.model');
const elasticsearchService = require('../services/elasticsearch.service');
const QueryTranslationService = require('../services/query-translation.service');
const llmService = require('../services/llm.service');

// Cache for indices fields to avoid repeated fetches
let indicesFieldsCache = null;

/**
 * Get cached indices fields or fetch them if not cached
 * @returns {Promise<Object>} The indices fields
 */
async function getCachedIndicesFields() {
  if (!indicesFieldsCache) {
    indicesFieldsCache = elasticsearchService.getAllIndicesFields();
  }
  return indicesFieldsCache;
}

/**
 * Refresh the indices fields cache
 * @returns {Promise<Object>} The refreshed indices fields
 */
async function refreshIndicesFieldsCache() {
  indicesFieldsCache = elasticsearchService.getAllIndicesFields();
  return indicesFieldsCache;
}

// Execute a natural language query
exports.executeQuery = async (req, res) => {
  console.log("in executeQuery\n");
  try {
    const { query } = req.body;
    console.log("in executeQuery body "+ JSON.stringify(query));
    if (!query) {
      console.log("quey is empty")
      return res.status(400).json({ message: 'Query text is required' });
    }
    
    // Get cached indices fields
    const indicesFields = await getCachedIndicesFields();
    
    // Translate natural language query to Elasticsearch DSL using QueryTranslationService
    // Pass indices fields as extra data
    const translationResult = await QueryTranslationService.translateQuery(query, { indicesFields });
    const dslQuery = translationResult["elasticsearchQuery"];

    console.log("the elastecsearch query: " +JSON.stringify(dslQuery));
    
    // Execute the query
    const { results, executionTime, total } = await elasticsearchService.executeQuery(dslQuery);
    
    // Save query to history
    /*const queryRecord = new Query({
      user: req.user._id,
      text: query,
      translatedQuery: dslQueryString || JSON.stringify(dslQuery),
      resultCount: total,
      executionTime 
    });
    
    await queryRecord.save(); */
    
    res.json({
      query,
      translatedQuery: dslQueryString || JSON.stringify(dslQuery),
      results,
      executionTime,
      total,
      translationSource: rest.source // indicate if CrewAI or original LLM was used
    });
  } catch (error) {
    res.status(500).json({ message: 'Error executing query', error: error.message });
  }
};

// Get query history for current user
exports.getQueryHistory = async (req, res) => {
  try {
    const queries = await Query.find({ user: req.user._id })
      .sort({ timestamp: -1 })
      .limit(20);
    
    res.json(queries);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching query history', error: error.message });
  }
};

// Save a query
exports.saveQuery = async (req, res) => {
  try {
    const { name, query } = req.body;
    
    if (!name || !query) {
      return res.status(400).json({ message: 'Name and query text are required' });
    }
    
    // Translate query to get DSL representation using LLM service
    const { dslQueryString } = await llmService.translateQuery(query, req.user._id);
    
    const savedQuery = new SavedQuery({
      user: req.user._id,
      name,
      text: query,
      translatedQuery: dslQueryString
    });
    
    await savedQuery.save();
    
    res.status(201).json(savedQuery);
  } catch (error) {
    res.status(500).json({ message: 'Error saving query', error: error.message });
  }
};

// Get saved queries for current user
exports.getSavedQueries = async (req, res) => {
  try {
    const savedQueries = await SavedQuery.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    
    res.json(savedQueries);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching saved queries', error: error.message });
  }
};

// Delete a saved query
exports.deleteSavedQuery = async (req, res) => {
  try {
    const { id } = req.params;
    
    const savedQuery = await SavedQuery.findById(id);
    
    if (!savedQuery) {
      return res.status(404).json({ message: 'Saved query not found' });
    }
    
    // Check if the query belongs to the current user
    if (savedQuery.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this query' });
    }
    
    await SavedQuery.findByIdAndDelete(id);
    
    res.json({ message: 'Saved query deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting saved query', error: error.message });
  }
};

// Clear LLM context for current user
exports.clearContext = async (req, res) => {
  try {
    llmService.clearContext(req.user._id);
    res.json({ message: 'Context cleared successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error clearing context', error: error.message });
  }
};

// Refresh indices fields cache
exports.refreshIndicesFields = async (req, res) => {
  try {
    const refreshedFields = await refreshIndicesFieldsCache();
    res.json({ 
      message: 'Indices fields cache refreshed successfully',
      fieldsCount: Object.keys(refreshedFields).length
    });
  } catch (error) {
    res.status(500).json({ message: 'Error refreshing indices fields cache', error: error.message });
  }
};
