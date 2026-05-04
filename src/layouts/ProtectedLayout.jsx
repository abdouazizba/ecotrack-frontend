import React from 'react';
import Sidebar from '../components/Sidebar';

export default function ProtectedLayout({ children }) {
  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="dashboard-main">
        {children}
      </main>
    </div>
  );
}
