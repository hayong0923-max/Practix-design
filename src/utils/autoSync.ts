/**
 * Auto-sync: FFT-based cross-correlation to find optimal offset between original and recording.
 * Searches within ±maxLagSeconds for the lag that maximizes correlation.
 */

// Next power of 2
function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

// In-place Cooley-Tukey FFT (radix-2)
function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  // Bit-reversal permutation
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    while (j & bit) {
      j ^= bit;
      bit >>= 1;
    }
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  // FFT butterflies
  for (let len = 2; len <= n; len <<= 1) {
    const half = len >> 1;
    const angle = -2 * Math.PI / len;
    const wRe = Math.cos(angle);
    const wIm = Math.sin(angle);
    for (let i = 0; i < n; i += len) {
      let curRe = 1, curIm = 0;
      for (let j = 0; j < half; j++) {
        const a = i + j;
        const b = a + half;
        const tRe = curRe * re[b] - curIm * im[b];
        const tIm = curRe * im[b] + curIm * re[b];
        re[b] = re[a] - tRe;
        im[b] = im[a] - tIm;
        re[a] += tRe;
        im[a] += tIm;
        const nextRe = curRe * wRe - curIm * wIm;
        curIm = curRe * wIm + curIm * wRe;
        curRe = nextRe;
      }
    }
  }
}

// Inverse FFT
function ifft(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  // Conjugate
  for (let i = 0; i < n; i++) im[i] = -im[i];
  fft(re, im);
  // Conjugate and scale
  for (let i = 0; i < n; i++) {
    re[i] /= n;
    im[i] = -im[i] / n;
  }
}

// Extract mono channel data from AudioBuffer, downsampled to targetRate
function getMonoData(buffer: AudioBuffer, startSec: number, endSec: number, targetRate: number): Float32Array {
  const sr = buffer.sampleRate;
  const startSample = Math.floor(startSec * sr);
  const endSample = Math.min(Math.ceil(endSec * sr), buffer.length);
  const numSamples = endSample - startSample;

  // Get mono mix
  const mono = new Float32Array(numSamples);
  const channels = buffer.numberOfChannels;
  for (let ch = 0; ch < channels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < numSamples; i++) {
      mono[i] += data[startSample + i];
    }
  }
  if (channels > 1) {
    for (let i = 0; i < numSamples; i++) mono[i] /= channels;
  }

  // Downsample if needed
  if (sr === targetRate) return mono;
  const ratio = sr / targetRate;
  const outLen = Math.floor(numSamples / ratio);
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const srcIdx = Math.floor(i * ratio);
    out[i] = mono[Math.min(srcIdx, numSamples - 1)];
  }
  return out;
}

export interface AutoSyncResult {
  offsetSeconds: number; // Positive = recording starts later than original
  confidence: number;    // 0-1, how confident the match is
}

/**
 * Compute the optimal sync offset between original section and recording.
 * Uses FFT-based cross-correlation, searching within ±maxLagSeconds.
 *
 * @param originalBuffer  Full original audio buffer
 * @param recordedBuffer  Recording audio buffer
 * @param sectionStart    Section start time in seconds (in original)
 * @param sectionEnd      Section end time in seconds (in original)
 * @param maxLagSeconds   Max search range (default ±2s)
 * @returns The optimal offset in seconds and a confidence score
 */
export function computeAutoSync(
  originalBuffer: AudioBuffer,
  recordedBuffer: AudioBuffer,
  sectionStart: number,
  sectionEnd: number,
  maxLagSeconds = 2,
): AutoSyncResult {
  // Use 8kHz for fast computation (enough for rhythmic correlation)
  const ANALYSIS_RATE = 8000;

  // Extract section from original
  const origData = getMonoData(originalBuffer, sectionStart, sectionEnd, ANALYSIS_RATE);

  // Extract recording (use full recording, or limit to section duration + 2*maxLag)
  const recDuration = recordedBuffer.duration;
  const maxRecEnd = Math.min(recDuration, (sectionEnd - sectionStart) + maxLagSeconds * 2);
  const recData = getMonoData(recordedBuffer, 0, maxRecEnd, ANALYSIS_RATE);

  const maxLagSamples = Math.ceil(maxLagSeconds * ANALYSIS_RATE);
  const n = nextPow2(origData.length + recData.length - 1);

  // Zero-pad and copy into FFT arrays
  const aRe = new Float64Array(n);
  const aIm = new Float64Array(n);
  const bRe = new Float64Array(n);
  const bIm = new Float64Array(n);

  for (let i = 0; i < origData.length; i++) aRe[i] = origData[i];
  for (let i = 0; i < recData.length; i++) bRe[i] = recData[i];

  // FFT both
  fft(aRe, aIm);
  fft(bRe, bIm);

  // Multiply A * conj(B) → cross-correlation in frequency domain
  const cRe = new Float64Array(n);
  const cIm = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    cRe[i] = aRe[i] * bRe[i] + aIm[i] * bIm[i]; // re(A) * re(B) + im(A) * im(B)
    cIm[i] = aIm[i] * bRe[i] - aRe[i] * bIm[i]; // im(A) * re(B) - re(A) * im(B)
  }

  // IFFT to get cross-correlation
  ifft(cRe, cIm);

  // Search for peak within ±maxLagSamples
  // Positive lag: correlation[lag] means recording is shifted by +lag samples
  // Negative lag: correlation[n - lag] for lag > 0
  let bestLag = 0;
  let bestVal = -Infinity;

  // Positive lags (0 to maxLagSamples)
  for (let lag = 0; lag <= maxLagSamples && lag < n; lag++) {
    if (cRe[lag] > bestVal) {
      bestVal = cRe[lag];
      bestLag = lag;
    }
  }

  // Negative lags (n - maxLagSamples to n - 1)
  for (let lag = 1; lag <= maxLagSamples; lag++) {
    const idx = n - lag;
    if (idx >= 0 && cRe[idx] > bestVal) {
      bestVal = cRe[idx];
      bestLag = -lag;
    }
  }

  // Compute confidence: ratio of peak to RMS of correlation
  let sumSq = 0;
  for (let i = 0; i < n; i++) sumSq += cRe[i] * cRe[i];
  const rms = Math.sqrt(sumSq / n);
  const confidence = rms > 0 ? Math.min(1, bestVal / (rms * 10)) : 0;

  const offsetSeconds = bestLag / ANALYSIS_RATE;

  return { offsetSeconds, confidence };
}
