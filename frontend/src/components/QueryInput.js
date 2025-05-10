import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { executeQuery, executeTranslatedQuery, setCurrentQuery, clearResults } from '../redux/slices/querySlice';

const QueryInput = () => {
  const dispatch = useDispatch();
  const { currentQuery, loading, translatedQuery, executionTime } = useSelector(state => state.query);
  const [showTranslation, setShowTranslation] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (currentQuery.trim()) {
      dispatch(executeQuery(currentQuery));
    }
  };

  const handleClear = () => {
    dispatch(setCurrentQuery(''));
    dispatch(clearResults());
    console.log('Cleared current query and results');
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Natural Language Query</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <textarea
            className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:shadow-outline"
            rows="3"
            placeholder="Enter your query in natural language (e.g., 'Show me all error logs from the payment service in the last 24 hours')"
            value={currentQuery}
            onChange={(e) => dispatch(setCurrentQuery(e.target.value))}
          ></textarea>
        </div>
        <div className="flex justify-between">
          <div>
            <button
              type="submit"
             
              className='ml-2 px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 font-medium'
            >
              {loading ? 'Executing...' : 'Execute Query'}
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="ml-2 px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 font-medium"
            >
              Clear
            </button>
          </div>
          {translatedQuery && (
            <button
              type="button"
              onClick={() => setShowTranslation(!showTranslation)}
              className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 font-medium"
            >
              {showTranslation ? 'Hide Translation' : 'Show Translation'}
            </button>
          )}
        </div>
      </form>
        {showTranslation && translatedQuery && (
        <div className="mt-4 p-3 bg-gray-100 rounded-md">
          <h3 className="text-sm font-semibold text-gray-700">Translated Elasticsearch Query:</h3>
          <textarea
            className="mt-1 w-full px-3 py-2 text-sm font-mono text-gray-600 border rounded-lg focus:outline-none focus:shadow-outline"
            rows="5"
            value={translatedQuery}
            onChange={(e) => dispatch({ type: 'query/setTranslatedQuery', payload: e.target.value })}
          />
          <div className="mt-2 flex justify-between items-center">
            <p className="text-xs text-gray-500">Execution time: {executionTime} seconds</p>
            <button
              onClick={() => dispatch(executeTranslatedQuery({ queryText: currentQuery, translatedQuery }))}
              className="px-3 py-1 text-sm rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 font-medium"
            >
              Execute Translated Query
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueryInput;
