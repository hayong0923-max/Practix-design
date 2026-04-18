# Practix

음악 연습용 A/B 비교 앱. Next.js 14 + React + TypeScript + Tailwind CSS + Supabase.

## 핵심 개념

- **Song**: 노래 (여러 Session 포함)
- **Session**: 연습 세션 (원곡 파일 + 여러 Section)
- **Section**: 연습 구간 (시작/끝 시간 + 녹음 파일들 + 반주)
- **Recording**: 녹음 파일 (태그, 메모 포함)
- **BackingTrack**: 반주 (MR/메트로놈/커스텀)

## 버전 관리

**현재 버전**: `0.1.0` (정식 출시 전)

### 규칙 (Semantic Versioning)
```
MAJOR.MINOR.PATCH
  │     │     └── 버그 수정
  │     └──────── 기능 추가
  └────────────── 정식 출시 / Breaking change
```

- **`CHANGELOG.md`에 모든 변경사항 기록**
- 기능 추가 → MINOR 올림 (0.2.0)
- 버그 수정 → PATCH 올림 (0.1.1)
- `1.0.0` = 정식 출시

### 버전 업데이트 시점
1. 기능 완성 후 커밋 전
2. `package.json` 버전 수정
3. `CHANGELOG.md`에 변경사항 추가

## 파일 구조

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # 랜딩페이지 (/)
│   ├── app/page.tsx       # 앱 + 온보딩 (/app)
│   └── layout.tsx         # 레이아웃
├── contexts/
│   ├── PracticeContext.tsx      # 연습 페이지 공유 상태 (Provider + 13개 훅 싱글턴)
│   └── PracticeStatsContext.tsx # 연습 통계 컨텍스트
├── components/
│   ├── auth/              # 인증 관련
│   │   └── AuthModal.tsx  # 로그인/회원가입 모달
│   ├── LandingPage.tsx    # 랜딩 페이지
│   ├── Onboarding.tsx     # 온보딩 튜토리얼
│   ├── NotificationSignup.tsx  # 모바일 앱 알림 신청 (Supabase 연동)
│   ├── MusicPracticeApp.tsx    # 앱 메인 컨테이너
│   ├── pages/
│   │   ├── PracticePage.tsx    # 연습 페이지 (~100줄, 조합 레이어)
│   │   ├── SessionsPage.tsx    # 세션 목록
│   │   └── SongsPage.tsx       # 곡 목록
│   ├── practice/
│   │   ├── AudioComparePlayer/ # A/B 비교 플레이어
│   │   │   ├── AudioComparePlayer.tsx
│   │   │   ├── useAudioCompare.ts
│   │   │   └── index.ts
│   │   ├── WaveformDisplay/    # 파형 캔버스 + 재생 컨트롤
│   │   │   ├── WaveformDisplay.tsx
│   │   │   ├── useWaveformRenderer.ts
│   │   │   └── index.ts
│   │   ├── SectionManager/     # 구간 목록 + CRUD + 모달
│   │   │   ├── SectionManager.tsx
│   │   │   ├── useSections.ts
│   │   │   └── index.ts
│   │   ├── RecordingControls/  # 기본 녹음 + FAB + 카운트다운
│   │   │   ├── RecordingControls.tsx
│   │   │   ├── useBasicRecording.ts
│   │   │   └── index.ts
│   │   ├── SessionMeta/        # 악보, 피치, 태그 모달
│   │   │   ├── SessionMeta.tsx
│   │   │   └── index.ts
│   │   ├── WaveformCanvas.tsx  # 파형 렌더링 (Canvas)
│   │   ├── SectionCard.tsx     # 구간 카드
│   │   ├── RecordingsList.tsx  # 녹음 목록
│   │   └── section/            # SectionCard 하위 컴포넌트
│   └── modals/
├── hooks/
│   ├── useAuth.ts             # Supabase 인증 상태
│   ├── useAudioContext.ts     # AudioContext 관리
│   ├── useAudioPlayback.ts    # 원곡 재생 제어
│   ├── useRecordedPlayback.ts # 녹음 재생 제어
│   ├── useRecording.ts        # 녹음 기능
│   ├── useMetronome.ts        # 메트로놈
│   └── practice/              # PracticePage 전용 훅
│       ├── useBackingTrackHandlers.ts
│       └── useAudioManagement.ts
├── lib/
│   └── supabase/              # Supabase 클라이언트
│       ├── client.ts          # 브라우저용
│       └── server.ts          # 서버용
├── types/
│   ├── index.ts              # 모든 타입 재export
│   ├── database.ts           # Supabase DB 타입
│   ├── recording.ts          # Recording, BackingTrack
│   ├── section.ts            # Section
│   └── song.ts               # Song, Session
├── utils/
│   └── formatTime.ts         # 시간 포맷팅
└── constants/
    └── tags.ts               # 태그 상수

supabase/
├── schema.sql                # DB 스키마 (테이블, RLS, 트리거)
└── storage.sql               # Storage 버킷 및 정책
```

## 수정 시 주의사항

1. **Web Audio API**는 `hooks/` 폴더에서만 관리
2. **타입**은 `types/` 폴더에 정의 후 `index.ts`에서 재export
3. **데이터 저장**: Supabase (로그인 유저) + localStorage (비로그인/백업)
4. **컴포넌트 분해**: props가 10개 넘으면 하위 컴포넌트로 분리 권장
5. **인증**: `useAuth()` 훅 사용, Supabase Auth 기반

## 주요 파일별 역할

| 파일 | 라인수 | 역할 |
|------|--------|------|
| PracticePage.tsx | ~100 | 연습 페이지 조합 레이어 (분해 완료) |
| PracticeContext.tsx | ~370 | 연습 페이지 공유 상태 Provider |
| WaveformDisplay.tsx | ~300 | 파형 + 재생 컨트롤 |
| SectionManager.tsx | ~250 | 구간 리스트 + 모달 |
| useSections.ts | ~400 | 구간/녹음 CRUD 로직 |
| RecordingControls.tsx | ~180 | 기본 녹음 + FAB |
| SessionMeta.tsx | ~170 | 악보/피치/태그 |
| AudioComparePlayer.tsx | ~540 | A/B 비교 UI/재생 |
| StatsPage.tsx | 1,072 | 연습 통계/리포트 |
| WaveformCanvas.tsx | 594 | 파형 렌더링 (Canvas) |
| SectionPracticeModal.tsx | 573 | 구간 연습 모달 |
| SectionCard.tsx | 416 | 구간 카드 |

## 자주 수정하는 기능

- 녹음: `hooks/useRecording.ts`, `SectionActionButtons.tsx`
- 재생: `hooks/useAudioPlayback.ts`, `AudioComparePlayer/`
- 메트로놈: `hooks/useMetronome.ts`, `BackingTrackSection.tsx`
- 구간 관리: `SectionManager/useSections.ts`
- 기본 녹음: `RecordingControls/useBasicRecording.ts`
- 파형 UI: `WaveformDisplay/useWaveformRenderer.ts`

## 기술 스택

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Web Audio API
- Supabase (인증 + DB + Storage)
- localStorage (로컬 백업)

## Supabase 구조

### 테이블
- `profiles`: 유저 프로필 (얼리어답터 여부, 저장 용량)
- `songs`: 곡
- `sessions`: 연습 세션
- `sections`: 연습 구간
- `recordings`: 녹음 파일 메타데이터
- `early_signups`: 사전 알림 신청

### Storage
- `audio` 버킷: 오디오 파일 저장 (유저별 폴더)

### 주요 파일
- `src/lib/supabase/client.ts`: 브라우저 클라이언트
- `src/lib/supabase/server.ts`: 서버 클라이언트
- `src/hooks/useAuth.ts`: 인증 상태 관리
- `src/components/auth/AuthModal.tsx`: 로그인/회원가입 UI
- `supabase/schema.sql`: DB 스키마
- `supabase/storage.sql`: Storage 정책

---

## 프로젝트 분석 결과 (2026-02-01)

### 해결된 문제
- ~~PracticePage.tsx 과대화 (2,296줄)~~ → **분해 완료** (2026-03-08, ~100줄 조합 레이어)
- ~~상태 관리 산재~~ → **PracticeContext로 통합** (2026-03-08)

### 남은 문제
- 플랫폼 조건부 코드 - `if (isCapacitor)` 산재
- 저장소 전략 혼재 - Web(IndexedDB) / Mobile(파일) / Cloud(Supabase)

### 개선 우선순위
| 우선순위 | 작업 |
|----------|------|
| ~~높음~~ | ~~PracticePage 분해~~ ✅ 완료 |
| ~~높음~~ | ~~상태 통합 (Context)~~ ✅ 완료 |
| 높음 | 캔버스 파형 성능 최적화 (Phase 2) |
| 중간 | 저장소 추상화 |
| 중간 | 오디오 유틸 함수 정리 |
| 낮음 | 성능 최적화 (memo, useMemo) |

---

## 현재 작업 (세션 복구용)

### v0.1.0 완료 (2026-02-03)
- 구간 이름 변경, 새 구간 하이라이트, 라우팅 분리, AB 비교 녹음 전환

### PracticePage 리팩토링 완료 (2026-03-08)
- Phase 1 완료: 2,118줄 → ~100줄 (5개 모듈 분해)
- 상세: `memory/2026-03-08-refactoring-plan.md` 참조

### 다음 할 일
- Phase 2: 캔버스 파형 성능 최적화 (Android Capacitor WebView)
- 수동 테스트: 모바일/웹 전체 기능 확인
