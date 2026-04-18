# PracticePage 리팩토링 계획 (2026-03-08)

## 개요
PracticePage.tsx (2,118줄) → 5개 모듈로 분해. 기능 변경 없이 구조만 분리.

---

## Phase 1: PracticePage 분해 ✅ 완료

### 완료된 작업

#### Step 1: PracticeContext 생성 ✅
- `src/contexts/PracticeContext.tsx` (~370줄)
- 13개 훅을 싱글턴으로 호출 (AudioContext, MediaRecorder 등 중복 생성 불가)
- 공유 상태: selectedSection, isLooping, countdownDuration
- export: PracticeProvider, usePracticeContext, TrashFunctions, PracticePageProps

#### Step 2: WaveformDisplay 추출 ✅
- `src/components/practice/WaveformDisplay/useWaveformRenderer.ts`
  - 상태: sectionMarkStart, playbackStartPosition, showCreateSectionButton, lastSkipBackTap, isDraggingMainProgress
  - 핸들러: handleAddSection, handleSeekAndPlay, handleSeek, handleSkipToBeginning, handleSkipBack, handlePlayWithTracking, handlePauseWithTracking, handleSectionMarker, handleCreateSectionFromPlayback
  - useCanvasDrag 통합, auto-scroll useEffect
- `src/components/practice/WaveformDisplay/WaveformDisplay.tsx`
  - 로딩 스켈레톤, 업로드 프롬프트, WaveformCanvas, ZoomControls, ScrollControl
  - 모바일: BottomControlBar, SectionMarker, CreateSection 버튼
  - 웹: 재생/일시정지 버튼

#### Step 3: SectionManager 추출 ✅
- `src/components/practice/SectionManager/useSections.ts` (~400줄)
  - 상태: selectedRecordings, uploadingSectionId, editingMemo, recordingSectionId, newSectionIds, drag 상태, practicingSection, syncEdit 상태
  - 구간 CRUD, 녹음 핸들러, 드래그 재정렬, decode useEffect
- `src/components/practice/SectionManager/SectionManager.tsx`
  - SectionCard 리스트, SectionPracticeModal, SyncEditModal

#### Step 4: RecordingControls 추출 ✅
- `src/components/practice/RecordingControls/useBasicRecording.ts`
  - 상태: isBasicRecording, selectedBasicRecordingId, showBasicRecordingDial, trimmingRecording
  - 핸들러: handleStartBasicRecording, handleStopBasicRecording, deleteBasicRecording 등
- `src/components/practice/RecordingControls/RecordingControls.tsx`
  - 모바일: BasicRecordingSection, FAB 녹음/중지 버튼, CountdownDial, RecordingTrimModal
  - 웹: RecordingTrimModal만

#### Step 5: SessionMeta 추출 ✅
- `src/components/practice/SessionMeta/SessionMeta.tsx`
  - 로컬 상태: showTagManagement, showSheetMusicEditor, showPitchComparison
  - SheetMusicSection, PitchComparisonSection, TagManagementModal, SheetMusicEditor

#### Step 6: AudioComparePlayer 이동/리네임 ✅
- `ABComparePlayer.tsx` → `AudioComparePlayer/AudioComparePlayer.tsx`
- `useABComparePlayback.ts` → `AudioComparePlayer/useAudioCompare.ts`
- SectionCard, SectionPracticeModal, stories 파일 import 경로 수정

#### Step 7: PracticePage 조합 레이어 + 정리 ✅
- PracticePage.tsx: 2,118줄 → 103줄
- 삭제된 파일:
  - `src/hooks/practice/useSectionHandlers.ts` (데드 코드)
  - `src/components/practice/ABComparePlayer.tsx` (이동됨)
  - `src/hooks/useABComparePlayback.ts` (이동됨)
- `npm run build` 통과 확인

### 최종 구조
```
PracticePage.tsx (~100줄, 조합 레이어)
└── PracticeProvider (PracticeContext.tsx)
    ├── WaveformDisplay/     파형 캔버스 + 재생 컨트롤
    ├── SectionManager/      구간 목록 + CRUD + 모달
    ├── RecordingControls/   기본 녹음 + FAB + 카운트다운
    ├── SessionMeta/         악보, 피치, 태그 모달
    └── AudioComparePlayer/  A/B 비교 (SectionCard 내부에서 렌더)
```

---

## Phase 2: 캔버스 파형 성능 최적화 ✅ 완료 (Step 2-1 + 2-3)

### Step 2-1: Canvas를 React 렌더 사이클에서 분리 ✅
- 모든 props → 단일 ref (`P.current`)로 동기화, useCallback 제거
- 파형 비트맵 캐싱: 오프스크린 캔버스에 미리 렌더
  - nativeStyle: 2개 캔버스 (played #00d4ff / unplayed #006680)
  - webStyle: 1개 캔버스 (보라색 그라데이션 베지에)
- 매 프레임: `drawImage` + clip으로 색상 분할 (120+ roundRect → 1-2 drawImage)
- rAF 관리: 6개 useEffect → 2개로 단순화
- 시간 보간: interpRef로 ~4Hz → 60fps 부드러운 플레이헤드

### Step 2-2: OffscreenCanvas + Web Worker ❌ 보류
- Step 2-1로 충분한 성능 확보 예상, 필요 시 진행

### Step 2-3: 추가 최적화 ✅
- DPR 동적 캡: `Math.min(devicePixelRatio, 2)` (하드코딩 2x 제거)
- 캐시 무효화 키: waveformData/크기/duration 변경 시에만 재빌드

### 추가 수정: 새 구간 녹색 하이라이트 버그 수정 ✅
- `highlightNewSection`/`clearNewHighlight`/`newSectionIds`를 PracticeContext로 이동
- WaveformDisplay에서 구간 생성 시 `highlightNewSection` 호출 복원
- SectionManager에서 `ctx.newSectionIds`/`ctx.clearNewHighlight` 사용

---

## 빌드 검증
- 빌드 명령: `npm run build`
- 테스트 명령: `npm run test` (설정 시)
- 수동 테스트: 브라우저에서 모바일/웹 레이아웃 확인
