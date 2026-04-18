/**
 * BPM 자동 감지 + 첫 박자 위치 감지
 *
 * 원리:
 * 1. 오디오를 다운샘플링하여 에너지 엔벨로프 계산
 * 2. Onset 함수 (에너지 변화량) 추출
 * 3. Onset의 자기상관(autocorrelation)으로 주기성 탐지 → BPM
 * 4. 첫 번째 유의미한 onset 위치 → 첫 박자 시간
 */

export interface BpmDetectionResult {
  bpm: number;
  firstBeatTime: number; // 초 단위
  confidence: number;    // 0~1
}

export function detectBpm(audioBuffer: AudioBuffer): BpmDetectionResult {
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;

  // 다운샘플링 (~22050Hz 타겟)
  const downsampleFactor = Math.max(1, Math.floor(sampleRate / 22050));
  const dsLength = Math.floor(channelData.length / downsampleFactor);
  const downsampled = new Float32Array(dsLength);
  for (let i = 0; i < dsLength; i++) {
    downsampled[i] = channelData[i * downsampleFactor];
  }
  const effectiveSr = sampleRate / downsampleFactor;

  // 프레임 기반 에너지 계산
  const frameSize = 1024;
  const hopSize = 512;
  const numFrames = Math.floor((dsLength - frameSize) / hopSize);

  if (numFrames < 20) {
    return { bpm: 120, firstBeatTime: 0, confidence: 0 };
  }

  const energy = new Float32Array(numFrames);
  for (let i = 0; i < numFrames; i++) {
    let sum = 0;
    const start = i * hopSize;
    for (let j = 0; j < frameSize; j++) {
      const val = downsampled[start + j];
      sum += val * val;
    }
    energy[i] = sum / frameSize;
  }

  // Onset 함수: 에너지 증가분 (half-wave rectified)
  const onset = new Float32Array(numFrames);
  let maxOnset = 0;
  for (let i = 1; i < numFrames; i++) {
    onset[i] = Math.max(0, energy[i] - energy[i - 1]);
    if (onset[i] > maxOnset) maxOnset = onset[i];
  }

  // 정규화
  if (maxOnset > 0) {
    for (let i = 0; i < numFrames; i++) {
      onset[i] /= maxOnset;
    }
  }

  // 자기상관 (BPM 40~240 범위)
  const minBpm = 40;
  const maxBpm = 240;
  const minLag = Math.floor((60 / maxBpm) * effectiveSr / hopSize);
  const maxLag = Math.min(
    Math.ceil((60 / minBpm) * effectiveSr / hopSize),
    numFrames - 1,
  );

  let bestLag = minLag;
  let bestVal = -1;

  for (let lag = minLag; lag <= maxLag; lag++) {
    let sum = 0;
    const count = numFrames - lag;
    for (let i = 0; i < count; i++) {
      sum += onset[i] * onset[i + lag];
    }
    const val = sum / count;
    if (val > bestVal) {
      bestVal = val;
      bestLag = lag;
    }
  }

  // Lag → BPM 변환
  const secondsPerBeat = (bestLag * hopSize) / effectiveSr;
  let detectedBpm = 60 / secondsPerBeat;

  // BPM을 60~180 범위로 정규화 (배수/약수 조정)
  while (detectedBpm < 60) detectedBpm *= 2;
  while (detectedBpm > 180) detectedBpm /= 2;
  detectedBpm = Math.round(detectedBpm);
  detectedBpm = Math.max(40, Math.min(240, detectedBpm));

  // 첫 박자 감지: 에너지가 처음 유의미하게 증가하는 지점
  const onsetThreshold = 0.1;
  let firstBeatFrame = 0;
  for (let i = 0; i < numFrames; i++) {
    if (onset[i] > onsetThreshold) {
      firstBeatFrame = i;
      break;
    }
  }
  const firstBeatTime = (firstBeatFrame * hopSize) / effectiveSr;

  // 신뢰도
  const confidence = Math.min(1, bestVal * 10);

  return { bpm: detectedBpm, firstBeatTime, confidence };
}

/**
 * 오디오에서 onset(음 시작) 위치들을 추출
 * 에너지 envelope + onset 함수를 함께 반환 (시각화용)
 */
export interface OnsetData {
  onsets: number[];           // onset 시간 배열 (초)
  envelope: Float32Array;     // 에너지 엔벨로프 (정규화)
  onsetFunction: Float32Array; // onset 함수 (정규화)
  timePerFrame: number;       // 프레임당 시간 (초)
  totalFrames: number;
}

export function extractOnsets(audioBuffer: AudioBuffer, maxDuration: number = 10): OnsetData {
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;

  // 분석할 샘플 수 제한
  const maxSamples = Math.min(channelData.length, Math.floor(sampleRate * maxDuration));

  // 다운샘플링
  const downsampleFactor = Math.max(1, Math.floor(sampleRate / 22050));
  const dsLength = Math.floor(maxSamples / downsampleFactor);
  const downsampled = new Float32Array(dsLength);
  for (let i = 0; i < dsLength; i++) {
    downsampled[i] = channelData[i * downsampleFactor];
  }
  const effectiveSr = sampleRate / downsampleFactor;

  const frameSize = 1024;
  const hopSize = 512;
  const numFrames = Math.floor((dsLength - frameSize) / hopSize);
  const timePerFrame = hopSize / effectiveSr;

  if (numFrames < 5) {
    return { onsets: [], envelope: new Float32Array(0), onsetFunction: new Float32Array(0), timePerFrame, totalFrames: 0 };
  }

  // 에너지 계산
  const energy = new Float32Array(numFrames);
  let maxEnergy = 0;
  for (let i = 0; i < numFrames; i++) {
    let sum = 0;
    const start = i * hopSize;
    for (let j = 0; j < frameSize; j++) {
      const val = downsampled[start + j];
      sum += val * val;
    }
    energy[i] = sum / frameSize;
    if (energy[i] > maxEnergy) maxEnergy = energy[i];
  }

  // 에너지 정규화
  const envelope = new Float32Array(numFrames);
  if (maxEnergy > 0) {
    for (let i = 0; i < numFrames; i++) {
      envelope[i] = energy[i] / maxEnergy;
    }
  }

  // Onset 함수
  const onsetFunction = new Float32Array(numFrames);
  let maxOnset = 0;
  for (let i = 1; i < numFrames; i++) {
    onsetFunction[i] = Math.max(0, energy[i] - energy[i - 1]);
    if (onsetFunction[i] > maxOnset) maxOnset = onsetFunction[i];
  }
  if (maxOnset > 0) {
    for (let i = 0; i < numFrames; i++) {
      onsetFunction[i] /= maxOnset;
    }
  }

  // Peak picking: 로컬 최대값 + 임계값 이상인 onset만 선택
  const threshold = 0.08;
  const minGapFrames = Math.floor(0.1 / timePerFrame); // 최소 100ms 간격
  const onsets: number[] = [];
  let lastOnsetFrame = -minGapFrames;

  for (let i = 1; i < numFrames - 1; i++) {
    if (
      onsetFunction[i] > threshold &&
      onsetFunction[i] >= onsetFunction[i - 1] &&
      onsetFunction[i] >= onsetFunction[i + 1] &&
      (i - lastOnsetFrame) >= minGapFrames
    ) {
      onsets.push(i * timePerFrame);
      lastOnsetFrame = i;
    }
  }

  return { onsets, envelope, onsetFunction, timePerFrame, totalFrames: numFrames };
}

/**
 * 재생 위치에 맞는 메트로놈 시작 딜레이 계산
 *
 * @param playPosition - 오디오 재생 시작 위치 (초)
 * @param firstBeatTime - 첫 박자 위치 (초)
 * @param bpm - BPM
 * @returns 메트로놈 첫 클릭까지의 딜레이 (초)
 */
export function calculateMetronomeDelay(
  playPosition: number,
  firstBeatTime: number,
  bpm: number,
): number {
  const beatInterval = 60 / bpm;

  if (playPosition <= firstBeatTime) {
    return firstBeatTime - playPosition;
  }

  // 현재 위치가 첫 박 이후인 경우 → 다음 박까지 딜레이
  const timeSinceFirst = playPosition - firstBeatTime;
  const remainder = timeSinceFirst % beatInterval;
  if (remainder < 0.005) return 0; // 거의 박 위에 있으면 즉시
  return beatInterval - remainder;
}
