'use client';

import { memo } from 'react';
import { Mic, Volume2, AlertTriangle } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

interface AudioDevice {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'audiooutput';
}

interface AudioDeviceSelectorProps {
  inputDevices: AudioDevice[];
  outputDevices: AudioDevice[];
  selectedInputId: string;
  selectedOutputId: string;
  onInputChange: (id: string) => void;
  onOutputChange: (id: string) => void;
  isOutputSupported: boolean;
}

function AudioDeviceSelector({
  inputDevices,
  outputDevices,
  selectedInputId,
  selectedOutputId,
  onInputChange,
  onOutputChange,
  isOutputSupported,
}: AudioDeviceSelectorProps) {
  const { isDark } = useTheme();

  const selectClass = `w-full px-3 py-2 text-sm rounded-lg border ${
    isDark
      ? 'bg-gray-700 border-gray-600 text-white'
      : 'bg-white border-gray-300 text-gray-800'
  }`;

  return (
    <div className="space-y-3">
      {/* Input device */}
      <div>
        <label className={`flex items-center gap-1.5 text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          <Mic className="w-3.5 h-3.5" />
          녹음 기기
        </label>
        {inputDevices.length > 0 ? (
          <select
            value={selectedInputId}
            onChange={(e) => onInputChange(e.target.value)}
            className={selectClass}
          >
            <option value="default">기본 마이크</option>
            {inputDevices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label}
              </option>
            ))}
          </select>
        ) : (
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            감지된 마이크 없음
          </p>
        )}
      </div>

      {/* Bluetooth recording quality notice */}
      {selectedInputId !== 'default' && (
        <div className={`flex items-start gap-2 p-2.5 rounded-lg text-xs ${
          isDark ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-50 text-yellow-700'
        }`}>
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>블루투스 기기로 녹음 시 MR/메트로놈 재생 음질이 저하될 수 있습니다 (OS 제한)</span>
        </div>
      )}

      {/* Output device */}
      <div>
        <label className={`flex items-center gap-1.5 text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          <Volume2 className="w-3.5 h-3.5" />
          재생 기기
        </label>
        {outputDevices.length > 0 ? (
          <>
            <select
              value={selectedOutputId}
              onChange={(e) => onOutputChange(e.target.value)}
              className={selectClass}
            >
              <option value="default">기본 스피커</option>
              {outputDevices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label}
                </option>
              ))}
            </select>
            {!isOutputSupported && (
              <p className={`text-xs mt-1 ${isDark ? 'text-yellow-500' : 'text-yellow-600'}`}>
                이 기기에서는 재생 기기 전환이 제한될 수 있습니다
              </p>
            )}
          </>
        ) : (
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            재생 기기는 블루투스 연결 시 자동 전환됩니다
          </p>
        )}
      </div>
    </div>
  );
}

export default memo(AudioDeviceSelector);
