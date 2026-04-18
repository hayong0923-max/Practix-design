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
import MetronomePage from '@/components/pages/MetronomePage';
import TunerPage from '@/components/pages/TunerPage';
import { saveAudio } from '@/lib/audioStorage';

type Page = 'songs' | 'sessions' | 'practice' | 'stats' | 'metronome' | 'tuner';
const STORAGE_KEY = 'practix_songs';

interface MusicPracticeAppProps {
  onShowTutorial?: () => void;
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
  const [hasRealData, setHasRealData] = useState(false); // True if user has real data (not just default)
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);

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

  // Load songs on mount — web: localStorage + IndexedDB
  useEffect(() => {
    const loadData = async () => {
      await requestAllPermissions();
      const stored = localStorage.getItem(STORAGE_KEY);
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
          setSongs([{ id: 1, name: '새 곡', sessions: [] }]);
        }
      } else {
        setSongs([{ id: 1, name: '새 곡', sessions: [] }]);
      }
      setIsLoaded(true);
    };
    loadData();
  }, []);

  // Save songs whenever they change — web: localStorage
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

  // Back button navigation
  const handleNavigateBack = useCallback(() => {
    if (page === 'practice') {
      setPage('sessions');
    } else if (page === 'sessions') {
      setPage('songs');
    } else if (page === 'stats' || page === 'metronome' || page === 'tuner') {
      setPage('songs');
    }
  }, [page]);

  // Modal closers for back button (return true if modal was closed)
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
  ], [showConfirm, showAddSong, showAddSession, showPermissionDialog]);

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
      // 곡 내 모든 녹음을 휴지통으로 이동
      if (song) {
        song.sessions.forEach((session) => {
          // 구간 녹음
          session.sections?.forEach((section, sectionIndex) => {
            section.recordedFiles?.forEach((recording) => {
              moveToTrash(recording, songId, session.id, section.id, sectionIndex);
            });
          });
          // 기본 녹음
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
      setHasRealData(true); // User created real data, enable saving
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

        // 세션 내 모든 녹음을 휴지통으로 이동
        if (session) {
          // 구간 녹음
          session.sections?.forEach((section, sectionIndex) => {
            section.recordedFiles?.forEach((recording) => {
              moveToTrash(recording, currentSong.id, sessionId, section.id, sectionIndex);
            });
          });
          // 기본 녹음
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
      setHasRealData(true); // User created real data, enable saving
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
        setHasRealData(true); // User modified data
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

        // Web: sheet music image is stored inline (no separate file needed)
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

  // Restore recording from trash back to original location
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

              // If sectionId is null, add to basicRecordings
              if (sectionId === null) {
                return {
                  ...sess,
                  basicRecordings: [...(sess.basicRecordings || []), recording],
                };
              }

              // Otherwise, add to the specific section
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

  // BottomNav removed (Capacitor-only feature)
  const BottomNav = () => null;

  if (page === 'metronome') {
    return (
      <div className={`min-h-screen flex flex-col ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} safe-top pb-3 px-5 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>메트로놈</h1>
        </div>
        <MetronomePage isDark={isDark} />
        <div className="h-16" />
        <BottomNav />
        <PermissionDialog />
      </div>
    );
  }

  if (page === 'tuner') {
    return (
      <div className={`min-h-screen flex flex-col ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} safe-top pb-3 px-5 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>튜너</h1>
        </div>
        <TunerPage isDark={isDark} />
        <div className="h-16" />
        <BottomNav />
        <PermissionDialog />
      </div>
    );
  }

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
          onSelectSong={(song) => {
            setCurrentSong(song);
            setPage('sessions');
          }}
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
        <BottomNav />
        <PermissionDialog />
        <ExitToast />
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
          onBack={() => setPage('sessions')}
          trashFunctions={{
            trashedRecordings: getTrashForSession(currentSession.id),
            moveToTrash: (recording, sectionId, sectionIndex) =>
              moveToTrash(recording, currentSong.id, currentSession.id, sectionId, sectionIndex),
            restoreFromTrash,
            permanentlyDelete,
            emptyTrash,
          }}
        />
        {/* HelpButton hidden on practice page to avoid overlap with bottom controls */}
        <PermissionDialog />
        <ExitToast />
      </>
    );
  }

  return null;
}

// Bottom nav tab button
function NavTab({ icon, label, isActive, isDark, onClick }: {
  icon: string;
  label: string;
  isActive: boolean;
  isDark: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center py-2 ${
        isActive
          ? 'text-purple-500'
          : isDark ? 'text-gray-500' : 'text-gray-400'
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span className="text-[10px] mt-0.5 font-medium">{label}</span>
    </button>
  );
}
