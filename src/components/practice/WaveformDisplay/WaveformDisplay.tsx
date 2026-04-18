'use client';

import React, { memo } from 'react';
import { Upload, Play, Pause, SkipBack, SkipForward, Repeat } from 'lucide-react';
import { formatTime } from '@/utils/formatTime';
import { usePracticeContext } from '@/contexts/PracticeContext';
import { useWaveformRenderer } from './useWaveformRenderer';
import WaveformCanvas from '@/components/practice/WaveformCanvas';
import ZoomControls from '@/components/practice/ZoomControls';
import ScrollControl from '@/components/practice/ScrollControl';

const WaveformDisplay = memo(function WaveformDisplay() {
  const {
    audioBuffer, isLoadingAudio, duration, waveformData, currentTime, isPlaying,
    sections, selectedSection, setSelectedSection, setCurrentTime, playAudio,
    handleAudioUpload, playbackRate, setPlaybackRate, isLooping, setIsLooping,
    isDark, stopPlayback,
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
      <div className="animate-pulse">
        <div className={`h-20 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-200'} mb-3`} />
        <div className="flex justify-between">
          <div className={`h-4 w-12 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
          <div className={`h-4 w-12 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
        </div>
      </div>
    );
  }

  // --- Upload prompt ---
  if (!audioBuffer) {
    return (
      <div className={`border-2 border-dashed rounded-xl p-6 ${isDark ? 'border-gray-600' : 'border-purple-300'}`}>
        <label className="flex flex-col items-center cursor-pointer">
          <Upload className={`w-8 h-8 mb-2 ${isDark ? 'text-purple-400' : 'text-purple-500'}`} />
          <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            원곡 파일 업로드
          </span>
          <span className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            MP3, WAV, M4A 지원
          </span>
          <input type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />
        </label>
      </div>
    );
  }

  // --- Waveform display ---
  const displayTime = isSeeking && dragStart !== null ? dragStart : currentTime;

  return (
    <div>
      {/* Waveform + Controls Header */}
      <div className="flex items-center justify-between mb-2">
        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {isCreatingSection ? '드래그로 구간 선택' : '클릭으로 위치 이동'}
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

      {/* Waveform Canvas */}
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

      {/* Scroll Control */}
      {zoomLevel !== 'full' && (
        <ScrollControl
          scrollPosition={scrollPosition}
          onScrollChange={setScrollPosition}
          visibleStart={getVisibleTimeRange().start}
          visibleEnd={getVisibleTimeRange().end}
        />
      )}

      {/* Time Display */}
      <div className="flex justify-between text-xs mt-2">
        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
          {formatTime(currentTime)}
        </span>
        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
          {formatTime(duration)}
        </span>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center justify-center gap-2 mt-4">
        {/* Skip to Beginning */}
        <button
          onClick={handleSkipToBeginning}
          className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
        >
          <SkipBack className="w-5 h-5" />
        </button>

        {/* Play/Pause */}
        <button
          onClick={() => {
            if (isPlaying) {
              handlePauseWithTracking();
            } else {
              handlePlayWithTracking();
            }
          }}
          className={`w-12 h-12 rounded-full flex items-center justify-center ${
            isPlaying
              ? isDark ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-500 hover:bg-purple-600'
              : isDark ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-500 hover:bg-purple-600'
          } text-white`}
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>

        {/* Loop Toggle */}
        <button
          onClick={() => setIsLooping((prev) => !prev)}
          className={`p-2 rounded-lg ${
            isLooping
              ? isDark ? 'bg-purple-600/30 text-purple-400' : 'bg-purple-100 text-purple-600'
              : isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
          }`}
        >
          <Repeat className="w-5 h-5" />
        </button>

        {/* Playback Rate */}
        <select
          value={playbackRate}
          onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
          className={`text-xs px-2 py-1 rounded-lg ${
            isDark 
              ? 'bg-gray-700 text-gray-300 border-gray-600' 
              : 'bg-gray-100 text-gray-600 border-gray-200'
          } border`}
        >
          <option value={0.5}>0.5x</option>
          <option value={0.75}>0.75x</option>
          <option value={1}>1x</option>
          <option value={1.25}>1.25x</option>
          <option value={1.5}>1.5x</option>
        </select>
      </div>

      {/* File Replace Option */}
      <div className="mt-4 text-center">
        <label className={`text-xs cursor-pointer ${isDark ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-500'}`}>
          다른 파일로 교체
          <input type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />
        </label>
      </div>
    </div>
  );
});

export default WaveformDisplay;
