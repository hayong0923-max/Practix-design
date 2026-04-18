'use client';

import { useState, useEffect } from 'react';

export function useAudioContext() {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  useEffect(() => {
    // Use 'playback' latency hint for smoother audio on mobile
    // This uses a larger buffer size to prevent underruns (pops/clicks)
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass({
      latencyHint: 'playback', // Prioritize smooth playback over low latency
      sampleRate: 48000, // Standard sample rate for consistency
    });
    setAudioContext(ctx);
    return () => {
      ctx.close();
    };
  }, []);

  return audioContext;
}
