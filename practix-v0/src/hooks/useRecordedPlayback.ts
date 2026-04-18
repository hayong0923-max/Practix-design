'use client';

import { useState, useRef, useCallback } from 'react';

interface TrimBounds {
  start: number;
  end: number;
}

interface UseRecordedPlaybackProps {
  audioContext: AudioContext | null;
}

export function useRecordedPlayback({ audioContext }: UseRecordedPlaybackProps) {
  const [recordedAudioBuffer, setRecordedAudioBuffer] = useState<Record<number, AudioBuffer>>({});
  const [recordedCurrentTime, setRecordedCurrentTime] = useState<Record<number, number>>({});
  const [recordedIsPlaying, setRecordedIsPlaying] = useState<Record<number, boolean>>({});
  const [recordedStartTime, setRecordedStartTime] = useState<Record<number, number>>({});
  const [recordedPauseTime, setRecordedPauseTime] = useState<Record<number, number>>({});
  const [recordedVolume, setRecordedVolume] = useState<Record<number, number>>({});
  const [recordedPlaybackRate, setRecordedPlaybackRate] = useState<Record<number, number>>({});
  const [recordedTrimBounds, setRecordedTrimBounds] = useState<Record<number, TrimBounds | null>>({});

  const recordedSourceNodeRef = useRef<Record<number, AudioBufferSourceNode | null>>({});
  const recordedGainNodeRef = useRef<Record<number, GainNode | null>>({});
  const recordedAnimationRef = useRef<Record<number, number | null>>({});

  // Refs to avoid stale closure issues
  const recordedIsPlayingRef = useRef(recordedIsPlaying);
  const recordedVolumeRef = useRef(recordedVolume);
  const recordedPlaybackRateRef = useRef(recordedPlaybackRate);

  // Keep refs in sync with state
  recordedIsPlayingRef.current = recordedIsPlaying;
  recordedVolumeRef.current = recordedVolume;
  recordedPlaybackRateRef.current = recordedPlaybackRate;

  const playRecordedAudio = useCallback(
    (recordingId: number, startPos: number = 0) => {
      const buffer = recordedAudioBuffer[recordingId];
      if (!buffer || !audioContext) return;

      // Get trim bounds for this recording
      const trimBounds = recordedTrimBounds[recordingId];
      const trimStart = trimBounds?.start ?? 0;
      const trimEnd = trimBounds?.end ?? buffer.duration;
      const trimmedDuration = trimEnd - trimStart;

      // Adjust startPos to be within trim bounds
      const effectiveStartPos = Math.max(trimStart, Math.min(trimStart + startPos, trimEnd));

      // Stop ALL other recordings first
      Object.keys(recordedSourceNodeRef.current).forEach((key) => {
        const keyNum = Number(key);
        if (keyNum !== recordingId && recordedSourceNodeRef.current[keyNum]) {
          try {
            recordedSourceNodeRef.current[keyNum]?.stop();
            recordedSourceNodeRef.current[keyNum]?.disconnect();
          } catch (e) {}
          recordedSourceNodeRef.current[keyNum] = null;

          if (recordedAnimationRef.current[keyNum]) {
            cancelAnimationFrame(recordedAnimationRef.current[keyNum]!);
            recordedAnimationRef.current[keyNum] = null;
          }

          setRecordedIsPlaying((prev) => ({ ...prev, [keyNum]: false }));
        }
      });

      // Stop previous instance of the same recording
      if (recordedSourceNodeRef.current[recordingId]) {
        try {
          recordedSourceNodeRef.current[recordingId]?.stop();
          recordedSourceNodeRef.current[recordingId]?.disconnect();
        } catch (e) {}
        if (recordedAnimationRef.current[recordingId]) {
          cancelAnimationFrame(recordedAnimationRef.current[recordingId]!);
        }
      }

      // Create gain node for volume control
      const gainNode = audioContext.createGain();
      gainNode.gain.value = recordedVolumeRef.current[recordingId] ?? 1;
      gainNode.connect(audioContext.destination);
      recordedGainNodeRef.current[recordingId] = gainNode;

      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      const rate = recordedPlaybackRateRef.current[recordingId] ?? 1;
      source.playbackRate.value = rate;
      source.connect(gainNode);

      // Play from effectiveStartPos with limited duration
      const remainingDuration = trimEnd - effectiveStartPos;
      source.start(0, effectiveStartPos, remainingDuration);

      recordedSourceNodeRef.current[recordingId] = source;
      const startTimeVal = audioContext.currentTime;
      setRecordedStartTime((prev) => ({ ...prev, [recordingId]: startTimeVal }));
      setRecordedPauseTime((prev) => ({ ...prev, [recordingId]: effectiveStartPos - trimStart })); // Store relative to trim start
      setRecordedIsPlaying((prev) => ({ ...prev, [recordingId]: true }));

      // Animation loop - currentTime is relative to trim start
      const updateTime = () => {
        // Check if this animation loop is still for the current source
        // If a new playRecordedAudio was called, source will be different
        if (recordedSourceNodeRef.current[recordingId] !== source) {
          return; // New playback session started, stop this loop
        }

        const currentRate = recordedPlaybackRateRef.current[recordingId] ?? 1;
        const outputLatency = audioContext.outputLatency || 0;
        const elapsed = (audioContext.currentTime - startTimeVal - outputLatency) * currentRate;
        const relativeTime = (effectiveStartPos - trimStart) + elapsed; // Relative to trim start

        setRecordedCurrentTime((prev) => ({
          ...prev,
          [recordingId]: Math.max(0, Math.min(relativeTime, trimmedDuration)),
        }));

        if (relativeTime < trimmedDuration && recordedSourceNodeRef.current[recordingId] === source) {
          recordedAnimationRef.current[recordingId] = requestAnimationFrame(updateTime);
        } else if (recordedSourceNodeRef.current[recordingId] === source) {
          // Only stop if this is still the current source
          try {
            source.stop();
            source.disconnect();
          } catch (e) {}
          recordedSourceNodeRef.current[recordingId] = null;
          if (recordedAnimationRef.current[recordingId]) {
            cancelAnimationFrame(recordedAnimationRef.current[recordingId]!);
          }
          setRecordedIsPlaying((prev) => ({ ...prev, [recordingId]: false }));
        }
      };
      recordedAnimationRef.current[recordingId] = requestAnimationFrame(updateTime);

      source.onended = () => {
        if (recordedSourceNodeRef.current[recordingId] === source) {
          // Use inline stop logic to avoid dependency issues
          recordedSourceNodeRef.current[recordingId] = null;
          if (recordedAnimationRef.current[recordingId]) {
            cancelAnimationFrame(recordedAnimationRef.current[recordingId]!);
          }
          setRecordedIsPlaying((prev) => ({ ...prev, [recordingId]: false }));
        }
      };
    },
    [audioContext, recordedAudioBuffer, recordedTrimBounds]
  );

  const stopRecordedPlayback = useCallback((recordingId: number) => {
    if (recordedSourceNodeRef.current[recordingId]) {
      try {
        recordedSourceNodeRef.current[recordingId]?.stop();
        recordedSourceNodeRef.current[recordingId]?.disconnect();
      } catch (e) {}
      recordedSourceNodeRef.current[recordingId] = null;
    }
    if (recordedAnimationRef.current[recordingId]) {
      cancelAnimationFrame(recordedAnimationRef.current[recordingId]!);
    }
    setRecordedIsPlaying((prev) => ({ ...prev, [recordingId]: false }));
  }, []);

  // Ref for current time to avoid stale closure
  const recordedCurrentTimeRef = useRef(recordedCurrentTime);
  recordedCurrentTimeRef.current = recordedCurrentTime;

  const toggleRecordedPlay = useCallback(
    (recordingId: number) => {
      if (recordedIsPlayingRef.current[recordingId]) {
        stopRecordedPlayback(recordingId);
      } else {
        playRecordedAudio(recordingId, recordedCurrentTimeRef.current[recordingId] || 0);
      }
    },
    [playRecordedAudio, stopRecordedPlayback]
  );

  const addRecordedBuffer = useCallback((recordingId: number, buffer: AudioBuffer, trimStart?: number, trimEnd?: number) => {
    setRecordedAudioBuffer((prev) => ({ ...prev, [recordingId]: buffer }));
    // Set trim bounds if provided
    if (trimStart !== undefined || trimEnd !== undefined) {
      setRecordedTrimBounds((prev) => ({
        ...prev,
        [recordingId]: {
          start: trimStart ?? 0,
          end: trimEnd ?? buffer.duration,
        },
      }));
    }
  }, []);

  const updateTrimBounds = useCallback((recordingId: number, trimStart: number, trimEnd: number) => {
    setRecordedTrimBounds((prev) => ({
      ...prev,
      [recordingId]: { start: trimStart, end: trimEnd },
    }));
    // Reset current time if it's beyond new bounds
    setRecordedCurrentTime((prev) => {
      const currentTime = prev[recordingId] || 0;
      const trimmedDuration = trimEnd - trimStart;
      if (currentTime > trimmedDuration) {
        return { ...prev, [recordingId]: 0 };
      }
      return prev;
    });
  }, []);

  const removeRecordedBuffer = useCallback((recordingId: number) => {
    setRecordedAudioBuffer((prev) => {
      const newBuffers = { ...prev };
      delete newBuffers[recordingId];
      return newBuffers;
    });
  }, []);

  const seekRecorded = useCallback(
    (recordingId: number, time: number) => {
      setRecordedCurrentTime((prev) => ({ ...prev, [recordingId]: time }));

      // Use ref to get current playing state (avoid stale closure)
      if (recordedIsPlayingRef.current[recordingId]) {
        playRecordedAudio(recordingId, time);
      }
    },
    [playRecordedAudio]
  );

  // Update volume for a recording
  const updateRecordedVolume = useCallback((recordingId: number, volume: number) => {
    setRecordedVolume((prev) => ({ ...prev, [recordingId]: volume }));
    if (recordedGainNodeRef.current[recordingId]) {
      recordedGainNodeRef.current[recordingId]!.gain.value = volume;
    }
  }, []);

  // Update playback rate for a recording
  const updateRecordedPlaybackRate = useCallback((recordingId: number, rate: number) => {
    setRecordedPlaybackRate((prev) => ({ ...prev, [recordingId]: rate }));
    if (recordedSourceNodeRef.current[recordingId]) {
      recordedSourceNodeRef.current[recordingId]!.playbackRate.value = rate;
    }
  }, []);

  // Get effective duration (accounting for trim)
  const getEffectiveDuration = useCallback((recordingId: number) => {
    const buffer = recordedAudioBuffer[recordingId];
    if (!buffer) return 0;

    const trimBounds = recordedTrimBounds[recordingId];
    if (trimBounds) {
      return trimBounds.end - trimBounds.start;
    }
    return buffer.duration;
  }, [recordedAudioBuffer, recordedTrimBounds]);

  return {
    recordedAudioBuffer,
    recordedCurrentTime,
    recordedIsPlaying,
    recordedVolume,
    recordedPlaybackRate,
    recordedTrimBounds,
    playRecordedAudio,
    stopRecordedPlayback,
    toggleRecordedPlay,
    addRecordedBuffer,
    removeRecordedBuffer,
    seekRecorded,
    setRecordedCurrentTime,
    setRecordedVolume: updateRecordedVolume,
    setRecordedPlaybackRate: updateRecordedPlaybackRate,
    updateTrimBounds,
    getEffectiveDuration,
  };
}
