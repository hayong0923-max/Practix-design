'use client';

import { useState, useCallback, useEffect } from 'react';
import { Section, Recording } from '@/types';
import { usePracticeContext } from '@/contexts/PracticeContext';
import {
  saveRecordingToDevice,
  loadRecordingFromDevice,
} from '@/lib/mobileStorage';

export function useSections() {
  const ctx = usePracticeContext();

  const [selectedRecordings, setSelectedRecordings] = useState<Record<number, number>>({});
  const [uploadingSectionId, setUploadingSectionId] = useState<number | null>(null);
  const [editingMemo, setEditingMemo] = useState<number | null>(null);
  const [recordingSectionId, setRecordingSectionId] = useState<number | null>(null);
  const [draggedSectionIndex, setDraggedSectionIndex] = useState<number | null>(null);
  const [dragOverSectionIndex, setDragOverSectionIndex] = useState<number | null>(null);
  const [practicingSection, setPracticingSection] = useState<Section | null>(null);
  const [practicingSectionIndex, setPracticingSectionIndex] = useState<number>(0);
  const [showSyncEdit, setShowSyncEdit] = useState(false);
  const [syncEditSection, setSyncEditSection] = useState<Section | null>(null);
  const [syncEditRecording, setSyncEditRecording] = useState<Recording | null>(null);

  const handleOpenSyncEdit = useCallback((section: Section, recording: Recording) => {
    setSyncEditSection(section);
    setSyncEditRecording(recording);
    setShowSyncEdit(true);
  }, []);

  const handleSyncOffsetApply = useCallback((offset: number) => {
    if (!syncEditSection || !syncEditRecording) return;
    const updatedSections = ctx.sections.map((s) => {
      if (s.id !== syncEditSection.id) return s;
      return {
        ...s,
        recordedFiles: s.recordedFiles?.map((r) =>
          r.id === syncEditRecording.id ? { ...r, syncOffset: offset } : r
        ),
      };
    });
    ctx.onSectionsChange(updatedSections);
    ctx.toastSuccess('싱크 오프셋이 적용되었습니다');
  }, [syncEditSection, syncEditRecording, ctx.sections, ctx.onSectionsChange, ctx.toastSuccess]);

  const handleAutoSyncApply = useCallback((sectionId: number, recordingId: number, offset: number) => {
    const updatedSections = ctx.sections.map((s) => {
      if (s.id !== sectionId) return s;
      return {
        ...s,
        recordedFiles: s.recordedFiles?.map((r) =>
          r.id === recordingId ? { ...r, syncOffset: offset } : r
        ),
      };
    });
    ctx.onSectionsChange(updatedSections);
    const ms = Math.round(offset * 1000);
    ctx.toastSuccess(`자동 싱크 완료: ${ms >= 0 ? '+' : ''}${ms}ms`);
  }, [ctx.sections, ctx.onSectionsChange, ctx.toastSuccess]);

  const deleteSection = useCallback((sectionId: number) => {
    if (ctx.selectedSection?.id === sectionId) ctx.stopPlayback();
    const section = ctx.sections.find((s) => s.id === sectionId);
    if (section?.recordedFiles?.length) {
      const sectionIndex = ctx.sections.findIndex((s) => s.id === sectionId);
      section.recordedFiles.forEach((recording) => {
        ctx.trashFunctions.moveToTrash(recording, sectionId, sectionIndex);
        ctx.removeRecordedBuffer(recording.id);
      });
      ctx.toastTrash(`${section.recordedFiles.length}개 녹음이 휴지통으로 이동했습니다`);
    }
    ctx.onSectionsChange(ctx.sections.filter((s) => s.id !== sectionId));
  }, [ctx.selectedSection, ctx.sections, ctx.onSectionsChange, ctx.stopPlayback, ctx.trashFunctions, ctx.removeRecordedBuffer, ctx.toastTrash]);

  const handleSectionBoundaryChange = useCallback((sectionId: number, newStart: number, newEnd: number) => {
    ctx.onSectionsChange(ctx.sections.map((s) =>
      s.id === sectionId ? { ...s, start: newStart, end: newEnd } : s
    ));
    if (practicingSection?.id === sectionId) {
      setPracticingSection({ ...practicingSection, start: newStart, end: newEnd });
    }
  }, [ctx.sections, ctx.onSectionsChange, practicingSection]);

  const playSection = useCallback((section: Section) => {
    ctx.setSelectedSection(section);
    ctx.setCurrentTime(section.start);
    ctx.playAudio(section.start);
  }, [ctx.setSelectedSection, ctx.setCurrentTime, ctx.playAudio]);

  const saveMemo = useCallback((section: Section, memo: string) => {
    ctx.onSectionsChange(ctx.sections.map((s) => (s.id === section.id ? { ...s, memo } : s)));
    setEditingMemo(null);
  }, [ctx.sections, ctx.onSectionsChange]);

  const renameSection = useCallback((section: Section, newName: string) => {
    ctx.onSectionsChange(ctx.sections.map((s) => (s.id === section.id ? { ...s, name: newName } : s)));
  }, [ctx.sections, ctx.onSectionsChange]);

  const handleDragStart = useCallback((index: number) => setDraggedSectionIndex(index), []);
  const handleDragOver = useCallback((index: number) => {
    if (draggedSectionIndex !== null && draggedSectionIndex !== index) setDragOverSectionIndex(index);
  }, [draggedSectionIndex]);
  const handleDragEnd = useCallback(() => {
    if (draggedSectionIndex !== null && dragOverSectionIndex !== null && draggedSectionIndex !== dragOverSectionIndex) {
      const newSections = [...ctx.sections];
      const [moved] = newSections.splice(draggedSectionIndex, 1);
      newSections.splice(dragOverSectionIndex, 0, moved);
      ctx.onSectionsChange(newSections);
    }
    setDraggedSectionIndex(null);
    setDragOverSectionIndex(null);
  }, [draggedSectionIndex, dragOverSectionIndex, ctx.sections, ctx.onSectionsChange]);

  const handleRecordedFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, section: Section) => {
    const file = e.target.files?.[0];
    if (!file || !ctx.audioContext) return;
    try {
      setUploadingSectionId(section.id);
      const arrayBuffer = await file.arrayBuffer();
      const decoded = await ctx.audioContext.decodeAudioData(arrayBuffer);
      const recordingId = Date.now();
      const recordingName = `녹음 ${(section.recordedFiles?.length || 0) + 1}`;
      const sectionIndex = ctx.sections.findIndex(s => s.id === section.id);
      ctx.addRecordedBuffer(recordingId, decoded);

      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target?.result as string;
        const newRecording = {
          id: recordingId,
          name: recordingName,
          uploadDate: new Date().toISOString(),
          data: base64Data,
          tags: [] as string[],
          memo: '',
        };
        ctx.onSectionsChange(ctx.sections.map((s) =>
          s.id === section.id ? { ...s, recordedFiles: [newRecording, ...(s.recordedFiles || [])] } : s
        ));
        setSelectedRecordings((prev) => ({ ...prev, [section.id]: recordingId }));
        setUploadingSectionId(null);
        // Also persist in IndexedDB
        try {
          await saveRecordingToDevice(recordingId, base64Data, ctx.currentSong.name, ctx.currentSession.name, sectionIndex, recordingName);
        } catch (err) {
          console.error('Failed to save recording:', err);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Upload error:', err);
      setUploadingSectionId(null);
    }
  }, [ctx.audioContext, ctx.sections, ctx.onSectionsChange, ctx.addRecordedBuffer, ctx.currentSong, ctx.currentSession]);

  const deleteRecording = useCallback(async (section: Section, recordingId: number) => {
    const recording = section.recordedFiles?.find(r => r.id === recordingId);
    if (recording) {
      const sectionIndex = ctx.sections.findIndex(s => s.id === section.id);
      ctx.trashFunctions.moveToTrash(recording, section.id, sectionIndex);
      ctx.toastTrash('휴지통으로 이동했습니다');
      ctx.haptics.warning();
    }
    const updatedSections = ctx.sections.map((s) =>
      s.id === section.id ? { ...s, recordedFiles: s.recordedFiles.filter((r) => r.id !== recordingId) } : s
    );
    ctx.onSectionsChange(updatedSections);
    if (selectedRecordings[section.id] === recordingId) {
      const remaining = updatedSections.find((s) => s.id === section.id)?.recordedFiles;
      setSelectedRecordings((prev) => ({ ...prev, [section.id]: remaining?.[0]?.id || 0 }));
    }
    ctx.removeRecordedBuffer(recordingId);
  }, [ctx.sections, ctx.onSectionsChange, ctx.trashFunctions, ctx.toastTrash, ctx.haptics, ctx.removeRecordedBuffer, selectedRecordings]);

  const renameRecording = useCallback((section: Section, recordingId: number, newName: string) => {
    ctx.onSectionsChange(ctx.sections.map((s) =>
      s.id === section.id
        ? { ...s, recordedFiles: s.recordedFiles.map((r) => (r.id === recordingId ? { ...r, name: newName } : r)) }
        : s
    ));
  }, [ctx.sections, ctx.onSectionsChange]);

  const updateRecordingTags = useCallback((section: Section, recordingId: number, tags: string[]) => {
    ctx.onSectionsChange(ctx.sections.map((s) =>
      s.id === section.id
        ? { ...s, recordedFiles: s.recordedFiles.map((r) => (r.id === recordingId ? { ...r, tags } : r)) }
        : s
    ));
  }, [ctx.sections, ctx.onSectionsChange]);

  const handleStartRecording = useCallback(async (section: Section, countdownSeconds: number = 0, withBackingTrack: boolean = false) => {
    setRecordingSectionId(section.id);
    ctx.haptics.recordingStart();
    try {
      if (withBackingTrack && section.backingTrack) {
        const recordingStarted = ctx.startRecording(countdownSeconds);
        if (countdownSeconds > 0) {
          setTimeout(() => ctx.playBackingTrack(section.id, 0), countdownSeconds * 1000);
        } else {
          ctx.playBackingTrack(section.id, 0);
        }
        const success = await recordingStarted;
        if (!success) setRecordingSectionId(null);
      } else {
        const success = await ctx.startRecording(countdownSeconds);
        if (!success) setRecordingSectionId(null);
      }
    } catch (err) {
      console.error('[SectionRecording] Error starting recording:', err);
      setRecordingSectionId(null);
    }
  }, [ctx.haptics, ctx.startRecording, ctx.playBackingTrack]);

  const handleStopRecording = useCallback(async (section: Section) => {
    if (ctx.backingTrackIsPlaying[section.id]) ctx.stopBackingTrack(section.id);
    const result = await ctx.stopRecording();
    if (!result) {
      setRecordingSectionId(null);
      return;
    }
    const { base64: base64Data, blob } = result;
    const recordingId = Date.now();
    const recordingName = `녹음 ${(section.recordedFiles?.length || 0) + 1}`;
    const sectionIndex = ctx.sections.findIndex(s => s.id === section.id);

    // Save to IndexedDB
    try {
      await saveRecordingToDevice(recordingId, base64Data, ctx.currentSong.name, ctx.currentSession.name, sectionIndex, recordingName);
    } catch (saveErr) {
      console.error('[Recording] Failed to save recording:', saveErr);
      setRecordingSectionId(null);
      return;
    }

    const newRecording = {
      id: recordingId,
      name: recordingName,
      uploadDate: new Date().toISOString(),
      data: base64Data,
      tags: [] as string[],
      memo: '',
    };

    const updatedSections = ctx.sections.map((s) =>
      s.id === section.id ? { ...s, recordedFiles: [newRecording, ...(s.recordedFiles || [])] } : s
    );
    ctx.onSectionsChange(updatedSections);
    setSelectedRecordings((prev) => ({ ...prev, [section.id]: recordingId }));
    ctx.haptics.recordingStop();
    ctx.toastSuccess('녹음이 저장되었습니다');

    ctx.onRecordingComplete(
      ctx.currentSong.id, ctx.currentSong.name,
      ctx.currentSession.id, ctx.currentSession.name,
      section.id, section.end - section.start
    );

    if (ctx.audioContext) {
      try {
        const arrayBuffer = await blob.arrayBuffer();
        const decoded = await ctx.audioContext.decodeAudioData(arrayBuffer);
        ctx.addRecordedBuffer(recordingId, decoded);
      } catch (err) {
        console.error('[Recording] Failed to decode audio:', err);
      }
    }
    setRecordingSectionId(null);
  }, [ctx]);

  // Sync practicingSection with sections array
  useEffect(() => {
    if (practicingSection) {
      const updated = ctx.sections.find(s => s.id === practicingSection.id);
      if (updated && JSON.stringify(updated.recordedFiles) !== JSON.stringify(practicingSection.recordedFiles)) {
        setPracticingSection(updated);
      }
    }
  }, [ctx.sections, practicingSection]);

  // Decode recorded files on mount — web: support 'idb'/'file' markers
  useEffect(() => {
    if (!ctx.audioContext || !ctx.sections.length) return;
    ctx.sections.forEach((section) => {
      section.recordedFiles?.forEach(async (recording) => {
        if (ctx.recordedAudioBuffer[recording.id]) return;
        try {
          let audioData = recording.data;
          if (audioData === 'idb' || audioData === 'file') {
            const loaded = await loadRecordingFromDevice(recording.id);
            if (!loaded) return;
            audioData = loaded;
          }
          const response = await fetch(audioData);
          const arrayBuffer = await response.arrayBuffer();
          const decoded = await ctx.audioContext!.decodeAudioData(arrayBuffer);
          ctx.addRecordedBuffer(recording.id, decoded);
          if (!selectedRecordings[section.id]) {
            setSelectedRecordings((prev) => ({ ...prev, [section.id]: recording.id }));
          }
        } catch (err) {
          console.error('Failed to decode recorded file:', err);
        }
      });
    });
  }, [ctx.audioContext, ctx.sections]);

  return {
    selectedRecordings, setSelectedRecordings,
    uploadingSectionId,
    editingMemo, setEditingMemo,
    recordingSectionId,
    draggedSectionIndex, dragOverSectionIndex,
    practicingSection, setPracticingSection,
    practicingSectionIndex, setPracticingSectionIndex,
    showSyncEdit, setShowSyncEdit,
    syncEditSection, setSyncEditSection,
    syncEditRecording, setSyncEditRecording,
    handleOpenSyncEdit, handleSyncOffsetApply, handleAutoSyncApply,
    deleteSection, handleSectionBoundaryChange,
    playSection, saveMemo, renameSection,
    handleRecordedFileUpload, deleteRecording, renameRecording, updateRecordingTags,
    handleStartRecording, handleStopRecording,
    handleDragStart, handleDragOver, handleDragEnd,
  };
}
