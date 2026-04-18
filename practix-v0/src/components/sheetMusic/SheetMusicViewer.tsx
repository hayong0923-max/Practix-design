'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Music2 } from 'lucide-react';
import { SheetMusic, Section } from '@/types';

interface SheetMusicViewerProps {
  sheetMusic: SheetMusic | null;
  sections: Section[];
  currentSectionId: number | null;
  currentTime: number;
  onSectionClick?: (sectionId: number) => void;
  isDark?: boolean;
  compact?: boolean;
}

export default function SheetMusicViewer({
  sheetMusic,
  sections,
  currentSectionId,
  currentTime,
  onSectionClick,
  isDark = false,
  compact = false,
}: SheetMusicViewerProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);

  const bgClass = isDark ? 'bg-gray-800' : 'bg-white';
  const textClass = isDark ? 'text-white' : 'text-gray-900';
  const subTextClass = isDark ? 'text-gray-400' : 'text-gray-500';
  const borderClass = isDark ? 'border-gray-700' : 'border-gray-200';

  // 현재 재생 중인 섹션에 연결된 영역 찾기
  const activeRegion = useMemo(() => {
    if (!sheetMusic || !currentSectionId) return null;
    return sheetMusic.regions.find(r => r.sectionId === currentSectionId);
  }, [sheetMusic, currentSectionId]);

  // 현재 시간으로 활성 섹션 찾기
  const activeSection = useMemo(() => {
    if (currentSectionId) {
      return sections.find(s => s.id === currentSectionId);
    }
    // 현재 시간이 포함된 섹션 찾기
    return sections.find(s => currentTime >= s.start && currentTime < s.end);
  }, [currentSectionId, currentTime, sections]);

  // 현재 시간으로 활성 영역 찾기
  const timeBasedActiveRegion = useMemo(() => {
    if (!sheetMusic || !activeSection) return null;
    return sheetMusic.regions.find(r => r.sectionId === activeSection.id);
  }, [sheetMusic, activeSection]);

  const currentActiveRegion = activeRegion || timeBasedActiveRegion;

  if (!sheetMusic) return null;

  if (compact) {
    return (
      <div className={`${bgClass} rounded-lg border ${borderClass} overflow-hidden`}>
        {/* 접힌 헤더 */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-full flex items-center justify-between p-2 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
        >
          <div className="flex items-center gap-2">
            <Music2 className={`w-4 h-4 ${subTextClass}`} />
            <span className={`text-sm ${textClass}`}>악보</span>
            {currentActiveRegion && (
              <span className="px-1.5 py-0.5 rounded text-xs text-white" style={{ backgroundColor: currentActiveRegion.color }}>
                구간 {sections.findIndex(s => s.id === currentActiveRegion.sectionId) + 1}
              </span>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className={`w-4 h-4 ${subTextClass}`} />
          ) : (
            <ChevronDown className={`w-4 h-4 ${subTextClass}`} />
          )}
        </button>

        {/* 확장된 내용 */}
        {isExpanded && (
          <div className={`border-t ${borderClass}`}>
            <SheetMusicImage
              sheetMusic={sheetMusic}
              sections={sections}
              currentActiveRegion={currentActiveRegion || null}
              onSectionClick={onSectionClick}
              maxHeight="200px"
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`${bgClass} rounded-xl border ${borderClass} overflow-hidden`}>
      <SheetMusicImage
        sheetMusic={sheetMusic}
        sections={sections}
        currentActiveRegion={currentActiveRegion || null}
        onSectionClick={onSectionClick}
        maxHeight="300px"
      />
    </div>
  );
}

// 악보 이미지 컴포넌트 (재사용)
interface SheetMusicImageProps {
  sheetMusic: SheetMusic;
  sections: Section[];
  currentActiveRegion: SheetMusic['regions'][0] | null;
  onSectionClick?: (sectionId: number) => void;
  maxHeight?: string;
}

function SheetMusicImage({
  sheetMusic,
  sections,
  currentActiveRegion,
  onSectionClick,
  maxHeight = '300px',
}: SheetMusicImageProps) {
  return (
    <div className="relative overflow-auto" style={{ maxHeight }}>
      <div className="relative">
        <img
          src={sheetMusic.imageData}
          alt="악보"
          className="w-full h-auto"
          draggable={false}
        />

        {/* 영역들 */}
        {sheetMusic.regions.map((region) => {
          const isActive = currentActiveRegion?.id === region.id;
          const section = region.sectionId
            ? sections.find(s => s.id === region.sectionId)
            : null;
          const sectionIndex = section ? sections.indexOf(section) : -1;

          return (
            <div
              key={region.id}
              className={`absolute transition-all duration-300 ${
                onSectionClick && region.sectionId ? 'cursor-pointer' : ''
              }`}
              style={{
                left: `${region.x * 100}%`,
                top: `${region.y * 100}%`,
                width: `${region.width * 100}%`,
                height: `${region.height * 100}%`,
                borderWidth: isActive ? '3px' : '2px',
                borderStyle: isActive ? 'solid' : 'dashed',
                borderColor: region.color || '#3B82F6',
                backgroundColor: isActive
                  ? `${region.color || '#3B82F6'}40`
                  : `${region.color || '#3B82F6'}10`,
                boxShadow: isActive ? `0 0 10px ${region.color || '#3B82F6'}80` : 'none',
              }}
              onClick={() => {
                if (onSectionClick && region.sectionId) {
                  onSectionClick(region.sectionId);
                }
              }}
            >
              {/* 영역 라벨 */}
              <div
                className={`absolute -top-5 left-0 px-1.5 py-0.5 rounded text-xs text-white whitespace-nowrap transition-all ${
                  isActive ? 'scale-110' : ''
                }`}
                style={{ backgroundColor: region.color || '#3B82F6' }}
              >
                {sectionIndex >= 0 ? `구간 ${sectionIndex + 1}` : `영역 ${region.order + 1}`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
