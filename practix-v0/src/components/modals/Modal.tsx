'use client';

import { X } from 'lucide-react';

interface ModalProps {
  show: boolean;
  onClose: () => void;
  title: string;
  inputValue: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
}

export default function Modal({ show, onClose, title, inputValue, onInputChange, onSubmit }: ModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md animate-scale-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && onSubmit()}
          placeholder="이름을 입력하세요"
          className="w-full border border-input bg-background text-foreground rounded-lg p-3 mb-5 focus:outline-none focus:ring-2 focus:ring-ring"
          autoFocus
        />
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground py-2.5 rounded-lg font-medium transition-colors"
          >
            취소
          </button>
          <button
            onClick={onSubmit}
            className="flex-1 bg-primary hover:opacity-90 text-primary-foreground py-2.5 rounded-lg font-medium transition-opacity"
          >
            추가
          </button>
        </div>
      </div>
    </div>
  );
}
