# Practix → React Native + Expo 마이그레이션 플랜

> 작성일: 2026-03-19
> 상태: 대기 중

---

## 기술 스택 매핑

| 현재 (Next.js + Capacitor) | 신규 (React Native + Expo) |
|---|---|
| Next.js App Router | Expo Router (파일 기반 라우팅) |
| React 18 | React 18 (동일) |
| TypeScript | TypeScript (동일) |
| Tailwind CSS | NativeWind v4 |
| Web Audio API | expo-av + react-native-audio-api |
| MediaRecorder | expo-av Recording (네이티브) |
| Canvas 2D (파형) | @shopify/react-native-skia |
| localStorage | @react-native-async-storage/async-storage |
| Capacitor Filesystem | expo-file-system |
| Capacitor Haptics | expo-haptics |
| Capacitor App (뒤로가기) | BackHandler (내장) |
| Supabase JS | @supabase/supabase-js (동일) |
| lucide-react | lucide-react-native |

---

## 재사용 가능한 코드 (~40-50%)

### 그대로 복사
- `types/` 폴더 전체 (Song, Session, Section, Recording, BackingTrack)
- 태그 상수 (`constants/tags.ts`)
- 시간 포맷팅 (`utils/formatTime.ts`)
- BPM 계산, 통계 집계 로직
- Supabase 클라이언트 설정

### 로직 유지, API만 변경
- useRecording: MediaRecorder → expo-av Recording
- useAudioPlayback: Web Audio → expo-av Sound
- useMetronome: AudioContext → react-native-audio-api
- useSections: CRUD 동일, 저장소만 변경
- PracticeContext: 구조 동일, 내부 훅만 교체

### 완전히 재작성
- 모든 UI 컴포넌트 (div → View, p → Text)
- WaveformCanvas (Canvas 2D → Skia)
- 파일 시스템 (mobileStorage → expo-file-system)
- 내비게이션 (page → Expo Router stack/tab)

---

## Phase 0: 프로젝트 셋업
- [ ] `npx create-expo-app practix-rn --template tabs`
- [ ] NativeWind v4 설정
- [ ] Expo Router 탭 내비게이션 (곡 목록 / 통계)
- [ ] Supabase 클라이언트 연결
- [ ] AsyncStorage 설정
- [ ] `types/` 폴더 복사

## Phase 1: 핵심 데이터 + 내비게이션
- [ ] Song/Session 데이터 CRUD (AsyncStorage)
- [ ] 곡 목록 페이지 (SongsPage)
- [ ] 세션 목록 페이지 (SessionsPage)
- [ ] 연습 페이지 기본 레이아웃 (PracticePage)
- [ ] 다크모드 (useColorScheme)
- [ ] 뒤로가기 핸들링

## Phase 2: 오디오 재생
- [ ] expo-av Sound로 원곡 재생
- [ ] 재생 컨트롤 (재생/일시정지/탐색)
- [ ] A/B 구간 반복 재생
- [ ] 배속 조절 (0.5x ~ 2.0x)
- [ ] 반주(MR) 재생 + 볼륨 믹서

## Phase 3: 파형 렌더링
- [ ] react-native-skia로 파형 캔버스 구현
- [ ] 오디오 디코딩 → 파형 데이터 추출
- [ ] 핀치 줌, 드래그 스크롤
- [ ] 구간 마커 표시
- [ ] 플레이헤드 애니메이션 (reanimated)

## Phase 4: 녹음
- [ ] expo-av Recording으로 네이티브 녹음
- [ ] 녹음 레벨 미터 (실시간)
- [ ] 카운트다운 타이머
- [ ] 녹음 파일 저장 (expo-file-system)
- [ ] 기본 녹음 + 구간별 녹음
- [ ] 블루투스 마이크 지원

## Phase 5: 구간 관리 + A/B 비교
- [ ] 구간 CRUD (추가/삭제/편집)
- [ ] 구간별 녹음 목록
- [ ] A/B 비교 플레이어
- [ ] 녹음 트리밍
- [ ] 태그/메모 시스템
- [ ] 휴지통 (30일 자동 삭제)

## Phase 6: 메트로놈 + 튜너
- [ ] 메트로놈 (react-native-audio-api)
- [ ] BPM 설정 + 탭 템포
- [ ] 박자 설정 (3/4, 4/4, 6/8 등)
- [ ] 크로매틱 튜너 (FFT)
- [ ] 메트로놈 반주 연동

## Phase 7: 부가 기능
- [ ] 악보 이미지 (카메라 + 갤러리)
- [ ] 피치 분석
- [ ] 연습 통계 + 업적
- [ ] 온보딩 튜토리얼
- [ ] 확인 대화상자 + 햅틱

## Phase 8: 데이터 마이그레이션 + 배포
- [ ] 기존 앱 데이터 이전 도구
- [ ] Supabase 클라우드 싱크
- [ ] EAS Build (Android + iOS)
- [ ] 앱 스토어 준비

---

## 핵심 라이브러리

```
expo ~52
expo-av              오디오 재생/녹음
expo-file-system     파일 저장
expo-haptics         햅틱 피드백
expo-image-picker    악보 촬영
expo-router          내비게이션
@shopify/react-native-skia   파형 캔버스
react-native-reanimated      애니메이션
react-native-gesture-handler 제스처
nativewind                   Tailwind CSS
@react-native-async-storage/async-storage  로컬 저장
@supabase/supabase-js        백엔드
lucide-react-native          아이콘
```

## 리스크 & 대응

| 리스크 | 대응 |
|--------|------|
| expo-av 녹음 제한 | react-native-audio-recorder-player 대안 |
| Skia 파형 성능 | reanimated + 청크 렌더링 |
| 메트로놈 정확도 | react-native-audio-api 또는 네이티브 모듈 |
| NativeWind 호환 | 복잡한 스타일은 StyleSheet 폴백 |
| 데이터 이전 | JSON export/import 도구 |
