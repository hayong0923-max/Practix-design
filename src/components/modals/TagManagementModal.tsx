'use client';

import { useState } from 'react';
import { X, Plus, Pencil, Trash2, Check, Tag } from 'lucide-react';
import { CustomTag, TAG_COLOR_PRESETS, getColorClass } from '@/types';

interface TagManagementModalProps {
  show: boolean;
  onClose: () => void;
  customTags: CustomTag[];
  onAddTag: (label: string, colorPresetId: string) => CustomTag;
  onUpdateTag: (id: string, updates: Partial<Pick<CustomTag, 'label' | 'color'>>) => void;
  onDeleteTag: (id: string) => void;
  isLabelTaken: (label: string, excludeId?: string) => boolean;
  isDark?: boolean;
}

export default function TagManagementModal({
  show,
  onClose,
  customTags,
  onAddTag,
  onUpdateTag,
  onDeleteTag,
  isLabelTaken,
  isDark = false,
}: TagManagementModalProps) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [newColorId, setNewColorId] = useState(TAG_COLOR_PRESETS[0].id);
  const [editLabel, setEditLabel] = useState('');
  const [editColorId, setEditColorId] = useState('');
  const [error, setError] = useState('');

  if (!show) return null;

  const bgClass = isDark ? 'bg-gray-800' : 'bg-white';
  const textClass = isDark ? 'text-white' : 'text-gray-900';
  const subTextClass = isDark ? 'text-gray-400' : 'text-gray-500';
  const inputClass = isDark
    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400';
  const cardClass = isDark ? 'bg-gray-700/50' : 'bg-gray-50';

  const handleAddNew = () => {
    if (!newLabel.trim()) {
      setError('태그 이름을 입력하세요');
      return;
    }
    if (isLabelTaken(newLabel)) {
      setError('이미 존재하는 태그 이름입니다');
      return;
    }
    onAddTag(newLabel, newColorId);
    setNewLabel('');
    setNewColorId(TAG_COLOR_PRESETS[0].id);
    setIsAddingNew(false);
    setError('');
  };

  const handleStartEdit = (tag: CustomTag) => {
    setEditingId(tag.id);
    setEditLabel(tag.label);
    // Find the color preset id from the tag's color class
    const preset = TAG_COLOR_PRESETS.find(p => getColorClass(p) === tag.color);
    setEditColorId(preset?.id || TAG_COLOR_PRESETS[0].id);
    setError('');
  };

  const handleSaveEdit = () => {
    if (!editLabel.trim()) {
      setError('태그 이름을 입력하세요');
      return;
    }
    if (isLabelTaken(editLabel, editingId!)) {
      setError('이미 존재하는 태그 이름입니다');
      return;
    }
    const preset = TAG_COLOR_PRESETS.find(p => p.id === editColorId) || TAG_COLOR_PRESETS[0];
    onUpdateTag(editingId!, {
      label: editLabel,
      color: getColorClass(preset),
    });
    setEditingId(null);
    setError('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setError('');
  };

  const handleDelete = (id: string) => {
    if (confirm('이 태그를 삭제하시겠습니까?')) {
      onDeleteTag(id);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className={`${bgClass} rounded-2xl max-w-md w-full max-h-[80vh] flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-purple-500" />
            <h2 className={`text-lg font-semibold ${textClass}`}>태그 관리</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <X className={`w-5 h-5 ${subTextClass}`} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Add new tag button/form */}
          {!isAddingNew ? (
            <button
              onClick={() => {
                setIsAddingNew(true);
                setError('');
              }}
              className="w-full mb-4 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex items-center justify-center gap-2 text-gray-500 hover:text-purple-500 hover:border-purple-300 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>새 태그 추가</span>
            </button>
          ) : (
            <div className={`mb-4 p-4 rounded-xl ${cardClass}`}>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="예: 템포조절, 음정, 연습필요"
                className={`w-full px-3 py-2 border rounded-lg mb-3 ${inputClass}`}
                autoFocus
              />
              <div className="flex flex-wrap gap-2 mb-3">
                {TAG_COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setNewColorId(preset.id)}
                    className={`w-7 h-7 rounded-full ${preset.bg} border-2 ${
                      newColorId === preset.id ? 'border-gray-800 dark:border-white' : 'border-transparent'
                    }`}
                    title={preset.id}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-sm ${subTextClass}`}>미리보기:</span>
                <span
                  className={`px-3 py-1 rounded-full text-sm border ${getColorClass(
                    TAG_COLOR_PRESETS.find(p => p.id === newColorId) || TAG_COLOR_PRESETS[0]
                  )}`}
                >
                  {newLabel || '태그 이름'}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsAddingNew(false);
                    setNewLabel('');
                    setError('');
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg ${
                    isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  취소
                </button>
                <button
                  onClick={handleAddNew}
                  className="flex-1 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                >
                  추가
                </button>
              </div>
            </div>
          )}

          {/* Tag list */}
          <div className="space-y-2">
            {customTags.length === 0 ? (
              <div className={`text-center py-8 ${subTextClass}`}>
                <p className="mb-2">아직 태그가 없습니다</p>
                <p className="text-xs">위 버튼을 눌러 나만의 태그를 만들어보세요</p>
              </div>
            ) : (
              customTags.map((tag) => (
                <div
                  key={tag.id}
                  className={`p-3 rounded-xl ${cardClass}`}
                >
                  {editingId === tag.id ? (
                    // Edit mode
                    <div>
                      <input
                        type="text"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg mb-3 ${inputClass}`}
                        autoFocus
                      />
                      <div className="flex flex-wrap gap-2 mb-3">
                        {TAG_COLOR_PRESETS.map((preset) => (
                          <button
                            key={preset.id}
                            onClick={() => setEditColorId(preset.id)}
                            className={`w-6 h-6 rounded-full ${preset.bg} border-2 ${
                              editColorId === preset.id ? 'border-gray-800 dark:border-white' : 'border-transparent'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleCancelEdit}
                          className={`flex-1 px-3 py-1.5 rounded-lg text-sm ${
                            isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          취소
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          className="flex-1 px-3 py-1.5 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600"
                        >
                          저장
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-3 py-1 rounded-full text-sm border ${tag.color}`}
                      >
                        {tag.label}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStartEdit(tag)}
                          className={`p-1.5 rounded-lg ${
                            isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                          }`}
                        >
                          <Pencil className={`w-4 h-4 ${subTextClass}`} />
                        </button>
                        <button
                          onClick={() => handleDelete(tag.id)}
                          className={`p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30`}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600"
          >
            완료
          </button>
        </div>
      </div>
    </div>
  );
}
