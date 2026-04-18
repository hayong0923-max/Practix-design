import { Recording } from './recording';

export interface TrashedRecording {
  recording: Recording;
  deletedAt: string; // ISO date string
  originalLocation: {
    songId: number;
    sessionId: number;
    sectionId: number | null; // null이면 기본 녹음
    sectionIndex: number; // 구간 순서 (복구 시 참조용)
  };
}

// 자동 삭제까지 남은 일수 (7일)
export const TRASH_RETENTION_DAYS = 7;

// 휴지통 아이템이 만료되었는지 확인
export function isTrashItemExpired(deletedAt: string): boolean {
  const deletedDate = new Date(deletedAt);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - deletedDate.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= TRASH_RETENTION_DAYS;
}

// 남은 일수 계산
export function getDaysUntilDeletion(deletedAt: string): number {
  const deletedDate = new Date(deletedAt);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - deletedDate.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, TRASH_RETENTION_DAYS - diffDays);
}
