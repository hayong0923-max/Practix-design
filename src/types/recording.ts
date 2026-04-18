export interface Recording {
  id: number;
  name: string;
  uploadDate: string;
  data: string; // base64 on web, 'file' marker on mobile (actual file in recordings folder)
  tags: string[];
  memo?: string;
  syncOffset?: number; // 싱크 오프셋 (초 단위, +면 녹음이 원곡보다 늦게 시작)
  trimStart?: number; // 트림 시작점 (초 단위)
  trimEnd?: number; // 트림 끝점 (초 단위)
}

export type TimeSignature = '4/4' | '3/4' | '2/4' | '6/8' | '2/2';

export interface BackingTrack {
  id: number;
  name: string;
  data: string; // base64 for mr/custom, empty for metronome
  type: 'mr' | 'metronome' | 'custom';
  bpm?: number; // metronome type 또는 MR/custom의 메트로놈 싱크용
  timeSignature?: TimeSignature; // metronome type 또는 MR/custom의 메트로놈 싱크용
  startBeat?: number; // MR/custom: 메트로놈 비트 그리드에서 시작 위치 (1-based, 소수점 허용)
}

export interface PredefinedTag {
  id: string;
  label: string;
  color: string;
}
