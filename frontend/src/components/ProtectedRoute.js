import React from 'react';
import { useNavigate } from 'react-router-dom';

const ProtectedRoute = ({ children, isAuthenticated }) => {
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  return isAuthenticated ? children : null;
};

export default ProtectedRoute;
