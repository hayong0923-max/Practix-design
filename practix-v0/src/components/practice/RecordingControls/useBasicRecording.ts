'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Recording } from '@/types';
import { usePracticeContext } from '@/contexts/PracticeContext';
import {
  saveRecordingToDevice,
  loadRecordingFromDevice,
} from '@/lib/mobileStorage';

export function useBasicRecording() {
  const ctx = usePracticeContext();

  const [isBasicRecording, setIsBasicRecording] = useState(false);
  const [selectedBasicRecordingId, setSelectedBasicRecordingId] = useState<number | null>(null);
  const [showBasicRecordingDial, setShowBasicRecordingDial] = useState(false);
  const [trimmingRecording, setTrimmingRecording] = useState<Recording | null>(null);

  const basicRecordingLongPressRef = useRef<NodeJS.Timeout | null>(null);
  const basicRecordingIsLongPressRef = useRef(false);

  const handleStartBasicRecording = useCallback(async (countdownSeconds: number = 3) => {
    try {
      setIsBasicRecording(true);
      ctx.haptics.recordingStart();
      const success = await ctx.startRecording(countdownSeconds);
      if (!success) setIsBasicRecording(false);
    } catch (err) {
      console.error('[BasicRecording] Error starting recording:', err);
      setIsBasicRecording(false);
    }
  }, [ctx.haptics, ctx.startRecording]);

  const handleStopBasicRecording = useCallback(async () => {
    const result = await ctx.stopRecording();
    if (!result) {
      setIsBasicRecording(false);
      return;
    }

    const { base64: base64Data, blob } = result;
    const recordingId = Date.now();
    const basicRecordings = ctx.currentSession.basicRecordings || [];
    const recordingName = `녹음 ${basicRecordings.length + 1}`;

    // Save to IndexedDB
    try {
      await saveRecordingToDevice(
        recordingId,
        base64Data,
        ctx.currentSong.name,
        ctx.currentSession.name,
        -1,
        recordingName
      );
    } catch (saveErr) {
      console.error('[BasicRecording] Failed to save recording:', saveErr);
      setIsBasicRecording(false);
      return;
    }

    const newRecording: Recording = {
      id: recordingId,
      name: recordingName,
      uploadDate: new Date().toISOString(),
      data: base64Data,
      tags: [],
      memo: '',
    };

    ctx.onBasicRecordingsChange([newRecording, ...basicRecordings]);
    setSelectedBasicRecordingId(recordingId);
    ctx.haptics.recordingStop();
    ctx.toastRecording('녹음 완료', ctx.recordingTime);

    ctx.onRecordingComplete(
      ctx.currentSong.id,
      ctx.currentSong.name,
      ctx.currentSession.id,
      ctx.currentSession.name,
      undefined,
      ctx.recordingTime
    );

    if (ctx.audioContext) {
      try {
        const arrayBuffer = await blob.arrayBuffer();
        const decoded = await ctx.audioContext.decodeAudioData(arrayBuffer);
        ctx.addRecordedBuffer(recordingId, decoded);
      } catch (err) {
        console.error('[BasicRecording] Failed to decode audio:', err);
      }
    }

    setIsBasicRecording(false);
  }, [ctx]);

  const deleteBasicRecording = useCallback(async (recordingId: number) => {
    const basicRecordings = ctx.currentSession.basicRecordings || [];
    const recording = basicRecordings.find(r => r.id === recordingId);
    if (recording) {
      ctx.trashFunctions.moveToTrash(recording, null, -1);
      ctx.toastTrash('휴지통으로 이동했습니다');
      ctx.haptics.warning();
    }
    ctx.onBasicRecordingsChange(basicRecordings.filter(r => r.id !== recordingId));
    ctx.removeRecordedBuffer(recordingId);
    if (selectedBasicRecordingId === recordingId) {
      const remaining = basicRecordings.filter(r => r.id !== recordingId);
      setSelectedBasicRecordingId(remaining[0]?.id || null);
    }
  }, [ctx, selectedBasicRecordingId]);

  const renameBasicRecording = useCallback((recordingId: number, newName: string) => {
    const basicRecordings = ctx.currentSession.basicRecordings || [];
    ctx.onBasicRecordingsChange(
      basicRecordings.map(r => r.id === recordingId ? { ...r, name: newName } : r)
    );
  }, [ctx.currentSession.basicRecordings, ctx.onBasicRecordingsChange]);

  const updateBasicRecordingTags = useCallback((recordingId: number, tags: string[]) => {
    const basicRecordings = ctx.currentSession.basicRecordings || [];
    ctx.onBasicRecordingsChange(
      basicRecordings.map(r => r.id === recordingId ? { ...r, tags } : r)
    );
  }, [ctx.currentSession.basicRecordings, ctx.onBasicRecordingsChange]);

  const handleSaveBasicRecordingTrim = useCallback((trimStart: number, trimEnd: number) => {
    if (!trimmingRecording) return;
    ctx.updateTrimBounds(trimmingRecording.id, trimStart, trimEnd);
    const basicRecordings = ctx.currentSession.basicRecordings || [];
    ctx.onBasicRecordingsChange(
      basicRecordings.map(r =>
        r.id === trimmingRecording.id ? { ...r, trimStart, trimEnd } : r
      )
    );
    ctx.toastSuccess('트림 저장됨');
  }, [trimmingRecording, ctx]);

  // Decode basic recordings on mount
  useEffect(() => {
    const basicRecordings = ctx.currentSession.basicRecordings || [];
    if (ctx.audioContext && basicRecordings.length > 0) {
      basicRecordings.forEach(async (recording) => {
        if (!ctx.recordedAudioBuffer[recording.id]) {
          try {
            // Support both inline data64 and 'idb'/'file' markers
            let audioData = recording.data;
            if (audioData === 'idb' || audioData === 'file') {
              const loaded = await loadRecordingFromDevice(recording.id);
              if (!loaded) return;
              audioData = loaded;
            }
            const response = await fetch(audioData);
            const arrayBuffer = await response.arrayBuffer();
            const decoded = await ctx.audioContext!.decodeAudioData(arrayBuffer);
            ctx.addRecordedBuffer(recording.id, decoded, recording.trimStart, recording.trimEnd);
            if (!selectedBasicRecordingId) {
              setSelectedBasicRecordingId(recording.id);
            }
          } catch (err) {
            console.error('Failed to decode basic recording:', err);
          }
        }
      });
    }
  }, [ctx.audioContext, ctx.currentSession.basicRecordings]);

  return {
    isBasicRecording, setIsBasicRecording,
    selectedBasicRecordingId, setSelectedBasicRecordingId,
    showBasicRecordingDial, setShowBasicRecordingDial,
    trimmingRecording, setTrimmingRecording,
    basicRecordingLongPressRef, basicRecordingIsLongPressRef,
    handleStartBasicRecording, handleStopBasicRecording,
    deleteBasicRecording, renameBasicRecording, updateBasicRecordingTags,
    handleSaveBasicRecordingTrim,
  };
}
