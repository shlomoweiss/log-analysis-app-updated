import React from 'react';
import { useSelector } from 'react-redux';

const AggregationsTable = () => {
  console.log('AggregationsTable component rendering'); // Debug log

  const aggregations = useSelector((state) => {
    console.log('Full Redux State:', state); // Debug log
    console.log('Aggregations from Redux:', state.query.aggregations); // Debug log
    return state.query.aggregations;
  });

  console.log('Current aggregations in component:', aggregations); // Debug log

  if (!aggregations) {
    console.log('No aggregations available, rendering empty state'); // Debug log
    return (
      <div className="mt-6 bg-white shadow sm:rounded-lg p-4">
        <p className="text-gray-500">No aggregations available</p>
      </div>
    );
  }

  const renderMetricAggregation = (name, data) => {
    if (typeof data.value === 'number') {
      return (
        <div key={name} className="mb-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2">{name}</h3>
          <p className="text-2xl font-bold">{data.value.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  const renderBucketAggregation = (name, data) => {
    if (!data || !data.buckets) return null;

    return (
      <div key={name} className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">{name}</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Key
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Count
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.buckets.map((bucket, index) => (
                <tr key={bucket.key} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {bucket.key}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {bucket.doc_count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h2 className="text-xl font-semibold text-gray-900">Aggregations</h2>
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
        {Object.entries(aggregations).map(([name, data]) => {
          console.log('Processing aggregation:', name, data); // Debug log
          return data.buckets ? 
            renderBucketAggregation(name, data) : 
            renderMetricAggregation(name, data);
        })}
      </div>
    </div>
  );
};

export default AggregationsTable;
