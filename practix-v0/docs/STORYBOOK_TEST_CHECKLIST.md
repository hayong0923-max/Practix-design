# Practix Storybook 컴포넌트 테스트 체크리스트

**테스트 일자:** ____________________
**스토리북 버전:** 10.2.3

---

## 실행 방법
```bash
npm run storybook
# → http://localhost:6006 에서 확인
```

---

## 1. Practice 컴포넌트

### ABComparePlayer
| 체크 | 스토리 | 확인사항 | 문제점/메모 |
|:---:|--------|---------|------------|
| ☐ | Default | 기본 렌더링 | |
| ☐ | WithMRBackingTrack | MR 반주 표시 | |
| ☐ | WithMetronome | 메트로놈 표시 | |
| ☐ | MetronomePlaying | 메트로놈 재생 중 | |
| ☐ | Looping | 루프 활성화 표시 | |
| ☐ | WithSyncOffset | 싱크 오프셋 표시 | |
| ☐ | AllFeaturesEnabled | 전체 기능 조합 | |
| ☐ | **WithMultipleRecordings** | **녹음 전환 버튼** | |
| ☐ | **MultipleRecordingsMiddle** | **중간 녹음 선택** | |
| ☐ | **MultipleRecordingsLast** | **마지막 녹음** | |
| ☐ | **SingleRecording** | **단일 녹음 (버튼 숨김)** | |
| ☐ | **FullFeaturedWithNavigation** | **전체 기능 + 네비게이션** | |

### BottomControlBar
| 체크 | 스토리 | 확인사항 | 문제점/메모 |
|:---:|--------|---------|------------|
| ☐ | Default | 기본 상태 | |
| ☐ | Playing | 재생 중 | |
| ☐ | WithSectionMark | 구간 마크 | |
| ☐ | Looping | 루프 모드 | |
| ☐ | SlowPlayback | 느린 재생 | |
| ☐ | FastPlayback | 빠른 재생 | |
| ☐ | NearEnd | 끝부분 | |

### SectionCard
| 체크 | 스토리 | 확인사항 | 문제점/메모 |
|:---:|--------|---------|------------|
| ☐ | Default | 기본 카드 | |
| ☐ | WithRecordings | 녹음 있는 카드 | |
| ☐ | RecordingInProgress | 녹음 중 | |
| ☐ | CountingDown | 카운트다운 | |
| ☐ | WithError | 에러 표시 | |
| ☐ | Uploading | 업로드 중 | |
| ☐ | Dragging | 드래그 중 | |
| ☐ | DragOver | 드래그 오버 | |

### RecordingButtons (NEW)
| 체크 | 스토리 | 확인사항 | 문제점/메모 |
|:---:|--------|---------|------------|
| ☐ | Default | 기본 버튼 | |
| ☐ | WithBackingTrack | 반주 있을 때 | |
| ☐ | Recording | 녹음 중 | |
| ☐ | RecordingHighLevel | 높은 오디오 레벨 | |
| ☐ | CountingDown3 | 카운트다운 3 | |
| ☐ | CountingDown2 | 카운트다운 2 | |
| ☐ | CountingDown1 | 카운트다운 1 | |
| ☐ | Disabled | 비활성화 | |
| ☐ | NoCountdown | 카운트다운 0 | |
| ☐ | LongCountdown | 긴 카운트다운 | |

### RecordingsList (NEW)
| 체크 | 스토리 | 확인사항 | 문제점/메모 |
|:---:|--------|---------|------------|
| ☐ | Default | 기본 목록 | |
| ☐ | WithSelection | 선택된 녹음 | |
| ☐ | WithCustomTags | 커스텀 태그 | |
| ☐ | SingleRecording | 단일 녹음 | |
| ☐ | ManyRecordings | 많은 녹음 | |
| ☐ | NoTags | 태그 없음 | |
| ☐ | Empty | 빈 목록 | |

### MiniWaveform (NEW)
| 체크 | 스토리 | 확인사항 | 문제점/메모 |
|:---:|--------|---------|------------|
| ☐ | BlueEmpty | 파란색 (원곡) | |
| ☐ | RedEmpty | 빨간색 (녹음) | |
| ☐ | GreenEmpty | 초록색 (반주) | |
| ☐ | TallWaveform | 높은 파형 | |
| ☐ | ShortWaveform | 낮은 파형 | |
| ☐ | ProgressMiddle | 중간 진행 | |
| ☐ | ProgressNearEnd | 끝부분 진행 | |
| ☐ | AllColors | 전체 색상 비교 | |

### MetronomeBeatIndicator (NEW)
| 체크 | 스토리 | 확인사항 | 문제점/메모 |
|:---:|--------|---------|------------|
| ☐ | FourFourBeat1 | 4/4 첫 박 | |
| ☐ | FourFourBeat2 | 4/4 둘째 박 | |
| ☐ | FourFourBeat3 | 4/4 셋째 박 | |
| ☐ | FourFourBeat4 | 4/4 넷째 박 | |
| ☐ | ThreeFour | 3/4 박자 | |
| ☐ | TwoFour | 2/4 박자 | |
| ☐ | SixEightBeat1 | 6/8 첫 박 | |
| ☐ | SixEightBeat4 | 6/8 넷째 박 | |
| ☐ | NotPlaying | 정지 상태 | |
| ☐ | AllTimeSignatures | 전체 박자표 | |

### SectionWaveform
| 체크 | 스토리 | 확인사항 | 문제점/메모 |
|:---:|--------|---------|------------|
| ☐ | Default | 기본 | |
| ☐ | Playing | 재생 중 | |
| ☐ | LongSection | 긴 구간 | |
| ☐ | ShortSection | 짧은 구간 | |

### BasicRecordingSection
| 체크 | 스토리 | 확인사항 | 문제점/메모 |
|:---:|--------|---------|------------|
| ☐ | 모든 스토리 확인 | | |

### PitchComparisonSection
| 체크 | 스토리 | 확인사항 | 문제점/메모 |
|:---:|--------|---------|------------|
| ☐ | 모든 스토리 확인 | | |

### SheetMusicSection
| 체크 | 스토리 | 확인사항 | 문제점/메모 |
|:---:|--------|---------|------------|
| ☐ | 모든 스토리 확인 | | |

---

## 2. UI 컴포넌트

### CountdownDial (NEW)
| 체크 | 스토리 | 확인사항 | 문제점/메모 |
|:---:|--------|---------|------------|
| ☐ | Default | 기본 (3초) | |
| ☐ | ZeroSeconds | 0초 | |
| ☐ | HalfSecond | 0.5초 | |
| ☐ | OneSecond | 1초 | |
| ☐ | TwoSeconds | 2초 | |
| ☐ | FiveSeconds | 5초 | |
| ☐ | ExtendedRange | 확장 범위 | |
| ☐ | WholeSecondsOnly | 정수만 | |

---

## 3. Modals

### RecordingTrimModal
| 체크 | 스토리 | 확인사항 | 문제점/메모 |
|:---:|--------|---------|------------|
| ☐ | 모든 스토리 확인 | | |

---

## 컨트롤 테스트

각 스토리에서 Controls 패널 확인:
| 체크 | 항목 | 문제점/메모 |
|:---:|------|------------|
| ☐ | 슬라이더 조작 | |
| ☐ | 체크박스 토글 | |
| ☐ | 셀렉트 변경 | |
| ☐ | 숫자 입력 | |

---

## 반응형 테스트 (Viewport)

| 체크 | 뷰포트 | 문제점/메모 |
|:---:|--------|------------|
| ☐ | Small mobile (320px) | |
| ☐ | Large mobile (414px) | |
| ☐ | Tablet (768px) | |
| ☐ | Desktop (1024px) | |

---

## 다크모드 테스트

| 체크 | 컴포넌트 | 문제점/메모 |
|:---:|---------|------------|
| ☐ | ABComparePlayer | |
| ☐ | BottomControlBar | |
| ☐ | SectionCard | |
| ☐ | RecordingButtons | |
| ☐ | CountdownDial | |

---

## 우선 수정 필요 항목

| 순위 | 컴포넌트 | 스토리 | 문제점 | 심각도 |
|:---:|---------|--------|--------|:------:|
| 1 | | | | ☐상 ☐중 ☐하 |
| 2 | | | | ☐상 ☐중 ☐하 |
| 3 | | | | ☐상 ☐중 ☐하 |
| 4 | | | | ☐상 ☐중 ☐하 |
| 5 | | | | ☐상 ☐중 ☐하 |

---

## 메모

```




```

---

*Practix Storybook Test Checklist v1.0*
