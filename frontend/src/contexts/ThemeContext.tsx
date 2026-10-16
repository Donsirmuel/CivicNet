import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

// Deprecated: single Sovereign Paper palette, no toggle.
// Kept as a no-op so old imports don't break.
export type Theme = 'sovereign';

interface ThemeContextType {
  theme: Theme;
  effectiveTheme: 'light';
  setTheme: (_theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'sovereign',
  effectiveTheme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
  }
  const value: ThemeContextType = {
    theme: 'sovereign',
    effectiveTheme: 'light',
    setTheme: () => {},
    toggleTheme: () => {},
  };
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  return useContext(ThemeContext);
}
