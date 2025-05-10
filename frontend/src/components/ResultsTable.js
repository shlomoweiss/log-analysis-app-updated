import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { DataGrid } from '@mui/x-data-grid';
import { setSelectedLog, fetchLogContext } from '../redux/slices/querySlice';

const ResultsTable = ({ isContext, results: contextResults }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { results, loading } = useSelector(state => state.query);
  
  // Use context results if provided, otherwise use regular results
  const displayResults = isContext ? contextResults : results;

  const handleRowClick = (params) => {
    const row = params.row;
    if (!row) return;

    // Get timestamp from any available source in the row data
    const timestamp = row['@timestamp'] || row['source.@timestamp'] || row.timestamp || row['source.timestamp'];
    if (!timestamp) {
      console.error('No timestamp found in row data:', row);
      return;
    }

    // The row data contains all the flattened fields, so we need to construct the original log format
    const selectedLog = {
      timestamp,
      level: row.level || row['source.level'],
      service: row.service || row['source.service'],
      message: row.message || row['source.message'],
      id: row.id
    };

    // Only navigate to context page if this is not already the context view
    if (!isContext) {
      dispatch(setSelectedLog(selectedLog));
      dispatch(fetchLogContext(selectedLog.timestamp));
      navigate(`/log-context/${row.id}`);
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!displayResults || displayResults.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-center items-center h-40">
          <p className="text-gray-500">No results to display. Try executing a query.</p>
        </div>
      </div>
    );
  }

  // Flatten the data structure for all results
  const rows = displayResults.map((result, index) => {
    // First try to get fields from the top level, then from _source
    const flattened = { 
      id: index,
      '@timestamp': result['@timestamp'] || (result._source && result._source['@timestamp']) || '',
      timestamp: result.timestamp || (result._source && result._source.timestamp) || '',
      level: result.level || (result._source && result._source.level) || '',
      service: result.service || (result._source && result._source.service) || '',
      message: result.message || (result._source && result._source.message) || '',
    };

    // Add any additional fields from _source
    if (result._source) {
      Object.entries(result._source).forEach(([key, value]) => {
        if (!flattened[key] && (typeof value !== 'object' || value === null)) {
          flattened[`source.${key}`] = value;
        } else if (typeof value === 'object' && value !== null) {
          // Handle nested objects
          Object.entries(value).forEach(([nestedKey, nestedValue]) => {
            if (typeof nestedValue !== 'object' || nestedValue === null) {
              flattened[`source.${key}.${nestedKey}`] = nestedValue;
            }
          });
        }
      });
    }
    
    return flattened;
  });

  // Define the columns for DataGrid
  const columns = [
    { field: '@timestamp', headerName: 'Timestamp', flex: 1, minWidth: 200 },
    { field: 'level', headerName: 'Level', width: 120 },
    { field: 'service', headerName: 'Service', width: 150 },
    { field: 'message', headerName: 'Message', flex: 2, minWidth: 300 }
  ];

  return (
    <div className={isContext ? '' : 'bg-white shadow rounded-lg p-6'}>
      {!isContext && <h2 className="text-xl font-semibold mb-4">Results ({displayResults.length})</h2>}
      <div style={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50, 100]}
          onRowClick={handleRowClick}
          sx={{
            '.MuiDataGrid-row': {
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
            },
            // Highlight the selected log in context view
            ...(isContext && {
              '.MuiDataGrid-row.Mui-selected': {
                backgroundColor: '#bfdbfe !important',
              }
            })
          }}
          density="compact"
          autoHeight
        />
      </div>
    </div>
  );
};

export default ResultsTable;