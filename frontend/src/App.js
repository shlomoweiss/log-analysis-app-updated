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
        <ProtectedRoute isAuthenticated={isAuthenticated}>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/history" element={
        <ProtectedRoute isAuthenticated={isAuthenticated}>
          <Layout>
            <QueryHistory />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/saved" element={
        <ProtectedRoute isAuthenticated={isAuthenticated}>
          <Layout>
            <SavedQueries />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute isAuthenticated={isAuthenticated}>
          <Layout>
            <Settings />
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default App;
