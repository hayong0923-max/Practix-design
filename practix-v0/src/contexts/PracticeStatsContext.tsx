'use client';

import { createContext, useContext, ReactNode } from 'react';
import { usePracticeStats } from '@/hooks/usePracticeStats';

type PracticeStatsContextType = ReturnType<typeof usePracticeStats>;

const PracticeStatsContext = createContext<PracticeStatsContextType | null>(null);

export function PracticeStatsProvider({ children }: { children: ReactNode }) {
  const practiceStats = usePracticeStats();

  return (
    <PracticeStatsContext.Provider value={practiceStats}>
      {children}
    </PracticeStatsContext.Provider>
  );
}

export function usePracticeStatsContext() {
  const context = useContext(PracticeStatsContext);
  if (!context) {
    throw new Error('usePracticeStatsContext must be used within a PracticeStatsProvider');
  }
  return context;
}
