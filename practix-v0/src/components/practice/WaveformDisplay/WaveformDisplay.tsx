'use client';

import React, { memo } from 'react';
import { Upload, Play, Pause, Plus, Flag } from 'lucide-react';
import { formatTime } from '@/utils/formatTime';
import { usePracticeContext } from '@/contexts/PracticeContext';
import { useWaveformRenderer } from './useWaveformRenderer';
import WaveformCanvas from '@/components/practice/WaveformCanvas';
import ZoomControls from '@/components/practice/ZoomControls';
import ScrollControl from '@/components/practice/ScrollControl';
import BottomControlBar from '@/components/practice/BottomControlBar';

const WaveformDisplay = memo(function WaveformDisplay() {
  const {
    audioBuffer, isLoadingAudio, duration, waveformData, currentTime, isPlaying,
    sections, selectedSection, setSelectedSection, setCurrentTime, playAudio,
    handleAudioUpload, playbackRate, setPlaybackRate, isLooping, setIsLooping,
    isDark,
  } = usePracticeContext();

  const {
    zoomLevel, setZoomLevel, scrollPosition, setScrollPosition,
    isCreatingSection, setIsCreatingSection, isDragging, dragStart, dragEnd, isSeeking,
    handleCanvasMouseDown, handleCanvasMouseMove, handleCanvasMouseUp, getVisibleTimeRange,
    sectionMarkStart, setSectionMarkStart,
    playbackStartPosition, showCreateSectionButton,
    handleCreateSectionFromPlayback, setShowCreateSectionButton, setPlaybackStartPosition,
    handleSkipToBeginning, handleSkipBack, handlePlayWithTracking, handlePauseWithTracking,
    handleSectionMarker,
  } = useWaveformRenderer();

  // --- Loading skeleton ---
  if (isLoadingAudio) {
    return (
      <div className="mb-6">
        <div className="animate-pulse">
          <div className={`flex items-center justify-between mb-4 pb-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
              <div>
                <div className={`h-4 w-24 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} mb-1`} />
                <div className={`h-3 w-16 rounded ${isDark ? 'bg-gray-600' : 'bg-gray-100'}`} />
              </div>
            </div>
            <div className={`h-8 w-12 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
          </div>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <div className={`h-3 w-32 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
              <div className={`h-6 w-20 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
            </div>
            <div className={`h-24 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-200'} relative overflow-hidden`}>
              <div className="absolute inset-0 flex items-center justify-center gap-0.5 px-2">
                {Array.from({ length: 60 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`}
                    style={{ height: `${20 + Math.sin(i * 0.3) * 15 + Math.random() * 20}%` }}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-between mt-2">
              <div className={`h-3 w-10 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
              <div className={`h-3 w-10 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Upload prompt ---
  if (!audioBuffer) {
    return (
      <div className="border-2 border-dashed border-purple-300 rounded-xl p-6 mb-6">
        <label className="flex flex-col items-center cursor-pointer">
          <Upload className="w-8 h-8 text-purple-500 mb-2" />
          <span className="text-sm font-medium text-gray-700">원곡 파일 업로드</span>
          <input type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />
        </label>
      </div>
    );
  }

  // --- Waveform display ---
  const displayTime = isSeeking && dragStart !== null ? dragStart : currentTime;

  return (
    <>
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-purple-500 text-white p-2 rounded-lg">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">원곡 파일 업로드됨</p>
            <p className="text-xs text-gray-600">길이: {formatTime(duration)}</p>
          </div>
        </div>
        <label className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm cursor-pointer">
          파일 교체
          <input type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />
        </label>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm text-gray-600">
            {isCreatingSection ? '🎯 드래그하여 구간 선택' : '▶️ 클릭하여 위치 이동'}
          </p>
          <ZoomControls
            zoomLevel={zoomLevel}
            onZoomChange={(level) => {
              setZoomLevel(level);
              if (level === 'full') setScrollPosition(0);
            }}
            isCreatingSection={isCreatingSection}
            onToggleCreatingSection={() => setIsCreatingSection(!isCreatingSection)}
          />
        </div>
        <WaveformCanvas
          duration={duration}
          currentTime={displayTime}
          sections={sections}
          selectedSection={selectedSection}
          isPlaying={isPlaying}
          waveformData={waveformData}
          zoomLevel={zoomLevel}
          scrollPosition={scrollPosition}
          isCreatingSection={isCreatingSection}
          isDragging={isDragging}
          dragStart={dragStart}
          dragEnd={dragEnd}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          sectionMarkStart={sectionMarkStart}
        />
        {zoomLevel !== 'full' && (
          <ScrollControl
            scrollPosition={scrollPosition}
            onScrollChange={setScrollPosition}
            visibleStart={getVisibleTimeRange().start}
            visibleEnd={getVisibleTimeRange().end}
          />
        )}
        <div className="flex justify-between text-sm text-gray-600 mt-2">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <button
          onClick={togglePlayPause}
          className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          {isPlaying ? '일시정지' : '재생'}
        </button>
      </div>
    </>
  );

  function togglePlayPause() {
    if (isPlaying) {
      handlePauseWithTracking();
    } else {
      handlePlayWithTracking();
    }
  }
});

export default WaveformDisplay;
