'use client';

import { useState } from 'react';
import { Music, X } from 'lucide-react';
import { BackingTrack, TimeSignature } from '@/types';
import { hasMetronomeSync, getBeatsPerMeasure } from '@/utils/backingTrackSync';
import BeatGridSelector from './BeatGridSelector';

interface BackingTrackSectionProps {
  backingTrack: BackingTrack | null;
  isUploading: boolean;
  onUploadBackingTrack: (e: React.ChangeEvent<HTMLInputElement>, type: BackingTrack['type']) => void;
  onSetMetronome: (bpm: number, timeSignature: TimeSignature) => void;
  onRemoveBackingTrack: () => void;
  onSetMrMetronomeSync?: (bpm: number, timeSignature: TimeSignature, startBeat: number) => void;
  onRemoveMrMetronomeSync?: () => void;
}

const TIME_SIGNATURES: TimeSignature[] = ['4/4', '3/4', '2/4', '6/8', '2/2'];

export default function BackingTrackSection({
  backingTrack,
  isUploading,
  onUploadBackingTrack,
  onSetMetronome,
  onRemoveBackingTrack,
  onSetMrMetronomeSync,
  onRemoveMrMetronomeSync,
}: BackingTrackSectionProps) {
  const [selectedTimeSignature, setSelectedTimeSignature] = useState<TimeSignature>('4/4');
  const [bpmInput, setBpmInput] = useState('');
  const [showSyncSetup, setShowSyncSetup] = useState(false);
  const [syncBpmInput, setSyncBpmInput] = useState('');
  const [syncTimeSignature, setSyncTimeSignature] = useState<TimeSignature>('4/4');
  const [syncStartBeat, setSyncStartBeat] = useState(1);

  const handleSetMetronome = () => {
    const bpm = parseInt(bpmInput);
    if (bpm >= 40 && bpm <= 240) {
      onSetMetronome(bpm, selectedTimeSignature);
      setBpmInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSetMetronome();
    }
  };

  const handleApplySync = () => {
    const bpm = parseInt(syncBpmInput);
    if (bpm >= 40 && bpm <= 240 && onSetMrMetronomeSync) {
      onSetMrMetronomeSync(bpm, syncTimeSignature, syncStartBeat);
      setShowSyncSetup(false);
    }
  };

  const isMrOrCustom = backingTrack && (backingTrack.type === 'mr' || backingTrack.type === 'custom');
  const isSynced = hasMetronomeSync(backingTrack);

  return (
    <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-green-800 flex items-center gap-1">
          <Music className="w-4 h-4" />
          반주 (MR/메트로놈)
        </span>
        {backingTrack && (
          <button onClick={onRemoveBackingTrack} className="text-green-600 hover:text-green-800">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {backingTrack ? (
        <div>
          {/* 현재 반주 정보 */}
          <div className="flex items-center gap-2 text-sm text-green-700">
            <span className="px-2 py-1 bg-green-100 rounded text-xs">
              {backingTrack.type === 'mr'
                ? 'MR'
                : backingTrack.type === 'metronome'
                  ? `${backingTrack.timeSignature || '4/4'} · ${backingTrack.bpm} BPM`
                  : '커스텀'}
            </span>
            <span className="truncate flex-1">{backingTrack.name}</span>
          </div>

          {/* MR/커스텀일 때 메트로놈 싱크 옵션 */}
          {isMrOrCustom && onSetMrMetronomeSync && (
            <div className="mt-2">
              {isSynced ? (
                /* 싱크 설정됨 — 현재 상태 표시 */
                <div className="p-2 bg-green-100 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-green-700">
                      🎵 {backingTrack.timeSignature} · {backingTrack.bpm} BPM · {backingTrack.startBeat}박 시작
                    </span>
                    {onRemoveMrMetronomeSync && (
                      <button
                        onClick={onRemoveMrMetronomeSync}
                        className="text-xs text-green-600 active:text-green-800 px-2 py-1"
                      >
                        해제
                      </button>
                    )}
                  </div>
                  <BeatGridSelector
                    beatsPerMeasure={getBeatsPerMeasure(backingTrack.timeSignature!)}
                    timeSignature={backingTrack.timeSignature!}
                    bpm={backingTrack.bpm!}
                    selectedBeat={backingTrack.startBeat || 1}
                    onSelectBeat={(beat) => {
                      onSetMrMetronomeSync(backingTrack.bpm!, backingTrack.timeSignature!, beat);
                    }}
                  />
                </div>
              ) : showSyncSetup ? (
                /* 싱크 설정 UI */
                <div className="p-2 bg-green-100 rounded-lg space-y-2">
                  <div className="flex gap-1 items-center">
                    <select
                      value={syncTimeSignature}
                      onChange={(e) => setSyncTimeSignature(e.target.value as TimeSignature)}
                      className="w-16 px-1 py-2 rounded text-sm border border-green-300 bg-white"
                    >
                      {TIME_SIGNATURES.map((ts) => (
                        <option key={ts} value={ts}>{ts}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="40"
                      max="240"
                      placeholder="BPM"
                      value={syncBpmInput}
                      onChange={(e) => setSyncBpmInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplySync()}
                      className="w-16 px-1 py-2 rounded text-sm border border-green-300 text-center"
                    />
                    <button
                      onClick={handleApplySync}
                      className="flex-1 bg-green-500 active:bg-green-600 text-white py-2 rounded text-sm"
                    >
                      적용
                    </button>
                    <button
                      onClick={() => setShowSyncSetup(false)}
                      className="px-2 py-2 text-green-600 active:text-green-800 text-sm"
                    >
                      취소
                    </button>
                  </div>
                  {syncBpmInput && parseInt(syncBpmInput) >= 40 && (
                    <BeatGridSelector
                      beatsPerMeasure={getBeatsPerMeasure(syncTimeSignature)}
                      timeSignature={syncTimeSignature}
                      bpm={parseInt(syncBpmInput)}
                      selectedBeat={syncStartBeat}
                      onSelectBeat={setSyncStartBeat}
                    />
                  )}
                </div>
              ) : (
                /* 싱크 설정 버튼 */
                <button
                  onClick={() => setShowSyncSetup(true)}
                  className="w-full mt-1 py-2 text-xs text-green-600 active:text-green-800 border border-dashed border-green-300 rounded-lg"
                >
                  + 메트로놈 싱크 설정
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {/* File upload buttons */}
          <div className="flex gap-2">
            <label
              className={`flex-1 min-w-0 ${
                isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 active:bg-green-600 cursor-pointer'
              } text-white py-2.5 rounded-lg text-sm flex items-center justify-center gap-1`}
            >
              <Music className="w-4 h-4 flex-shrink-0" />
              <span>{isUploading ? '...' : 'MR'}</span>
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => onUploadBackingTrack(e, 'mr')}
                disabled={isUploading}
                className="hidden"
              />
            </label>
            <label
              className={`flex-1 min-w-0 ${
                isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 active:bg-green-600 cursor-pointer'
              } text-white py-2.5 rounded-lg text-sm flex items-center justify-center`}
            >
              <span>{isUploading ? '...' : '커스텀'}</span>
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => onUploadBackingTrack(e, 'custom')}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          </div>

          {/* Metronome settings */}
          <div className="flex gap-1 items-center">
            <select
              value={selectedTimeSignature}
              onChange={(e) => setSelectedTimeSignature(e.target.value as TimeSignature)}
              className="w-16 px-1 py-2.5 rounded-lg text-sm border border-green-300 focus:outline-none focus:border-green-500 bg-white flex-shrink-0"
            >
              {TIME_SIGNATURES.map((ts) => (
                <option key={ts} value={ts}>{ts}</option>
              ))}
            </select>
            <input
              type="number"
              min="40"
              max="240"
              placeholder="BPM"
              value={bpmInput}
              onChange={(e) => setBpmInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-14 px-1 py-2.5 rounded-lg text-sm border border-green-300 focus:outline-none focus:border-green-500 text-center flex-shrink-0"
            />
            <button
              onClick={handleSetMetronome}
              className="flex-1 min-w-0 bg-green-500 active:bg-green-600 text-white py-2.5 rounded-lg text-sm truncate"
            >
              메트로놈
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
