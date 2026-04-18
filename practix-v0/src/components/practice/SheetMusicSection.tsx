'use client';

import { memo } from 'react';
import { Section, SheetMusic } from '@/types';
import { SheetMusicViewer } from '@/components/sheetMusic';

interface SheetMusicSectionProps {
  sheetMusic: SheetMusic | null;
  sections: Section[];
  selectedSectionId: number | null;
  currentTime: number;
  isDark: boolean;
  onEditClick: () => void;
  onSectionClick: (sectionId: number) => void;
}

function SheetMusicSection({
  sheetMusic,
  sections,
  selectedSectionId,
  currentTime,
  isDark,
  onEditClick,
  onSectionClick,
}: SheetMusicSectionProps) {
  return (
    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} mt-2 px-4 py-4`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>악보</h3>
        <button
          onClick={onEditClick}
          className="text-sm text-purple-500 active:opacity-70"
        >
          {sheetMusic ? '편집' : '추가'}
        </button>
      </div>

      {sheetMusic ? (
        <SheetMusicViewer
          sheetMusic={sheetMusic}
          sections={sections}
          currentSectionId={selectedSectionId}
          currentTime={currentTime}
          onSectionClick={onSectionClick}
          isDark={isDark}
          compact
        />
      ) : (
        <div className={`text-center py-6 border-2 border-dashed rounded-xl ${
          isDark ? 'border-gray-600 text-gray-500' : 'border-gray-300 text-gray-400'
        }`}>
          <p className="text-sm">악보를 추가하여 구간과 연결하세요</p>
        </div>
      )}
    </div>
  );
}

export default memo(SheetMusicSection);
