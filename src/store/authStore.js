import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: Cookies.get('authToken') || null,
      isAuthenticated: !!Cookies.get('authToken'),
      loading: false,
      error: null,

      login: (user, token) => {
        console.log('💾 SAVING TOKEN TO COOKIES:', {
          token_exists: !!token,
          token_length: token ? token.length : 0,
          token_preview: token ? token.slice(0, 30) + '...' : 'NONE',
        });
        
        Cookies.set('authToken', token, { expires: 7 });
        
        // Vérifier immédiatement
        const saved = Cookies.get('authToken');
        console.log('✅ VERIFY SAVED:', {
          saved_exists: !!saved,
          matches: saved === token,
        });
        
        set({
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName || user.first_name || '',
            lastName: user.lastName || user.last_name || '',
            role: user.role || 'agent',
            phone: user.phone,
            status: user.status,
          },
          token,
          isAuthenticated: true,
        });
      },

      // Mettre à jour le profil après avoir récupéré les infos complètes
      updateUserProfile: (userData) => {
        set((state) => ({
          user: state.user ? {
            ...state.user,
            ...userData,
            role: userData.role || state.user.role || 'agent',
          } : null,
        }));
      },

      logout: () => {
        Cookies.remove('authToken');
        set({ user: null, token: null, isAuthenticated: false });
      },

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);

export default useAuthStore;
