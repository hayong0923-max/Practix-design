'use client';

import { useState, useEffect, useCallback } from 'react';
import { TrashedRecording, isTrashItemExpired, Recording } from '@/types';
import { deleteRecordingFromDevice } from '@/lib/mobileStorage';

const TRASH_STORAGE_KEY = 'practix_trash';

export function useTrash(_isCapacitor: boolean = false) {
  const [trashedRecordings, setTrashedRecordings] = useState<TrashedRecording[]>([]);

  // Load trash from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(TRASH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as TrashedRecording[];
        // Filter out expired items and delete their files from IndexedDB
        const validItems: TrashedRecording[] = [];
        parsed.forEach(async (item) => {
          if (isTrashItemExpired(item.deletedAt)) {
            await deleteRecordingFromDevice(item.recording.id);
          } else {
            validItems.push(item);
          }
        });
        setTrashedRecordings(validItems);
        localStorage.setItem(TRASH_STORAGE_KEY, JSON.stringify(validItems));
      }
    } catch (err) {
      console.error('Failed to load trash:', err);
    }
  }, []);

  // Save to localStorage whenever trash changes
  useEffect(() => {
    localStorage.setItem(TRASH_STORAGE_KEY, JSON.stringify(trashedRecordings));
  }, [trashedRecordings]);

  const moveToTrash = useCallback((
    recording: Recording,
    songId: number,
    sessionId: number,
    sectionId: number | null,
    sectionIndex: number
  ) => {
    const trashedItem: TrashedRecording = {
      recording,
      deletedAt: new Date().toISOString(),
      originalLocation: { songId, sessionId, sectionId, sectionIndex },
    };
    setTrashedRecordings(prev => [trashedItem, ...prev]);
  }, []);

  const restoreFromTrash = useCallback((recordingId: number): TrashedRecording | null => {
    const item = trashedRecordings.find(t => t.recording.id === recordingId);
    if (item) {
      setTrashedRecordings(prev => prev.filter(t => t.recording.id !== recordingId));
      return item;
    }
    return null;
  }, [trashedRecordings]);

  const permanentlyDelete = useCallback(async (recordingId: number) => {
    const item = trashedRecordings.find(t => t.recording.id === recordingId);
    if (item) {
      await deleteRecordingFromDevice(recordingId);
      setTrashedRecordings(prev => prev.filter(t => t.recording.id !== recordingId));
    }
  }, [trashedRecordings]);

  const emptyTrash = useCallback(async () => {
    for (const item of trashedRecordings) {
      await deleteRecordingFromDevice(item.recording.id);
    }
    setTrashedRecordings([]);
  }, [trashedRecordings]);

  const getTrashForSession = useCallback((sessionId: number) => {
    return trashedRecordings.filter(t => t.originalLocation.sessionId === sessionId);
  }, [trashedRecordings]);

  return {
    trashedRecordings,
    moveToTrash,
    restoreFromTrash,
    permanentlyDelete,
    emptyTrash,
    getTrashForSession,
    trashCount: trashedRecordings.length,
  };
}
