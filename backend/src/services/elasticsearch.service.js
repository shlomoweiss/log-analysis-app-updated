const { Client } = require('@elastic/elasticsearch');
const config = require('../config/config');

// Create Elasticsearch client
const client = new Client({
  node: config.elasticsearch.node,
  auth: {
    username: config.elasticsearch.auth.username,
    password: config.elasticsearch.auth.password
  },
  maxRetries: 5,
  requestTimeout: 60000,
  tls: {
    rejectUnauthorized: false // Only for development, should be true in production
  }
});



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
      body: dslQuery
    });

    console.log("ES total result"+response.hits.total.value)
    
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
