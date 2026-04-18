'use client';

import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { X, Play, Pause, RotateCcw, Check, Scissors } from 'lucide-react';
import { Recording } from '@/types';
import { formatTime } from '@/utils/formatTime';
import { useTheme } from '@/hooks/useTheme';

interface RecordingTrimModalProps {
  show: boolean;
  onClose: () => void;
  recording: Recording;
  audioBuffer: AudioBuffer | null;
  audioContext: AudioContext | null;
  onSave: (trimStart: number, trimEnd: number) => void;
}

function RecordingTrimModal({
  show,
  onClose,
  recording,
  audioBuffer,
  audioContext,
  onSave,
}: RecordingTrimModalProps) {
  const { isDark } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const duration = audioBuffer?.duration || 0;
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(duration);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [waveformData, setWaveformData] = useState<number[] | null>(null);

  const startTimeRef = useRef(0);
  const offsetRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  // For drag-to-seek (inverted direction like scrolling)
  const dragStartXRef = useRef(0);
  const dragStartTimeRef = useRef(0);

  // Generate waveform data from buffer
  useEffect(() => {
    if (!audioBuffer) return;

    const rawData = audioBuffer.getChannelData(0);
    const samples = 500;
    const blockSize = Math.floor(rawData.length / samples);
    const data: number[] = [];

    for (let i = 0; i < samples; i++) {
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(rawData[i * blockSize + j] || 0);
      }
      data.push(sum / blockSize);
    }

    // Normalize
    const max = Math.max(...data, 0.01);
    const normalized = data.map((d) => d / max);
    setWaveformData(normalized);
  }, [audioBuffer]);

  // Reset trim bounds when recording changes
  useEffect(() => {
    setTrimStart(0);
    setTrimEnd(duration);
    setCurrentTime(0);
  }, [duration, recording.id]);

  // Stop playback on close
  useEffect(() => {
    if (!show) {
      stopPlayback();
    }
  }, [show]);

  const stopPlayback = useCallback(() => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch {}
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const playPreview = useCallback(() => {
    if (!audioContext || !audioBuffer) return;

    stopPlayback();

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;

    const gain = audioContext.createGain();
    gain.gain.value = 1;

    source.connect(gain);
    gain.connect(audioContext.destination);

    sourceRef.current = source;
    gainRef.current = gain;

    const playFrom = Math.max(trimStart, currentTime);
    const playDuration = trimEnd - playFrom;

    source.start(0, playFrom, playDuration);
    startTimeRef.current = audioContext.currentTime;
    offsetRef.current = playFrom;

    source.onended = () => {
      if (sourceRef.current === source) {
        setIsPlaying(false);
        setCurrentTime(trimStart);
      }
    };

    setIsPlaying(true);

    // Animation frame for time update
    const updateTime = () => {
      if (!audioContext || !isPlaying) return;

      const elapsed = audioContext.currentTime - startTimeRef.current;
      const newTime = offsetRef.current + elapsed;

      if (newTime >= trimEnd) {
        setCurrentTime(trimStart);
        setIsPlaying(false);
        return;
      }

      setCurrentTime(newTime);
      animationFrameRef.current = requestAnimationFrame(updateTime);
    };

    animationFrameRef.current = requestAnimationFrame(updateTime);
  }, [audioContext, audioBuffer, trimStart, trimEnd, currentTime, stopPlayback]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      stopPlayback();
    } else {
      playPreview();
    }
  }, [isPlaying, stopPlayback, playPreview]);

  const resetToStart = useCallback(() => {
    stopPlayback();
    setCurrentTime(trimStart);
  }, [stopPlayback, trimStart]);

  // Draw waveform
  useEffect(() => {
    if (!canvasRef.current || !waveformData || duration <= 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    canvas.width = width * 2;
    canvas.height = height * 2;
    ctx.scale(2, 2);

    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = isDark ? '#1f2937' : '#f9fafb';
    ctx.fillRect(0, 0, width, height);

    // Dim areas outside trim region
    const trimStartX = (trimStart / duration) * width;
    const trimEndX = (trimEnd / duration) * width;

    ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, trimStartX, height);
    ctx.fillRect(trimEndX, 0, width - trimEndX, height);

    // Draw waveform
    const centerY = height / 2;
    const maxAmplitude = height * 0.4;

    const barWidth = 3;
    const barGap = 1;
    const totalBarWidth = barWidth + barGap;
    const numBars = Math.floor(width / totalBarWidth);
    const samplesPerBar = Math.max(1, Math.floor(waveformData.length / numBars));

    for (let i = 0; i < numBars; i++) {
      const sampleStart = i * samplesPerBar;
      const sampleEnd = Math.min(sampleStart + samplesPerBar, waveformData.length);

      let sum = 0;
      for (let j = sampleStart; j < sampleEnd; j++) {
        sum += waveformData[j];
      }
      const avgAmplitude = sum / (sampleEnd - sampleStart);

      const barHeight = avgAmplitude > 0.01 ? Math.max(3, avgAmplitude * maxAmplitude * 2) : 2;
      const x = i * totalBarWidth;
      const y = centerY - barHeight / 2;

      const barTime = (i / numBars) * duration;

      if (barTime < trimStart || barTime > trimEnd) {
        ctx.fillStyle = isDark ? '#4b5563' : '#9ca3af';
      } else if (barTime <= currentTime) {
        ctx.fillStyle = isDark ? '#60a5fa' : '#3b82f6';
      } else {
        ctx.fillStyle = isDark ? '#374151' : '#d1d5db';
      }

      const radius = barWidth / 2;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, radius);
      ctx.fill();
    }

    // Draw trim boundaries
    ctx.strokeStyle = isDark ? '#f87171' : '#ef4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);

    ctx.beginPath();
    ctx.moveTo(trimStartX, 0);
    ctx.lineTo(trimStartX, height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(trimEndX, 0);
    ctx.lineTo(trimEndX, height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw playhead
    if (currentTime >= 0 && currentTime <= duration) {
      const playheadX = (currentTime / duration) * width;

      ctx.strokeStyle = isDark ? '#fbbf24' : '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();

      ctx.fillStyle = isDark ? '#fbbf24' : '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX - 6, 8);
      ctx.lineTo(playheadX + 6, 8);
      ctx.closePath();
      ctx.fill();
    }
  }, [waveformData, duration, trimStart, trimEnd, currentTime, isDark]);

  // Drag handling
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'seek' | 'start' | 'end' | null>(null);

  const handleInteractionStart = useCallback(
    (clientX: number) => {
      if (!containerRef.current || duration <= 0) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const width = rect.width;

      const trimStartX = (trimStart / duration) * width;
      const trimEndX = (trimEnd / duration) * width;

      const handleThreshold = 20;

      if (Math.abs(x - trimStartX) < handleThreshold) {
        setDragType('start');
      } else if (Math.abs(x - trimEndX) < handleThreshold) {
        setDragType('end');
      } else {
        setDragType('seek');
        // Store initial position for delta-based seek
        dragStartXRef.current = x;
        dragStartTimeRef.current = currentTime;
      }

      setIsDragging(true);
    },
    [duration, trimStart, trimEnd, currentTime]
  );

  const handleInteractionMove = useCallback(
    (clientX: number) => {
      if (!isDragging || !containerRef.current || duration <= 0) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const width = rect.width;

      if (dragType === 'seek') {
        // Direct position-based seek (drag right = time increases)
        const time = (x / width) * duration;
        const clampedTime = Math.max(trimStart, Math.min(time, trimEnd));
        setCurrentTime(clampedTime);
      } else if (dragType === 'start') {
        const time = Math.max(0, Math.min((x / width) * duration, duration));
        const newStart = Math.max(0, Math.min(time, trimEnd - 0.1));
        setTrimStart(newStart);
        if (currentTime < newStart) {
          setCurrentTime(newStart);
        }
      } else if (dragType === 'end') {
        const time = Math.max(0, Math.min((x / width) * duration, duration));
        const newEnd = Math.max(trimStart + 0.1, Math.min(time, duration));
        setTrimEnd(newEnd);
        if (currentTime > newEnd) {
          setCurrentTime(newEnd);
        }
      }
    },
    [isDragging, dragType, duration, trimStart, trimEnd, currentTime]
  );

  const handleInteractionEnd = useCallback(() => {
    setIsDragging(false);
    setDragType(null);
  }, []);

  // Global events for drag
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => handleInteractionMove(e.clientX);
    const handleGlobalMouseUp = () => handleInteractionEnd();

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, handleInteractionMove, handleInteractionEnd]);

  const handleSave = useCallback(() => {
    onSave(trimStart, trimEnd);
    onClose();
  }, [trimStart, trimEnd, onSave, onClose]);

  const trimmedDuration = trimEnd - trimStart;

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className={`w-full max-w-lg mx-4 rounded-2xl ${
          isDark ? 'bg-gray-800' : 'bg-white'
        } overflow-hidden`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-4 py-3 border-b ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Scissors className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
            <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              녹음 자르기
            </span>
          </div>
          <button onClick={onClose} className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Recording name */}
          <p className={`text-sm mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {recording.name}
          </p>

          {/* Time display */}
          <div className="flex justify-between text-sm mb-2">
            <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
              시작: {formatTime(trimStart)}
            </span>
            <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
              끝: {formatTime(trimEnd)}
            </span>
          </div>

          {/* Waveform */}
          <div ref={containerRef} className="relative mb-4">
            <canvas
              ref={canvasRef}
              onMouseDown={(e) => handleInteractionStart(e.clientX)}
              onTouchStart={(e) => handleInteractionStart(e.touches[0].clientX)}
              onTouchMove={(e) => handleInteractionMove(e.touches[0].clientX)}
              onTouchEnd={handleInteractionEnd}
              className={`w-full rounded-xl cursor-pointer ${
                isDark ? 'bg-gray-700' : 'bg-gray-100'
              }`}
              style={{ height: '120px' }}
            />

            {/* Start handle */}
            <div
              className={`absolute top-0 bottom-0 w-6 cursor-ew-resize flex items-center justify-center ${
                isDark ? 'hover:bg-red-500/20' : 'hover:bg-red-500/10'
              }`}
              style={{ left: `calc(${(trimStart / duration) * 100}% - 12px)` }}
            >
              <div className={`w-1 h-8 rounded-full ${isDark ? 'bg-red-400' : 'bg-red-500'}`} />
            </div>

            {/* End handle */}
            <div
              className={`absolute top-0 bottom-0 w-6 cursor-ew-resize flex items-center justify-center ${
                isDark ? 'hover:bg-red-500/20' : 'hover:bg-red-500/10'
              }`}
              style={{ left: `calc(${(trimEnd / duration) * 100}% - 12px)` }}
            >
              <div className={`w-1 h-8 rounded-full ${isDark ? 'bg-red-400' : 'bg-red-500'}`} />
            </div>
          </div>

          {/* Trimmed duration info */}
          <div className={`text-center text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            잘린 길이: {formatTime(trimmedDuration)} / 원본: {formatTime(duration)}
          </div>

          {/* Play controls */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <button
              onClick={resetToStart}
              className={`p-3 rounded-full ${
                isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
              }`}
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              onClick={togglePlay}
              className={`p-4 rounded-full ${
                isPlaying
                  ? isDark
                    ? 'bg-orange-600 text-white'
                    : 'bg-orange-500 text-white'
                  : isDark
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-500 text-white'
              }`}
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>
          </div>

          {/* Current time display */}
          <div className={`text-center text-sm mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {formatTime(currentTime)}
          </div>
        </div>

        {/* Footer */}
        <div
          className={`flex gap-3 px-4 py-3 border-t ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <button
            onClick={onClose}
            className={`flex-1 py-2 rounded-lg ${
              isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
            }`}
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2 rounded-lg bg-purple-500 text-white flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(RecordingTrimModal);
