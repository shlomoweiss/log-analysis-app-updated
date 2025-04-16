const axios = require('axios');
const config = require('../config/config');

/**
 * Service for translating natural language queries to Elasticsearch DSL using CrewAI
 */
class CrewAIService {
  constructor() {
    this.crewAIConnectorUrl = process.env.CREWAI_CONNECTOR_URL || 'http://localhost:8001';
  }

  /**
   * Translate a natural language query to Elasticsearch DSL using CrewAI
   * @param {string} naturalLanguageQuery - The natural language query to translate
   * @param {string} indexPattern - The Elasticsearch index pattern to search
   * @param {Object} timeRange - The time range to search within
   * @param {Object} indicesFields - The indices fields to send as additional context
   * @returns {Promise<Object>} - The translated Elasticsearch query and metadata
   */
  async translateQuery(naturalLanguageQuery, indexPattern = 'logs-*', timeRange = null, indicesFields = null) {
    try {
      // Compose the additional_context with indicesFields
      const additionalContext = {
        ...(indicesFields ? { indicesFields } : {})
      };

      const response = await axios.post(`${this.crewAIConnectorUrl}/proxy-query`, {
        natural_language_query: naturalLanguageQuery,
        index_pattern: indexPattern,
        time_range: timeRange,
        additional_context: additionalContext
      });

      return {
        elasticsearchQuery: response.data.elasticsearch_query,
      };
    } catch (error) {
      console.error('Error translating query with CrewAI:', error);
      throw new Error(`Failed to translate query with CrewAI: ${error.message}`);
    }
  }

  /**
   * Check the health of the CrewAI service
   * @returns {Promise<Object>} - The health status of the CrewAI service
   */
  async checkHealth() {
    try {
      const response = await axios.get(`${this.crewAIConnectorUrl}/health`);
      return response.data;
    } catch (error) {
      console.error('Error checking CrewAI service health:', error);
      return {
        status: 'unavailable',
        error: error.message
      };
    }
  }
}

module.exports = new CrewAIService();
