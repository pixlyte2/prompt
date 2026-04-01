import { createContext, useContext, useEffect, useState } from 'react';

const DarkModeContext = createContext();

export const useDarkMode = () => {
  const context = useContext(DarkModeContext);
  if (!context) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
};

function readInitialDarkPreference() {
  const stored = localStorage.getItem('darkMode');
  if (stored !== null) {
    try {
      return JSON.parse(stored);
    } catch {
      /* ignore */
    }
  }
  // Legacy: Topbar used `theme`; migrate once so one source of truth
  const legacyTheme = localStorage.getItem('theme');
  if (legacyTheme === 'dark') return true;
  if (legacyTheme === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export const DarkModeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(readInitialDarkPreference);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    localStorage.setItem('darkMode', JSON.stringify(isDark));
    localStorage.removeItem('theme');
  }, [isDark]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      // Only auto-switch if user hasn't manually set a preference
      const stored = localStorage.getItem('darkMode');
      if (stored === null) {
        setIsDark(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleDarkMode = () => setIsDark(!isDark);

  return (
    <DarkModeContext.Provider value={{ isDark, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
};