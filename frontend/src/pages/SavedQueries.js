import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { saveQuery, fetchSavedQueries } from '../redux/slices/querySlice';

const SavedQueries = () => {
  const [queryName, setQueryName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState(null);
  
  const dispatch = useDispatch();
  const { currentQuery, savedQueries, translatedQuery, results, loading } = useSelector(state => state.query);

  useEffect(() => {
    dispatch(fetchSavedQueries());
  }, [dispatch]);

  const handleSave = (e) => {
    e.preventDefault();
    if (queryName.trim() && currentQuery.trim()) {
      dispatch(saveQuery({ 
        queryText: currentQuery, 
        name: queryName,
        translatedQuery: translatedQuery || JSON.stringify({}),
        total: results ? results.length : 0
      }));
      setQueryName('');
      setShowSaveForm(false);
    }
  };

  return (
    <div className="w-full">
      <div className="pb-5 border-b border-gray-200 flex justify-between items-center">
        <h1 className="text-2xl font-bold leading-tight text-gray-900">Saved Queries</h1>
        <button
          onClick={() => setShowSaveForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          disabled={!currentQuery.trim()}
        >
          Save Current Query
        </button>
      </div>
      
      <div className="mt-6 bg-white shadow rounded-lg p-6 w-full">
        {loading ? (
          <div className="text-center py-10">
            <p className="text-gray-500">Loading saved queries...</p>
          </div>
        ) : savedQueries.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">No saved queries yet. Save a query to see it here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Query Text
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Translation
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {savedQueries.map((query) => (
                  <tr key={query._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {query.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="max-w-xs truncate">
                        {query.text}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="max-w-xs truncate">
                        {(query.translatedQuery || '').replace(/&quot;/g, '"')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(query.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => setSelectedQuery(query)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Save Query Form Modal */}
      {showSaveForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
            <h2 className="text-lg font-medium mb-4">Save Query</h2>
            <form onSubmit={handleSave}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="queryName">
                  Query Name
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="queryName"
                  type="text"
                  placeholder="Enter a name for this query"
                  value={queryName}
                  onChange={(e) => setQueryName(e.target.value)}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="queryText">
                  Query Text
                </label>
                <textarea
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="queryText"
                  rows="3"
                  readOnly
                  value={currentQuery}
                ></textarea>
              </div>
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  className="mr-4 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  onClick={() => setShowSaveForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  disabled={!queryName.trim()}
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {selectedQuery && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">{selectedQuery.name}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Query Text
                </label>
                <div className="bg-gray-100 p-3 rounded">
                  {selectedQuery.text}
                </div>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Query Translation
                </label>
                <div className="bg-gray-100 p-3 rounded overflow-auto max-h-48">
                  <pre className="whitespace-pre-wrap">
                    {(selectedQuery.translatedQuery || '').replace(/&quot;/g, '"')}
                  </pre>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setSelectedQuery(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedQueries;
