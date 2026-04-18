# Practix 리팩토링 계획서

## 현재 코드베이스 분석 요약

### 주요 문제점

| 영역 | 문제 | 심각도 |
|------|------|--------|
| 컴포넌트 구조 | PracticePage 1,420줄 - 너무 큼 | 높음 |
| 태그 시스템 | 3곳에서 중복 정의, 값도 다름 | 높음 |
| 상태 관리 | 20+ 개별 useState, 응집력 없음 | 높음 |
| 코드 중복 | 오디오 디코딩, 모바일/웹 UI | 중간 |
| 성능 | memoization 없음, 비효율적인 effect | 중간 |
| 타입 안전성 | 느슨한 타입, 검증 부족 | 낮음 |

---

## 1단계: 태그 시스템 통합 (우선순위: 높음)

### 문제

현재 3개의 파일에서 서로 다른 태그를 정의:

```
src/constants/tags.ts:        8개 태그 (pitch, rhythm, dynamics...)
src/components/practice/SectionCard.tsx:  5개 태그 (good, practice, timing...)
src/components/practice/RecordingsList.tsx: 5개 태그 (good, practice, timing...)
```

### 해결 방안

```typescript
// src/constants/tags.ts - 단일 소스로 통합
export const PREDEFINED_TAGS = [
  { id: 'good', label: '잘됨', color: 'green' },
  { id: 'practice', label: '연습필요', color: 'yellow' },
  { id: 'timing', label: '박자', color: 'blue' },
  { id: 'pitch', label: '음정', color: 'purple' },
  { id: 'dynamics', label: '강약', color: 'orange' },
] as const;

export type TagId = typeof PREDEFINED_TAGS[number]['id'];
```

### 작업 항목

- [ ] `src/constants/tags.ts` 태그 목록 통일
- [ ] `SectionCard.tsx`에서 로컬 PREDEFINED_TAGS 제거, import 사용
- [ ] `RecordingsList.tsx`에서 로컬 PREDEFINED_TAGS 제거, import 사용
- [ ] 태그 타입 강화 (`TagId` 타입 사용)

---

## 2단계: 오디오 유틸리티 추출 (우선순위: 높음)

### 문제

오디오 디코딩 로직이 여러 곳에 중복:
- `PracticePage.tsx`
- `useRecordedPlayback.ts`
- `useBackingTrackHandlers.ts`

### 해결 방안

```typescript
// src/utils/audioUtils.ts
export async function decodeAudioData(
  audioContext: AudioContext,
  data: string
): Promise<AudioBuffer> {
  const response = await fetch(data);
  const arrayBuffer = await response.arrayBuffer();
  return audioContext.decodeAudioData(arrayBuffer);
}

export function createAudioSource(
  audioContext: AudioContext,
  buffer: AudioBuffer,
  options?: { playbackRate?: number; loop?: boolean }
): AudioBufferSourceNode {
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  if (options?.playbackRate) source.playbackRate.value = options.playbackRate;
  if (options?.loop) source.loop = true;
  return source;
}
```

### 작업 항목

- [ ] `src/utils/audioUtils.ts` 생성
- [ ] `decodeAudioData` 함수 추출
- [ ] `createAudioSource` 함수 추출
- [ ] 각 파일에서 중복 코드 제거하고 유틸리티 사용

---

## 3단계: PracticePage 분리 (우선순위: 높음)

### 현재 구조 (1,420줄)

```
PracticePage
├── 20+ useState
├── 오디오 재생 로직
├── 녹음 로직
├── 백킹트랙 로직
├── 메트로놈 로직
├── 섹션 관리
├── 드래그 처리
├── 모바일/웹 조건부 렌더링
└── ...
```

### 목표 구조

```
PracticePage (300줄 이하)
├── usePracticeState (상태 통합)
├── 레이아웃만 담당
│
├── WaveformSection/
│   ├── WaveformCanvas (기존)
│   ├── WaveformControls (줌, 스크롤)
│   └── useDragSection (드래그 로직)
│
├── SectionsList/
│   ├── SectionCard (기존, props 축소)
│   └── SectionActions (액션 버튼들)
│
└── PracticeControls/
    ├── PlaybackControls
    ├── RecordControls
    └── BackingTrackControls
```

### 작업 항목

- [ ] `usePracticeState` 커스텀 훅 생성 (useReducer 사용)
- [ ] `WaveformControls` 컴포넌트 분리
- [ ] `useDragSection` 훅 분리
- [ ] `PracticeControls` 컴포넌트 분리
- [ ] `SectionActions` 컴포넌트 분리
- [ ] PracticePage를 조합 컴포넌트로 리팩토링

---

## 4단계: 상태 관리 개선 (우선순위: 높음)

### 문제

```typescript
// 현재: 20+ 개별 useState
const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
const [waveformData, setWaveformData] = useState<number[] | null>(null);
const [selectedSection, setSelectedSection] = useState<Section | null>(null);
const [isRecording, setIsRecording] = useState(false);
// ... 16개 더
```

### 해결 방안

```typescript
// src/hooks/usePracticeState.ts
type PracticeState = {
  audio: {
    buffer: AudioBuffer | null;
    waveformData: number[] | null;
    duration: number;
  };
  playback: {
    isPlaying: boolean;
    currentTime: number;
    speed: number;
  };
  recording: {
    isRecording: boolean;
    countdownSeconds: number;
    audioLevel: number;
  };
  sections: {
    selected: Section | null;
    expanded: number | null;
    uploading: number | null;
  };
};

type PracticeAction =
  | { type: 'SET_AUDIO_BUFFER'; payload: AudioBuffer }
  | { type: 'START_PLAYBACK' }
  | { type: 'STOP_PLAYBACK' }
  | { type: 'START_RECORDING' }
  // ...

function practiceReducer(state: PracticeState, action: PracticeAction): PracticeState {
  // ...
}

export function usePracticeState() {
  const [state, dispatch] = useReducer(practiceReducer, initialState);
  return { state, dispatch };
}
```

### 작업 항목

- [ ] `PracticeState` 타입 정의
- [ ] `PracticeAction` 타입 정의
- [ ] `practiceReducer` 구현
- [ ] `usePracticeState` 훅 생성
- [ ] PracticePage에서 useState → useReducer 전환

---

## 5단계: 모바일/웹 UI 통합 (우선순위: 중간)

### 문제

```tsx
// PracticePage.tsx
if (isCapacitor) {
  return (
    // 모바일 UI (400줄)
  );
}
return (
  // 웹 UI (230줄) - 30%+ 중복
);
```

### 해결 방안

```tsx
// 플랫폼별 레이아웃 컴포넌트
function PracticePageMobile({ children, ...props }) { /* ... */ }
function PracticePageWeb({ children, ...props }) { /* ... */ }

// 공통 컴포넌트는 재사용
function PracticePage() {
  const Layout = isCapacitor ? PracticePageMobile : PracticePageWeb;

  return (
    <Layout>
      <WaveformSection {...waveformProps} />
      <SectionsList {...sectionProps} />
      <PracticeControls {...controlProps} />
    </Layout>
  );
}
```

### 작업 항목

- [ ] 공통 UI 요소 식별
- [ ] `PracticeLayout` 컴포넌트 생성 (플랫폼 추상화)
- [ ] 중복 코드 제거
- [ ] 테스트

---

## 6단계: SectionCard Props 축소 (우선순위: 중간)

### 문제

현재 28개 props가 8개 그룹으로 전달됨.

### 해결 방안

Context API 또는 컴포지션 패턴 사용:

```tsx
// Option 1: Context
const SectionContext = createContext<SectionContextValue>(null);

function SectionCard({ section, index }) {
  const context = useSectionContext();
  // context에서 필요한 함수들 가져옴
}

// Option 2: Composition
<SectionCard section={section}>
  <SectionCard.Header />
  <SectionCard.Actions onDelete={...} onPlay={...} />
  <SectionCard.BackingTrack {...btProps} />
  <SectionCard.RecordingsList {...recordingsProps} />
</SectionCard>
```

### 작업 항목

- [ ] SectionContext 설계
- [ ] SectionCard를 컴포지션 패턴으로 리팩토링
- [ ] Props 10개 이하로 축소

---

## 7단계: 성능 최적화 (우선순위: 중간)

### 문제

- `React.memo` 없음 → 불필요한 리렌더
- `useCallback` 부족 → 자식에게 전달되는 함수가 매번 새로 생성
- Effect 의존성 배열이 너무 큼

### 작업 항목

- [ ] `SectionCard`에 `React.memo` 적용
- [ ] `ABComparePlayer`에 `React.memo` 적용
- [ ] 핸들러 함수들에 `useCallback` 적용
- [ ] Effect 의존성 정리 (특히 오디오 디코딩)
- [ ] `useMemo`로 비용이 큰 계산 캐싱

---

## 8단계: 타입 강화 (우선순위: 낮음)

### BackingTrack 타입 개선

```typescript
// 현재
interface BackingTrack {
  type: 'mr' | 'metronome' | 'custom';
  bpm?: number;  // metronome일 때만 필요하지만 optional
}

// 개선: Discriminated Union
type BackingTrack =
  | { type: 'mr' | 'custom'; id: number; name: string; data: string }
  | { type: 'metronome'; id: number; name: string; bpm: number; timeSignature: TimeSignature };
```

### Recording 타입 개선

```typescript
// 현재
interface Recording {
  uploadDate: string;  // 문자열 → 파싱 필요
  data: string;        // base64? 경로? 마커?
}

// 개선
interface Recording {
  uploadDate: Date;  // 또는 timestamp number
  data:
    | { type: 'base64'; content: string }
    | { type: 'idb'; key: string }
    | { type: 'file'; path: string };
}
```

### 작업 항목

- [ ] `BackingTrack` discriminated union 적용
- [ ] `Recording.data` 타입 명확화
- [ ] `Recording.uploadDate` → Date 또는 number
- [ ] 타입 가드 함수 추가

---

## 9단계: 스토리지 추상화 (우선순위: 낮음)

### 문제

스토리지 로직이 4개 파일에 분산:
- `audioStorage.ts` - IndexedDB
- `mobileStorage.ts` - Capacitor Filesystem
- `useCloudSync.ts` - Supabase
- `MusicPracticeApp.tsx` - localStorage

### 해결 방안

```typescript
// src/storage/StorageProvider.ts
interface StorageProvider {
  saveMetadata(songs: Song[]): Promise<void>;
  loadMetadata(): Promise<Song[]>;
  saveAudio(sessionId: number, data: string): Promise<string>;
  loadAudio(marker: string): Promise<string>;
  deleteAudio(marker: string): Promise<void>;
}

class WebStorageProvider implements StorageProvider { /* ... */ }
class MobileStorageProvider implements StorageProvider { /* ... */ }

export function getStorageProvider(): StorageProvider {
  return isCapacitor()
    ? new MobileStorageProvider()
    : new WebStorageProvider();
}
```

### 작업 항목

- [ ] `StorageProvider` 인터페이스 정의
- [ ] `WebStorageProvider` 구현
- [ ] `MobileStorageProvider` 구현
- [ ] 기존 코드에서 추상화 레이어 사용

---

## 리팩토링 실행 순서

```
Week 1: 기반 작업
├── 1단계: 태그 시스템 통합 (2시간)
├── 2단계: 오디오 유틸리티 추출 (2시간)
└── 테스트 작성

Week 2: 핵심 리팩토링
├── 3단계: PracticePage 분리 (8시간)
├── 4단계: 상태 관리 개선 (4시간)
└── 테스트

Week 3: UI 개선
├── 5단계: 모바일/웹 UI 통합 (4시간)
├── 6단계: SectionCard Props 축소 (3시간)
└── 테스트

Week 4: 최적화 & 마무리
├── 7단계: 성능 최적화 (3시간)
├── 8단계: 타입 강화 (2시간)
├── 9단계: 스토리지 추상화 (4시간)
└── 전체 테스트 & 회귀 테스트
```

---

## 리팩토링 원칙

1. **점진적 변경**: 한 번에 하나씩, 테스트 통과 확인 후 다음 단계
2. **동작 유지**: 리팩토링은 기능 변경 없이 구조만 개선
3. **테스트 우선**: 변경 전 테스트 작성, 변경 후 통과 확인
4. **작은 커밋**: 각 작업 항목마다 커밋

---

## 파일 구조 (목표)

```
src/
├── components/
│   ├── pages/
│   │   ├── PracticePage.tsx (300줄 이하)
│   │   └── ...
│   ├── practice/
│   │   ├── WaveformSection/
│   │   │   ├── WaveformCanvas.tsx
│   │   │   └── WaveformControls.tsx
│   │   ├── SectionCard/
│   │   │   ├── SectionCard.tsx (200줄 이하)
│   │   │   ├── SectionActions.tsx
│   │   │   └── SectionContext.tsx
│   │   ├── ABComparePlayer.tsx
│   │   ├── RecordingsList.tsx
│   │   └── PracticeControls.tsx
│   └── layouts/
│       ├── PracticeLayoutMobile.tsx
│       └── PracticeLayoutWeb.tsx
├── hooks/
│   ├── usePracticeState.ts (새로운 통합 상태)
│   ├── useDragSection.ts (분리)
│   └── ... (기존 훅들)
├── utils/
│   ├── audioUtils.ts (새로운 유틸리티)
│   └── ...
├── constants/
│   └── tags.ts (통합된 태그)
├── storage/
│   ├── StorageProvider.ts
│   ├── WebStorageProvider.ts
│   └── MobileStorageProvider.ts
└── types/
    └── ... (강화된 타입들)
```
