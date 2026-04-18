'use client';

import { memo } from 'react';
import PitchComparisonView from './PitchComparisonView';
import { PitchAnalysisResult } from '@/utils/pitchDetection';

interface PitchComparisonSectionProps {
  isExpanded: boolean;
  onToggleExpand: () => void;
  originalPitch: PitchAnalysisResult | null;
  recordingPitch: PitchAnalysisResult | null;
  matchPercentage: number | null;
  isAnalyzing: boolean;
  error: string | null;
  currentTime: number;
  duration: number;
  hasAudioBuffer: boolean;
  hasRecordingBuffer: boolean;
  isDark: boolean;
  onAnalyzeOriginal: () => void;
  onAnalyzeRecording: () => void;
  onClearAnalysis: () => void;
}

function PitchComparisonSection({
  isExpanded,
  onToggleExpand,
  originalPitch,
  recordingPitch,
  matchPercentage,
  isAnalyzing,
  error,
  currentTime,
  duration,
  hasAudioBuffer,
  hasRecordingBuffer,
  isDark,
  onAnalyzeOriginal,
  onAnalyzeRecording,
  onClearAnalysis,
}: PitchComparisonSectionProps) {
  return (
    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} mt-2 px-4 py-4`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>피치 비교</h3>
          <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-500">Beta</span>
        </div>
        <button
          onClick={onToggleExpand}
          className="text-sm text-purple-500 active:opacity-70"
        >
          {isExpanded ? '접기' : '펼치기'}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-3">
          {/* Analyze buttons */}
          <div className="flex gap-2">
            <button
              onClick={onAnalyzeOriginal}
              disabled={isAnalyzing || !hasAudioBuffer}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium ${
                originalPitch
                  ? isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'
                  : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
              } disabled:opacity-50`}
            >
              {originalPitch ? '원곡 분석됨 ✓' : '원곡 분석'}
            </button>
            <button
              onClick={onAnalyzeRecording}
              disabled={isAnalyzing || !hasRecordingBuffer}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium ${
                recordingPitch
                  ? isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-600'
                  : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
              } disabled:opacity-50`}
            >
              {recordingPitch ? '녹음 분석됨 ✓' : '녹음 분석'}
            </button>
          </div>

          {(originalPitch || recordingPitch) && (
            <button
              onClick={onClearAnalysis}
              className={`w-full py-2 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
            >
              분석 초기화
            </button>
          )}

          <PitchComparisonView
            originalPitch={originalPitch}
            recordingPitch={recordingPitch}
            matchPercentage={matchPercentage}
            isAnalyzing={isAnalyzing}
            error={error}
            currentTime={currentTime}
            duration={duration}
          />

          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            * 단선율 악기 (플룻, 대금 등)에 최적화됨
          </p>
        </div>
      )}
    </div>
  );
}

export default memo(PitchComparisonSection);
