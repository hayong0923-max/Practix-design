'use client';

import { useState, useRef, memo } from 'react';
import { Play, Pause, Mic, Trash2, Scissors } from 'lucide-react';
import { Recording } from '@/types';
import { formatTime } from '@/utils/formatTime';
import CountdownDial from '@/components/ui/CountdownDial';

interface BasicRecordingSectionProps {
  recordings: Recording[];
  selectedRecordingId: number | null;
  recordedAudioBuffer: Record<number, AudioBuffer>;
  recordedIsPlaying: Record<number, boolean>;
  recordedCurrentTime: Record<number, number>;
  isRecording: boolean;
  isCountingDown: boolean;
  countdown: number;
  recordingTime: number;
  audioLevel: number;
  countdownDuration: number;
  isDark: boolean;
  onSelectRecording: (id: number) => void;
  onTogglePlay: (id: number) => void;
  onSeek: (id: number, time: number) => void;
  onStartRecording: (countdownSeconds: number) => void;
  onStopRecording: () => void;
  onCancelCountdown: () => void;
  onDeleteRecording: (id: number) => void;
  onTrimRecording: (recording: Recording) => void;
  onCountdownDurationChange: (duration: number) => void;
  getEffectiveDuration: (id: number) => number;
}

function BasicRecordingSection({
  recordings,
  selectedRecordingId,
  recordedAudioBuffer,
  recordedIsPlaying,
  recordedCurrentTime,
  isRecording,
  isCountingDown,
  countdown,
  recordingTime,
  audioLevel,
  countdownDuration,
  isDark,
  onSelectRecording,
  onTogglePlay,
  onSeek,
  onStartRecording,
  onStopRecording,
  onCancelCountdown,
  onDeleteRecording,
  onTrimRecording,
  onCountdownDurationChange,
  getEffectiveDuration,
}: BasicRecordingSectionProps) {
  const [showCountdownDial, setShowCountdownDial] = useState(false);
  const longPressRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  const handleLongPressStart = () => {
    isLongPressRef.current = false;
    longPressRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setShowCountdownDial(true);
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
    if (!isLongPressRef.current) {
      onStartRecording(countdownDuration);
    }
  };

  const handleLongPressCancel = () => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  };

  return (
    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} mt-2 px-4 py-4`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>기본 녹음</h3>
        {!isRecording && !isCountingDown && (
          <div className="flex items-center gap-1">
            {/* Immediate recording */}
            <button
              onClick={() => onStartRecording(0)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-sm rounded-lg active:bg-red-600"
            >
              <Mic className="w-4 h-4" />
              녹음
            </button>
            {/* Countdown recording with long press to adjust */}
            <button
              onMouseDown={handleLongPressStart}
              onMouseUp={handleLongPressEnd}
              onMouseLeave={handleLongPressCancel}
              onTouchStart={handleLongPressStart}
              onTouchEnd={handleLongPressEnd}
              className="px-2 py-1.5 bg-red-400 text-white text-sm rounded-lg active:bg-red-500 select-none"
              title={`${countdownDuration}초 카운트다운 후 녹음 (길게 누르면 조절)`}
            >
              {countdownDuration % 1 === 0 ? `${countdownDuration}s` : `${countdownDuration.toFixed(1)}s`}
            </button>
          </div>
        )}
      </div>

      {/* Countdown Dial */}
      {showCountdownDial && (
        <CountdownDial
          value={countdownDuration}
          onChange={onCountdownDurationChange}
          onClose={() => setShowCountdownDial(false)}
        />
      )}

      {/* Recording indicator */}
      {(isRecording || isCountingDown) && (
        <div className={`p-4 rounded-xl mb-3 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isCountingDown ? (
                <span className="text-2xl font-bold text-red-500">{countdown}</span>
              ) : (
                <>
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    녹음 중... {formatTime(recordingTime)}
                  </span>
                </>
              )}
            </div>
            <button
              onClick={() => {
                if (isCountingDown) {
                  onCancelCountdown();
                } else {
                  onStopRecording();
                }
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm active:bg-gray-700"
            >
              {isCountingDown ? '취소' : '중지'}
            </button>
          </div>
          {isRecording && (
            <div className="mt-3 h-2 bg-gray-600 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 transition-all duration-75"
                style={{ width: `${audioLevel * 100}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Recordings list */}
      {recordings.length > 0 ? (
        <div className="space-y-2">
          {recordings.map((recording) => {
            const buffer = recordedAudioBuffer[recording.id];
            const isSelected = selectedRecordingId === recording.id;
            const isPlayingThis = recordedIsPlaying[recording.id];
            const currentTimeValue = recordedCurrentTime[recording.id] || 0;
            const effectiveDuration = getEffectiveDuration(recording.id);

            return (
              <div
                key={recording.id}
                className={`p-3 rounded-xl ${
                  isSelected
                    ? isDark ? 'bg-purple-900/30 border border-purple-500' : 'bg-purple-50 border border-purple-300'
                    : isDark ? 'bg-gray-700' : 'bg-gray-100'
                }`}
                onClick={() => onSelectRecording(recording.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (buffer) onTogglePlay(recording.id);
                      }}
                      className={`p-2 rounded-full ${
                        isPlayingThis ? 'bg-purple-500' : isDark ? 'bg-gray-600' : 'bg-gray-300'
                      }`}
                      disabled={!buffer}
                    >
                      {isPlayingThis ? (
                        <Pause className="w-4 h-4 text-white" />
                      ) : (
                        <Play className="w-4 h-4 text-white" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {recording.name}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {buffer ? formatTime(effectiveDuration) : '로딩...'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Trim button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (buffer) {
                          onTrimRecording(recording);
                        }
                      }}
                      className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                      disabled={!buffer}
                      title="녹음 자르기"
                    >
                      <Scissors className={`w-4 h-4 ${buffer ? 'text-purple-500' : 'text-gray-400'}`} />
                    </button>
                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('이 녹음을 삭제하시겠습니까?')) {
                          onDeleteRecording(recording.id);
                        }
                      }}
                      className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                {buffer && isSelected && (
                  <div className="mt-2">
                    <div
                      className="h-1.5 bg-gray-600 rounded-full cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const newTime = (x / rect.width) * effectiveDuration;
                        onSeek(recording.id, newTime);
                      }}
                    >
                      <div
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${(currentTimeValue / effectiveDuration) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                        {formatTime(currentTimeValue)}
                      </span>
                      <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                        {formatTime(effectiveDuration)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className={`text-center py-6 border-2 border-dashed rounded-xl ${
          isDark ? 'border-gray-600 text-gray-500' : 'border-gray-300 text-gray-400'
        }`}>
          <Mic className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">녹음 버튼을 눌러 연습을 기록하세요</p>
          <p className="text-xs mt-1">원곡 없이도 바로 녹음 가능</p>
        </div>
      )}
    </div>
  );
}

export default memo(BasicRecordingSection);
