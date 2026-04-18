'use client';

import { formatTime } from '@/utils/formatTime';

interface ScrollControlProps {
  scrollPosition: number;
  onScrollChange: (position: number) => void;
  visibleStart: number;
  visibleEnd: number;
}

export default function ScrollControl({
  scrollPosition,
  onScrollChange,
  visibleStart,
  visibleEnd,
}: ScrollControlProps) {
  return (
    <div className="mt-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-600">스크롤:</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={scrollPosition}
          onChange={(e) => onScrollChange(parseFloat(e.target.value))}
          className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <span className="text-xs text-gray-600 min-w-[60px]">
          {formatTime(visibleStart)} - {formatTime(visibleEnd)}
        </span>
      </div>
    </div>
  );
}
