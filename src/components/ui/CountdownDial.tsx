'use client';

import { useRef } from 'react';
import { useTheme } from '@/hooks/useTheme';

interface CountdownDialProps {
  value: number; // Current countdown value in seconds
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  onClose?: () => void;
}

export default function CountdownDial({
  value,
  onChange,
  min = 0.5,
  max = 5,
  step = 0.5,
  onClose,
}: CountdownDialProps) {
  const { isDark } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate tick marks
  const ticks = [];
  for (let v = min; v <= max; v += step) {
    ticks.push(v);
  }

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-50 flex items-center justify-center ${isDark ? 'bg-black/70' : 'bg-black/50'}`}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (e.target === containerRef.current) {
          // Delay close to prevent click-through
          setTimeout(() => onClose?.(), 50);
        }
      }}
    >
      <div
        className={`rounded-2xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <p className={`text-center text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          카운트다운 시간 설정
        </p>

        {/* Value display with +/- buttons */}
        <div className="flex items-center justify-center gap-4 mb-4">
          {/* Minus button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              const newValue = Math.max(min, value - step);
              onChange(newValue);
            }}
            disabled={value <= min}
            className={`w-12 h-12 rounded-full text-2xl font-bold flex items-center justify-center ${
              value <= min
                ? isDark ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'
                : isDark ? 'bg-gray-700 text-white active:bg-gray-600' : 'bg-gray-200 text-gray-700 active:bg-gray-300'
            }`}
          >
            −
          </button>

          {/* Value display */}
          <div className="text-center select-none min-w-[100px]">
            <span className={`text-5xl font-bold tabular-nums ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {value.toFixed(1)}
            </span>
            <span className={`text-2xl ml-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>초</span>
          </div>

          {/* Plus button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              const newValue = Math.min(max, value + step);
              onChange(newValue);
            }}
            disabled={value >= max}
            className={`w-12 h-12 rounded-full text-2xl font-bold flex items-center justify-center ${
              value >= max
                ? isDark ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'
                : isDark ? 'bg-gray-700 text-white active:bg-gray-600' : 'bg-gray-200 text-gray-700 active:bg-gray-300'
            }`}
          >
            +
          </button>
        </div>

        {/* Visual indicator */}
        <div className="flex justify-center gap-1 mb-4">
          {ticks.map((tick) => (
            <div
              key={tick}
              className={`w-2 h-8 rounded-full transition-all ${
                tick === value
                  ? isDark ? 'bg-purple-500 scale-y-125' : 'bg-purple-600 scale-y-125'
                  : tick < value
                  ? isDark ? 'bg-purple-400/50' : 'bg-purple-300'
                  : isDark ? 'bg-gray-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Quick select buttons */}
        <div className="flex gap-2 justify-center mb-4">
          {[1, 2, 3, 5].map((v) => (
            <button
              key={v}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onChange(v);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                value === v
                  ? 'bg-purple-500 text-white'
                  : isDark
                  ? 'bg-gray-700 text-gray-300 active:bg-gray-600'
                  : 'bg-gray-100 text-gray-600 active:bg-gray-200'
              }`}
            >
              {v}초
            </button>
          ))}
        </div>

        {/* Confirm button */}
        <button
          onTouchStart={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            // Delay close to prevent click-through to elements behind
            setTimeout(() => onClose?.(), 50);
          }}
          className={`w-full py-3 rounded-lg font-medium ${
            isDark
              ? 'bg-purple-600 text-white active:bg-purple-700'
              : 'bg-purple-500 text-white active:bg-purple-600'
          }`}
        >
          확인
        </button>
      </div>
    </div>
  );
}
