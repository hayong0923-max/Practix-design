'use client';

import { useEffect, useState } from 'react';
import { Check, AlertCircle, Info, Trash2, RotateCcw, X, Mic } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'trash' | 'restore' | 'recording';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
  duration?: number;
  subtitle?: string; // For recording success, show duration
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
      case 'recording':
        return (
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
            <Mic className="w-4 h-4 text-white" />
          </div>
        );
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
      case 'recording':
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

  // Recording toast gets special treatment - larger and more celebratory
  if (toast.type === 'recording') {
    return (
      <div
        className={`
          flex items-center gap-4 px-5 py-4
          bg-zinc-900/95 backdrop-blur-sm
          rounded-2xl shadow-xl shadow-green-500/10 border border-green-500/20
          transition-all duration-300 ease-out
          ${isVisible && !isLeaving ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}
        `}
      >
        {getIcon()}
        <div className="flex-1">
          <p className="text-sm font-medium text-white">{toast.message}</p>
          {toast.subtitle && (
            <p className="text-xs text-zinc-400 mt-0.5">{toast.subtitle}</p>
          )}
        </div>
        <button
          onClick={() => {
            setIsLeaving(true);
            setTimeout(() => onDismiss(toast.id), 300);
          }}
          className="p-1.5 text-zinc-500 active:text-white rounded-lg hover:bg-zinc-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3
        bg-zinc-900/95 backdrop-blur-sm
        rounded-xl shadow-lg border-l-4 ${getBorderColor()}
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
        className="p-1 text-zinc-400 active:text-white"
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
