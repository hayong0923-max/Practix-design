'use client';

import { TimeSignature } from '@/types';

interface MetronomeBeatIndicatorProps {
  currentBeat: number;
  bpm: number;
  isPlaying: boolean;
  beatsPerMeasure: number;
  timeSignature: TimeSignature;
  accentBeat?: number;
  onAccentBeatChange?: (beat: number) => void;
}

function isAccentBeat(beat: number, timeSignature: TimeSignature, accentBeat: number = 1): boolean {
  if (timeSignature === '6/8') {
    const secondAccent = ((accentBeat - 1 + 3) % 6) + 1;
    return beat === accentBeat || beat === secondAccent;
  }
  return beat === accentBeat;
}

export default function MetronomeBeatIndicator({
  currentBeat,
  bpm,
  isPlaying,
  beatsPerMeasure,
  timeSignature,
  accentBeat = 1,
  onAccentBeatChange,
}: MetronomeBeatIndicatorProps) {
  if (!isPlaying || bpm === 0) return null;

  const beats = Array.from({ length: beatsPerMeasure }, (_, i) => i + 1);

  const handleTap = (beat: number) => {
    if (onAccentBeatChange) onAccentBeatChange(beat);
  };

  // For 6/8, render as two groups of 3
  const renderBeats = () => {
    if (timeSignature === '6/8') {
      return (
        <div className="flex gap-4">
          <div className="flex gap-1.5">
            {[1, 2, 3].map((beat) => (
              <BeatCircle
                key={beat}
                beat={beat}
                currentBeat={currentBeat}
                isAccent={isAccentBeat(beat, timeSignature, accentBeat)}
                size="small"
                onTap={onAccentBeatChange ? () => handleTap(beat) : undefined}
              />
            ))}
          </div>
          <div className="flex gap-1.5">
            {[4, 5, 6].map((beat) => (
              <BeatCircle
                key={beat}
                beat={beat}
                currentBeat={currentBeat}
                isAccent={isAccentBeat(beat, timeSignature, accentBeat)}
                size="small"
                onTap={onAccentBeatChange ? () => handleTap(beat) : undefined}
              />
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="flex gap-2">
        {beats.map((beat) => (
          <BeatCircle
            key={beat}
            beat={beat}
            currentBeat={currentBeat}
            isAccent={isAccentBeat(beat, timeSignature, accentBeat)}
            size="normal"
            onTap={onAccentBeatChange ? () => handleTap(beat) : undefined}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex items-center justify-center gap-3 py-2">
      {renderBeats()}

      {/* Time signature and BPM display */}
      <div className="flex flex-col items-center ml-2">
        <div className="text-xs text-green-600 font-medium">{timeSignature}</div>
        <div className="text-sm text-green-700 font-medium">{bpm} BPM</div>
      </div>
    </div>
  );
}

interface BeatCircleProps {
  beat: number;
  currentBeat: number;
  isAccent: boolean;
  size: 'small' | 'normal';
  onTap?: () => void;
}

function BeatCircle({ beat, currentBeat, isAccent, size, onTap }: BeatCircleProps) {
  const isCurrent = currentBeat === beat;
  const sizeClasses = size === 'small' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm';

  return (
    <button
      type="button"
      onClick={onTap}
      disabled={!onTap}
      className={`${sizeClasses} rounded-full flex items-center justify-center font-bold transition-all duration-75 ${
        isCurrent
          ? isAccent
            ? 'bg-green-500 text-white scale-125 shadow-lg shadow-green-500/50'
            : 'bg-green-400 text-white scale-110 shadow-md shadow-green-400/50'
          : isAccent
            ? 'bg-green-200 text-green-700 ring-2 ring-green-400'
            : 'bg-green-100 text-green-600'
      } ${onTap ? 'cursor-pointer active:scale-90' : ''}`}
    >
      {beat}
    </button>
  );
}
