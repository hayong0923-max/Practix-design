'use client';

import { Scissors } from 'lucide-react';
import { ZoomLevel } from '@/types';

interface ZoomControlsProps {
  zoomLevel: ZoomLevel;
  onZoomChange: (level: ZoomLevel) => void;
  isCreatingSection: boolean;
  onToggleCreatingSection: () => void;
}

const ZOOM_OPTIONS: { level: ZoomLevel; label: string }[] = [
  { level: 'full', label: '전체' },
  { level: '60s', label: '1분' },
  { level: '30s', label: '30s' },
  { level: '10s', label: '10s' },
];

export default function ZoomControls({
  zoomLevel,
  onZoomChange,
  isCreatingSection,
  onToggleCreatingSection,
}: ZoomControlsProps) {
  return (
    <div className="flex items-center gap-1">
      {/* Zoom buttons - compact */}
      <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
        {ZOOM_OPTIONS.map(({ level, label }) => (
          <button
            key={level}
            onClick={() => onZoomChange(level)}
            className={`px-2 py-1 rounded text-xs font-medium transition ${
              zoomLevel === level
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-gray-600 active:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Section create toggle */}
      <button
        onClick={onToggleCreatingSection}
        className={`ml-1 p-2 rounded-lg transition ${
          isCreatingSection
            ? 'bg-green-500 text-white'
            : 'bg-gray-100 text-gray-600 active:bg-gray-200'
        }`}
        title={isCreatingSection ? '구간 생성 모드 ON' : '구간 생성하기'}
      >
        <Scissors className="w-4 h-4" />
      </button>
    </div>
  );
}
