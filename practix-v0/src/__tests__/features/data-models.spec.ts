/**
 * @fileoverview 데이터 모델 테스트
 * Practix 앱의 핵심 데이터 구조를 검증합니다.
 */

import { describe, it, expect } from 'vitest';
import type { Song, Session, Section, Recording, BackingTrack, TimeSignature, ZoomLevel, PredefinedTag } from '@/types';

describe('데이터 모델', () => {
  describe('Song (곡)', () => {
    it('곡은 id, name, sessions 배열을 가짐', () => {
      const song: Song = {
        id: 1,
        name: '테스트 곡',
        sessions: [],
      };

      expect(song.id).toBe(1);
      expect(song.name).toBe('테스트 곡');
      expect(song.sessions).toEqual([]);
    });

    it('곡은 여러 세션을 포함할 수 있음', () => {
      const song: Song = {
        id: 1,
        name: '테스트 곡',
        sessions: [
          { id: 1, name: '연습 1', audioData: null, sections: [], markers: [] },
          { id: 2, name: '연습 2', audioData: null, sections: [], markers: [] },
        ],
      };

      expect(song.sessions).toHaveLength(2);
    });
  });

  describe('Session (세션)', () => {
    it('세션은 id, name, audioData, sections, markers를 가짐', () => {
      const session: Session = {
        id: 1,
        name: '연습 세션',
        audioData: null,
        sections: [],
        markers: [],
      };

      expect(session.id).toBe(1);
      expect(session.name).toBe('연습 세션');
      expect(session.audioData).toBeNull();
      expect(session.sections).toEqual([]);
      expect(session.markers).toEqual([]);
    });

    it('audioData는 마커 문자열일 수 있음 (idb, file)', () => {
      const webSession: Session = {
        id: 1, name: 'Web', audioData: 'idb', sections: [], markers: [],
      };
      const mobileSession: Session = {
        id: 2, name: 'Mobile', audioData: 'file', sections: [], markers: [],
      };

      expect(webSession.audioData).toBe('idb');
      expect(mobileSession.audioData).toBe('file');
    });

    it('markers는 시간(초) 배열임', () => {
      const session: Session = {
        id: 1,
        name: '마커 테스트',
        audioData: null,
        sections: [],
        markers: [10.5, 30.0, 60.25],
      };

      expect(session.markers).toContain(10.5);
      expect(session.markers).toContain(30.0);
    });
  });

  describe('Section (구간)', () => {
    it('구간은 id, start, end를 필수로 가짐', () => {
      const section: Section = {
        id: 1,
        start: 0,
        end: 30,
        recordedFiles: [],
      };

      expect(section.id).toBe(1);
      expect(section.start).toBe(0);
      expect(section.end).toBe(30);
    });

    it('구간은 선택적으로 memo, backingTrack을 가질 수 있음', () => {
      const section: Section = {
        id: 1,
        start: 0,
        end: 30,
        memo: '어려운 부분',
        backingTrack: {
          id: 1,
          name: '메트로놈',
          data: '',
          type: 'metronome',
          bpm: 120,
          timeSignature: '4/4',
        },
        recordedFiles: [],
      };

      expect(section.memo).toBe('어려운 부분');
      expect(section.backingTrack?.type).toBe('metronome');
    });

    it('구간 길이는 end - start로 계산됨', () => {
      const section: Section = {
        id: 1, start: 10, end: 40, recordedFiles: [],
      };

      const duration = section.end - section.start;
      expect(duration).toBe(30);
    });
  });

  describe('Recording (녹음)', () => {
    it('녹음은 id, name, uploadDate, data를 가짐', () => {
      const recording: Recording = {
        id: 1,
        name: '녹음 1',
        uploadDate: '2024-01-01T00:00:00Z',
        data: 'data:audio/wav;base64,...',
        tags: [],
        memo: '',
      };

      expect(recording.id).toBe(1);
      expect(recording.name).toBe('녹음 1');
      expect(recording.data).toContain('data:audio');
    });

    it('녹음은 여러 태그를 가질 수 있음', () => {
      const recording: Recording = {
        id: 1,
        name: '녹음 1',
        uploadDate: '2024-01-01T00:00:00Z',
        data: 'data:audio/wav;base64,...',
        tags: ['good', 'timing'],
        memo: '',
      };

      expect(recording.tags).toContain('good');
      expect(recording.tags).toContain('timing');
    });
  });

  describe('BackingTrack (반주)', () => {
    it('반주 타입은 mr, metronome, custom 중 하나임', () => {
      const types: BackingTrack['type'][] = ['mr', 'metronome', 'custom'];
      expect(types).toContain('mr');
      expect(types).toContain('metronome');
      expect(types).toContain('custom');
    });

    it('메트로놈 타입은 bpm과 timeSignature를 가짐', () => {
      const metronome: BackingTrack = {
        id: 1,
        name: '메트로놈 120BPM',
        data: '',
        type: 'metronome',
        bpm: 120,
        timeSignature: '4/4',
      };

      expect(metronome.bpm).toBe(120);
      expect(metronome.timeSignature).toBe('4/4');
    });
  });

  describe('TimeSignature (박자)', () => {
    it('지원하는 박자: 4/4, 3/4, 2/4, 6/8, 2/2', () => {
      const timeSignatures: TimeSignature[] = ['4/4', '3/4', '2/4', '6/8', '2/2'];
      expect(timeSignatures).toHaveLength(5);
    });
  });

  describe('ZoomLevel (줌 레벨)', () => {
    it('지원하는 줌 레벨: full, 60s, 30s, 10s', () => {
      const zoomLevels: ZoomLevel[] = ['full', '60s', '30s', '10s'];
      expect(zoomLevels).toHaveLength(4);
    });
  });

  describe('PredefinedTag (태그)', () => {
    it('미리 정의된 태그 5개: good, practice, timing, pitch, dynamics', () => {
      const expectedTags = ['good', 'practice', 'timing', 'pitch', 'dynamics'];
      expect(expectedTags).toHaveLength(5);
    });

    it('각 태그는 id, label, color를 가짐', () => {
      const tag: PredefinedTag = {
        id: 'good',
        label: '잘됨',
        color: 'bg-green-100 text-green-700 border-green-300',
      };

      expect(tag.id).toBe('good');
      expect(tag.label).toBe('잘됨');
      expect(tag.color).toContain('green');
    });
  });
});
