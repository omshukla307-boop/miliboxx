import { createContext, useContext, useState, useEffect } from 'react';

/**
 * ThemeContext — manages 3 theme modes:
 *   'dark'   — full dark (default)
 *   'hybrid' — dark background, light cards (half-day/half-night)
 *   'light'  — full light
 *
 * Cycles: dark → hybrid → light → dark
 */

const THEMES = ['dark', 'hybrid', 'light'];

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('millibox_theme');
    return THEMES.includes(saved) ? saved : 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    // Remove all theme classes, then apply the current one
    root.classList.remove('dark-mode', 'light-mode', 'hybrid-mode');
    root.classList.add(`${theme}-mode`);
    localStorage.setItem('millibox_theme', theme);
  }, [theme]);

  // Cycle through the three themes in order
  const cycle = () => {
    setTheme((t) => {
      const idx = THEMES.indexOf(t);
      return THEMES[(idx + 1) % THEMES.length];
    });
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      isDark:   theme === 'dark',
      isHybrid: theme === 'hybrid',
      isLight:  theme === 'light',
      cycle,
      // keep `toggle` as an alias for backward-compat (Login page, etc.)
      toggle: cycle,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
