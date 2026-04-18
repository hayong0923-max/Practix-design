'use client';

import { useState, useRef, useCallback } from 'react';
import { Play, Upload, Mic, Square, Music, Repeat } from 'lucide-react';
import CountdownDial from '@/components/ui/CountdownDial';

interface RecordingState {
  isRecording: boolean;
  isCountingDown: boolean;
  countdown: number;
  recordingTime: number;
  audioLevel: number;
}

interface SectionActionButtonsProps {
  recordingState: RecordingState;
  hasBackingTrack: boolean;
  isUploading: boolean;
  onPlaySection: () => void;
  onStartRecording: (countdownSeconds: number, withBackingTrack: boolean) => void;
  onStopRecording: () => void;
  onCancelCountdown: () => void;
  onUploadRecording: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLooping?: boolean;
  onLoopToggle?: () => void;
  countdownDuration?: number;
  onCountdownDurationChange?: (duration: number) => void;
}

export default function SectionActionButtons({
  recordingState,
  hasBackingTrack,
  isUploading,
  onPlaySection,
  onStartRecording,
  onStopRecording,
  onCancelCountdown,
  onUploadRecording,
  isLooping = false,
  onLoopToggle,
  countdownDuration = 3,
  onCountdownDurationChange,
}: SectionActionButtonsProps) {
  const { isRecording, isCountingDown, countdown, recordingTime, audioLevel } = recordingState;
  const [showDial, setShowDial] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);
  const actionHandledRef = useRef(false); // Prevent double-firing from touch + click

  const handleCountdownButtonDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[SectionActionButtons] Button DOWN');
    isLongPressRef.current = false;
    actionHandledRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      console.log('[SectionActionButtons] Long press detected - showing dial');
      isLongPressRef.current = true;
      actionHandledRef.current = true;
      setShowDial(true);
    }, 500); // 500ms for long press
  }, []);

  const handleCountdownButtonUp = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[SectionActionButtons] Button UP, isLongPress:', isLongPressRef.current, 'actionHandled:', actionHandledRef.current);
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    // Only trigger recording if it wasn't a long press and action not already handled
    if (!isLongPressRef.current && !actionHandledRef.current && !isUploading) {
      console.log('[SectionActionButtons] Starting countdown recording:', countdownDuration);
      actionHandledRef.current = true;
      onStartRecording(countdownDuration, false);
    }
  }, [countdownDuration, isUploading, onStartRecording]);

  const handleCountdownButtonLeave = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const renderRecordingButton = () => {
    if (isCountingDown) {
      return (
        <button
          onClick={onCancelCountdown}
          className="flex-1 min-w-0 bg-orange-500 active:bg-orange-600 text-white py-3 rounded-lg text-sm flex items-center justify-center gap-2"
        >
          <span className="text-xl font-bold">{countdown}</span>
          <span className="text-xs">취소</span>
        </button>
      );
    }

    if (isRecording) {
      return (
        <button
          onClick={onStopRecording}
          className="flex-1 min-w-0 bg-red-600 active:bg-red-700 text-white py-3 rounded-lg text-sm flex items-center justify-center gap-2 relative overflow-hidden"
        >
          {/* Audio level visualization */}
          <div
            className="absolute inset-0 bg-red-400 transition-all duration-75"
            style={{ width: `${audioLevel * 100}%`, opacity: 0.5 }}
          />
          <div className="relative flex items-center gap-2">
            <Square className="w-4 h-4 flex-shrink-0" />
            <span className="tabular-nums">
              {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </button>
      );
    }

    return (
      <div className="flex-1 flex gap-1 min-w-0">
        <button
          onClick={() => {
            console.log('[SectionActionButtons] Immediate recording clicked');
            onStartRecording(0, false);
          }}
          disabled={isUploading}
          className={`flex-1 min-w-0 ${
            isUploading ? 'bg-gray-400' : 'bg-red-500 active:bg-red-600'
          } text-white py-3 rounded-lg text-sm flex items-center justify-center gap-1`}
          title="즉시 녹음"
        >
          <Mic className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">녹음</span>
        </button>
        {hasBackingTrack && (
          <button
            onClick={() => onStartRecording(countdownDuration, true)}
            disabled={isUploading}
            className={`px-3 ${
              isUploading ? 'bg-gray-400' : 'bg-green-500 active:bg-green-600'
            } text-white py-3 rounded-lg text-xs flex items-center gap-1 flex-shrink-0`}
            title={`반주와 함께 녹음 (${countdownDuration}초 카운트다운)`}
          >
            <Music className="w-3 h-3" />
          </button>
        )}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('[SectionActionButtons] onClick, actionHandled:', actionHandledRef.current);
            // Fallback for cases where touch/mouse events don't work
            if (!actionHandledRef.current && !isLongPressRef.current && !isUploading) {
              console.log('[SectionActionButtons] onClick fallback - starting recording');
              actionHandledRef.current = true;
              onStartRecording(countdownDuration, false);
            }
          }}
          onMouseDown={handleCountdownButtonDown}
          onMouseUp={handleCountdownButtonUp}
          onMouseLeave={handleCountdownButtonLeave}
          onTouchStart={handleCountdownButtonDown}
          onTouchEnd={handleCountdownButtonUp}
          disabled={isUploading}
          style={{ touchAction: 'none' }}
          className={`px-3 ${
            isUploading ? 'bg-gray-400' : 'bg-red-400 active:bg-red-500'
          } text-white py-3 rounded-lg text-xs flex-shrink-0 select-none`}
          title={`${countdownDuration}초 카운트다운 후 녹음 (길게 누르면 조절)`}
        >
          {countdownDuration % 1 === 0 ? `${countdownDuration}s` : `${countdownDuration.toFixed(1)}s`}
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-2 mb-3">
      {/* Main action buttons - 2 column layout */}
      <div className="flex gap-2">
        <div className="flex-1 min-w-0 flex gap-1">
          <button
            onClick={onPlaySection}
            className="flex-1 min-w-0 bg-blue-500 active:bg-blue-600 text-white py-3 rounded-lg text-sm flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">원곡</span>
          </button>
          {onLoopToggle && (
            <button
              onClick={onLoopToggle}
              className={`px-3 py-3 rounded-lg text-sm flex items-center justify-center ${
                isLooping
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-200 text-gray-600 active:bg-gray-300'
              }`}
              title="구간 반복"
            >
              <Repeat className="w-4 h-4" />
            </button>
          )}
        </div>

        {renderRecordingButton()}
      </div>

      {/* Upload button - full width */}
      <label
        className={`flex ${
          isUploading || isRecording
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-gray-500 active:bg-gray-600 cursor-pointer'
        } text-white py-2 rounded-lg text-sm items-center justify-center gap-2`}
      >
        <Upload className="w-4 h-4" />
        {isUploading ? '업로드 중...' : '파일 업로드'}
        <input
          type="file"
          accept="audio/*"
          onChange={onUploadRecording}
          disabled={isUploading || isRecording}
          className="hidden"
        />
      </label>

      {/* Countdown Dial */}
      {showDial && onCountdownDurationChange && (
        <CountdownDial
          value={countdownDuration}
          onChange={onCountdownDurationChange}
          onClose={() => setShowDial(false)}
        />
      )}
    </div>
  );
}
