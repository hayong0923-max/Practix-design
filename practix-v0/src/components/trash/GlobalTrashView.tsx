'use client';

import { useState, useMemo } from 'react';
import { Trash2, ChevronRight, ChevronDown, RotateCcw, Music, Clock, Disc } from 'lucide-react';
import { TrashedRecording, Song, getDaysUntilDeletion } from '@/types';
import { useTheme } from '@/hooks/useTheme';
import { useDialogPreferences } from '@/hooks/useDialogPreferences';
import ConfirmModal from '@/components/modals/ConfirmModal';

interface GlobalTrashViewProps {
  trashedRecordings: TrashedRecording[];
  songs: Song[];
  onRestore: (recordingId: number) => TrashedRecording | null;
  onPermanentDelete: (recordingId: number) => void;
  onEmptyTrash: () => void;
  onRestoreRecording?: (trashedItem: TrashedRecording, songs: Song[]) => void;
}

// Hierarchical structure for display
interface SectionData {
  sectionName: string;
  recordings: TrashedRecording[];
}

interface SessionData {
  sessionName: string;
  sections: Record<number, SectionData>;
  basicRecordings: TrashedRecording[];
}

interface SongData {
  songName: string;
  sessions: Record<number, SessionData>;
}

type TrashHierarchy = Record<number, SongData>;

export default function GlobalTrashView({
  trashedRecordings,
  songs,
  onRestore,
  onPermanentDelete,
  onEmptyTrash,
  onRestoreRecording,
}: GlobalTrashViewProps) {
  const { isDark } = useTheme();
  const { preferences, updatePreference } = useDialogPreferences();
  const [expandedSongs, setExpandedSongs] = useState<Set<number>>(new Set());
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmType, setConfirmType] = useState<'restore' | 'delete' | 'empty'>('delete');

  // Helper functions (defined before useMemo that uses them)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Build hierarchical structure from flat trash list
  const hierarchy = useMemo(() => {
    const result: TrashHierarchy = {};

    trashedRecordings.forEach((item) => {
      const { songId, sessionId, sectionId } = item.originalLocation;

      // Find song name (might be deleted)
      const song = songs.find((s) => s.id === songId);
      const songName = song?.name || '삭제된 곡';

      // Find session name
      const session = song?.sessions.find((s) => s.id === sessionId);
      const sessionName = session?.name || '삭제된 세션';

      // Initialize song level
      if (!result[songId]) {
        result[songId] = { songName, sessions: {} };
      }

      // Initialize session level
      if (!result[songId].sessions[sessionId]) {
        result[songId].sessions[sessionId] = {
          sessionName,
          sections: {},
          basicRecordings: [],
        };
      }

      // Add to appropriate location
      if (sectionId === null) {
        // Basic recording
        result[songId].sessions[sessionId].basicRecordings.push(item);
      } else {
        // Section recording
        if (!result[songId].sessions[sessionId].sections[sectionId]) {
          // Find section name
          const section = session?.sections?.find((s) => s.id === sectionId);
          const sectionName = section
            ? `${formatTime(section.start)} - ${formatTime(section.end)}`
            : '삭제된 구간';
          result[songId].sessions[sessionId].sections[sectionId] = {
            sectionName,
            recordings: [],
          };
        }
        result[songId].sessions[sessionId].sections[sectionId].recordings.push(item);
      }
    });

    return result;
  }, [trashedRecordings, songs]);

  const toggleSong = (songId: number) => {
    setExpandedSongs((prev) => {
      const next = new Set(prev);
      if (next.has(songId)) {
        next.delete(songId);
      } else {
        next.add(songId);
      }
      return next;
    });
  };

  const toggleSession = (songId: number, sessionId: number) => {
    const key = `${songId}-${sessionId}`;
    setExpandedSessions((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const doRestore = (item: TrashedRecording) => {
    const restored = onRestore(item.recording.id);
    if (restored && onRestoreRecording) {
      onRestoreRecording(restored, songs);
    }
  };

  const handleRestore = (item: TrashedRecording) => {
    // Skip confirmation if user opted out
    if (preferences.skipTrashRestoreConfirm) {
      doRestore(item);
      return;
    }

    setConfirmType('restore');
    setConfirmMessage(`"${item.recording.name || '녹음'}"을(를) 원래 위치로 복원하시겠습니까?`);
    setConfirmAction(() => () => {
      doRestore(item);
      setShowConfirm(false);
    });
    setShowConfirm(true);
  };

  const handleDelete = (recordingId: number) => {
    // Skip confirmation if user opted out
    if (preferences.skipTrashDeleteConfirm) {
      onPermanentDelete(recordingId);
      return;
    }

    setConfirmType('delete');
    setConfirmMessage('이 녹음을 영구 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.');
    setConfirmAction(() => () => {
      onPermanentDelete(recordingId);
      setShowConfirm(false);
    });
    setShowConfirm(true);
  };

  const handleEmptyTrash = () => {
    // Always show confirmation for empty trash (no skip option)
    setConfirmType('empty');
    setConfirmMessage(`휴지통의 모든 녹음(${trashedRecordings.length}개)을 영구 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.`);
    setConfirmAction(() => () => {
      onEmptyTrash();
      setShowConfirm(false);
    });
    setShowConfirm(true);
  };

  const handleDontAskAgain = (checked: boolean) => {
    if (confirmType === 'restore') {
      updatePreference('skipTrashRestoreConfirm', checked);
    } else if (confirmType === 'delete') {
      updatePreference('skipTrashDeleteConfirm', checked);
    }
  };

  const RecordingItem = ({ item }: { item: TrashedRecording }) => {
    const daysLeft = getDaysUntilDeletion(item.deletedAt);

    return (
      <div
        className={`flex items-center justify-between py-2 px-3 rounded-lg ${
          isDark ? 'bg-gray-800' : 'bg-gray-50'
        }`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Disc className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            <span className={`text-sm truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {item.recording.name || '녹음'}
            </span>
          </div>
          <div className={`flex items-center gap-2 mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            <Clock className="w-3 h-3" />
            <span>{formatDate(item.deletedAt)}</span>
            <span className={daysLeft <= 2 ? 'text-red-500' : ''}>
              ({daysLeft}일 후 삭제)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleRestore(item)}
            className={`p-2 rounded-lg ${
              isDark
                ? 'text-green-400 active:bg-gray-700'
                : 'text-green-600 active:bg-gray-200'
            }`}
            title="복원"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(item.recording.id)}
            className={`p-2 rounded-lg ${
              isDark
                ? 'text-red-400 active:bg-gray-700'
                : 'text-red-500 active:bg-gray-200'
            }`}
            title="영구 삭제"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  if (trashedRecordings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <Trash2 className={`w-16 h-16 mb-4 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
        <p className={`text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          휴지통이 비어 있습니다
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with empty trash button */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${
        isDark ? 'border-gray-800' : 'border-gray-200'
      }`}>
        <div className="flex items-center gap-2">
          <Trash2 className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
            휴지통 ({trashedRecordings.length})
          </span>
        </div>
        <button
          onClick={handleEmptyTrash}
          className={`px-3 py-1.5 text-sm rounded-lg ${
            isDark
              ? 'bg-red-900/30 text-red-400 active:bg-red-900/50'
              : 'bg-red-50 text-red-600 active:bg-red-100'
          }`}
        >
          비우기
        </button>
      </div>

      {/* Hierarchical list */}
      <div className="flex-1 overflow-y-auto p-2">
        {Object.entries(hierarchy).map(([songIdStr, songData]: [string, SongData]) => {
          const songId = Number(songIdStr);
          const isSongExpanded = expandedSongs.has(songId);

          return (
            <div key={songId} className="mb-2">
              {/* Song level */}
              <button
                onClick={() => toggleSong(songId)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg ${
                  isDark ? 'active:bg-gray-800' : 'active:bg-gray-100'
                }`}
              >
                {isSongExpanded ? (
                  <ChevronDown className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                ) : (
                  <ChevronRight className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                )}
                <Music className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-500'}`} />
                <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                  {songData.songName}
                </span>
              </button>

              {/* Sessions under this song */}
              {isSongExpanded && (
                <div className="ml-4">
                  {Object.entries(songData.sessions).map(([sessionIdStr, sessionData]: [string, SessionData]) => {
                    const sessionId = Number(sessionIdStr);
                    const sessionKey = `${songId}-${sessionId}`;
                    const isSessionExpanded = expandedSessions.has(sessionKey);
                    const totalInSession =
                      sessionData.basicRecordings.length +
                      Object.values(sessionData.sections).reduce(
                        (sum, sec) => sum + sec.recordings.length,
                        0
                      );

                    return (
                      <div key={sessionId} className="mb-1">
                        {/* Session level */}
                        <button
                          onClick={() => toggleSession(songId, sessionId)}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg ${
                            isDark ? 'active:bg-gray-800' : 'active:bg-gray-100'
                          }`}
                        >
                          {isSessionExpanded ? (
                            <ChevronDown className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                          ) : (
                            <ChevronRight className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                          )}
                          <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {sessionData.sessionName}
                          </span>
                          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            ({totalInSession})
                          </span>
                        </button>

                        {/* Sections and basic recordings under this session */}
                        {isSessionExpanded && (
                          <div className="ml-4 space-y-1">
                            {/* Sections */}
                            {Object.entries(sessionData.sections).map(([sectionIdStr, sectionData]: [string, SectionData]) => (
                              <div key={sectionIdStr}>
                                <div className={`text-xs px-3 py-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                  구간 {sectionData.sectionName}
                                </div>
                                <div className="space-y-1">
                                  {sectionData.recordings.map((item) => (
                                    <RecordingItem key={item.recording.id} item={item} />
                                  ))}
                                </div>
                              </div>
                            ))}

                            {/* Basic recordings */}
                            {sessionData.basicRecordings.length > 0 && (
                              <div>
                                <div className={`text-xs px-3 py-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                  기본 녹음
                                </div>
                                <div className="space-y-1">
                                  {sessionData.basicRecordings.map((item) => (
                                    <RecordingItem key={item.recording.id} item={item} />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ConfirmModal
        show={showConfirm}
        message={confirmMessage}
        onConfirm={confirmAction || (() => {})}
        onCancel={() => setShowConfirm(false)}
        confirmText={confirmType === 'restore' ? '복원' : '삭제'}
        confirmColor={confirmType === 'restore' ? 'green' : 'red'}
        showDontAskAgain={confirmType !== 'empty'}
        onDontAskAgainChange={handleDontAskAgain}
      />
    </div>
  );
}
