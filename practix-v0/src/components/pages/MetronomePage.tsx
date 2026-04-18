'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Minus, Plus } from 'lucide-react';
import { TimeSignature } from '@/types';
import { useAudioContext } from '@/hooks/useAudioContext';
import { useMetronome } from '@/hooks/useMetronome';
import MetronomeBeatIndicator from '@/components/practice/MetronomeBeatIndicator';

const TIME_SIGNATURES: TimeSignature[] = ['4/4', '3/4', '2/4', '6/8', '2/2'];

function getBeatsPerMeasure(ts: TimeSignature): number {
  switch (ts) {
    case '6/8': return 6;
    case '3/4': return 3;
    case '2/4': case '2/2': return 2;
    default: return 4;
  }
}

interface MetronomePageProps {
  isDark: boolean;
}

export default function MetronomePage({ isDark }: MetronomePageProps) {
  const audioContext = useAudioContext();
  const {
    startMetronome, stopMetronome, setAccentBeat, setVolume, volume,
    isPlaying, currentBeat, bpm: activeBpm, beatsPerMeasure, timeSignature: activeTs,
  } = useMetronome({ audioContext });

  const [bpm, setBpm] = useState(120);
  const [bpmInput, setBpmInput] = useState('120');
  const [timeSignature, setTimeSignature] = useState<TimeSignature>('4/4');
  const [accentBeat, setAccentBeatState] = useState(1);

  // Tap tempo
  const tapTimesRef = useRef<number[]>([]);
  const [tapCount, setTapCount] = useState(0);

  const handleTapTempo = useCallback(() => {
    const now = performance.now();
    const taps = tapTimesRef.current;
    if (taps.length > 0 && now - taps[taps.length - 1] > 2000) {
      tapTimesRef.current = [];
    }
    taps.push(now);
    setTapCount(taps.length);

    if (taps.length >= 3) {
      const intervals: number[] = [];
      for (let i = 1; i < taps.length; i++) {
        intervals.push(taps[i] - taps[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const detectedBpm = Math.round(60000 / avgInterval);
      const clamped = Math.max(40, Math.min(240, detectedBpm));
      setBpm(clamped);
      setBpmInput(String(clamped));
    }
  }, []);

  const handleToggle = useCallback(() => {
    if (isPlaying) {
      stopMetronome();
    } else {
      startMetronome(bpm, undefined, timeSignature, 0, accentBeat);
    }
  }, [isPlaying, bpm, timeSignature, accentBeat, startMetronome, stopMetronome]);

  const adjustBpm = useCallback((delta: number) => {
    setBpm(prev => {
      const next = Math.max(40, Math.min(240, prev + delta));
      setBpmInput(String(next));
      return next;
    });
  }, []);

  useEffect(() => {
    if (isPlaying) {
      stopMetronome();
      startMetronome(bpm, undefined, timeSignature, 0, accentBeat);
    }
  }, [bpm, timeSignature]);

  const handleAccentBeatChange = useCallback((beat: number) => {
    setAccentBeatState(beat);
    setAccentBeat(beat);
  }, [setAccentBeat]);

  const handleBpmInputBlur = () => {
    const parsed = parseInt(bpmInput);
    if (parsed >= 40 && parsed <= 240) {
      setBpm(parsed);
    } else {
      setBpmInput(String(bpm));
    }
  };

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startLongPress = (delta: number) => {
    adjustBpm(delta);
    intervalRef.current = setInterval(() => adjustBpm(delta), 120);
  };
  const stopLongPress = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 pb-24 bg-background">
      {/* Beat indicator */}
      <div className="mb-8">
        <MetronomeBeatIndicator
          currentBeat={currentBeat}
          bpm={activeBpm}
          isPlaying={isPlaying}
          beatsPerMeasure={isPlaying ? beatsPerMeasure : getBeatsPerMeasure(timeSignature)}
          timeSignature={isPlaying ? activeTs : timeSignature}
          accentBeat={accentBeat}
          onAccentBeatChange={handleAccentBeatChange}
        />
        {!isPlaying && (
          <div className="flex justify-center gap-1.5 mt-2">
            {Array.from({ length: getBeatsPerMeasure(timeSignature) }, (_, i) => (
              <button
                key={i}
                onClick={() => handleAccentBeatChange(i + 1)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  accentBeat === i + 1
                    ? 'bg-success/20 text-success ring-2 ring-success'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* BPM display */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onMouseDown={() => startLongPress(-1)}
          onMouseUp={stopLongPress}
          onMouseLeave={stopLongPress}
          onTouchStart={() => startLongPress(-1)}
          onTouchEnd={stopLongPress}
          className="w-12 h-12 rounded-full flex items-center justify-center bg-secondary text-foreground hover:bg-secondary/80 active:scale-95 transition-all"
        >
          <Minus className="w-5 h-5" />
        </button>

        <div className="text-center">
          <input
            type="number"
            min="40"
            max="240"
            value={bpmInput}
            onChange={(e) => setBpmInput(e.target.value)}
            onBlur={handleBpmInputBlur}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            className="text-6xl font-bold text-center w-36 bg-transparent outline-none text-foreground"
          />
          <p className="text-sm text-muted-foreground">BPM</p>
        </div>

        <button
          onMouseDown={() => startLongPress(1)}
          onMouseUp={stopLongPress}
          onMouseLeave={stopLongPress}
          onTouchStart={() => startLongPress(1)}
          onTouchEnd={stopLongPress}
          className="w-12 h-12 rounded-full flex items-center justify-center bg-secondary text-foreground hover:bg-secondary/80 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Time signature */}
      <div className="flex gap-2 mb-6">
        {TIME_SIGNATURES.map((ts) => (
          <button
            key={ts}
            onClick={() => {
              setTimeSignature(ts);
              setAccentBeatState(1);
            }}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              timeSignature === ts
                ? 'bg-success text-success-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {ts}
          </button>
        ))}
      </div>

      {/* Tap tempo */}
      <button
        onClick={handleTapTempo}
        className="px-6 py-3 rounded-xl text-sm font-medium mb-6 bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-95 transition-all"
      >
        탭 템포 {tapCount >= 3 ? `(${tapCount}회)` : ''}
      </button>

      {/* Volume */}
      <div className="w-full max-w-xs mb-8">
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">볼륨</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="flex-1 accent-success"
          />
          <span className="text-xs w-8 text-right text-muted-foreground">
            {Math.round(volume * 100)}
          </span>
        </div>
      </div>

      {/* Play/Stop button */}
      <button
        onClick={handleToggle}
        className={`w-24 h-24 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all ${
          isPlaying
            ? 'bg-destructive hover:bg-destructive/90'
            : 'bg-success hover:bg-success/90'
        }`}
      >
        {isPlaying ? (
          <div className="w-8 h-8 bg-destructive-foreground rounded-sm" />
        ) : (
          <div className="w-0 h-0 border-l-[20px] border-l-success-foreground border-t-[14px] border-t-transparent border-b-[14px] border-b-transparent ml-2" />
        )}
      </button>
    </div>
  );
}
