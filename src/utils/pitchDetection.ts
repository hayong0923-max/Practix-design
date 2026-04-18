/**
 * Pitch Detection Utility using YIN Algorithm
 * Optimized for monophonic instruments (flute, daegeum, etc.)
 */

export interface PitchData {
  time: number;      // Time in seconds
  frequency: number; // Detected frequency in Hz (0 if no pitch detected)
  confidence: number; // Detection confidence (0-1)
  note?: string;     // Musical note name (e.g., "A4", "C#5")
  cents?: number;    // Cents deviation from nearest note
}

export interface PitchAnalysisResult {
  pitchData: PitchData[];
  duration: number;
  sampleRate: number;
  minFreq: number;
  maxFreq: number;
}

// Note names for conversion
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Convert frequency to musical note
 */
export function frequencyToNote(frequency: number): { note: string; cents: number } {
  if (frequency <= 0) return { note: '', cents: 0 };

  // A4 = 440Hz, MIDI note 69
  const midiNote = 12 * Math.log2(frequency / 440) + 69;
  const roundedMidi = Math.round(midiNote);
  const cents = Math.round((midiNote - roundedMidi) * 100);

  const octave = Math.floor(roundedMidi / 12) - 1;
  const noteIndex = roundedMidi % 12;
  const note = `${NOTE_NAMES[noteIndex]}${octave}`;

  return { note, cents };
}

/**
 * Convert MIDI note number to frequency
 */
export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * YIN Algorithm for pitch detection
 * Based on: "YIN, a fundamental frequency estimator for speech and music"
 */
function yinPitchDetection(
  buffer: Float32Array,
  sampleRate: number,
  threshold: number = 0.1
): { frequency: number; confidence: number } {
  const bufferSize = buffer.length;
  const halfBuffer = Math.floor(bufferSize / 2);

  // Step 1: Autocorrelation (difference function)
  const yinBuffer = new Float32Array(halfBuffer);

  for (let tau = 0; tau < halfBuffer; tau++) {
    let sum = 0;
    for (let i = 0; i < halfBuffer; i++) {
      const delta = buffer[i] - buffer[i + tau];
      sum += delta * delta;
    }
    yinBuffer[tau] = sum;
  }

  // Step 2: Cumulative mean normalized difference
  yinBuffer[0] = 1;
  let runningSum = 0;

  for (let tau = 1; tau < halfBuffer; tau++) {
    runningSum += yinBuffer[tau];
    yinBuffer[tau] = yinBuffer[tau] * tau / runningSum;
  }

  // Step 3: Absolute threshold
  let tauEstimate = -1;
  for (let tau = 2; tau < halfBuffer; tau++) {
    if (yinBuffer[tau] < threshold) {
      while (tau + 1 < halfBuffer && yinBuffer[tau + 1] < yinBuffer[tau]) {
        tau++;
      }
      tauEstimate = tau;
      break;
    }
  }

  // No pitch found
  if (tauEstimate === -1) {
    return { frequency: 0, confidence: 0 };
  }

  // Step 4: Parabolic interpolation for better accuracy
  let betterTau: number;
  const x0 = tauEstimate < 1 ? tauEstimate : tauEstimate - 1;
  const x2 = tauEstimate + 1 < halfBuffer ? tauEstimate + 1 : tauEstimate;

  if (x0 === tauEstimate) {
    betterTau = yinBuffer[tauEstimate] <= yinBuffer[x2] ? tauEstimate : x2;
  } else if (x2 === tauEstimate) {
    betterTau = yinBuffer[tauEstimate] <= yinBuffer[x0] ? tauEstimate : x0;
  } else {
    const s0 = yinBuffer[x0];
    const s1 = yinBuffer[tauEstimate];
    const s2 = yinBuffer[x2];
    betterTau = tauEstimate + (s2 - s0) / (2 * (2 * s1 - s2 - s0));
  }

  const frequency = sampleRate / betterTau;
  const confidence = 1 - yinBuffer[tauEstimate];

  return { frequency, confidence };
}

/**
 * Analyze an AudioBuffer and extract pitch data over time
 */
export async function analyzePitch(
  audioBuffer: AudioBuffer,
  options: {
    windowSize?: number;      // Analysis window size in samples (default: 2048)
    hopSize?: number;         // Hop size between windows (default: 512)
    minFreq?: number;         // Minimum frequency to detect (default: 80Hz)
    maxFreq?: number;         // Maximum frequency to detect (default: 2000Hz)
    confidenceThreshold?: number; // Minimum confidence to report (default: 0.7)
  } = {}
): Promise<PitchAnalysisResult> {
  const {
    windowSize = 2048,
    hopSize = 512,
    minFreq = 80,
    maxFreq = 2000,
    confidenceThreshold = 0.7,
  } = options;

  const sampleRate = audioBuffer.sampleRate;
  const channelData = audioBuffer.getChannelData(0); // Use first channel
  const duration = audioBuffer.duration;

  const pitchData: PitchData[] = [];
  let detectedMinFreq = Infinity;
  let detectedMaxFreq = 0;

  // Process in windows
  for (let i = 0; i + windowSize < channelData.length; i += hopSize) {
    const window = channelData.slice(i, i + windowSize);
    const time = i / sampleRate;

    const { frequency, confidence } = yinPitchDetection(window, sampleRate);

    // Filter by frequency range and confidence
    if (
      frequency >= minFreq &&
      frequency <= maxFreq &&
      confidence >= confidenceThreshold
    ) {
      const { note, cents } = frequencyToNote(frequency);

      pitchData.push({
        time,
        frequency,
        confidence,
        note,
        cents,
      });

      if (frequency < detectedMinFreq) detectedMinFreq = frequency;
      if (frequency > detectedMaxFreq) detectedMaxFreq = frequency;
    } else {
      // No reliable pitch detected at this point
      pitchData.push({
        time,
        frequency: 0,
        confidence: 0,
      });
    }
  }

  return {
    pitchData,
    duration,
    sampleRate,
    minFreq: detectedMinFreq === Infinity ? 0 : detectedMinFreq,
    maxFreq: detectedMaxFreq === 0 ? 0 : detectedMaxFreq,
  };
}

/**
 * Compare two pitch analysis results and calculate similarity
 */
export function comparePitchData(
  original: PitchAnalysisResult,
  recording: PitchAnalysisResult,
  toleranceCents: number = 50 // How many cents off is acceptable
): {
  matchPercentage: number;
  deviations: { time: number; centsDiff: number }[];
} {
  const deviations: { time: number; centsDiff: number }[] = [];
  let matchCount = 0;
  let totalComparisons = 0;

  // Align by time
  for (const origPoint of original.pitchData) {
    if (origPoint.frequency === 0) continue;

    // Find closest recording point by time
    const recPoint = recording.pitchData.reduce((closest, point) => {
      if (Math.abs(point.time - origPoint.time) < Math.abs(closest.time - origPoint.time)) {
        return point;
      }
      return closest;
    }, recording.pitchData[0]);

    if (!recPoint || recPoint.frequency === 0) continue;

    // Calculate cents difference
    const centsDiff = 1200 * Math.log2(recPoint.frequency / origPoint.frequency);

    deviations.push({
      time: origPoint.time,
      centsDiff,
    });

    totalComparisons++;
    if (Math.abs(centsDiff) <= toleranceCents) {
      matchCount++;
    }
  }

  const matchPercentage = totalComparisons > 0
    ? (matchCount / totalComparisons) * 100
    : 0;

  return { matchPercentage, deviations };
}
