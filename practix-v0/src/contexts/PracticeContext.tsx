'use client';

import { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode, Dispatch, SetStateAction } from 'react';
import { Song, Session, Section, SheetMusic, Recording, TrashedRecording, TimeSignature, CustomTag, BackingTrack, MetronomeSettings } from '@/types';
import { ToastMessage } from '@/components/ui/Toast';
import { useTheme } from '@/hooks/useTheme';
import { useCustomTags } from '@/hooks/useCustomTags';
import { useToast } from '@/hooks/useToast';
import { useHaptics } from '@/hooks/useHaptics';
import { usePracticeStatsContext } from '@/contexts/PracticeStatsContext';
import { useAudioManagement } from '@/hooks/practice/useAudioManagement';
import { useAudioPlayback } from '@/hooks/useAudioPlayback';
import { useRecordedPlayback } from '@/hooks/useRecordedPlayback';
import { useRecording, RecordingResult } from '@/hooks/useRecording';
import { useMetronome } from '@/hooks/useMetronome';
import { useBackingTrackHandlers } from '@/hooks/practice/useBackingTrackHandlers';
import { useAudioDevices } from '@/hooks/useAudioDevices';
import { usePitchAnalysis } from '@/hooks/usePitchAnalysis';
import { PitchAnalysisResult } from '@/utils/pitchDetection';

// --- TrashFunctions interface (moved from PracticePage) ---
export interface TrashFunctions {
  trashedRecordings: TrashedRecording[];
  moveToTrash: (recording: Recording, sectionId: number | null, sectionIndex: number) => void;
  restoreFromTrash: (recordingId: number) => TrashedRecording | null;
  permanentlyDelete: (recordingId: number) => Promise<void>;
  emptyTrash: () => Promise<void>;
}

// --- Props ---
export interface PracticePageProps {
  audioContext: AudioContext | null;
  currentSong: Song;
  currentSession: Session;
  sections: Section[];
  onSectionsChange: (sections: Section[]) => void;
  onAudioDataChange: (audioData: string | null) => void;
  onSheetMusicChange: (sheetMusic: SheetMusic | null) => void;
  onBasicRecordingsChange: (recordings: Recording[]) => void;
  onMetronomeSettingsChange: (settings: MetronomeSettings | undefined) => void;
  onBack: () => void;
  trashFunctions: TrashFunctions;
}

// --- Context Type ---
export interface PracticeContextType {
  // Props passthrough
  audioContext: AudioContext | null;
  currentSong: Song;
  currentSession: Session;
  sections: Section[];
  onSectionsChange: (sections: Section[]) => void;
  onAudioDataChange: (audioData: string | null) => void;
  onSheetMusicChange: (sheetMusic: SheetMusic | null) => void;
  onBasicRecordingsChange: (recordings: Recording[]) => void;
  onMetronomeSettingsChange: (settings: MetronomeSettings | undefined) => void;
  onBack: () => void;
  trashFunctions: TrashFunctions;

  // Platform & theme
  isCapacitor: boolean;
  isDark: boolean;

  // Audio management
  audioBuffer: AudioBuffer | null;
  isLoadingAudio: boolean;
  waveformData: number[] | null;
  duration: number;
  resolvedSheetMusic: SheetMusic | null;
  handleAudioUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;

  // Playback
  isPlaying: boolean;
  currentTime: number;
  playbackRate: number;
  volume: number;
  setVolume: (volume: number) => void;
  playAudio: (startPos?: number) => void;
  stopPlayback: () => void;
  togglePlay: () => void;
  setCurrentTime: (time: number) => void;
  setPlaybackRate: (rate: number) => void;

  // Shared state
  selectedSection: Section | null;
  setSelectedSection: (section: Section | null) => void;
  isLooping: boolean;
  setIsLooping: Dispatch<SetStateAction<boolean>>;
  countdownDuration: number;
  handleCountdownDurationChange: (duration: number) => void;

  // Recorded playback
  recordedAudioBuffer: Record<number, AudioBuffer>;
  recordedCurrentTime: Record<number, number>;
  recordedIsPlaying: Record<number, boolean>;
  toggleRecordedPlay: (recordingId: number) => void;
  addRecordedBuffer: (recordingId: number, buffer: AudioBuffer, trimStart?: number, trimEnd?: number) => void;
  removeRecordedBuffer: (recordingId: number) => void;
  seekRecorded: (recordingId: number, time: number) => void;
  updateTrimBounds: (recordingId: number, trimStart: number, trimEnd: number) => void;
  getEffectiveDuration: (recordingId: number) => number;

  // Recording
  isRecording: boolean;
  isCountingDown: boolean;
  countdown: number;
  recordingTime: number;
  audioLevel: number;
  startRecording: (countdownSeconds?: number) => Promise<boolean>;
  stopRecording: () => Promise<RecordingResult | null>;
  cancelCountdown: () => void;
  recordingError: string | null;

  // Metronome
  metronomeIsPlaying: boolean;
  metronomeBeat: number;
  metronomeBpm: number;
  metronomeBeatsPerMeasure: number;
  metronomeTimeSignature: TimeSignature;
  startMetronome: (bpm: number, duration?: number, timeSignature?: TimeSignature, startDelay?: number, accentBeat?: number) => void;
  stopMetronome: () => void;
  setMetronomeAccentBeat: (beat: number) => void;
  metronomeVolume: number;
  setMetronomeVolume: (volume: number) => void;

  // Backing track
  backingTrackBuffers: Record<number, AudioBuffer>;
  backingTrackCurrentTime: Record<number, number>;
  backingTrackIsPlaying: Record<number, boolean>;
  backingTrackVolumes: Record<number, number>;
  uploadingBackingTrackId: number | null;
  handleBackingTrackUpload: (e: React.ChangeEvent<HTMLInputElement>, section: Section, type: BackingTrack['type']) => void;
  handleRemoveBackingTrack: (section: Section) => void;
  handleSetMetronome: (section: Section, bpm: number, timeSignature: TimeSignature) => void;
  handleSetMrMetronomeSync: (section: Section, bpm: number, timeSignature: TimeSignature, startBeat: number) => void;
  handleRemoveMrMetronomeSync: (section: Section) => void;
  playBackingTrack: (sectionId: number, startTime?: number) => void;
  stopBackingTrack: (sectionId: number) => void;
  toggleBackingTrack: (sectionId: number) => void;
  seekBackingTrack: (sectionId: number, time: number) => void;
  updateBackingTrackVolume: (sectionId: number, volume: number) => void;

  // Custom tags
  customTags: CustomTag[];
  addTag: (label: string, colorPresetId: string) => CustomTag;
  updateTag: (id: string, updates: Partial<Pick<CustomTag, 'label' | 'color'>>) => void;
  deleteTag: (id: string) => void;
  isLabelTaken: (label: string, excludeId?: string) => boolean;

  // Toast
  toasts: ToastMessage[];
  dismissToast: (id: number) => void;
  toastSuccess: (message: string) => number;
  toastTrash: (message: string) => number;
  toastRestore: (message: string) => number;
  toastInfo: (message: string) => number;
  toastRecording: (message: string, durationSeconds?: number) => number;

  // Haptics
  haptics: ReturnType<typeof useHaptics>;

  // Practice stats
  onRecordingComplete: (
    songId: number,
    songName: string,
    sessionId: number,
    sessionName: string,
    sectionId?: number,
    duration?: number
  ) => void;

  // Pitch analysis
  isPitchAnalyzing: boolean;
  originalPitch: PitchAnalysisResult | null;
  recordingPitch: PitchAnalysisResult | null;
  matchPercentage: number | null;
  deviations: { time: number; centsDiff: number }[] | null;
  analyzeOriginal: (audioBuffer: AudioBuffer) => Promise<void>;
  analyzeRecording: (audioBuffer: AudioBuffer) => Promise<void>;
  clearPitchAnalysis: () => void;
  pitchError: string | null;

  // New section highlight
  newSectionIds: Set<number>;
  highlightNewSection: (sectionId: number) => void;
  clearNewHighlight: (sectionId: number) => void;

  // Audio devices
  audioDevices: ReturnType<typeof useAudioDevices>;
}

const PracticeContext = createContext<PracticeContextType | null>(null);

export function PracticeProvider({
  children,
  audioContext,
  currentSong,
  currentSession,
  sections,
  onSectionsChange,
  onAudioDataChange,
  onSheetMusicChange,
  onBasicRecordingsChange,
  onMetronomeSettingsChange,
  onBack,
  trashFunctions,
}: PracticePageProps & { children: ReactNode }) {
  const isCapacitor = false; // web-only build: always false
  const { isDark } = useTheme();
  const { customTags, addTag, updateTag, deleteTag, isLabelTaken } = useCustomTags();
  const { toasts, dismissToast, success: toastSuccess, trash: toastTrash, restore: toastRestore, info: toastInfo, recording: toastRecording } = useToast();
  const haptics = useHaptics();
  const { onRecordingComplete } = usePracticeStatsContext();

  // Audio management
  const {
    audioBuffer,
    isLoadingAudio,
    waveformData,
    duration,
    resolvedSheetMusic,
    handleAudioUpload,
  } = useAudioManagement({
    audioContext,
    currentSession,
    isCapacitor,
    onAudioDataChange,
  });

  // Shared state (used by multiple modules)
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [isLooping, setIsLooping] = useState(false);
  const [countdownDuration, setCountdownDuration] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('practix-countdown-duration');
      return saved ? parseFloat(saved) : 3;
    }
    return 3;
  });

  const handleCountdownDurationChange = useCallback((dur: number) => {
    setCountdownDuration(dur);
    if (typeof window !== 'undefined') {
      localStorage.setItem('practix-countdown-duration', dur.toString());
    }
  }, []);

  // New section highlight (shared between WaveformDisplay and SectionManager)
  const [newSectionIds, setNewSectionIds] = useState<Set<number>>(new Set());

  const highlightNewSection = useCallback((sectionId: number) => {
    setNewSectionIds((prev) => new Set(prev).add(sectionId));
  }, []);

  const clearNewHighlight = useCallback((sectionId: number) => {
    setNewSectionIds((prev) => {
      const next = new Set(prev);
      next.delete(sectionId);
      return next;
    });
  }, []);

  // Pitch analysis
  const {
    isAnalyzing: isPitchAnalyzing,
    originalPitch,
    recordingPitch,
    matchPercentage,
    deviations,
    analyzeOriginal,
    analyzeRecording,
    clearAnalysis: clearPitchAnalysis,
    error: pitchError,
  } = usePitchAnalysis();

  // Playback
  const {
    isPlaying,
    currentTime,
    playbackRate,
    volume,
    setVolume,
    playAudio,
    stopPlayback,
    togglePlay,
    setCurrentTime,
    setPlaybackRate,
  } = useAudioPlayback({
    audioContext,
    audioBuffer,
    selectedSection,
    onSectionEnd: () => setSelectedSection(null),
    loop: isLooping,
  });

  // Recorded playback
  const {
    recordedAudioBuffer,
    recordedCurrentTime,
    recordedIsPlaying,
    toggleRecordedPlay,
    addRecordedBuffer,
    removeRecordedBuffer,
    seekRecorded,
    updateTrimBounds,
    getEffectiveDuration,
  } = useRecordedPlayback({ audioContext });

  // Audio devices
  const audioDevices = useAudioDevices(audioContext);

  // Recording
  const {
    isRecording,
    isCountingDown,
    countdown,
    recordingTime,
    audioLevel,
    startRecording,
    stopRecording,
    cancelCountdown,
    error: recordingError,
  } = useRecording(audioDevices.selectedInputId);

  // Metronome
  const {
    startMetronome,
    stopMetronome,
    setAccentBeat: setMetronomeAccentBeat,
    setVolume: setMetronomeVolume,
    volume: metronomeVolume,
    isPlaying: metronomeIsPlaying,
    currentBeat: metronomeBeat,
    bpm: metronomeBpm,
    beatsPerMeasure: metronomeBeatsPerMeasure,
    timeSignature: metronomeTimeSignature,
  } = useMetronome({ audioContext });

  // Backing track
  const {
    backingTrackBuffers,
    backingTrackCurrentTime,
    backingTrackIsPlaying,
    backingTrackVolumes,
    uploadingBackingTrackId,
    handleBackingTrackUpload,
    handleRemoveBackingTrack,
    handleSetMetronome,
    handleSetMrMetronomeSync,
    handleRemoveMrMetronomeSync,
    playBackingTrack,
    stopBackingTrack,
    toggleBackingTrack,
    seekBackingTrack,
    updateBackingTrackVolume,
  } = useBackingTrackHandlers({
    audioContext,
    sections,
    onSectionsChange,
    startMetronome,
    stopMetronome,
  });

  // --- Background pause: stop all audio when app goes to background ---
  useEffect(() => {
    const pauseAll = () => {
      if (isPlaying) stopPlayback();
      if (metronomeIsPlaying) stopMetronome();
      // Stop all backing tracks
      Object.keys(backingTrackIsPlaying).forEach((key) => {
        if (backingTrackIsPlaying[Number(key)]) stopBackingTrack(Number(key));
      });
      // Stop all recorded playback
      Object.keys(recordedIsPlaying).forEach((key) => {
        if (recordedIsPlaying[Number(key)]) toggleRecordedPlay(Number(key));
      });
      // Note: recording is NOT auto-stopped — user might want to keep recording
      // while briefly switching apps. If needed, add stopRecording() here.
    };

    // Web visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) pauseAll();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPlaying, metronomeIsPlaying, backingTrackIsPlaying, recordedIsPlaying,
      stopPlayback, stopMetronome, stopBackingTrack, toggleRecordedPlay]);

  const value: PracticeContextType = {
    // Props passthrough
    audioContext, currentSong, currentSession, sections, onSectionsChange,
    onAudioDataChange, onSheetMusicChange, onBasicRecordingsChange, onMetronomeSettingsChange, onBack, trashFunctions,
    // Platform & theme
    isCapacitor, isDark,
    // Audio management
    audioBuffer, isLoadingAudio, waveformData, duration, resolvedSheetMusic, handleAudioUpload,
    // Playback
    isPlaying, currentTime, playbackRate, volume, setVolume, playAudio, stopPlayback, togglePlay, setCurrentTime, setPlaybackRate,
    // Shared state
    selectedSection, setSelectedSection, isLooping, setIsLooping,
    countdownDuration, handleCountdownDurationChange,
    // Recorded playback
    recordedAudioBuffer, recordedCurrentTime, recordedIsPlaying,
    toggleRecordedPlay, addRecordedBuffer, removeRecordedBuffer, seekRecorded, updateTrimBounds, getEffectiveDuration,
    // Recording
    isRecording, isCountingDown, countdown, recordingTime, audioLevel,
    startRecording, stopRecording, cancelCountdown, recordingError,
    // Metronome
    metronomeIsPlaying, metronomeBeat, metronomeBpm, metronomeBeatsPerMeasure, metronomeTimeSignature,
    startMetronome, stopMetronome, setMetronomeAccentBeat, metronomeVolume, setMetronomeVolume,
    // Backing track
    backingTrackBuffers, backingTrackCurrentTime, backingTrackIsPlaying, backingTrackVolumes, uploadingBackingTrackId,
    handleBackingTrackUpload, handleRemoveBackingTrack, handleSetMetronome,
    handleSetMrMetronomeSync, handleRemoveMrMetronomeSync,
    playBackingTrack, stopBackingTrack, toggleBackingTrack, seekBackingTrack, updateBackingTrackVolume,
    // Custom tags
    customTags, addTag, updateTag, deleteTag, isLabelTaken,
  // Toast
  toasts, dismissToast, toastSuccess, toastTrash, toastRestore, toastInfo, toastRecording,
    // Haptics
    haptics,
    // Practice stats
    onRecordingComplete,
    // Pitch analysis
    isPitchAnalyzing, originalPitch, recordingPitch, matchPercentage, deviations,
    analyzeOriginal, analyzeRecording, clearPitchAnalysis, pitchError,
    // New section highlight
    newSectionIds, highlightNewSection, clearNewHighlight,
    // Audio devices
    audioDevices,
  };

  return <PracticeContext.Provider value={value}>{children}</PracticeContext.Provider>;
}

export function usePracticeContext() {
  const context = useContext(PracticeContext);
  if (!context) {
    throw new Error('usePracticeContext must be used within a PracticeProvider');
  }
  return context;
}
