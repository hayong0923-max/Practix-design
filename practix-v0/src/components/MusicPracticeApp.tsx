'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { HelpCircle } from 'lucide-react';
import { Song, Session, Section, SheetMusic, Recording, TrashedRecording, MetronomeSettings } from '@/types';
import { useAudioContext } from '@/hooks/useAudioContext';
import { useTrash } from '@/hooks/useTrash';
import { useTheme } from '@/hooks/useTheme';
import { useBackButton } from '@/hooks/useBackButton';
import SongsPage from '@/components/pages/SongsPage';
import SessionsPage from '@/components/pages/SessionsPage';
import PracticePage from '@/components/pages/PracticePage';
import StatsPage from '@/components/pages/StatsPage';
import { saveAudio } from '@/lib/audioStorage';

// Simplified navigation: songs → (sessions if multiple) → practice
// Stats accessible via icon, Metronome/Tuner integrated as panels in Practice
type Page = 'songs' | 'sessions' | 'practice' | 'stats';
const STORAGE_KEY = 'practix_songs';
const FIRST_RUN_KEY = 'practix_first_run_completed';
const TOOLTIP_DISMISSED_KEY = 'practix_tooltip_dismissed';

interface MusicPracticeAppProps {
  onShowTutorial?: () => void;
}

// Create sample song for first-run experience
function createSampleSong(): Song {
  const sampleSession: Session = {
    id: Date.now(),
    name: '샘플 세션',
    audioData: null,
    sections: [],
    markers: [0],
  };
  
  return {
    id: Date.now() + 1,
    name: '샘플 곡',
    sessions: [sampleSession],
  };
}

export default function MusicPracticeApp({ onShowTutorial }: MusicPracticeAppProps) {
  const audioContext = useAudioContext();
  const { trashedRecordings, moveToTrash, restoreFromTrash, permanentlyDelete, emptyTrash, getTrashForSession } = useTrash();
  const { isDark } = useTheme();

  const [page, setPage] = useState<Page>('songs');
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasRealData, setHasRealData] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  
  // First-run tooltip state
  const [showFirstRunTooltip, setShowFirstRunTooltip] = useState(false);
  const [tooltipStep, setTooltipStep] = useState(1);

  // Web: microphone permission via browser API
  const requestAllPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.log('[Permissions] Microphone permission denied or error', err);
    }
    return true;
  };

  const openStorageSettings = async () => {
    setShowPermissionDialog(false);
  };

  // Load songs on mount
  useEffect(() => {
    const loadData = async () => {
      await requestAllPermissions();
      const stored = localStorage.getItem(STORAGE_KEY);
      const firstRunCompleted = localStorage.getItem(FIRST_RUN_KEY);
      const tooltipDismissed = localStorage.getItem(TOOLTIP_DISMISSED_KEY);
      
      if (stored) {
        try {
          const parsed: Song[] = JSON.parse(stored);
          // Migrate any old base64 audioData to IndexedDB
          for (const song of parsed) {
            for (const sess of song.sessions) {
              if (sess.audioData && sess.audioData !== 'idb' && sess.audioData !== 'file') {
                await saveAudio(sess.id, sess.audioData);
                sess.audioData = 'idb';
              }
            }
          }
          setSongs(parsed);
          setHasRealData(true);
        } catch (e) {
          console.error('Failed to parse stored songs:', e);
          // First run: create sample song
          const sampleSong = createSampleSong();
          setSongs([sampleSong]);
          if (tooltipDismissed !== 'true') {
            setShowFirstRunTooltip(true);
          }
        }
      } else {
        // First run: create sample song
        const sampleSong = createSampleSong();
        setSongs([sampleSong]);
        localStorage.setItem(FIRST_RUN_KEY, 'true');
        if (tooltipDismissed !== 'true') {
          setShowFirstRunTooltip(true);
        }
      }
      setIsLoaded(true);
    };
    loadData();
  }, []);

  // Save songs whenever they change
  useEffect(() => {
    if (!isLoaded || songs.length === 0) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(songs));
  }, [songs, isLoaded]);

  // Modal states
  const [showAddSong, setShowAddSong] = useState(false);
  const [showAddSession, setShowAddSession] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [inputValue, setInputValue] = useState('');

  // Dismiss first-run tooltip
  const dismissTooltip = useCallback(() => {
    setShowFirstRunTooltip(false);
    localStorage.setItem(TOOLTIP_DISMISSED_KEY, 'true');
  }, []);

  // Back button navigation - simplified
  const handleNavigateBack = useCallback(() => {
    if (page === 'practice') {
      // If song has multiple sessions, go to sessions; otherwise go to songs
      if (currentSong && currentSong.sessions.length > 1) {
        setPage('sessions');
      } else {
        setPage('songs');
      }
    } else if (page === 'sessions') {
      setPage('songs');
    } else if (page === 'stats') {
      setPage('songs');
    }
  }, [page, currentSong]);

  // Modal closers for back button
  const modalClosers = useMemo(() => [
    () => {
      if (showConfirm) { setShowConfirm(false); return true; }
      return false;
    },
    () => {
      if (showAddSong) { setShowAddSong(false); return true; }
      return false;
    },
    () => {
      if (showAddSession) { setShowAddSession(false); return true; }
      return false;
    },
    () => {
      if (showPermissionDialog) { setShowPermissionDialog(false); return true; }
      return false;
    },
    () => {
      if (showFirstRunTooltip) { dismissTooltip(); return true; }
      return false;
    },
  ], [showConfirm, showAddSong, showAddSession, showPermissionDialog, showFirstRunTooltip, dismissTooltip]);

  // Android back button handler
  const { showExitToast } = useBackButton({
    page,
    onNavigateBack: handleNavigateBack,
    modalClosers,
  });

  // Song actions
  const deleteSong = useCallback((songId: number) => {
    const song = songs.find((s) => s.id === songId);
    const recordingCount = song?.sessions.reduce((total, session) => {
      const sectionRecordings = session.sections?.reduce((sum, sec) => sum + (sec.recordedFiles?.length || 0), 0) || 0;
      const basicRecordings = session.basicRecordings?.length || 0;
      return total + sectionRecordings + basicRecordings;
    }, 0) || 0;

    const message = recordingCount > 0
      ? `이 곡을 삭제하시겠습니까? (${recordingCount}개 녹음이 휴지통으로 이동합니다)`
      : '이 곡을 삭제하시겠습니까?';

    setConfirmMessage(message);
    setConfirmAction(() => () => {
      if (song) {
        song.sessions.forEach((session) => {
          session.sections?.forEach((section, sectionIndex) => {
            section.recordedFiles?.forEach((recording) => {
              moveToTrash(recording, songId, session.id, section.id, sectionIndex);
            });
          });
          session.basicRecordings?.forEach((recording) => {
            moveToTrash(recording, songId, session.id, null, -1);
          });
        });
      }
      setSongs((prev) => prev.filter((s) => s.id !== songId));
      setShowConfirm(false);
    });
    setShowConfirm(true);
  }, [songs, moveToTrash]);

  const handleAddSong = useCallback(() => {
    if (inputValue.trim()) {
      setSongs((prev) => [...prev, { id: Date.now(), name: inputValue, sessions: [] }]);
      setHasRealData(true);
      setInputValue('');
      setShowAddSong(false);
    }
  }, [inputValue]);

  // Session actions
  const deleteSession = useCallback(
    (sessionId: number) => {
      if (!currentSong) return;

      const session = currentSong.sessions.find((s) => s.id === sessionId);
      const sectionRecordings = session?.sections?.reduce((sum, sec) => sum + (sec.recordedFiles?.length || 0), 0) || 0;
      const basicRecordings = session?.basicRecordings?.length || 0;
      const recordingCount = sectionRecordings + basicRecordings;

      const message = recordingCount > 0
        ? `이 연습 세션을 삭제하시겠습니까? (${recordingCount}개 녹음이 휴지통으로 이동합니다)`
        : '이 연습 세션을 삭제하시겠습니까?';

      setConfirmMessage(message);
      setConfirmAction(() => () => {
        if (!currentSong) return;

        if (session) {
          session.sections?.forEach((section, sectionIndex) => {
            section.recordedFiles?.forEach((recording) => {
              moveToTrash(recording, currentSong.id, sessionId, section.id, sectionIndex);
            });
          });
          session.basicRecordings?.forEach((recording) => {
            moveToTrash(recording, currentSong.id, sessionId, null, -1);
          });
        }

        const updatedSongs = songs.map((song) =>
          song.id === currentSong.id
            ? { ...song, sessions: song.sessions.filter((s) => s.id !== sessionId) }
            : song
        );
        setSongs(updatedSongs);
        setCurrentSong(updatedSongs.find((s) => s.id === currentSong.id) || null);
        setShowConfirm(false);
      });
      setShowConfirm(true);
    },
    [currentSong, songs, moveToTrash]
  );

  const handleAddSession = useCallback(() => {
    if (inputValue.trim() && currentSong) {
      const newSession: Session = {
        id: Date.now(),
        name: inputValue,
        audioData: null,
        sections: [],
        markers: [0],
      };
      const updatedSongs = songs.map((song) =>
        song.id === currentSong.id ? { ...song, sessions: [...song.sessions, newSession] } : song
      );
      setSongs(updatedSongs);
      setHasRealData(true);
      setCurrentSong(updatedSongs.find((s) => s.id === currentSong.id) || null);
      setInputValue('');
      setShowAddSession(false);
    }
  }, [inputValue, currentSong, songs]);

  const openSession = useCallback((song: Song, session: Session) => {
    setCurrentSong(song);
    setCurrentSession(session);
    setSections(session.sections || []);
    setPage('practice');
  }, []);

  // Simplified song selection: skip sessions page if only 1 session
  const handleSelectSong = useCallback((song: Song) => {
    setCurrentSong(song);
    if (song.sessions.length === 0) {
      // No sessions - go to sessions page to add one
      setPage('sessions');
    } else if (song.sessions.length === 1) {
      // Single session - go directly to practice
      openSession(song, song.sessions[0]);
    } else {
      // Multiple sessions - show session selector
      setPage('sessions');
    }
  }, [openSession]);

  const updateSections = useCallback(
    (newSections: Section[]) => {
      setSections(newSections);
      if (currentSong && currentSession) {
        const updatedSongs = songs.map((song) =>
          song.id === currentSong.id
            ? {
                ...song,
                sessions: song.sessions.map((sess) =>
                  sess.id === currentSession.id ? { ...sess, sections: newSections } : sess
                ),
              }
            : song
        );
        setSongs(updatedSongs);
        setHasRealData(true);
      }
    },
    [currentSong, currentSession, songs]
  );

  const updateAudioData = useCallback(
    async (audioData: string | null) => {
      if (currentSong && currentSession) {
        let storedMarker: string | null = audioData;

        if (audioData && audioData.startsWith('data:')) {
          await saveAudio(currentSession.id, audioData);
          storedMarker = 'idb';
        }

        const updatedSession = { ...currentSession, audioData: storedMarker };
        setCurrentSession(updatedSession);
        const updatedSongs = songs.map((song) =>
          song.id === currentSong.id
            ? {
                ...song,
                sessions: song.sessions.map((sess) =>
                  sess.id === currentSession.id ? { ...sess, audioData: storedMarker } : sess
                ),
              }
            : song
        );
        setSongs(updatedSongs);
        setHasRealData(true);
      }
    },
    [currentSong, currentSession, songs]
  );

  const updateSheetMusic = useCallback(
    async (sheetMusic: SheetMusic | null) => {
      if (currentSong && currentSession) {
        const sheetMusicValue = sheetMusic ?? undefined;

        const updatedSession = { ...currentSession, sheetMusic: sheetMusicValue };
        setCurrentSession(updatedSession);
        const updatedSongs = songs.map((song) =>
          song.id === currentSong.id
            ? {
                ...song,
                sessions: song.sessions.map((sess) =>
                  sess.id === currentSession.id ? { ...sess, sheetMusic: sheetMusicValue } : sess
                ),
              }
            : song
        );
        setSongs(updatedSongs);
        setHasRealData(true);
      }
    },
    [currentSong, currentSession, songs]
  );

  const updateBasicRecordings = useCallback(
    (basicRecordings: Recording[]) => {
      if (currentSong && currentSession) {
        const updatedSession = { ...currentSession, basicRecordings };
        setCurrentSession(updatedSession);
        const updatedSongs = songs.map((song) =>
          song.id === currentSong.id
            ? {
                ...song,
                sessions: song.sessions.map((sess) =>
                  sess.id === currentSession.id ? { ...sess, basicRecordings } : sess
                ),
              }
            : song
        );
        setSongs(updatedSongs);
        setHasRealData(true);
      }
    },
    [currentSong, currentSession, songs]
  );

  const updateMetronomeSettings = useCallback(
    (metronomeSettings: MetronomeSettings | undefined) => {
      if (currentSong && currentSession) {
        const updatedSession = { ...currentSession, metronomeSettings };
        setCurrentSession(updatedSession);
        const updatedSongs = songs.map((song) =>
          song.id === currentSong.id
            ? {
                ...song,
                sessions: song.sessions.map((sess) =>
                  sess.id === currentSession.id ? { ...sess, metronomeSettings } : sess
                ),
              }
            : song
        );
        setSongs(updatedSongs);
        setHasRealData(true);
      }
    },
    [currentSong, currentSession, songs]
  );

  // Restore recording from trash
  const handleRestoreRecording = useCallback(
    (trashedItem: TrashedRecording, _songs: Song[]) => {
      const { songId, sessionId, sectionId } = trashedItem.originalLocation;
      const recording = trashedItem.recording;

      setSongs((prevSongs) =>
        prevSongs.map((song) => {
          if (song.id !== songId) return song;

          return {
            ...song,
            sessions: song.sessions.map((sess) => {
              if (sess.id !== sessionId) return sess;

              if (sectionId === null) {
                return {
                  ...sess,
                  basicRecordings: [...(sess.basicRecordings || []), recording],
                };
              }

              return {
                ...sess,
                sections: (sess.sections || []).map((section) => {
                  if (section.id !== sectionId) return section;
                  return {
                    ...section,
                    recordedFiles: [...(section.recordedFiles || []), recording],
                  };
                }),
              };
            }),
          };
        })
      );
      setHasRealData(true);
    },
    []
  );

  // Permission request dialog
  const PermissionDialog = () => {
    if (!showPermissionDialog) return null;

    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 max-w-sm w-full`}>
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>
            파일 접근 권한
          </h3>
          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
            녹음 파일을 앱 삭제 후에도 유지하려면 "모든 파일 액세스" 권한이 필요합니다.
          </p>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-4`}>
            권한을 허용하지 않아도 앱은 사용 가능하지만, 앱 삭제 시 녹음 파일이 함께 삭제됩니다.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowPermissionDialog(false)}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              나중에
            </button>
            <button
              onClick={openStorageSettings}
              className="flex-1 px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors"
            >
              설정 열기
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Help button
  const HelpButton = () => {
    if (!onShowTutorial) return null;

    return (
      <button
        onClick={onShowTutorial}
        className="fixed left-4 z-40 flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 transition-all"
        style={{ bottom: 'calc(1rem + var(--sab, 0px))' }}
      >
        <HelpCircle className="w-4 h-4 text-blue-500" />
        <span className="text-sm text-gray-600">도움말</span>
      </button>
    );
  };

  // Exit toast (Android back button)
  const ExitToast = () => {
    if (!showExitToast) return null;

    return (
      <div className="fixed left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg transition-opacity" style={{ bottom: 'calc(5rem + var(--sab, 0px))' }}>
        한 번 더 누르면 앱을 종료합니다
      </div>
    );
  };

  // First-run tooltip overlay
  const FirstRunTooltip = () => {
    if (!showFirstRunTooltip) return null;

    const tooltipContent = [
      { step: 1, text: '오디오 파일을 업로드하세요', position: 'top' },
      { step: 2, text: '파형을 드래그해서 구간을 만드세요', position: 'middle' },
      { step: 3, text: '녹음 버튼을 눌러 녹음을 시작하세요', position: 'bottom' },
    ];

    const current = tooltipContent.find(t => t.step === tooltipStep);

    return (
      <div 
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
        onClick={dismissTooltip}
      >
        <div 
          className="bg-white rounded-2xl p-6 mx-4 max-w-sm shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 mb-4">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step === tooltipStep
                    ? 'bg-purple-500 text-white'
                    : step < tooltipStep
                    ? 'bg-purple-200 text-purple-600'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step}
              </div>
            ))}
          </div>
          
          <p className="text-lg font-medium text-gray-800 mb-4">
            {current?.text}
          </p>
          
          <div className="flex gap-3">
            {tooltipStep < 3 ? (
              <>
                <button
                  onClick={dismissTooltip}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-medium"
                >
                  건너뛰기
                </button>
                <button
                  onClick={() => setTooltipStep(tooltipStep + 1)}
                  className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg font-medium"
                >
                  다음
                </button>
              </>
            ) : (
              <button
                onClick={dismissTooltip}
                className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg font-medium"
              >
                시작하기
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (page === 'stats') {
    return (
      <>
        <StatsPage songs={songs} onBack={() => setPage('songs')} />
        <PermissionDialog />
        <ExitToast />
      </>
    );
  }

  if (page === 'songs') {
    return (
      <>
        <SongsPage
          songs={songs}
          onSelectSong={handleSelectSong}
          onDeleteSong={deleteSong}
          showAddSong={showAddSong}
          onShowAddSong={setShowAddSong}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onAddSong={handleAddSong}
          showConfirm={showConfirm}
          confirmMessage={confirmMessage}
          onConfirm={confirmAction || (() => {})}
          onCancelConfirm={() => setShowConfirm(false)}
          onShowStats={() => setPage('stats')}
          trashedRecordings={trashedRecordings}
          onRestoreFromTrash={restoreFromTrash}
          onRestoreRecording={handleRestoreRecording}
          onPermanentDelete={permanentlyDelete}
          onEmptyTrash={emptyTrash}
        />
        <HelpButton />
        <PermissionDialog />
        <ExitToast />
        <FirstRunTooltip />
      </>
    );
  }

  if (page === 'sessions' && currentSong) {
    return (
      <>
        <SessionsPage
          currentSong={currentSong}
          onBack={() => setPage('songs')}
          onSelectSession={(session) => openSession(currentSong, session)}
          onDeleteSession={deleteSession}
          showAddSession={showAddSession}
          onShowAddSession={setShowAddSession}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onAddSession={handleAddSession}
          showConfirm={showConfirm}
          confirmMessage={confirmMessage}
          onConfirm={confirmAction || (() => {})}
          onCancelConfirm={() => setShowConfirm(false)}
        />
        <HelpButton />
        <PermissionDialog />
        <ExitToast />
      </>
    );
  }

  if (page === 'practice' && currentSong && currentSession) {
    return (
      <>
        <PracticePage
          audioContext={audioContext}
          currentSong={currentSong}
          currentSession={currentSession}
          sections={sections}
          onSectionsChange={updateSections}
          onAudioDataChange={updateAudioData}
          onSheetMusicChange={updateSheetMusic}
          onBasicRecordingsChange={updateBasicRecordings}
          onMetronomeSettingsChange={updateMetronomeSettings}
          onBack={handleNavigateBack}
          trashFunctions={{
            trashedRecordings: getTrashForSession(currentSession.id),
            moveToTrash: (recording, sectionId, sectionIndex) =>
              moveToTrash(recording, currentSong.id, currentSession.id, sectionId, sectionIndex),
            restoreFromTrash,
            permanentlyDelete,
            emptyTrash,
          }}
        />
        <PermissionDialog />
        <ExitToast />
      </>
    );
  }

  return null;
}
