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
      total: response.hits.total.value,
      querySuccess: true,
      error: null
    };
  } catch (error) {
    console.error('Error executing Elasticsearch query:', error);
    // If there's an error, fall back to mock data
    return {results: [], executionTime: 0, total: 0, querySuccess: false, error: error.message};
  }
};

// Get context logs around a specific timestamp
exports.getLogContext = async (timestamp, service = null, limit = 5, index = 'logs-*') => {
  try {
    const health = await this.checkConnection();
    
    if (!health.connected) {
      return this.getMockContextResults(timestamp, service, limit);
    }
    console.log("ES getLogContext index name: " + index + " timestamp: " + timestamp + " service: " + service + " limit: " + limit);

    const startTime = Date.now();
    
    // Parse timestamp and ensure correct timezone handling
    const utcTimestamp = timestamp.endsWith('Z') ? timestamp : timestamp + 'Z';
    const targetTime = new Date(utcTimestamp);

    // Build base query parts that will be common to both queries
    const baseQuery = {
      size: limit,
      query: {
        bool: {
          must: []
        }
      }
    };

    // Add service filter if provided
    if (service) {
      baseQuery.query.bool.must.push({
        term: { service: service }
      });
    }

    // Query for logs before the target timestamp
    const beforeQuery = {
      ...baseQuery,
      sort: [{ "@timestamp": 'desc' }], // Sort descending to get most recent first
      query: {
        bool: {
          must: [
            ...baseQuery.query.bool.must,
            {
              range: {
                "@timestamp": {
                  lt: targetTime.toISOString()
                }
              }
            }
          ]
        }
      }
    };

    // Query for logs after the target timestamp
    const afterQuery = {
      ...baseQuery,
      sort: [{ "@timestamp": 'asc' }], // Sort ascending to get earliest first
      query: {
        bool: {
          must: [
            ...baseQuery.query.bool.must,
            {
              range: {
                "@timestamp": {
                  gt: targetTime.toISOString()
                }
              }
            }
          ]
        }
      }
    };

    // Query for the exact timestamp
    const exactQuery = {
      size: 1,
      sort: [{ "@timestamp": 'asc' }],
      query: {
        bool: {
          must: [
            ...baseQuery.query.bool.must,
            {
              term: {
                "@timestamp": targetTime.toISOString()
              }
            }
          ]
        }
      }
    };

    console.log("ES getLogContext queries:", {
      before: beforeQuery,
      exact: exactQuery,
      after: afterQuery
    });

    // Execute all three queries in parallel
    const [beforeResponse, exactResponse, afterResponse] = await Promise.all([
      client.search({ index, body: beforeQuery }),
      client.search({ index, body: exactQuery }),
      client.search({ index, body: afterQuery })
    ]);

    const endTime = Date.now();
    const executionTime = (endTime - startTime) / 1000;

    // Process results
    const beforeResults = beforeResponse.hits.hits.map(hit => ({
      ...hit._source,
      id: hit._id
    }));

    const exactResults = exactResponse.hits.hits.map(hit => ({
      ...hit._source,
      id: hit._id
    }));

    const afterResults = afterResponse.hits.hits.map(hit => ({
      ...hit._source,
      id: hit._id
    }));

    // Combine results in the correct order
    const contextResults = [
      ...beforeResults.reverse(), // Reverse to get chronological order
      ...exactResults,
      ...afterResults
    ];

    return {
      results: contextResults,
      executionTime,
      total: contextResults.length,
      querySuccess: true,
      error: null
    };
  } catch (error) {
    console.error('Error fetching log context:', error);
    return this.getMockContextResults(timestamp, service, limit);
  }
};

// Get mock context results
exports.getMockContextResults = (timestamp, service = null, limit = 5) => {
  const results = [];
  const targetTime = new Date(timestamp).getTime();
  
  // Generate mock logs before target time
  for (let i = limit; i > 0; i--) {
    results.push({
      timestamp: new Date(targetTime - 1000 * 60 * i).toISOString(),
      level: ['INFO', 'WARN', 'ERROR'][Math.floor(Math.random() * 3)],
      service: service || ['payment', 'auth', 'user', 'order'][Math.floor(Math.random() * 4)],
      message: `Sample log message ${i} before target time`
    });
  }

  // Add target log
  results.push({
    timestamp: new Date(targetTime).toISOString(),
    level: ['INFO', 'WARN', 'ERROR'][Math.floor(Math.random() * 3)],
    service: service || ['payment', 'auth', 'user', 'order'][Math.floor(Math.random() * 4)],
    message: 'Target log message'
  });

  // Generate mock logs after target time
  for (let i = 1; i <= limit; i++) {
    results.push({
      timestamp: new Date(targetTime + 1000 * 60 * i).toISOString(),
      level: ['INFO', 'WARN', 'ERROR'][Math.floor(Math.random() * 3)],
      service: service || ['payment', 'auth', 'user', 'order'][Math.floor(Math.random() * 4)],
      message: `Sample log message ${i} after target time`
    });
  }

  return {
    results,
    executionTime: 0.1,
    total: results.length,
    querySuccess: true,
    error: null
  };
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

/**
 * Get a summary of all fields (mappings) for all Elasticsearch indices,
 * returning the result as a JSON string.
 * @returns {Promise<string>} - A JSON string with index names as keys and their field mappings as values.
 */
exports.getAllIndicesFields = async () => {
  try {
    // Support both common Elasticsearch client response shapes
    const indicesResponse = await client.cat.indices({ format: 'json' });

    // Handle both modern and legacy response structures
    const indices = Array.isArray(indicesResponse.body)
      ? indicesResponse.body
      : Array.isArray(indicesResponse)
        ? indicesResponse
        : undefined;

    if (!indices) {
      throw new Error(
        "Elasticsearch .cat.indices did not return an array. Response: " +
        JSON.stringify(indicesResponse, null, 2)
      );
    }

    // Filter indices to only include those starting with "logs"
    const indexNames = indices
      .map(idx => idx.index)
      .filter(indexName => indexName.startsWith('.ds-logs'));

      console.log("log index name example: " + indexNames[0])

    const indexMappings = {};
    for (const indexName of indexNames) {
      try {
        const mappingResponse = await client.indices.getMapping({ index: indexName });
        const mappingObj = mappingResponse.body ?? mappingResponse;
        const mapping = mappingObj[indexName];
        const fields = mapping?.mappings?.properties || {};
        const fieldTypes = {};
        // Create an object with field names and their types
         // Add Elasticsearch metadata fields
         fieldTypes['_id'] = 'keyword';
         fieldTypes['_index'] = 'keyword';
         fieldTypes['_score'] = 'float';
         fieldTypes['_source'] = 'object';
         fieldTypes['_type'] = 'keyword';
        
        for (const [fieldName, fieldConfig] of Object.entries(fields)) {
          fieldTypes[fieldName] = fieldConfig.type || 'unknown';
        }
        
        indexMappings[indexName] = fieldTypes;
      } catch (err) {
        indexMappings[indexName] = { error: err.message };
      }
    }
    result = JSON.stringify(indexMappings);
    console.log("ES logs fields data with types = ", result);
    // Return the result as a JSON string
    return result;
  } catch (error) {
    console.error('Error fetching logs indices fields with types:', error);
    throw new Error(
      `Failed to retrieve fields and types for logs Elasticsearch indices: ${error?.message ?? error}`
    );
  }
};