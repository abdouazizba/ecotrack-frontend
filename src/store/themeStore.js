import { create } from 'zustand';

const getInitialTheme = () => {
  try {
    return localStorage.getItem('ecotrack-theme') || 'dark';
  } catch {
    return 'dark';
  }
};

const useThemeStore = create((set) => ({
  theme: getInitialTheme(),
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('ecotrack-theme', next);
      document.documentElement.setAttribute('data-theme', next);
      return { theme: next };
    }),
}));

export default useThemeStore;
