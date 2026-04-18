'use client';

import { memo, useState } from 'react';
import { ChevronLeft, MoreVertical, Music2, BarChart3, Mic, Settings, Volume2, X } from 'lucide-react';
import AudioDeviceSelector from '@/components/practice/AudioDeviceSelector';
import type { AudioDevice, NewDevicePrompt } from '@/hooks/useAudioDevices';
import { PracticeProvider, PracticePageProps, usePracticeContext } from '@/contexts/PracticeContext';
import { WaveformDisplay } from '@/components/practice/WaveformDisplay';
import { SectionManager } from '@/components/practice/SectionManager';
import { RecordingControls } from '@/components/practice/RecordingControls';
import { SessionMeta } from '@/components/practice/SessionMeta';
import { ToastContainer } from '@/components/ui/Toast';
import GlobalMetronome from '@/components/practice/GlobalMetronome';
import VolumeMixer from '@/components/practice/VolumeMixer';
import SheetMusicSection from '@/components/practice/SheetMusicSection';
import PitchComparisonSection from '@/components/practice/PitchComparisonSection';
import { SheetMusicEditor } from '@/components/sheetMusic';

export default function PracticePage(props: PracticePageProps) {
  return (
    <PracticeProvider {...props}>
      <PracticePageContent />
    </PracticeProvider>
  );
}

type ToolModal = 'sheetMusic' | 'pitch' | 'recordings' | 'audioDevices' | null;

const PracticePageContent = memo(function PracticePageContent() {
  const ctx = usePracticeContext();
  const {
    isDark,
    currentSong,
    currentSession,
    audioBuffer,
    onBack,
    toasts,
    dismissToast,
    audioDevices,
  } = ctx;

  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [activeToolModal, setActiveToolModal] = useState<ToolModal>(null);

  const openTool = (tool: ToolModal) => {
    setShowMoreMenu(false);
    setActiveToolModal(tool);
  };


  // Web style
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <button onClick={onBack} className="text-purple-600 mb-4 flex items-center gap-2">
            ← 뒤로
          </button>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{currentSession?.name}</h1>
          <p className="text-gray-600 mb-6">{currentSong?.name}</p>

          <WaveformDisplay />

          {audioBuffer && <GlobalMetronome />}

          {audioBuffer && <SessionMeta />}
          <SectionManager />
        </div>
      </div>

      {/* Recording controls (trim modal etc.) */}
      <RecordingControls />

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
});

// --- Tool Launcher Button ---
function ToolLauncherButton({ icon, label, description, badge, isDark, onClick }: {
  icon: React.ReactNode;
  label: string;
  description: string;
  badge?: string;
  isDark: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl active:opacity-70 ${
        isDark ? 'active:bg-gray-700' : 'active:bg-gray-50'
      }`}
    >
      <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-700 text-purple-400' : 'bg-purple-50 text-purple-500'}`}>
        {icon}
      </div>
      <div className="flex-1 text-left">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{label}</span>
          {badge && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-500">{badge}</span>
          )}
        </div>
        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{description}</span>
      </div>
      <ChevronLeft className={`w-4 h-4 rotate-180 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
    </button>
  );
}

// --- Full-screen Tool Modal Shell ---
function ToolModalShell({ title, badge, onClose, children }: {
  title: string;
  badge?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { isDark } = usePracticeContext();
  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* Header */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b safe-top pb-3 px-5`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</h1>
            {badge && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-500">{badge}</span>
            )}
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg active:opacity-70 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}

// --- Sheet Music Tool Modal ---
const SheetMusicToolModal = memo(function SheetMusicToolModal({ onClose }: { onClose: () => void }) {
  const ctx = usePracticeContext();
  const [showEditor, setShowEditor] = useState(false);

  return (
    <ToolModalShell title="악보" onClose={onClose}>
      <div className={`${ctx.isDark ? 'bg-gray-800' : 'bg-white'} m-2 rounded-xl`}>
        <SheetMusicSection
          sheetMusic={ctx.resolvedSheetMusic}
          sections={ctx.sections}
          selectedSectionId={ctx.selectedSection?.id || null}
          currentTime={ctx.currentTime}
          isDark={ctx.isDark}
          onEditClick={() => setShowEditor(true)}
          onSectionClick={(sectionId) => {
            const section = ctx.sections.find(s => s.id === sectionId);
            if (section) {
              ctx.setSelectedSection(section);
              ctx.setCurrentTime(section.start);
              ctx.playAudio(section.start);
            }
          }}
        />
      </div>

      {/* Sheet Music Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className={`${ctx.isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            <div className={`flex items-center justify-between p-4 border-b ${ctx.isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-lg font-semibold ${ctx.isDark ? 'text-white' : 'text-gray-900'}`}>악보 편집</h2>
              <button
                onClick={() => setShowEditor(false)}
                className={`p-1 rounded-lg ${ctx.isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <span className={`text-2xl ${ctx.isDark ? 'text-gray-400' : 'text-gray-500'}`}>×</span>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <SheetMusicEditor
                sheetMusic={ctx.resolvedSheetMusic}
                sections={ctx.sections}
                onSheetMusicChange={ctx.onSheetMusicChange}
                isDark={ctx.isDark}
              />
            </div>
            <div className={`p-4 border-t ${ctx.isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                onClick={() => setShowEditor(false)}
                className="w-full px-4 py-2.5 bg-purple-500 text-white rounded-lg font-medium active:bg-purple-600"
              >
                완료
              </button>
            </div>
          </div>
        </div>
      )}
    </ToolModalShell>
  );
});

// --- Pitch Tool Modal ---
const PitchToolModal = memo(function PitchToolModal({ onClose }: { onClose: () => void }) {
  const ctx = usePracticeContext();

  const selectedBasicRecordingId = ctx.currentSession.basicRecordings?.[0]?.id || null;

  return (
    <ToolModalShell title="피치 분석" badge="Beta" onClose={onClose}>
      <div className={`${ctx.isDark ? 'bg-gray-800' : 'bg-white'} m-2 rounded-xl`}>
        <PitchComparisonSection
          isExpanded={true}
          onToggleExpand={() => {}}
          originalPitch={ctx.originalPitch}
          recordingPitch={ctx.recordingPitch}
          matchPercentage={ctx.matchPercentage}
          isAnalyzing={ctx.isPitchAnalyzing}
          error={ctx.pitchError}
          currentTime={ctx.currentTime}
          duration={ctx.duration}
          hasAudioBuffer={!!ctx.audioBuffer}
          hasRecordingBuffer={
            !!(selectedBasicRecordingId && ctx.recordedAudioBuffer[selectedBasicRecordingId])
          }
          isDark={ctx.isDark}
          onAnalyzeOriginal={() => ctx.audioBuffer && ctx.analyzeOriginal(ctx.audioBuffer)}
          onAnalyzeRecording={() => {
            const buffer = selectedBasicRecordingId ? ctx.recordedAudioBuffer[selectedBasicRecordingId] : null;
            if (buffer) ctx.analyzeRecording(buffer);
          }}
          onClearAnalysis={ctx.clearPitchAnalysis}
        />
      </div>
    </ToolModalShell>
  );
});

// --- Recordings Tool Modal ---
const RecordingsToolModal = memo(function RecordingsToolModal({ onClose }: { onClose: () => void }) {
  return (
    <ToolModalShell title="기본 녹음" onClose={onClose}>
      <div className="px-4 py-4">
        <RecordingControls inlineOnly />
      </div>
    </ToolModalShell>
  );
});

// --- Audio Devices Tool Modal ---
const AudioDevicesToolModal = memo(function AudioDevicesToolModal({ onClose }: { onClose: () => void }) {
  const ctx = usePracticeContext();
  const { audioDevices } = ctx;

  return (
    <ToolModalShell title="오디오 기기" onClose={onClose}>
      <div className={`${ctx.isDark ? 'bg-gray-800' : 'bg-white'} m-2 rounded-xl p-4`}>
        <AudioDeviceSelector
          inputDevices={audioDevices.inputDevices}
          outputDevices={audioDevices.outputDevices}
          selectedInputId={audioDevices.selectedInputId}
          selectedOutputId={audioDevices.selectedOutputId}
          onInputChange={audioDevices.setSelectedInputId}
          onOutputChange={audioDevices.setSelectedOutputId}
          isOutputSupported={audioDevices.isSupported.outputSelection}
        />
      </div>
    </ToolModalShell>
  );
});

// --- New Device Prompt Modal ---
function NewDevicePromptModal({
  prompt,
  inputDevices,
  outputDevices,
  selectedInputId,
  selectedOutputId,
  onInputChange,
  onOutputChange,
  isOutputSupported,
  onDismiss,
  isDark,
}: {
  prompt: NewDevicePrompt;
  inputDevices: AudioDevice[];
  outputDevices: AudioDevice[];
  selectedInputId: string;
  selectedOutputId: string;
  onInputChange: (id: string) => void;
  onOutputChange: (id: string) => void;
  isOutputSupported: boolean;
  onDismiss: () => void;
  isDark: boolean;
}) {
  const newDeviceNames = [
    ...prompt.newInputs.map(d => d.label),
    ...prompt.newOutputs.map(d => d.label),
  ];
  // Deduplicate (same physical device may appear as both input and output)
  const uniqueNames = newDeviceNames.filter((name, i) => newDeviceNames.indexOf(name) === i);

  const selectClass = `w-full px-3 py-2 text-sm rounded-lg border ${
    isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
  }`;

  return (
    <div className="fixed inset-0 z-50" onClick={onDismiss}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className={`absolute bottom-0 left-0 right-0 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-t-2xl`}
        style={{ paddingBottom: 'calc(1rem + var(--sab, 0px))' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className={`w-10 h-1 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`} />
        </div>

        <div className="px-5 pb-4">
          {/* Title */}
          <h3 className={`text-sm font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            새 오디오 기기 감지
          </h3>
          <p className={`text-xs mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {uniqueNames.join(', ')}
          </p>

          {/* Output selector */}
          {prompt.newOutputs.length > 0 && (
            <div className="mb-3">
              <label className={`flex items-center gap-1.5 text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <Volume2 className="w-3.5 h-3.5" />
                재생 기기
              </label>
              <select
                value={selectedOutputId}
                onChange={(e) => onOutputChange(e.target.value)}
                className={selectClass}
              >
                <option value="default">기본 스피커</option>
                {outputDevices.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Input selector */}
          {prompt.newInputs.length > 0 && (
            <div className="mb-4">
              <label className={`flex items-center gap-1.5 text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <Mic className="w-3.5 h-3.5" />
                녹음 기기
              </label>
              <select
                value={selectedInputId}
                onChange={(e) => onInputChange(e.target.value)}
                className={selectClass}
              >
                <option value="default">기본 마이크</option>
                {inputDevices.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={onDismiss}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium ${
                isDark ? 'bg-gray-700 text-gray-300 active:bg-gray-600' : 'bg-gray-100 text-gray-600 active:bg-gray-200'
              }`}
            >
              닫기
            </button>
            <button
              onClick={() => {
                // Auto-select the first new device
                if (prompt.newOutputs.length > 0) {
                  onOutputChange(prompt.newOutputs[0].deviceId);
                }
                if (prompt.newInputs.length > 0) {
                  onInputChange(prompt.newInputs[0].deviceId);
                }
                onDismiss();
              }}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-blue-500 text-white active:bg-blue-600"
            >
              새 기기로 변경
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
