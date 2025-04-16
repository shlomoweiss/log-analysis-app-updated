const llmService = require('./llm.service');
const crewAIService = require('./crewai.service');
const config = require('../config/config');
const auditService = require('./audit.service');

/**
 * Service for translating natural language queries to Elasticsearch DSL
 */
class QueryTranslationService {
  constructor() {
    this.useCrewAI = process.env.USE_CREWAI === 'true';
  }

  /**
   * Translate a natural language query to Elasticsearch DSL
   * @param {string} naturalLanguageQuery - The natural language query to translate
   * @param {string} indexPattern - The Elasticsearch index pattern to search (default logs-*)
   * @param {Object|null} timeRange - The time range to search within
   * @param {Object} [extraData] - Optional extra data, e.g. { indicesFields }
   * @returns {Promise<Object>} - The translated Elasticsearch query
   */
  async translateQuery(
    naturalLanguageQuery,
    extraData = {},
    indexPattern = 'logs-*', 
    timeRange = null
    
  ) {
    console.log("in translateQuery before audit; the query is " +JSON.stringify(naturalLanguageQuery) )
    try {
      // Log the translation request
      /*await auditService.logAction("1", 'QUERY_TRANSLATION', {
        query: naturalLanguageQuery,
        indexPattern,
        timeRange
      });*/
      // Optionally use indicesFields or other extra data as needed:
      const indicesFields = extraData.indicesFields || null;

      // Debug print if indicesFields are provided
      if (indicesFields) {
        console.log(
          '[translateQuery] Received indicesFields keys:',
          Array.isArray(indicesFields)
            ? indicesFields.join(', ')
            : JSON.stringify(indicesFields)
        );
      }

      console.log("in translateQuery after autid")
      let result;
      
      // Use CrewAI if enabled, otherwise fall back to the original LLM service
      
      try {
          // Check if CrewAI service is healthy
          const healthStatus = await crewAIService.checkHealth();
          
          if (healthStatus.status === 'healthy') {
            console.log('Using CrewAI for query translation');
            // Pass indicesFields to CrewAI if available
            result = await crewAIService.translateQuery(
              naturalLanguageQuery,
              indicesFields
            );
            
            // Add source information to the result
            result.source = 'crewai';

            console.log("*****************************************************")
            console.log(JSON.stringify(result ))
            
            return result;
          } else {
            console.warn('CrewAI service is not healthy, falling back to original LLM service');
          }
        } catch (crewAIError) {
          console.error('Error using CrewAI service, falling back to original LLM service:', crewAIError);
        }
      
      
      
    } catch (error) {
      console.error('Error translating query:', error);
      throw new Error(`Failed to translate query: ${error.message}`);
    }
  }
}

module.exports = new QueryTranslationService();
