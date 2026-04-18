'use client';

import { useState, useEffect, ReactNode } from 'react';
import { ThemeContext, Theme } from '@/hooks/useTheme';

interface ThemeProviderProps {
  children: ReactNode;
}

// Dark mode is currently disabled - force light mode
const FORCE_LIGHT_MODE = true;

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Always use light mode for now
    document.documentElement.classList.remove('dark');
    setMounted(true);
  }, []);

  // Toggle is disabled - always stays light
  const toggleTheme = () => {
    if (FORCE_LIGHT_MODE) return;
  };

  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: false }}>
      {children}
    </ThemeContext.Provider>
  );
}
