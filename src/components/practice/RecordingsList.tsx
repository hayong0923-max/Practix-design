'use client';

import { useState, memo } from 'react';
import { Trash2, Plus, X, Settings } from 'lucide-react';
import { Recording, CustomTag } from '@/types';
import { PREDEFINED_TAGS, findTag } from '@/constants/tags';

interface RecordingsListProps {
  recordings: Recording[];
  selectedRecordingId: number | null;
  customTags?: CustomTag[];
  onSelectRecording: (recordingId: number) => void;
  onRenameRecording: (recordingId: number, newName: string) => void;
  onDeleteRecording: (recordingId: number) => void;
  onUpdateTags: (recordingId: number, tags: string[]) => void;
  onManageTags?: () => void;
}

function RecordingsList({
  recordings,
  selectedRecordingId,
  customTags = [],
  onSelectRecording,
  onRenameRecording,
  onDeleteRecording,
  onUpdateTags,
  onManageTags,
}: RecordingsListProps) {
  const [showTagSelector, setShowTagSelector] = useState<number | null>(null);

  if (!recordings || recordings.length === 0) return null;

  const toggleTag = (recordingId: number, tagId: string, currentTags: string[]) => {
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter((t) => t !== tagId)
      : [...currentTags, tagId];
    onUpdateTags(recordingId, newTags);
  };

  // 모든 태그 (기본 + 커스텀)
  const allTags = [
    ...PREDEFINED_TAGS.map(t => ({ id: t.id, label: t.label, color: t.color, isCustom: false })),
    ...customTags.map(t => ({ id: t.id, label: t.label, color: t.color, isCustom: true })),
  ];


  return (
    <div className="mb-4">
      <h5 className="text-sm font-semibold text-gray-700 mb-2">내 녹음 목록</h5>
      <div className="space-y-2">
        {recordings.map((recording) => (
          <div
            key={recording.id}
            className={`p-3 rounded-lg border-2 transition cursor-pointer ${
              selectedRecordingId === recording.id
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 bg-gray-50 hover:bg-gray-100 active:bg-gray-200'
            }`}
            onClick={() => onSelectRecording(recording.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    selectedRecordingId === recording.id ? 'border-green-500 bg-green-500' : 'border-gray-300'
                  }`}
                >
                  {selectedRecordingId === recording.id && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                </div>
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={recording.name}
                    onChange={(e) => onRenameRecording(recording.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-transparent font-medium text-gray-800 text-sm border-none outline-none w-full"
                  />
                  <p className="text-xs text-gray-500">
                    {new Date(recording.uploadDate).toLocaleString('ko-KR', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteRecording(recording.id);
                }}
                className="text-red-500 hover:text-red-700 p-2"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Tags display and add button */}
            <div className="mt-2 flex flex-wrap items-center gap-1" onClick={(e) => e.stopPropagation()}>
              {recording.tags?.map((tagId) => {
                const tagInfo = findTag(tagId, customTags);
                if (!tagInfo) return null;
                return (
                  <span
                    key={tagId}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${tagInfo.color}`}
                  >
                    {tagInfo.label}
                    <button
                      onClick={() => toggleTag(recording.id, tagId, recording.tags || [])}
                      className="hover:opacity-70"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
              <button
                onClick={() => setShowTagSelector(showTagSelector === recording.id ? null : recording.id)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600"
              >
                <Plus className="w-3 h-3" />
                태그
              </button>
            </div>

            {/* Tag selector dropdown */}
            {showTagSelector === recording.id && (
              <div className="mt-2 p-2 bg-white border border-gray-200 rounded-lg shadow-sm" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-500">태그 선택:</p>
                  {onManageTags && (
                    <button
                      onClick={onManageTags}
                      className="text-xs text-purple-500 hover:text-purple-700 flex items-center gap-1"
                    >
                      <Settings className="w-3 h-3" />
                      태그 관리
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {allTags.map((tag) => {
                    const isSelected = recording.tags?.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(recording.id, tag.id, recording.tags || [])}
                        className={`px-2 py-1 rounded-full text-xs border transition ${
                          isSelected
                            ? tag.color
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {tag.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(RecordingsList);
