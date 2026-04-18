/**
 * 오디오 관련 유틸리티 함수들
 * 중복되는 오디오 디코딩 로직을 한 곳에서 관리합니다.
 */

/**
 * base64 또는 URL 문자열에서 AudioBuffer로 디코딩
 * @param audioContext - Web Audio API AudioContext
 * @param dataUrl - base64 데이터 URL 또는 일반 URL
 * @returns 디코딩된 AudioBuffer
 */
export async function decodeAudioFromUrl(
  audioContext: AudioContext,
  dataUrl: string
): Promise<AudioBuffer> {
  const response = await fetch(dataUrl);
  const arrayBuffer = await response.arrayBuffer();
  return audioContext.decodeAudioData(arrayBuffer);
}

/**
 * File 객체에서 AudioBuffer로 디코딩
 * @param audioContext - Web Audio API AudioContext
 * @param file - 오디오 File 객체
 * @returns 디코딩된 AudioBuffer
 */
export async function decodeAudioFromFile(
  audioContext: AudioContext,
  file: File
): Promise<AudioBuffer> {
  const arrayBuffer = await file.arrayBuffer();
  return audioContext.decodeAudioData(arrayBuffer);
}

/**
 * File을 base64 데이터 URL로 변환
 * @param file - 변환할 File 객체
 * @returns base64 데이터 URL
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * AudioBufferSourceNode 생성 헬퍼
 * @param audioContext - Web Audio API AudioContext
 * @param buffer - 재생할 AudioBuffer
 * @param options - 옵션 (playbackRate, loop 등)
 * @returns 설정된 AudioBufferSourceNode
 */
export function createAudioSource(
  audioContext: AudioContext,
  buffer: AudioBuffer,
  options?: {
    playbackRate?: number;
    loop?: boolean;
    onEnded?: () => void;
  }
): AudioBufferSourceNode {
  const source = audioContext.createBufferSource();
  source.buffer = buffer;

  if (options?.playbackRate !== undefined) {
    source.playbackRate.value = options.playbackRate;
  }
  if (options?.loop !== undefined) {
    source.loop = options.loop;
  }
  if (options?.onEnded) {
    source.onended = options.onEnded;
  }

  return source;
}

/**
 * AudioBuffer에서 파형 데이터 생성
 * @param buffer - AudioBuffer
 * @param samples - 샘플 수 (기본 1000)
 * @returns 정규화된 파형 데이터 배열
 */
export function generateWaveformFromBuffer(
  buffer: AudioBuffer,
  samples: number = 1000
): number[] {
  const rawData = buffer.getChannelData(0);
  const blockSize = Math.floor(rawData.length / samples);
  const waveform: number[] = [];

  for (let i = 0; i < samples; i++) {
    const start = blockSize * i;
    let sum = 0;
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(rawData[start + j] || 0);
    }
    waveform.push(sum / blockSize);
  }

  // 정규화
  const max = Math.max(...waveform);
  return max > 0 ? waveform.map((v) => v / max) : waveform;
}
