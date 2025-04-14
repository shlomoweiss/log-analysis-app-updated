import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/slices/authSlice';

const Layout = ({ children }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-600 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold">Log Analysis App</span>
              </div>
              <div className="ml-6 flex items-center space-x-4">
                <Link 
                  to="/" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/' ? 'bg-blue-700' : 'hover:bg-blue-500'
                  }`}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/history" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/history' ? 'bg-blue-700' : 'hover:bg-blue-500'
                  }`}
                >
                  Query History
                </Link>
                <Link 
                  to="/saved" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/saved' ? 'bg-blue-700' : 'hover:bg-blue-500'
                  }`}
                >
                  Saved Queries
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex items-center">
                <span className="text-sm mr-4">
                  {user ? `${user.username} (${user.role})` : ''}
                </span>
                <Link 
                  to="/settings" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/settings' ? 'bg-blue-700' : 'hover:bg-blue-500'
                  }`}
                >
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="ml-4 px-3 py-2 rounded-md text-sm font-medium bg-red-500 hover:bg-red-600"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
