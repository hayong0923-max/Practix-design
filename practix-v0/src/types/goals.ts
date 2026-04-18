/**
 * 연습 목표 관련 타입
 */

export interface PracticeGoals {
  // 일일 목표 (초 단위)
  dailyPracticeTime: number;
  // 일일 녹음 목표 (횟수)
  dailyRecordings: number;
  // 주간 연습 일수 목표
  weeklyPracticeDays: number;
}

export const DEFAULT_GOALS: PracticeGoals = {
  dailyPracticeTime: 30 * 60, // 30분
  dailyRecordings: 5,
  weeklyPracticeDays: 5,
};
