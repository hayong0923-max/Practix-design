import { Section } from './section';
import { SheetMusic } from './sheetMusic';
import { Recording } from './recording';
import { TimeSignature } from './recording';

export interface MetronomeSettings {
  bpm: number;
  timeSignature: TimeSignature;
  firstBeatTime: number; // 초 단위
  offset: number;        // ms 단위
}

export interface Session {
  id: number;
  name: string;
  audioData: string | null;
  sections: Section[];
  markers: number[];
  sheetMusic?: SheetMusic;
  basicRecordings?: Recording[]; // 구간에 연결되지 않은 기본 녹음
  metronomeSettings?: MetronomeSettings;
}

export interface Song {
  id: number;
  name: string;
  sessions: Session[];
}

export type ZoomLevel = 'full' | '60s' | '30s' | '10s';
