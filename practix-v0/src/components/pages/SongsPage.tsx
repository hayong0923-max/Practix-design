'use client';

import { useState } from 'react';
import { Plus, ChevronRight, Trash2, BarChart3, Music } from 'lucide-react';
import { Song, TrashedRecording } from '@/types';
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

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-purple-50 to-blue-50'}`}>
      {/* Header with Stats Icon */}
      <div className={`sticky top-0 z-10 ${isDark ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur-sm border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isDark ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
              <Music className={`w-6 h-6 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
            </div>
            <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              내 곡 목록
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Stats Icon - Always visible */}
            {onShowStats && (
              <button
                onClick={onShowStats}
                className={`p-2.5 rounded-xl transition-colors ${
                  isDark 
                    ? 'bg-gray-800 hover:bg-gray-700 text-purple-400' 
                    : 'bg-purple-100 hover:bg-purple-200 text-purple-600'
                }`}
                title="연습 통계"
              >
                <BarChart3 className="w-5 h-5" />
              </button>
            )}
            
            {/* Add Song Button */}
            <button
              onClick={() => onShowAddSong(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">곡 추가</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        {songs.length === 0 ? (
          <div className={`text-center py-16 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <Music className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium mb-2">아직 곡이 없습니다</p>
            <p className="text-sm">곡 추가 버튼을 눌러 시작하세요</p>
          </div>
        ) : (
          <div className="space-y-3">
            {songs.map((song) => (
              <div key={song.id} className="relative group">
                <button
                  onClick={() => onSelectSong(song)}
                  className={`w-full p-4 rounded-xl flex justify-between items-center transition-all ${
                    isDark 
                      ? 'bg-gray-800 hover:bg-gray-750 active:bg-gray-700' 
                      : 'bg-white hover:bg-gray-50 active:bg-gray-100 shadow-sm'
                  }`}
                >
                  <div className="text-left flex-1 min-w-0">
                    <h3 className={`font-semibold text-base truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {song.name}
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {song.sessions.length === 0 
                        ? '세션 없음' 
                        : song.sessions.length === 1 
                        ? '1개 세션' 
                        : `${song.sessions.length}개 세션`}
                    </p>
                  </div>
                  <ChevronRight className={`w-5 h-5 flex-shrink-0 ml-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                </button>
                
                {/* Delete button on hover */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSong(song.id);
                  }}
                  className={`absolute top-1/2 -translate-y-1/2 right-12 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg ${
                    isDark ? 'bg-red-500/20 hover:bg-red-500/30' : 'bg-red-50 hover:bg-red-100'
                  }`}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Trash link */}
        {trashedRecordings.length > 0 && (
          <button
            onClick={() => setShowTrash(true)}
            className={`mt-6 w-full p-3 rounded-xl text-sm ${
              isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
            }`}
          >
            휴지통 ({trashedRecordings.length}개 항목)
          </button>
        )}
      </div>

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
      
      <ConfirmModal 
        show={showConfirm} 
        message={confirmMessage} 
        onConfirm={onConfirm} 
        onCancel={onCancelConfirm} 
      />

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
