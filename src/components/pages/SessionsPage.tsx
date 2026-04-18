'use client';

import { useState, useEffect } from 'react';
import { Plus, ChevronLeft, ChevronRight, Trash2, Edit3, Mic, Calendar, Layers } from 'lucide-react';
import { Song, Session, PracticeLog } from '@/types';
import Modal from '@/components/modals/Modal';
import ConfirmModal from '@/components/modals/ConfirmModal';
import { useTheme } from '@/hooks/useTheme';

interface SessionsPageProps {
  currentSong: Song;
  onBack: () => void;
  onSelectSession: (session: Session) => void;
  onDeleteSession: (sessionId: number) => void;
  showAddSession: boolean;
  onShowAddSession: (show: boolean) => void;
  inputValue: string;
  onInputChange: (value: string) => void;
  onAddSession: () => void;
  showConfirm: boolean;
  confirmMessage: string;
  onConfirm: () => void;
  onCancelConfirm: () => void;
}

interface SwipeState {
  sessionId: number | null;
  startX: number;
  currentX: number;
  swiping: boolean;
}

export default function SessionsPage({
  currentSong,
  onBack,
  onSelectSession,
  onDeleteSession,
  showAddSession,
  onShowAddSession,
  inputValue,
  onInputChange,
  onAddSession,
  showConfirm,
  confirmMessage,
  onConfirm,
  onCancelConfirm,
}: SessionsPageProps) {
  const { isDark } = useTheme();
  const [revealedSessionId, setRevealedSessionId] = useState<number | null>(null);
  const [swipeState, setSwipeState] = useState<SwipeState>({
    sessionId: null,
    startX: 0,
    currentX: 0,
    swiping: false,
  });
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [renameModal, setRenameModal] = useState<{ show: boolean; sessionId: number | null }>({
    show: false,
    sessionId: null,
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

  // Helper to get last practiced date for a session
  const getLastPracticed = (sessionId: number): string | null => {
    const sessionLogs = practiceLogs.filter(
      (log) => log.songId === currentSong.id && log.sessionId === sessionId
    );
    if (sessionLogs.length === 0) return null;
    const sorted = sessionLogs.sort((a, b) => b.timestamp - a.timestamp);
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

  // Get recording count for a session
  const getRecordingCount = (session: Session): number => {
    let count = session.basicRecordings?.length || 0;
    session.sections?.forEach((section) => {
      count += section.recordings?.length || 0;
    });
    return count;
  };

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent, sessionId: number) => {
    setSwipeState({
      sessionId,
      startX: e.touches[0].clientX,
      currentX: e.touches[0].clientX,
      swiping: true,
    });

    // Long press detection
    const timer = setTimeout(() => {
      setRevealedSessionId(sessionId);
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
      setRevealedSessionId(swipeState.sessionId);
    } else if (swipeDistance < -80 && revealedSessionId === swipeState.sessionId) {
      // Swipe right - hide actions
      setRevealedSessionId(null);
    }

    setSwipeState({
      sessionId: null,
      startX: 0,
      currentX: 0,
      swiping: false,
    });
  };

  // Calculate swipe offset for animation
  const getSwipeOffset = (sessionId: number): number => {
    if (revealedSessionId === sessionId) return -120;
    if (swipeState.sessionId === sessionId && swipeState.swiping) {
      const diff = swipeState.startX - swipeState.currentX;
      return Math.max(-120, Math.min(0, -diff));
    }
    return 0;
  };

  // Handle rename
  const handleRename = (sessionId: number, currentName: string) => {
    setRenameValue(currentName);
    setRenameModal({ show: true, sessionId });
    setRevealedSessionId(null);
  };

  // Close revealed actions when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (revealedSessionId !== null) {
        setRevealedSessionId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [revealedSessionId]);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-zinc-950' : 'bg-zinc-50'}`}>
      {/* Top Bar */}
      <header
        className={`sticky top-0 z-20 ${isDark ? 'bg-zinc-950/95' : 'bg-zinc-50/95'} backdrop-blur-sm border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Back Button */}
          <button
            onClick={onBack}
            className={`p-2 -ml-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-200 text-zinc-500'
            }`}
            aria-label="뒤로 가기"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Song Name */}
          <div className="flex-1 min-w-0">
            <h1 className={`text-lg font-semibold truncate ${isDark ? 'text-white' : 'text-zinc-900'}`}>
              {currentSong.name}
            </h1>
            <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
              {currentSong.sessions.length}개 세션
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="pb-24 px-4 pt-4">
        {currentSong.sessions.length === 0 ? (
          <div className={`text-center py-20 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
            <Layers className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p className="text-base font-medium mb-1">아직 세션이 없습니다</p>
            <p className="text-sm opacity-75">+ 버튼을 눌러 세션을 추가하세요</p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentSong.sessions.map((session) => {
              const lastPracticed = getLastPracticed(session.id);
              const recordingCount = getRecordingCount(session);
              const swipeOffset = getSwipeOffset(session.id);

              return (
                <div key={session.id} className="relative overflow-hidden rounded-xl">
                  {/* Action buttons (revealed on swipe/long-press) */}
                  <div
                    className={`absolute inset-y-0 right-0 flex items-center gap-1 pr-2 transition-opacity ${
                      revealedSessionId === session.id ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRename(session.id, session.name);
                      }}
                      className={`p-3 rounded-lg ${isDark ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-zinc-200 hover:bg-zinc-300'}`}
                    >
                      <Edit3 className={`w-4 h-4 ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRevealedSessionId(null);
                        onDeleteSession(session.id);
                      }}
                      className="p-3 rounded-lg bg-red-500 hover:bg-red-600"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  </div>

                  {/* Card */}
                  <div
                    onClick={() => {
                      if (revealedSessionId === session.id) {
                        setRevealedSessionId(null);
                      } else {
                        onSelectSession(session);
                      }
                    }}
                    onTouchStart={(e) => handleTouchStart(e, session.id)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    style={{ transform: `translateX(${swipeOffset}px)` }}
                    className={`relative p-4 rounded-xl cursor-pointer transition-all ${
                      isDark ? 'bg-zinc-900 active:bg-zinc-800' : 'bg-white active:bg-zinc-50 shadow-sm'
                    } ${swipeState.swiping && swipeState.sessionId === session.id ? '' : 'transition-transform'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        {/* Session Name */}
                        <h3 className={`font-semibold text-base truncate mb-2 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                          {session.name}
                        </h3>

                        {/* Meta info */}
                        <div className="flex items-center gap-3 text-xs">
                          {/* Section count */}
                          <span className={isDark ? 'text-zinc-500' : 'text-zinc-400'}>
                            {session.sections?.length || 0}개 구간
                          </span>

                          {/* Recording count */}
                          {recordingCount > 0 && (
                            <span className={`flex items-center gap-1 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                              <Mic className="w-3 h-3" />
                              {recordingCount}
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
      </main>

      {/* FAB - Add Session */}
      <button
        onClick={() => onShowAddSession(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-violet-500 hover:bg-violet-600 active:bg-violet-700 text-white rounded-full shadow-lg shadow-violet-500/30 flex items-center justify-center transition-colors z-10"
        aria-label="세션 추가"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Modals */}
      <Modal
        show={showAddSession}
        onClose={() => {
          onShowAddSession(false);
          onInputChange('');
        }}
        title="새 연습 세션 추가"
        inputValue={inputValue}
        onInputChange={onInputChange}
        onSubmit={onAddSession}
      />

      {/* Rename Modal */}
      <Modal
        show={renameModal.show}
        onClose={() => {
          setRenameModal({ show: false, sessionId: null });
          setRenameValue('');
        }}
        title="세션 이름 변경"
        inputValue={renameValue}
        onInputChange={setRenameValue}
        onSubmit={() => {
          // Note: This would need a prop for rename functionality
          setRenameModal({ show: false, sessionId: null });
          setRenameValue('');
        }}
      />

      <ConfirmModal show={showConfirm} message={confirmMessage} onConfirm={onConfirm} onCancel={onCancelConfirm} />
    </div>
  );
}
