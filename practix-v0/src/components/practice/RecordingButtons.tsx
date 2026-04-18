'use client';

import { useState, useRef, useCallback } from 'react';
import { Mic, Square, Music } from 'lucide-react';
import CountdownDial from '@/components/ui/CountdownDial';
import { useTheme } from '@/hooks/useTheme';

interface RecordingState {
  isRecording: boolean;
  isCountingDown: boolean;
  countdown: number;
  recordingTime: number;
  audioLevel: number;
}

interface RecordingButtonsProps {
  recordingState: RecordingState;
  hasBackingTrack: boolean;
  disabled?: boolean;
  onStartRecording: (countdownSeconds: number, withBackingTrack: boolean) => void;
  onStopRecording: () => void;
  onCancelCountdown: () => void;
  countdownDuration: number;
  onCountdownDurationChange?: (duration: number) => void;
}

export default function RecordingButtons({
  recordingState,
  hasBackingTrack,
  disabled = false,
  onStartRecording,
  onStopRecording,
  onCancelCountdown,
  countdownDuration,
  onCountdownDurationChange,
}: RecordingButtonsProps) {
  const { isDark } = useTheme();
  const { isRecording, isCountingDown, countdown, recordingTime, audioLevel } = recordingState;
  const [showDial, setShowDial] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);
  const actionHandledRef = useRef(false); // Prevent double-firing from touch + click

  const handleCountdownButtonDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[RecordingButtons] Button DOWN');
    isLongPressRef.current = false;
    actionHandledRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      console.log('[RecordingButtons] Long press detected - showing dial');
      isLongPressRef.current = true;
      actionHandledRef.current = true;
      setShowDial(true);
    }, 500);
  }, []);

  const handleCountdownButtonUp = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[RecordingButtons] Button UP, isLongPress:', isLongPressRef.current, 'actionHandled:', actionHandledRef.current);
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (!isLongPressRef.current && !actionHandledRef.current && !disabled) {
      console.log('[RecordingButtons] Starting countdown recording:', countdownDuration);
      actionHandledRef.current = true;
      onStartRecording(countdownDuration, false);
    }
  }, [countdownDuration, disabled, onStartRecording]);

  const handleCountdownButtonLeave = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  // Countdown state - orange button
  if (isCountingDown) {
    return (
      <button
        onClick={onCancelCountdown}
        className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 active:bg-orange-600 text-white rounded-lg"
      >
        <span className="text-2xl font-bold">{countdown}</span>
        <span className="text-sm">취소</span>
      </button>
    );
  }

  // Recording state - with level visualization inside button
  if (isRecording) {
    return (
      <button
        onClick={onStopRecording}
        className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 active:bg-red-700 text-white rounded-lg relative overflow-hidden"
      >
        {/* Audio level visualization */}
        <div
          className="absolute inset-0 bg-red-400 transition-all duration-75"
          style={{ width: `${audioLevel * 100}%`, opacity: 0.5 }}
        />
        <div className="relative flex items-center gap-2">
          <Square className="w-5 h-5" />
          <span className="font-mono">
            {Math.floor(recordingTime / 60)}:{String(Math.floor(recordingTime % 60)).padStart(2, '0')}
          </span>
        </div>
      </button>
    );
  }

  // Normal state - multiple buttons
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Immediate recording */}
      <button
        onClick={() => onStartRecording(0, false)}
        disabled={disabled}
        className={`flex items-center gap-2 px-4 py-3 rounded-lg text-white ${
          disabled ? 'bg-gray-400' : 'bg-red-500 active:bg-red-600'
        }`}
      >
        <Mic className="w-5 h-5" />
        <span>녹음</span>
      </button>

      {/* Recording with backing track */}
      {hasBackingTrack && (
        <button
          onClick={() => onStartRecording(countdownDuration, true)}
          disabled={disabled}
          className={`flex items-center gap-2 px-3 py-3 rounded-lg text-white ${
            disabled ? 'bg-gray-400' : 'bg-green-500 active:bg-green-600'
          }`}
          title={`반주와 함께 녹음 (${countdownDuration}초 카운트다운)`}
        >
          <Music className="w-4 h-4" />
          <span className="text-sm">반주</span>
        </button>
      )}

      {/* Countdown recording (long press for dial) */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('[RecordingButtons] onClick, actionHandled:', actionHandledRef.current);
          // Fallback for cases where touch/mouse events don't work
          if (!actionHandledRef.current && !isLongPressRef.current && !disabled) {
            console.log('[RecordingButtons] onClick fallback - starting recording');
            actionHandledRef.current = true;
            onStartRecording(countdownDuration, false);
          }
        }}
        onMouseDown={handleCountdownButtonDown}
        onMouseUp={handleCountdownButtonUp}
        onMouseLeave={handleCountdownButtonLeave}
        onTouchStart={handleCountdownButtonDown}
        onTouchEnd={handleCountdownButtonUp}
        disabled={disabled}
        style={{ touchAction: 'none' }}
        className={`px-3 py-3 rounded-lg text-white text-sm select-none ${
          disabled ? 'bg-gray-400' : 'bg-red-400 active:bg-red-500'
        }`}
        title={`${countdownDuration}초 카운트다운 후 녹음 (길게 누르면 조절)`}
      >
        {countdownDuration % 1 === 0 ? `${countdownDuration}s` : `${countdownDuration.toFixed(1)}s`}
      </button>

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
