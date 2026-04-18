'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface AudioDevice {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'audiooutput';
}

export interface NewDevicePrompt {
  newInputs: AudioDevice[];
  newOutputs: AudioDevice[];
}

export interface UseAudioDevicesReturn {
  inputDevices: AudioDevice[];
  outputDevices: AudioDevice[];
  selectedInputId: string;
  selectedOutputId: string;
  setSelectedInputId: (id: string) => void;
  setSelectedOutputId: (id: string) => void;
  isSupported: {
    enumeration: boolean;
    outputSelection: boolean;
  };
  refreshDevices: () => Promise<void>;
  // New device detection
  newDevicePrompt: NewDevicePrompt | null;
  dismissNewDevicePrompt: () => void;
}

const STORAGE_KEY_INPUT = 'practix_audio_input_device';
const STORAGE_KEY_OUTPUT = 'practix_audio_output_device';

export function useAudioDevices(audioContext: AudioContext | null): UseAudioDevicesReturn {
  const [inputDevices, setInputDevices] = useState<AudioDevice[]>([]);
  const [outputDevices, setOutputDevices] = useState<AudioDevice[]>([]);
  const [selectedInputId, setSelectedInputIdState] = useState<string>('default');
  const [selectedOutputId, setSelectedOutputIdState] = useState<string>('default');
  const [newDevicePrompt, setNewDevicePrompt] = useState<NewDevicePrompt | null>(null);
  const hasEnumerated = useRef(false);
  const knownDeviceIds = useRef<Set<string>>(new Set());

  const isSupported = {
    enumeration: typeof navigator !== 'undefined' && !!navigator.mediaDevices?.enumerateDevices,
    outputSelection: typeof AudioContext !== 'undefined' && 'setSinkId' in AudioContext.prototype,
  };

  const isRealDevice = (d: MediaDeviceInfo) =>
    d.deviceId !== 'default' && d.deviceId !== 'communications' && d.deviceId !== '';

  const enumerateDevices = useCallback(async (detectNew = false) => {
    if (!navigator.mediaDevices?.enumerateDevices) return;

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();

      const inputs: AudioDevice[] = devices
        .filter(d => d.kind === 'audioinput' && isRealDevice(d))
        .map((d, i) => ({
          deviceId: d.deviceId,
          label: d.label || `마이크 ${i + 1}`,
          kind: 'audioinput' as const,
        }));

      const outputs: AudioDevice[] = devices
        .filter(d => d.kind === 'audiooutput' && isRealDevice(d))
        .map((d, i) => ({
          deviceId: d.deviceId,
          label: d.label || `스피커 ${i + 1}`,
          kind: 'audiooutput' as const,
        }));

      // Detect newly added devices
      if (detectNew && knownDeviceIds.current.size > 0) {
        const newInputs = inputs.filter(d => !knownDeviceIds.current.has(d.deviceId));
        const newOutputs = outputs.filter(d => !knownDeviceIds.current.has(d.deviceId));

        if (newInputs.length > 0 || newOutputs.length > 0) {
          setNewDevicePrompt({ newInputs, newOutputs });
        }
      }

      // Update known device IDs
      knownDeviceIds.current = new Set([
        ...inputs.map(d => d.deviceId),
        ...outputs.map(d => d.deviceId),
      ]);

      setInputDevices(inputs);
      setOutputDevices(outputs);
    } catch (err) {
      console.warn('[AudioDevices] Failed to enumerate devices:', err);
    }
  }, []);

  // Load saved preferences and enumerate on mount
  useEffect(() => {
    if (hasEnumerated.current) return;
    hasEnumerated.current = true;

    const savedInput = localStorage.getItem(STORAGE_KEY_INPUT);
    const savedOutput = localStorage.getItem(STORAGE_KEY_OUTPUT);
    if (savedInput) setSelectedInputIdState(savedInput);
    if (savedOutput) setSelectedOutputIdState(savedOutput);

    enumerateDevices(false); // Initial: don't detect new
  }, [enumerateDevices]);

  // Listen for device changes (plug/unplug)
  useEffect(() => {
    if (!navigator.mediaDevices) return;
    const handler = () => enumerateDevices(true); // Detect new on change
    navigator.mediaDevices.addEventListener('devicechange', handler);
    return () => navigator.mediaDevices.removeEventListener('devicechange', handler);
  }, [enumerateDevices]);

  // Apply output device to AudioContext when selection changes
  useEffect(() => {
    if (!audioContext || selectedOutputId === 'default') return;
    if (!('setSinkId' in audioContext)) return;

    (audioContext as any).setSinkId(selectedOutputId).catch((err: Error) => {
      console.warn('[AudioDevices] Failed to set output device:', err);
    });
  }, [audioContext, selectedOutputId]);

  const setSelectedInputId = useCallback((id: string) => {
    setSelectedInputIdState(id);
    localStorage.setItem(STORAGE_KEY_INPUT, id);
  }, []);

  const setSelectedOutputId = useCallback((id: string) => {
    setSelectedOutputIdState(id);
    localStorage.setItem(STORAGE_KEY_OUTPUT, id);
  }, []);

  const dismissNewDevicePrompt = useCallback(() => {
    setNewDevicePrompt(null);
  }, []);

  return {
    inputDevices,
    outputDevices,
    selectedInputId,
    selectedOutputId,
    setSelectedInputId,
    setSelectedOutputId,
    isSupported,
    refreshDevices: enumerateDevices,
    newDevicePrompt,
    dismissNewDevicePrompt,
  };
}
