import { PredefinedTag, CustomTag } from '@/types';

/**
 * 앱 전체에서 사용하는 태그 정의
 * 이 파일이 태그의 단일 소스입니다.
 * SectionCard, RecordingsList 등에서 이 태그를 import해서 사용합니다.
 *
 * 기본 태그는 제공하지 않고, 사용자가 직접 만들도록 합니다.
 */
export const PREDEFINED_TAGS: PredefinedTag[] = [];

// 태그 ID 타입 (타입 안전성을 위해)
export type TagId = typeof PREDEFINED_TAGS[number]['id'];

// 태그 ID로 기본 태그 정보 찾기 헬퍼 함수
export function getTagById(tagId: string): PredefinedTag | undefined {
  return PREDEFINED_TAGS.find((t) => t.id === tagId);
}

// 태그 ID로 태그 정보 찾기 (기본 + 커스텀)
export function findTag(tagId: string, customTags: CustomTag[]): { label: string; color: string } | undefined {
  const predefined = PREDEFINED_TAGS.find((t) => t.id === tagId);
  if (predefined) return predefined;

  const custom = customTags.find((t) => t.id === tagId);
  if (custom) return { label: custom.label, color: custom.color };

  return undefined;
}
