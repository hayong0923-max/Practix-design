'use client';

interface SectionMemoProps {
  memo?: string;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (memo: string) => void;
}

export default function SectionMemo({ memo, isEditing, onEdit, onSave }: SectionMemoProps) {
  if (isEditing) {
    return (
      <div className="mb-3">
        <textarea
          defaultValue={memo}
          placeholder="메모 입력..."
          className="w-full border border-gray-300 rounded-lg p-2 text-sm"
          rows={2}
          onBlur={(e) => onSave(e.target.value)}
          autoFocus
        />
      </div>
    );
  }

  return (
    <div onClick={onEdit} className="mb-3 p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
      <p className="text-sm text-gray-700">{memo || '메모를 추가하려면 클릭...'}</p>
    </div>
  );
}
