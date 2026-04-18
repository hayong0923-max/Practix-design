'use client';

import { useState, useEffect, memo } from 'react';
import { ChevronDown, ChevronUp, Play, Trash2, Mic, Maximize2 } from 'lucide-react';
import { Section } from '@/types';
import { formatTime } from '@/utils/formatTime';
import { SectionMemo, SectionActionButtons } from './section';

// Grouped prop types for cleaner interface
interface RecordingState {
  isRecording: boolean;
  isCountingDown: boolean;
  countdown: number;
  recordingTime: number;
  audioLevel: number;
  error: string | null;
}

interface RecordingActions {
  onStartRecording: (countdownSeconds?: number, withBackingTrack?: boolean) => void;
  onStopRecording: () => void;
  onCancelCountdown: () => void;
}

interface LoopControls {
  isLooping: boolean;
  onLoopToggle: () => void;
}

interface CountdownSettings {
  countdownDuration: number;
  onCountdownDurationChange: (duration: number) => void;
}

interface SectionCardProps {
  section: Section;
  index: number;
  // Basic actions
  onDelete: () => void;
  onPlaySection: () => void;
  onOpenPractice: () => void;
  onUploadRecording: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
  // Recording
  recordingState: RecordingState;
  recordingActions: RecordingActions;
  hasBackingTrack: boolean;
  // Memo
  editingMemo: number | null;
  onEditMemo: () => void;
  onSaveMemo: (memo: string) => void;
  // Quick controls
  loopControls: LoopControls;
  countdownSettings: CountdownSettings;
  // Recording count
  recordingsCount: number;
  // Drag reorder
  onDragStart?: (index: number) => void;
  onDragOver?: (index: number) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  isDragOver?: boolean;
  isNew?: boolean;
  onClearNewHighlight?: () => void;
}

function SectionCard({
  section,
  index,
  onDelete,
  onPlaySection,
  onOpenPractice,
  onUploadRecording,
  isUploading,
  recordingState,
  recordingActions,
  hasBackingTrack,
  editingMemo,
  onEditMemo,
  onSaveMemo,
  loopControls,
  countdownSettings,
  recordingsCount,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
  isDragOver,
  isNew,
  onClearNewHighlight,
}: SectionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 구간 이름 (없으면 기본값)
  const sectionName = section.name || `구간 ${index + 1}`;

  // Auto-expand when recording or countdown is active
  useEffect(() => {
    if (recordingState.isRecording || recordingState.isCountingDown) {
      setIsExpanded(true);
    }
  }, [recordingState.isRecording, recordingState.isCountingDown]);

  // Collapsed view - minimal: section name + recording count
  const CollapsedHeader = () => (
    <div
      className="flex items-center gap-3 cursor-pointer min-h-[44px]"
      onClick={() => {
        setIsExpanded(!isExpanded);
        onClearNewHighlight?.();
      }}
    >
      {/* Section number badge */}
      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
        {index + 1}
      </div>

      {/* Section name + time */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate text-gray-800">
            {sectionName}
          </span>
          <span className="text-xs text-gray-400">
            {formatTime(section.start)} - {formatTime(section.end)}
          </span>
        </div>
      </div>

      {/* Recording count badge */}
      {recordingsCount > 0 && (
        <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 bg-red-50 text-red-600 rounded flex-shrink-0">
          <Mic className="w-3 h-3" />
          {recordingsCount}
        </span>
      )}

      {/* Quick play */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPlaySection();
        }}
        className="w-8 h-8 bg-blue-500 active:bg-blue-600 text-white rounded-full flex-shrink-0 flex items-center justify-center"
      >
        <Play className="w-3.5 h-3.5" />
      </button>

      {/* Expand chevron */}
      <div className="flex-shrink-0 text-gray-400">
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </div>
    </div>
  );

  return (
    <div
      className={`border rounded-xl transition-all ${
        isDragging
          ? 'opacity-50 border-dashed border-gray-400'
          : isDragOver
          ? 'border-blue-500 border-2 bg-blue-100/50'
          : isNew
          ? 'border-green-400 border-2 bg-green-50 animate-pulse'
          : isExpanded
          ? 'border-blue-300 bg-blue-50/30'
          : 'border-gray-200'
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver?.(index);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDragEnd?.();
      }}
    >
      {/* Always visible collapsed header */}
      <div className="p-3">
        <CollapsedHeader />
      </div>

      {/* Expandable content - quick actions only */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-200">
          {/* Open practice modal button */}
          <button
            onClick={onOpenPractice}
            className="w-full mt-3 mb-3 py-2.5 flex items-center justify-center gap-2 rounded-lg bg-blue-50 text-blue-600 text-sm font-medium active:bg-blue-100"
          >
            <Maximize2 className="w-4 h-4" />
            구간 연습
          </button>

          {/* Quick actions: record + loop */}
          <SectionActionButtons
            recordingState={recordingState}
            hasBackingTrack={hasBackingTrack}
            isUploading={isUploading}
            onPlaySection={onPlaySection}
            onStartRecording={recordingActions.onStartRecording}
            onStopRecording={recordingActions.onStopRecording}
            onCancelCountdown={recordingActions.onCancelCountdown}
            onUploadRecording={onUploadRecording}
            isLooping={loopControls.isLooping}
            onLoopToggle={loopControls.onLoopToggle}
            countdownDuration={countdownSettings.countdownDuration}
            onCountdownDurationChange={countdownSettings.onCountdownDurationChange}
          />

          {recordingState.error && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{recordingState.error}</p>
            </div>
          )}

          {/* Memo preview + delete */}
          <div className="flex justify-between items-start mt-3">
            <div className="flex-1">
              <SectionMemo
                memo={section.memo}
                isEditing={editingMemo === section.id}
                onEdit={onEditMemo}
                onSave={onSaveMemo}
              />
            </div>
            <button
              onClick={onDelete}
              className="text-red-500 hover:text-red-700 p-1 ml-2 flex-shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(SectionCard);
