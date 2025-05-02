import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';

const ResultsTable = () => {
  const { results, loading } = useSelector(state => state.query);
  const [columnWidths, setColumnWidths] = useState({});
  const tableRef = useRef(null);
  
  // Track resize state
  const [isResizing, setIsResizing] = useState(false);
  const [currentResizer, setCurrentResizer] = useState(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  
  // Handle resize start
  const startResize = (e, index) => {
    e.preventDefault();
    
    // Get the table's first row to find column elements
    const headerRow = tableRef.current.querySelector('thead tr');
    const th = headerRow.children[index];
    
    setIsResizing(true);
    setCurrentResizer(index);
    setStartX(e.pageX);
    setStartWidth(th.offsetWidth);
  };
  
  // Handle resize move
  const onMouseMove = (e) => {
    if (!isResizing) return;
    
    // Calculate the new width based on mouse movement
    const diff = e.pageX - startX;
    
    // Set minimum width to 30px to ensure at least some content remains visible
    const newWidth = Math.max(30, startWidth + diff);
    
    // Apply the new width to the specific column
    if (tableRef.current) {
      const headerRow = tableRef.current.querySelector('thead tr');
      const bodyRows = tableRef.current.querySelectorAll('tbody tr');
      
      // Update header
      if (headerRow && headerRow.children[currentResizer]) {
        headerRow.children[currentResizer].style.width = `${newWidth}px`;
        headerRow.children[currentResizer].style.minWidth = `${newWidth}px`;
      }
      
      // Update all rows in the body
      bodyRows.forEach(row => {
        if (row.children[currentResizer]) {
          row.children[currentResizer].style.width = `${newWidth}px`;
          row.children[currentResizer].style.minWidth = `${newWidth}px`;
        }
      });
      
      // Update state to remember the width
      setColumnWidths(prev => ({
        ...prev,
        [currentResizer]: newWidth
      }));
    }
  };
  
  // Handle resize end
  const stopResize = () => {
    setIsResizing(false);
    setCurrentResizer(null);
  };
  
  // Set up event listeners
  useEffect(() => {
    const handleMouseMove = (e) => onMouseMove(e);
    const handleMouseUp = () => stopResize();
    
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, currentResizer, startX, startWidth]);
  
  // Apply remembered column widths when results change
  useEffect(() => {
    if (tableRef.current && Object.keys(columnWidths).length > 0) {
      const headerRow = tableRef.current.querySelector('thead tr');
      const bodyRows = tableRef.current.querySelectorAll('tbody tr');
      
      Object.entries(columnWidths).forEach(([index, width]) => {
        const idx = parseInt(index);
        
        // Apply to header
        if (headerRow && headerRow.children[idx]) {
          headerRow.children[idx].style.width = `${width}px`;
          headerRow.children[idx].style.minWidth = `${width}px`;
        }
        
        // Apply to all rows
        bodyRows.forEach(row => {
          if (row.children[idx]) {
            row.children[idx].style.width = `${width}px`;
            row.children[idx].style.minWidth = `${width}px`;
          }
        });
      });
    }
  }, [results, columnWidths]);
  
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
  
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Results ({results.length})</h2>
      <div className="overflow-x-auto">
        <table ref={tableRef} className="min-w-full divide-y divide-gray-200" style={{ tableLayout: 'fixed' }}>
          <thead className="bg-gray-50">
            <tr>
              {allKeys.map((key, index) => (
                <th
                  key={key}
                  style={{ 
                    width: columnWidths[index] ? `${columnWidths[index]}px` : '150px', 
                    position: 'relative',
                    minWidth: '30px' // Absolute minimum width
                  }}
                  className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 px-4 py-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate pr-4">{key}</span>
                    <div
                      onMouseDown={(e) => startResize(e, index)}
                      className="absolute right-0 top-0 h-full w-4 cursor-col-resize hover:bg-blue-200"
                    >
                      <div className="absolute right-0 top-0 h-full w-1 bg-gray-300"></div>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {flattenedResults.map((result, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {allKeys.map((key, colIndex) => (
                  <td
                    key={`${rowIndex}-${key}`}
                    style={{ 
                      width: columnWidths[colIndex] ? `${columnWidths[colIndex]}px` : '150px',
                      minWidth: '30px' // Absolute minimum width
                    }}
                    className="text-sm text-gray-500 border-r border-gray-200 px-4 py-2 truncate"
                    title={renderCellContent(result[key])}
                  >
                    {renderCellContent(result[key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Add tooltip to explain the interaction */}
      <div className="mt-4 text-sm text-gray-500">
        <p>Drag column edges to resize columns.</p>
      </div>
      
      {/* Overlay during resizing to capture mouse events */}
      {isResizing && (
        <div 
          className="fixed top-0 left-0 w-full h-full z-50" 
          style={{ 
            cursor: 'col-resize',
            userSelect: 'none'
          }} 
        />
      )}
    </div>
  );
};

export default ResultsTable;