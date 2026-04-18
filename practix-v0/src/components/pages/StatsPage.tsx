'use client';

import { useMemo, useState } from 'react';
import {
  ChevronLeft,
  Mic,
  Clock,
  Flame,
  Trophy,
  Music,
  TrendingUp,
  Calendar,
  Target,
  Settings,
} from 'lucide-react';
import { Song } from '@/types';
import { calculateStats, formatDuration, getLastNDays } from '@/utils/statsUtils';
import { PREDEFINED_TAGS } from '@/constants/tags';
import { useTheme } from '@/hooks/useTheme';
import { usePracticeGoals } from '@/hooks/usePracticeGoals';
import { usePracticeStatsContext } from '@/contexts/PracticeStatsContext';
import GoalSettingsModal from '@/components/modals/GoalSettingsModal';
import { DailyPractice, getDateString } from '@/types';

interface StatsPageProps {
  songs: Song[];
  onBack: () => void;
}

export default function StatsPage({ songs, onBack }: StatsPageProps) {
  const { isDark } = useTheme();
  const { goals, setGoals } = usePracticeGoals();
  const { stats: practiceStats, dailyPractice, unlockedAchievements, getWeeklyReport } = usePracticeStatsContext();
  const weeklyReport = useMemo(() => getWeeklyReport(0), [getWeeklyReport]);
  const [showGoalSettings, setShowGoalSettings] = useState(false);

  const stats = useMemo(() => calculateStats(songs), [songs]);
  const last7Days = useMemo(() => getLastNDays(7), []);

  // 목표 달성률 계산
  const goalProgress = useMemo(() => {
    const timeProgress = Math.min(100, (stats.todayPracticeTime / goals.dailyPracticeTime) * 100);
    const recordingProgress = Math.min(100, (stats.todayRecordings / goals.dailyRecordings) * 100);

    // 이번 주 연습한 일수 계산
    const practiceDaysThisWeek = last7Days.filter(
      (date) => (stats.recordingsByDate[date] || 0) > 0
    ).length;
    const weeklyProgress = Math.min(100, (practiceDaysThisWeek / goals.weeklyPracticeDays) * 100);

    return { timeProgress, recordingProgress, weeklyProgress, practiceDaysThisWeek };
  }, [stats, goals, last7Days]);

  // 주간 차트 데이터
  const weeklyData = useMemo(() => {
    return last7Days.map((date) => ({
      date,
      dayLabel: new Date(date).toLocaleDateString('ko-KR', { weekday: 'short' }),
      recordings: stats.recordingsByDate[date] || 0,
      practiceTime: stats.practiceTimeByDate[date] || 0,
    }));
  }, [last7Days, stats]);

  const maxRecordings = Math.max(...weeklyData.map((d) => d.recordings), 1);

  // 태그 데이터
  const tagData = useMemo(() => {
    return PREDEFINED_TAGS.map((tag) => ({
      ...tag,
      count: stats.tagCounts[tag.id] || 0,
    })).sort((a, b) => b.count - a.count);
  }, [stats]);

  const totalTagCount = Object.values(stats.tagCounts).reduce((a, b) => a + b, 0);


  // 웹 UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">연습 통계</h1>
        </div>

        {/* 오늘의 목표 달성 */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Target className="w-6 h-6 text-purple-500" />
              <span className="font-semibold text-lg text-gray-800">오늘의 목표</span>
            </div>
            <button
              onClick={() => setShowGoalSettings(true)}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <GoalCircle
              label="연습 시간"
              current={formatDuration(stats.todayPracticeTime)}
              target={formatDuration(goals.dailyPracticeTime)}
              progress={goalProgress.timeProgress}
            />
            <GoalCircle
              label="녹음 횟수"
              current={`${stats.todayRecordings}회`}
              target={`${goals.dailyRecordings}회`}
              progress={goalProgress.recordingProgress}
            />
            <GoalCircle
              label="주간 연습"
              current={`${goalProgress.practiceDaysThisWeek}일`}
              target={`${goals.weeklyPracticeDays}일`}
              progress={goalProgress.weeklyProgress}
            />
          </div>
        </div>

        {/* 오늘 통계 */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-6 h-6" />
            <span className="font-semibold text-lg">오늘의 연습</span>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-4xl font-bold">{stats.todayRecordings}회</div>
              <div className="text-purple-100">녹음</div>
            </div>
            <div>
              <div className="text-4xl font-bold">
                {formatDuration(stats.todayPracticeTime)}
              </div>
              <div className="text-purple-100">연습 시간</div>
            </div>
          </div>
        </div>

        {/* 요약 카드 그리드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <WebStatCard
            icon={<Flame className="w-6 h-6 text-orange-500" />}
            label="연속 연습"
            value={`${stats.currentStreak}일`}
            subLabel={`최장 ${stats.longestStreak}일`}
            isDark={isDark}
          />
          <WebStatCard
            icon={<Mic className="w-6 h-6 text-blue-500" />}
            label="총 녹음"
            value={`${stats.totalRecordings}회`}
            isDark={isDark}
          />
          <WebStatCard
            icon={<Clock className="w-6 h-6 text-green-500" />}
            label="총 연습 시간"
            value={formatDuration(stats.totalPracticeTime)}
            isDark={isDark}
          />
          <WebStatCard
            icon={<Music className="w-6 h-6 text-purple-500" />}
            label="곡 / 구간"
            value={`${stats.totalSongs}곡`}
            subLabel={`${stats.totalSections}개 구간`}
            isDark={isDark}
          />
        </div>

        {/* 캘린더 히트맵 */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-gray-500" />
            <span className="font-semibold text-gray-800">연습 기록 (최근 12주)</span>
          </div>
          <CalendarHeatmap dailyPractice={dailyPractice} isDark={false} />
          {practiceStats.currentStreak > 0 && (
            <div className="mt-4 text-center text-sm text-gray-500">
              현재 {practiceStats.currentStreak}일 연속 연습 중!
            </div>
          )}
        </div>

        {/* 획득한 뱃지 */}
        {unlockedAchievements.length > 0 && (
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span className="font-semibold text-gray-800">획득한 뱃지</span>
              <span className="text-sm text-gray-400">({unlockedAchievements.length}개)</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {unlockedAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50"
                >
                  <span className="text-xl">{achievement.icon}</span>
                  <div>
                    <div className="text-sm font-medium text-gray-700">{achievement.name}</div>
                    <div className="text-xs text-gray-400">{achievement.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 이번 주 리포트 (새 연습 로그 기반) */}
        {weeklyReport && (
          <div className={`rounded-2xl p-6 mb-6 shadow-sm ${
            isDark
              ? 'bg-gradient-to-r from-blue-900/30 to-indigo-900/30'
              : 'bg-gradient-to-r from-blue-50 to-indigo-50'
          }`}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
              <span className={`font-semibold ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>이번 주 요약</span>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {weeklyReport.practicedays}일
                </div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>연습한 날</div>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {weeklyReport.totalRecordings}회
                </div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>녹음</div>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {formatDuration(weeklyReport.totalPracticeTime)}
                </div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>연습 시간</div>
              </div>
            </div>
            {weeklyReport.mostPracticedSong && (
              <div className={`mt-4 pt-4 border-t ${isDark ? 'border-blue-800' : 'border-blue-200'}`}>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>이번 주 가장 많이 연습한 곡</div>
                <div className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {weeklyReport.mostPracticedSong.songName}
                </div>
              </div>
            )}
            {weeklyReport.newAchievements.length > 0 && (
              <div className={`mt-3 pt-3 border-t text-sm ${
                isDark ? 'border-blue-800 text-blue-300' : 'border-blue-200 text-blue-600'
              }`}>
                이번 주 새로 획득한 뱃지 {weeklyReport.newAchievements.length}개!
              </div>
            )}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* 주간 차트 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-gray-500" />
              <span className="font-semibold text-gray-800">주간 활동</span>
            </div>
            <div className="flex justify-between gap-3 h-32">
              {weeklyData.map((day, i) => (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col items-center gap-2 h-full"
                >
                  <div className="text-xs text-gray-500 font-medium h-4">
                    {day.recordings > 0 ? day.recordings : ''}
                  </div>
                  <div className="flex-1 w-full flex items-end">
                    <div
                      className={`w-full rounded-lg transition-all ${
                        day.recordings > 0 ? 'bg-purple-500' : 'bg-gray-100'
                      }`}
                      style={{
                        height: `${Math.max(
                          (day.recordings / maxRecordings) * 100,
                          day.recordings > 0 ? 15 : 5
                        )}%`,
                      }}
                    />
                  </div>
                  <span
                    className={`text-sm ${
                      i === 6 ? 'text-purple-600 font-semibold' : 'text-gray-400'
                    }`}
                  >
                    {day.dayLabel}
                  </span>
                </div>
              ))}
            </div>
            <div className="text-center mt-4 text-sm text-gray-500">
              이번 주 {stats.last7DaysRecordings}회 녹음 ·{' '}
              {formatDuration(stats.last7DaysPracticeTime)}
            </div>
          </div>

          {/* 태그 분포 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Trophy className="w-5 h-5 text-gray-500" />
              <span className="font-semibold text-gray-800">태그 분포</span>
            </div>
            {totalTagCount > 0 ? (
              <div className="space-y-3">
                {tagData.map((tag) =>
                  tag.count > 0 ? (
                    <div key={tag.id} className="flex items-center gap-3">
                      <span className="text-sm text-gray-700 w-20">
                        {tag.label}
                      </span>
                      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${tag.color.split(' ')[0]}`}
                          style={{
                            width: `${(tag.count / totalTagCount) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-500 w-8 text-right">
                        {tag.count}
                      </span>
                    </div>
                  ) : null
                )}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                아직 태그된 녹음이 없습니다
              </div>
            )}
          </div>
        </div>

        {/* 가장 많이 연습한 곡 */}
        {stats.mostPracticedSong && (
          <div className="bg-white rounded-2xl p-6 shadow-sm mt-6">
            <div className="text-sm text-gray-500 mb-1">
              가장 많이 연습한 곡
            </div>
            <div className="text-xl font-semibold text-gray-800">
              {stats.mostPracticedSong.name}
            </div>
            <div className="text-purple-500">
              {stats.mostPracticedSong.count}회 녹음
            </div>
          </div>
        )}
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

// 모바일용 카드 컴포넌트
function StatCard({
  icon,
  label,
  value,
  subLabel,
  isDark,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subLabel?: string;
  isDark: boolean;
}) {
  return (
    <div
      className={`${
        isDark ? 'bg-gray-800' : 'bg-white'
      } rounded-xl p-3`}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span
          className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
        >
          {label}
        </span>
      </div>
      <div
        className={`text-lg font-bold ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}
      >
        {value}
      </div>
      {subLabel && (
        <div
          className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
        >
          {subLabel}
        </div>
      )}
    </div>
  );
}

// 웹용 카드 컴포넌트
function WebStatCard({
  icon,
  label,
  value,
  subLabel,
  isDark,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subLabel?: string;
  isDark: boolean;
}) {
  return (
    <div className={`rounded-xl p-4 shadow-sm ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</span>
      </div>
      <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</div>
      {subLabel && <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{subLabel}</div>}
    </div>
  );
}

// 모바일용 목표 진행 바
function GoalProgressBar({
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
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          {label}
        </span>
        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {current} / {target}
        </span>
      </div>
      <div className={`h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
        <div
          className={`h-2 rounded-full transition-all ${
            isComplete ? 'bg-green-500' : 'bg-purple-500'
          }`}
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>
    </div>
  );
}

// 웹용 목표 원형 진행률
function GoalCircle({
  label,
  current,
  target,
  progress,
}: {
  label: string;
  current: string;
  target: string;
  progress: number;
}) {
  const isComplete = progress >= 100;
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (Math.min(100, progress) / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="#e5e7eb"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke={isComplete ? '#22c55e' : '#a855f7'}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-lg font-bold ${isComplete ? 'text-green-500' : 'text-gray-800'}`}>
            {Math.round(progress)}%
          </span>
        </div>
      </div>
      <div className="text-center mt-2">
        <div className="text-sm font-medium text-gray-700">{label}</div>
        <div className="text-xs text-gray-500">
          {current} / {target}
        </div>
      </div>
    </div>
  );
}

// 캘린더 히트맵 컴포넌트
function CalendarHeatmap({
  dailyPractice,
  isDark,
}: {
  dailyPractice: DailyPractice[];
  isDark: boolean;
}) {
  // Generate last 12 weeks of dates
  const calendarData = useMemo(() => {
    const today = new Date();
    const weeks: { date: string; intensity: 0 | 1 | 2 | 3 | 4 }[][] = [];

    // Start from 12 weeks ago, aligned to Sunday
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - today.getDay() - 11 * 7);

    // Create a map for quick lookup
    const practiceMap = new Map<string, DailyPractice>();
    dailyPractice.forEach((dp) => practiceMap.set(dp.date, dp));

    for (let week = 0; week < 12; week++) {
      const weekData: { date: string; intensity: 0 | 1 | 2 | 3 | 4 }[] = [];
      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + week * 7 + day);
        const dateStr = getDateString(currentDate);

        // Don't show future dates
        if (currentDate > today) {
          weekData.push({ date: dateStr, intensity: 0 });
        } else {
          const practice = practiceMap.get(dateStr);
          weekData.push({
            date: dateStr,
            intensity: practice ? practice.intensity : 0,
          });
        }
      }
      weeks.push(weekData);
    }

    return weeks;
  }, [dailyPractice]);

  const intensityColors = isDark
    ? ['bg-gray-800', 'bg-green-900', 'bg-green-700', 'bg-green-500', 'bg-green-400']
    : ['bg-gray-100', 'bg-green-100', 'bg-green-300', 'bg-green-500', 'bg-green-700'];

  const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-1 pr-1">
          {dayLabels.map((label, i) => (
            <div
              key={label}
              className={`w-3 h-3 text-[8px] flex items-center justify-center ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`}
            >
              {i % 2 === 1 ? label : ''}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        {calendarData.map((week, weekIdx) => (
          <div key={weekIdx} className="flex flex-col gap-1">
            {week.map((day) => (
              <div
                key={day.date}
                className={`w-3 h-3 rounded-sm ${intensityColors[day.intensity]}`}
                title={`${day.date}: ${day.intensity > 0 ? '연습함' : '연습 없음'}`}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1 mt-2">
        <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          적음
        </span>
        {intensityColors.map((color, i) => (
          <div key={i} className={`w-3 h-3 rounded-sm ${color}`} />
        ))}
        <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          많음
        </span>
      </div>
    </div>
  );
}
