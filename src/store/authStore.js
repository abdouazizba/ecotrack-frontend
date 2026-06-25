import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: Cookies.get('authToken') || null,
      isAuthenticated: !!Cookies.get('authToken'),
      profileCompleted: false,
      loading: false,
      error: null,

      login: (user, token) => {
        Cookies.set('authToken', token, { expires: 7 });
        set({
          user: {
            id: user.id,
            email: user.email,
            firstName: user.prenom || user.firstName || user.first_name || '',
            lastName: user.nom || user.lastName || user.last_name || '',
            role: user.role || null,
            phone: user.phone || user.telephone,
            status: user.status,
          },
          token,
          isAuthenticated: true,
        });
      },

      loginWithTokens: (user, accessToken, refreshToken) => {
        Cookies.set('authToken', accessToken, { expires: 7 });
        if (refreshToken) Cookies.set('refreshToken', refreshToken, { expires: 7 });
        set({
          user: {
            id: user.id,
            email: user.email,
            firstName: user.prenom || user.firstName || user.first_name || '',
            lastName: user.nom || user.lastName || user.last_name || '',
            role: user.role || null,
            phone: user.phone || user.telephone,
            status: user.status,
          },
          token: accessToken,
          isAuthenticated: true,
        });
      },

      updateAccessToken: (newToken) => {
        Cookies.set('authToken', newToken, { expires: 7 });
        set({ token: newToken });
      },

      updateUserProfile: (userData) => {
        set((state) => ({
          user: state.user ? {
            ...state.user,
            ...userData,
            role: userData.role || state.user.role || null,
          } : null,
        }));
      },

      logout: () => {
        Cookies.remove('authToken');
        Cookies.remove('refreshToken');
        set({ user: null, token: null, isAuthenticated: false, profileCompleted: false });
      },

      setProfileCompleted: (val) => set({ profileCompleted: val }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({ user: state.user, token: state.token, profileCompleted: state.profileCompleted }),
    }
  )
);

export default useAuthStore;
