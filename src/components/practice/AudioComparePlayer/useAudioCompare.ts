'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseAudioCompareProps {
  audioContext: AudioContext | null;
  originalBuffer: AudioBuffer | null;
  recordedBuffer: AudioBuffer | null;
  sectionStart: number;
  sectionEnd: number;
  syncOffset?: number; // Recording sync offset
  isLooping?: boolean; // Loop playback
}

interface UseAudioCompareReturn {
  // Original (section) playback
  originalCurrentTime: number;
  originalIsPlaying: boolean;
  originalVolume: number;
  setOriginalVolume: (v: number) => void;
  playOriginal: () => void;
  pauseOriginal: () => void;
  seekOriginal: (time: number) => void;

  // Recorded playback
  recordedCurrentTime: number;
  recordedIsPlaying: boolean;
  recordedVolume: number;
  setRecordedVolume: (v: number) => void;
  playRecorded: () => void;
  pauseRecorded: () => void;
  seekRecorded: (time: number) => void;

  // Sync controls
  playBoth: () => void;
  resetBoth: () => void;
  stopAll: () => void;

  // Playback rate
  playbackRate: number;
  setPlaybackRate: (rate: number) => void;
}

export function useAudioCompare({
  audioContext,
  originalBuffer,
  recordedBuffer,
  sectionStart,
  sectionEnd,
  syncOffset = 0,
  isLooping = false,
}: UseAudioCompareProps): UseAudioCompareReturn {
  // State
  const [originalCurrentTime, setOriginalCurrentTime] = useState(0);
  const [originalIsPlaying, setOriginalIsPlaying] = useState(false);
  const [originalVolume, setOriginalVolume] = useState(1);

  const [recordedCurrentTime, setRecordedCurrentTime] = useState(0);
  const [recordedIsPlaying, setRecordedIsPlaying] = useState(false);
  const [recordedVolume, setRecordedVolume] = useState(1);

  const [playbackRate, setPlaybackRate] = useState(1);

  // Refs for audio nodes
  const originalSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const originalGainRef = useRef<GainNode | null>(null);
  const originalStartTimeRef = useRef<number>(0);
  const originalOffsetRef = useRef<number>(0);

  const recordedSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const recordedGainRef = useRef<GainNode | null>(null);
  const recordedStartTimeRef = useRef<number>(0);
  const recordedOffsetRef = useRef<number>(0);

  const animationFrameRef = useRef<number | null>(null);

  const sectionDuration = sectionEnd - sectionStart;

  // Update time displays
  const updateTimes = useCallback(() => {
    if (!audioContext) return;

    const now = audioContext.currentTime;

    if (originalIsPlaying && originalStartTimeRef.current > 0) {
      const elapsed = (now - originalStartTimeRef.current) * playbackRate;
      const newTime = originalOffsetRef.current + elapsed;
      if (newTime >= sectionDuration) {
        // Section ended
        setOriginalCurrentTime(sectionDuration);
        setOriginalIsPlaying(false);
      } else {
        setOriginalCurrentTime(newTime);
      }
    }

    if (recordedIsPlaying && recordedStartTimeRef.current > 0 && recordedBuffer) {
      const elapsed = (now - recordedStartTimeRef.current) * playbackRate;
      const newTime = recordedOffsetRef.current + elapsed;
      if (newTime >= recordedBuffer.duration) {
        setRecordedCurrentTime(recordedBuffer.duration);
        setRecordedIsPlaying(false);
      } else {
        setRecordedCurrentTime(newTime);
      }
    }

    if (originalIsPlaying || recordedIsPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateTimes);
    }
  }, [audioContext, originalIsPlaying, recordedIsPlaying, sectionDuration, recordedBuffer, playbackRate]);

  // Start animation loop when playing
  useEffect(() => {
    if (originalIsPlaying || recordedIsPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateTimes);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [originalIsPlaying, recordedIsPlaying, updateTimes]);

  // Update gain when volume changes
  useEffect(() => {
    if (originalGainRef.current) {
      originalGainRef.current.gain.value = originalVolume;
    }
  }, [originalVolume]);

  useEffect(() => {
    if (recordedGainRef.current) {
      recordedGainRef.current.gain.value = recordedVolume;
    }
  }, [recordedVolume]);

  // Stop original playback
  const stopOriginalSource = useCallback(() => {
    if (originalSourceRef.current) {
      try {
        originalSourceRef.current.stop();
      } catch {}
      originalSourceRef.current.disconnect();
      originalSourceRef.current = null;
    }
  }, []);

  // Stop recorded playback
  const stopRecordedSource = useCallback(() => {
    if (recordedSourceRef.current) {
      try {
        recordedSourceRef.current.stop();
      } catch {}
      recordedSourceRef.current.disconnect();
      recordedSourceRef.current = null;
    }
  }, []);

  // Play original (section) - with optional looping
  const playOriginalFromTime = useCallback((startTime: number) => {
    if (!audioContext || !originalBuffer) return;

    stopOriginalSource();

    const source = audioContext.createBufferSource();
    source.buffer = originalBuffer;
    source.playbackRate.value = playbackRate;

    const gain = audioContext.createGain();
    gain.gain.value = originalVolume;

    source.connect(gain);
    gain.connect(audioContext.destination);

    originalSourceRef.current = source;
    originalGainRef.current = gain;

    const startOffset = sectionStart + startTime;
    const duration = sectionDuration - startTime;

    source.start(0, startOffset, duration);
    originalStartTimeRef.current = audioContext.currentTime;
    originalOffsetRef.current = startTime;

    source.onended = () => {
      if (originalSourceRef.current === source) {
        if (isLooping) {
          // Loop: restart from beginning
          setOriginalCurrentTime(0);
          setTimeout(() => playOriginalFromTime(0), 0);
        } else {
          setOriginalIsPlaying(false);
          setOriginalCurrentTime(sectionDuration);
        }
      }
    };

    setOriginalIsPlaying(true);
  }, [audioContext, originalBuffer, originalVolume, playbackRate, sectionStart, sectionDuration, isLooping, stopOriginalSource]);

  const playOriginal = useCallback(() => {
    // If at the end, reset to beginning
    const startTime = originalCurrentTime >= sectionDuration - 0.1 ? 0 : originalCurrentTime;
    if (startTime === 0) {
      setOriginalCurrentTime(0);
    }
    playOriginalFromTime(startTime);
  }, [playOriginalFromTime, originalCurrentTime, sectionDuration]);

  // Pause original
  const pauseOriginal = useCallback(() => {
    if (!audioContext || !originalIsPlaying) return;

    const now = audioContext.currentTime;
    const elapsed = (now - originalStartTimeRef.current) * playbackRate;
    const newTime = Math.min(originalOffsetRef.current + elapsed, sectionDuration);

    stopOriginalSource();
    setOriginalCurrentTime(newTime);
    setOriginalIsPlaying(false);
  }, [audioContext, originalIsPlaying, playbackRate, sectionDuration, stopOriginalSource]);

  // Seek original
  const seekOriginal = useCallback((time: number) => {
    const wasPlaying = originalIsPlaying;
    if (wasPlaying) {
      stopOriginalSource();
    }

    const newTime = Math.max(0, Math.min(time, sectionDuration));
    setOriginalCurrentTime(newTime);

    if (wasPlaying) {
      // Will restart playback from new position
      setTimeout(() => playOriginalFromTime(newTime), 0);
    }
  }, [originalIsPlaying, sectionDuration, stopOriginalSource, playOriginalFromTime]);

  // Play recorded - with optional looping
  const playRecordedFromTime = useCallback((startTime: number) => {
    if (!audioContext || !recordedBuffer) return;

    stopRecordedSource();

    const source = audioContext.createBufferSource();
    source.buffer = recordedBuffer;
    source.playbackRate.value = playbackRate;

    const gain = audioContext.createGain();
    gain.gain.value = recordedVolume;

    source.connect(gain);
    gain.connect(audioContext.destination);

    recordedSourceRef.current = source;
    recordedGainRef.current = gain;

    source.start(0, startTime);
    recordedStartTimeRef.current = audioContext.currentTime;
    recordedOffsetRef.current = startTime;

    source.onended = () => {
      if (recordedSourceRef.current === source) {
        if (isLooping) {
          // Loop: restart from beginning
          setRecordedCurrentTime(0);
          setTimeout(() => playRecordedFromTime(0), 0);
        } else {
          setRecordedIsPlaying(false);
          setRecordedCurrentTime(recordedBuffer.duration);
        }
      }
    };

    setRecordedIsPlaying(true);
  }, [audioContext, recordedBuffer, recordedVolume, playbackRate, isLooping, stopRecordedSource]);

  const playRecorded = useCallback(() => {
    // If at the end, reset to beginning
    const maxTime = recordedBuffer?.duration || 0;
    const startTime = recordedCurrentTime >= maxTime - 0.1 ? 0 : recordedCurrentTime;
    if (startTime === 0) {
      setRecordedCurrentTime(0);
    }
    playRecordedFromTime(startTime);
  }, [playRecordedFromTime, recordedCurrentTime, recordedBuffer]);

  // Pause recorded
  const pauseRecorded = useCallback(() => {
    if (!audioContext || !recordedIsPlaying) return;

    const now = audioContext.currentTime;
    const elapsed = (now - recordedStartTimeRef.current) * playbackRate;
    const newTime = Math.min(recordedOffsetRef.current + elapsed, recordedBuffer?.duration || 0);

    stopRecordedSource();
    setRecordedCurrentTime(newTime);
    setRecordedIsPlaying(false);
  }, [audioContext, recordedIsPlaying, playbackRate, recordedBuffer, stopRecordedSource]);

  // Seek recorded
  const seekRecorded = useCallback((time: number) => {
    const wasPlaying = recordedIsPlaying;
    if (wasPlaying) {
      stopRecordedSource();
    }

    const maxTime = recordedBuffer?.duration || 0;
    const newTime = Math.max(0, Math.min(time, maxTime));
    setRecordedCurrentTime(newTime);

    if (wasPlaying) {
      setTimeout(() => playRecordedFromTime(newTime), 0);
    }
  }, [recordedIsPlaying, recordedBuffer, stopRecordedSource, playRecordedFromTime]);

  // Track which sources have ended for synchronized looping
  const originalEndedRef = useRef(false);
  const recordedEndedRef = useRef(false);

  // Play both with sync offset - with looping support
  const playBothInternal = useCallback(() => {
    if (!audioContext || !originalBuffer || !recordedBuffer) return;

    stopOriginalSource();
    stopRecordedSource();

    // Reset end tracking
    originalEndedRef.current = false;
    recordedEndedRef.current = false;

    // Reset to start
    setOriginalCurrentTime(0);
    setRecordedCurrentTime(0);

    // Create original source
    const origSource = audioContext.createBufferSource();
    origSource.buffer = originalBuffer;
    origSource.playbackRate.value = playbackRate;

    const origGain = audioContext.createGain();
    origGain.gain.value = originalVolume;

    origSource.connect(origGain);
    origGain.connect(audioContext.destination);

    originalSourceRef.current = origSource;
    originalGainRef.current = origGain;

    // Create recorded source
    const recSource = audioContext.createBufferSource();
    recSource.buffer = recordedBuffer;
    recSource.playbackRate.value = playbackRate;

    const recGain = audioContext.createGain();
    recGain.gain.value = recordedVolume;

    recSource.connect(recGain);
    recGain.connect(audioContext.destination);

    recordedSourceRef.current = recSource;
    recordedGainRef.current = recGain;

    const now = audioContext.currentTime;

    // Start original
    origSource.start(0, sectionStart, sectionDuration);
    originalStartTimeRef.current = now;
    originalOffsetRef.current = 0;

    // Start recorded with sync offset
    if (syncOffset >= 0) {
      recSource.start(now + syncOffset, 0);
      recordedStartTimeRef.current = now + syncOffset;
    } else {
      recSource.start(0, -syncOffset);
      recordedStartTimeRef.current = now;
    }
    recordedOffsetRef.current = 0;

    // Check if both ended and should loop
    const checkBothEndedAndLoop = () => {
      if (originalEndedRef.current && recordedEndedRef.current && isLooping) {
        // Both ended, restart both together
        setTimeout(() => playBothInternal(), 0);
      }
    };

    // When original ends
    origSource.onended = () => {
      if (originalSourceRef.current === origSource) {
        setOriginalIsPlaying(false);
        setOriginalCurrentTime(sectionDuration);
        originalEndedRef.current = true;

        if (isLooping) {
          // Wait for recorded to also end before looping
          checkBothEndedAndLoop();
        }
        // If not looping, just stay ended (recorded continues independently)
      }
    };

    // When recorded ends
    recSource.onended = () => {
      if (recordedSourceRef.current === recSource) {
        setRecordedIsPlaying(false);
        setRecordedCurrentTime(recordedBuffer.duration);
        recordedEndedRef.current = true;

        if (isLooping) {
          // Wait for original to also end before looping
          checkBothEndedAndLoop();
        }
        // If not looping, just stay ended (original continues independently)
      }
    };

    setOriginalIsPlaying(true);
    setRecordedIsPlaying(true);
  }, [audioContext, originalBuffer, recordedBuffer, playbackRate, originalVolume, recordedVolume, sectionStart, sectionDuration, syncOffset, isLooping, stopOriginalSource, stopRecordedSource]);

  const playBoth = useCallback(() => {
    playBothInternal();
  }, [playBothInternal]);

  // Reset both to start
  const resetBoth = useCallback(() => {
    stopOriginalSource();
    stopRecordedSource();
    setOriginalCurrentTime(0);
    setRecordedCurrentTime(0);
    setOriginalIsPlaying(false);
    setRecordedIsPlaying(false);
  }, [stopOriginalSource, stopRecordedSource]);

  // Stop all
  const stopAll = useCallback(() => {
    stopOriginalSource();
    stopRecordedSource();
    setOriginalIsPlaying(false);
    setRecordedIsPlaying(false);
  }, [stopOriginalSource, stopRecordedSource]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopOriginalSource();
      stopRecordedSource();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [stopOriginalSource, stopRecordedSource]);

  // Reset when buffers change
  useEffect(() => {
    setOriginalCurrentTime(0);
    setOriginalIsPlaying(false);
  }, [originalBuffer, sectionStart, sectionEnd]);

  useEffect(() => {
    setRecordedCurrentTime(0);
    setRecordedIsPlaying(false);
  }, [recordedBuffer]);

  return {
    originalCurrentTime,
    originalIsPlaying,
    originalVolume,
    setOriginalVolume,
    playOriginal,
    pauseOriginal,
    seekOriginal,

    recordedCurrentTime,
    recordedIsPlaying,
    recordedVolume,
    setRecordedVolume,
    playRecorded,
    pauseRecorded,
    seekRecorded,

    playBoth,
    resetBoth,
    stopAll,

    playbackRate,
    setPlaybackRate,
  };
}
