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
   * @param {string} userId - The ID of the user making the query
   * @param {string} indexPattern - The Elasticsearch index pattern to search
   * @param {Object} timeRange - The time range to search within
   * @returns {Promise<Object>} - The translated Elasticsearch query
   */
  async translateQuery(naturalLanguageQuery,indexPattern = 'logs-*', timeRange = null) {
    console.log("in translateQuery befor autid ant the query is " +JSON.stringify(naturalLanguageQuery) )
    try {
      // Log the translation request
      await auditService.logAction("1", 'QUERY_TRANSLATION', {
        query: naturalLanguageQuery,
        indexPattern,
        timeRange
      });
      console.log("in translateQuery after autid")
      let result;
      
      // Use CrewAI if enabled, otherwise fall back to the original LLM service
      
        try {
          // Check if CrewAI service is healthy
          const healthStatus = await crewAIService.checkHealth();
          
          if (healthStatus.status === 'healthy') {
            console.log('Using CrewAI for query translation');
            
           
            
            result = await crewAIService.translateQuery(
              naturalLanguageQuery,
            );
            
            // Add source information to the result
            result.source = 'crewai';
            
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
