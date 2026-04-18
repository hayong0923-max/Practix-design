'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Section } from '@/types';

interface UseAudioPlaybackProps {
  audioContext: AudioContext | null;
  audioBuffer: AudioBuffer | null;
  selectedSection: Section | null;
  onSectionEnd: () => void;
  loop?: boolean;
}

export function useAudioPlayback({
  audioContext,
  audioBuffer,
  selectedSection,
  onSectionEnd,
  loop = false,
}: UseAudioPlaybackProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [pauseTime, setPauseTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);

  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const animationRef = useRef<number | null>(null);

  // Refs for values that need to be accessed in the animation loop
  const loopRef = useRef(loop);
  const selectedSectionRef = useRef(selectedSection);
  const onSectionEndRef = useRef(onSectionEnd);

  const duration = audioBuffer?.duration || 0;

  // Keep refs updated
  useEffect(() => {
    loopRef.current = loop;
  }, [loop]);

  useEffect(() => {
    selectedSectionRef.current = selectedSection;
  }, [selectedSection]);

  useEffect(() => {
    onSectionEndRef.current = onSectionEnd;
  }, [onSectionEnd]);

  // Stop playback function
  const stopPlayback = useCallback(() => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch (e) {
        console.log('Source already stopped');
      }
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  // Store stopPlayback in ref for useEffect access
  const stopPlaybackRef = useRef(stopPlayback);
  useEffect(() => {
    stopPlaybackRef.current = stopPlayback;
  }, [stopPlayback]);

  // Internal play function
  const playFromPosition = useCallback((startPos: number) => {
    if (!audioBuffer || !audioContext) return;

    // Stop any current playback
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch (e) {
        console.log('Previous source already stopped');
      }
      sourceNodeRef.current = null;
    }

    const gainNode = audioContext.createGain();
    gainNode.gain.value = volume;
    gainNode.connect(audioContext.destination);
    gainNodeRef.current = gainNode;

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.playbackRate.value = playbackRate;
    source.connect(gainNode);
    source.start(0, startPos);

    sourceNodeRef.current = source;
    setStartTime(audioContext.currentTime);
    setPauseTime(startPos);
    setIsPlaying(true);

    source.onended = () => {
      if (sourceNodeRef.current === source) {
        sourceNodeRef.current = null;
        setIsPlaying(false);
      }
    };
  }, [audioBuffer, audioContext, volume, playbackRate]);

  // Store playFromPosition in ref for useEffect access
  const playFromPositionRef = useRef(playFromPosition);
  useEffect(() => {
    playFromPositionRef.current = playFromPosition;
  }, [playFromPosition]);

  // Time update animation loop
  useEffect(() => {
    if (isPlaying && audioContext) {
      const updateTime = () => {
        // Compensate for audio output latency
        const outputLatency = audioContext.outputLatency || 0;
        const elapsed = (audioContext.currentTime - startTime - outputLatency) * playbackRate + pauseTime;
        setCurrentTime(Math.max(0, Math.min(elapsed, duration)));

        const section = selectedSectionRef.current;
        if (section && elapsed >= section.end) {
          if (loopRef.current) {
            // Loop back to section start
            playFromPositionRef.current(section.start);
          } else {
            stopPlaybackRef.current();
            onSectionEndRef.current();
          }
          return;
        }

        if (elapsed < duration) {
          animationRef.current = requestAnimationFrame(updateTime);
        } else {
          stopPlaybackRef.current();
        }
      };
      animationRef.current = requestAnimationFrame(updateTime);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, startTime, pauseTime, duration, audioContext, playbackRate]);

  // Public play function
  const playAudio = useCallback(
    (startPos: number = currentTime) => {
      playFromPosition(startPos);
    },
    [currentTime, playFromPosition]
  );

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      stopPlayback();
    } else {
      playAudio(currentTime);
    }
  }, [isPlaying, currentTime, playAudio, stopPlayback]);

  const seekTo = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  // Update volume in real-time
  const updateVolume = useCallback((newVolume: number) => {
    setVolume(newVolume);
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = newVolume;
    }
  }, []);

  // Update playback rate
  const updatePlaybackRate = useCallback((rate: number) => {
    setPlaybackRate(rate);
    if (sourceNodeRef.current) {
      sourceNodeRef.current.playbackRate.value = rate;
    }
  }, []);

  return {
    isPlaying,
    currentTime,
    duration,
    volume,
    playbackRate,
    playAudio,
    stopPlayback,
    togglePlay,
    seekTo,
    setCurrentTime,
    setVolume: updateVolume,
    setPlaybackRate: updatePlaybackRate,
  };
}
