'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, BarChart2, Trash2, Edit3, Music2, Calendar, Mic, ChevronRight } from 'lucide-react';
import { Song, TrashedRecording, PracticeLog } from '@/types';
import Modal from '@/components/modals/Modal';
import ConfirmModal from '@/components/modals/ConfirmModal';
import GlobalTrashView from '@/components/trash/GlobalTrashView';
import { useTheme } from '@/hooks/useTheme';

interface SongsPageProps {
  songs: Song[];
  onSelectSong: (song: Song) => void;
  onDeleteSong: (songId: number) => void;
  showAddSong: boolean;
  onShowAddSong: (show: boolean) => void;
  inputValue: string;
  onInputChange: (value: string) => void;
  onAddSong: () => void;
  showConfirm: boolean;
  confirmMessage: string;
  onConfirm: () => void;
  onCancelConfirm: () => void;
  onShowStats?: () => void;
  // Trash functionality
  trashedRecordings?: TrashedRecording[];
  onRestoreFromTrash?: (recordingId: number) => TrashedRecording | null;
  onRestoreRecording?: (trashedItem: TrashedRecording, songs: Song[]) => void;
  onPermanentDelete?: (recordingId: number) => void;
  onEmptyTrash?: () => void;
}

interface SwipeState {
  songId: number | null;
  startX: number;
  currentX: number;
  swiping: boolean;
}

export default function SongsPage({
  songs,
  onSelectSong,
  onDeleteSong,
  showAddSong,
  onShowAddSong,
  inputValue,
  onInputChange,
  onAddSong,
  showConfirm,
  confirmMessage,
  onConfirm,
  onCancelConfirm,
  onShowStats,
  trashedRecordings = [],
  onRestoreFromTrash,
  onRestoreRecording,
  onPermanentDelete,
  onEmptyTrash,
}: SongsPageProps) {
  const { isDark } = useTheme();
  const [showTrash, setShowTrash] = useState(false);
  const [revealedSongId, setRevealedSongId] = useState<number | null>(null);
  const [swipeState, setSwipeState] = useState<SwipeState>({
    songId: null,
    startX: 0,
    currentX: 0,
    swiping: false,
  });
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [renameModal, setRenameModal] = useState<{ show: boolean; songId: number | null }>({
    show: false,
    songId: null,
  });
  const [renameValue, setRenameValue] = useState('');

  // Get practice logs from localStorage
  const [practiceLogs, setPracticeLogs] = useState<PracticeLog[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('practix_practice_logs');
      if (stored) {
        setPracticeLogs(JSON.parse(stored));
      }
    } catch {
      // Ignore errors
    }
  }, []);

  // Helper to get last practiced date for a song
  const getLastPracticed = (songId: number): string | null => {
    const songLogs = practiceLogs.filter((log) => log.songId === songId);
    if (songLogs.length === 0) return null;
    const sorted = songLogs.sort((a, b) => b.timestamp - a.timestamp);
    return sorted[0].date;
  };

  // Helper to format relative date
  const formatRelativeDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '어제';
    if (diffDays < 7) return `${diffDays}일 전`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
    return `${Math.floor(diffDays / 30)}개월 전`;
  };

  // Get total recording count for a song
  const getTotalRecordings = (song: Song): number => {
    let count = 0;
    song.sessions.forEach((session) => {
      // Basic recordings
      count += session.basicRecordings?.length || 0;
      // Section recordings
      session.sections?.forEach((section) => {
        count += section.recordings?.length || 0;
      });
    });
    return count;
  };

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent, songId: number) => {
    setSwipeState({
      songId,
      startX: e.touches[0].clientX,
      currentX: e.touches[0].clientX,
      swiping: true,
    });

    // Long press detection
    const timer = setTimeout(() => {
      setRevealedSongId(songId);
    }, 500);
    setLongPressTimer(timer);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swipeState.swiping) return;

    // Cancel long press on movement
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    setSwipeState((prev) => ({
      ...prev,
      currentX: e.touches[0].clientX,
    }));
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    const swipeDistance = swipeState.startX - swipeState.currentX;
    if (swipeDistance > 80) {
      // Swipe left - reveal actions
      setRevealedSongId(swipeState.songId);
    } else if (swipeDistance < -80 && revealedSongId === swipeState.songId) {
      // Swipe right - hide actions
      setRevealedSongId(null);
    }

    setSwipeState({
      songId: null,
      startX: 0,
      currentX: 0,
      swiping: false,
    });
  };

  // Calculate swipe offset for animation
  const getSwipeOffset = (songId: number): number => {
    if (revealedSongId === songId) return -120;
    if (swipeState.songId === songId && swipeState.swiping) {
      const diff = swipeState.startX - swipeState.currentX;
      return Math.max(-120, Math.min(0, -diff));
    }
    return 0;
  };

  // Handle rename
  const handleRename = (songId: number, currentName: string) => {
    setRenameValue(currentName);
    setRenameModal({ show: true, songId });
    setRevealedSongId(null);
  };

  // Close revealed actions when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (revealedSongId !== null) {
        setRevealedSongId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [revealedSongId]);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-zinc-950' : 'bg-zinc-50'}`}>
      {/* Top Bar */}
      <header
        className={`sticky top-0 z-20 ${isDark ? 'bg-zinc-950/95' : 'bg-zinc-50/95'} backdrop-blur-sm border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}
      >
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${isDark ? 'bg-violet-500/20' : 'bg-violet-100'}`}>
              <Music2 className={`w-5 h-5 ${isDark ? 'text-violet-400' : 'text-violet-600'}`} />
            </div>
            <span className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>Practix</span>
          </div>

          {/* Stats Icon */}
          {onShowStats && (
            <button
              onClick={onShowStats}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200' : 'hover:bg-zinc-200 text-zinc-500 hover:text-zinc-700'
              }`}
              aria-label="통계 보기"
            >
              <BarChart2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="pb-24 px-4 pt-4">
        {songs.length === 0 ? (
          <div className={`text-center py-20 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
            <Music2 className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p className="text-base font-medium mb-1">아직 곡이 없습니다</p>
            <p className="text-sm opacity-75">+ 버튼을 눌러 곡을 추가하세요</p>
          </div>
        ) : (
          <div className="space-y-3">
            {songs.map((song) => {
              const lastPracticed = getLastPracticed(song.id);
              const totalRecordings = getTotalRecordings(song);
              const swipeOffset = getSwipeOffset(song.id);

              return (
                <div key={song.id} className="relative overflow-hidden rounded-xl">
                  {/* Action buttons (revealed on swipe/long-press) */}
                  <div
                    className={`absolute inset-y-0 right-0 flex items-center gap-1 pr-2 transition-opacity ${
                      revealedSongId === song.id ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRename(song.id, song.name);
                      }}
                      className={`p-3 rounded-lg ${isDark ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-zinc-200 hover:bg-zinc-300'}`}
                    >
                      <Edit3 className={`w-4 h-4 ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRevealedSongId(null);
                        onDeleteSong(song.id);
                      }}
                      className="p-3 rounded-lg bg-red-500 hover:bg-red-600"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  </div>

                  {/* Card */}
                  <div
                    onClick={() => {
                      if (revealedSongId === song.id) {
                        setRevealedSongId(null);
                      } else {
                        onSelectSong(song);
                      }
                    }}
                    onTouchStart={(e) => handleTouchStart(e, song.id)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    style={{ transform: `translateX(${swipeOffset}px)` }}
                    className={`relative p-4 rounded-xl cursor-pointer transition-all ${
                      isDark ? 'bg-zinc-900 active:bg-zinc-800' : 'bg-white active:bg-zinc-50 shadow-sm'
                    } ${swipeState.swiping && swipeState.songId === song.id ? '' : 'transition-transform'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        {/* Song Name */}
                        <h3 className={`font-semibold text-base truncate mb-2 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                          {song.name}
                        </h3>

                        {/* Meta info */}
                        <div className="flex items-center gap-3 text-xs">
                          {/* Session count */}
                          <span className={isDark ? 'text-zinc-500' : 'text-zinc-400'}>
                            {song.sessions.length === 0
                              ? '세션 없음'
                              : song.sessions.length === 1
                                ? '1개 세션'
                                : `${song.sessions.length}개 세션`}
                          </span>

                          {/* Recording count */}
                          {totalRecordings > 0 && (
                            <span className={`flex items-center gap-1 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                              <Mic className="w-3 h-3" />
                              {totalRecordings}
                            </span>
                          )}

                          {/* Last practiced */}
                          {lastPracticed && (
                            <span className={`flex items-center gap-1 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                              <Calendar className="w-3 h-3" />
                              {formatRelativeDate(lastPracticed)}
                            </span>
                          )}
                        </div>
                      </div>

                      <ChevronRight className={`w-5 h-5 flex-shrink-0 ml-3 ${isDark ? 'text-zinc-600' : 'text-zinc-300'}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Trash link */}
        {trashedRecordings.length > 0 && (
          <button
            onClick={() => setShowTrash(true)}
            className={`mt-6 w-full p-3 rounded-xl text-sm flex items-center justify-center gap-2 ${
              isDark ? 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            휴지통 ({trashedRecordings.length}개 항목)
          </button>
        )}
      </main>

      {/* FAB - Add Song */}
      <button
        onClick={() => onShowAddSong(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-violet-500 hover:bg-violet-600 active:bg-violet-700 text-white rounded-full shadow-lg shadow-violet-500/30 flex items-center justify-center transition-colors z-10"
        aria-label="곡 추가"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Modals */}
      <Modal
        show={showAddSong}
        onClose={() => {
          onShowAddSong(false);
          onInputChange('');
        }}
        title="새 곡 추가"
        inputValue={inputValue}
        onInputChange={onInputChange}
        onSubmit={onAddSong}
      />

      {/* Rename Modal - reusing the same Modal component */}
      <Modal
        show={renameModal.show}
        onClose={() => {
          setRenameModal({ show: false, songId: null });
          setRenameValue('');
        }}
        title="곡 이름 변경"
        inputValue={renameValue}
        onInputChange={setRenameValue}
        onSubmit={() => {
          // Note: This would need a prop for rename functionality
          // For now, just close the modal
          setRenameModal({ show: false, songId: null });
          setRenameValue('');
        }}
      />

      <ConfirmModal show={showConfirm} message={confirmMessage} onConfirm={onConfirm} onCancel={onCancelConfirm} />

      {/* Trash View */}
      {showTrash && onRestoreFromTrash && onRestoreRecording && onPermanentDelete && onEmptyTrash && (
        <GlobalTrashView
          trashedRecordings={trashedRecordings}
          songs={songs}
          onClose={() => setShowTrash(false)}
          onRestore={(trashedItem) => {
            const restored = onRestoreFromTrash(trashedItem.recording.id);
            if (restored) {
              onRestoreRecording(restored, songs);
            }
          }}
          onPermanentDelete={onPermanentDelete}
          onEmptyTrash={onEmptyTrash}
        />
      )}
    </div>
  );
}
