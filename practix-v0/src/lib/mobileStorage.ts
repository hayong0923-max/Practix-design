'use client';

/**
 * Web storage utility — replaces Capacitor Filesystem with IndexedDB + localStorage.
 * API surface is identical to the original mobileStorage.ts so no other files need changes.
 */

import { Song } from '@/types';

const DB_NAME = 'practix-db';
const DB_VERSION = 1;
const SONGS_KEY = 'practix_songs';

// ─── IndexedDB helpers ──────────────────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key: string, value: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite');
    tx.objectStore('files').put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbGet(key: string): Promise<string | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readonly');
    const req = tx.objectStore('files').get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function idbDelete(key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite');
    tx.objectStore('files').delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ─── Permissions (no-op on web) ─────────────────────────────────────────────

export async function requestStoragePermissions(): Promise<boolean> {
  return true;
}

export async function checkStoragePermissions(): Promise<boolean> {
  return true;
}

// ─── Songs ──────────────────────────────────────────────────────────────────

export async function saveSongsToDevice(songs: Song[]): Promise<void> {
  const songsWithoutLargeData = songs.map(song => ({
    ...song,
    sessions: song.sessions.map(session => ({
      ...session,
      audioData: session.audioData ? 'idb' : null,
      sheetMusic: session.sheetMusic
        ? { ...session.sheetMusic, imageData: 'idb' }
        : undefined,
      sections: session.sections.map(section => ({
        ...section,
        recordedFiles: section.recordedFiles?.map(recording => ({
          ...recording,
          data: recording.data ? 'idb' : '',
        })) || [],
      })),
    })),
  }));

  localStorage.setItem(SONGS_KEY, JSON.stringify(songsWithoutLargeData));
}

export async function loadSongsFromDevice(): Promise<Song[] | null> {
  try {
    const raw = localStorage.getItem(SONGS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Song[];
  } catch {
    return null;
  }
}

// ─── Audio ──────────────────────────────────────────────────────────────────

export async function saveAudioToDevice(sessionId: number | string, audioData: string): Promise<void> {
  await idbSet(`audio_${sessionId}`, audioData);
}

export async function loadAudioFromDevice(sessionId: number | string): Promise<string | null> {
  return idbGet(`audio_${sessionId}`);
}

export async function deleteAudioFromDevice(sessionId: number | string): Promise<void> {
  await idbDelete(`audio_${sessionId}`);
}

// ─── Sheet Music ─────────────────────────────────────────────────────────────

export async function saveSheetMusicToDevice(sessionId: number | string, imageData: string): Promise<string> {
  const key = `sheetmusic_${sessionId}`;
  await idbSet(key, imageData);
  return key;
}

export async function loadSheetMusicFromDevice(sessionId: number | string): Promise<string | null> {
  return idbGet(`sheetmusic_${sessionId}`);
}

export async function deleteSheetMusicFromDevice(sessionId: number | string): Promise<void> {
  await idbDelete(`sheetmusic_${sessionId}`);
}

export async function getSheetMusicUri(_sessionId: number | string): Promise<string | null> {
  return null; // Not applicable on web
}

// ─── Recordings ──────────────────────────────────────────────────────────────

function sanitizeFileName(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50);
}

function getTimestamp(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  return `${y}${m}${d}_${h}${min}${s}`;
}

export function generateRecordingFileName(
  songName: string,
  sessionName: string,
  sectionIndex: number,
  recordingName: string,
  extension: string = 'webm'
): string {
  const safeSong = sanitizeFileName(songName);
  const safeSession = sanitizeFileName(sessionName);
  const safeRecording = sanitizeFileName(recordingName);
  const timestamp = getTimestamp();
  return `PRACTIX ${safeSong}_${safeSession}_구간${sectionIndex + 1}_${safeRecording}_${timestamp}.${extension}`;
}

export async function saveRecordingToDevice(
  recordingId: number | string,
  audioData: string,
  songName: string,
  sessionName: string,
  sectionIndex: number,
  recordingName: string
): Promise<string> {
  const match = audioData.match(/^data:audio\/([^;]+)/);
  const ext = match ? match[1].replace('x-m4a', 'm4a') : 'webm';
  const fileName = generateRecordingFileName(songName, sessionName, sectionIndex, recordingName, ext);

  await idbSet(`recording_${recordingId}`, audioData);
  await idbSet(`recording_name_${recordingId}`, fileName);

  return fileName;
}

export async function loadRecordingFromDevice(recordingId: number | string): Promise<string | null> {
  return idbGet(`recording_${recordingId}`);
}

export async function deleteRecordingFromDevice(recordingId: number | string): Promise<void> {
  await idbDelete(`recording_${recordingId}`);
  await idbDelete(`recording_name_${recordingId}`);
}

export async function getRecordingUri(_recordingId: number | string): Promise<string | null> {
  return null; // Not applicable on web
}

export async function getRecordingFileName(recordingId: number | string): Promise<string | null> {
  return idbGet(`recording_name_${recordingId}`);
}

// ─── Environment check ────────────────────────────────────────────────────────

export function isCapacitorEnvironment(): boolean {
  return false;
}
