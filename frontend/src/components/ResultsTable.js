import React from 'react';
import { useSelector } from 'react-redux';
import { DataGrid } from '@mui/x-data-grid';

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

  // Flatten the data structure for all results
  const rows = results.map((result, index) => {
    const flattened = { id: index, ...result };
    
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

  // Generate columns configuration from the first row
  const columns = Object.keys(rows[0])
    .filter(key => key !== 'id') // Exclude the id field from display
    .map(field => ({
      field,
      headerName: field,
      flex: 1,
      minWidth: 150,
      renderCell: (params) => {
        const value = params.value;
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
      }
    }));

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Results ({results.length})</h2>
      <div style={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50, 100]}
          disableSelectionOnClick
          density="compact"
          autoHeight
        />
      </div>
    </div>
  );
};

export default ResultsTable;