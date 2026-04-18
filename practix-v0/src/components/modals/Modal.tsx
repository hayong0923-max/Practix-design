'use client';

interface ModalProps {
  show: boolean;
  onClose: () => void;
  title: string;
  inputValue: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
}

export default function Modal({ show, onClose, title, inputValue, onInputChange, onSubmit }: ModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-96 max-w-full mx-4">
        <h2 className="text-xl font-bold text-gray-800 mb-4">{title}</h2>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && onSubmit()}
          placeholder="이름을 입력하세요"
          className="w-full border border-gray-300 rounded-lg p-3 mb-4"
          autoFocus
        />
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg"
          >
            취소
          </button>
          <button
            onClick={onSubmit}
            className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg"
          >
            추가
          </button>
        </div>
      </div>
    </div>
  );
}
