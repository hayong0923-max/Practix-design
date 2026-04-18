'use client';

import { Plus, ChevronRight, Trash2, ChevronLeft, Layers } from 'lucide-react';
import { Song, Session } from '@/types';
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-3xl mx-auto px-6 py-5">
          <button 
            onClick={onBack} 
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
          >
            <ChevronLeft className="w-4 h-4" />
            뒤로
          </button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{currentSong.name}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">{currentSong.sessions.length}개의 세션</p>
            </div>
            <button
              onClick={() => onShowAddSession(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-brand text-white rounded-lg font-medium text-sm hover:opacity-90 transition-opacity shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>세션 추가</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-8 pb-28">
        {currentSong.sessions.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-6">
              <Layers className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">아직 세션이 없습니다</h3>
            <p className="text-muted-foreground mb-6">새로운 연습 세션을 추가해보세요</p>
            <button
              onClick={() => onShowAddSession(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-brand text-white rounded-lg font-medium hover:opacity-90 transition-opacity shadow-sm"
            >
              <Plus className="w-4 h-4" />
              세션 추가하기
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {currentSong.sessions.map((session) => (
              <div key={session.id} className="group relative">
                <button
                  onClick={() => onSelectSession(session)}
                  className="w-full bg-card border border-border hover:border-foreground/20 rounded-xl p-5 flex justify-between items-center transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-brand-subtle flex items-center justify-center flex-shrink-0">
                      <Layers className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-foreground text-base">{session.name}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">{session.sections?.length || 0}개 구간</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
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
      <ConfirmModal show={showConfirm} message={confirmMessage} onConfirm={onConfirm} onCancel={onCancelConfirm} />
    </div>
  );
}
