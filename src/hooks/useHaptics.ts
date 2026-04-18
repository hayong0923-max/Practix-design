'use client';

import { useCallback } from 'react';

// Simple haptic feedback using browser Vibration API
// Works on most mobile browsers without additional dependencies
export function useHaptics() {
  const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  // Light tap - for button presses
  const lightTap = useCallback(() => {
    if (isSupported) {
      navigator.vibrate(10);
    }
  }, [isSupported]);

  // Medium tap - for confirmations
  const mediumTap = useCallback(() => {
    if (isSupported) {
      navigator.vibrate(25);
    }
  }, [isSupported]);

  // Heavy tap - for important actions
  const heavyTap = useCallback(() => {
    if (isSupported) {
      navigator.vibrate(50);
    }
  }, [isSupported]);

  // Success pattern - two quick vibrations
  const success = useCallback(() => {
    if (isSupported) {
      navigator.vibrate([20, 50, 20]);
    }
  }, [isSupported]);

  // Warning pattern - longer vibration
  const warning = useCallback(() => {
    if (isSupported) {
      navigator.vibrate(100);
    }
  }, [isSupported]);

  // Error pattern - three quick vibrations
  const error = useCallback(() => {
    if (isSupported) {
      navigator.vibrate([30, 50, 30, 50, 30]);
    }
  }, [isSupported]);

  // Recording start - distinctive pattern
  const recordingStart = useCallback(() => {
    if (isSupported) {
      navigator.vibrate([50, 100, 50]);
    }
  }, [isSupported]);

  // Recording stop - single firm tap
  const recordingStop = useCallback(() => {
    if (isSupported) {
      navigator.vibrate(75);
    }
  }, [isSupported]);

  return {
    isSupported,
    lightTap,
    mediumTap,
    heavyTap,
    success,
    warning,
    error,
    recordingStart,
    recordingStop,
  };
}
