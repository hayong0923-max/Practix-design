'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { frequencyToNote } from '@/utils/pitchDetection';

interface TunerPageProps {
  isDark: boolean;
}

// Lightweight real-time YIN for tuner (smaller buffer for low latency)
function yinDetect(buf: Float32Array, sampleRate: number): { frequency: number; confidence: number } {
  const half = Math.floor(buf.length / 2);
  const d = new Float32Array(half);

  for (let tau = 0; tau < half; tau++) {
    let sum = 0;
    for (let i = 0; i < half; i++) {
      const delta = buf[i] - buf[i + tau];
      sum += delta * delta;
    }
    d[tau] = sum;
  }

  // Cumulative mean normalized
  d[0] = 1;
  let running = 0;
  for (let tau = 1; tau < half; tau++) {
    running += d[tau];
    d[tau] = d[tau] * tau / running;
  }

  // Threshold
  const threshold = 0.15;
  let tauEst = -1;
  for (let tau = 2; tau < half; tau++) {
    if (d[tau] < threshold) {
      while (tau + 1 < half && d[tau + 1] < d[tau]) tau++;
      tauEst = tau;
      break;
    }
  }

  if (tauEst === -1) return { frequency: 0, confidence: 0 };

  // Parabolic interpolation
  const x0 = tauEst > 0 ? tauEst - 1 : tauEst;
  const x2 = tauEst + 1 < half ? tauEst + 1 : tauEst;
  let betterTau: number;
  if (x0 === tauEst) {
    betterTau = d[tauEst] <= d[x2] ? tauEst : x2;
  } else if (x2 === tauEst) {
    betterTau = d[tauEst] <= d[x0] ? tauEst : x0;
  } else {
    const s0 = d[x0], s1 = d[tauEst], s2 = d[x2];
    betterTau = tauEst + (s2 - s0) / (2 * (2 * s1 - s2 - s0));
  }

  return {
    frequency: sampleRate / betterTau,
    confidence: 1 - d[tauEst],
  };
}

export default function TunerPage({ isDark }: TunerPageProps) {
  const [isListening, setIsListening] = useState(false);
  const [note, setNote] = useState('');
  const [cents, setCents] = useState(0);
  const [frequency, setFrequency] = useState(0);
  const [confidence, setConfidence] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bufferRef = useRef<any>(null);

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      bufferRef.current = new Float32Array(analyser.fftSize);
      setIsListening(true);
    } catch {
      // Permission denied or no mic
    }
  }, []);

  const stopListening = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current = null;
    streamRef.current = null;
    setIsListening(false);
    setNote('');
    setCents(0);
    setFrequency(0);
    setConfidence(0);
  }, []);

  // Detection loop
  useEffect(() => {
    if (!isListening || !analyserRef.current || !bufferRef.current) return;

    const detect = () => {
      const analyser = analyserRef.current;
      const buf = bufferRef.current;
      if (!analyser || !buf) return;

      analyser.getFloatTimeDomainData(buf);

      // Check if there's any signal
      let maxAmp = 0;
      for (let i = 0; i < buf.length; i++) {
        const abs = Math.abs(buf[i]);
        if (abs > maxAmp) maxAmp = abs;
      }

      if (maxAmp < 0.01) {
        // Too quiet
        setConfidence(0);
        rafRef.current = requestAnimationFrame(detect);
        return;
      }

      const result = yinDetect(buf, analyserRef.current!.context.sampleRate);

      if (result.frequency > 50 && result.frequency < 2000 && result.confidence > 0.8) {
        const noteInfo = frequencyToNote(result.frequency);
        setNote(noteInfo.note);
        setCents(noteInfo.cents);
        setFrequency(Math.round(result.frequency * 10) / 10);
        setConfidence(result.confidence);
      } else {
        setConfidence(prev => prev * 0.9); // Fade out
      }

      rafRef.current = requestAnimationFrame(detect);
    };

    rafRef.current = requestAnimationFrame(detect);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isListening]);

  // Cleanup
  useEffect(() => () => stopListening(), []);

  // Cents to color/position
  const absCents = Math.abs(cents);
  const isInTune = absCents <= 5 && confidence > 0.8;
  const centsColor = isInTune
    ? 'text-green-500'
    : absCents <= 15
      ? isDark ? 'text-yellow-400' : 'text-yellow-500'
      : isDark ? 'text-red-400' : 'text-red-500';

  // Gauge position: cents range -50 to +50, mapped to -1 to +1
  const gaugePos = Math.max(-1, Math.min(1, cents / 50));

  return (
    <div className={`flex-1 flex flex-col items-center justify-center px-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Gauge */}
      <div className="w-full max-w-xs mb-8">
        {/* Tick marks */}
        <div className="relative h-8 mb-2">
          {[-50, -25, 0, 25, 50].map((tick) => (
            <div
              key={tick}
              className="absolute top-0 flex flex-col items-center"
              style={{ left: `${((tick + 50) / 100) * 100}%`, transform: 'translateX(-50%)' }}
            >
              <div className={`w-0.5 ${tick === 0 ? 'h-5' : 'h-3'} ${
                tick === 0
                  ? 'bg-green-500'
                  : isDark ? 'bg-gray-600' : 'bg-gray-300'
              }`} />
              <span className={`text-[10px] mt-0.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                {tick === 0 ? '0' : tick > 0 ? `+${tick}` : tick}
              </span>
            </div>
          ))}
        </div>

        {/* Needle */}
        <div className="relative h-4">
          <div className={`absolute top-0 h-full rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} style={{ left: 0, right: 0 }} />
          {/* Center zone */}
          <div className="absolute top-0 h-full bg-green-500/20 rounded-full" style={{ left: '40%', width: '20%' }} />
          {/* Needle indicator */}
          {confidence > 0.5 && (
            <div
              className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full shadow-lg transition-all duration-100 ${
                isInTune ? 'bg-green-500 shadow-green-500/50' : isDark ? 'bg-gray-300' : 'bg-gray-600'
              }`}
              style={{ left: `calc(${((gaugePos + 1) / 2) * 100}% - 8px)` }}
            />
          )}
        </div>
      </div>

      {/* Note display */}
      <div className="text-center mb-2">
        <span className={`text-8xl font-bold tracking-wider ${
          confidence > 0.5 ? (isInTune ? 'text-green-500' : isDark ? 'text-white' : 'text-gray-900') : isDark ? 'text-gray-700' : 'text-gray-300'
        }`}>
          {note || '--'}
        </span>
      </div>

      {/* Cents */}
      <div className="text-center mb-2">
        <span className={`text-2xl font-medium ${confidence > 0.5 ? centsColor : isDark ? 'text-gray-700' : 'text-gray-300'}`}>
          {confidence > 0.5 ? (cents > 0 ? `+${cents}` : cents) : '0'} cents
        </span>
      </div>

      {/* Frequency */}
      <div className="mb-12">
        <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          {confidence > 0.5 ? `${frequency} Hz` : '-- Hz'}
        </span>
      </div>

      {/* Listen button */}
      <button
        onClick={isListening ? stopListening : startListening}
        className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg ${
          isListening
            ? 'bg-red-500 active:bg-red-600'
            : isDark ? 'bg-purple-500 active:bg-purple-600' : 'bg-purple-500 active:bg-purple-600'
        }`}
      >
        {isListening ? (
          <MicOff className="w-8 h-8 text-white" />
        ) : (
          <Mic className="w-8 h-8 text-white" />
        )}
      </button>
      <p className={`mt-3 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        {isListening ? '듣는 중...' : '탭하여 시작'}
      </p>
    </div>
  );
}
