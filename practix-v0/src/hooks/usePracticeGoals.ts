'use client';

import { useState, useEffect, useCallback } from 'react';
import { PracticeGoals, DEFAULT_GOALS } from '@/types';

const STORAGE_KEY = 'practix_goals';

export function usePracticeGoals() {
  const [goals, setGoalsState] = useState<PracticeGoals>(DEFAULT_GOALS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load goals on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setGoalsState({ ...DEFAULT_GOALS, ...parsed });
      }
    } catch (e) {
      console.error('Failed to load goals:', e);
    }
    setIsLoaded(true);
  }, []);

  // Save goals
  const setGoals = useCallback((newGoals: Partial<PracticeGoals>) => {
    setGoalsState((prev) => {
      const updated = { ...prev, ...newGoals };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save goals:', e);
      }
      return updated;
    });
  }, []);

  // Reset to defaults
  const resetGoals = useCallback(() => {
    setGoalsState(DEFAULT_GOALS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to reset goals:', e);
    }
  }, []);

  return {
    goals,
    setGoals,
    resetGoals,
    isLoaded,
  };
}
