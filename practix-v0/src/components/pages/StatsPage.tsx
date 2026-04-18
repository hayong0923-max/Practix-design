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
    return last7Days.map((date) => ({
      date,
      dayLabel: new Date(date).toLocaleDateString('ko-KR', { weekday: 'short' }),
      recordings: stats.recordingsByDate[date] || 0,
      practiceTime: stats.practiceTimeByDate[date] || 0,
    }));
  }, [last7Days, stats]);

  const maxRecordings = Math.max(...weeklyData.map((d) => d.recordings), 1);

  // Tag data
  const tagData = useMemo(() => {
    return PREDEFINED_TAGS.map((tag) => ({
      ...tag,
      count: stats.tagCounts[tag.id] || 0,
    })).sort((a, b) => b.count - a.count);
  }, [stats]);

  const totalTagCount = Object.values(stats.tagCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            뒤로
          </button>
          <h1 className="text-2xl font-bold text-foreground mt-2">연습 통계</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        {/* Today&apos;s Goals */}
        <section className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-accent" />
              </div>
              <span className="font-semibold text-lg text-foreground">{"오늘의 목표"}</span>
            </div>
            <button
              onClick={() => setShowGoalSettings(true)}
              className="p-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              <Settings className="w-5 h-5" />
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
        </section>

        {/* Today&apos;s Practice */}
        <section className="bg-primary text-primary-foreground rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-5 h-5" />
            <span className="font-semibold text-lg">{"오늘의 연습"}</span>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-4xl font-bold">{stats.todayRecordings}회</div>
              <div className="text-primary-foreground/70 mt-1">녹음</div>
            </div>
            <div>
              <div className="text-4xl font-bold">
                {formatDuration(stats.todayPracticeTime)}
              </div>
              <div className="text-primary-foreground/70 mt-1">연습 시간</div>
            </div>
          </div>
        </section>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Flame className="w-5 h-5 text-orange-500" />}
            label="연속 연습"
            value={`${stats.currentStreak}일`}
            subLabel={`최장 ${stats.longestStreak}일`}
          />
          <StatCard
            icon={<Mic className="w-5 h-5 text-accent" />}
            label="총 녹음"
            value={`${stats.totalRecordings}회`}
          />
          <StatCard
            icon={<Clock className="w-5 h-5 text-success" />}
            label="총 연습 시간"
            value={formatDuration(stats.totalPracticeTime)}
          />
          <StatCard
            icon={<Music className="w-5 h-5 text-foreground" />}
            label="곡 / 구간"
            value={`${stats.totalSongs}곡`}
            subLabel={`${stats.totalSections}개 구간`}
          />
        </div>

        {/* Calendar Heatmap */}
        <section className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <span className="font-semibold text-foreground">연습 기록 (최근 12주)</span>
          </div>
          <CalendarHeatmap dailyPractice={dailyPractice} />
          {practiceStats.currentStreak > 0 && (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              현재 {practiceStats.currentStreak}일 연속 연습 중!
            </div>
          )}
        </section>

        {/* Achievements */}
        {unlockedAchievements.length > 0 && (
          <section className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <Trophy className="w-5 h-5 text-warning" />
              <span className="font-semibold text-foreground">획득한 뱃지</span>
              <span className="text-sm text-muted-foreground">({unlockedAchievements.length}개)</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {unlockedAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary"
                >
                  <span className="text-xl">{achievement.icon}</span>
                  <div>
                    <div className="text-sm font-medium text-foreground">{achievement.name}</div>
                    <div className="text-xs text-muted-foreground">{achievement.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Weekly Report */}
        {weeklyReport && (
          <section className="bg-accent/5 border border-accent/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <TrendingUp className="w-5 h-5 text-accent" />
              <span className="font-semibold text-foreground">이번 주 요약</span>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">
                  {weeklyReport.practicedays}일
                </div>
                <div className="text-sm text-muted-foreground">연습한 날</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">
                  {weeklyReport.totalRecordings}회
                </div>
                <div className="text-sm text-muted-foreground">녹음</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">
                  {formatDuration(weeklyReport.totalPracticeTime)}
                </div>
                <div className="text-sm text-muted-foreground">연습 시간</div>
              </div>
            </div>
            {weeklyReport.mostPracticedSong && (
              <div className="mt-5 pt-5 border-t border-accent/20">
                <div className="text-sm text-muted-foreground">이번 주 가장 많이 연습한 곡</div>
                <div className="text-lg font-medium text-foreground">
                  {weeklyReport.mostPracticedSong.songName}
                </div>
              </div>
            )}
            {weeklyReport.newAchievements.length > 0 && (
              <div className="mt-3 pt-3 border-t border-accent/20 text-sm text-accent">
                이번 주 새로 획득한 뱃지 {weeklyReport.newAchievements.length}개!
              </div>
            )}
          </section>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Weekly Chart */}
          <section className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
              <span className="font-semibold text-foreground">주간 활동</span>
            </div>
            <div className="flex justify-between gap-3 h-32">
              {weeklyData.map((day, i) => (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col items-center gap-2 h-full"
                >
                  <div className="text-xs text-muted-foreground font-medium h-4">
                    {day.recordings > 0 ? day.recordings : ''}
                  </div>
                  <div className="flex-1 w-full flex items-end">
                    <div
                      className={`w-full rounded-md transition-all ${
                        day.recordings > 0 ? 'bg-accent' : 'bg-secondary'
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
                      i === 6 ? 'text-accent font-semibold' : 'text-muted-foreground'
                    }`}
                  >
                    {day.dayLabel}
                  </span>
                </div>
              ))}
            </div>
            <div className="text-center mt-4 text-sm text-muted-foreground">
              이번 주 {stats.last7DaysRecordings}회 녹음 ·{' '}
              {formatDuration(stats.last7DaysPracticeTime)}
            </div>
          </section>

          {/* Tag Distribution */}
          <section className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Trophy className="w-5 h-5 text-muted-foreground" />
              <span className="font-semibold text-foreground">태그 분포</span>
            </div>
            {totalTagCount > 0 ? (
              <div className="space-y-3">
                {tagData.map((tag) =>
                  tag.count > 0 ? (
                    <div key={tag.id} className="flex items-center gap-3">
                      <span className="text-sm text-foreground w-20">
                        {tag.label}
                      </span>
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{
                            width: `${(tag.count / totalTagCount) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-8 text-right">
                        {tag.count}
                      </span>
                    </div>
                  ) : null
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                아직 태그된 녹음이 없습니다
              </div>
            )}
          </section>
        </div>

        {/* Most Practiced Song */}
        {stats.mostPracticedSong && (
          <section className="bg-card border border-border rounded-xl p-6">
            <div className="text-sm text-muted-foreground mb-1">
              가장 많이 연습한 곡
            </div>
            <div className="text-xl font-semibold text-foreground">
              {stats.mostPracticedSong.name}
            </div>
            <div className="text-accent">
              {stats.mostPracticedSong.count}회 녹음
            </div>
          </section>
        )}
      </main>

      <GoalSettingsModal
        show={showGoalSettings}
        onClose={() => setShowGoalSettings(false)}
        goals={goals}
        onSave={setGoals}
      />
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
  subLabel,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subLabel?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      {subLabel && <div className="text-xs text-muted-foreground">{subLabel}</div>}
    </div>
  );
}

// Goal Circle Component
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
            stroke="hsl(var(--border))"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke={isComplete ? 'hsl(var(--success))' : 'hsl(var(--accent))'}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-lg font-bold ${isComplete ? 'text-success' : 'text-foreground'}`}>
            {Math.round(progress)}%
          </span>
        </div>
      </div>
      <div className="text-center mt-2">
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div className="text-xs text-muted-foreground">
          {current} / {target}
        </div>
      </div>
    </div>
  );
}

// Calendar Heatmap Component
function CalendarHeatmap({
  dailyPractice,
}: {
  dailyPractice: DailyPractice[];
}) {
  const calendarData = useMemo(() => {
    const today = new Date();
    const weeks: { date: string; intensity: 0 | 1 | 2 | 3 | 4 }[][] = [];

    const startDate = new Date(today);
    startDate.setDate(today.getDate() - today.getDay() - 11 * 7);

    const practiceMap = new Map<string, DailyPractice>();
    dailyPractice.forEach((dp) => practiceMap.set(dp.date, dp));

    for (let week = 0; week < 12; week++) {
      const weekData: { date: string; intensity: 0 | 1 | 2 | 3 | 4 }[] = [];
      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + week * 7 + day);
        const dateStr = getDateString(currentDate);

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

  const getIntensityColor = (intensity: 0 | 1 | 2 | 3 | 4) => {
    switch (intensity) {
      case 0: return 'bg-secondary';
      case 1: return 'bg-accent/30';
      case 2: return 'bg-accent/50';
      case 3: return 'bg-accent/75';
      case 4: return 'bg-accent';
    }
  };

  return (
    <div className="flex gap-1 overflow-x-auto pb-2">
      {calendarData.map((week, weekIdx) => (
        <div key={weekIdx} className="flex flex-col gap-1">
          {week.map((day) => (
            <div
              key={day.date}
              className={`w-3 h-3 rounded-sm ${getIntensityColor(day.intensity)}`}
              title={day.date}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
