'use client';

import { useState, useCallback } from 'react';
import { ToastMessage, ToastType } from '@/components/ui/Toast';

let toastIdCounter = 0;

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration?: number, subtitle?: string) => {
    const id = ++toastIdCounter;
    const toast: ToastMessage = {
      id,
      message,
      type,
      duration,
      subtitle,
    };

    setToasts((prev) => [...prev, toast]);

    return id;
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Convenience methods
  const success = useCallback((message: string, duration?: number) => {
    return showToast(message, 'success', duration);
  }, [showToast]);

  const error = useCallback((message: string, duration?: number) => {
    return showToast(message, 'error', duration);
  }, [showToast]);

  const info = useCallback((message: string, duration?: number) => {
    return showToast(message, 'info', duration);
  }, [showToast]);

  const trash = useCallback((message: string, duration?: number) => {
    return showToast(message, 'trash', duration);
  }, [showToast]);

  const restore = useCallback((message: string, duration?: number) => {
    return showToast(message, 'restore', duration);
  }, [showToast]);

  // Recording success with duration subtitle
  const recording = useCallback((message: string, durationSeconds?: number) => {
    const subtitle = durationSeconds 
      ? `${Math.floor(durationSeconds / 60)}:${String(Math.floor(durationSeconds % 60)).padStart(2, '0')} 녹음됨`
      : undefined;
    return showToast(message, 'recording', 4000, subtitle);
  }, [showToast]);

  return {
    toasts,
    showToast,
    dismissToast,
    success,
    error,
    info,
    trash,
    restore,
    recording,
  };
}
