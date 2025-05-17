import React from 'react';
import { useSelector } from 'react-redux';
import QueryInput from '../components/QueryInput';
import ResultsTable from '../components/ResultsTable';
import TimelineVisualization from '../components/TimelineVisualization';
import AggregationsTable from '../components/AggregationsTable';

const Dashboard = () => {
  return (
    <div className="w-full">
      <div className="pb-5 border-b border-gray-200">
        <h1 className="text-2xl font-bold leading-tight text-gray-900">Dashboard</h1>
      </div>
      
      <div className="mt-6 w-full space-y-6">
        <QueryInput />
        
        <TimelineVisualization />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="lg:col-span-1">
            <ResultsTable />
          </div>
          <div className="lg:col-span-1">
            <AggregationsTable />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
