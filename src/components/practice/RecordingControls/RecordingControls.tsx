'use client';

import React, { memo } from 'react';
import { Mic, Square } from 'lucide-react';
import { usePracticeContext } from '@/contexts/PracticeContext';
import { useBasicRecording } from './useBasicRecording';
import BasicRecordingSection from '@/components/practice/BasicRecordingSection';
import CountdownDial from '@/components/ui/CountdownDial';
import RecordingTrimModal from '@/components/modals/RecordingTrimModal';

// Export hook for cross-module access (FAB needs section recording state)
export { useBasicRecording };

interface RecordingControlsProps {
  hideSectionInline?: boolean;
  inlineOnly?: boolean;
}

const RecordingControls = memo(function RecordingControls({ hideSectionInline, inlineOnly }: RecordingControlsProps) {
  const ctx = usePracticeContext();
  const rec = useBasicRecording();

  // --- Inline only mode (for more menu) ---
  if (inlineOnly) {
    return (
      <>
        <BasicRecordingSection
          recordings={ctx.currentSession.basicRecordings || []}
          selectedRecordingId={rec.selectedBasicRecordingId}
          recordedAudioBuffer={ctx.recordedAudioBuffer}
          recordedIsPlaying={ctx.recordedIsPlaying}
          recordedCurrentTime={ctx.recordedCurrentTime}
          isRecording={ctx.isRecording && rec.isBasicRecording}
          isCountingDown={ctx.isCountingDown && rec.isBasicRecording}
          countdown={ctx.countdown}
          recordingTime={ctx.recordingTime}
          audioLevel={ctx.audioLevel}
          countdownDuration={ctx.countdownDuration}
          isDark={ctx.isDark}
          onSelectRecording={rec.setSelectedBasicRecordingId}
          onTogglePlay={ctx.toggleRecordedPlay}
          onSeek={ctx.seekRecorded}
          onStartRecording={rec.handleStartBasicRecording}
          onStopRecording={rec.handleStopBasicRecording}
          onCancelCountdown={() => {
            ctx.cancelCountdown();
            rec.setIsBasicRecording(false);
          }}
          onDeleteRecording={rec.deleteBasicRecording}
          onTrimRecording={rec.setTrimmingRecording}
          onCountdownDurationChange={ctx.handleCountdownDurationChange}
          getEffectiveDuration={ctx.getEffectiveDuration}
        />
        {rec.trimmingRecording && (
          <RecordingTrimModal
            show={!!rec.trimmingRecording}
            onClose={() => rec.setTrimmingRecording(null)}
            recording={rec.trimmingRecording}
            audioBuffer={ctx.recordedAudioBuffer[rec.trimmingRecording.id] || null}
            audioContext={ctx.audioContext}
            onSave={rec.handleSaveBasicRecordingTrim}
          />
        )}
      </>
    );
  }

  // --- Mobile layout ---
  return (
    <>
      {/* Basic Recording Section (hidden when hideSectionInline) */}
      {!hideSectionInline && (
        <BasicRecordingSection
          recordings={ctx.currentSession.basicRecordings || []}
          selectedRecordingId={rec.selectedBasicRecordingId}
          recordedAudioBuffer={ctx.recordedAudioBuffer}
          recordedIsPlaying={ctx.recordedIsPlaying}
          recordedCurrentTime={ctx.recordedCurrentTime}
          isRecording={ctx.isRecording && rec.isBasicRecording}
          isCountingDown={ctx.isCountingDown && rec.isBasicRecording}
          countdown={ctx.countdown}
          recordingTime={ctx.recordingTime}
          audioLevel={ctx.audioLevel}
          countdownDuration={ctx.countdownDuration}
          isDark={ctx.isDark}
          onSelectRecording={rec.setSelectedBasicRecordingId}
          onTogglePlay={ctx.toggleRecordedPlay}
          onSeek={ctx.seekRecorded}
          onStartRecording={rec.handleStartBasicRecording}
          onStopRecording={rec.handleStopBasicRecording}
          onCancelCountdown={() => {
            ctx.cancelCountdown();
            rec.setIsBasicRecording(false);
          }}
          onDeleteRecording={rec.deleteBasicRecording}
          onTrimRecording={rec.setTrimmingRecording}
          onCountdownDurationChange={ctx.handleCountdownDurationChange}
          getEffectiveDuration={ctx.getEffectiveDuration}
        />
      )}

      {/* FAB Record Button */}
      {!ctx.isRecording && !ctx.isCountingDown && (
        <button
          onClick={() => {
            if (!rec.basicRecordingIsLongPressRef.current && !rec.basicRecordingLongPressRef.current) {
              rec.handleStartBasicRecording(ctx.countdownDuration);
            }
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            rec.basicRecordingIsLongPressRef.current = false;
            rec.basicRecordingLongPressRef.current = setTimeout(() => {
              rec.basicRecordingIsLongPressRef.current = true;
              rec.setShowBasicRecordingDial(true);
            }, 500);
          }}
          onMouseUp={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (rec.basicRecordingLongPressRef.current) {
              clearTimeout(rec.basicRecordingLongPressRef.current);
              rec.basicRecordingLongPressRef.current = null;
            }
            if (!rec.basicRecordingIsLongPressRef.current) {
              rec.handleStartBasicRecording(ctx.countdownDuration);
            }
          }}
          onMouseLeave={() => {
            if (rec.basicRecordingLongPressRef.current) {
              clearTimeout(rec.basicRecordingLongPressRef.current);
              rec.basicRecordingLongPressRef.current = null;
            }
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            rec.basicRecordingIsLongPressRef.current = false;
            rec.basicRecordingLongPressRef.current = setTimeout(() => {
              rec.basicRecordingIsLongPressRef.current = true;
              rec.setShowBasicRecordingDial(true);
            }, 500);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (rec.basicRecordingLongPressRef.current) {
              clearTimeout(rec.basicRecordingLongPressRef.current);
              rec.basicRecordingLongPressRef.current = null;
            }
            if (!rec.basicRecordingIsLongPressRef.current) {
              rec.handleStartBasicRecording(ctx.countdownDuration);
            }
          }}
          style={{ touchAction: 'manipulation', bottom: 'calc(6rem + var(--sab, 0px))' }}
          className="fixed right-4 w-14 h-14 bg-red-500 active:bg-red-600 rounded-full shadow-lg flex items-center justify-center z-40"
        >
          <Mic className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Recording Indicator FAB */}
      {(ctx.isRecording || ctx.isCountingDown) && (
        <button
          onClick={() => {
            if (ctx.isCountingDown) {
              ctx.cancelCountdown();
              if (rec.isBasicRecording) rec.setIsBasicRecording(false);
            } else if (rec.isBasicRecording) {
              rec.handleStopBasicRecording();
            }
          }}
          className="fixed right-4 w-14 h-14 bg-red-500 rounded-full shadow-lg flex items-center justify-center z-40 animate-pulse"
          style={{ bottom: 'calc(6rem + var(--sab, 0px))' }}
        >
          {ctx.isCountingDown ? (
            <span className="text-white text-xl font-bold">{ctx.countdown}</span>
          ) : (
            <Square className="w-6 h-6 text-white" />
          )}
        </button>
      )}

      {/* Countdown Dial */}
      {rec.showBasicRecordingDial && (
        <CountdownDial
          value={ctx.countdownDuration}
          onChange={(value) => {
            ctx.handleCountdownDurationChange(value);
          }}
          onClose={() => rec.setShowBasicRecordingDial(false)}
        />
      )}

      {/* Recording Trim Modal */}
      {rec.trimmingRecording && (
        <RecordingTrimModal
          show={!!rec.trimmingRecording}
          onClose={() => rec.setTrimmingRecording(null)}
          recording={rec.trimmingRecording}
          audioBuffer={ctx.recordedAudioBuffer[rec.trimmingRecording.id] || null}
          audioContext={ctx.audioContext}
          onSave={rec.handleSaveBasicRecordingTrim}
        />
      )}
    </>
  );
});

export default RecordingControls;
