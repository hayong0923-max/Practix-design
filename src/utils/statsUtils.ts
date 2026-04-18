/**
 * 연습 통계 계산 유틸리티
 */

import { Song, Recording } from '@/types';

export interface PracticeStats {
  // 총계
  totalSongs: number;
  totalSessions: number;
  totalSections: number;
  totalRecordings: number;

  // 연습 시간 (초)
  totalPracticeTime: number; // 구간 길이 * 녹음 횟수로 추정

  // 날짜별 통계
  recordingsByDate: Record<string, number>;
  practiceTimeByDate: Record<string, number>;

  // 태그 분포
  tagCounts: Record<string, number>;

  // 최근 7일 연습량
  last7DaysRecordings: number;
  last7DaysPracticeTime: number;

  // 연습 연속 기록 (일)
  currentStreak: number;
  longestStreak: number;

  // 가장 많이 연습한 곡
  mostPracticedSong: { name: string; count: number } | null;

  // 오늘 통계
  todayRecordings: number;
  todayPracticeTime: number;
}

/**
 * 모든 녹음 추출
 */
export function getAllRecordings(songs: Song[]): Array<{
  recording: Recording;
  songName: string;
  sessionName: string;
  sectionDuration: number;
}> {
  const results: Array<{
    recording: Recording;
    songName: string;
    sessionName: string;
    sectionDuration: number;
  }> = [];

  for (const song of songs) {
    for (const session of song.sessions) {
      for (const section of session.sections) {
        const sectionDuration = section.end - section.start;
        for (const recording of section.recordedFiles || []) {
          results.push({
            recording,
            songName: song.name,
            sessionName: session.name,
            sectionDuration,
          });
        }
      }
    }
  }

  return results;
}

/**
 * 날짜 문자열을 YYYY-MM-DD 형식으로 정규화
 */
function normalizeDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  } catch {
    return dateStr;
  }
}

/**
 * 오늘 날짜 (YYYY-MM-DD)
 */
function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * N일 전 날짜
 */
function getDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

/**
 * 연습 연속 기록 계산
 */
function calculateStreak(recordingsByDate: Record<string, number>): {
  current: number;
  longest: number;
} {
  const dates = Object.keys(recordingsByDate).sort().reverse();
  if (dates.length === 0) return { current: 0, longest: 0 };

  const today = getToday();
  const yesterday = getDaysAgo(1);

  // 현재 스트릭 계산
  let currentStreak = 0;
  let checkDate = today;

  // 오늘 또는 어제부터 시작
  if (recordingsByDate[today]) {
    checkDate = today;
  } else if (recordingsByDate[yesterday]) {
    checkDate = yesterday;
  } else {
    currentStreak = 0;
  }

  if (checkDate === today || checkDate === yesterday) {
    const startDate = new Date(checkDate);
    while (true) {
      const dateStr = startDate.toISOString().split('T')[0];
      if (recordingsByDate[dateStr]) {
        currentStreak++;
        startDate.setDate(startDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // 최장 스트릭 계산
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;

  for (const dateStr of dates.sort()) {
    const currentDate = new Date(dateStr);
    if (prevDate) {
      const diffDays = Math.round(
        (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    } else {
      tempStreak = 1;
    }
    prevDate = currentDate;
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return { current: currentStreak, longest: longestStreak };
}

/**
 * 전체 통계 계산
 */
export function calculateStats(songs: Song[]): PracticeStats {
  const allRecordings = getAllRecordings(songs);

  // 기본 카운트
  let totalSessions = 0;
  let totalSections = 0;

  for (const song of songs) {
    totalSessions += song.sessions.length;
    for (const session of song.sessions) {
      totalSections += session.sections.length;
    }
  }

  // 날짜별 녹음 수 & 연습 시간
  const recordingsByDate: Record<string, number> = {};
  const practiceTimeByDate: Record<string, number> = {};
  const tagCounts: Record<string, number> = {};
  const songPracticeCounts: Record<string, number> = {};

  let totalPracticeTime = 0;

  for (const item of allRecordings) {
    const date = normalizeDate(item.recording.uploadDate);

    // 날짜별 카운트
    recordingsByDate[date] = (recordingsByDate[date] || 0) + 1;
    practiceTimeByDate[date] =
      (practiceTimeByDate[date] || 0) + item.sectionDuration;

    // 총 연습 시간
    totalPracticeTime += item.sectionDuration;

    // 태그 카운트
    for (const tag of item.recording.tags || []) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }

    // 곡별 연습 횟수
    songPracticeCounts[item.songName] =
      (songPracticeCounts[item.songName] || 0) + 1;
  }

  // 최근 7일 통계
  const today = getToday();
  const sevenDaysAgo = getDaysAgo(7);
  let last7DaysRecordings = 0;
  let last7DaysPracticeTime = 0;

  for (const [date, count] of Object.entries(recordingsByDate)) {
    if (date >= sevenDaysAgo && date <= today) {
      last7DaysRecordings += count;
      last7DaysPracticeTime += practiceTimeByDate[date] || 0;
    }
  }

  // 오늘 통계
  const todayRecordings = recordingsByDate[today] || 0;
  const todayPracticeTime = practiceTimeByDate[today] || 0;

  // 연습 스트릭
  const { current: currentStreak, longest: longestStreak } =
    calculateStreak(recordingsByDate);

  // 가장 많이 연습한 곡
  let mostPracticedSong: { name: string; count: number } | null = null;
  for (const [name, count] of Object.entries(songPracticeCounts)) {
    if (!mostPracticedSong || count > mostPracticedSong.count) {
      mostPracticedSong = { name, count };
    }
  }

  return {
    totalSongs: songs.length,
    totalSessions,
    totalSections,
    totalRecordings: allRecordings.length,
    totalPracticeTime,
    recordingsByDate,
    practiceTimeByDate,
    tagCounts,
    last7DaysRecordings,
    last7DaysPracticeTime,
    currentStreak,
    longestStreak,
    mostPracticedSong,
    todayRecordings,
    todayPracticeTime,
  };
}

/**
 * 시간을 읽기 쉬운 형식으로 변환
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}초`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);

  if (minutes < 60) {
    return remainingSeconds > 0
      ? `${minutes}분 ${remainingSeconds}초`
      : `${minutes}분`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0
    ? `${hours}시간 ${remainingMinutes}분`
    : `${hours}시간`;
}

/**
 * 최근 N일 날짜 배열 생성
 */
export function getLastNDays(n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    days.push(getDaysAgo(i));
  }
  return days;
}
