'use client';

import { useEffect, useState } from 'react';
import { Check, AlertCircle, Info, Trash2, RotateCcw, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'trash' | 'restore';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: number) => void;
}

function Toast({ toast, onDismiss }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => {
      setIsVisible(true);
    });

    // Auto dismiss
    const duration = toast.duration || 3000;
    const timer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(() => onDismiss(toast.id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <Check className="w-5 h-5 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'trash':
        return <Trash2 className="w-5 h-5 text-orange-400" />;
      case 'restore':
        return <RotateCcw className="w-5 h-5 text-blue-400" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-cyan-400" />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success':
        return 'border-l-green-500';
      case 'error':
        return 'border-l-red-500';
      case 'trash':
        return 'border-l-orange-500';
      case 'restore':
        return 'border-l-blue-500';
      case 'info':
      default:
        return 'border-l-cyan-500';
    }
  };

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3
        bg-gray-800/95 backdrop-blur-sm
        rounded-lg shadow-lg border-l-4 ${getBorderColor()}
        transition-all duration-300 ease-out
        ${isVisible && !isLeaving ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
    >
      {getIcon()}
      <p className="text-sm text-white flex-1">{toast.message}</p>
      <button
        onClick={() => {
          setIsLeaving(true);
          setTimeout(() => onDismiss(toast.id), 300);
        }}
        className="p-1 text-gray-400 active:text-white"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none" style={{ bottom: 'calc(9rem + var(--sab, 0px))' }}>
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}
