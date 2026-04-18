/**
 * 악보 이미지 및 영역 타입 정의
 */

// 악보 이미지 위의 영역 (섹션과 연결됨)
export interface SheetRegion {
  id: string;
  // 영역 좌표 (이미지 비율 기준, 0-1 범위)
  x: number;      // 왼쪽 위 x
  y: number;      // 왼쪽 위 y
  width: number;  // 너비 (비율)
  height: number; // 높이 (비율)
  // 연결된 섹션 ID
  sectionId: number | null;
  // 표시 순서
  order: number;
  // 영역 색상 (시각화용)
  color?: string;
}

// 악보 데이터
export interface SheetMusic {
  id: string;
  // 이미지 데이터 (base64 또는 URL)
  imageData: string;
  // 이미지 원본 크기
  originalWidth: number;
  originalHeight: number;
  // 영역 목록
  regions: SheetRegion[];
  // 생성/수정 일시
  createdAt: string;
  updatedAt: string;
}

// 영역 색상 프리셋
export const REGION_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
];

// 다음 영역 색상 가져오기
export function getNextRegionColor(existingRegions: SheetRegion[]): string {
  const usedColors = new Set(existingRegions.map(r => r.color));
  for (const color of REGION_COLORS) {
    if (!usedColors.has(color)) {
      return color;
    }
  }
  // 모든 색상이 사용된 경우 첫 번째 색상 반환
  return REGION_COLORS[existingRegions.length % REGION_COLORS.length];
}
