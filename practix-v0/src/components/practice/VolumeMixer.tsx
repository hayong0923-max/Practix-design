'use client';

import { useState, memo } from 'react';
import { Volume2, ChevronDown, ChevronUp } from 'lucide-react';
import { usePracticeContext } from '@/contexts/PracticeContext';

function VolumeMixer() {
  const ctx = usePracticeContext();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`${ctx.isDark ? 'bg-gray-800' : 'bg-white'} mt-2 px-5 py-3`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className={`flex items-center gap-2 text-sm font-medium ${ctx.isDark ? 'text-gray-400' : 'text-gray-500'}`}
      >
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        <Volume2 className="w-4 h-4" />
        볼륨 믹서
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {/* 원곡 */}
          <VolumeSlider
            label="원곡"
            value={ctx.volume}
            onChange={ctx.setVolume}
            isDark={ctx.isDark}
            color="purple"
          />

          {/* 메트로놈 */}
          <VolumeSlider
            label="메트로놈"
            value={ctx.metronomeVolume}
            onChange={ctx.setMetronomeVolume}
            isDark={ctx.isDark}
            color="green"
          />
        </div>
      )}
    </div>
  );
}

interface VolumeSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  isDark: boolean;
  color: 'purple' | 'green' | 'cyan' | 'orange';
}

const colorMap = {
  purple: { track: 'bg-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  green: { track: 'bg-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
  cyan: { track: 'bg-cyan-500', bg: 'bg-cyan-100 dark:bg-cyan-900/30' },
  orange: { track: 'bg-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30' },
};

function VolumeSlider({ label, value, onChange, isDark, color }: VolumeSliderProps) {
  const pct = Math.round(value * 100);
  const colors = colorMap[color];

  return (
    <div className="flex items-center gap-3">
      <span className={`text-xs w-14 flex-shrink-0 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        {label}
      </span>
      <div className="flex-1 relative h-8 flex items-center">
        <div className={`w-full h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} relative overflow-hidden`}>
          <div
            className={`absolute h-full rounded-full ${colors.track} transition-all`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={pct}
          onChange={(e) => onChange(Number(e.target.value) / 100)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
      <span className={`text-xs w-8 text-right flex-shrink-0 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        {pct}%
      </span>
    </div>
  );
}

export default memo(VolumeMixer);
