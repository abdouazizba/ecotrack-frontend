// 🔄 Redirect to new location
export { default } from './Navigation/Navbar';
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
