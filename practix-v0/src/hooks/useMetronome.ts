'use client';

import { useRef, useCallback, useState } from 'react';
import { TimeSignature } from '@/types';

interface UseMetronomeProps {
  audioContext: AudioContext | null;
  onBeat?: (beat: number, isAccent: boolean) => void;
}

interface UseMetronomeReturn {
  startMetronome: (bpm: number, duration?: number, timeSignature?: TimeSignature, startDelay?: number, accentBeat?: number) => void;
  stopMetronome: () => void;
  setAccentBeat: (beat: number) => void;
  setVolume: (volume: number) => void;
  volume: number;
  isPlaying: boolean;
  currentBeat: number;
  bpm: number;
  beatsPerMeasure: number;
  timeSignature: TimeSignature;
}

// Get beats per measure based on time signature
function getBeatsPerMeasure(timeSignature: TimeSignature): number {
  switch (timeSignature) {
    case '2/4':
    case '2/2':
      return 2;
    case '3/4':
      return 3;
    case '4/4':
      return 4;
    case '6/8':
      return 6;
    default:
      return 4;
  }
}

// For 6/8, we accent beats 1 and 4 (two groups of 3)
function isAccentBeat(beatInMeasure: number, timeSignature: TimeSignature, accentBeat: number = 1): boolean {
  if (timeSignature === '6/8') {
    // 6/8은 두 그룹으로 나뉨: accentBeat 기준 + 3박 후
    const beatsPerMeasure = 6;
    const secondAccent = ((accentBeat - 1 + 3) % beatsPerMeasure) + 1;
    return beatInMeasure === accentBeat || beatInMeasure === secondAccent;
  }
  return beatInMeasure === accentBeat;
}

export function useMetronome({ audioContext, onBeat }: UseMetronomeProps): UseMetronomeReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [activeBpm, setActiveBpm] = useState(0);
  const [activeBeatsPerMeasure, setActiveBeatsPerMeasure] = useState(4);
  const [activeTimeSignature, setActiveTimeSignature] = useState<TimeSignature>('4/4');

  const [metronomeVolume, setMetronomeVolume] = useState(0.8);
  const volumeRef = useRef(0.8);

  const isPlayingRef = useRef(false);
  const nextNoteTimeRef = useRef(0);
  const schedulerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const visualIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const beatCountRef = useRef(0);
  const startTimeRef = useRef(0);
  const bpmRef = useRef(0);
  const beatsPerMeasureRef = useRef(4);
  const timeSignatureRef = useRef<TimeSignature>('4/4');

  // Create a click sound using oscillator
  const playClick = useCallback((time: number, isAccent: boolean = false) => {
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Higher pitch for accent, lower for others. Square wave for sharper click
    oscillator.frequency.value = isAccent ? 1200 : 900;
    oscillator.type = 'square';

    // Short click envelope - volume scaled by volumeRef
    const vol = volumeRef.current;
    const clickDuration = 0.04;
    gainNode.gain.setValueAtTime((isAccent ? 0.7 : 0.45) * vol, time);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + clickDuration);

    oscillator.start(time);
    oscillator.stop(time + clickDuration);
  }, [audioContext]);

  const stopMetronome = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    setCurrentBeat(0);
    setActiveBpm(0);
    setActiveBeatsPerMeasure(4);
    setActiveTimeSignature('4/4');

    if (schedulerIntervalRef.current) {
      clearInterval(schedulerIntervalRef.current);
      schedulerIntervalRef.current = null;
    }

    if (visualIntervalRef.current) {
      clearInterval(visualIntervalRef.current);
      visualIntervalRef.current = null;
    }
  }, []);

  const accentBeatRef = useRef(1);

  // 재시작 없이 악센트 비트만 변경
  const setAccentBeat = useCallback((beat: number) => {
    accentBeatRef.current = beat;
  }, []);

  // 볼륨 변경 (재시작 없이 즉시 적용)
  const setVolume = useCallback((vol: number) => {
    volumeRef.current = vol;
    setMetronomeVolume(vol);
  }, []);

  const startMetronome = useCallback((bpm: number, duration?: number, timeSignature: TimeSignature = '4/4', startDelay: number = 0, accentBeat: number = 1) => {
    if (!audioContext || isPlayingRef.current) return;

    const beatsPerMeasure = getBeatsPerMeasure(timeSignature);

    isPlayingRef.current = true;
    setIsPlaying(true);
    setActiveBpm(bpm);
    setActiveBeatsPerMeasure(beatsPerMeasure);
    setActiveTimeSignature(timeSignature);
    bpmRef.current = bpm;
    beatsPerMeasureRef.current = beatsPerMeasure;
    timeSignatureRef.current = timeSignature;
    accentBeatRef.current = accentBeat;

    const secondsPerBeat = 60 / bpm;
    beatCountRef.current = 0;
    startTimeRef.current = audioContext.currentTime + startDelay;
    nextNoteTimeRef.current = startTimeRef.current;

    // Scheduler function - schedules audio notes ahead of time for precise timing
    const scheduler = () => {
      if (!audioContext) return;

      // Schedule notes up to 100ms ahead
      while (nextNoteTimeRef.current < audioContext.currentTime + 0.1) {
        // Check if we've exceeded duration
        if (duration && (nextNoteTimeRef.current - startTimeRef.current) >= duration) {
          stopMetronome();
          return;
        }

        // Calculate beat position in measure (1-indexed)
        const beatInMeasure = (beatCountRef.current % beatsPerMeasureRef.current) + 1;
        const isAccent = isAccentBeat(beatInMeasure, timeSignatureRef.current, accentBeatRef.current);
        playClick(nextNoteTimeRef.current, isAccent);

        nextNoteTimeRef.current += secondsPerBeat;
        beatCountRef.current++;
      }
    };

    // Visual update function - updates the visual beat indicator
    const visualUpdate = () => {
      if (!audioContext || !isPlayingRef.current) return;

      const elapsed = audioContext.currentTime - startTimeRef.current;
      const currentBeatNumber = Math.floor(elapsed / secondsPerBeat);
      const beatInMeasure = (currentBeatNumber % beatsPerMeasureRef.current) + 1;

      setCurrentBeat(beatInMeasure);

      const isAccent = isAccentBeat(beatInMeasure, timeSignatureRef.current);
      if (onBeat) {
        onBeat(beatInMeasure, isAccent);
      }
    };

    // Run scheduler every 25ms for audio
    schedulerIntervalRef.current = setInterval(scheduler, 25);
    scheduler(); // Run immediately

    // Run visual update more frequently for smooth display
    visualIntervalRef.current = setInterval(visualUpdate, 50);
    visualUpdate(); // Run immediately
  }, [audioContext, playClick, onBeat, stopMetronome]);

  return {
    startMetronome,
    stopMetronome,
    setAccentBeat,
    setVolume,
    volume: metronomeVolume,
    isPlaying,
    currentBeat,
    bpm: activeBpm,
    beatsPerMeasure: activeBeatsPerMeasure,
    timeSignature: activeTimeSignature,
  };
}
