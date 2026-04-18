'use client';

import { useState } from 'react';
import { Plus, ChevronRight, Trash2, BarChart3, Music } from 'lucide-react';
import { Song, TrashedRecording } from '@/types';
import Modal from '@/components/modals/Modal';
import ConfirmModal from '@/components/modals/ConfirmModal';
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-3xl mx-auto px-6 py-5 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">내 곡 목록</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{songs.length}개의 곡</p>
          </div>
          <div className="flex items-center gap-3">
            {onShowStats && (
              <button
                onClick={onShowStats}
                className="p-2.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                aria-label="통계"
              >
                <BarChart3 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => onShowAddSong(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-brand text-white rounded-lg font-medium text-sm hover:opacity-90 transition-opacity shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>곡 추가</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-8 pb-28">
        {songs.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
              <Music className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">아직 곡이 없습니다</h3>
            <p className="text-muted-foreground mb-6">첫 번째 곡을 추가해 연습을 시작하세요</p>
            <button
              onClick={() => onShowAddSong(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-brand text-white rounded-lg font-medium hover:opacity-90 transition-opacity shadow-sm"
            >
              <Plus className="w-4 h-4" />
              곡 추가하기
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {songs.map((song) => (
              <div key={song.id} className="group relative">
                <button
                  onClick={() => onSelectSong(song)}
                  className="w-full bg-card border border-border hover:border-foreground/20 rounded-xl p-5 flex justify-between items-center transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-brand-subtle flex items-center justify-center flex-shrink-0">
                      <Music className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-foreground text-base">{song.name}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">{song.sessions.length}개의 연습 세션</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSong(song.id);
                  }}
                  className="absolute top-1/2 -translate-y-1/2 right-14 opacity-0 group-hover:opacity-100 transition-all p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  aria-label="삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

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
