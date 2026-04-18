'use client';

import { useRef, useEffect, useCallback, useState, memo } from 'react';
import { useTheme } from '@/hooks/useTheme';

interface SectionWaveformProps {
  waveformData: number[] | null;
  duration: number; // Total audio duration
  sectionStart: number;
  sectionEnd: number;
  currentTime: number; // Relative to section (0 to sectionDuration)
  isPlaying: boolean;
  onSeek: (time: number) => void; // Relative time within section
  onSectionBoundaryChange?: (start: number, end: number) => void;
  showHandles?: boolean; // Show boundary adjustment handles
}

function SectionWaveform({
  waveformData,
  duration,
  sectionStart,
  sectionEnd,
  currentTime,
  isPlaying,
  onSeek,
  onSectionBoundaryChange,
  showHandles = true,
}: SectionWaveformProps) {
  const { isDark } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'seek' | 'start' | 'end' | null>(null);

  // For delta-based seek (inverted direction like scrolling)
  const dragStartXRef = useRef(0);
  const dragStartTimeRef = useRef(0);

  const sectionDuration = sectionEnd - sectionStart;

  // Padding to show context around the section
  const contextPadding = Math.min(sectionDuration * 0.2, 5); // 20% or max 5 seconds
  const viewStart = Math.max(0, sectionStart - contextPadding);
  const viewEnd = Math.min(duration, sectionEnd + contextPadding);
  const viewDuration = viewEnd - viewStart;

  const timeToX = useCallback((time: number, width: number) => {
    return ((time - viewStart) / viewDuration) * width;
  }, [viewStart, viewDuration]);

  const xToTime = useCallback((x: number, width: number) => {
    return viewStart + (x / width) * viewDuration;
  }, [viewStart, viewDuration]);

  // Draw waveform
  useEffect(() => {
    if (!canvasRef.current || duration <= 0) return;

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

    // Draw section boundary area (darker outside the section)
    const sectionStartX = timeToX(sectionStart, width);
    const sectionEndX = timeToX(sectionEnd, width);

    // Dim areas outside section
    ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, sectionStartX, height);
    ctx.fillRect(sectionEndX, 0, width - sectionEndX, height);

    // Draw waveform
    if (waveformData && waveformData.length > 0) {
      const startSample = Math.floor((viewStart / duration) * waveformData.length);
      const endSample = Math.ceil((viewEnd / duration) * waveformData.length);
      const visibleSamples = waveformData.slice(
        Math.max(0, startSample),
        Math.min(waveformData.length, endSample)
      );

      if (visibleSamples.length > 0) {
        const centerY = height / 2;
        const maxAmplitude = height * 0.4;

        // Bar style waveform
        const barWidth = 3;
        const barGap = 1;
        const totalBarWidth = barWidth + barGap;
        const numBars = Math.floor(width / totalBarWidth);
        const samplesPerBar = Math.max(1, Math.floor(visibleSamples.length / numBars));

        for (let i = 0; i < numBars; i++) {
          const sampleStart = i * samplesPerBar;
          const sampleEnd = Math.min(sampleStart + samplesPerBar, visibleSamples.length);

          let sum = 0;
          for (let j = sampleStart; j < sampleEnd; j++) {
            sum += visibleSamples[j];
          }
          const avgAmplitude = sum / (sampleEnd - sampleStart);

          const barHeight = avgAmplitude > 0.01
            ? Math.max(3, avgAmplitude * maxAmplitude * 2)
            : 2;
          const x = i * totalBarWidth;
          const y = centerY - barHeight / 2;

          // Calculate time at this bar position
          const barTime = viewStart + (i / numBars) * viewDuration;
          const absoluteCurrentTime = sectionStart + currentTime;

          // Color based on position
          if (barTime < sectionStart || barTime > sectionEnd) {
            // Outside section - gray
            ctx.fillStyle = isDark ? '#4b5563' : '#9ca3af';
          } else if (barTime <= absoluteCurrentTime) {
            // Played - accent color
            ctx.fillStyle = isDark ? '#60a5fa' : '#3b82f6';
          } else {
            // Unplayed - lighter
            ctx.fillStyle = isDark ? '#374151' : '#d1d5db';
          }

          // Draw rounded bar
          const radius = barWidth / 2;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, radius);
          ctx.fill();
        }
      }
    }

    // Draw section boundaries
    ctx.strokeStyle = isDark ? '#f87171' : '#ef4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);

    // Start line
    ctx.beginPath();
    ctx.moveTo(sectionStartX, 0);
    ctx.lineTo(sectionStartX, height);
    ctx.stroke();

    // End line
    ctx.beginPath();
    ctx.moveTo(sectionEndX, 0);
    ctx.lineTo(sectionEndX, height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw playhead
    const absoluteCurrentTime = sectionStart + currentTime;
    if (absoluteCurrentTime >= viewStart && absoluteCurrentTime <= viewEnd) {
      const playheadX = timeToX(absoluteCurrentTime, width);

      ctx.strokeStyle = isDark ? '#fbbf24' : '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();

      // Playhead marker
      ctx.fillStyle = isDark ? '#fbbf24' : '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX - 6, 8);
      ctx.lineTo(playheadX + 6, 8);
      ctx.closePath();
      ctx.fill();
    }

  }, [waveformData, duration, sectionStart, sectionEnd, currentTime, viewStart, viewEnd, viewDuration, timeToX, isDark]);

  // Handle interactions
  const handleInteractionStart = useCallback((clientX: number) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const width = rect.width;

    const sectionStartX = timeToX(sectionStart, width);
    const sectionEndX = timeToX(sectionEnd, width);

    // Check if near handles (within 20px)
    const handleThreshold = 20;

    if (showHandles && onSectionBoundaryChange && Math.abs(x - sectionStartX) < handleThreshold) {
      setDragType('start');
    } else if (showHandles && onSectionBoundaryChange && Math.abs(x - sectionEndX) < handleThreshold) {
      setDragType('end');
    } else {
      setDragType('seek');
      // Store initial position for delta-based seek
      dragStartXRef.current = x;
      dragStartTimeRef.current = currentTime;
    }

    setIsDragging(true);
  }, [sectionStart, sectionEnd, currentTime, timeToX, onSectionBoundaryChange, showHandles]);

  const handleInteractionMove = useCallback((clientX: number) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const width = rect.width;

    if (dragType === 'seek') {
      // Direct position-based seek (drag right = time increases)
      const time = ((x / width) * viewDuration) + viewStart - sectionStart;
      const clampedTime = Math.max(0, Math.min(time, sectionDuration));
      onSeek(clampedTime);
    } else if (dragType === 'start' && onSectionBoundaryChange) {
      const time = xToTime(x, width);
      // Minimum section duration of 1 second
      const newStart = Math.max(0, Math.min(time, sectionEnd - 1));
      onSectionBoundaryChange(newStart, sectionEnd);
    } else if (dragType === 'end' && onSectionBoundaryChange) {
      const time = xToTime(x, width);
      const newEnd = Math.max(sectionStart + 1, Math.min(time, duration));
      onSectionBoundaryChange(sectionStart, newEnd);
    }
  }, [isDragging, dragType, sectionStart, sectionEnd, sectionDuration, duration, viewDuration, xToTime, onSeek, onSectionBoundaryChange]);

  const handleInteractionEnd = useCallback(() => {
    setIsDragging(false);
    setDragType(null);
  }, []);

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    handleInteractionStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleInteractionMove(e.clientX);
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent scrolling
    handleInteractionStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent scrolling
    handleInteractionMove(e.touches[0].clientX);
  };

  // Global mouse and touch events for drag
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      handleInteractionMove(e.clientX);
    };

    const handleGlobalMouseUp = () => {
      handleInteractionEnd();
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // Prevent scrolling
      handleInteractionMove(e.touches[0].clientX);
    };

    const handleGlobalTouchEnd = () => {
      handleInteractionEnd();
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    window.addEventListener('touchend', handleGlobalTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [isDragging, handleInteractionMove, handleInteractionEnd]);

  return (
    <div
      ref={containerRef}
      className="relative"
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleInteractionEnd}
        className={`w-full rounded-xl cursor-pointer ${
          isDark ? 'bg-gray-800' : 'bg-gray-100'
        }`}
        style={{ height: '100px', touchAction: 'none' }}
      />

      {/* Boundary handles */}
      {showHandles && onSectionBoundaryChange && (
        <>
          {/* Start handle */}
          <div
            className={`absolute top-0 bottom-0 w-6 cursor-ew-resize flex items-center justify-center ${
              isDark ? 'hover:bg-red-500/20' : 'hover:bg-red-500/10'
            }`}
            style={{
              left: `calc(${((sectionStart - viewStart) / viewDuration) * 100}% - 12px)`,
            }}
          >
            <div className={`w-1 h-8 rounded-full ${isDark ? 'bg-red-400' : 'bg-red-500'}`} />
          </div>

          {/* End handle */}
          <div
            className={`absolute top-0 bottom-0 w-6 cursor-ew-resize flex items-center justify-center ${
              isDark ? 'hover:bg-red-500/20' : 'hover:bg-red-500/10'
            }`}
            style={{
              left: `calc(${((sectionEnd - viewStart) / viewDuration) * 100}% - 12px)`,
            }}
          >
            <div className={`w-1 h-8 rounded-full ${isDark ? 'bg-red-400' : 'bg-red-500'}`} />
          </div>
        </>
      )}
    </div>
  );
}

export default memo(SectionWaveform);
