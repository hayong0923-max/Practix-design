'use client';

import { useRef, useEffect, useMemo } from 'react';
import { Activity, AlertCircle, Loader2 } from 'lucide-react';
import { PitchAnalysisResult, frequencyToNote } from '@/utils/pitchDetection';
import { useTheme } from '@/hooks/useTheme';

interface PitchComparisonViewProps {
  originalPitch: PitchAnalysisResult | null;
  recordingPitch: PitchAnalysisResult | null;
  matchPercentage: number | null;
  isAnalyzing: boolean;
  error: string | null;
  currentTime?: number;
  duration: number;
}

// Convert frequency to Y position (logarithmic scale for musical pitch)
function freqToY(
  freq: number,
  minFreq: number,
  maxFreq: number,
  height: number,
  padding: number
): number {
  if (freq <= 0) return -1;
  const minLog = Math.log2(minFreq);
  const maxLog = Math.log2(maxFreq);
  const freqLog = Math.log2(freq);
  const ratio = (freqLog - minLog) / (maxLog - minLog);
  return height - padding - ratio * (height - 2 * padding);
}

export default function PitchComparisonView({
  originalPitch,
  recordingPitch,
  matchPercentage,
  isAnalyzing,
  error,
  currentTime = 0,
  duration,
}: PitchComparisonViewProps) {
  const { isDark } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Calculate display range
  const { minFreq, maxFreq } = useMemo(() => {
    let min = 200; // Default range
    let max = 800;

    if (originalPitch) {
      if (originalPitch.minFreq > 0) min = Math.min(min, originalPitch.minFreq * 0.8);
      if (originalPitch.maxFreq > 0) max = Math.max(max, originalPitch.maxFreq * 1.2);
    }
    if (recordingPitch) {
      if (recordingPitch.minFreq > 0) min = Math.min(min, recordingPitch.minFreq * 0.8);
      if (recordingPitch.maxFreq > 0) max = Math.max(max, recordingPitch.maxFreq * 1.2);
    }

    return { minFreq: Math.max(50, min), maxFreq: Math.min(3000, max) };
  }, [originalPitch, recordingPitch]);

  // Draw pitch comparison
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = 30;

    // Clear
    ctx.fillStyle = isDark ? '#1f2937' : '#f9fafb';
    ctx.fillRect(0, 0, width, height);

    // Draw grid lines for notes
    ctx.strokeStyle = isDark ? '#374151' : '#e5e7eb';
    ctx.lineWidth = 0.5;
    ctx.font = '10px sans-serif';
    ctx.fillStyle = isDark ? '#6b7280' : '#9ca3af';

    // Draw horizontal lines for notes (C notes and some others)
    const noteFreqs = [65.41, 130.81, 261.63, 523.25, 1046.5]; // C2, C3, C4, C5, C6
    for (const freq of noteFreqs) {
      if (freq < minFreq || freq > maxFreq) continue;
      const y = freqToY(freq, minFreq, maxFreq, height, padding);
      if (y < 0) continue;

      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - 10, y);
      ctx.stroke();

      const { note } = frequencyToNote(freq);
      ctx.fillText(note, 5, y + 3);
    }

    // Draw time markers
    const timeStep = duration > 30 ? 10 : duration > 10 ? 5 : 1;
    for (let t = 0; t <= duration; t += timeStep) {
      const x = padding + (t / duration) * (width - padding - 10);
      ctx.beginPath();
      ctx.moveTo(x, height - padding);
      ctx.lineTo(x, height - padding + 5);
      ctx.stroke();
      ctx.fillText(`${t}s`, x - 8, height - padding + 15);
    }

    // Helper to draw pitch line
    const drawPitchLine = (
      pitchData: PitchAnalysisResult['pitchData'],
      color: string,
      lineWidth: number
    ) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      let isDrawing = false;
      ctx.beginPath();

      for (let i = 0; i < pitchData.length; i++) {
        const point = pitchData[i];
        if (point.frequency <= 0) {
          isDrawing = false;
          continue;
        }

        const x = padding + (point.time / duration) * (width - padding - 10);
        const y = freqToY(point.frequency, minFreq, maxFreq, height, padding);

        if (y < 0) {
          isDrawing = false;
          continue;
        }

        if (!isDrawing) {
          ctx.moveTo(x, y);
          isDrawing = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    };

    // Draw original pitch (blue)
    if (originalPitch && originalPitch.pitchData.length > 0) {
      drawPitchLine(originalPitch.pitchData, isDark ? '#60a5fa' : '#3b82f6', 2);
    }

    // Draw recording pitch (red/pink)
    if (recordingPitch && recordingPitch.pitchData.length > 0) {
      drawPitchLine(recordingPitch.pitchData, isDark ? '#f87171' : '#ef4444', 2);
    }

    // Draw current time indicator
    if (currentTime > 0 && currentTime <= duration) {
      const x = padding + (currentTime / duration) * (width - padding - 10);
      ctx.strokeStyle = isDark ? '#a78bfa' : '#8b5cf6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }

    // Draw axis labels
    ctx.fillStyle = isDark ? '#9ca3af' : '#6b7280';
    ctx.font = '11px sans-serif';
    ctx.fillText('피치', 5, 15);
    ctx.fillText('시간', width - 30, height - 5);
  }, [originalPitch, recordingPitch, minFreq, maxFreq, duration, currentTime, isDark]);

  // No data state
  if (!originalPitch && !recordingPitch && !isAnalyzing && !error) {
    return (
      <div className={`rounded-xl p-4 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <div className="flex items-center gap-2 mb-3">
          <Activity className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
          <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
            피치 비교 (Beta)
          </span>
        </div>
        <div className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          <p>원곡과 녹음을 분석하면 피치 비교 그래프가 표시됩니다</p>
          <p className="text-sm mt-1">* 단선율 악기 (플룻, 대금 등)에 최적화됨</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl p-4 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
          <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
            피치 비교 (Beta)
          </span>
        </div>

        {/* Match percentage */}
        {matchPercentage !== null && (
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            matchPercentage >= 80
              ? 'bg-green-500/20 text-green-500'
              : matchPercentage >= 60
              ? 'bg-yellow-500/20 text-yellow-500'
              : 'bg-red-500/20 text-red-500'
          }`}>
            일치율: {matchPercentage.toFixed(1)}%
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-2 text-sm">
        <div className="flex items-center gap-1">
          <div className={`w-4 h-0.5 ${isDark ? 'bg-blue-400' : 'bg-blue-500'}`} />
          <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>원곡</span>
        </div>
        <div className="flex items-center gap-1">
          <div className={`w-4 h-0.5 ${isDark ? 'bg-red-400' : 'bg-red-500'}`} />
          <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>내 녹음</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-red-500 mb-2">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Loading */}
      {isAnalyzing && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className={`w-6 h-6 animate-spin ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
          <span className={`ml-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            피치 분석 중...
          </span>
        </div>
      )}

      {/* Canvas */}
      {!isAnalyzing && (
        <canvas
          ref={canvasRef}
          className="w-full rounded-lg"
          style={{ height: 200 }}
        />
      )}
    </div>
  );
}
