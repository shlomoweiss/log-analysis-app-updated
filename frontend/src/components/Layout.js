import React, { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen w-full">
      {/* Sidebar */}
      <div className={`sidebar bg-gray-800 text-white w-64 flex-shrink-0 ${isSidebarOpen ? 'block' : 'hidden'} md:block`}>
        <div className="p-4 border-b border-gray-700">
          <Link to="/" className="text-xl font-bold">Log Analysis App</Link>
        </div>
        <nav className="mt-4">
          <ul>
            <li className="px-4 py-2 hover:bg-gray-700">
              <Link to="/" className="flex items-center">
                <i className="fas fa-chart-line mr-2"></i>
                Dashboard
              </Link>
            </li>
            <li className="px-4 py-2 hover:bg-gray-700">
              <Link to="/query-history" className="flex items-center">
                <i className="fas fa-history mr-2"></i>
                Query History
              </Link>
            </li>
            <li className="px-4 py-2 hover:bg-gray-700">
              <Link to="/saved-queries" className="flex items-center">
                <i className="fas fa-save mr-2"></i>
                Saved Queries
              </Link>
            </li>
            <li className="px-4 py-2 hover:bg-gray-700">
              <Link to="/settings" className="flex items-center">
                <i className="fas fa-cog mr-2"></i>
                Settings
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Top Navigation */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between p-4">
            <button className="md:hidden text-gray-600" onClick={toggleSidebar}>
              <i className="fas fa-bars"></i>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 w-full max-w-full">
          <div className="container mx-auto px-4 w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
