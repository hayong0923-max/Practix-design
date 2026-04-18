'use client';

import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { ChevronDown, ChevronUp, Zap, Minus, Plus, Save, Trash2, Scissors } from 'lucide-react';
import { TimeSignature } from '@/types';
import { usePracticeContext } from '@/contexts/PracticeContext';
import { detectBpm, calculateMetronomeDelay, extractOnsets, OnsetData } from '@/utils/bpmDetection';
import MetronomeBeatIndicator from './MetronomeBeatIndicator';

const TIME_SIGNATURES: TimeSignature[] = ['4/4', '3/4', '2/4', '6/8', '2/2'];

function GlobalMetronome() {
  const ctx = usePracticeContext();
  const saved = ctx.currentSession.metronomeSettings;

  const [enabled, setEnabled] = useState(!!saved);
  const [expanded, setExpanded] = useState(false);
  const [bpm, setBpm] = useState(saved?.bpm ?? 120);
  const [bpmInput, setBpmInput] = useState(String(saved?.bpm ?? 120));
  const [timeSignature, setTimeSignature] = useState<TimeSignature>(saved?.timeSignature ?? '4/4');
  const [accentBeat, setAccentBeatState] = useState(1);

  // 악센트 비트 변경: ref만 업데이트 (메트로놈 재시작 없이)
  const setAccentBeat = useCallback((beat: number) => {
    setAccentBeatState(beat);
    ctx.setMetronomeAccentBeat(beat);
  }, [ctx.setMetronomeAccentBeat]);
  const [detecting, setDetecting] = useState(false);
  const [firstBeatTime, setFirstBeatTime] = useState(saved?.firstBeatTime ?? 0);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [offset, setOffset] = useState(saved?.offset ?? 0);
  const [isSaved, setIsSaved] = useState(!!saved);
  const [onsetData, setOnsetData] = useState<OnsetData | null>(null);
  const onsetCanvasRef = useRef<HTMLCanvasElement>(null);

  // 탭 템포
  const tapTimesRef = useRef<number[]>([]);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [tapCount, setTapCount] = useState(0);

  // 싱크 탭 (재생 중 박자에 맞춰 탭)
  const syncTapTimesRef = useRef<number[]>([]);
  const syncTapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [syncTapCount, setSyncTapCount] = useState(0);

  // 메트로놈 on/off를 재생 상태에 연동
  useEffect(() => {
    if (!enabled) return;

    if (ctx.isPlaying) {
      const delay = calculateMetronomeDelay(ctx.currentTime, firstBeatTime + offset / 1000, bpm);

      ctx.stopMetronome();
      ctx.startMetronome(bpm, ctx.duration, timeSignature, delay, accentBeat);
    } else {
      ctx.stopMetronome();
    }

    return () => {
      ctx.stopMetronome();
    };
  }, [enabled, ctx.isPlaying, bpm, timeSignature, firstBeatTime, offset]);

  const handleBpmChange = useCallback((value: string) => {
    setBpmInput(value);
    const num = parseInt(value);
    if (num >= 40 && num <= 240) {
      setBpm(num);
    }
  }, []);

  const handleToggle = useCallback(() => {
    const next = !enabled;
    setEnabled(next);
    if (!next) {
      ctx.stopMetronome();
    }
    if (!expanded && next) {
      setExpanded(true);
    }
  }, [enabled, expanded, ctx.stopMetronome]);

  // BPM 자동 감지
  const handleAutoDetect = useCallback(() => {
    if (!ctx.audioBuffer || detecting) return;

    setDetecting(true);
    requestAnimationFrame(() => {
      setTimeout(() => {
        try {
          const result = detectBpm(ctx.audioBuffer!);
          setBpm(result.bpm);
          setBpmInput(result.bpm.toString());
          setFirstBeatTime(result.firstBeatTime);
          setConfidence(result.confidence);
          setOffset(0);

          // Onset 추출 (처음 10초)
          const onsets = extractOnsets(ctx.audioBuffer!, 10);
          setOnsetData(onsets);

          if (!enabled) {
            setEnabled(true);
          }
          setExpanded(true);
        } catch {
          // 실패 시 기본값 유지
        } finally {
          setDetecting(false);
        }
      }, 50);
    });
  }, [ctx.audioBuffer, detecting, enabled]);

  // 탭 템포
  const handleTap = useCallback(() => {
    const now = performance.now();
    const taps = tapTimesRef.current;

    // 2초 이상 지나면 리셋
    if (taps.length > 0 && now - taps[taps.length - 1] > 2000) {
      tapTimesRef.current = [];
    }

    taps.push(now);
    tapTimesRef.current = taps;
    setTapCount(taps.length);

    // 최근 8개만 유지
    if (taps.length > 8) {
      taps.shift();
    }

    // 3탭 이상이면 BPM 계산
    if (taps.length >= 3) {
      const intervals: number[] = [];
      for (let i = 1; i < taps.length; i++) {
        intervals.push(taps[i] - taps[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const tapBpm = Math.round(60000 / avgInterval);

      if (tapBpm >= 40 && tapBpm <= 240) {
        setBpm(tapBpm);
        setBpmInput(tapBpm.toString());
      }
    }

    // 2초 후 탭 카운트 리셋
    if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
    tapTimeoutRef.current = setTimeout(() => {
      setTapCount(0);
      tapTimesRef.current = [];
    }, 2000);
  }, []);

  // 싱크 탭: 재생 중 음악 박자에 맞춰 탭하면 오프셋 자동 계산
  const handleSyncTap = useCallback(() => {
    if (!ctx.isPlaying || bpm <= 0) return;

    const now = ctx.currentTime; // 오디오 재생 위치 (초)
    const taps = syncTapTimesRef.current;
    const beatInterval = 60 / bpm;

    // 3초 이상 지나면 리셋
    if (syncTapTimeoutRef.current) clearTimeout(syncTapTimeoutRef.current);
    syncTapTimeoutRef.current = setTimeout(() => {
      syncTapTimesRef.current = [];
      setSyncTapCount(0);
    }, 3000);

    taps.push(now);
    if (taps.length > 8) taps.shift();
    syncTapTimesRef.current = taps;
    setSyncTapCount(taps.length);

    // 2탭 이상이면 싱크 계산
    if (taps.length >= 2) {
      // 각 탭이 가장 가까운 비트 위치에서 얼마나 벗어났는지 계산
      const currentFirstBeat = firstBeatTime + offset / 1000;
      const errors: number[] = [];

      for (const t of taps) {
        const timeSinceFirst = t - currentFirstBeat;
        let remainder = timeSinceFirst % beatInterval;
        // remainder를 -beatInterval/2 ~ +beatInterval/2 범위로 조정
        if (remainder > beatInterval / 2) remainder -= beatInterval;
        if (remainder < -beatInterval / 2) remainder += beatInterval;
        errors.push(remainder);
      }

      const avgError = errors.reduce((a, b) => a + b, 0) / errors.length;
      // 오프셋 조정: 비트를 avgError만큼 뒤로 밀어야 함
      setOffset(prev => Math.round(prev + avgError * 1000));
    }
  }, [ctx.isPlaying, ctx.currentTime, bpm, firstBeatTime, offset]);

  // 설정이 변경되면 isSaved 해제
  useEffect(() => {
    if (!saved) { setIsSaved(false); return; }
    const same = saved.bpm === bpm && saved.timeSignature === timeSignature
      && saved.firstBeatTime === firstBeatTime && saved.offset === offset;
    setIsSaved(same);
  }, [bpm, timeSignature, firstBeatTime, offset, saved]);

  // 저장
  const handleSave = useCallback(() => {
    ctx.onMetronomeSettingsChange({ bpm, timeSignature, firstBeatTime, offset });
    setIsSaved(true);
  }, [bpm, timeSignature, firstBeatTime, offset, ctx.onMetronomeSettingsChange]);

  // 삭제
  const handleClear = useCallback(() => {
    ctx.onMetronomeSettingsChange(undefined);
    setIsSaved(false);
  }, [ctx.onMetronomeSettingsChange]);

  // Onset 캔버스 렌더링
  useEffect(() => {
    const canvas = onsetCanvasRef.current;
    if (!canvas || !onsetData || onsetData.totalFrames === 0) return;

    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx2d.scale(dpr, dpr);

    const totalTime = onsetData.totalFrames * onsetData.timePerFrame;
    const timeToX = (t: number) => (t / totalTime) * w;

    // 배경
    ctx2d.fillStyle = ctx.isDark ? '#1f2937' : '#f3f4f6';
    ctx2d.fillRect(0, 0, w, h);

    // 에너지 envelope
    ctx2d.beginPath();
    ctx2d.moveTo(0, h);
    for (let i = 0; i < onsetData.totalFrames; i++) {
      const x = (i / onsetData.totalFrames) * w;
      const y = h - onsetData.envelope[i] * h * 0.8;
      ctx2d.lineTo(x, y);
    }
    ctx2d.lineTo(w, h);
    ctx2d.closePath();
    ctx2d.fillStyle = ctx.isDark ? 'rgba(147, 130, 220, 0.3)' : 'rgba(147, 51, 234, 0.15)';
    ctx2d.fill();

    // Beat grid (현재 BPM 기준)
    if (bpm > 0) {
      const beatInterval = 60 / bpm;
      const adjustedFirst = firstBeatTime + offset / 1000;
      ctx2d.strokeStyle = ctx.isDark ? 'rgba(34, 211, 238, 0.25)' : 'rgba(6, 182, 212, 0.2)';
      ctx2d.lineWidth = 1;
      ctx2d.setLineDash([3, 3]);
      let beatTime = adjustedFirst;
      while (beatTime < 0) beatTime += beatInterval;
      while (beatTime < totalTime) {
        const x = timeToX(beatTime);
        ctx2d.beginPath();
        ctx2d.moveTo(x, 0);
        ctx2d.lineTo(x, h);
        ctx2d.stroke();
        beatTime += beatInterval;
      }
      ctx2d.setLineDash([]);
    }

    // Onset 마커
    for (const t of onsetData.onsets) {
      const x = timeToX(t);
      const isSelected = Math.abs(t - firstBeatTime) < 0.05;

      // 마커 라인
      ctx2d.strokeStyle = isSelected ? '#ef4444' : (ctx.isDark ? 'rgba(251, 191, 36, 0.7)' : 'rgba(245, 158, 11, 0.6)');
      ctx2d.lineWidth = isSelected ? 2.5 : 1.5;
      ctx2d.beginPath();
      ctx2d.moveTo(x, 0);
      ctx2d.lineTo(x, h);
      ctx2d.stroke();

      // 선택된 마커에 삼각형 표시
      if (isSelected) {
        ctx2d.fillStyle = '#ef4444';
        ctx2d.beginPath();
        ctx2d.moveTo(x - 5, 0);
        ctx2d.lineTo(x + 5, 0);
        ctx2d.lineTo(x, 7);
        ctx2d.closePath();
        ctx2d.fill();
      }
    }

    // 시간 라벨
    ctx2d.fillStyle = ctx.isDark ? '#9ca3af' : '#6b7280';
    ctx2d.font = '10px sans-serif';
    ctx2d.textAlign = 'center';
    for (let t = 0; t <= totalTime; t += 1) {
      const x = timeToX(t);
      ctx2d.fillText(`${t}s`, x, h - 2);
    }
  }, [onsetData, firstBeatTime, bpm, offset, ctx.isDark]);

  // Onset 캔버스 탭 핸들러: 가장 가까운 onset 선택
  const handleOnsetCanvasTap = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = onsetCanvasRef.current;
    if (!canvas || !onsetData || onsetData.onsets.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const totalTime = onsetData.totalFrames * onsetData.timePerFrame;
    const tapTime = (x / rect.width) * totalTime;

    // 가장 가까운 onset 찾기
    let closestOnset = onsetData.onsets[0];
    let closestDist = Math.abs(tapTime - closestOnset);
    for (const t of onsetData.onsets) {
      const dist = Math.abs(tapTime - t);
      if (dist < closestDist) {
        closestDist = dist;
        closestOnset = t;
      }
    }

    setFirstBeatTime(closestOnset);
    setOffset(0);
  }, [onsetData]);

  // 오프셋 조정
  const nudgeOffset = useCallback((deltaMs: number) => {
    setOffset(prev => prev + deltaMs);
  }, []);

  // 자동 구간 나누기 (베타)
  const [measuresPerSection, setMeasuresPerSection] = useState(4);
  const handleAutoSplit = useCallback(() => {
    if (bpm <= 0 || !ctx.duration) return;

    const beatsPerMeasure = (() => {
      switch (timeSignature) {
        case '2/4': case '2/2': return 2;
        case '3/4': return 3;
        case '6/8': return 6;
        default: return 4;
      }
    })();

    const secondsPerBeat = 60 / bpm;
    const secondsPerSection = secondsPerBeat * beatsPerMeasure * measuresPerSection;
    const adjustedFirst = firstBeatTime + offset / 1000;

    // 첫 박부터 시작해서 구간 생성
    const newSections = [];
    let sectionStart = adjustedFirst;

    // 첫 박 이전에 인트로 구간이 있으면 추가
    if (adjustedFirst > 0.5) {
      newSections.push({
        id: Date.now(),
        name: '인트로',
        start: 0,
        end: adjustedFirst,
        recordedFiles: [],
      });
    }

    let idx = 1;
    while (sectionStart < ctx.duration - 1) {
      const sectionEnd = Math.min(sectionStart + secondsPerSection, ctx.duration);
      if (sectionEnd - sectionStart < 0.5) break;

      newSections.push({
        id: Date.now() + idx,
        name: `${idx}`,
        start: sectionStart,
        end: sectionEnd,
        recordedFiles: [],
      });

      sectionStart = sectionEnd;
      idx++;
    }

    ctx.onSectionsChange(newSections);
  }, [bpm, timeSignature, firstBeatTime, offset, measuresPerSection, ctx.duration, ctx.onSectionsChange]);

  return (
    <div className={`${ctx.isDark ? 'bg-gray-800' : 'bg-white'} mt-2 px-5 py-3`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setExpanded(!expanded)}
          className={`flex items-center gap-2 text-sm font-medium ${ctx.isDark ? 'text-gray-400' : 'text-gray-500'}`}
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          메트로놈
        </button>

        <div className="flex items-center gap-2">
          {/* Auto detect */}
          {ctx.audioBuffer && (
            <button
              onClick={handleAutoDetect}
              disabled={detecting}
              className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                detecting
                  ? 'bg-yellow-400 text-white animate-pulse'
                  : ctx.isDark
                    ? 'bg-purple-600 text-purple-100 active:bg-purple-700'
                    : 'bg-purple-100 text-purple-600 active:bg-purple-200'
              }`}
            >
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                {detecting ? '분석중...' : '자동'}
              </span>
            </button>
          )}

          {/* Toggle */}
          <button
            onClick={handleToggle}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              enabled
                ? 'bg-green-500 text-white'
                : ctx.isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'
            }`}
          >
            {enabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Beat indicator (always show when enabled and playing) */}
      {enabled && ctx.metronomeIsPlaying && (
        <div className="mt-2">
          <MetronomeBeatIndicator
            currentBeat={ctx.metronomeBeat}
            bpm={ctx.metronomeBpm}
            isPlaying={ctx.metronomeIsPlaying}
            beatsPerMeasure={ctx.metronomeBeatsPerMeasure}
            timeSignature={ctx.metronomeTimeSignature}
            accentBeat={accentBeat}
            onAccentBeatChange={setAccentBeat}
          />
        </div>
      )}

      {/* Expanded settings */}
      {expanded && (
        <div className="mt-3 space-y-3">
          {/* Auto-detect result */}
          {confidence !== null && (
            <div className={`text-xs ${ctx.isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              감지: {bpm} BPM · 첫 박 {firstBeatTime.toFixed(2)}초
              {confidence < 0.3 && ' · 신뢰도 낮음'}
            </div>
          )}

          {/* Onset picker canvas */}
          {onsetData && onsetData.onsets.length > 0 && (
            <div>
              <span className={`text-xs ${ctx.isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                첫 박 선택 (노란선 탭 = 음 시작점, 점선 = 비트 그리드)
              </span>
              <canvas
                ref={onsetCanvasRef}
                className={`w-full rounded-lg mt-1 cursor-pointer ${ctx.isDark ? 'border border-gray-700' : 'border border-gray-200'}`}
                style={{ height: 64, touchAction: 'none' }}
                onClick={handleOnsetCanvasTap}
                onTouchStart={(e) => { e.preventDefault(); handleOnsetCanvasTap(e); }}
              />
              <div className={`text-xs mt-1 ${ctx.isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                선택: {firstBeatTime.toFixed(2)}초
              </div>
            </div>
          )}

          {/* BPM + Time Signature + Tap */}
          <div className="flex items-center gap-2">
            <select
              value={timeSignature}
              onChange={(e) => setTimeSignature(e.target.value as TimeSignature)}
              className={`w-16 px-1 py-2 rounded-lg text-sm border ${
                ctx.isDark
                  ? 'bg-gray-700 border-gray-600 text-gray-200'
                  : 'bg-white border-gray-300 text-gray-700'
              }`}
            >
              {TIME_SIGNATURES.map((ts) => (
                <option key={ts} value={ts}>{ts}</option>
              ))}
            </select>

            <input
              type="number"
              min="40"
              max="240"
              value={bpmInput}
              onChange={(e) => handleBpmChange(e.target.value)}
              className={`w-20 px-2 py-2 rounded-lg text-sm border text-center ${
                ctx.isDark
                  ? 'bg-gray-700 border-gray-600 text-gray-200'
                  : 'bg-white border-gray-300 text-gray-700'
              }`}
            />

            <span className={`text-xs ${ctx.isDark ? 'text-gray-500' : 'text-gray-400'}`}>BPM</span>

            {/* Tap tempo */}
            <button
              onClick={handleTap}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                tapCount >= 3
                  ? 'bg-orange-500 text-white'
                  : ctx.isDark
                    ? 'bg-gray-700 text-gray-300 active:bg-gray-600'
                    : 'bg-gray-200 text-gray-600 active:bg-gray-300'
              }`}
            >
              {tapCount >= 3 ? `TAP (${tapCount})` : 'TAP'}
            </button>
          </div>

          {/* Sync tap + offset nudge */}
          <div>
            <span className={`text-xs ${ctx.isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              박자 맞추기 ({offset >= 0 ? '+' : ''}{offset}ms)
            </span>
            <div className="flex items-center gap-2 mt-1">
              {/* 싱크 탭 버튼 - 재생 중 음악에 맞춰 탭 */}
              <button
                onClick={handleSyncTap}
                disabled={!ctx.isPlaying}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  !ctx.isPlaying
                    ? ctx.isDark ? 'bg-gray-700 text-gray-600' : 'bg-gray-100 text-gray-400'
                    : syncTapCount >= 2
                      ? 'bg-cyan-500 text-white active:bg-cyan-600'
                      : ctx.isDark
                        ? 'bg-cyan-900 text-cyan-300 active:bg-cyan-800'
                        : 'bg-cyan-100 text-cyan-700 active:bg-cyan-200'
                }`}
              >
                {!ctx.isPlaying
                  ? '재생 후 탭하세요'
                  : syncTapCount >= 2
                    ? `싱크 완료 (${syncTapCount})`
                    : syncTapCount === 1
                      ? '한번 더 탭!'
                      : '박자에 맞춰 탭'}
              </button>

              {/* 미세조정 */}
              <button
                onClick={() => nudgeOffset(-10)}
                className={`px-2.5 py-2.5 rounded-lg text-xs font-medium ${
                  ctx.isDark
                    ? 'bg-gray-700 text-gray-300 active:bg-gray-600'
                    : 'bg-gray-200 text-gray-600 active:bg-gray-300'
                }`}
              >
                <Minus className="w-3 h-3" />
              </button>
              <button
                onClick={() => setOffset(0)}
                className={`px-2.5 py-2.5 rounded-lg text-xs font-medium ${
                  offset !== 0
                    ? 'bg-red-100 text-red-600 active:bg-red-200'
                    : ctx.isDark
                      ? 'bg-gray-700 text-gray-500'
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                0
              </button>
              <button
                onClick={() => nudgeOffset(10)}
                className={`px-2.5 py-2.5 rounded-lg text-xs font-medium ${
                  ctx.isDark
                    ? 'bg-gray-700 text-gray-300 active:bg-gray-600'
                    : 'bg-gray-200 text-gray-600 active:bg-gray-300'
                }`}
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* 자동 구간 나누기 (베타) */}
          {bpm > 0 && ctx.duration > 0 && (
            <div>
              <span className={`text-xs ${ctx.isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                자동 구간 나누기 (베타)
              </span>
              <div className="flex items-center gap-2 mt-1">
                <select
                  value={measuresPerSection}
                  onChange={(e) => setMeasuresPerSection(Number(e.target.value))}
                  className={`px-2 py-2 rounded-lg text-sm border ${
                    ctx.isDark
                      ? 'bg-gray-700 border-gray-600 text-gray-200'
                      : 'bg-white border-gray-300 text-gray-700'
                  }`}
                >
                  {[2, 4, 8, 16].map((n) => (
                    <option key={n} value={n}>{n}마디</option>
                  ))}
                </select>
                <button
                  onClick={handleAutoSplit}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    ctx.isDark
                      ? 'bg-orange-900 text-orange-300 active:bg-orange-800'
                      : 'bg-orange-100 text-orange-700 active:bg-orange-200'
                  }`}
                >
                  <Scissors className="w-4 h-4" />
                  {ctx.sections.length > 0 ? '구간 다시 나누기' : '구간 나누기'}
                </button>
              </div>
              {ctx.sections.length > 0 && (
                <span className={`text-xs mt-1 block ${ctx.isDark ? 'text-red-400' : 'text-red-500'}`}>
                  ⚠ 기존 구간이 모두 교체됩니다
                </span>
              )}
            </div>
          )}

          {/* 저장/삭제 */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isSaved}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isSaved
                  ? ctx.isDark ? 'bg-gray-700 text-gray-500' : 'bg-gray-100 text-gray-400'
                  : 'bg-green-500 text-white active:bg-green-600'
              }`}
            >
              <Save className="w-4 h-4" />
              {isSaved ? '저장됨' : '이 곡에 저장'}
            </button>
            {saved && (
              <button
                onClick={handleClear}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  ctx.isDark
                    ? 'bg-gray-700 text-red-400 active:bg-gray-600'
                    : 'bg-red-50 text-red-500 active:bg-red-100'
                }`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(GlobalMetronome);
