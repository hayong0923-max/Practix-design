'use client';

import { memo, useState, useCallback } from 'react';
import { 
  ChevronLeft, 
  Mic, 
  Square, 
  Music2, 
  List, 
  MoreHorizontal, 
  X,
  FileMusic,
  BarChart3,
  Settings,
  Play,
  Pause
} from 'lucide-react';
import AudioDeviceSelector from '@/components/practice/AudioDeviceSelector';
import { PracticeProvider, PracticePageProps, usePracticeContext } from '@/contexts/PracticeContext';
import { WaveformDisplay } from '@/components/practice/WaveformDisplay';
import { SectionManager } from '@/components/practice/SectionManager';
import { RecordingControls } from '@/components/practice/RecordingControls';
import { ToastContainer } from '@/components/ui/Toast';
import SheetMusicSection from '@/components/practice/SheetMusicSection';
import PitchComparisonSection from '@/components/practice/PitchComparisonSection';
import { SheetMusicEditor } from '@/components/sheetMusic';
import MetronomePage from '@/components/pages/MetronomePage';
import TunerPage from '@/components/pages/TunerPage';
import CountdownDial from '@/components/ui/CountdownDial';
import { useBasicRecording } from '@/components/practice/RecordingControls/useBasicRecording';
import RecordingTrimModal from '@/components/modals/RecordingTrimModal';
import BasicRecordingSection from '@/components/practice/BasicRecordingSection';

export default function PracticePage(props: PracticePageProps) {
  return (
    <PracticeProvider {...props}>
      <PracticePageContent />
    </PracticeProvider>
  );
}

type ActiveTab = 'sections' | 'recordings';
type SlideUpPanel = 'metronome' | 'tuner' | 'more' | null;

const PracticePageContent = memo(function PracticePageContent() {
  const ctx = usePracticeContext();
  const rec = useBasicRecording();
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

  const [activeTab, setActiveTab] = useState<ActiveTab>('sections');
  const [activePanel, setActivePanel] = useState<SlideUpPanel>(null);
  const [showSheetMusicEditor, setShowSheetMusicEditor] = useState(false);
  const [showCountdownDial, setShowCountdownDial] = useState(false);

  const closePanel = useCallback(() => {
    setActivePanel(null);
  }, []);

  const handleRecordPress = useCallback(() => {
    if (ctx.isRecording || ctx.isCountingDown) {
      // Stop recording
      if (ctx.isCountingDown) {
        ctx.cancelCountdown();
        rec.setIsBasicRecording(false);
      } else if (rec.isBasicRecording) {
        rec.handleStopBasicRecording();
      }
    } else {
      // Start recording with countdown
      rec.handleStartBasicRecording(ctx.countdownDuration);
    }
  }, [ctx.isRecording, ctx.isCountingDown, ctx.countdownDuration, ctx.cancelCountdown, rec]);

  const handleRecordLongPress = useCallback(() => {
    setShowCountdownDial(true);
  }, []);

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* HEADER */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-4 py-3 safe-top`}>
        <div className="flex items-center justify-between">
          <button 
            onClick={onBack} 
            className={`flex items-center gap-1 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">뒤로</span>
          </button>
          <div className="text-center flex-1 mx-4">
            <h1 className={`text-base font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {currentSession?.name}
            </h1>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {currentSong?.name}
            </p>
          </div>
          <div className="w-16" /> {/* Spacer for alignment */}
        </div>
      </div>

      {/* TOP ZONE: Waveform & Playback Controls */}
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} px-4 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <WaveformDisplay />
      </div>

      {/* MIDDLE ZONE: Tab Bar + Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Tab Bar */}
        <div className={`flex ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b`}>
          <button
            onClick={() => setActiveTab('sections')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              activeTab === 'sections'
                ? isDark ? 'text-purple-400 border-b-2 border-purple-400' : 'text-purple-600 border-b-2 border-purple-600'
                : isDark ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            <List className="w-4 h-4" />
            구간
          </button>
          <button
            onClick={() => setActiveTab('recordings')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              activeTab === 'recordings'
                ? isDark ? 'text-purple-400 border-b-2 border-purple-400' : 'text-purple-600 border-b-2 border-purple-600'
                : isDark ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            <Mic className="w-4 h-4" />
            녹음
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto pb-24">
          {activeTab === 'sections' && (
            <div className={`${isDark ? 'bg-gray-900' : 'bg-gray-50'} min-h-full`}>
              <SectionManager />
            </div>
          )}
          {activeTab === 'recordings' && (
            <div className={`${isDark ? 'bg-gray-900' : 'bg-gray-50'} min-h-full`}>
              <BasicRecordingSection
                recordings={ctx.currentSession.basicRecordings || []}
                selectedRecordingId={rec.selectedBasicRecordingId}
                recordedAudioBuffer={ctx.recordedAudioBuffer}
                recordedIsPlaying={ctx.recordedIsPlaying}
                recordedCurrentTime={ctx.recordedCurrentTime}
                isRecording={ctx.isRecording && rec.isBasicRecording}
                isCountingDown={ctx.isCountingDown && rec.isBasicRecording}
                countdown={ctx.countdown}
                recordingTime={ctx.recordingTime}
                audioLevel={ctx.audioLevel}
                countdownDuration={ctx.countdownDuration}
                isDark={ctx.isDark}
                onSelectRecording={rec.setSelectedBasicRecordingId}
                onTogglePlay={ctx.toggleRecordedPlay}
                onSeek={ctx.seekRecorded}
                onStartRecording={rec.handleStartBasicRecording}
                onStopRecording={rec.handleStopBasicRecording}
                onCancelCountdown={() => {
                  ctx.cancelCountdown();
                  rec.setIsBasicRecording(false);
                }}
                onDeleteRecording={rec.deleteBasicRecording}
                onTrimRecording={rec.setTrimmingRecording}
                onCountdownDurationChange={ctx.handleCountdownDurationChange}
                getEffectiveDuration={ctx.getEffectiveDuration}
              />
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM ZONE: Fixed Action Bar */}
      <div 
        className={`fixed bottom-0 left-0 right-0 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t`}
        style={{ paddingBottom: 'var(--sab, 0px)' }}
      >
        <div className="flex items-center justify-around py-3 px-4">
          {/* Record Button */}
          <RecordButton
            isRecording={ctx.isRecording}
            isCountingDown={ctx.isCountingDown}
            countdown={ctx.countdown}
            onPress={handleRecordPress}
            onLongPress={handleRecordLongPress}
            isDark={isDark}
          />

          {/* Metronome Toggle */}
          <button
            onClick={() => setActivePanel(activePanel === 'metronome' ? null : 'metronome')}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
              activePanel === 'metronome' || ctx.metronomeIsPlaying
                ? 'bg-green-500/20 text-green-500'
                : isDark ? 'text-gray-400 active:bg-gray-700' : 'text-gray-500 active:bg-gray-100'
            }`}
          >
            <MetronomeIcon className="w-6 h-6" />
            <span className="text-xs">메트로놈</span>
          </button>

          {/* Tuner Toggle */}
          <button
            onClick={() => setActivePanel(activePanel === 'tuner' ? null : 'tuner')}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
              activePanel === 'tuner'
                ? 'bg-purple-500/20 text-purple-500'
                : isDark ? 'text-gray-400 active:bg-gray-700' : 'text-gray-500 active:bg-gray-100'
            }`}
          >
            <TunerIcon className="w-6 h-6" />
            <span className="text-xs">튜너</span>
          </button>

          {/* More Button */}
          <button
            onClick={() => setActivePanel(activePanel === 'more' ? null : 'more')}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
              activePanel === 'more'
                ? isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900'
                : isDark ? 'text-gray-400 active:bg-gray-700' : 'text-gray-500 active:bg-gray-100'
            }`}
          >
            <MoreHorizontal className="w-6 h-6" />
            <span className="text-xs">더보기</span>
          </button>
        </div>
      </div>

      {/* SLIDE-UP PANELS */}
      {activePanel && (
        <SlideUpPanel 
          title={
            activePanel === 'metronome' ? '메트로놈' : 
            activePanel === 'tuner' ? '튜너' : 
            '더보기'
          }
          onClose={closePanel}
          isDark={isDark}
          fullHeight={activePanel === 'metronome' || activePanel === 'tuner'}
        >
          {activePanel === 'metronome' && (
            <MetronomePage isDark={isDark} />
          )}
          {activePanel === 'tuner' && (
            <TunerPage isDark={isDark} />
          )}
          {activePanel === 'more' && (
            <MoreMenuContent
              isDark={isDark}
              onSheetMusicClick={() => {
                closePanel();
                setShowSheetMusicEditor(true);
              }}
              onPitchAnalysisClick={() => {
                // TODO: Open pitch analysis
                closePanel();
              }}
              onAudioDevicesClick={() => {
                // Show audio devices in panel
              }}
              audioDevices={audioDevices}
            />
          )}
        </SlideUpPanel>
      )}

      {/* Sheet Music Editor Modal */}
      {showSheetMusicEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>악보</h2>
              <button
                onClick={() => setShowSheetMusicEditor(false)}
                className={`p-1 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <X className={`w-6 h-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <SheetMusicEditor
                sheetMusic={ctx.resolvedSheetMusic}
                sections={ctx.sections}
                onSheetMusicChange={ctx.onSheetMusicChange}
                isDark={isDark}
              />
            </div>
            <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                onClick={() => setShowSheetMusicEditor(false)}
                className="w-full px-4 py-2.5 bg-purple-500 text-white rounded-lg font-medium active:bg-purple-600"
              >
                완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Countdown Dial */}
      {showCountdownDial && (
        <CountdownDial
          value={ctx.countdownDuration}
          onChange={ctx.handleCountdownDurationChange}
          onClose={() => setShowCountdownDial(false)}
        />
      )}

      {/* Recording Trim Modal */}
      {rec.trimmingRecording && (
        <RecordingTrimModal
          show={!!rec.trimmingRecording}
          onClose={() => rec.setTrimmingRecording(null)}
          recording={rec.trimmingRecording}
          audioBuffer={ctx.recordedAudioBuffer[rec.trimmingRecording.id] || null}
          audioContext={ctx.audioContext}
          onSave={rec.handleSaveBasicRecordingTrim}
        />
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
});

// --- Record Button Component ---
interface RecordButtonProps {
  isRecording: boolean;
  isCountingDown: boolean;
  countdown: number;
  onPress: () => void;
  onLongPress: () => void;
  isDark: boolean;
}

function RecordButton({ isRecording, isCountingDown, countdown, onPress, onLongPress, isDark }: RecordButtonProps) {
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [isLongPress, setIsLongPress] = useState(false);

  const handleTouchStart = () => {
    setIsLongPress(false);
    const timer = setTimeout(() => {
      setIsLongPress(true);
      onLongPress();
    }, 500);
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    if (!isLongPress) {
      onPress();
    }
    setIsLongPress(false);
  };

  const handleTouchCancel = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    setIsLongPress(false);
  };

  const isActive = isRecording || isCountingDown;

  return (
    <button
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchCancel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
        isActive
          ? 'bg-red-500 text-white'
          : isDark ? 'text-gray-400 active:bg-gray-700' : 'text-gray-500 active:bg-gray-100'
      }`}
      style={{ touchAction: 'manipulation' }}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
        isActive ? 'bg-white/20' : isDark ? 'bg-red-500/20' : 'bg-red-100'
      }`}>
        {isCountingDown ? (
          <span className={`text-lg font-bold ${isActive ? 'text-white' : 'text-red-500'}`}>{countdown}</span>
        ) : isRecording ? (
          <Square className={`w-5 h-5 ${isActive ? 'text-white' : 'text-red-500'}`} />
        ) : (
          <Mic className={`w-5 h-5 ${isActive ? 'text-white' : 'text-red-500'}`} />
        )}
      </div>
      <span className="text-xs">{isRecording ? '중지' : '녹음'}</span>
    </button>
  );
}

// --- Slide Up Panel Component ---
interface SlideUpPanelProps {
  title: string;
  onClose: () => void;
  isDark: boolean;
  fullHeight?: boolean;
  children: React.ReactNode;
}

function SlideUpPanel({ title, onClose, isDark, fullHeight, children }: SlideUpPanelProps) {
  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div 
        className={`absolute bottom-0 left-0 right-0 ${isDark ? 'bg-gray-900' : 'bg-white'} rounded-t-2xl overflow-hidden flex flex-col ${
          fullHeight ? 'h-[85vh]' : 'max-h-[70vh]'
        }`}
        style={{ paddingBottom: 'var(--sab, 0px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className={`w-10 h-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
        </div>
        
        {/* Header */}
        <div className={`flex items-center justify-between px-4 pb-3 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
          >
            <X className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

// --- More Menu Content ---
interface MoreMenuContentProps {
  isDark: boolean;
  onSheetMusicClick: () => void;
  onPitchAnalysisClick: () => void;
  onAudioDevicesClick: () => void;
  audioDevices: ReturnType<typeof import('@/hooks/useAudioDevices').useAudioDevices>;
}

function MoreMenuContent({ isDark, onSheetMusicClick, onPitchAnalysisClick, onAudioDevicesClick, audioDevices }: MoreMenuContentProps) {
  return (
    <div className="p-4 space-y-2">
      {/* Sheet Music */}
      <button
        onClick={onSheetMusicClick}
        className={`w-full flex items-center gap-4 p-4 rounded-xl ${
          isDark ? 'bg-gray-800 active:bg-gray-700' : 'bg-gray-100 active:bg-gray-200'
        }`}
      >
        <div className={`p-2 rounded-lg ${isDark ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
          <FileMusic className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
        </div>
        <div className="flex-1 text-left">
          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>악보</p>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>악보 이미지 추가 및 관리</p>
        </div>
        <ChevronLeft className={`w-5 h-5 rotate-180 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
      </button>

      {/* Pitch Analysis */}
      <button
        onClick={onPitchAnalysisClick}
        className={`w-full flex items-center gap-4 p-4 rounded-xl ${
          isDark ? 'bg-gray-800 active:bg-gray-700' : 'bg-gray-100 active:bg-gray-200'
        }`}
      >
        <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
          <BarChart3 className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>피치 분석</p>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-500">Beta</span>
          </div>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>원곡과 녹음의 피치 비교</p>
        </div>
        <ChevronLeft className={`w-5 h-5 rotate-180 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
      </button>

      {/* Audio Devices */}
      <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <div className="flex items-center gap-4 mb-4">
          <div className={`p-2 rounded-lg ${isDark ? 'bg-green-500/20' : 'bg-green-100'}`}>
            <Settings className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
          </div>
          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>오디오 기기</p>
        </div>
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
    </div>
  );
}

// --- Custom Icons ---
function MetronomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L4 22h16L12 2z" />
      <line x1="12" y1="6" x2="12" y2="14" />
      <line x1="12" y1="14" x2="16" y2="8" />
    </svg>
  );
}

function TunerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12h4" />
      <path d="M18 12h4" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v4" />
      <path d="M12 18v4" />
      <path d="M4.93 4.93l2.83 2.83" />
      <path d="M16.24 16.24l2.83 2.83" />
      <path d="M4.93 19.07l2.83-2.83" />
      <path d="M16.24 7.76l2.83-2.83" />
    </svg>
  );
}
