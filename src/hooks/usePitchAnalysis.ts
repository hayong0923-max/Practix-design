'use client';

import { useState, useCallback } from 'react';
import {
  analyzePitch,
  comparePitchData,
  PitchAnalysisResult,
} from '@/utils/pitchDetection';

interface UsePitchAnalysisReturn {
  // Analysis states
  isAnalyzing: boolean;
  originalPitch: PitchAnalysisResult | null;
  recordingPitch: PitchAnalysisResult | null;

  // Comparison results
  matchPercentage: number | null;
  deviations: { time: number; centsDiff: number }[] | null;

  // Actions
  analyzeOriginal: (audioBuffer: AudioBuffer) => Promise<void>;
  analyzeRecording: (audioBuffer: AudioBuffer) => Promise<void>;
  clearAnalysis: () => void;

  // Error state
  error: string | null;
}

export function usePitchAnalysis(): UsePitchAnalysisReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [originalPitch, setOriginalPitch] = useState<PitchAnalysisResult | null>(null);
  const [recordingPitch, setRecordingPitch] = useState<PitchAnalysisResult | null>(null);
  const [matchPercentage, setMatchPercentage] = useState<number | null>(null);
  const [deviations, setDeviations] = useState<{ time: number; centsDiff: number }[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeOriginal = useCallback(async (audioBuffer: AudioBuffer) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await analyzePitch(audioBuffer, {
        windowSize: 2048,
        hopSize: 512,
        minFreq: 80,
        maxFreq: 2000,
        confidenceThreshold: 0.6,
      });

      setOriginalPitch(result);

      // If we already have a recording, compare
      if (recordingPitch) {
        const comparison = comparePitchData(result, recordingPitch);
        setMatchPercentage(comparison.matchPercentage);
        setDeviations(comparison.deviations);
      }
    } catch (err) {
      setError('원곡 피치 분석 중 오류가 발생했습니다.');
      console.error('Original pitch analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [recordingPitch]);

  const analyzeRecording = useCallback(async (audioBuffer: AudioBuffer) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await analyzePitch(audioBuffer, {
        windowSize: 2048,
        hopSize: 512,
        minFreq: 80,
        maxFreq: 2000,
        confidenceThreshold: 0.6,
      });

      setRecordingPitch(result);

      // If we already have original, compare
      if (originalPitch) {
        const comparison = comparePitchData(originalPitch, result);
        setMatchPercentage(comparison.matchPercentage);
        setDeviations(comparison.deviations);
      }
    } catch (err) {
      setError('녹음 피치 분석 중 오류가 발생했습니다.');
      console.error('Recording pitch analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [originalPitch]);

  const clearAnalysis = useCallback(() => {
    setOriginalPitch(null);
    setRecordingPitch(null);
    setMatchPercentage(null);
    setDeviations(null);
    setError(null);
  }, []);

  return {
    isAnalyzing,
    originalPitch,
    recordingPitch,
    matchPercentage,
    deviations,
    analyzeOriginal,
    analyzeRecording,
    clearAnalysis,
    error,
  };
}
