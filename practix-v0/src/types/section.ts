import { Recording, BackingTrack } from './recording';

export interface Section {
  id: number;
  name?: string; // 구간 이름 (없으면 "구간 N"으로 표시)
  start: number;
  end: number;
  memo?: string;
  recordedFiles: Recording[];
  backingTrack?: BackingTrack;
}
