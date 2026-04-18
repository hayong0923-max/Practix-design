'use client';

import { Trash2 } from 'lucide-react';
import { formatTime } from '@/utils/formatTime';

interface SectionHeaderProps {
  index: number;
  start: number;
  end: number;
  onDelete: () => void;
}

export default function SectionHeader({ index, start, end, onDelete }: SectionHeaderProps) {
  return (
    <div className="flex justify-between items-start mb-3">
      <div className="flex-1">
        <h4 className="font-medium text-gray-800">구간 {index + 1}</h4>
        <p className="text-sm text-gray-600">
          {formatTime(start)} - {formatTime(end)}
        </p>
      </div>
      <button onClick={onDelete} className="text-red-500 hover:text-red-700">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
