import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchLogContext } from '../redux/slices/querySlice';
import ResultsTable from '../components/ResultsTable';

const LogContext = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const [upperLimit, setUpperLimit] = useState(5);
  const [lowerLimit, setLowerLimit] = useState(5);
  const { 
    contextResults, 
    selectedLog,
    contextLoading,
    contextError,
    results 
  } = useSelector(state => state.query);

  useEffect(() => {
    // If we have the ID but no selected log, try to recover it from results
    if (id && !selectedLog && results.length > 0) {
      const recoveredLog = results[parseInt(id)];
      if (recoveredLog) {
        dispatch(fetchLogContext(recoveredLog.timestamp, undefined, upperLimit, lowerLimit));
      }
    }
  }, [id, selectedLog, results, dispatch, upperLimit, lowerLimit]);

  const handleLimitChange = (type, value) => {
    const numValue = parseInt(value) || 0;
    if (type === 'upper') {
      setUpperLimit(numValue);
      if (selectedLog) {
        dispatch(fetchLogContext(selectedLog.timestamp, undefined, numValue, lowerLimit));
      }
    } else {
      setLowerLimit(numValue);
      if (selectedLog) {
        dispatch(fetchLogContext(selectedLog.timestamp, undefined, upperLimit, numValue));
      }
    }
  };

  if (contextLoading) {
    return (
      <div className="w-full">
        <div className="pb-5 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold leading-tight text-gray-900">Log Context</h1>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Back
            </button>
          </div>
        </div>
        <div className="mt-6 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (contextError) {
    return (
      <div className="w-full">
        <div className="pb-5 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold leading-tight text-gray-900">Log Context</h1>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Back
            </button>
          </div>
        </div>
        <div className="mt-6">
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{contextError}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="pb-5 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold leading-tight text-gray-900">Log Context</h1>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Back
          </button>
        </div>
      </div>
      
      <div className="mt-6">
        <div className="flex gap-4 mb-4">
          <div className="flex items-center">
            <label htmlFor="upperLimit" className="mr-2 text-sm font-medium text-gray-700">
              Upper Limit:
            </label>
            <input
              type="number"
              id="upperLimit"
              min="1"
              max="50"
              value={upperLimit}
              onChange={(e) => handleLimitChange('upper', e.target.value)}
              className="w-20 px-2 py-1 border border-gray-300 rounded-md"
            />
          </div>
          <div className="flex items-center">
            <label htmlFor="lowerLimit" className="mr-2 text-sm font-medium text-gray-700">
              Lower Limit:
            </label>
            <input
              type="number"
              id="lowerLimit"
              min="1"
              max="50"
              value={lowerLimit}
              onChange={(e) => handleLimitChange('lower', e.target.value)}
              className="w-20 px-2 py-1 border border-gray-300 rounded-md"
            />
          </div>
        </div>

        {selectedLog && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-blue-700">Selected Log Entry</p>
                <p className="mt-1 text-sm text-gray-600">
                  {new Date(selectedLog.timestamp).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center">
                <span className={`px-2 py-1 text-sm rounded-full ${
                  selectedLog.level === 'ERROR' ? 'bg-red-100 text-red-800' :
                  selectedLog.level === 'WARN' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {selectedLog.level}
                </span>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-900">{selectedLog.message}</p>
          </div>
        )}
        
        {contextResults && contextResults.length > 0 && (
          <div className="bg-white shadow rounded-lg">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Context Logs</h2>
              <ResultsTable isContext results={contextResults} loading={contextLoading} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogContext;
