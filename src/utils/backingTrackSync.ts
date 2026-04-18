import { BackingTrack, TimeSignature } from '@/types';

/** MR/custom 반주에 메트로놈 싱크가 설정되어 있는지 판별 */
export function hasMetronomeSync(bt: BackingTrack | null | undefined): boolean {
  return !!bt && (bt.type === 'mr' || bt.type === 'custom') && !!bt.bpm && !!bt.timeSignature;
}

/** MR 시작 딜레이 계산 (초) — startBeat 1 = 딜레이 0 */
export function calculateMrDelay(startBeat: number, bpm: number): number {
  return (startBeat - 1) * (60 / bpm);
}

/** 박자표에 따른 마디당 비트 수 */
export function getBeatsPerMeasure(ts: TimeSignature): number {
  switch (ts) {
    case '6/8': return 6;
    case '3/4': return 3;
    case '2/4': case '2/2': return 2;
    default: return 4;
  }
}
