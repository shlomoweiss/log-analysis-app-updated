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
    const { query, translatedQuery } = req.body;
    console.log("in executeQuery body "+ JSON.stringify(query));
    if (!query) {
      console.log("query is empty")
      return res.status(400).json({ message: 'Query text is required' });
    }

    let results = [];
    let executionTime = 0;
    let total = 0;
    let querySuccess = false;
    let error = null;
    let dslQuery;

    // If we have a pre-translated query, use it directly
    if (translatedQuery) {
      try {
        dslQuery = JSON.parse(translatedQuery.replace(/&quot;/g, '"'));
        const response = await elasticsearchService.executeQuery(dslQuery);
        results = response.results;
        executionTime = response.executionTime;
        total = response.total;
        querySuccess = response.querySuccess;
        error = response.error;
      } catch (parseError) {
        console.error('Error parsing translated query:', parseError);
        // If parsing fails, fall back to normal translation
        dslQuery = null;
      }
    }

    // If no translated query or parsing failed, use normal translation process
    if (!dslQuery) {
      // Get cached indices fields
      const indicesFields = await getCachedIndicesFields();
      
      // Translate natural language query to Elasticsearch DSL using QueryTranslationService
      // Pass indices fields as extra data
      console.log("in executeQuery indicesFields: " + JSON.stringify(indicesFields));
      var translationResult = await QueryTranslationService.translateQuery(query, { indicesFields });
      dslQuery = translationResult["elasticsearchQuery"];

      console.log("the elasticsearch query: " + JSON.stringify(dslQuery));
      
      // Execute the query
      var response = await elasticsearchService.executeQuery(dslQuery);
      results = response.results;
      executionTime = response.executionTime;
      total = response.total;
      querySuccess = response.querySuccess;
      error = response.error;

      if (!querySuccess) {
        console.log("query failed trying to fix it");
        translationResult = await QueryTranslationService.FixQuery(dslQuery, indicesFields, error);
        dslQuery = translationResult["elasticsearchQuery"];
        response = await elasticsearchService.executeQuery(dslQuery);
        results = response.results;
        executionTime = response.executionTime;
        total = response.total;
        querySuccess = response.querySuccess;
        error = response.error;
      }
    }

    const qresult = {
      query,
      translatedQuery: JSON.stringify(dslQuery),
      results,
      executionTime,
      total,
      translationSource: res.source // indicate if CrewAI or original LLM was used
    };

    console.log(JSON.stringify(qresult));
    
    res.json(qresult);
  } catch (error) {
    console.log("got error !!! =" + error.message);
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
    const { name, query, translatedQuery, total } = req.body;
    
    if (!name || !query || !translatedQuery) {
      return res.status(400).json({ message: 'Name, query text, and translated query are required' });
    }
    
    const savedQuery = new SavedQuery({
      name,
      text: query,
      translatedQuery,
      resultCount: total || 0
    });
    
    await savedQuery.save();
    
    res.status(201).json(savedQuery);
  } catch (error) {
    res.status(500).json({ message: 'Error saving query', error: error.message });
  }
};

// Get all saved queries
exports.getSavedQueries = async (req, res) => {
  try {
    const savedQueries = await SavedQuery.find()
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
    
    await SavedQuery.findByIdAndDelete(id);
    
    res.json({ message: 'Saved query deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting saved query', error: error.message });
  }
};
