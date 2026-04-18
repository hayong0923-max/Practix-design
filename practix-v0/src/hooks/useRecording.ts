'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export interface RecordingResult {
  base64: string;  // data URL for file saving
  blob: Blob;      // raw blob for efficient decoding
  mimeType: string;
}

interface UseRecordingReturn {
  isRecording: boolean;
  isCountingDown: boolean;
  countdown: number;
  recordingTime: number;
  audioLevel: number;
  startRecording: (countdownSeconds?: number) => Promise<boolean>;
  stopRecording: () => Promise<RecordingResult | null>;
  cancelCountdown: () => void;
  error: string | null;
}

export function useRecording(inputDeviceId?: string): UseRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef<string>('audio/webm'); // Store selected MIME type
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const pendingRecordingRef = useRef<(() => void) | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current || !isRecording) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average level
    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    const normalizedLevel = average / 255;

    setAudioLevel(normalizedLevel);

    if (isRecording) {
      animationRef.current = requestAnimationFrame(updateAudioLevel);
    }
  }, [isRecording]);

  // Internal function to actually start recording
  const beginRecording = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      chunksRef.current = [];

      // Check if required APIs are available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('이 기기에서 녹음이 지원되지 않습니다.');
        return false;
      }
      if (typeof MediaRecorder === 'undefined') {
        setError('이 기기에서 MediaRecorder가 지원되지 않습니다.');
        return false;
      }

      // Request microphone permission
      // Use 'ideal' constraints for better mobile compatibility
      // Some Android WebViews don't support strict sampleRate constraint
      const audioConstraints: MediaTrackConstraints = {
        echoCancellation: { ideal: false },
        noiseSuppression: { ideal: false },
        autoGainControl: { ideal: false },
        sampleRate: { ideal: 48000 },
      };
      // Use selected input device if specified (ideal instead of exact for BT fallback)
      if (inputDeviceId && inputDeviceId !== 'default') {
        audioConstraints.deviceId = { ideal: inputDeviceId };
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
      });

      streamRef.current = stream;

      // Create AudioContext and Analyser for visualization
      // Don't force sampleRate - let it use default for better compatibility
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      // Create MediaRecorder - prefer m4a/aac for better compatibility with other apps
      // Priority: mp4 (aac) > webm (opus) > default
      const getMimeType = (): string => {
        // Try mp4/aac first (native Android format, compatible with Samsung recorder etc.)
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          return 'audio/mp4';
        }
        if (MediaRecorder.isTypeSupported('audio/aac')) {
          return 'audio/aac';
        }
        if (MediaRecorder.isTypeSupported('audio/mp4;codecs=aac')) {
          return 'audio/mp4;codecs=aac';
        }
        // Fallback to webm
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          return 'audio/webm;codecs=opus';
        }
        return 'audio/webm';
      };

      const selectedMimeType = getMimeType();
      mimeTypeRef.current = selectedMimeType; // Store for later use
      console.log('Recording with mimeType:', selectedMimeType);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType,
        // Let browser choose optimal bitrate - forcing it can cause issues on some devices
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Don't use timeslice (100ms) - it causes crackling at chunk boundaries
      // Instead, collect all data at once when stopping
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      // Start audio level animation (throttled to reduce CPU usage)
      let lastUpdate = 0;
      animationRef.current = requestAnimationFrame(function updateLevel(timestamp) {
        if (!analyserRef.current) return;

        // Throttle updates to ~30fps to reduce CPU load
        if (timestamp - lastUpdate >= 33) {
          lastUpdate = timestamp;
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);

          const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          const normalizedLevel = average / 255;
          setAudioLevel(normalizedLevel);
        }

        animationRef.current = requestAnimationFrame(updateLevel);
      });

      console.log('Recording started successfully');
      return true;
    } catch (err) {
      console.error('Recording error:', err);
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          setError('마이크 권한이 거부되었습니다. 앱 설정에서 마이크 권한을 허용해주세요.');
        } else if (err.name === 'NotFoundError') {
          setError('마이크를 찾을 수 없습니다. 마이크가 연결되어 있는지 확인해주세요.');
        } else if (err.name === 'NotSupportedError') {
          setError('이 기기에서 녹음이 지원되지 않습니다.');
        } else if (err.name === 'NotReadableError') {
          setError('마이크에 접근할 수 없습니다. 다른 앱이 마이크를 사용 중인지 확인해주세요.');
        } else {
          setError(`녹음 오류: ${err.name}`);
        }
      } else if (err instanceof Error) {
        setError(`녹음 오류: ${err.message}`);
      } else {
        setError('녹음을 시작할 수 없습니다.');
      }
      return false;
    }
  }, []);

  // Start recording with optional countdown
  const startRecording = useCallback(async (countdownSeconds: number = 0): Promise<boolean> => {
    if (countdownSeconds <= 0) {
      return beginRecording();
    }

    // Start countdown
    setIsCountingDown(true);
    setCountdown(countdownSeconds);

    return new Promise((resolve) => {
      let remaining = countdownSeconds;

      countdownTimerRef.current = setInterval(async () => {
        remaining -= 1;
        setCountdown(remaining);

        if (remaining <= 0) {
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
          setIsCountingDown(false);
          const success = await beginRecording();
          resolve(success);
        }
      }, 1000);
    });
  }, [beginRecording]);

  // Cancel countdown
  const cancelCountdown = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setIsCountingDown(false);
    setCountdown(0);
  }, []);

  const stopRecording = useCallback(async (): Promise<RecordingResult | null> => {
    return new Promise((resolve) => {
      // Stop animation
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }

      if (!mediaRecorderRef.current || !isRecording) {
        resolve(null);
        return;
      }

      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const mediaRecorder = mediaRecorderRef.current;

      mediaRecorder.onstop = () => {
        const mimeType = mimeTypeRef.current;
        const blob = new Blob(chunksRef.current, { type: mimeType });

        // Convert to base64 for file saving
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Data = reader.result as string;
          resolve({ base64: base64Data, blob, mimeType });
        };
        reader.onerror = () => {
          setError('녹음 파일 저장에 실패했습니다.');
          resolve(null);
        };
        reader.readAsDataURL(blob);

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        // Close audio context
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }

        analyserRef.current = null;
        chunksRef.current = [];
        setIsRecording(false);
        setRecordingTime(0);
        setAudioLevel(0);
      };

      mediaRecorder.stop();
    });
  }, [isRecording]);

  return {
    isRecording,
    isCountingDown,
    countdown,
    recordingTime,
    audioLevel,
    startRecording,
    stopRecording,
    cancelCountdown,
    error,
  };
}
