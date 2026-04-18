'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'practix_dialog_preferences';
const SYNC_EVENT = 'practix_dialog_preferences_sync';

interface DialogPreferences {
  skipTrashRestoreConfirm: boolean;
  skipTrashDeleteConfirm: boolean;
}

const defaultPreferences: DialogPreferences = {
  skipTrashRestoreConfirm: false,
  skipTrashDeleteConfirm: false,
};

// Helper to read from localStorage
const readFromStorage = (): DialogPreferences => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultPreferences, ...JSON.parse(stored) };
    }
  } catch (err) {
    console.error('Failed to load dialog preferences:', err);
  }
  return defaultPreferences;
};

// Helper to save to localStorage and dispatch sync event
const saveToStorage = (prefs: DialogPreferences) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  // Dispatch custom event to sync other hook instances in the same tab
  window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: prefs }));
};

export function useDialogPreferences() {
  const [preferences, setPreferences] = useState<DialogPreferences>(defaultPreferences);

  // Load preferences on mount and listen for sync events
  useEffect(() => {
    // Initial load
    setPreferences(readFromStorage());

    // Listen for sync events from other components
    const handleSync = (e: CustomEvent<DialogPreferences>) => {
      setPreferences(e.detail);
    };

    // Listen for storage events from other tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setPreferences({ ...defaultPreferences, ...JSON.parse(e.newValue) });
        } catch (err) {
          console.error('Failed to parse storage event:', err);
        }
      }
    };

    window.addEventListener(SYNC_EVENT as string, handleSync as EventListener);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(SYNC_EVENT as string, handleSync as EventListener);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Save preferences whenever they change
  const updatePreference = useCallback(<K extends keyof DialogPreferences>(
    key: K,
    value: DialogPreferences[K]
  ) => {
    setPreferences((prev) => {
      const updated = { ...prev, [key]: value };
      saveToStorage(updated);
      return updated;
    });
  }, []);

  // Reset all confirmations (show them again)
  const resetAllConfirmations = useCallback(() => {
    const reset = { ...defaultPreferences };
    setPreferences(reset);
    saveToStorage(reset);
  }, []);

  return {
    preferences,
    updatePreference,
    resetAllConfirmations,
  };
}
