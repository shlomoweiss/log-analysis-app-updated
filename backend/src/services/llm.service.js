const axios = require('axios');
const config = require('../config/config');

// This service simulates the CrueAI framework integration for LLM query translation
class LLMService {
  constructor() {
    // In a real implementation, this would be the API endpoint for the LLM service
    this.apiEndpoint = process.env.LLM_API_ENDPOINT || 'https://api.crueai.com/v1/completions';
    this.apiKey = process.env.LLM_API_KEY || 'demo-key';
    
    // Context handling for multi-turn queries
    this.contextWindow = {};
  }
  
  // Translate natural language to Elasticsearch DSL using LLM
  async translateQuery(naturalLanguageQuery, userId) {
    try {
      // In a real implementation, this would call the LLM API
      // For now, we'll implement a sophisticated mock version
      
      console.log(`Translating query for user ${userId}: ${naturalLanguageQuery}`);
      
      // Check if we have context for this user
      const userContext = this.contextWindow[userId] || [];
      
      // Add the current query to context
      userContext.push({ role: 'user', content: naturalLanguageQuery });
      
      // Prepare the prompt for the LLM
      const prompt = this.buildPrompt(userContext);
      
      // In a real implementation, this would be an API call
      // const response = await axios.post(this.apiEndpoint, {
      //   model: 'crueai-query-translator',
      //   prompt: prompt,
      //   max_tokens: 500,
      //   temperature: 0.3,
      //   api_key: this.apiKey
      // });
      
      // For now, we'll use our rule-based translation
      const dslQuery = this.ruleBasedTranslation(naturalLanguageQuery);
      
      // Add the response to context
      userContext.push({ role: 'assistant', content: JSON.stringify(dslQuery) });
      
      // Limit context window to last 10 exchanges
      if (userContext.length > 20) {
        userContext.splice(0, 2); // Remove oldest exchange
      }
      
      // Update context window
      this.contextWindow[userId] = userContext;
      
      return {
        dslQuery: dslQuery,
        dslQueryString: JSON.stringify(dslQuery, null, 2)
      };
    } catch (error) {
      console.error('Error in LLM translation:', error);
      throw new Error('Failed to translate natural language query');
    }
  }
  
  // Build prompt for the LLM
  buildPrompt(context) {
    return `
You are an expert in translating natural language queries into Elasticsearch DSL queries.
Your task is to convert the following natural language query into a valid Elasticsearch DSL query.
Focus on extracting time ranges, log levels, service names, and message content.

Previous conversation:
${context.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Respond only with the Elasticsearch DSL query in JSON format.
`;
  }
  
  // Rule-based translation (mock LLM functionality)
  ruleBasedTranslation(naturalLanguageQuery) {
    // Parse time range
    let timeRange = '24h';
    if (naturalLanguageQuery.match(/last\s+hour|past\s+hour|recent\s+hour/i)) {
      timeRange = '1h';
    } else if (naturalLanguageQuery.match(/last\s+6\s+hours|past\s+6\s+hours/i)) {
      timeRange = '6h';
    } else if (naturalLanguageQuery.match(/last\s+12\s+hours|past\s+12\s+hours/i)) {
      timeRange = '12h';
    } else if (naturalLanguageQuery.match(/last\s+day|past\s+day|last\s+24\s+hours|past\s+24\s+hours/i)) {
      timeRange = '24h';
    } else if (naturalLanguageQuery.match(/last\s+week|past\s+week/i)) {
      timeRange = '7d';
    } else if (naturalLanguageQuery.match(/last\s+month|past\s+month/i)) {
      timeRange = '30d';
    }
    
    // Parse log level
    let logLevel = null;
    if (naturalLanguageQuery.match(/\berror\b|\berrors\b/i)) {
      logLevel = 'ERROR';
    } else if (naturalLanguageQuery.match(/\bwarn\b|\bwarning\b|\bwarnings\b/i)) {
      logLevel = 'WARN';
    } else if (naturalLanguageQuery.match(/\binfo\b|\binformation\b/i)) {
      logLevel = 'INFO';
    } else if (naturalLanguageQuery.match(/\bdebug\b/i)) {
      logLevel = 'DEBUG';
    }
    
    // Parse service name
    let service = null;
    if (naturalLanguageQuery.match(/payment(\s+service)?/i)) {
      service = 'payment';
    } else if (naturalLanguageQuery.match(/user(\s+service)?/i)) {
      service = 'user';
    } else if (naturalLanguageQuery.match(/auth(\s+service)?|authentication(\s+service)?/i)) {
      service = 'auth';
    } else if (naturalLanguageQuery.match(/order(\s+service)?/i)) {
      service = 'order';
    }
    
    // Parse for specific message content
    let messageContent = null;
    const messageMatch = naturalLanguageQuery.match(/containing\s+"([^"]+)"|with\s+"([^"]+)"|message\s+"([^"]+)"/i);
    if (messageMatch) {
      messageContent = messageMatch[1] || messageMatch[2] || messageMatch[3];
    }
    
    // Build Elasticsearch DSL query
    const dslQuery = {
      bool: {
        must: []
      }
    };
    
    // Add time range
    dslQuery.bool.must.push({
      range: {
        '@timestamp': {
          gte: `now-${timeRange}`,
          lte: 'now'
        }
      }
    });
    
    // Add log level if specified
    if (logLevel) {
      dslQuery.bool.must.push({
        match: {
          level: logLevel
        }
      });
    }
    
    // Add service if specified
    if (service) {
      dslQuery.bool.must.push({
        match: {
          service: service
        }
      });
    }
    
    // Add message content if specified
    if (messageContent) {
      dslQuery.bool.must.push({
        match_phrase: {
          message: messageContent
        }
      });
    }
    
    return dslQuery;
  }
  
  // Clear context for a user
  clearContext(userId) {
    delete this.contextWindow[userId];
  }
}

module.exports = new LLMService();
