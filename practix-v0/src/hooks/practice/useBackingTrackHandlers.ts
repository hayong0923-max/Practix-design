import { useState, useEffect } from 'react';
import { Section, BackingTrack, TimeSignature } from '@/types';
import { decodeAudioFromUrl, decodeAudioFromFile, fileToBase64 } from '@/utils/audioUtils';
import { hasMetronomeSync, calculateMrDelay } from '@/utils/backingTrackSync';

interface UseBackingTrackHandlersProps {
  audioContext: AudioContext | null;
  sections: Section[];
  onSectionsChange: (sections: Section[]) => void;
  startMetronome: (bpm: number, duration: number, timeSignature: TimeSignature) => void;
  stopMetronome: () => void;
}

export function useBackingTrackHandlers({
  audioContext,
  sections,
  onSectionsChange,
  startMetronome,
  stopMetronome,
}: UseBackingTrackHandlersProps) {
  const [backingTrackBuffers, setBackingTrackBuffers] = useState<Record<number, AudioBuffer>>({});
  const [backingTrackCurrentTime, setBackingTrackCurrentTime] = useState<Record<number, number>>({});
  const [backingTrackIsPlaying, setBackingTrackIsPlaying] = useState<Record<number, boolean>>({});
  const [backingTrackSourceNodes, setBackingTrackSourceNodes] = useState<Record<number, AudioBufferSourceNode | null>>({});
  const [backingTrackStartTime, setBackingTrackStartTime] = useState<Record<number, number>>({});
  const [backingTrackVolumes, setBackingTrackVolumes] = useState<Record<number, number>>({});
  const [backingTrackGainNodes, setBackingTrackGainNodes] = useState<Record<number, GainNode | null>>({});
  const [uploadingBackingTrackId, setUploadingBackingTrackId] = useState<number | null>(null);

  // Decode backing tracks on mount
  useEffect(() => {
    if (audioContext && sections.length > 0) {
      sections.forEach(async (section) => {
        if (section.backingTrack && section.backingTrack.data && !backingTrackBuffers[section.id]) {
          try {
            const decoded = await decodeAudioFromUrl(audioContext, section.backingTrack.data);
            setBackingTrackBuffers((prev) => ({ ...prev, [section.id]: decoded }));
          } catch (err) {
            console.error('Failed to decode backing track:', err);
          }
        }
      });
    }
  }, [audioContext, sections]);

  // Update backing track current time
  useEffect(() => {
    const intervals: NodeJS.Timeout[] = [];

    Object.entries(backingTrackIsPlaying).forEach(([sectionIdStr, isPlaying]) => {
      const sectionId = parseInt(sectionIdStr);
      if (isPlaying && backingTrackStartTime[sectionId] !== undefined) {
        const interval = setInterval(() => {
          if (audioContext) {
            const elapsed = audioContext.currentTime - backingTrackStartTime[sectionId];
            setBackingTrackCurrentTime((prev) => ({ ...prev, [sectionId]: elapsed }));
          }
        }, 50);
        intervals.push(interval);
      }
    });

    return () => intervals.forEach((i) => clearInterval(i));
  }, [backingTrackIsPlaying, backingTrackStartTime, audioContext]);

  const handleBackingTrackUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    section: Section,
    type: BackingTrack['type']
  ) => {
    const file = e.target.files?.[0];
    if (!file || !audioContext) return;

    try {
      setUploadingBackingTrackId(section.id);

      const decoded = await decodeAudioFromFile(audioContext, file);
      setBackingTrackBuffers((prev) => ({ ...prev, [section.id]: decoded }));

      const base64Data = await fileToBase64(file);
      const newBackingTrack: BackingTrack = {
        id: Date.now(),
        name: file.name,
        data: base64Data,
        type,
      };

      const updatedSections = sections.map((s) =>
        s.id === section.id ? { ...s, backingTrack: newBackingTrack } : s
      );
      onSectionsChange(updatedSections);
      setUploadingBackingTrackId(null);
    } catch (err) {
      console.error('Backing track upload error:', err);
      setUploadingBackingTrackId(null);
    }
  };

  const handleRemoveBackingTrack = (section: Section) => {
    stopBackingTrack(section.id);
    stopMetronome();

    setBackingTrackBuffers((prev) => {
      const newBuffers = { ...prev };
      delete newBuffers[section.id];
      return newBuffers;
    });

    const updatedSections = sections.map((s) =>
      s.id === section.id ? { ...s, backingTrack: undefined } : s
    );
    onSectionsChange(updatedSections);
  };

  const handleSetMetronome = (section: Section, bpm: number, timeSignature: TimeSignature) => {
    const newBackingTrack: BackingTrack = {
      id: Date.now(),
      name: `메트로놈 ${timeSignature} · ${bpm} BPM`,
      data: '',
      type: 'metronome',
      bpm,
      timeSignature,
    };

    const updatedSections = sections.map((s) =>
      s.id === section.id ? { ...s, backingTrack: newBackingTrack } : s
    );
    onSectionsChange(updatedSections);
  };

  const playBackingTrack = (sectionId: number, startTime: number = 0) => {
    const section = sections.find((s) => s.id === sectionId);

    // 메트로놈 전용 모드
    if (section?.backingTrack?.type === 'metronome' && section.backingTrack.bpm) {
      stopMetronome();
      const sectionDuration = section.end - section.start;
      const timeSignature = section.backingTrack.timeSignature || '4/4';
      startMetronome(section.backingTrack.bpm, sectionDuration, timeSignature);
      setBackingTrackIsPlaying((prev) => ({ ...prev, [sectionId]: true }));
      return;
    }

    if (!audioContext || !backingTrackBuffers[sectionId]) return;

    stopBackingTrack(sectionId);

    // MR+메트로놈 싱크 모드: 메트로놈 시작 + MR 딜레이 스케줄링
    const synced = hasMetronomeSync(section?.backingTrack);
    if (synced && section?.backingTrack) {
      const bt = section.backingTrack;
      const sectionDuration = section.end - section.start;
      stopMetronome();
      startMetronome(bt.bpm!, sectionDuration, bt.timeSignature!);
    }

    const mrDelay = synced && section?.backingTrack?.startBeat && section.backingTrack.bpm
      ? calculateMrDelay(section.backingTrack.startBeat, section.backingTrack.bpm)
      : 0;

    const gainNode = audioContext.createGain();
    gainNode.gain.value = backingTrackVolumes[sectionId] ?? 1;
    gainNode.connect(audioContext.destination);
    setBackingTrackGainNodes((prev) => ({ ...prev, [sectionId]: gainNode }));

    const source = audioContext.createBufferSource();
    source.buffer = backingTrackBuffers[sectionId];
    source.connect(gainNode);

    source.onended = () => {
      setBackingTrackIsPlaying((prev) => ({ ...prev, [sectionId]: false }));
      setBackingTrackSourceNodes((prev) => ({ ...prev, [sectionId]: null }));
    };

    // Web Audio API: source.start(when, offset) — when에 딜레이 추가로 정확한 비트 동기화
    source.start(audioContext.currentTime + mrDelay, startTime);
    setBackingTrackSourceNodes((prev) => ({ ...prev, [sectionId]: source }));
    setBackingTrackIsPlaying((prev) => ({ ...prev, [sectionId]: true }));
    setBackingTrackStartTime((prev) => ({ ...prev, [sectionId]: audioContext.currentTime + mrDelay - startTime }));
    setBackingTrackCurrentTime((prev) => ({ ...prev, [sectionId]: startTime }));
  };

  const stopBackingTrack = (sectionId: number) => {
    stopMetronome();

    const source = backingTrackSourceNodes[sectionId];
    if (source) {
      try {
        source.stop();
      } catch (e) {
        // Already stopped
      }
    }
    setBackingTrackIsPlaying((prev) => ({ ...prev, [sectionId]: false }));
    setBackingTrackSourceNodes((prev) => ({ ...prev, [sectionId]: null }));
  };

  const toggleBackingTrack = (sectionId: number) => {
    if (backingTrackIsPlaying[sectionId]) {
      stopBackingTrack(sectionId);
    } else {
      playBackingTrack(sectionId, backingTrackCurrentTime[sectionId] || 0);
    }
  };

  const seekBackingTrack = (sectionId: number, time: number) => {
    setBackingTrackCurrentTime((prev) => ({ ...prev, [sectionId]: time }));
    if (backingTrackIsPlaying[sectionId]) {
      playBackingTrack(sectionId, time);
    }
  };

  const updateBackingTrackVolume = (sectionId: number, volume: number) => {
    setBackingTrackVolumes((prev) => ({ ...prev, [sectionId]: volume }));
    if (backingTrackGainNodes[sectionId]) {
      backingTrackGainNodes[sectionId]!.gain.value = volume;
    }
  };

  const handleSetMrMetronomeSync = (
    section: Section,
    bpm: number,
    timeSignature: TimeSignature,
    startBeat: number
  ) => {
    if (!section.backingTrack || section.backingTrack.type === 'metronome') return;

    const updatedSections = sections.map((s) =>
      s.id === section.id
        ? { ...s, backingTrack: { ...s.backingTrack!, bpm, timeSignature, startBeat } }
        : s
    );
    onSectionsChange(updatedSections);
  };

  const handleRemoveMrMetronomeSync = (section: Section) => {
    if (!section.backingTrack) return;

    stopMetronome();

    const { bpm: _, timeSignature: __, startBeat: ___, ...rest } = section.backingTrack;
    const updatedSections = sections.map((s) =>
      s.id === section.id
        ? { ...s, backingTrack: rest as BackingTrack }
        : s
    );
    onSectionsChange(updatedSections);
  };

  return {
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
    setBackingTrackCurrentTime,
  };
}
