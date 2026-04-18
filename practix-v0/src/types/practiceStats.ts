// 연습 로그 - 녹음과 별도 저장 (녹음 삭제해도 연습 기록은 유지)
export interface PracticeLog {
  id: string;                 // UUID
  date: string;               // "2024-01-15" (YYYY-MM-DD)
  songId: number;
  songName: string;
  sessionId?: number;
  sessionName?: string;
  sectionId?: number;
  totalDuration: number;      // 연습 시간 (초)
  recordingsMade: number;     // 녹음 횟수
  sectionsCreated: number;    // 생성한 구간 수
  timestamp: number;          // 생성 시각 (ms)
}

// 성취 뱃지 ID 상수
export const ACHIEVEMENT_IDS = {
  // 녹음 관련
  FIRST_RECORDING: 'first_recording',
  RECORDINGS_10: 'recordings_10',
  RECORDINGS_50: 'recordings_50',
  RECORDINGS_100: 'recordings_100',

  // 연속 연습 (스트릭)
  STREAK_3: 'streak_3',
  STREAK_7: 'streak_7',
  STREAK_14: 'streak_14',
  STREAK_30: 'streak_30',
  STREAK_100: 'streak_100',

  // 연습 시간
  PRACTICE_1H: 'practice_1h',
  PRACTICE_10H: 'practice_10h',
  PRACTICE_50H: 'practice_50h',
  PRACTICE_100H: 'practice_100h',

  // 곡 관련
  FIRST_SONG: 'first_song',
  SONGS_5: 'songs_5',
  SONGS_10: 'songs_10',

  // 특별
  EARLY_BIRD: 'early_bird',       // 오전 6시 이전 연습
  NIGHT_OWL: 'night_owl',         // 자정 이후 연습
  WEEKEND_WARRIOR: 'weekend_warrior', // 주말 3시간 이상 연습
} as const;

export type AchievementId = typeof ACHIEVEMENT_IDS[keyof typeof ACHIEVEMENT_IDS];

// 성취 뱃지 정의
export interface AchievementDefinition {
  id: AchievementId;
  name: string;
  description: string;
  icon: string;               // 이모지 또는 아이콘 이름
  category: 'recording' | 'streak' | 'time' | 'song' | 'special';
}

// 사용자의 성취 상태
export interface Achievement {
  id: AchievementId;
  unlockedAt: string | null;  // ISO 날짜 문자열, null이면 미획득
}

// 성취 뱃지 전체 정의
export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  // 녹음 관련
  { id: 'first_recording', name: '첫 녹음', description: '첫 번째 녹음을 완료했습니다', icon: '🎤', category: 'recording' },
  { id: 'recordings_10', name: '녹음 10개', description: '녹음 10개를 달성했습니다', icon: '🎙️', category: 'recording' },
  { id: 'recordings_50', name: '녹음 50개', description: '녹음 50개를 달성했습니다', icon: '🎧', category: 'recording' },
  { id: 'recordings_100', name: '녹음 마스터', description: '녹음 100개를 달성했습니다', icon: '🏆', category: 'recording' },

  // 연속 연습
  { id: 'streak_3', name: '3일 연속', description: '3일 연속으로 연습했습니다', icon: '🔥', category: 'streak' },
  { id: 'streak_7', name: '1주 연속', description: '7일 연속으로 연습했습니다', icon: '⭐', category: 'streak' },
  { id: 'streak_14', name: '2주 연속', description: '14일 연속으로 연습했습니다', icon: '🌟', category: 'streak' },
  { id: 'streak_30', name: '한 달 연속', description: '30일 연속으로 연습했습니다', icon: '💫', category: 'streak' },
  { id: 'streak_100', name: '100일 연속', description: '100일 연속으로 연습했습니다', icon: '👑', category: 'streak' },

  // 연습 시간
  { id: 'practice_1h', name: '1시간 연습', description: '총 1시간 연습했습니다', icon: '⏱️', category: 'time' },
  { id: 'practice_10h', name: '10시간 연습', description: '총 10시간 연습했습니다', icon: '⏰', category: 'time' },
  { id: 'practice_50h', name: '50시간 연습', description: '총 50시간 연습했습니다', icon: '🕐', category: 'time' },
  { id: 'practice_100h', name: '연습 마스터', description: '총 100시간 연습했습니다', icon: '🎯', category: 'time' },

  // 곡 관련
  { id: 'first_song', name: '첫 곡 등록', description: '첫 번째 곡을 등록했습니다', icon: '🎵', category: 'song' },
  { id: 'songs_5', name: '5곡 등록', description: '5곡을 등록했습니다', icon: '🎶', category: 'song' },
  { id: 'songs_10', name: '10곡 등록', description: '10곡을 등록했습니다', icon: '🎼', category: 'song' },

  // 특별
  { id: 'early_bird', name: '얼리버드', description: '오전 6시 이전에 연습했습니다', icon: '🌅', category: 'special' },
  { id: 'night_owl', name: '올빼미', description: '자정 이후에 연습했습니다', icon: '🦉', category: 'special' },
  { id: 'weekend_warrior', name: '주말 전사', description: '주말에 3시간 이상 연습했습니다', icon: '⚔️', category: 'special' },
];

// 연습 통계 (집계)
export interface PracticeStats {
  currentStreak: number;      // 현재 연속 일수
  longestStreak: number;      // 최장 연속 일수
  totalRecordings: number;    // 총 녹음 수
  totalPracticeTime: number;  // 총 연습 시간 (초)
  totalSongs: number;         // 총 곡 수
  achievements: Achievement[];
  lastPracticeDate: string | null; // 마지막 연습 날짜 (YYYY-MM-DD)
}

// 초기 통계 상태
export const INITIAL_PRACTICE_STATS: PracticeStats = {
  currentStreak: 0,
  longestStreak: 0,
  totalRecordings: 0,
  totalPracticeTime: 0,
  totalSongs: 0,
  achievements: ACHIEVEMENT_DEFINITIONS.map(def => ({
    id: def.id,
    unlockedAt: null,
  })),
  lastPracticeDate: null,
};

// 주간 리포트
export interface WeeklyReport {
  weekStart: string;          // 주 시작일 (YYYY-MM-DD)
  weekEnd: string;            // 주 종료일 (YYYY-MM-DD)
  totalPracticeTime: number;  // 주간 연습 시간 (초)
  totalRecordings: number;    // 주간 녹음 수
  practicedays: number;       // 연습한 일수
  mostPracticedSong: {
    songId: number;
    songName: string;
    duration: number;
  } | null;
  newAchievements: AchievementId[]; // 이번 주 획득한 뱃지
}

// 일별 연습 데이터 (캘린더 히트맵용)
export interface DailyPractice {
  date: string;               // YYYY-MM-DD
  totalDuration: number;      // 총 연습 시간 (초)
  recordingsMade: number;     // 녹음 횟수
  intensity: 0 | 1 | 2 | 3 | 4; // 히트맵 강도 (0=없음, 4=매우 많음)
}

// 히트맵 강도 계산 (분 기준)
export function calculateIntensity(durationSeconds: number): 0 | 1 | 2 | 3 | 4 {
  const minutes = durationSeconds / 60;
  if (minutes === 0) return 0;
  if (minutes < 15) return 1;
  if (minutes < 30) return 2;
  if (minutes < 60) return 3;
  return 4;
}

// 날짜 유틸리티
export function getDateString(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

export function isToday(dateString: string): boolean {
  return dateString === getDateString();
}

export function isYesterday(dateString: string): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return dateString === getDateString(yesterday);
}
