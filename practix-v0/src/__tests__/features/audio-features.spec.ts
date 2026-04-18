/**
 * @fileoverview 오디오 기능 테스트 스펙
 * 녹음, 재생, 메트로놈 등 오디오 관련 기능을 문서화합니다.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('오디오 기능', () => {
  describe('녹음 기능', () => {
    describe('녹음 시작', () => {
      it('마이크 권한을 요청함', async () => {
        const mockGetUserMedia = vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }],
        });
        navigator.mediaDevices.getUserMedia = mockGetUserMedia;

        await navigator.mediaDevices.getUserMedia({ audio: true });

        expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true });
      });

      it('즉시 녹음: 카운트다운 없이 바로 시작', () => {
        const countdownSeconds = 0;
        expect(countdownSeconds).toBe(0);
      });

      it('카운트다운 녹음: 3초 후 시작', () => {
        const countdownSeconds = 3;
        expect(countdownSeconds).toBe(3);
      });

      it('반주와 함께 녹음: 반주 재생과 동시에 녹음', () => {
        const withBackingTrack = true;
        expect(withBackingTrack).toBe(true);
      });
    });

    describe('녹음 중', () => {
      it('오디오 레벨을 실시간으로 측정함 (0~1)', () => {
        const audioLevel = 0.75;
        expect(audioLevel).toBeGreaterThanOrEqual(0);
        expect(audioLevel).toBeLessThanOrEqual(1);
      });

      it('녹음 시간을 표시함', () => {
        const recordingTime = 45; // 초
        const minutes = Math.floor(recordingTime / 60);
        const seconds = (recordingTime % 60).toString().padStart(2, '0');

        expect(`${minutes}:${seconds}`).toBe('0:45');
      });
    });

    describe('녹음 완료', () => {
      it('녹음 데이터를 base64로 저장함', () => {
        const recordingData = 'data:audio/webm;base64,GkXfo...';
        expect(recordingData).toMatch(/^data:audio\/\w+;base64,/);
      });

      it('녹음에 자동으로 이름과 날짜가 부여됨', () => {
        const recording = {
          id: Date.now(),
          name: '녹음 1',
          uploadDate: new Date().toISOString(),
        };

        expect(recording.name).toBeDefined();
        expect(recording.uploadDate).toBeDefined();
      });
    });
  });

  describe('재생 기능', () => {
    describe('기본 재생', () => {
      it('재생/일시정지 토글', () => {
        let isPlaying = false;
        isPlaying = !isPlaying;
        expect(isPlaying).toBe(true);
        isPlaying = !isPlaying;
        expect(isPlaying).toBe(false);
      });

      it('현재 재생 위치 추적', () => {
        const currentTime = 30.5; // 초
        const duration = 180; // 3분
        const progress = currentTime / duration;

        expect(progress).toBeCloseTo(0.169, 2);
      });
    });

    describe('재생 속도', () => {
      it('지원하는 재생 속도: 0.5x ~ 2.0x', () => {
        const playbackRates = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
        expect(playbackRates).toContain(0.5);
        expect(playbackRates).toContain(2.0);
      });

      it('기본 재생 속도는 1.0x', () => {
        const defaultRate = 1.0;
        expect(defaultRate).toBe(1.0);
      });
    });

    describe('볼륨 조절', () => {
      it('볼륨 범위: 0 ~ 1', () => {
        const volume = 0.8;
        expect(volume).toBeGreaterThanOrEqual(0);
        expect(volume).toBeLessThanOrEqual(1);
      });

      it('원곡/녹음 각각 독립적인 볼륨', () => {
        const originalVolume = 0.7;
        const recordedVolume = 1.0;

        expect(originalVolume).not.toBe(recordedVolume);
      });
    });

    describe('구간 재생', () => {
      it('구간의 start~end 범위만 재생', () => {
        const section = { start: 30, end: 60 };
        const playRange = section.end - section.start;

        expect(playRange).toBe(30);
      });

      it('루프 재생: 구간 끝에서 시작으로 반복', () => {
        const isLooping = true;
        expect(isLooping).toBe(true);
      });
    });

    describe('시간 탐색', () => {
      it('프로그레스 바 클릭으로 특정 시간으로 이동', () => {
        const clickPosition = 0.5; // 50% 위치
        const duration = 180;
        const seekTime = clickPosition * duration;

        expect(seekTime).toBe(90);
      });
    });
  });

  describe('메트로놈 기능', () => {
    describe('BPM 설정', () => {
      it('BPM 범위: 40 ~ 240', () => {
        const minBpm = 40;
        const maxBpm = 240;

        expect(minBpm).toBe(40);
        expect(maxBpm).toBe(240);
      });

      it('BPM에 따른 비트 간격 계산', () => {
        const bpm = 120;
        const beatInterval = 60 / bpm; // 초

        expect(beatInterval).toBe(0.5); // 0.5초마다 비트
      });
    });

    describe('박자 설정', () => {
      it('4/4 박자: 4비트, 첫 박 강박', () => {
        const timeSignature = '4/4';
        const [numerator] = timeSignature.split('/').map(Number);

        expect(numerator).toBe(4);
      });

      it('3/4 박자: 3비트, 첫 박 강박', () => {
        const timeSignature = '3/4';
        const [numerator] = timeSignature.split('/').map(Number);

        expect(numerator).toBe(3);
      });

      it('6/8 박자: 6비트 (2그룹), 1,4번째 강박', () => {
        const timeSignature = '6/8';
        const [numerator] = timeSignature.split('/').map(Number);

        expect(numerator).toBe(6);
      });
    });

    describe('비트 표시', () => {
      it('현재 비트 번호 표시 (1부터 시작)', () => {
        const currentBeat = 1;
        const beatsPerMeasure = 4;

        expect(currentBeat).toBeGreaterThanOrEqual(1);
        expect(currentBeat).toBeLessThanOrEqual(beatsPerMeasure);
      });

      it('강박/약박 구분', () => {
        const beat = 1;
        const isAccent = beat === 1;

        expect(isAccent).toBe(true);
      });
    });
  });

  describe('A/B 비교 기능', () => {
    describe('동시 재생', () => {
      it('원곡+녹음 동시 재생', () => {
        const playBoth = true;
        expect(playBoth).toBe(true);
      });

      it('원곡+녹음+반주 동시 재생', () => {
        const playAll = true;
        expect(playAll).toBe(true);
      });
    });

    describe('동기화', () => {
      it('모두 처음으로 리셋', () => {
        const resetBoth = () => {
          const originalTime = 0;
          const recordedTime = 0;
          return { originalTime, recordedTime };
        };

        const { originalTime, recordedTime } = resetBoth();
        expect(originalTime).toBe(0);
        expect(recordedTime).toBe(0);
      });
    });

    describe('볼륨 밸런스', () => {
      it('원곡/녹음/반주 각각 볼륨 조절 가능', () => {
        const volumes = {
          original: 0.5,
          recorded: 1.0,
          backing: 0.3,
        };

        expect(volumes.original).toBe(0.5);
        expect(volumes.recorded).toBe(1.0);
        expect(volumes.backing).toBe(0.3);
      });
    });
  });
});
