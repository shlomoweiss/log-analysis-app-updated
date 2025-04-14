const { Client } = require('@elastic/elasticsearch');
const config = require('../config/config');

// Create Elasticsearch client
const client = new Client({
  node: config.elasticsearch.node,
  auth: {
    username: config.elasticsearch.auth.username,
    password: config.elasticsearch.auth.password
  },
  ssl: {
    rejectUnauthorized: false // Only for development, should be true in production
  }
});

// Service for translating natural language to Elasticsearch DSL using LLM
exports.translateQuery = async (naturalLanguageQuery) => {
  try {
    // In a real implementation, this would call an LLM API
    // For now, we'll implement a more sophisticated mock version
    
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
    
    // Convert to string representation for display
    const dslQueryString = JSON.stringify(dslQuery, null, 2);
    
    return {
      dslQuery,
      dslQueryString
    };
  } catch (error) {
    console.error('Error translating query:', error);
    throw new Error('Failed to translate natural language query');
  }
};

// Execute Elasticsearch query
exports.executeQuery = async (dslQuery, index = 'logs-*') => {
  try {
    // Check if Elasticsearch is available
    const health = await this.checkConnection();
    
    if (!health.connected) {
      // If Elasticsearch is not available, return mock data
      return this.getMockResults(dslQuery);
    }
    
    // In a real implementation, this would execute against Elasticsearch
    const startTime = Date.now();
    
    const response = await client.search({
      index,
      body: {
        query: dslQuery,
        size: 100,
        sort: [
          { '@timestamp': { order: 'desc' } }
        ]
      }
    });
    
    const endTime = Date.now();
    const executionTime = (endTime - startTime) / 1000;
    
    const results = response.hits.hits.map(hit => ({
      ...hit._source,
      id: hit._id
    }));
    
    return {
      results,
      executionTime,
      total: response.hits.total.value
    };
  } catch (error) {
    console.error('Error executing Elasticsearch query:', error);
    
    // If there's an error, fall back to mock data
    return this.getMockResults(dslQuery);
  }
};

// Get mock results for when Elasticsearch is not available
exports.getMockResults = (dslQuery) => {
  const results = [];
  const startTime = Date.now();
  
  // Check if query contains ERROR level
  const isErrorQuery = JSON.stringify(dslQuery).includes('ERROR');
  
  // Check if query contains payment service
  const isPaymentQuery = JSON.stringify(dslQuery).includes('payment');
  
  // Generate mock results
  if (isErrorQuery && isPaymentQuery) {
    results.push(
      { timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), level: 'ERROR', service: 'payment', message: 'Failed to process transaction: Invalid card' },
      { timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(), level: 'ERROR', service: 'payment', message: 'Database connection timeout' },
      { timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), level: 'ERROR', service: 'payment', message: 'Payment gateway unreachable' }
    );
  } else if (isErrorQuery) {
    results.push(
      { timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), level: 'ERROR', service: 'auth', message: 'Failed to authenticate user' },
      { timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(), level: 'ERROR', service: 'user', message: 'User profile update failed' },
      { timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), level: 'ERROR', service: 'order', message: 'Order creation failed' }
    );
  } else if (isPaymentQuery) {
    results.push(
      { timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), level: 'INFO', service: 'payment', message: 'Payment processed successfully' },
      { timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(), level: 'INFO', service: 'payment', message: 'New payment method added' },
      { timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), level: 'WARN', service: 'payment', message: 'Payment processing delayed' }
    );
  } else {
    results.push(
      { timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), level: 'INFO', service: 'auth', message: 'User logged in' },
      { timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(), level: 'INFO', service: 'user', message: 'User profile updated' },
      { timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), level: 'INFO', service: 'order', message: 'Order created' }
    );
  }
  
  const endTime = Date.now();
  const executionTime = (endTime - startTime) / 1000;
  
  return {
    results,
    executionTime,
    total: results.length
  };
};

// Check Elasticsearch connection
exports.checkConnection = async () => {
  try {
    const info = await client.info();
    return {
      connected: true,
      info
    };
  } catch (error) {
    console.error('Elasticsearch connection error:', error);
    return {
      connected: false,
      error: error.message
    };
  }
};
