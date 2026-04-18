'use client';

import { useRef, useState, memo } from 'react';
import { Play, Pause, SkipBack, SkipForward, Repeat, ChevronsLeft, Flag } from 'lucide-react';
import { formatTime } from '@/utils/formatTime';

interface BottomControlBarProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  playbackRate: number;
  isLooping: boolean;
  sectionMarkStart: number | null;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onPlayFromTime: (time: number) => void;
  onSkipBack: () => void;
  onSkipForward: () => void;
  onSkipToBeginning: () => void;
  onSectionMarker: () => void;
  onLoopToggle: () => void;
  onPlaybackRateChange: (rate: number) => void;
}

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5];

function BottomControlBar({
  currentTime,
  duration,
  isPlaying,
  playbackRate,
  isLooping,
  sectionMarkStart,
  onPlayPause,
  onSeek,
  onPlayFromTime,
  onSkipBack,
  onSkipForward,
  onSkipToBeginning,
  onSectionMarker,
  onLoopToggle,
  onPlaybackRateChange,
}: BottomControlBarProps) {
  const [isDragging, setIsDragging] = useState(false);
  const draggedTimeRef = useRef(0);

  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newTime = Math.max(0, Math.min(duration, (x / rect.width) * duration));
    onSeek(newTime);
    draggedTimeRef.current = newTime;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const moveX = moveEvent.clientX - rect.left;
      const moveTime = Math.max(0, Math.min(duration, (moveX / rect.width) * duration));
      onSeek(moveTime);
      draggedTimeRef.current = moveTime;
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (isPlaying) onPlayFromTime(draggedTimeRef.current);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleProgressTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsDragging(true);
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const newTime = Math.max(0, Math.min(duration, (x / rect.width) * duration));
    onSeek(newTime);
    draggedTimeRef.current = newTime;
  };

  const handleProgressTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const newTime = Math.max(0, Math.min(duration, (x / rect.width) * duration));
    onSeek(newTime);
    draggedTimeRef.current = newTime;
  };

  const handleProgressTouchEnd = () => {
    setIsDragging(false);
    if (isPlaying) onPlayFromTime(draggedTimeRef.current);
  };

  const cyclePlaybackRate = () => {
    const currentIdx = PLAYBACK_RATES.indexOf(playbackRate);
    if (currentIdx >= 0) {
      const nextIdx = (currentIdx + 1) % PLAYBACK_RATES.length;
      onPlaybackRateChange(PLAYBACK_RATES[nextIdx]);
    } else {
      onPlaybackRateChange(1);
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-[#1a1a2e] border-t border-gray-800 px-4 py-3 z-30"
      style={{ paddingBottom: 'calc(0.75rem + var(--sab, 0px))' }}
    >
      {/* Progress bar */}
      <div
        className="w-full py-2 mb-2 cursor-pointer touch-none"
        onMouseDown={handleProgressMouseDown}
        onTouchStart={handleProgressTouchStart}
        onTouchMove={handleProgressTouchMove}
        onTouchEnd={handleProgressTouchEnd}
      >
        <div className="w-full h-2 bg-gray-700 rounded-full relative">
          <div
            className="absolute h-full bg-cyan-400 rounded-full pointer-events-none"
            style={{ width: `${progress}%` }}
          />
          {/* Draggable thumb */}
          <div
            className={`absolute bg-cyan-400 rounded-full -top-1 shadow-lg pointer-events-none transition-transform ${
              isDragging ? 'w-5 h-5 -top-1.5 scale-110' : 'w-4 h-4'
            }`}
            style={{ left: `calc(${progress}% - ${isDragging ? 10 : 8}px)` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        {/* Time */}
        <div className="text-xs text-gray-400 w-12 flex-shrink-0">
          {formatTime(currentTime)}
        </div>

        {/* Main controls */}
        <div className="flex items-center">
          {/* Section marker (flag) */}
          <button
            onClick={onSectionMarker}
            className={`w-9 h-9 flex items-center justify-center ${
              sectionMarkStart !== null
                ? 'text-red-500'
                : 'text-gray-400 active:text-white'
            }`}
          >
            <Flag className={`w-4 h-4 ${sectionMarkStart !== null ? 'fill-current' : ''}`} />
          </button>

          {/* Skip to beginning */}
          <button
            onClick={onSkipToBeginning}
            className="w-9 h-9 text-gray-400 active:text-white flex items-center justify-center"
          >
            <div className="w-0.5 h-3.5 bg-current mr-0.5" />
            <ChevronsLeft className="w-4 h-4" />
          </button>

          {/* Skip back 5s */}
          <button
            onClick={onSkipBack}
            className="w-9 h-9 text-gray-300 active:text-white flex items-center justify-center"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Play/Pause */}
          <button
            onClick={onPlayPause}
            className="w-12 h-12 bg-cyan-500 active:bg-cyan-600 rounded-full flex items-center justify-center mx-1"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-white" />
            ) : (
              <Play className="w-6 h-6 text-white ml-0.5" />
            )}
          </button>

          {/* Skip forward 5s */}
          <button
            onClick={onSkipForward}
            className="w-9 h-9 text-gray-300 active:text-white flex items-center justify-center"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-0.5 flex-shrink-0 justify-end">
          {/* Loop toggle */}
          <button
            onClick={onLoopToggle}
            className={`w-9 h-9 flex items-center justify-center ${isLooping ? 'text-cyan-400' : 'text-gray-500'}`}
          >
            <Repeat className="w-4 h-4" />
          </button>

          {/* Speed */}
          <button
            onClick={cyclePlaybackRate}
            className="text-xs text-gray-400 font-medium min-w-[32px] h-7 rounded bg-gray-800/50 flex items-center justify-center"
          >
            {playbackRate}x
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(BottomControlBar);
