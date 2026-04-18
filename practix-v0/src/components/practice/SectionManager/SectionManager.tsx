'use client';

import React, { memo, useEffect } from 'react';
import { usePracticeContext } from '@/contexts/PracticeContext';
import { useSections } from './useSections';
import { registerBackButtonCloser } from '@/hooks/useBackButton';
import SectionCard from '@/components/practice/SectionCard';
import SectionPracticeModal from '@/components/practice/SectionPracticeModal';
import SyncEditModal from '@/components/modals/SyncEditModal';

const SectionManager = memo(function SectionManager() {
  const ctx = usePracticeContext();
  const sec = useSections();

  // Register back button closer for SectionPracticeModal
  useEffect(() => {
    if (!sec.practicingSection) return;

    const unregister = registerBackButtonCloser(() => {
      if (sec.practicingSection) {
        sec.setPracticingSection(null);
        return true;
      }
      return false;
    });

    return unregister;
  }, [!!sec.practicingSection]);

  // Register back button closer for SyncEditModal
  useEffect(() => {
    if (!sec.showSyncEdit) return;

    const unregister = registerBackButtonCloser(() => {
      if (sec.showSyncEdit) {
        sec.setShowSyncEdit(false);
        sec.setSyncEditSection(null);
        sec.setSyncEditRecording(null);
        return true;
      }
      return false;
    });

    return unregister;
  }, [sec.showSyncEdit]);

  if (!ctx.audioBuffer && ctx.sections.length === 0) return null;

  return (
    <>
      {/* Section list */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-800">구간 목록</h3>
        <div>
          {ctx.sections.map((section, idx) => (
              <SectionCard
                key={section.id}
                section={section}
                index={idx}
                onDelete={() => sec.deleteSection(section.id)}
                onPlaySection={() => sec.playSection(section)}
                onOpenPractice={() => {
                  ctx.stopPlayback();
                  sec.setPracticingSection(section);
                  sec.setPracticingSectionIndex(idx);
                }}
                onUploadRecording={(e) => sec.handleRecordedFileUpload(e, section)}
                isUploading={sec.uploadingSectionId === section.id}
                recordingState={{
                  isRecording: ctx.isRecording && sec.recordingSectionId === section.id,
                  isCountingDown: ctx.isCountingDown && sec.recordingSectionId === section.id,
                  countdown: ctx.countdown,
                  recordingTime: ctx.recordingTime,
                  audioLevel: sec.recordingSectionId === section.id ? ctx.audioLevel : 0,
                  error: sec.recordingSectionId === section.id ? ctx.recordingError : null,
                }}
                recordingActions={{
                  onStartRecording: (countdownSeconds, withBackingTrack) =>
                    sec.handleStartRecording(section, countdownSeconds, withBackingTrack),
                  onStopRecording: () => sec.handleStopRecording(section),
                  onCancelCountdown: ctx.cancelCountdown,
                }}
                hasBackingTrack={!!section.backingTrack}
                editingMemo={sec.editingMemo}
                onEditMemo={() => sec.setEditingMemo(section.id)}
                onSaveMemo={(memo) => sec.saveMemo(section, memo)}
                loopControls={{
                  isLooping: ctx.isLooping,
                  onLoopToggle: () => ctx.setIsLooping((prev) => !prev),
                }}
                countdownSettings={{
                  countdownDuration: ctx.countdownDuration,
                  onCountdownDurationChange: ctx.handleCountdownDurationChange,
                }}
                recordingsCount={section.recordedFiles?.length || 0}
                onDragStart={sec.handleDragStart}
                onDragOver={sec.handleDragOver}
                onDragEnd={sec.handleDragEnd}
                isDragging={sec.draggedSectionIndex === idx}
                isDragOver={sec.dragOverSectionIndex === idx}
                isNew={ctx.newSectionIds.has(section.id)}
                onClearNewHighlight={() => ctx.clearNewHighlight(section.id)}
              />
            ))}
        </div>
      </div>

      {/* Section Practice Modal */}
      {sec.practicingSection && (
        <SectionPracticeModal
          isOpen={!!sec.practicingSection}
          onClose={() => sec.setPracticingSection(null)}
          section={sec.practicingSection}
          index={sec.practicingSectionIndex}
          onDelete={() => sec.deleteSection(sec.practicingSection!.id)}
          onPlaySection={() => sec.playSection(sec.practicingSection!)}
          onPauseSection={ctx.stopPlayback}
          onUploadRecording={(e) => sec.handleRecordedFileUpload(e, sec.practicingSection!)}
          isUploading={sec.uploadingSectionId === sec.practicingSection.id}
          sectionCurrentTime={
            ctx.selectedSection?.id === sec.practicingSection.id
              ? Math.max(0, ctx.currentTime - sec.practicingSection.start)
              : 0
          }
          sectionIsPlaying={ctx.isPlaying && ctx.selectedSection?.id === sec.practicingSection.id}
          onSeekSection={(time) => {
            const absoluteTime = sec.practicingSection!.start + time;
            ctx.setSelectedSection(sec.practicingSection!);
            ctx.setCurrentTime(absoluteTime);
            ctx.playAudio();
          }}
          waveformData={ctx.waveformData}
          totalDuration={ctx.duration}
          onSectionBoundaryChange={sec.handleSectionBoundaryChange}
          recordingState={{
            isRecording: ctx.isRecording && sec.recordingSectionId === sec.practicingSection.id,
            isCountingDown: ctx.isCountingDown && sec.recordingSectionId === sec.practicingSection.id,
            countdown: ctx.countdown,
            recordingTime: ctx.recordingTime,
            audioLevel: sec.recordingSectionId === sec.practicingSection.id ? ctx.audioLevel : 0,
            error: sec.recordingSectionId === sec.practicingSection.id ? ctx.recordingError : null,
          }}
          recordingActions={{
            onStartRecording: (countdownSeconds, withBackingTrack) =>
              sec.handleStartRecording(sec.practicingSection!, countdownSeconds, withBackingTrack),
            onStopRecording: () => sec.handleStopRecording(sec.practicingSection!),
            onCancelCountdown: ctx.cancelCountdown,
          }}
          hasBackingTrack={!!sec.practicingSection.backingTrack}
          onUploadBackingTrack={(e, type) => ctx.handleBackingTrackUpload(e, sec.practicingSection!, type)}
          onSetMetronome={(bpm, timeSignature) => ctx.handleSetMetronome(sec.practicingSection!, bpm, timeSignature)}
          onRemoveBackingTrack={() => ctx.handleRemoveBackingTrack(sec.practicingSection!)}
          onSetMrMetronomeSync={(bpm, ts, startBeat) => ctx.handleSetMrMetronomeSync(sec.practicingSection!, bpm, ts, startBeat)}
          onRemoveMrMetronomeSync={() => ctx.handleRemoveMrMetronomeSync(sec.practicingSection!)}
          isUploadingBackingTrack={ctx.uploadingBackingTrackId === sec.practicingSection.id}
          editingMemo={sec.editingMemo}
          onEditMemo={() => sec.setEditingMemo(sec.practicingSection!.id)}
          onSaveMemo={(memo) => sec.saveMemo(sec.practicingSection!, memo)}
          onRenameSection={(newName) => sec.renameSection(sec.practicingSection!, newName)}
          recordingsList={{
            recordings: sec.practicingSection.recordedFiles || [],
            selectedRecordingId: sec.selectedRecordings[sec.practicingSection.id] || null,
            customTags: ctx.customTags,
            onSelectRecording: (recordingId) =>
              sec.setSelectedRecordings((prev) => ({ ...prev, [sec.practicingSection!.id]: recordingId })),
            onRenameRecording: (recordingId, newName) => sec.renameRecording(sec.practicingSection!, recordingId, newName),
            onDeleteRecording: (recordingId) => sec.deleteRecording(sec.practicingSection!, recordingId),
            onUpdateTags: (recordingId, tags) => sec.updateRecordingTags(sec.practicingSection!, recordingId, tags),
            onManageTags: () => {},
          }}
          audioBuffers={{
            audioContext: ctx.audioContext,
            originalBuffer: ctx.audioBuffer,
          }}
          abPlayerState={{
            showABPlayer: !!(sec.selectedRecordings[sec.practicingSection.id] && ctx.recordedAudioBuffer[sec.selectedRecordings[sec.practicingSection.id]]),
            selectedRecording: sec.practicingSection.recordedFiles?.find(r => r.id === sec.selectedRecordings[sec.practicingSection!.id]) || null,
            recordedBuffer: sec.selectedRecordings[sec.practicingSection.id] ? ctx.recordedAudioBuffer[sec.selectedRecordings[sec.practicingSection.id]] || null : null,
          }}
          backingTrackState={{
            buffer: ctx.backingTrackBuffers[sec.practicingSection.id] || null,
            currentTime: ctx.backingTrackCurrentTime[sec.practicingSection.id] || 0,
            isPlaying: ctx.backingTrackIsPlaying[sec.practicingSection.id] || false,
            volume: ctx.backingTrackVolumes[sec.practicingSection.id] ?? 1,
          }}
          metronomeState={{
            beat: ctx.metronomeBeat,
            bpm: ctx.metronomeBpm,
            isPlaying: ctx.metronomeIsPlaying,
            beatsPerMeasure: ctx.metronomeBeatsPerMeasure,
            timeSignature: ctx.metronomeTimeSignature,
          }}
          loopControls={{
            isLooping: ctx.isLooping,
            onLoopToggle: () => ctx.setIsLooping((prev) => !prev),
          }}
          onBackingTrackToggle={() => ctx.toggleBackingTrack(sec.practicingSection!.id)}
          onBackingTrackSeek={(time: number) => ctx.seekBackingTrack(sec.practicingSection!.id, time)}
          onBackingTrackVolumeChange={(volume: number) => ctx.updateBackingTrackVolume(sec.practicingSection!.id, volume)}
          countdownSettings={{
            countdownDuration: ctx.countdownDuration,
            onCountdownDurationChange: ctx.handleCountdownDurationChange,
          }}
          onSyncEdit={
            sec.selectedRecordings[sec.practicingSection.id] && sec.practicingSection.recordedFiles?.find(r => r.id === sec.selectedRecordings[sec.practicingSection!.id])
              ? () => sec.handleOpenSyncEdit(sec.practicingSection!, sec.practicingSection!.recordedFiles!.find(r => r.id === sec.selectedRecordings[sec.practicingSection!.id])!)
              : undefined
          }
          onAutoSync={
            sec.selectedRecordings[sec.practicingSection.id]
              ? (offset: number) => sec.handleAutoSyncApply(sec.practicingSection!.id, sec.selectedRecordings[sec.practicingSection!.id], offset)
              : undefined
          }
        />
      )}

      {/* Sync Edit Modal */}
      <SyncEditModal
        show={sec.showSyncEdit}
        onClose={() => {
          sec.setShowSyncEdit(false);
          sec.setSyncEditSection(null);
          sec.setSyncEditRecording(null);
        }}
        onApply={sec.handleSyncOffsetApply}
        initialOffset={sec.syncEditRecording?.syncOffset || 0}
        originalBuffer={ctx.audioBuffer}
        recordedBuffer={sec.syncEditRecording ? ctx.recordedAudioBuffer[sec.syncEditRecording.id] || null : null}
        sectionStart={sec.syncEditSection?.start || 0}
        sectionEnd={sec.syncEditSection?.end || 0}
        audioContext={ctx.audioContext}
      />
    </>
  );
});

export default SectionManager;
