import React, { useState } from 'react';
import { useSelector } from 'react-redux';

const ResultsTable = () => {
  const { results, loading } = useSelector(state => state.query);
  const [expandedRows, setExpandedRows] = useState({});
  
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
  
  // Flatten the data structure for all results
  const flattenedResults = results.map(result => {
    const flattened = { ...result };
    
    // Handle _source specifically since it contains most of the nested data
    if (result._source) {
      Object.entries(result._source).forEach(([key, value]) => {
        if (typeof value !== 'object' || value === null) {
          flattened[`source.${key}`] = value;
        } else {
          // Handle nested objects within source
          Object.entries(value).forEach(([nestedKey, nestedValue]) => {
            flattened[`source.${key}.${nestedKey}`] = nestedValue;
          });
        }
      });
      // Remove the original _source to avoid duplication
      delete flattened._source;
    }
    
    return flattened;
  });
  
  // Get all unique keys from all flattened result objects
  const allKeys = [...new Set(flattenedResults.flatMap(result => Object.keys(result)))];
  
  // Group keys by their prefix for better organization
  const groupedKeys = allKeys.reduce((groups, key) => {
    const prefix = key.split('.')[0];
    if (!groups[prefix]) {
      groups[prefix] = [];
    }
    groups[prefix].push(key);
    return groups;
  }, {});
  
  // Function to safely render cell content
  const renderCellContent = (value) => {
    if (value === null || value === undefined) {
      return '';
    }
    
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch (e) {
        return '[Object]';
      }
    }
    
    return String(value);
  };
  
  // Toggle expanded state for a group
  const toggleGroup = (prefix) => {
    setExpandedRows({
      ...expandedRows,
      [prefix]: !expandedRows[prefix]
    });
  };
  
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Results ({results.length})</h2>
      <div className="overflow-x-auto max-w-full">
        <table className="min-w-full divide-y divide-gray-200 table-fixed">
          <thead className="bg-gray-50">
            <tr>
              {/* Render grouped headers */}
              {Object.keys(groupedKeys).map(prefix => (
                <th
                  key={prefix}
                  onClick={() => toggleGroup(prefix)}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  colSpan={expandedRows[prefix] ? groupedKeys[prefix].length : 1}
                >
                  {prefix} {expandedRows[prefix] ? '▼' : '►'}
                </th>
              ))}
            </tr>
            {/* Render subheaders when expanded */}
            <tr>
              {Object.entries(groupedKeys).flatMap(([prefix, keys]) => 
                expandedRows[prefix] 
                  ? keys.map(key => (
                      <th
                        key={key}
                        className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                      >
                        {key.replace(`${prefix}.`, '')}
                      </th>
                    ))
                  : [<th key={`${prefix}-placeholder`} className="hidden"></th>]
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {flattenedResults.map((result, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {Object.entries(groupedKeys).flatMap(([prefix, keys]) => 
                  expandedRows[prefix] 
                    ? keys.map(key => (
                        <td 
                          key={`${rowIndex}-${key}`} 
                          className="px-4 py-2 text-sm text-gray-500 border-r border-gray-200 overflow-hidden text-ellipsis"
                          title={renderCellContent(result[key])}
                        >
                          {renderCellContent(result[key])}
                        </td>
                      ))
                    : [
                        <td 
                          key={`${rowIndex}-${prefix}-collapsed`} 
                          className="px-4 py-2 text-sm text-gray-500 border-r border-gray-200"
                        >
                          {keys.some(key => result[key]) ? '...' : ''}
                        </td>
                      ]
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Add tooltip to explain the interaction */}
      <div className="mt-4 text-sm text-gray-500">
        <p>Click on column group headers to expand/collapse sections</p>
      </div>
    </div>
  );
};

export default ResultsTable;