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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <button 
            onClick={onBack} 
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ChevronLeft className="w-4 h-4" />
            뒤로
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold text-foreground">{currentSession?.name}</h1>
              <p className="text-sm text-muted-foreground">{currentSong?.name}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-6 pb-28 space-y-6">
        {/* Waveform Card */}
        <section className="bg-card border border-border rounded-xl p-6">
          <WaveformDisplay />
        </section>

        {/* Metronome */}
        {audioBuffer && (
          <section className="bg-card border border-border rounded-xl p-6">
            <GlobalMetronome />
          </section>
        )}

        {/* Session Meta */}
        {audioBuffer && (
          <section className="bg-card border border-border rounded-xl p-6">
            <SessionMeta />
          </section>
        )}

        {/* Section Manager */}
        <section className="bg-card border border-border rounded-xl p-6">
          <SectionManager />
        </section>
      </main>

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
      className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl active:opacity-70 hover:bg-secondary/50 transition-colors"
    >
      <div className="p-2 rounded-lg bg-secondary text-foreground">
        {icon}
      </div>
      <div className="flex-1 text-left">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{label}</span>
          {badge && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/20 text-accent">{badge}</span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
      <ChevronLeft className="w-4 h-4 rotate-180 text-muted-foreground" />
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
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border safe-top pb-3 px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-foreground">{title}</h1>
            {badge && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/20 text-accent">{badge}</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
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
      <div className="m-4 rounded-xl bg-card border border-border">
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
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-border">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">악보 편집</h2>
              <button
                onClick={() => setShowEditor(false)}
                className="p-1 rounded-lg hover:bg-secondary transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
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
            <div className="p-4 border-t border-border">
              <button
                onClick={() => setShowEditor(false)}
                className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
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
      <div className="m-4 rounded-xl bg-card border border-border">
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
      <div className="m-4 rounded-xl bg-card border border-border p-4">
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

  return (
    <div className="fixed inset-0 z-50" onClick={onDismiss}>
      <div className="absolute inset-0 bg-foreground/40" />
      <div
        className="absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl border-t border-border"
        style={{ paddingBottom: 'calc(1rem + var(--sab, 0px))' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        <div className="px-5 pb-4">
          {/* Title */}
          <h3 className="text-sm font-semibold mb-1 text-foreground">
            새 오디오 기기 감지
          </h3>
          <p className="text-xs mb-4 text-muted-foreground">
            {uniqueNames.join(', ')}
          </p>

          {/* Output selector */}
          {prompt.newOutputs.length > 0 && (
            <div className="mb-3">
              <label className="flex items-center gap-1.5 text-xs font-medium mb-1 text-muted-foreground">
                <Volume2 className="w-3.5 h-3.5" />
                재생 기기
              </label>
              <select
                value={selectedOutputId}
                onChange={(e) => onOutputChange(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border bg-background border-border text-foreground"
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
              <label className="flex items-center gap-1.5 text-xs font-medium mb-1 text-muted-foreground">
                <Mic className="w-3.5 h-3.5" />
                녹음 기기
              </label>
              <select
                value={selectedInputId}
                onChange={(e) => onInputChange(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border bg-background border-border text-foreground"
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
              className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
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
              className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
            >
              새 기기로 변경
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
