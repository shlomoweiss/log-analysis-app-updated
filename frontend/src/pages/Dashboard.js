import React from 'react';
import { useSelector } from 'react-redux';
import QueryInput from '../components/QueryInput';
import ResultsTable from '../components/ResultsTable';
import TimelineVisualization from '../components/TimelineVisualization';
import AggregationsTable from '../components/AggregationsTable';

const Dashboard = () => {
  const { results, aggregations } = useSelector(state => state.query);

  const shouldShowResults = results && results.length > 0;
  const shouldShowAggregations = aggregations && Object.keys(aggregations).length > 0;

  return (
    <div className="w-full">
      <div className="pb-5 border-b border-gray-200">
        <h1 className="text-2xl font-bold leading-tight text-gray-900">Dashboard</h1>
      </div>
      
      <div className="mt-6 w-full space-y-6">
        <QueryInput />
        
        <TimelineVisualization />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {shouldShowResults && (
            <div className={shouldShowAggregations ? "lg:col-span-1" : "lg:col-span-2"}>
              <ResultsTable />
            </div>
          )}
          {shouldShowAggregations && (
            <div className={shouldShowResults ? "lg:col-span-1" : "lg:col-span-2"}>
              <AggregationsTable />
            </div>
          )}
          {!shouldShowResults && !shouldShowAggregations && (
            <div className="lg:col-span-2 bg-white shadow rounded-lg p-6 text-center">
              <p className="text-gray-500">No data to display. Try executing a query.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
