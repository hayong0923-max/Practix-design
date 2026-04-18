'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Trash2, Link2, X, ZoomIn, ZoomOut } from 'lucide-react';
import { SheetMusic, SheetRegion, Section, getNextRegionColor } from '@/types';

interface SheetMusicEditorProps {
  sheetMusic: SheetMusic | null;
  sections: Section[];
  onSheetMusicChange: (sheetMusic: SheetMusic | null) => void;
  isDark?: boolean;
}

export default function SheetMusicEditor({
  sheetMusic,
  sections,
  onSheetMusicChange,
  isDark = false,
}: SheetMusicEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawEnd, setDrawEnd] = useState<{ x: number; y: number } | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [showSectionSelector, setShowSectionSelector] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  const bgClass = isDark ? 'bg-gray-800' : 'bg-white';
  const textClass = isDark ? 'text-white' : 'text-gray-900';
  const subTextClass = isDark ? 'text-gray-400' : 'text-gray-500';
  const borderClass = isDark ? 'border-gray-700' : 'border-gray-200';

  // 이미지 업로드 핸들러
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;

      // 이미지 크기 얻기
      const img = new Image();
      img.onload = () => {
        const newSheetMusic: SheetMusic = {
          id: `sheet-${Date.now()}`,
          imageData,
          originalWidth: img.width,
          originalHeight: img.height,
          regions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        onSheetMusicChange(newSheetMusic);
      };
      img.src = imageData;
    };
    reader.readAsDataURL(file);
  };

  // 마우스/터치 좌표를 비율로 변환
  const getRelativePosition = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
  }, []);

  // 드래그 시작
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!sheetMusic) return;

    const pos = getRelativePosition(e.clientX, e.clientY);
    if (!pos) return;

    // 기존 영역 클릭 체크
    const clickedRegion = sheetMusic.regions.find(region => {
      return (
        pos.x >= region.x &&
        pos.x <= region.x + region.width &&
        pos.y >= region.y &&
        pos.y <= region.y + region.height
      );
    });

    if (clickedRegion) {
      setSelectedRegionId(clickedRegion.id);
      return;
    }

    // 새 영역 그리기 시작
    setSelectedRegionId(null);
    setShowSectionSelector(null);
    setIsDrawing(true);
    setDrawStart(pos);
    setDrawEnd(pos);

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [sheetMusic, getRelativePosition]);

  // 드래그 중
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDrawing) return;

    const pos = getRelativePosition(e.clientX, e.clientY);
    if (pos) {
      setDrawEnd(pos);
    }
  }, [isDrawing, getRelativePosition]);

  // 드래그 종료
  const handlePointerUp = useCallback(() => {
    if (!isDrawing || !drawStart || !drawEnd || !sheetMusic) {
      setIsDrawing(false);
      return;
    }

    // 최소 크기 체크
    const width = Math.abs(drawEnd.x - drawStart.x);
    const height = Math.abs(drawEnd.y - drawStart.y);

    if (width > 0.02 && height > 0.02) {
      const newRegion: SheetRegion = {
        id: `region-${Date.now()}`,
        x: Math.min(drawStart.x, drawEnd.x),
        y: Math.min(drawStart.y, drawEnd.y),
        width,
        height,
        sectionId: null,
        order: sheetMusic.regions.length,
        color: getNextRegionColor(sheetMusic.regions),
      };

      const updatedSheetMusic: SheetMusic = {
        ...sheetMusic,
        regions: [...sheetMusic.regions, newRegion],
        updatedAt: new Date().toISOString(),
      };

      onSheetMusicChange(updatedSheetMusic);
      setSelectedRegionId(newRegion.id);
    }

    setIsDrawing(false);
    setDrawStart(null);
    setDrawEnd(null);
  }, [isDrawing, drawStart, drawEnd, sheetMusic, onSheetMusicChange]);

  // 영역 삭제
  const deleteRegion = useCallback((regionId: string) => {
    if (!sheetMusic) return;

    const updatedSheetMusic: SheetMusic = {
      ...sheetMusic,
      regions: sheetMusic.regions.filter(r => r.id !== regionId),
      updatedAt: new Date().toISOString(),
    };

    onSheetMusicChange(updatedSheetMusic);
    setSelectedRegionId(null);
    setShowSectionSelector(null);
  }, [sheetMusic, onSheetMusicChange]);

  // 영역에 섹션 연결
  const linkSectionToRegion = useCallback((regionId: string, sectionId: number | null) => {
    if (!sheetMusic) return;

    const updatedSheetMusic: SheetMusic = {
      ...sheetMusic,
      regions: sheetMusic.regions.map(r =>
        r.id === regionId ? { ...r, sectionId } : r
      ),
      updatedAt: new Date().toISOString(),
    };

    onSheetMusicChange(updatedSheetMusic);
    setShowSectionSelector(null);
  }, [sheetMusic, onSheetMusicChange]);

  // 이미지 삭제
  const deleteSheetMusic = useCallback(() => {
    if (confirm('악보를 삭제하시겠습니까?')) {
      onSheetMusicChange(null);
    }
  }, [onSheetMusicChange]);

  // 선택된 영역 정보
  const selectedRegion = sheetMusic?.regions.find(r => r.id === selectedRegionId);
  const linkedSection = selectedRegion?.sectionId
    ? sections.find(s => s.id === selectedRegion.sectionId)
    : null;

  if (!sheetMusic) {
    return (
      <div className={`${bgClass} rounded-xl border ${borderClass} p-4`}>
        <label className={`flex flex-col items-center py-8 border-2 border-dashed rounded-xl cursor-pointer ${
          isDark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'
        }`}>
          <Upload className={`w-8 h-8 mb-2 ${subTextClass}`} />
          <span className={`text-sm font-medium ${textClass}`}>악보 이미지 업로드</span>
          <span className={`text-xs mt-1 ${subTextClass}`}>클릭하여 파일 선택</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </label>
      </div>
    );
  }

  return (
    <div className={`${bgClass} rounded-xl border ${borderClass}`}>
      {/* 상단 툴바 */}
      <div className={`flex items-center justify-between p-3 border-b ${borderClass}`}>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${textClass}`}>악보</span>
          <span className={`text-xs ${subTextClass}`}>
            영역 {sheetMusic.regions.length}개
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
            className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            title="축소"
          >
            <ZoomOut className={`w-4 h-4 ${subTextClass}`} />
          </button>
          <span className={`text-xs ${subTextClass} w-12 text-center`}>{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(z => Math.min(2, z + 0.25))}
            className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            title="확대"
          >
            <ZoomIn className={`w-4 h-4 ${subTextClass}`} />
          </button>
          <div className={`w-px h-4 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
          <label className={`p-1.5 rounded-lg cursor-pointer ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`} title="이미지 교체">
            <Upload className={`w-4 h-4 ${subTextClass}`} />
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
          <button
            onClick={deleteSheetMusic}
            className={`p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30`}
            title="악보 삭제"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </div>

      {/* 이미지 영역 */}
      <div className="p-3 overflow-auto max-h-96">
        <div
          ref={containerRef}
          className="relative select-none cursor-crosshair"
          style={{
            width: `${zoom * 100}%`,
            touchAction: 'none',
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <img
            src={sheetMusic.imageData}
            alt="악보"
            className="w-full h-auto pointer-events-none"
            draggable={false}
          />

          {/* 기존 영역들 */}
          {sheetMusic.regions.map((region) => {
            const section = region.sectionId
              ? sections.find(s => s.id === region.sectionId)
              : null;
            const isSelected = region.id === selectedRegionId;

            return (
              <div
                key={region.id}
                className={`absolute border-2 transition-all ${
                  isSelected ? 'border-solid' : 'border-dashed'
                }`}
                style={{
                  left: `${region.x * 100}%`,
                  top: `${region.y * 100}%`,
                  width: `${region.width * 100}%`,
                  height: `${region.height * 100}%`,
                  borderColor: region.color || '#3B82F6',
                  backgroundColor: `${region.color || '#3B82F6'}20`,
                }}
              >
                {/* 영역 라벨 */}
                <div
                  className="absolute -top-5 left-0 px-1.5 py-0.5 rounded text-xs text-white whitespace-nowrap"
                  style={{ backgroundColor: region.color || '#3B82F6' }}
                >
                  {section ? `구간 ${sections.indexOf(section) + 1}` : `영역 ${region.order + 1}`}
                </div>
              </div>
            );
          })}

          {/* 그리는 중인 영역 */}
          {isDrawing && drawStart && drawEnd && (
            <div
              className="absolute border-2 border-dashed border-blue-500 bg-blue-500/20"
              style={{
                left: `${Math.min(drawStart.x, drawEnd.x) * 100}%`,
                top: `${Math.min(drawStart.y, drawEnd.y) * 100}%`,
                width: `${Math.abs(drawEnd.x - drawStart.x) * 100}%`,
                height: `${Math.abs(drawEnd.y - drawStart.y) * 100}%`,
              }}
            />
          )}
        </div>
      </div>

      {/* 선택된 영역 정보 */}
      {selectedRegion && (
        <div className={`p-3 border-t ${borderClass}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: selectedRegion.color }}
              />
              <span className={`text-sm ${textClass}`}>
                {linkedSection
                  ? `구간 ${sections.indexOf(linkedSection) + 1} 연결됨`
                  : '연결된 구간 없음'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSectionSelector(selectedRegion.id)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                  isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                }`}
              >
                <Link2 className="w-3 h-3" />
                구간 연결
              </button>
              <button
                onClick={() => deleteRegion(selectedRegion.id)}
                className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          </div>

          {/* 섹션 선택 드롭다운 */}
          {showSectionSelector === selectedRegion.id && (
            <div className={`mt-2 p-2 rounded-lg border ${borderClass} ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs ${subTextClass}`}>구간 선택:</span>
                <button
                  onClick={() => setShowSectionSelector(null)}
                  className={`p-0.5 rounded ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                >
                  <X className={`w-3 h-3 ${subTextClass}`} />
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => linkSectionToRegion(selectedRegion.id, null)}
                  className={`px-2 py-1 rounded text-xs ${
                    !selectedRegion.sectionId
                      ? 'bg-blue-500 text-white'
                      : isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  없음
                </button>
                {sections.map((section, idx) => (
                  <button
                    key={section.id}
                    onClick={() => linkSectionToRegion(selectedRegion.id, section.id)}
                    className={`px-2 py-1 rounded text-xs ${
                      selectedRegion.sectionId === section.id
                        ? 'bg-blue-500 text-white'
                        : isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    구간 {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 안내 메시지 */}
      <div className={`px-3 py-2 border-t ${borderClass}`}>
        <p className={`text-xs ${subTextClass}`}>
          드래그하여 영역을 그리고, 클릭하여 선택 후 구간과 연결하세요
        </p>
      </div>
    </div>
  );
}
