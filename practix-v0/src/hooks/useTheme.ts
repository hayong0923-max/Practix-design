'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    // Return default values if not in provider
    return { theme: 'light' as Theme, toggleTheme: () => {}, isDark: false };
  }
  return context;
}

export { ThemeContext };
export type { Theme, ThemeContextType };
