'use client';

import { useRef, useState, useCallback, memo } from 'react';
import { Play, Pause, Volume2, VolumeX, Repeat, Settings2, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { Section, Recording, BackingTrack, TimeSignature } from '@/types';
import { formatTime } from '@/utils/formatTime';
import { useAudioCompare } from './useAudioCompare';
import { computeAutoSync } from '@/utils/autoSync';
import { hasMetronomeSync } from '@/utils/backingTrackSync';
import MetronomeBeatIndicator from '../MetronomeBeatIndicator';
import MiniWaveform from '../MiniWaveform';

interface AudioComparePlayerProps {
  // Core data
  audioContext: AudioContext | null;
  originalBuffer: AudioBuffer | null;
  recordedBuffer: AudioBuffer | null;
  section: Section;
  recording: Recording;
  sectionStart: number;
  sectionEnd: number;

  // Recording navigation (for swipe)
  allRecordings?: Recording[];
  currentRecordingIndex?: number;
  onRecordingChange?: (index: number) => void;

  // Backing track (still controlled externally)
  backingTrack: BackingTrack | null;
  backingTrackCurrentTime: number;
  backingTrackDuration: number;
  backingTrackIsPlaying: boolean;
  onBackingTrackToggle: () => void;
  onBackingTrackSeek: (time: number) => void;
  backingTrackVolume: number;
  onBackingTrackVolumeChange: (volume: number) => void;

  // Metronome visual
  metronomeBeat: number;
  metronomeBpm: number;
  metronomeIsPlaying: boolean;
  metronomeBeatsPerMeasure: number;
  metronomeTimeSignature: TimeSignature;

  // Optional callbacks
  onSyncEdit?: () => void;
  onAutoSync?: (offset: number) => void;

  // Loop (for backing track sync)
  isLooping: boolean;
  onLoopToggle: () => void;
}

const PLAYBACK_RATES = [0.25, 0.5, 0.6, 0.7, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 2];

function AudioComparePlayer({
  audioContext,
  originalBuffer,
  recordedBuffer,
  section,
  recording,
  sectionStart,
  sectionEnd,
  backingTrack,
  backingTrackCurrentTime,
  backingTrackDuration,
  backingTrackIsPlaying,
  onBackingTrackToggle,
  onBackingTrackSeek,
  backingTrackVolume,
  onBackingTrackVolumeChange,
  metronomeBeat,
  metronomeBpm,
  metronomeIsPlaying,
  metronomeBeatsPerMeasure,
  metronomeTimeSignature,
  onSyncEdit,
  onAutoSync,
  isLooping,
  onLoopToggle,
  allRecordings,
  currentRecordingIndex = 0,
  onRecordingChange,
}: AudioComparePlayerProps) {
  const sectionDuration = sectionEnd - sectionStart;

  // Auto sync state
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);

  // Swipe state for recording navigation
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);

  const hasMultipleRecordings = allRecordings && allRecordings.length > 1;
  const totalRecordings = allRecordings?.length || 0;

  // Haptic feedback
  const vibrate = useCallback((pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  // Helper for loop navigation
  const goToPrev = useCallback(() => {
    if (!onRecordingChange || !hasMultipleRecordings) return;
    const newIndex = currentRecordingIndex === 0
      ? totalRecordings - 1
      : currentRecordingIndex - 1;
    onRecordingChange(newIndex);
    vibrate(10);
  }, [currentRecordingIndex, totalRecordings, onRecordingChange, hasMultipleRecordings, vibrate]);

  const goToNext = useCallback(() => {
    if (!onRecordingChange || !hasMultipleRecordings) return;
    const newIndex = currentRecordingIndex === totalRecordings - 1
      ? 0
      : currentRecordingIndex + 1;
    onRecordingChange(newIndex);
    vibrate(10);
  }, [currentRecordingIndex, totalRecordings, onRecordingChange, hasMultipleRecordings, vibrate]);

  // Swipe handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!hasMultipleRecordings) return;
    setTouchStartX(e.touches[0].clientX);
  }, [hasMultipleRecordings]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartX === null || !hasMultipleRecordings) return;
    const diff = e.touches[0].clientX - touchStartX;
    // Limit swipe distance
    setSwipeOffset(Math.max(-100, Math.min(100, diff * 0.5)));
  }, [touchStartX, hasMultipleRecordings]);

  const handleTouchEnd = useCallback(() => {
    if (touchStartX === null || !hasMultipleRecordings || !onRecordingChange) {
      setTouchStartX(null);
      setSwipeOffset(0);
      return;
    }

    // Swipe threshold - loop navigation
    if (swipeOffset > 50) {
      goToPrev();
    } else if (swipeOffset < -50) {
      goToNext();
    }

    setTouchStartX(null);
    setSwipeOffset(0);
  }, [touchStartX, hasMultipleRecordings, onRecordingChange, swipeOffset, goToPrev, goToNext]);

  // Use independent playback hook
  const {
    originalCurrentTime,
    originalIsPlaying,
    originalVolume,
    setOriginalVolume,
    playOriginal,
    pauseOriginal,
    seekOriginal,
    recordedCurrentTime,
    recordedIsPlaying,
    recordedVolume,
    setRecordedVolume,
    playRecorded,
    pauseRecorded,
    seekRecorded,
    playBoth,
    resetBoth,
    stopAll,
    playbackRate,
    setPlaybackRate,
  } = useAudioCompare({
    audioContext,
    originalBuffer,
    recordedBuffer,
    sectionStart,
    sectionEnd,
    syncOffset: recording.syncOffset,
    isLooping,
  });

  // Auto sync handler
  const handleAutoSync = useCallback(() => {
    if (!originalBuffer || !recordedBuffer || !onAutoSync || isAutoSyncing) return;
    setIsAutoSyncing(true);

    // Run in next tick to allow UI to update
    setTimeout(() => {
      try {
        const result = computeAutoSync(
          originalBuffer,
          recordedBuffer,
          sectionStart,
          sectionEnd,
          2, // ±2 seconds search range
        );
        onAutoSync(result.offsetSeconds);
      } catch {
        // Silently fail
      } finally {
        setIsAutoSyncing(false);
      }
    }, 50);
  }, [originalBuffer, recordedBuffer, sectionStart, sectionEnd, onAutoSync, isAutoSyncing]);

  // Drag state for progress bars
  const [isDraggingProgress, setIsDraggingProgress] = useState<string | null>(null);
  const [dragProgressTime, setDragProgressTime] = useState(0);

  // Mute state - stores previous volume before muting
  const prevOriginalVolume = useRef(originalVolume);
  const prevBackingVolume = useRef(backingTrackVolume);
  const prevRecordedVolume = useRef(recordedVolume);

  const toggleOriginalMute = () => {
    if (originalVolume > 0) {
      prevOriginalVolume.current = originalVolume;
      setOriginalVolume(0);
    } else {
      setOriginalVolume(prevOriginalVolume.current || 1);
    }
  };

  const toggleBackingMute = () => {
    if (backingTrackVolume > 0) {
      prevBackingVolume.current = backingTrackVolume;
      onBackingTrackVolumeChange(0);
    } else {
      onBackingTrackVolumeChange(prevBackingVolume.current || 1);
    }
  };

  const toggleRecordedMute = () => {
    if (recordedVolume > 0) {
      prevRecordedVolume.current = recordedVolume;
      setRecordedVolume(0);
    } else {
      setRecordedVolume(prevRecordedVolume.current || 1);
    }
  };

  // Calculate balance position (0 = full original, 1 = full recorded)
  const balance = recordedVolume / (originalVolume + recordedVolume || 1);

  const handleBalanceChange = (newBalance: number) => {
    if (newBalance <= 0.5) {
      setOriginalVolume(1);
      setRecordedVolume(newBalance * 2);
    } else {
      setOriginalVolume((1 - newBalance) * 2);
      setRecordedVolume(1);
    }
  };

  const handleOriginalToggle = () => {
    if (originalIsPlaying) {
      pauseOriginal();
    } else {
      playOriginal();
    }
  };

  const handleRecordedToggle = () => {
    if (recordedIsPlaying) {
      pauseRecorded();
    } else {
      playRecorded();
    }
  };

  const handlePlayAll = () => {
    playBoth();
    // Also start backing track
    if (backingTrack && !backingTrackIsPlaying) {
      onBackingTrackToggle();
    }
  };

  const handleResetBoth = () => {
    resetBoth();
    // Also reset backing track
    if (backingTrack) {
      onBackingTrackSeek(0);
    }
  };

  const recordedDuration = recordedBuffer?.duration || 0;

  return (
    <div className="bg-card rounded-xl p-4 border border-border">
      {/* Header with global controls */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-foreground flex items-center gap-2">
          A/B 비교 플레이어
          <span className="text-xs text-muted-foreground font-normal">({recording.name})</span>
        </h4>
        <div className="flex items-center gap-2">
          {/* Loop toggle */}
          <button
            onClick={onLoopToggle}
            className={`p-1.5 rounded-lg transition-colors ${
              isLooping ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
            title="구간 반복"
          >
            <Repeat className="w-4 h-4" />
          </button>
          {/* Playback rate */}
          <select
            value={playbackRate}
            onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
            className={`text-xs px-2 py-1.5 rounded border bg-background font-medium ${
              playbackRate !== 1
                ? 'border-accent text-accent'
                : 'border-border text-foreground'
            }`}
            title="재생 속도"
          >
            {PLAYBACK_RATES.map((rate) => (
              <option key={rate} value={rate}>
                {rate}x {rate === 1 ? '(기본)' : rate < 1 ? '느리게' : '빠르게'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* A/B Balance Slider */}
      <div className="bg-secondary/50 rounded-lg p-3 mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-blue-600">원곡</span>
          <span className="text-xs text-muted-foreground">A/B 밸런스</span>
          <span className="text-xs font-medium text-red-600">녹음</span>
        </div>
        <div className="relative">
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={balance}
            onChange={(e) => handleBalanceChange(parseFloat(e.target.value))}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            style={{ touchAction: 'none' }}
            className="relative w-full h-4 bg-transparent rounded-full appearance-none cursor-pointer z-10
              [&::-webkit-slider-track]:bg-secondary [&::-webkit-slider-track]:rounded-full [&::-webkit-slider-track]:h-2
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-card [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-accent [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer
              [&::-moz-range-track]:bg-secondary [&::-moz-range-track]:rounded-full [&::-moz-range-track]:h-2
              [&::-moz-range-thumb]:w-7 [&::-moz-range-thumb]:h-7 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-card [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-accent [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0"
          />
        </div>
        <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
          <span>{Math.round((1 - balance) * 100)}%</span>
          <span className="text-accent font-medium">
            {balance === 0.5 ? '동시 재생' : balance < 0.5 ? '원곡 중심' : '녹음 중심'}
          </span>
          <span>{Math.round(balance * 100)}%</span>
        </div>
      </div>

      {/* Original Track */}
      <div className="bg-blue-100 rounded-lg p-3 mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-blue-900">🔵 원곡</span>
          <span className="text-xs text-blue-700">
            {formatTime(originalCurrentTime)} / {formatTime(sectionDuration)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOriginalToggle}
            className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg flex-shrink-0"
          >
            {originalIsPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <MiniWaveform
            buffer={originalBuffer}
            currentTime={originalCurrentTime}
            duration={sectionDuration}
            onSeek={seekOriginal}
            color="blue"
            height={36}
          />
          {/* Volume control */}
          <div className="flex items-center gap-1">
            <button
              onClick={toggleOriginalMute}
              className="p-0.5 hover:bg-blue-200 rounded transition-colors"
              title={originalVolume === 0 ? '음소거 해제' : '음소거'}
            >
              {originalVolume === 0 ? (
                <VolumeX className="w-4 h-4 text-blue-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-blue-600" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={originalVolume}
              onChange={(e) => setOriginalVolume(parseFloat(e.target.value))}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
              style={{ touchAction: 'none' }}
              className="w-20 h-2 bg-blue-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600"
              title={`볼륨: ${Math.round(originalVolume * 100)}%`}
            />
          </div>
        </div>
      </div>

      {/* Backing Track (if available) */}
      {backingTrack && (
        <div className="bg-green-100 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-900">
              🟢 반주 ({backingTrack.type === 'mr' ? 'MR' : backingTrack.type === 'metronome' ? '메트로놈' : '커스텀'})
            </span>
            {backingTrack.type !== 'metronome' && (
              <span className="text-xs text-green-700">
                {formatTime(backingTrackCurrentTime)} / {formatTime(backingTrackDuration)}
              </span>
            )}
          </div>

          {/* Metronome Visual Beat Indicator */}
          {(backingTrack.type === 'metronome' || hasMetronomeSync(backingTrack)) && (
            <MetronomeBeatIndicator
              currentBeat={metronomeBeat}
              bpm={metronomeBpm}
              isPlaying={metronomeIsPlaying}
              beatsPerMeasure={metronomeBeatsPerMeasure}
              timeSignature={metronomeTimeSignature}
            />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onBackingTrackToggle}
              className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg flex-shrink-0"
            >
              {backingTrackIsPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            {backingTrack.type !== 'metronome' ? (
              <div className="flex-1 relative">
                <input
                  type="range"
                  min="0"
                  max={backingTrackDuration}
                  step="0.1"
                  value={backingTrackCurrentTime}
                  onChange={(e) => {
                    const time = parseFloat(e.target.value);
                    setDragProgressTime(time);
                    onBackingTrackSeek(time);
                  }}
                  onMouseDown={() => setIsDraggingProgress('backing')}
                  onMouseUp={() => setIsDraggingProgress(null)}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    setIsDraggingProgress('backing');
                  }}
                  onTouchMove={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    setIsDraggingProgress(null);
                  }}
                  style={{ touchAction: 'none' }}
                  className="w-full h-2 bg-green-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-green-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-green-600 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                />
                {isDraggingProgress === 'backing' && (
                  <div
                    className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-2 py-1 rounded text-xs font-medium whitespace-nowrap"
                    style={{
                      left: `${(dragProgressTime / (backingTrackDuration || 1)) * 100}%`,
                    }}
                  >
                    {formatTime(dragProgressTime)}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 text-center text-sm text-green-700">
                {metronomeIsPlaying ? '재생 중...' : '재생 버튼을 눌러 시작'}
              </div>
            )}
            {/* Volume control */}
            <div className="flex items-center gap-1">
              <button
                onClick={toggleBackingMute}
                className="p-0.5 hover:bg-green-200 rounded transition-colors"
                title={backingTrackVolume === 0 ? '음소거 해제' : '음소거'}
              >
                {backingTrackVolume === 0 ? (
                  <VolumeX className="w-4 h-4 text-green-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-green-600" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={backingTrackVolume}
                onChange={(e) => onBackingTrackVolumeChange(parseFloat(e.target.value))}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                style={{ touchAction: 'none' }}
                className="w-20 h-2 bg-green-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-green-600"
                title={`볼륨: ${Math.round(backingTrackVolume * 100)}%`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Recorded Track - with swipe support */}
      <div
        className="bg-red-100 rounded-lg p-3 mb-3 relative overflow-hidden select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: swipeOffset === 0 ? 'transform 0.2s ease-out' : 'none',
        }}
      >

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-red-900">🔴 내 녹음</span>
            {hasMultipleRecordings && (
              <span className="text-[10px] px-1.5 py-0.5 bg-red-200 text-red-700 rounded">
                {currentRecordingIndex + 1}/{allRecordings!.length}
              </span>
            )}
            {recording.syncOffset !== undefined && recording.syncOffset !== 0 && (
              <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded">
                {recording.syncOffset > 0 ? '+' : ''}{recording.syncOffset.toFixed(2)}s
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onAutoSync && (
              <button
                onClick={handleAutoSync}
                disabled={isAutoSyncing}
                className={`px-2 py-1 text-[10px] font-medium rounded flex items-center gap-1 ${
                  isAutoSyncing
                    ? 'bg-gray-200 text-gray-400'
                    : 'bg-purple-100 text-purple-600 active:bg-purple-200'
                }`}
                title="자동 싱크"
              >
                <Zap className="w-3 h-3" />
                {isAutoSyncing ? '분석중...' : 'Auto'}
              </button>
            )}
            {onSyncEdit && (
              <button
                onClick={onSyncEdit}
                className="p-1 hover:bg-red-200 rounded transition-colors"
                title="싱크 편집"
              >
                <Settings2 className="w-4 h-4 text-red-600" />
              </button>
            )}
            <span className="text-xs text-red-700">
              {formatTime(recordedCurrentTime)} / {formatTime(recordedDuration)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRecordedToggle}
            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg flex-shrink-0"
          >
            {recordedIsPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <MiniWaveform
            buffer={recordedBuffer}
            currentTime={recordedCurrentTime}
            duration={recordedDuration}
            onSeek={seekRecorded}
            color="red"
            height={36}
          />
          {/* Volume control */}
          <div className="flex items-center gap-1">
            <button
              onClick={toggleRecordedMute}
              className="p-0.5 hover:bg-red-200 rounded transition-colors"
              title={recordedVolume === 0 ? '음소거 해제' : '음소거'}
            >
              {recordedVolume === 0 ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-red-600" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={recordedVolume}
              onChange={(e) => setRecordedVolume(parseFloat(e.target.value))}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
              style={{ touchAction: 'none' }}
              className="w-20 h-2 bg-red-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-600"
              title={`볼륨: ${Math.round(recordedVolume * 100)}%`}
            />
          </div>
        </div>

        {/* Recording name and navigation */}
        {hasMultipleRecordings && (
          <div className="mt-2 flex items-center justify-between gap-2">
            {/* Previous button - always enabled for loop */}
            <button
              onClick={goToPrev}
              className="p-2 rounded-lg transition-colors bg-red-200 text-red-700 active:bg-red-300"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Recording name and dots */}
            <div className="flex-1 flex flex-col items-center min-w-0">
              <span className="text-xs text-red-700 truncate max-w-full">
                {recording.name || `녹음 ${currentRecordingIndex + 1}`}
              </span>
              <div className="flex items-center gap-1 mt-1">
                {totalRecordings <= 7 ? (
                  // Show all dots if 7 or fewer
                  allRecordings!.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => onRecordingChange?.(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === currentRecordingIndex
                          ? 'bg-red-500 scale-125'
                          : 'bg-red-300'
                      }`}
                    />
                  ))
                ) : (
                  // Show limited dots with number indicator
                  <>
                    <span className="text-[10px] text-red-600 font-medium">
                      {currentRecordingIndex + 1} / {totalRecordings}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Next button - always enabled for loop */}
            <button
              onClick={goToNext}
              className="p-2 rounded-lg transition-colors bg-red-200 text-red-700 active:bg-red-300"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Recording name when single */}
        {!hasMultipleRecordings && (
          <div className="mt-2">
            <span className="text-xs text-red-700 truncate">
              {recording.name || '녹음'}
            </span>
          </div>
        )}
      </div>

      {/* Sync Controls */}
      <div className="flex gap-2">
        <button
          onClick={playBoth}
          className="flex-1 bg-accent hover:opacity-90 text-accent-foreground py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-opacity"
        >
          <Play className="w-4 h-4" />
          원곡+녹음
        </button>
        {backingTrack && (
          <button
            onClick={handlePlayAll}
            className="flex-1 bg-success hover:opacity-90 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-opacity"
          >
            <Play className="w-4 h-4" />
            전체 재생
          </button>
        )}
        <button
          onClick={handleResetBoth}
          className="px-4 bg-secondary hover:bg-secondary/80 text-secondary-foreground py-2 rounded-lg text-sm font-medium transition-colors"
        >
          처음으로
        </button>
      </div>
    </div>
  );
}

export default memo(AudioComparePlayer);
