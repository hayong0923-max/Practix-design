'use client';

import { Plus, ChevronRight, Trash2, ChevronLeft } from 'lucide-react';
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

  // Native mobile style

  // Web style (original)
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-2 sm:p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-8">
          <button onClick={onBack} className="text-purple-600 mb-3 sm:mb-4 flex items-center gap-1 text-sm sm:text-base">
            ← 뒤로
          </button>
          <div className="flex justify-between items-center mb-4 sm:mb-6 gap-2">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-3xl font-bold text-gray-800 truncate">{currentSong.name}</h1>
              <p className="text-sm sm:text-base text-gray-600">연습 세션</p>
            </div>
            <button
              onClick={() => onShowAddSession(true)}
              className="bg-purple-500 hover:bg-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center gap-1 sm:gap-2 whitespace-nowrap flex-shrink-0"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>세션 추가</span>
            </button>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {currentSong.sessions.map((session) => (
              <div key={session.id} className="relative group">
                <button
                  onClick={() => onSelectSession(session)}
                  className="w-full bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 p-4 sm:p-6 rounded-xl flex justify-between items-center transition"
                >
                  <div className="text-left flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 text-base sm:text-lg truncate">{session.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-600">{session.sections?.length || 0}개 구간</p>
                  </div>
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 flex-shrink-0 ml-2" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
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
