import React from 'react';
import { useSelector } from 'react-redux';

const ResultsTable = () => {
  const { results, loading } = useSelector(state => state.query);

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-center items-center h-40">
          <p className="text-gray-500">No results to display. Try executing a query.</p>
        </div>
      </div>
    );
  }

  // Get all unique keys from all result objects
  const allKeys = [...new Set(results.flatMap(result => Object.keys(result)))];
  
  return (
    <div className="bg-white shadow rounded-lg p-6 overflow-x-auto">
      <h2 className="text-xl font-semibold mb-4">Results ({results.length})</h2>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {allKeys.map(key => (
              <th 
                key={key}
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {results.map((result, index) => (
            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              {allKeys.map(key => (
                <td key={`${index}-${key}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {result[key] || ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ResultsTable;
