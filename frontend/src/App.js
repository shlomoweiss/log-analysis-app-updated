import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import QueryHistory from './pages/QueryHistory';
import SavedQueries from './pages/SavedQueries';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

function App() {
  const { isAuthenticated } = useSelector(state => state.auth);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <Layout>
          <Dashboard />
        </Layout>
      } />
      <Route path="/history" element={
        <Layout>
          <QueryHistory />
        </Layout>  
      } />
      <Route path="/saved" element={
        <Layout>
            <SavedQueries />
        </Layout>    
      } />
      <Route path="/settings" element={
        <Layout>
          <Settings />
        </Layout>  
      } />
    </Routes>
  );
}

export default App;
