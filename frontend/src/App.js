import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import QueryHistory from './pages/QueryHistory';
import SavedQueries from './pages/SavedQueries';
import Settings from './pages/Settings';
import LogContext from './pages/LogContext';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="query-history" element={<QueryHistory />} />
        <Route path="saved-queries" element={<SavedQueries />} />
        <Route path="settings" element={<Settings />} />
        <Route path="log-context/:id" element={<LogContext />} />
      </Route>
    </Routes>
  );
};

export default App;
