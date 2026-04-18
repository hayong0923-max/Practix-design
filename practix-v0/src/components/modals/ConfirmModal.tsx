'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  show: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  confirmColor?: 'red' | 'green' | 'purple';
  showDontAskAgain?: boolean;
  onDontAskAgainChange?: (checked: boolean) => void;
}

export default function ConfirmModal({
  show,
  message,
  onConfirm,
  onCancel,
  confirmText = '삭제',
  confirmColor = 'red',
  showDontAskAgain = false,
  onDontAskAgainChange,
}: ConfirmModalProps) {
  const [dontAskAgain, setDontAskAgain] = useState(false);

  if (!show) return null;

  const colorClasses = {
    red: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground',
    green: 'bg-success hover:bg-success/90 text-success-foreground',
    purple: 'bg-gradient-brand hover:opacity-90 text-white',
  };

  const handleConfirm = () => {
    if (showDontAskAgain && dontAskAgain && onDontAskAgainChange) {
      onDontAskAgainChange(true);
    }
    onConfirm();
  };

  return (
    <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md animate-scale-in">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-1">확인</h2>
            <p className="text-muted-foreground text-sm">{message}</p>
          </div>
        </div>

        {showDontAskAgain && (
          <label className="flex items-center gap-2 mb-5 cursor-pointer text-muted-foreground">
            <input
              type="checkbox"
              checked={dontAskAgain}
              onChange={(e) => setDontAskAgain(e.target.checked)}
              className="w-4 h-4 rounded border-border bg-background text-accent focus:ring-ring"
            />
            <span className="text-sm">다시 표시하지 않기</span>
          </label>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground py-2.5 rounded-lg font-medium transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 ${colorClasses[confirmColor]} py-2.5 rounded-lg font-medium transition-opacity`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
