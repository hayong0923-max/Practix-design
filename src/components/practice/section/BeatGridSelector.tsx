'use client';

import { getBeatsPerMeasure, calculateMrDelay } from '@/utils/backingTrackSync';
import { TimeSignature } from '@/types';

interface BeatGridSelectorProps {
  beatsPerMeasure: number;
  timeSignature: TimeSignature;
  bpm: number;
  selectedBeat: number;
  onSelectBeat: (beat: number) => void;
}

export default function BeatGridSelector({
  beatsPerMeasure,
  timeSignature,
  bpm,
  selectedBeat,
  onSelectBeat,
}: BeatGridSelectorProps) {
  // 메인 비트 + 서브비트 (반박) 생성
  const beats: { value: number; isMain: boolean }[] = [];
  for (let i = 1; i <= beatsPerMeasure; i++) {
    beats.push({ value: i, isMain: true });
    beats.push({ value: i + 0.5, isMain: false });
  }

  const delay = calculateMrDelay(selectedBeat, bpm);
  const delayMs = Math.round(delay * 1000);

  return (
    <div className="mt-2">
      {/* Beat grid */}
      <div className="flex items-center gap-1 justify-center py-2">
        {beats.map((beat) => {
          const isSelected = beat.value === selectedBeat;
          return (
            <button
              key={beat.value}
              onClick={() => onSelectBeat(beat.value)}
              className={`
                flex items-center justify-center rounded-full transition-all
                ${beat.isMain
                  ? `w-9 h-9 text-xs font-bold ${
                      isSelected
                        ? 'bg-green-500 text-white scale-110'
                        : 'bg-green-100 text-green-700 active:bg-green-200'
                    }`
                  : `w-5 h-5 ${
                      isSelected
                        ? 'bg-green-500 scale-110'
                        : 'bg-green-200 active:bg-green-300'
                    }`
                }
              `}
            >
              {beat.isMain ? beat.value : ''}
            </button>
          );
        })}
      </div>

      {/* Delay info */}
      <div className="text-center text-xs text-green-600 mt-1">
        {selectedBeat === 1
          ? 'MR이 바로 시작'
          : `${selectedBeat % 1 === 0 ? selectedBeat : selectedBeat.toFixed(1)}박 → 딜레이 ${delayMs}ms`
        }
      </div>
    </div>
  );
}
