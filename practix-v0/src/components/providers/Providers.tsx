'use client';

import { ReactNode } from 'react';
import ThemeProvider from './ThemeProvider';
import { PracticeStatsProvider } from '@/contexts/PracticeStatsContext';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <PracticeStatsProvider>
        {children}
      </PracticeStatsProvider>
    </ThemeProvider>
  );
}
