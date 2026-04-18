'use client';

import React, { memo, useState } from 'react';
import { usePracticeContext } from '@/contexts/PracticeContext';
import SheetMusicSection from '@/components/practice/SheetMusicSection';
import PitchComparisonSection from '@/components/practice/PitchComparisonSection';
import TagManagementModal from '@/components/modals/TagManagementModal';
import { SheetMusicEditor } from '@/components/sheetMusic';
import { SheetMusicViewer } from '@/components/sheetMusic';

interface SessionMetaProps {
  selectedBasicRecordingId?: number | null;
}

const SessionMeta = memo(function SessionMeta({ selectedBasicRecordingId }: SessionMetaProps) {
  const ctx = usePracticeContext();
  const [showTagManagement, setShowTagManagement] = useState(false);
  const [showSheetMusicEditor, setShowSheetMusicEditor] = useState(false);
  const [showPitchComparison, setShowPitchComparison] = useState(false);

  // --- Web layout ---
  return (
    <>
      {/* Sheet Music Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800">악보</h3>
          <button
            onClick={() => setShowSheetMusicEditor(true)}
            className="text-sm text-purple-500 hover:text-purple-600"
          >
            {ctx.currentSession.sheetMusic ? '편집' : '추가'}
          </button>
        </div>
        {ctx.resolvedSheetMusic ? (
          <SheetMusicViewer
            sheetMusic={ctx.resolvedSheetMusic}
            sections={ctx.sections}
            currentSectionId={ctx.selectedSection?.id || null}
            currentTime={ctx.currentTime}
            onSectionClick={(sectionId) => {
              const section = ctx.sections.find(s => s.id === sectionId);
              if (section) {
                ctx.setSelectedSection(section);
                ctx.setCurrentTime(section.start);
                ctx.playAudio(section.start);
              }
            }}
          />
        ) : (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl text-gray-400">
            <p className="text-sm">악보를 추가하여 구간과 연결하세요</p>
          </div>
        )}
      </div>

      {/* Tag Management Modal */}
      <TagManagementModal
        show={showTagManagement}
        onClose={() => setShowTagManagement(false)}
        customTags={ctx.customTags}
        onAddTag={ctx.addTag}
        onUpdateTag={ctx.updateTag}
        onDeleteTag={ctx.deleteTag}
        isLabelTaken={ctx.isLabelTaken}
      />

      {/* Sheet Music Editor Modal */}
      {showSheetMusicEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${ctx.isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            <div className={`flex items-center justify-between p-4 border-b ${ctx.isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-lg font-semibold ${ctx.isDark ? 'text-white' : 'text-gray-900'}`}>악보 편집</h2>
              <button
                onClick={() => setShowSheetMusicEditor(false)}
                className={`p-1 rounded-lg ${ctx.isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <span className={`text-2xl ${ctx.isDark ? 'text-gray-400' : 'text-gray-500'}`}>×</span>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <SheetMusicEditor
                sheetMusic={ctx.resolvedSheetMusic}
                sections={ctx.sections}
                onSheetMusicChange={ctx.onSheetMusicChange}
              />
            </div>
            <div className={`p-4 border-t ${ctx.isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                onClick={() => setShowSheetMusicEditor(false)}
                className="w-full px-4 py-2.5 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600"
              >
                완료
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

export default SessionMeta;
