// Re-export all types from separate files
export type { Recording, TimeSignature, BackingTrack, PredefinedTag } from './recording';
export type { Section } from './section';
export type { Session, Song, ZoomLevel, MetronomeSettings } from './song';
export type { PracticeGoals } from './goals';
export { DEFAULT_GOALS } from './goals';
export type { CustomTag } from './customTag';
export { TAG_COLOR_PRESETS, getColorClass } from './customTag';
export type { SheetMusic, SheetRegion } from './sheetMusic';
export { REGION_COLORS, getNextRegionColor } from './sheetMusic';
export type { TrashedRecording } from './trash';
export { TRASH_RETENTION_DAYS, isTrashItemExpired, getDaysUntilDeletion } from './trash';
export type {
  PracticeLog,
  Achievement,
  AchievementDefinition,
  AchievementId,
  PracticeStats,
  WeeklyReport,
  DailyPractice,
} from './practiceStats';
export {
  ACHIEVEMENT_IDS,
  ACHIEVEMENT_DEFINITIONS,
  INITIAL_PRACTICE_STATS,
  calculateIntensity,
  getDateString,
  isToday,
  isYesterday,
} from './practiceStats';
