import React from 'react';
import { LogOut, Settings, Bell, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function Navbar({ onLogout }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    onLogout?.();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-green-500/20 backdrop-blur-sm z-50">
      <div className="px-6 py-4 flex justify-between items-center">
        {/* Left: Logo & Title */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">♻️</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-transparent bg-gradient-to-r from-green-400 to-green-600 bg-clip-text">
              EcoTrack Dashboard
            </h1>
            <p className="text-xs text-gray-400">Gestion Intelligente des Déchets</p>
          </div>
        </div>

        {/* Center: Search */}
        <div className="hidden md:flex flex-1 mx-8 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Chercher..."
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
            />
          </div>
        </div>

        {/* Right: User Menu */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-2 text-gray-400 hover:text-green-400 transition rounded-lg hover:bg-gray-800/50">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          </button>

          {/* Settings */}
          <button className="p-2 text-gray-400 hover:text-green-400 transition rounded-lg hover:bg-gray-800/50">
            <Settings className="w-5 h-5" />
          </button>

          {/* User Info */}
          <div className="flex items-center gap-3 pl-4 border-l border-gray-700">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {user?.email?.[0].toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-white">
                {user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-xs text-gray-400">
                {user?.role === 'admin' ? '👑 Admin' : '👤 Agent'}
              </p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="ml-4 p-2 text-gray-400 hover:text-red-400 transition rounded-lg hover:bg-red-500/10"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
}
