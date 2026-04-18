# Changelog

모든 주요 변경사항을 기록합니다. [Semantic Versioning](https://semver.org/lang/ko/)을 따릅니다.

## [Unreleased]

## [0.1.1] - 2026-02-04

### Added
- Practice Page A/B 비교 플레이어에 녹음 전환 버튼 (`<` `>`) 추가
- 녹음 전환 루프 네비게이션 (끝에서 처음으로, 처음에서 끝으로)
- 녹음 8개 이상일 때 숫자 표시 (`3 / 15` 형태)

### Changed
- 다크모드 비활성화 (라이트모드 고정)
- A/B 비교 재생: 원곡/녹음 독립 재생 (한쪽 끝나도 다른쪽 계속)
- A/B 루프 모드: 둘 다 끝날 때까지 기다렸다가 함께 루프

### Fixed
- Practice Page 카운트다운 녹음 작동 안함 (터치+클릭 이중 발생 문제)
- CountdownDial 롱프레스로 열기 안됨
- CountdownDial 버튼 (1초, 2초, 3초, 5초, 확인) 작동 안함
- CountdownDial +/- 버튼 1초씩 조절되던 문제 → 0.5초 단위로 수정
- CountdownDial 닫을 때 뒤 요소 클릭되는 문제
- A/B 슬라이더 터치 작동 안함 (Practice Page, Modal 모두)

## [0.1.0] - 2026-02-03

### Added
- 구간 이름 변경 기능 (`Section.name` 필드)
- 새로 생성된 구간 하이라이트 (초록색 + 깜빡임, 클릭 시 해제)
- 랜딩페이지와 앱 라우팅 분리 (`/` → 랜딩, `/app` → 앱)
- 랜딩페이지 로고 이미지 추가
- AB 비교 플레이어 녹음 전환 버튼 (스와이프 대신)
- Storybook 스토리 추가 (RecordingButtons, RecordingsList, MiniWaveform, MetronomeBeatIndicator, CountdownDial)
- 테스트 체크리스트 문서 (모바일, Storybook)
- 컴포넌트 시각 가이드 문서

### Changed
- LandingPage: `onStartDemo` prop 제거, `useRouter`로 `/app` 이동
- SectionCard: 클릭 가능한 이름 표시 (편집 모드)
- SectionPracticeModal: 헤더에 이름 편집 기능 추가

### Fixed
- MiniWaveform 터치 이벤트가 스와이프 제스처 차단하던 문제

---

## 버전 규칙

- **MAJOR** (1.0.0): 정식 출시 / Breaking change
- **MINOR** (0.x.0): 새 기능 추가
- **PATCH** (0.0.x): 버그 수정

### 0.x.x 단계 (현재)
- 정식 출시 전 개발 버전
- MINOR = 기능 추가, PATCH = 버그 수정
- Breaking change도 MINOR로 처리
