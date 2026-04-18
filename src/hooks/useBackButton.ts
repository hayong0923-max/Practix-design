'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

// Global registry for modal closers (child components can register dynamically)
const dynamicClosers: (() => boolean)[] = [];

export function registerBackButtonCloser(closer: () => boolean): () => void {
  dynamicClosers.push(closer);
  return () => {
    const idx = dynamicClosers.indexOf(closer);
    if (idx >= 0) dynamicClosers.splice(idx, 1);
  };
}

interface UseBackButtonProps {
  page: 'songs' | 'sessions' | 'practice' | 'stats' | 'metronome' | 'tuner';
  onNavigateBack: () => void;
  modalClosers?: (() => boolean)[];
}

export function useBackButton({ page, onNavigateBack, modalClosers = [] }: UseBackButtonProps) {
  const [showExitToast, setShowExitToast] = useState(false);
  const lastBackPressRef = useRef<number>(0);
  const EXIT_TIMEOUT = 2000;

  const handleBackButton = useCallback(() => {
    // 1. Try dynamic closers first
    for (let i = dynamicClosers.length - 1; i >= 0; i--) {
      if (dynamicClosers[i]()) return;
    }
    // 2. Try static modal closers
    for (const closeModal of modalClosers) {
      if (closeModal()) return;
    }
    // 3. Navigate based on current page
    if (page === 'songs' || page === 'stats') {
      const now = Date.now();
      if (now - lastBackPressRef.current < EXIT_TIMEOUT) {
        // Web: show a toast or do nothing (can't force exit a browser tab)
        setShowExitToast(false);
      } else {
        lastBackPressRef.current = now;
        setShowExitToast(true);
        setTimeout(() => setShowExitToast(false), EXIT_TIMEOUT);
      }
    } else {
      onNavigateBack();
    }
  }, [page, onNavigateBack, modalClosers]);

  // Web: listen to browser back navigation via popstate
  useEffect(() => {
    const handlePopState = () => handleBackButton();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [handleBackButton]);

  return { showExitToast };
}
