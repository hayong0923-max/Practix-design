'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  PracticeLog,
  PracticeStats,
  Achievement,
  AchievementId,
  DailyPractice,
  WeeklyReport,
  INITIAL_PRACTICE_STATS,
  ACHIEVEMENT_DEFINITIONS,
  calculateIntensity,
  getDateString,
  isYesterday,
} from '@/types';

const STORAGE_KEYS = {
  PRACTICE_LOGS: 'practix_practice_logs',
  PRACTICE_STATS: 'practix_practice_stats',
} as const;

// UUID 생성
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function usePracticeStats() {
  const [logs, setLogs] = useState<PracticeLog[]>([]);
  const [stats, setStats] = useState<PracticeStats>(INITIAL_PRACTICE_STATS);
  const [isLoaded, setIsLoaded] = useState(false);

  // localStorage에서 데이터 로드
  useEffect(() => {
    try {
      const savedLogs = localStorage.getItem(STORAGE_KEYS.PRACTICE_LOGS);
      const savedStats = localStorage.getItem(STORAGE_KEYS.PRACTICE_STATS);

      if (savedLogs) {
        setLogs(JSON.parse(savedLogs));
      }

      if (savedStats) {
        setStats(JSON.parse(savedStats));
      }
    } catch (error) {
      console.error('Failed to load practice stats:', error);
    }
    setIsLoaded(true);
  }, []);

  // 로그 저장
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEYS.PRACTICE_LOGS, JSON.stringify(logs));
    }
  }, [logs, isLoaded]);

  // 통계 저장
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEYS.PRACTICE_STATS, JSON.stringify(stats));
    }
  }, [stats, isLoaded]);

  // 스트릭 업데이트
  const updateStreak = useCallback((currentStats: PracticeStats): PracticeStats => {
    const today = getDateString();
    const { lastPracticeDate, currentStreak, longestStreak } = currentStats;

    if (!lastPracticeDate) {
      // 첫 연습
      return {
        ...currentStats,
        currentStreak: 1,
        longestStreak: Math.max(1, longestStreak),
        lastPracticeDate: today,
      };
    }

    if (lastPracticeDate === today) {
      // 오늘 이미 연습함
      return currentStats;
    }

    if (isYesterday(lastPracticeDate)) {
      // 어제 연습함 -> 스트릭 유지
      const newStreak = currentStreak + 1;
      return {
        ...currentStats,
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, longestStreak),
        lastPracticeDate: today,
      };
    }

    // 스트릭 끊김
    return {
      ...currentStats,
      currentStreak: 1,
      lastPracticeDate: today,
    };
  }, []);

  // 뱃지 체크 및 업데이트
  const checkAchievements = useCallback((
    currentStats: PracticeStats,
    context: {
      isNewRecording?: boolean;
      isNewSong?: boolean;
      practiceHour?: number;
    } = {}
  ): PracticeStats => {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    const nowIso = now.toISOString();

    const newAchievements = [...currentStats.achievements];
    const unlockAchievement = (id: AchievementId) => {
      const idx = newAchievements.findIndex(a => a.id === id);
      if (idx !== -1 && !newAchievements[idx].unlockedAt) {
        newAchievements[idx] = { ...newAchievements[idx], unlockedAt: nowIso };
      }
    };

    // 녹음 관련 뱃지
    if (context.isNewRecording) {
      const total = currentStats.totalRecordings + 1;
      if (total >= 1) unlockAchievement('first_recording');
      if (total >= 10) unlockAchievement('recordings_10');
      if (total >= 50) unlockAchievement('recordings_50');
      if (total >= 100) unlockAchievement('recordings_100');
    }

    // 곡 관련 뱃지
    if (context.isNewSong) {
      const total = currentStats.totalSongs + 1;
      if (total >= 1) unlockAchievement('first_song');
      if (total >= 5) unlockAchievement('songs_5');
      if (total >= 10) unlockAchievement('songs_10');
    }

    // 스트릭 뱃지
    const streak = currentStats.currentStreak;
    if (streak >= 3) unlockAchievement('streak_3');
    if (streak >= 7) unlockAchievement('streak_7');
    if (streak >= 14) unlockAchievement('streak_14');
    if (streak >= 30) unlockAchievement('streak_30');
    if (streak >= 100) unlockAchievement('streak_100');

    // 연습 시간 뱃지 (시간 단위)
    const totalHours = currentStats.totalPracticeTime / 3600;
    if (totalHours >= 1) unlockAchievement('practice_1h');
    if (totalHours >= 10) unlockAchievement('practice_10h');
    if (totalHours >= 50) unlockAchievement('practice_50h');
    if (totalHours >= 100) unlockAchievement('practice_100h');

    // 특별 뱃지
    if (hour < 6) unlockAchievement('early_bird');
    if (hour >= 0 && hour < 5) unlockAchievement('night_owl');

    // 주말 전사 체크는 별도로 처리 필요 (주말 3시간 이상)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // 오늘 총 연습 시간 계산 필요
    }

    return { ...currentStats, achievements: newAchievements };
  }, []);

  // 연습 로그 추가
  const addPracticeLog = useCallback((
    log: Omit<PracticeLog, 'id' | 'timestamp'>
  ) => {
    const newLog: PracticeLog = {
      ...log,
      id: generateId(),
      timestamp: Date.now(),
    };

    setLogs(prev => [...prev, newLog]);

    // 통계 업데이트
    setStats(prev => {
      let updated = { ...prev };

      // 연습 시간 추가
      updated.totalPracticeTime += log.totalDuration;

      // 녹음 수 추가
      if (log.recordingsMade > 0) {
        updated.totalRecordings += log.recordingsMade;
      }

      // 스트릭 업데이트
      updated = updateStreak(updated);

      // 뱃지 체크
      updated = checkAchievements(updated, {
        isNewRecording: log.recordingsMade > 0,
      });

      return updated;
    });

    return newLog;
  }, [updateStreak, checkAchievements]);

  // 녹음 완료 이벤트
  const onRecordingComplete = useCallback((
    songId: number,
    songName: string,
    sessionId?: number,
    sessionName?: string,
    sectionId?: number,
    durationSeconds: number = 0
  ) => {
    const today = getDateString();

    addPracticeLog({
      date: today,
      songId,
      songName,
      sessionId,
      sessionName,
      sectionId,
      totalDuration: durationSeconds,
      recordingsMade: 1,
      sectionsCreated: 0,
    });
  }, [addPracticeLog]);

  // 곡 추가 이벤트
  const onSongAdded = useCallback(() => {
    setStats(prev => {
      let updated = { ...prev, totalSongs: prev.totalSongs + 1 };
      updated = checkAchievements(updated, { isNewSong: true });
      return updated;
    });
  }, [checkAchievements]);

  // 구간 생성 이벤트
  const onSectionCreated = useCallback((
    songId: number,
    songName: string
  ) => {
    const today = getDateString();

    addPracticeLog({
      date: today,
      songId,
      songName,
      totalDuration: 0,
      recordingsMade: 0,
      sectionsCreated: 1,
    });
  }, [addPracticeLog]);

  // 일별 연습 데이터 (캘린더 히트맵용)
  const dailyPractice = useMemo((): DailyPractice[] => {
    const dailyMap = new Map<string, { duration: number; recordings: number }>();

    logs.forEach(log => {
      const existing = dailyMap.get(log.date) || { duration: 0, recordings: 0 };
      dailyMap.set(log.date, {
        duration: existing.duration + log.totalDuration,
        recordings: existing.recordings + log.recordingsMade,
      });
    });

    return Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      totalDuration: data.duration,
      recordingsMade: data.recordings,
      intensity: calculateIntensity(data.duration),
    }));
  }, [logs]);

  // 주간 리포트 생성
  const getWeeklyReport = useCallback((weekOffset: number = 0): WeeklyReport | null => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() - (weekOffset * 7));
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const weekStart = getDateString(startOfWeek);
    const weekEnd = getDateString(endOfWeek);

    // 해당 주의 로그 필터
    const weekLogs = logs.filter(log => {
      return log.date >= weekStart && log.date <= weekEnd;
    });

    if (weekLogs.length === 0) return null;

    // 집계
    const totalPracticeTime = weekLogs.reduce((sum, log) => sum + log.totalDuration, 0);
    const totalRecordings = weekLogs.reduce((sum, log) => sum + log.recordingsMade, 0);

    // 연습한 일수
    const practiceDays = new Set(weekLogs.map(log => log.date)).size;

    // 가장 많이 연습한 곡
    const songDurations = new Map<number, { name: string; duration: number }>();
    weekLogs.forEach(log => {
      const existing = songDurations.get(log.songId) || { name: log.songName, duration: 0 };
      songDurations.set(log.songId, {
        name: log.songName,
        duration: existing.duration + log.totalDuration,
      });
    });

    let mostPracticedSong: WeeklyReport['mostPracticedSong'] = null;
    let maxDuration = 0;
    songDurations.forEach((data, songId) => {
      if (data.duration > maxDuration) {
        maxDuration = data.duration;
        mostPracticedSong = {
          songId,
          songName: data.name,
          duration: data.duration,
        };
      }
    });

    // 이번 주 새로 획득한 뱃지
    const newAchievements: AchievementId[] = stats.achievements
      .filter(a => {
        if (!a.unlockedAt) return false;
        const unlockedDate = a.unlockedAt.split('T')[0];
        return unlockedDate >= weekStart && unlockedDate <= weekEnd;
      })
      .map(a => a.id);

    return {
      weekStart,
      weekEnd,
      totalPracticeTime,
      totalRecordings,
      practicedays: practiceDays,
      mostPracticedSong,
      newAchievements,
    };
  }, [logs, stats.achievements]);

  // 획득한 뱃지 목록
  const unlockedAchievements = useMemo(() => {
    return stats.achievements
      .filter(a => a.unlockedAt)
      .map(a => {
        const def = ACHIEVEMENT_DEFINITIONS.find(d => d.id === a.id);
        return { ...a, ...def };
      });
  }, [stats.achievements]);

  // 미획득 뱃지 목록
  const lockedAchievements = useMemo(() => {
    return stats.achievements
      .filter(a => !a.unlockedAt)
      .map(a => {
        const def = ACHIEVEMENT_DEFINITIONS.find(d => d.id === a.id);
        return { ...a, ...def };
      });
  }, [stats.achievements]);

  // 데이터 초기화 (테스트용)
  const resetStats = useCallback(() => {
    setLogs([]);
    setStats(INITIAL_PRACTICE_STATS);
  }, []);

  return {
    // 상태
    stats,
    logs,
    isLoaded,
    dailyPractice,
    unlockedAchievements,
    lockedAchievements,

    // 이벤트 핸들러
    onRecordingComplete,
    onSongAdded,
    onSectionCreated,
    addPracticeLog,

    // 리포트
    getWeeklyReport,

    // 유틸
    resetStats,
  };
}
