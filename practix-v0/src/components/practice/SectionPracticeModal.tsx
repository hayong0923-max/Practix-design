'use client';

import { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  X,
  Play,
  Pause,
  Upload,
  Repeat,
  RotateCcw,
  ChevronLeft,
} from 'lucide-react';
import RecordingButtons from './RecordingButtons';
import { Section, Recording, BackingTrack, TimeSignature, CustomTag } from '@/types';
import { formatTime } from '@/utils/formatTime';
import RecordingsList from './RecordingsList';
import { AudioComparePlayer } from './AudioComparePlayer';
import SectionWaveform from './SectionWaveform';
import { SectionMemo, BackingTrackSection } from './section';
import { useTheme } from '@/hooks/useTheme';

// Reuse prop types from SectionCard
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

interface RecordingsListProps {
  recordings: Recording[];
  selectedRecordingId: number | null;
  customTags?: CustomTag[];
  onSelectRecording: (recordingId: number) => void;
  onRenameRecording: (recordingId: number, newName: string) => void;
  onDeleteRecording: (recordingId: number) => void;
  onUpdateTags: (recordingId: number, tags: string[]) => void;
  onManageTags?: () => void;
}

interface ABPlayerState {
  showABPlayer: boolean;
  selectedRecording: Recording | null;
  recordedBuffer: AudioBuffer | null;
}

interface AudioBuffers {
  audioContext: AudioContext | null;
  originalBuffer: AudioBuffer | null;
}

interface BackingTrackState {
  buffer: AudioBuffer | null;
  currentTime: number;
  isPlaying: boolean;
  volume: number;
}

interface MetronomeState {
  beat: number;
  bpm: number;
  isPlaying: boolean;
  beatsPerMeasure: number;
  timeSignature: TimeSignature;
}

interface LoopControls {
  isLooping: boolean;
  onLoopToggle: () => void;
}

interface CountdownSettings {
  countdownDuration: number;
  onCountdownDurationChange: (duration: number) => void;
}

interface SectionPracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  section: Section;
  index: number;
  // Basic actions
  onDelete: () => void;
  onPlaySection: () => void;
  onPauseSection: () => void;
  onUploadRecording: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
  // Section playback state
  sectionCurrentTime: number; // relative time within section (0 to sectionDuration)
  sectionIsPlaying: boolean;
  onSeekSection: (time: number) => void; // seek within section
  // Waveform
  waveformData: number[] | null;
  totalDuration: number; // Total audio duration
  onSectionBoundaryChange?: (sectionId: number, start: number, end: number) => void;
  // Recording
  recordingState: RecordingState;
  recordingActions: RecordingActions;
  hasBackingTrack: boolean;
  // Backing track setup
  onUploadBackingTrack: (e: React.ChangeEvent<HTMLInputElement>, type: BackingTrack['type']) => void;
  onSetMetronome: (bpm: number, timeSignature: TimeSignature) => void;
  onRemoveBackingTrack: () => void;
  onSetMrMetronomeSync?: (bpm: number, timeSignature: TimeSignature, startBeat: number) => void;
  onRemoveMrMetronomeSync?: () => void;
  isUploadingBackingTrack: boolean;
  // Memo
  editingMemo: number | null;
  onEditMemo: () => void;
  onSaveMemo: (memo: string) => void;
  // Section name
  onRenameSection?: (newName: string) => void;
  // Recordings list
  recordingsList: RecordingsListProps;
  // AB Player
  audioBuffers: AudioBuffers;
  abPlayerState: ABPlayerState;
  backingTrackState: BackingTrackState;
  metronomeState: MetronomeState;
  loopControls: LoopControls;
  // Backing track actions
  onBackingTrackToggle: () => void;
  onBackingTrackSeek: (time: number) => void;
  onBackingTrackVolumeChange: (volume: number) => void;
  // Countdown settings
  countdownSettings: CountdownSettings;
  // Sync edit
  onSyncEdit?: () => void;
  onAutoSync?: (offset: number) => void;
}

function SectionPracticeModal({
  isOpen,
  onClose,
  section,
  index,
  onDelete,
  onPlaySection,
  onPauseSection,
  onUploadRecording,
  isUploading,
  sectionCurrentTime,
  sectionIsPlaying,
  onSeekSection,
  waveformData,
  totalDuration,
  onSectionBoundaryChange,
  recordingState,
  recordingActions,
  hasBackingTrack,
  onUploadBackingTrack,
  onSetMetronome,
  onRemoveBackingTrack,
  onSetMrMetronomeSync,
  onRemoveMrMetronomeSync,
  isUploadingBackingTrack,
  editingMemo,
  onEditMemo,
  onSaveMemo,
  onRenameSection,
  recordingsList,
  audioBuffers,
  abPlayerState,
  backingTrackState,
  metronomeState,
  loopControls,
  onBackingTrackToggle,
  onBackingTrackSeek,
  onBackingTrackVolumeChange,
  countdownSettings,
  onSyncEdit,
  onAutoSync,
}: SectionPracticeModalProps) {
  const { isDark } = useTheme();
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(section.name || '');

  const sectionDuration = section.end - section.start;
  const sectionName = section.name || `구간 ${index + 1}`;

  // Beat/time adjustment: get BPM from section backing track or metronome
  const effectiveBpm = section.backingTrack?.bpm || metronomeState.bpm || 0;
  const effectiveBeatsPerMeasure = metronomeState.beatsPerMeasure || 4;
  const beatDuration = effectiveBpm > 0 ? 60 / effectiveBpm : 0;
  const hasBpm = effectiveBpm > 0;

  const adjustBoundary = useCallback((edge: 'start' | 'end', deltaSeconds: number) => {
    if (!onSectionBoundaryChange) return;
    let newStart = section.start;
    let newEnd = section.end;
    const minGap = hasBpm ? beatDuration : 0.5;
    if (edge === 'start') {
      newStart = Math.max(0, section.start + deltaSeconds);
      if (newStart >= newEnd - minGap) return;
    } else {
      newEnd = Math.min(totalDuration, section.end + deltaSeconds);
      if (newEnd <= newStart + minGap) return;
    }
    onSectionBoundaryChange(section.id, newStart, newEnd);
  }, [section, onSectionBoundaryChange, beatDuration, hasBpm, totalDuration]);

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Progress bar drag handling
  const handleProgressBarInteraction = useCallback(
    (clientX: number) => {
      if (!progressBarRef.current) return;
      const rect = progressBarRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, x / rect.width));
      const newTime = ratio * sectionDuration;
      onSeekSection(newTime);
    },
    [sectionDuration, onSeekSection]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleProgressBarInteraction(e.clientX);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        handleProgressBarInteraction(e.clientX);
      }
    },
    [isDragging, handleProgressBarInteraction]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Touch handling for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    handleProgressBarInteraction(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) {
      handleProgressBarInteraction(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  if (!isOpen) return null;

  const progressPercent = sectionDuration > 0 ? (sectionCurrentTime / sectionDuration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 ${isDark ? 'bg-gray-900' : 'bg-white'}`}
      />

      {/* Content */}
      <div className="relative flex flex-col h-full">
        {/* Header */}
        <div
          className={`flex items-center justify-between px-4 safe-top pb-4 border-b ${
            isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
          }`}
        >
          <button
            onClick={onClose}
            className={`flex items-center gap-1 text-sm ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            뒤로
          </button>

          <div className="text-center">
            {isEditingName ? (
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onBlur={() => {
                  setIsEditingName(false);
                  if (editedName.trim() && editedName !== section.name) {
                    onRenameSection?.(editedName.trim());
                  } else {
                    setEditedName(section.name || '');
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                  } else if (e.key === 'Escape') {
                    setEditedName(section.name || '');
                    setIsEditingName(false);
                  }
                }}
                autoFocus
                className={`text-lg font-bold text-center border rounded px-2 py-0.5 outline-none min-w-[100px] ${
                  isDark
                    ? 'text-white bg-gray-700 border-blue-400'
                    : 'text-gray-900 bg-white border-blue-400'
                }`}
                placeholder={`구간 ${index + 1}`}
              />
            ) : (
              <h2
                className={`text-lg font-bold cursor-pointer hover:opacity-70 ${isDark ? 'text-white' : 'text-gray-900'}`}
                onClick={() => {
                  setEditedName(section.name || '');
                  setIsEditingName(true);
                }}
                title="클릭해서 이름 변경"
              >
                {sectionName}
              </h2>
            )}
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {formatTime(section.start)} - {formatTime(section.end)}
            </p>
          </div>

          <div className="w-12" /> {/* Spacer for centering */}
        </div>

        {/* Main content - scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className={`p-4 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
            {/* Section Waveform */}
            <div className={`mb-6 p-4 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              {/* Time display */}
              <div className="flex justify-between text-sm mb-2">
                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                  {formatTime(sectionCurrentTime)}
                </span>
                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                  {formatTime(sectionDuration)}
                </span>
              </div>

              {/* Waveform with boundary adjustment */}
              <SectionWaveform
                waveformData={waveformData}
                duration={totalDuration}
                sectionStart={section.start}
                sectionEnd={section.end}
                currentTime={sectionCurrentTime}
                isPlaying={sectionIsPlaying}
                onSeek={onSeekSection}
                onSectionBoundaryChange={
                  onSectionBoundaryChange
                    ? (start, end) => onSectionBoundaryChange(section.id, start, end)
                    : undefined
                }
                showHandles={!!onSectionBoundaryChange}
              />

              {/* Boundary adjustment - always visible */}
              <div className={`mt-4 pt-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="space-y-2">
                  {/* Start adjustment */}
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs w-8 flex-shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>시작</span>
                    <button onClick={() => adjustBoundary('start', hasBpm ? -beatDuration * effectiveBeatsPerMeasure : -5)}
                      className={`px-2 py-1 text-xs rounded ${isDark ? 'bg-gray-700 text-gray-300 active:bg-gray-600' : 'bg-gray-100 text-gray-600 active:bg-gray-200'}`}>
                      {hasBpm ? `-${effectiveBeatsPerMeasure}박` : '-5초'}
                    </button>
                    <button onClick={() => adjustBoundary('start', hasBpm ? -beatDuration : -1)}
                      className={`px-2 py-1 text-xs rounded ${isDark ? 'bg-gray-700 text-gray-300 active:bg-gray-600' : 'bg-gray-100 text-gray-600 active:bg-gray-200'}`}>
                      {hasBpm ? '-1박' : '-1초'}
                    </button>
                    <span className={`flex-1 text-center text-xs font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {formatTime(section.start)}
                    </span>
                    <button onClick={() => adjustBoundary('start', hasBpm ? beatDuration : 1)}
                      className={`px-2 py-1 text-xs rounded ${isDark ? 'bg-gray-700 text-gray-300 active:bg-gray-600' : 'bg-gray-100 text-gray-600 active:bg-gray-200'}`}>
                      {hasBpm ? '+1박' : '+1초'}
                    </button>
                    <button onClick={() => adjustBoundary('start', hasBpm ? beatDuration * effectiveBeatsPerMeasure : 5)}
                      className={`px-2 py-1 text-xs rounded ${isDark ? 'bg-gray-700 text-gray-300 active:bg-gray-600' : 'bg-gray-100 text-gray-600 active:bg-gray-200'}`}>
                      {hasBpm ? `+${effectiveBeatsPerMeasure}박` : '+5초'}
                    </button>
                  </div>
                  {/* End adjustment */}
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs w-8 flex-shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>끝</span>
                    <button onClick={() => adjustBoundary('end', hasBpm ? -beatDuration * effectiveBeatsPerMeasure : -5)}
                      className={`px-2 py-1 text-xs rounded ${isDark ? 'bg-gray-700 text-gray-300 active:bg-gray-600' : 'bg-gray-100 text-gray-600 active:bg-gray-200'}`}>
                      {hasBpm ? `-${effectiveBeatsPerMeasure}박` : '-5초'}
                    </button>
                    <button onClick={() => adjustBoundary('end', hasBpm ? -beatDuration : -1)}
                      className={`px-2 py-1 text-xs rounded ${isDark ? 'bg-gray-700 text-gray-300 active:bg-gray-600' : 'bg-gray-100 text-gray-600 active:bg-gray-200'}`}>
                      {hasBpm ? '-1박' : '-1초'}
                    </button>
                    <span className={`flex-1 text-center text-xs font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {formatTime(section.end)}
                    </span>
                    <button onClick={() => adjustBoundary('end', hasBpm ? beatDuration : 1)}
                      className={`px-2 py-1 text-xs rounded ${isDark ? 'bg-gray-700 text-gray-300 active:bg-gray-600' : 'bg-gray-100 text-gray-600 active:bg-gray-200'}`}>
                      {hasBpm ? '+1박' : '+1초'}
                    </button>
                    <button onClick={() => adjustBoundary('end', hasBpm ? beatDuration * effectiveBeatsPerMeasure : 5)}
                      className={`px-2 py-1 text-xs rounded ${isDark ? 'bg-gray-700 text-gray-300 active:bg-gray-600' : 'bg-gray-100 text-gray-600 active:bg-gray-200'}`}>
                      {hasBpm ? `+${effectiveBeatsPerMeasure}박` : '+5초'}
                    </button>
                  </div>
                  <p className={`text-[10px] text-center ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                    {hasBpm ? `BPM ${effectiveBpm} · 1박 = ${beatDuration.toFixed(2)}초` : '메트로놈/반주 설정 시 박자 단위로 조절'}
                  </p>
                </div>
              </div>

              {/* Play controls */}
              <div className="flex items-center justify-center gap-4 mt-4">
                {/* Reset button */}
                <button
                  onClick={() => onSeekSection(0)}
                  className={`p-3 rounded-full ${
                    isDark
                      ? 'bg-gray-700 text-gray-300 active:bg-gray-600'
                      : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                  }`}
                >
                  <RotateCcw className="w-5 h-5" />
                </button>

                {/* Play/Pause button */}
                <button
                  onClick={sectionIsPlaying ? onPauseSection : onPlaySection}
                  className="p-4 bg-blue-500 text-white rounded-full active:bg-blue-600"
                >
                  {sectionIsPlaying ? (
                    <Pause className="w-8 h-8" />
                  ) : (
                    <Play className="w-8 h-8 ml-1" />
                  )}
                </button>

                {/* Loop button */}
                <button
                  onClick={loopControls.onLoopToggle}
                  className={`p-3 rounded-full ${
                    loopControls.isLooping
                      ? 'bg-blue-500 text-white'
                      : isDark
                      ? 'bg-gray-700 text-gray-300 active:bg-gray-600'
                      : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                  }`}
                >
                  <Repeat className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Recording Section */}
            <div className={`mb-4 p-4 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                녹음
              </h3>

              {/* Recording error */}
              {recordingState.error && (
                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{recordingState.error}</p>
                </div>
              )}

              {/* Recording controls - using shared component for consistency */}
              <div className="flex flex-wrap items-center gap-2">
                <RecordingButtons
                  recordingState={recordingState}
                  hasBackingTrack={hasBackingTrack}
                  disabled={false}
                  onStartRecording={recordingActions.onStartRecording}
                  onStopRecording={recordingActions.onStopRecording}
                  onCancelCountdown={recordingActions.onCancelCountdown}
                  countdownDuration={countdownSettings.countdownDuration}
                  onCountdownDurationChange={countdownSettings.onCountdownDurationChange}
                />

                {/* Upload recording */}
                <button
                  onClick={() => uploadInputRef.current?.click()}
                  disabled={isUploading}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg ${
                    isDark
                      ? 'bg-gray-700 text-gray-300 active:bg-gray-600'
                      : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                  } ${isUploading ? 'opacity-50' : ''}`}
                >
                  <Upload className="w-4 h-4" />
                  {isUploading ? '업로드 중...' : '업로드'}
                </button>
                <input
                  ref={uploadInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={onUploadRecording}
                  className="hidden"
                />
              </div>
            </div>

            {/* Backing Track Section */}
            <div className={`mb-4 p-4 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                반주/메트로놈
              </h3>
              <BackingTrackSection
                backingTrack={section.backingTrack || null}
                isUploading={isUploadingBackingTrack}
                onUploadBackingTrack={onUploadBackingTrack}
                onSetMetronome={onSetMetronome}
                onRemoveBackingTrack={onRemoveBackingTrack}
                onSetMrMetronomeSync={onSetMrMetronomeSync}
                onRemoveMrMetronomeSync={onRemoveMrMetronomeSync}
              />
            </div>

            {/* Memo Section */}
            <div className={`mb-4 p-4 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                메모
              </h3>
              <SectionMemo
                memo={section.memo}
                isEditing={editingMemo === section.id}
                onEdit={onEditMemo}
                onSave={onSaveMemo}
              />
            </div>

            {/* Recordings List */}
            <div className={`mb-4 p-4 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                녹음 목록 ({recordingsList.recordings.length})
              </h3>
              <RecordingsList
                recordings={recordingsList.recordings}
                selectedRecordingId={recordingsList.selectedRecordingId}
                customTags={recordingsList.customTags}
                onSelectRecording={recordingsList.onSelectRecording}
                onRenameRecording={recordingsList.onRenameRecording}
                onDeleteRecording={recordingsList.onDeleteRecording}
                onUpdateTags={recordingsList.onUpdateTags}
                onManageTags={recordingsList.onManageTags}
              />
            </div>

            {/* AB Compare Player */}
            {abPlayerState.showABPlayer &&
              abPlayerState.selectedRecording &&
              abPlayerState.recordedBuffer && (
                <div className={`mb-4 p-4 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                  <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    AB 비교
                  </h3>
                  <AudioComparePlayer
                    audioContext={audioBuffers.audioContext}
                    originalBuffer={audioBuffers.originalBuffer}
                    recordedBuffer={abPlayerState.recordedBuffer}
                    section={section}
                    recording={abPlayerState.selectedRecording}
                    sectionStart={section.start}
                    sectionEnd={section.end}
                    backingTrack={section.backingTrack || null}
                    backingTrackCurrentTime={backingTrackState.currentTime}
                    backingTrackDuration={backingTrackState.buffer?.duration || 0}
                    backingTrackIsPlaying={backingTrackState.isPlaying}
                    onBackingTrackToggle={onBackingTrackToggle}
                    onBackingTrackSeek={onBackingTrackSeek}
                    backingTrackVolume={backingTrackState.volume}
                    onBackingTrackVolumeChange={onBackingTrackVolumeChange}
                    metronomeBeat={metronomeState.beat}
                    metronomeBpm={metronomeState.bpm}
                    metronomeIsPlaying={metronomeState.isPlaying}
                    metronomeBeatsPerMeasure={metronomeState.beatsPerMeasure}
                    metronomeTimeSignature={metronomeState.timeSignature}
                    onSyncEdit={onSyncEdit}
                    onAutoSync={onAutoSync}
                    isLooping={loopControls.isLooping}
                    onLoopToggle={loopControls.onLoopToggle}
                    // Recording swipe navigation
                    allRecordings={recordingsList.recordings}
                    currentRecordingIndex={recordingsList.recordings.findIndex(
                      r => r.id === recordingsList.selectedRecordingId
                    )}
                    onRecordingChange={(index) => {
                      const recording = recordingsList.recordings[index];
                      if (recording) {
                        recordingsList.onSelectRecording(recording.id);
                      }
                    }}
                  />
                </div>
              )}

            {/* Delete section button */}
            <button
              onClick={() => {
                if (confirm('이 구간을 삭제하시겠습니까?')) {
                  onDelete();
                  onClose();
                }
              }}
              className="w-full py-3 text-red-500 text-sm font-medium"
            >
              구간 삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(SectionPracticeModal);
