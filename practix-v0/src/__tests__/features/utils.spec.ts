/**
 * @fileoverview 유틸리티 함수 테스트
 */

import { describe, it, expect } from 'vitest';
import { formatTime } from '@/utils/formatTime';

describe('유틸리티 함수', () => {
  describe('formatTime', () => {
    it('0초를 "0:00"으로 포맷함', () => {
      expect(formatTime(0)).toBe('0:00');
    });

    it('30초를 "0:30"으로 포맷함', () => {
      expect(formatTime(30)).toBe('0:30');
    });

    it('60초를 "1:00"으로 포맷함', () => {
      expect(formatTime(60)).toBe('1:00');
    });

    it('90초를 "1:30"으로 포맷함', () => {
      expect(formatTime(90)).toBe('1:30');
    });

    it('125초를 "2:05"으로 포맷함 (한 자리 초는 0 패딩)', () => {
      expect(formatTime(125)).toBe('2:05');
    });

    it('소수점 시간을 정수로 처리함', () => {
      expect(formatTime(30.7)).toBe('0:30');
    });

    it('10분 이상도 처리함', () => {
      expect(formatTime(600)).toBe('10:00');
      expect(formatTime(3661)).toBe('61:01'); // 1시간 1분 1초
    });
  });
});

describe('시간 계산', () => {
  describe('구간 길이 계산', () => {
    it('구간 길이 = end - start', () => {
      const start = 10;
      const end = 40;
      const duration = end - start;
      expect(duration).toBe(30);
    });

    it('분/초 표시 로직', () => {
      const duration = 95; // 1분 35초

      const minutes = Math.floor(duration / 60);
      const seconds = Math.round(duration % 60);

      expect(minutes).toBe(1);
      expect(seconds).toBe(35);
    });

    it('60초 미만은 초만 표시', () => {
      const duration = 45;
      const display = duration < 60
        ? `${Math.round(duration)}초`
        : `${Math.floor(duration / 60)}분 ${Math.round(duration % 60)}초`;

      expect(display).toBe('45초');
    });

    it('60초 이상은 분+초 표시', () => {
      const duration = 95;
      const display = duration < 60
        ? `${Math.round(duration)}초`
        : `${Math.floor(duration / 60)}분 ${Math.round(duration % 60)}초`;

      expect(display).toBe('1분 35초');
    });
  });
});
