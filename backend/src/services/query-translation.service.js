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
  async translateQuery(naturalLanguageQuery, userId, indexPattern = 'logs-*', timeRange = null) {
    try {
      // Log the translation request
      await auditService.logAction(userId, 'QUERY_TRANSLATION', {
        query: naturalLanguageQuery,
        indexPattern,
        timeRange
      });

      let result;
      
      // Use CrewAI if enabled, otherwise fall back to the original LLM service
      if (this.useCrewAI) {
        try {
          // Check if CrewAI service is healthy
          const healthStatus = await crewAIService.checkHealth();
          
          if (healthStatus.status === 'healthy') {
            console.log('Using CrewAI for query translation');
            
            // Additional context that might help with translation
            const additionalContext = {
              user_id: userId,
              common_services: ['payment', 'auth', 'user', 'order'],
              common_log_levels: ['ERROR', 'WARN', 'INFO', 'DEBUG']
            };
            
            result = await crewAIService.translateQuery(
              naturalLanguageQuery,
              indexPattern,
              timeRange,
              additionalContext
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
      }
      
      // Fall back to original LLM service
      console.log('Using original LLM service for query translation');
      result = await llmService.translateNaturalLanguageToElasticsearchDSL(
        naturalLanguageQuery,
        indexPattern,
        timeRange
      );
      
      // Add source information to the result
      result.source = 'original_llm';
      
      return result;
    } catch (error) {
      console.error('Error translating query:', error);
      throw new Error(`Failed to translate query: ${error.message}`);
    }
  }
}

module.exports = new QueryTranslationService();
