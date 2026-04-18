'use client';

import { useRef, useEffect, useCallback, memo } from 'react';

interface MiniWaveformProps {
  buffer: AudioBuffer | null;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  color: string; // e.g., 'blue', 'red', 'green'
  height?: number;
}

function MiniWaveform({
  buffer,
  currentTime,
  duration,
  onSeek,
  color,
  height = 40,
}: MiniWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Color mapping
  const colors = {
    blue: { bg: '#dbeafe', bar: '#3b82f6', played: '#1d4ed8' },
    red: { bg: '#fee2e2', bar: '#ef4444', played: '#b91c1c' },
    green: { bg: '#dcfce7', bar: '#22c55e', played: '#15803d' },
  };
  const colorSet = colors[color as keyof typeof colors] || colors.blue;

  // Generate waveform data
  const getWaveformData = useCallback((audioBuffer: AudioBuffer, samples: number = 100) => {
    const rawData = audioBuffer.getChannelData(0);
    const blockSize = Math.floor(rawData.length / samples);
    const waveform: number[] = [];

    for (let i = 0; i < samples; i++) {
      const start = blockSize * i;
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(rawData[start + j] || 0);
      }
      waveform.push(sum / blockSize);
    }

    const max = Math.max(...waveform);
    return max > 0 ? waveform.map((v) => v / max) : waveform;
  }, []);

  // Draw waveform
  useEffect(() => {
    if (!canvasRef.current || !buffer || duration <= 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const width = rect.width;

    canvas.width = width * 2;
    canvas.height = height * 2;
    ctx.scale(2, 2);

    // Background
    ctx.fillStyle = colorSet.bg;
    ctx.fillRect(0, 0, width, height);

    // Generate waveform
    const waveformData = getWaveformData(buffer, Math.floor(width / 3));
    const barWidth = 2;
    const gap = 1;
    const totalBarWidth = barWidth + gap;
    const centerY = height / 2;
    const maxAmplitude = height * 0.4;

    // Progress position
    const progressX = (currentTime / duration) * width;

    // Draw bars
    waveformData.forEach((amplitude, i) => {
      const x = i * totalBarWidth;
      const barHeight = Math.max(2, amplitude * maxAmplitude * 2);
      const y = centerY - barHeight / 2;

      // Color based on playback position
      ctx.fillStyle = x < progressX ? colorSet.played : colorSet.bar;
      ctx.fillRect(x, y, barWidth, barHeight);
    });

    // Draw playhead
    ctx.fillStyle = colorSet.played;
    ctx.fillRect(progressX - 1, 0, 2, height);
  }, [buffer, currentTime, duration, height, colorSet, getWaveformData]);

  // Handle seek
  const handleInteraction = useCallback(
    (clientX: number) => {
      if (!containerRef.current || duration <= 0) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, x / rect.width));
      onSeek(ratio * duration);
    },
    [duration, onSeek]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    handleInteraction(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    handleInteraction(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    handleInteraction(e.touches[0].clientX);
  };

  if (!buffer) {
    return (
      <div
        className="flex-1 rounded-lg"
        style={{ height, backgroundColor: colorSet.bg }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 cursor-pointer rounded-lg overflow-hidden"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      style={{ touchAction: 'none' }}
    >
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{ height }}
      />
    </div>
  );
}

export default memo(MiniWaveform);
