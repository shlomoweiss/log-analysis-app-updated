import React from 'react';
import QueryInput from '../components/QueryInput';
import ResultsTable from '../components/ResultsTable';
import TimelineVisualization from '../components/TimelineVisualization';

const Dashboard = () => {
  return (
    <div>
      <div className="pb-5 border-b border-gray-200">
        <h1 className="text-2xl font-bold leading-tight text-gray-900">Dashboard</h1>
      </div>
      
      <div className="mt-6">
        <QueryInput />
        <TimelineVisualization />
        <ResultsTable />
      </div>
    </div>
  );
};

export default Dashboard;
