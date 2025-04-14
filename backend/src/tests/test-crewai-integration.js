const assert = require('assert');
const queryTranslationService = require('../services/query-translation.service');

/**
 * Test script for the query translation service with CrewAI integration
 */
async function testQueryTranslation() {
  console.log('Testing Query Translation Service with CrewAI integration...');
  
  // Test queries
  const testQueries = [
    {
      query: 'Show me all error logs from the payment service in the last 24 hours',
      expectedFields: ['query', 'bool', 'must', 'match', 'range', '@timestamp', 'payment', 'ERROR']
    },
    {
      query: 'Find warning messages in the authentication service from the past week',
      expectedFields: ['query', 'bool', 'must', 'match', 'range', '@timestamp', 'auth', 'WARN']
    },
    {
      query: 'Display logs containing database connection issues in the last hour',
      expectedFields: ['query', 'bool', 'must', 'match', 'range', '@timestamp', 'database', 'connection']
    }
  ];
  
  // Mock user ID for testing
  const userId = 'test-user-123';
  
  // Enable CrewAI for testing
  process.env.USE_CREWAI = 'true';
  
  // Run tests for each query
  for (const testCase of testQueries) {
    try {
      console.log(`\nTesting query: "${testCase.query}"`);
      
      // Translate the query
      const result = await queryTranslationService.translateQuery(
        testCase.query,
        userId,
        'logs-*',
        { gte: 'now-24h', lte: 'now' }
      );
      
      console.log('Translation result:');
      console.log(JSON.stringify(result, null, 2));
      
      // Verify the result has the expected structure
      assert(result.elasticsearchQuery, 'Result should contain an Elasticsearch query');
      assert(result.source, 'Result should indicate the source of translation');
      
      // Check if the result contains expected fields
      const resultStr = JSON.stringify(result);
      for (const field of testCase.expectedFields) {
        assert(
          resultStr.includes(field),
          `Result should contain the field or term "${field}"`
        );
      }
      
      console.log(`✅ Test passed for query: "${testCase.query}"`);
    } catch (error) {
      console.error(`❌ Test failed for query: "${testCase.query}"`);
      console.error('Error:', error.message);
    }
  }
  
  // Test fallback to original LLM service
  try {
    console.log('\nTesting fallback to original LLM service...');
    
    // Temporarily set an invalid CrewAI connector URL to force fallback
    const originalUrl = process.env.CREWAI_CONNECTOR_URL;
    process.env.CREWAI_CONNECTOR_URL = 'http://invalid-url:9999';
    
    const result = await queryTranslationService.translateQuery(
      'Show me all error logs',
      userId
    );
    
    // Restore the original URL
    process.env.CREWAI_CONNECTOR_URL = originalUrl;
    
    assert(result.source === 'original_llm', 'Result should indicate fallback to original LLM');
    console.log('✅ Fallback test passed');
  } catch (error) {
    console.error('❌ Fallback test failed');
    console.error('Error:', error.message);
  }
  
  console.log('\nAll tests completed.');
}

// Run the tests
testQueryTranslation().catch(console.error);
