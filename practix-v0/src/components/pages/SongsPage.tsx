'use client';

import { useState } from 'react';
import { Plus, ChevronRight, Trash2, Moon, Sun, BarChart3, Menu, Settings, RotateCcw } from 'lucide-react';
import { Song, TrashedRecording } from '@/types';
import Modal from '@/components/modals/Modal';
import ConfirmModal from '@/components/modals/ConfirmModal';
import DrawerMenu from '@/components/ui/DrawerMenu';
import GlobalTrashView from '@/components/trash/GlobalTrashView';
import { useTheme } from '@/hooks/useTheme';
import { useDialogPreferences } from '@/hooks/useDialogPreferences';

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
  const { isDark, toggleTheme } = useTheme();
  const { preferences, updatePreference, resetAllConfirmations } = useDialogPreferences();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Check if any confirmations are currently disabled
  const hasDisabledConfirmations = preferences.skipTrashRestoreConfirm || preferences.skipTrashDeleteConfirm;

  // Native mobile style

  // Web style (original)
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-2 sm:p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-8">
          <div className="flex justify-between items-center mb-4 sm:mb-6 gap-2">
            <h1 className="text-xl sm:text-3xl font-bold text-gray-800 whitespace-nowrap">🎵 내 곡 목록</h1>
            <div className="flex items-center gap-2">
              {onShowStats && (
                <button
                  onClick={onShowStats}
                  className="bg-gray-100 hover:bg-gray-200 text-purple-600 px-3 sm:px-4 py-2 rounded-lg flex items-center gap-1 sm:gap-2 whitespace-nowrap flex-shrink-0"
                >
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" /><span className="hidden sm:inline">통계</span>
                </button>
              )}
              <button
                onClick={() => onShowAddSong(true)}
                className="bg-purple-500 hover:bg-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center gap-1 sm:gap-2 whitespace-nowrap flex-shrink-0"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" /><span>곡 추가</span>
              </button>
            </div>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {songs.map((song) => (
              <div key={song.id} className="relative group">
                <button
                  onClick={() => onSelectSong(song)}
                  className="w-full bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 p-4 sm:p-6 rounded-xl flex justify-between items-center transition"
                >
                  <div className="text-left flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 text-base sm:text-lg truncate">{song.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-600">{song.sessions.length}개의 연습</p>
                  </div>
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 flex-shrink-0 ml-2" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSong(song.id);
                  }}
                  className="absolute top-3 right-12 sm:top-4 sm:right-14 opacity-0 group-hover:opacity-100 transition bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
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
      <ConfirmModal show={showConfirm} message={confirmMessage} onConfirm={onConfirm} onCancel={onCancelConfirm} />
    </div>
  );
}
