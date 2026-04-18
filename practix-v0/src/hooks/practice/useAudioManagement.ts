import { useState, useEffect, useCallback } from 'react';
import { Session, SheetMusic } from '@/types';
import { saveAudio, loadAudio } from '@/lib/audioStorage';
import {
  loadAudioFromDevice,
  saveAudioToDevice,
  loadSheetMusicFromDevice,
} from '@/lib/mobileStorage';

interface UseAudioManagementProps {
  audioContext: AudioContext | null;
  currentSession: Session;
  isCapacitor?: boolean; // kept for API compat, always treated as false
  onAudioDataChange: (audioData: string | null) => void;
}

export function useAudioManagement({
  audioContext,
  currentSession,
  onAudioDataChange,
}: UseAudioManagementProps) {
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(!!currentSession.audioData);
  const [waveformData, setWaveformData] = useState<number[] | null>(null);
  const [restoredSheetMusicImage, setRestoredSheetMusicImage] = useState<string | null>(null);

  const duration = audioBuffer?.duration || 0;

  const generateWaveformData = useCallback((buffer: AudioBuffer) => {
    const numChannels = buffer.numberOfChannels;
    const length = buffer.getChannelData(0).length;
    const samples = 2000;
    const blockSize = Math.floor(length / samples);
    const filteredData: number[] = [];

    for (let i = 0; i < samples; i++) {
      const blockStart = blockSize * i;
      let sumSquares = 0;
      let count = 0;

      for (let j = 0; j < blockSize; j++) {
        const sampleIndex = blockStart + j;
        if (sampleIndex < length) {
          let channelSum = 0;
          for (let ch = 0; ch < numChannels; ch++) {
            channelSum += buffer.getChannelData(ch)[sampleIndex];
          }
          const avgSample = channelSum / numChannels;
          sumSquares += avgSample * avgSample;
          count++;
        }
      }

      const rms = count > 0 ? Math.sqrt(sumSquares / count) : 0;
      filteredData.push(rms);
    }

    const max = Math.max(...filteredData);
    const noiseFloor = max * 0.015;

    const normalized = filteredData.map((n) => {
      if (n < noiseFloor) return 0;
      const norm = max > 0 ? n / max : 0;
      return Math.pow(norm, 0.7);
    });
    setWaveformData(normalized);
  }, []);

  // Restore audio on mount — web: IndexedDB ('idb') only
  useEffect(() => {
    if (audioContext && currentSession.audioData && !audioBuffer) {
      (async () => {
        try {
          let base64: string | null = null;

          if (currentSession.audioData === 'idb' || currentSession.audioData === 'file') {
            // 'file' marker from old mobile data — try IndexedDB fallback
            base64 = await loadAudio(currentSession.id)
              ?? await loadAudioFromDevice(currentSession.id);
          }

          if (!base64) {
            setIsLoadingAudio(false);
            return;
          }
          const response = await fetch(base64);
          const arrayBuffer = await response.arrayBuffer();
          const decoded = await audioContext.decodeAudioData(arrayBuffer);
          setAudioBuffer(decoded);
          generateWaveformData(decoded);
        } catch (err) {
          console.error('Failed to restore audio from session:', err);
        } finally {
          setIsLoadingAudio(false);
        }
      })();
    } else if (!currentSession.audioData) {
      setIsLoadingAudio(false);
    }
  }, [audioContext, currentSession.audioData, currentSession.id, generateWaveformData]);

  // Restore sheet music image on mount — web: IndexedDB
  useEffect(() => {
    if (currentSession.sheetMusic) {
      const { imageData } = currentSession.sheetMusic;
      if (imageData === 'file' || imageData === 'idb') {
        (async () => {
          try {
            const img = await loadSheetMusicFromDevice(currentSession.id);
            setRestoredSheetMusicImage(img);
          } catch (err) {
            console.error('Failed to restore sheet music:', err);
          }
        })();
      } else {
        setRestoredSheetMusicImage(imageData);
      }
    } else {
      setRestoredSheetMusicImage(null);
    }
  }, [currentSession.id, currentSession.sheetMusic]);

  // Handle audio file upload
  const handleAudioUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !audioContext) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const decoded = await audioContext.decodeAudioData(arrayBuffer);

      setAudioBuffer(decoded);
      generateWaveformData(decoded);

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        await saveAudio(currentSession.id, base64Data);
        await saveAudioToDevice(currentSession.id, base64Data);
        onAudioDataChange('idb');
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Audio decode error:', err);
    }
  }, [audioContext, currentSession.id, onAudioDataChange, generateWaveformData]);

  const resolvedSheetMusic: SheetMusic | null =
    currentSession.sheetMusic && restoredSheetMusicImage
      ? { ...currentSession.sheetMusic, imageData: restoredSheetMusicImage }
      : null;

  return {
    audioBuffer,
    isLoadingAudio,
    waveformData,
    duration,
    resolvedSheetMusic,
    handleAudioUpload,
  };
}
