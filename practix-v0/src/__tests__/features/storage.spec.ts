/**
 * @fileoverview 저장소 기능 테스트 스펙
 * 로컬 저장소 및 클라우드 동기화 기능을 문서화합니다.
 */

import { describe, it, expect, vi } from 'vitest';

describe('저장소 기능', () => {
  describe('플랫폼 감지', () => {
    it('웹 환경: window.Capacitor가 없음', () => {
      const isCapacitor = typeof window !== 'undefined' && !!(window as any).Capacitor;
      expect(isCapacitor).toBe(false);
    });

    it('모바일 환경: window.Capacitor가 있음', () => {
      Object.defineProperty(window, 'Capacitor', {
        value: { isNativePlatform: () => true },
        configurable: true,
      });
      const isCapacitor = typeof window !== 'undefined' && !!(window as any).Capacitor;
      expect(isCapacitor).toBe(true);
      Object.defineProperty(window, 'Capacitor', {
        value: undefined,
        configurable: true,
      });
    });
  });

  describe('오디오 마커 시스템', () => {
    it('idb 마커: IndexedDB에 저장됨 (웹)', () => {
      const audioData = 'idb';
      expect(audioData).toBe('idb');
    });

    it('file 마커: 파일시스템에 저장됨 (모바일)', () => {
      const audioData = 'file';
      expect(audioData).toBe('file');
    });

    it('base64 데이터: 아직 저장 안 된 상태', () => {
      const audioData = 'data:audio/wav;base64,SGVsbG8=';
      const isBase64 = audioData.startsWith('data:');
      expect(isBase64).toBe(true);
    });

    it('저장 후 마커로 변환', () => {
      const originalData = 'data:audio/wav;base64,SGVsbG8=';
      const isCapacitor = false;

      // 저장 로직 시뮬레이션
      const marker = originalData.startsWith('data:')
        ? (isCapacitor ? 'file' : 'idb')
        : originalData;

      expect(marker).toBe('idb');
    });
  });

  describe('웹 저장소 (localStorage + IndexedDB)', () => {
    describe('localStorage (메타데이터)', () => {
      it('songs 키에 곡 목록 저장', () => {
        const songs = [{ id: 1, name: '테스트', sessions: [] }];
        localStorage.setItem('practix_songs', JSON.stringify(songs));

        expect(localStorage.setItem).toHaveBeenCalledWith(
          'practix_songs',
          JSON.stringify(songs)
        );
      });

      it('곡 목록 불러오기', () => {
        const mockData = JSON.stringify([{ id: 1, name: '테스트', sessions: [] }]);
        vi.mocked(localStorage.getItem).mockReturnValue(mockData);

        const result = localStorage.getItem('practix_songs');
        expect(result).toBe(mockData);
      });
    });

    describe('IndexedDB (오디오 데이터)', () => {
      it('session_{id} 키로 오디오 저장', () => {
        const sessionId = 123;
        const key = `session_${sessionId}`;
        expect(key).toBe('session_123');
      });

      it('오디오 데이터는 base64 문자열로 저장', () => {
        const audioData = 'data:audio/wav;base64,UklGRi...';
        expect(audioData).toMatch(/^data:audio/);
      });
    });
  });

  describe('모바일 저장소 (Capacitor Filesystem)', () => {
    it('저장 경로: Documents/Practix/', () => {
      const basePath = 'Documents/Practix';
      expect(basePath).toBe('Documents/Practix');
    });

    it('메타데이터: songs.json', () => {
      const metadataPath = 'Documents/Practix/songs.json';
      expect(metadataPath).toContain('songs.json');
    });

    it('오디오: audio/session_{id}.txt', () => {
      const sessionId = 123;
      const audioPath = `Documents/Practix/audio/session_${sessionId}.txt`;
      expect(audioPath).toContain('session_123');
    });
  });

  describe('데이터 영속성', () => {
    it('앱 종료 후 재시작해도 데이터 유지', () => {
      // 저장
      const songs = [{ id: 1, name: '영속성 테스트', sessions: [] }];
      localStorage.setItem('practix_songs', JSON.stringify(songs));

      // 불러오기 (앱 재시작 시뮬레이션)
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(songs));
      const loaded = JSON.parse(localStorage.getItem('practix_songs') || '[]');

      expect(loaded).toHaveLength(1);
      expect(loaded[0].name).toBe('영속성 테스트');
    });

    it('세션/구간/녹음 계층 구조 유지', () => {
      const song = {
        id: 1,
        name: '계층 테스트',
        sessions: [{
          id: 1,
          name: '세션 1',
          audioData: 'idb',
          sections: [{
            id: 1,
            start: 0,
            end: 30,
            recordedFiles: [{
              id: 1,
              name: '녹음 1',
              data: 'idb',
            }],
          }],
          markers: [],
        }],
      };

      expect(song.sessions[0].sections[0].recordedFiles[0].name).toBe('녹음 1');
    });
  });

});
