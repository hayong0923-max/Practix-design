'use client';

import { useMemo, useState } from 'react';
import {
  ChevronLeft,
  Mic,
  Clock,
  Flame,
  Settings,
  Lock,
} from 'lucide-react';
import { Song } from '@/types';
import { calculateStats, formatDuration, getLastNDays } from '@/utils/statsUtils';
import { PREDEFINED_TAGS } from '@/constants/tags';
import { useTheme } from '@/hooks/useTheme';
import { usePracticeGoals } from '@/hooks/usePracticeGoals';
import { usePracticeStatsContext } from '@/contexts/PracticeStatsContext';
import GoalSettingsModal from '@/components/modals/GoalSettingsModal';
import { ACHIEVEMENT_DEFINITIONS } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface StatsPageProps {
  songs: Song[];
  onBack: () => void;
}

export default function StatsPage({ songs, onBack }: StatsPageProps) {
  const { isDark } = useTheme();
  const { goals, setGoals } = usePracticeGoals();
  const { stats: practiceStats, unlockedAchievements, lockedAchievements } = usePracticeStatsContext();
  const [showGoalSettings, setShowGoalSettings] = useState(false);

  const stats = useMemo(() => calculateStats(songs), [songs]);
  const last7Days = useMemo(() => getLastNDays(7), []);
  const todayDate = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Goal progress calculation
  const goalProgress = useMemo(() => {
    const timeProgress = Math.min(100, (stats.todayPracticeTime / goals.dailyPracticeTime) * 100);
    const recordingProgress = Math.min(100, (stats.todayRecordings / goals.dailyRecordings) * 100);

    const practiceDaysThisWeek = last7Days.filter(
      (date) => (stats.recordingsByDate[date] || 0) > 0
    ).length;
    const weeklyProgress = Math.min(100, (practiceDaysThisWeek / goals.weeklyPracticeDays) * 100);

    return { timeProgress, recordingProgress, weeklyProgress, practiceDaysThisWeek };
  }, [stats, goals, last7Days]);

  // Weekly chart data
  const weeklyData = useMemo(() => {
    const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];
    return last7Days.map((date) => {
      const d = new Date(date);
      return {
        date,
        dayLabel: dayLabels[d.getDay()],
        recordings: stats.recordingsByDate[date] || 0,
        practiceTime: stats.practiceTimeByDate[date] || 0,
        isToday: date === todayDate,
      };
    });
  }, [last7Days, stats, todayDate]);

  const maxRecordings = Math.max(...weeklyData.map((d) => d.recordings), 1);

  // Tag data sorted by count
  const tagData = useMemo(() => {
    return PREDEFINED_TAGS.map((tag) => ({
      ...tag,
      count: stats.tagCounts[tag.id] || 0,
    })).sort((a, b) => b.count - a.count);
  }, [stats]);

  // All achievements with unlock status
  const allAchievements = useMemo(() => {
    return ACHIEVEMENT_DEFINITIONS.map((def) => {
      const unlocked = unlockedAchievements.find((a) => a.id === def.id);
      return {
        ...def,
        isUnlocked: !!unlocked,
        unlockedAt: unlocked?.unlockedAt || null,
      };
    });
  }, [unlockedAchievements]);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-zinc-900' : 'bg-zinc-50'}`}>
      {/* Header */}
      <div className={`sticky top-0 z-10 px-4 py-3 flex items-center justify-between ${
        isDark ? 'bg-zinc-900/95 border-b border-zinc-800' : 'bg-zinc-50/95 border-b border-zinc-200'
      } backdrop-blur-sm`}>
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className={`p-2 rounded-full ${
              isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-200 text-zinc-600'
            } transition-colors`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
            내 연습
          </h1>
        </div>
        <button
          onClick={() => setShowGoalSettings(true)}
          className={`p-2 rounded-full ${
            isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-200 text-zinc-600'
          } transition-colors`}
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      <div className="px-4 py-4 space-y-4 pb-8">
        {/* Today Summary Card */}
        <Card className={`overflow-hidden ${
          isDark ? 'bg-gradient-to-br from-violet-600 to-purple-700 border-0' : 'bg-gradient-to-br from-violet-500 to-purple-600 border-0'
        }`}>
          <CardContent className="p-4">
            <div className="text-white/80 text-sm mb-3">오늘의 연습</div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="flex items-center gap-1.5 text-white mb-0.5">
                    <Clock className="w-4 h-4 text-white/70" />
                    <span className="text-2xl font-bold">{formatDuration(stats.todayPracticeTime)}</span>
                  </div>
                  <div className="text-white/60 text-xs">연습 시간</div>
                </div>
                <div className="w-px h-10 bg-white/20" />
                <div className="text-center">
                  <div className="flex items-center gap-1.5 text-white mb-0.5">
                    <Mic className="w-4 h-4 text-white/70" />
                    <span className="text-2xl font-bold">{stats.todayRecordings}</span>
                  </div>
                  <div className="text-white/60 text-xs">녹음</div>
                </div>
              </div>
              {practiceStats.currentStreak > 0 && (
                <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1.5">
                  <Flame className="w-4 h-4 text-orange-300" />
                  <span className="text-white font-semibold">{practiceStats.currentStreak}일</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Bar Chart */}
        <Card className={isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-zinc-200'}>
          <CardContent className="p-4">
            <div className={`text-sm font-medium mb-4 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
              주간 활동
            </div>
            <div className="flex justify-between gap-2 h-28">
              {weeklyData.map((day) => (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col items-center gap-1.5"
                >
                  <div className={`text-xs font-medium h-4 ${
                    day.recordings > 0
                      ? isDark ? 'text-zinc-300' : 'text-zinc-600'
                      : 'text-transparent'
                  }`}>
                    {day.recordings > 0 ? day.recordings : '-'}
                  </div>
                  <div className="flex-1 w-full flex items-end">
                    <div
                      className={`w-full rounded-md transition-all ${
                        day.isToday
                          ? 'bg-violet-500'
                          : day.recordings > 0
                            ? isDark ? 'bg-zinc-600' : 'bg-zinc-300'
                            : isDark ? 'bg-zinc-700' : 'bg-zinc-100'
                      }`}
                      style={{
                        height: `${Math.max(
                          (day.recordings / maxRecordings) * 100,
                          day.recordings > 0 ? 20 : 8
                        )}%`,
                      }}
                    />
                  </div>
                  <span className={`text-xs ${
                    day.isToday
                      ? 'text-violet-500 font-semibold'
                      : isDark ? 'text-zinc-500' : 'text-zinc-400'
                  }`}>
                    {day.dayLabel}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Goal Progress Section */}
        <Card className={isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-zinc-200'}>
          <CardContent className="p-4">
            <div className={`text-sm font-medium mb-4 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
              목표 달성률
            </div>
            <div className="flex justify-around">
              <GoalCircle
                label="일일 연습시간"
                current={formatDuration(stats.todayPracticeTime)}
                target={formatDuration(goals.dailyPracticeTime)}
                progress={goalProgress.timeProgress}
                isDark={isDark}
              />
              <GoalCircle
                label="일일 녹음"
                current={`${stats.todayRecordings}회`}
                target={`${goals.dailyRecordings}회`}
                progress={goalProgress.recordingProgress}
                isDark={isDark}
              />
              <GoalCircle
                label="주간 연습일수"
                current={`${goalProgress.practiceDaysThisWeek}일`}
                target={`${goals.weeklyPracticeDays}일`}
                progress={goalProgress.weeklyProgress}
                isDark={isDark}
              />
            </div>
          </CardContent>
        </Card>

        {/* Tag Analysis */}
        <Card className={isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-zinc-200'}>
          <CardContent className="p-4">
            <div className={`text-sm font-medium mb-3 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
              태그 분석
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
              {tagData.filter(t => t.count > 0).length > 0 ? (
                tagData.filter(t => t.count > 0).map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                      isDark
                        ? 'bg-zinc-700 text-zinc-200 border border-zinc-600'
                        : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                    }`}
                  >
                    {tag.label} · {tag.count}
                  </Badge>
                ))
              ) : (
                <div className={`text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  아직 태그된 녹음이 없습니다
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Achievements Section */}
        <Card className={isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-zinc-200'}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className={`text-sm font-medium ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                업적
              </div>
              <div className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                {unlockedAchievements.length} / {ACHIEVEMENT_DEFINITIONS.length}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {allAchievements.map((achievement) => (
                <AchievementCard
                  key={achievement.id}
                  icon={achievement.icon}
                  name={achievement.name}
                  isUnlocked={achievement.isUnlocked}
                  unlockedAt={achievement.unlockedAt}
                  isDark={isDark}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <GoalSettingsModal
        show={showGoalSettings}
        onClose={() => setShowGoalSettings(false)}
        goals={goals}
        onSave={setGoals}
      />
    </div>
  );
}

// Circular progress indicator for goals
function GoalCircle({
  label,
  current,
  target,
  progress,
  isDark,
}: {
  label: string;
  current: string;
  target: string;
  progress: number;
  isDark: boolean;
}) {
  const isComplete = progress >= 100;
  const circumference = 2 * Math.PI * 32;
  const strokeDashoffset = circumference - (Math.min(100, progress) / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r="32"
            stroke={isDark ? '#3f3f46' : '#e4e4e7'}
            strokeWidth="6"
            fill="none"
          />
          <circle
            cx="40"
            cy="40"
            r="32"
            stroke={isComplete ? '#22c55e' : '#8b5cf6'}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-sm font-bold ${
            isComplete
              ? 'text-green-500'
              : isDark ? 'text-white' : 'text-zinc-800'
          }`}>
            {Math.round(progress)}%
          </span>
        </div>
      </div>
      <div className="text-center mt-2">
        <div className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          {label}
        </div>
        <div className={`text-[10px] mt-0.5 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
          {current} / {target}
        </div>
      </div>
    </div>
  );
}

// Achievement badge card
function AchievementCard({
  icon,
  name,
  isUnlocked,
  unlockedAt,
  isDark,
}: {
  icon: string;
  name: string;
  isUnlocked: boolean;
  unlockedAt: string | null;
  isDark: boolean;
}) {
  const formattedDate = unlockedAt
    ? new Date(unlockedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
    : null;

  return (
    <div
      className={`relative flex flex-col items-center p-2 rounded-xl transition-all ${
        isUnlocked
          ? isDark ? 'bg-zinc-700' : 'bg-zinc-100'
          : isDark ? 'bg-zinc-800/50' : 'bg-zinc-50'
      }`}
    >
      <div className={`text-2xl mb-1 ${!isUnlocked ? 'grayscale opacity-40' : ''}`}>
        {icon}
      </div>
      {!isUnlocked && (
        <div className="absolute top-1 right-1">
          <Lock className={`w-3 h-3 ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`} />
        </div>
      )}
      <div className={`text-[10px] text-center font-medium leading-tight ${
        isUnlocked
          ? isDark ? 'text-zinc-200' : 'text-zinc-700'
          : isDark ? 'text-zinc-600' : 'text-zinc-400'
      }`}>
        {name}
      </div>
      {isUnlocked && formattedDate && (
        <div className={`text-[9px] mt-0.5 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
          {formattedDate}
        </div>
      )}
    </div>
  );
}
