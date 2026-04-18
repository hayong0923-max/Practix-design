'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Play, Pause, RotateCcw, Wand2 } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

interface SyncEditModalProps {
  show: boolean;
  onClose: () => void;
  onApply: (offset: number) => void;
  initialOffset: number;
  originalBuffer: AudioBuffer | null;
  recordedBuffer: AudioBuffer | null;
  sectionStart: number;
  sectionEnd: number;
  audioContext: AudioContext | null;
}

// Simple onset detection - find first sound above threshold
function detectOnset(buffer: AudioBuffer, threshold: number = 0.02): number {
  const data = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;

  for (let i = 0; i < data.length; i++) {
    if (Math.abs(data[i]) > threshold) {
      return i / sampleRate;
    }
  }
  return 0;
}

// Generate simple waveform data for display
function generateWaveformData(buffer: AudioBuffer, numSamples: number = 200): number[] {
  const data = buffer.getChannelData(0);
  const blockSize = Math.floor(data.length / numSamples);
  const waveform: number[] = [];

  for (let i = 0; i < numSamples; i++) {
    let max = 0;
    const start = i * blockSize;
    const end = Math.min(start + blockSize, data.length);

    for (let j = start; j < end; j++) {
      const abs = Math.abs(data[j]);
      if (abs > max) max = abs;
    }
    waveform.push(max);
  }

  return waveform;
}

export default function SyncEditModal({
  show,
  onClose,
  onApply,
  initialOffset,
  originalBuffer,
  recordedBuffer,
  sectionStart,
  sectionEnd,
  audioContext,
}: SyncEditModalProps) {
  const { isDark } = useTheme();
  const [offset, setOffset] = useState(initialOffset);
  const [isPlaying, setIsPlaying] = useState(false);
  const [originalWaveform, setOriginalWaveform] = useState<number[]>([]);
  const [recordedWaveform, setRecordedWaveform] = useState<number[]>([]);

  const originalSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const recordedSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const originalGainRef = useRef<GainNode | null>(null);
  const recordedGainRef = useRef<GainNode | null>(null);

  // Generate waveforms when buffers change
  useEffect(() => {
    if (originalBuffer) {
      // Extract section from original
      const sectionDuration = sectionEnd - sectionStart;
      const sectionSamples = Math.floor(sectionDuration * originalBuffer.sampleRate);
      const startSample = Math.floor(sectionStart * originalBuffer.sampleRate);

      if (audioContext && sectionSamples > 0) {
        const sectionBuffer = audioContext.createBuffer(
          originalBuffer.numberOfChannels,
          sectionSamples,
          originalBuffer.sampleRate
        );

        for (let ch = 0; ch < originalBuffer.numberOfChannels; ch++) {
          const sourceData = originalBuffer.getChannelData(ch);
          const targetData = sectionBuffer.getChannelData(ch);
          for (let i = 0; i < sectionSamples; i++) {
            targetData[i] = sourceData[startSample + i] || 0;
          }
        }

        setOriginalWaveform(generateWaveformData(sectionBuffer));
      }
    }
  }, [originalBuffer, sectionStart, sectionEnd, audioContext]);

  useEffect(() => {
    if (recordedBuffer) {
      setRecordedWaveform(generateWaveformData(recordedBuffer));
    }
  }, [recordedBuffer]);

  // Reset offset when modal opens
  useEffect(() => {
    if (show) {
      setOffset(initialOffset);
      setIsPlaying(false);
    }
  }, [show, initialOffset]);

  // Cleanup on close
  useEffect(() => {
    if (!show) {
      stopPreview();
    }
  }, [show]);

  const stopPreview = useCallback(() => {
    if (originalSourceRef.current) {
      try { originalSourceRef.current.stop(); } catch {}
      originalSourceRef.current = null;
    }
    if (recordedSourceRef.current) {
      try { recordedSourceRef.current.stop(); } catch {}
      recordedSourceRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const playPreview = useCallback(() => {
    if (!audioContext || !originalBuffer || !recordedBuffer) return;

    stopPreview();

    // Create gain nodes for panning (original left, recorded right)
    const originalGain = audioContext.createGain();
    const recordedGain = audioContext.createGain();

    // Create stereo panner
    const originalPanner = audioContext.createStereoPanner();
    const recordedPanner = audioContext.createStereoPanner();
    originalPanner.pan.value = -0.7; // Left
    recordedPanner.pan.value = 0.7;  // Right

    originalGain.connect(originalPanner);
    recordedGain.connect(recordedPanner);
    originalPanner.connect(audioContext.destination);
    recordedPanner.connect(audioContext.destination);

    originalGainRef.current = originalGain;
    recordedGainRef.current = recordedGain;

    // Original source (section only)
    const originalSource = audioContext.createBufferSource();
    originalSource.buffer = originalBuffer;
    originalSource.connect(originalGain);

    // Recorded source
    const recordedSource = audioContext.createBufferSource();
    recordedSource.buffer = recordedBuffer;
    recordedSource.connect(recordedGain);

    originalSourceRef.current = originalSource;
    recordedSourceRef.current = recordedSource;

    const now = audioContext.currentTime;
    const sectionDuration = sectionEnd - sectionStart;

    // Start original at section start
    originalSource.start(now, sectionStart, sectionDuration);

    // Start recorded with offset
    if (offset >= 0) {
      // Positive offset: recording starts later
      recordedSource.start(now + offset, 0, recordedBuffer.duration);
    } else {
      // Negative offset: recording starts earlier (skip beginning of recording)
      recordedSource.start(now, -offset, recordedBuffer.duration + offset);
    }

    setIsPlaying(true);

    // Auto stop after playback
    const playDuration = Math.max(sectionDuration, recordedBuffer.duration + Math.abs(offset)) + 0.1;
    setTimeout(() => {
      stopPreview();
    }, playDuration * 1000);

    originalSource.onended = () => {
      if (originalSourceRef.current === originalSource) {
        originalSourceRef.current = null;
      }
    };

    recordedSource.onended = () => {
      if (recordedSourceRef.current === recordedSource) {
        recordedSourceRef.current = null;
        if (!originalSourceRef.current) {
          setIsPlaying(false);
        }
      }
    };
  }, [audioContext, originalBuffer, recordedBuffer, sectionStart, sectionEnd, offset, stopPreview]);

  const handleAutoSync = useCallback(() => {
    if (!originalBuffer || !recordedBuffer || !audioContext) return;

    // Extract section from original
    const sectionDuration = sectionEnd - sectionStart;
    const sectionSamples = Math.floor(sectionDuration * originalBuffer.sampleRate);
    const startSample = Math.floor(sectionStart * originalBuffer.sampleRate);

    const sectionBuffer = audioContext.createBuffer(
      1,
      sectionSamples,
      originalBuffer.sampleRate
    );

    const sourceData = originalBuffer.getChannelData(0);
    const targetData = sectionBuffer.getChannelData(0);
    for (let i = 0; i < sectionSamples; i++) {
      targetData[i] = sourceData[startSample + i] || 0;
    }

    // Detect onsets
    const originalOnset = detectOnset(sectionBuffer);
    const recordedOnset = detectOnset(recordedBuffer);

    // Calculate offset
    const suggestedOffset = originalOnset - recordedOnset;

    // Clamp to reasonable range
    const clampedOffset = Math.max(-3, Math.min(3, suggestedOffset));
    setOffset(Math.round(clampedOffset * 100) / 100);
  }, [originalBuffer, recordedBuffer, sectionStart, sectionEnd, audioContext]);

  const handleApply = () => {
    stopPreview();
    onApply(offset);
    onClose();
  };

  if (!show) return null;

  const sectionDuration = sectionEnd - sectionStart;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-md rounded-2xl p-5 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            싱크 편집
          </h2>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <X className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          </button>
        </div>

        {/* Waveform Preview */}
        <div className={`rounded-lg p-3 mb-4 ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
          {/* Original waveform */}
          <div className="mb-2">
            <div className={`text-xs mb-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              원곡 (구간)
            </div>
            <div className="h-10 flex items-center gap-[1px]">
              {originalWaveform.map((v, i) => (
                <div
                  key={i}
                  className={`flex-1 ${isDark ? 'bg-blue-500' : 'bg-blue-400'}`}
                  style={{ height: `${Math.max(2, v * 100)}%` }}
                />
              ))}
            </div>
          </div>

          {/* Recorded waveform (shifted) */}
          <div>
            <div className={`text-xs mb-1 flex items-center justify-between ${isDark ? 'text-red-400' : 'text-red-600'}`}>
              <span>녹음</span>
              <span className="text-[10px]">
                {offset > 0 ? `+${offset.toFixed(2)}초 (늦게 시작)` :
                 offset < 0 ? `${offset.toFixed(2)}초 (일찍 시작)` : '동기화됨'}
              </span>
            </div>
            <div
              className="h-10 flex items-center gap-[1px] transition-transform"
              style={{
                transform: `translateX(${(offset / sectionDuration) * 100}%)`,
              }}
            >
              {recordedWaveform.map((v, i) => (
                <div
                  key={i}
                  className={`flex-1 ${isDark ? 'bg-red-500' : 'bg-red-400'}`}
                  style={{ height: `${Math.max(2, v * 100)}%` }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Offset Control */}
        <div className={`rounded-lg p-3 mb-4 ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
          <div className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            오프셋: <span className="text-purple-500">{offset >= 0 ? '+' : ''}{offset.toFixed(2)}초</span>
          </div>

          {/* Main slider */}
          <input
            type="range"
            min="-3"
            max="3"
            step="0.01"
            value={offset}
            onChange={(e) => setOffset(parseFloat(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer mb-3
              [&::-webkit-slider-track]:bg-gradient-to-r [&::-webkit-slider-track]:from-red-400 [&::-webkit-slider-track]:via-purple-400 [&::-webkit-slider-track]:to-blue-400 [&::-webkit-slider-track]:rounded-full
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-purple-500 [&::-webkit-slider-thumb]:shadow-md
              [&::-moz-range-track]:bg-gradient-to-r [&::-moz-range-track]:from-red-400 [&::-moz-range-track]:via-purple-400 [&::-moz-range-track]:to-blue-400 [&::-moz-range-track]:rounded-full
              [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-purple-500 [&::-moz-range-thumb]:border-0"
          />

          {/* Fine adjustment buttons */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setOffset(o => Math.max(-3, o - 0.1))}
              className={`px-2 py-1 rounded text-xs ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}
            >
              -0.1s
            </button>
            <button
              onClick={() => setOffset(o => Math.max(-3, o - 0.05))}
              className={`px-2 py-1 rounded text-xs ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}
            >
              -0.05s
            </button>
            <button
              onClick={() => setOffset(0)}
              className={`px-3 py-1 rounded text-xs font-medium ${isDark ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white'}`}
            >
              0
            </button>
            <button
              onClick={() => setOffset(o => Math.min(3, o + 0.05))}
              className={`px-2 py-1 rounded text-xs ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}
            >
              +0.05s
            </button>
            <button
              onClick={() => setOffset(o => Math.min(3, o + 0.1))}
              className={`px-2 py-1 rounded text-xs ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}
            >
              +0.1s
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={handleAutoSync}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium ${
              isDark ? 'bg-amber-600 text-white' : 'bg-amber-500 text-white'
            }`}
          >
            <Wand2 className="w-4 h-4" />
            자동 싱크
          </button>
          <button
            onClick={isPlaying ? stopPreview : playPreview}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium ${
              isDark ? 'bg-green-600 text-white' : 'bg-green-500 text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            미리듣기
          </button>
        </div>

        <div className={`text-[10px] text-center mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          미리듣기: 원곡(좌) + 녹음(우) 스테레오 분리
        </div>

        {/* Apply / Cancel */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium ${
              isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
            }`}
          >
            취소
          </button>
          <button
            onClick={handleApply}
            className="flex-1 bg-purple-500 text-white py-2.5 rounded-lg text-sm font-medium"
          >
            적용
          </button>
        </div>
      </div>
    </div>
  );
}
