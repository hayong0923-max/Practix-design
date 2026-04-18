'use client';

import { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';

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
  const { isDark } = useTheme();
  const [dontAskAgain, setDontAskAgain] = useState(false);

  if (!show) return null;

  const colorClasses = {
    red: 'bg-red-500 hover:bg-red-600 active:bg-red-700',
    green: 'bg-green-500 hover:bg-green-600 active:bg-green-700',
    purple: 'bg-purple-500 hover:bg-purple-600 active:bg-purple-700',
  };

  const handleConfirm = () => {
    if (showDontAskAgain && dontAskAgain && onDontAskAgainChange) {
      onDontAskAgainChange(true);
    }
    onConfirm();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 w-96 max-w-full mx-4`}>
        <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'} mb-4`}>확인</h2>
        <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} mb-4`}>{message}</p>

        {showDontAskAgain && (
          <label className={`flex items-center gap-2 mb-4 cursor-pointer ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <input
              type="checkbox"
              checked={dontAskAgain}
              onChange={(e) => setDontAskAgain(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-purple-500 focus:ring-purple-500"
            />
            <span className="text-sm">다시 표시하지 않기</span>
          </label>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className={`flex-1 ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} py-2 rounded-lg`}
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 ${colorClasses[confirmColor]} text-white py-2 rounded-lg`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
