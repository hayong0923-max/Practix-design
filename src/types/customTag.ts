/**
 * 사용자 정의 태그 타입
 */

export interface CustomTag {
  id: string;
  label: string;
  color: string; // Tailwind CSS 클래스 (예: 'bg-pink-100 text-pink-700 border-pink-300')
  createdAt: string;
}

// 사용 가능한 태그 색상 프리셋
export const TAG_COLOR_PRESETS = [
  { id: 'pink', bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300' },
  { id: 'rose', bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-300' },
  { id: 'red', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  { id: 'orange', bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  { id: 'amber', bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
  { id: 'yellow', bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
  { id: 'lime', bg: 'bg-lime-100', text: 'text-lime-700', border: 'border-lime-300' },
  { id: 'green', bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  { id: 'emerald', bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
  { id: 'teal', bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-300' },
  { id: 'cyan', bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-300' },
  { id: 'sky', bg: 'bg-sky-100', text: 'text-sky-700', border: 'border-sky-300' },
  { id: 'blue', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  { id: 'indigo', bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300' },
  { id: 'violet', bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-300' },
  { id: 'purple', bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  { id: 'fuchsia', bg: 'bg-fuchsia-100', text: 'text-fuchsia-700', border: 'border-fuchsia-300' },
  { id: 'slate', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
];

export function getColorClass(preset: typeof TAG_COLOR_PRESETS[number]): string {
  return `${preset.bg} ${preset.text} ${preset.border}`;
}
