'use client';

import { useState, useEffect } from 'react';
import { X, Target } from 'lucide-react';
import { PracticeGoals } from '@/types';

interface GoalSettingsModalProps {
  show: boolean;
  onClose: () => void;
  goals: PracticeGoals;
  onSave: (goals: Partial<PracticeGoals>) => void;
  isDark?: boolean;
}

export default function GoalSettingsModal({
  show,
  onClose,
  goals,
  onSave,
  isDark = false,
}: GoalSettingsModalProps) {
  const [dailyMinutes, setDailyMinutes] = useState(Math.floor(goals.dailyPracticeTime / 60));
  const [dailyRecordings, setDailyRecordings] = useState(goals.dailyRecordings);
  const [weeklyDays, setWeeklyDays] = useState(goals.weeklyPracticeDays);

  // Sync state when goals change
  useEffect(() => {
    setDailyMinutes(Math.floor(goals.dailyPracticeTime / 60));
    setDailyRecordings(goals.dailyRecordings);
    setWeeklyDays(goals.weeklyPracticeDays);
  }, [goals]);

  if (!show) return null;

  const handleSave = () => {
    onSave({
      dailyPracticeTime: dailyMinutes * 60,
      dailyRecordings,
      weeklyPracticeDays: weeklyDays,
    });
    onClose();
  };

  const bgClass = isDark ? 'bg-gray-800' : 'bg-white';
  const textClass = isDark ? 'text-white' : 'text-gray-900';
  const subTextClass = isDark ? 'text-gray-400' : 'text-gray-500';
  const inputClass = isDark
    ? 'bg-gray-700 border-gray-600 text-white'
    : 'bg-white border-gray-300 text-gray-900';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`${bgClass} rounded-2xl max-w-sm w-full p-6`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-500" />
            <h2 className={`text-lg font-semibold ${textClass}`}>목표 설정</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <X className={`w-5 h-5 ${subTextClass}`} />
          </button>
        </div>

        {/* Goals form */}
        <div className="space-y-5">
          {/* Daily practice time */}
          <div>
            <label className={`block text-sm font-medium ${textClass} mb-2`}>
              일일 연습 시간 목표
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={5}
                max={180}
                value={dailyMinutes}
                onChange={(e) => setDailyMinutes(Math.max(5, parseInt(e.target.value) || 5))}
                className={`w-20 px-3 py-2 border rounded-lg text-center ${inputClass}`}
              />
              <span className={subTextClass}>분</span>
            </div>
            <p className={`text-xs ${subTextClass} mt-1`}>권장: 30~60분</p>
          </div>

          {/* Daily recordings */}
          <div>
            <label className={`block text-sm font-medium ${textClass} mb-2`}>
              일일 녹음 횟수 목표
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={50}
                value={dailyRecordings}
                onChange={(e) => setDailyRecordings(Math.max(1, parseInt(e.target.value) || 1))}
                className={`w-20 px-3 py-2 border rounded-lg text-center ${inputClass}`}
              />
              <span className={subTextClass}>회</span>
            </div>
          </div>

          {/* Weekly practice days */}
          <div>
            <label className={`block text-sm font-medium ${textClass} mb-2`}>
              주간 연습 일수 목표
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={7}
                value={weeklyDays}
                onChange={(e) =>
                  setWeeklyDays(Math.min(7, Math.max(1, parseInt(e.target.value) || 1)))
                }
                className={`w-20 px-3 py-2 border rounded-lg text-center ${inputClass}`}
              />
              <span className={subTextClass}>일 / 주</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium ${
              isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
            }`}
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2.5 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
