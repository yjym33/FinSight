# 프론트엔드 아키텍처 분석서 (시니어 아키텍트 관점)

## 1. 프로젝트 한 줄 요약
**"Next.js App Router 아키텍처를 기반으로, 토스(Toss) 디자인 철학을 반영한 고밀도 인터랙션 투자 서비스 프론트엔드"**

## 2. 프로젝트 구조 설계 (Feature-Based Architecture)

### 2.1 `src/app/` (Next.js App Router)
- **책임**: 전체 라우팅 경로 정의 및 루트 기반 레이아웃(사이드바, 헤더) 관리.
- **특징**: `loading.tsx`, `error.tsx`를 활용한 선언적 UI 처리.

### 2.2 `src/features/` (도메인 기반 모듈)
- **책임**: 독립적인 비즈니스 기능 단위 개발 (Stocks, News, Auth, Community).
- **구성**:
    - `components/`: 해당 기능에서만 전문적으로 쓰이는 UI 컴포넌트.
    - `services/`: 해당 도메인 전용 API 연동 로직 (Axios 인스턴스 활용).
    - `store/`: 해당 기능 전용 상태 관리 (Zustand).

### 2.3 `src/shared/` (공통 자산)
- **책임**: 프로젝트 전반에 걸친 재사용 가능한 유틸리티 및 디자인 시스템.
- **핵심 요소**:
    - `useWebSocket`: 실시간 시세 스트리밍을 위한 중앙 커스텀 훅.
    - `api.ts`: JWT 인터셉터가 포함된 Axios 클라이언트 인스턴스.
    - `lib/utils.ts`: Tailwind CSS 클래스 머지(cn) 등 유틸리티 함수.

### 2.4 `src/components/ui/` (UI Kit)
- **책임**: 디자인 일관성을 위한 저수준(Primitive) UI 컴포넌트들 (Shadcn UI 기반).

## 3. 핵심 데이터 및 상태 관리 흐름 (State Pipeline)

### 3.1 서버 상태 (React Query)
- **역할**: 주식 상세, 뉴스 목록, 사용자 프로필 등 모든 서버 자원의 캐싱 및 동기화 담당.
- **정책**: `staleTime`과 `cacheTime`을 조절하여 불필요한 API 요청 최적화.

### 3.2 전역 클라이언트 상태 (Zustand)
- **역할**: 로그인 정보(`authStore`), 테마 설정, 최근 본 종목(`recentStocksStore`) 등 세션 위주의 데이터 관리.

### 3.3 실시간 시세 스트리밍 (WebSocket)
- **역할**: 주식 상세 화면 진입 시 WebSocket 구독을 시작하고, 1초 단위로 들어오는 가격 정보를 전용 Context를 통해 하위 컴포넌트로 전파.

## 4. UI/UX 디자인 철학 (Design Language)
- **Toss Esthetics**: `rounded-[32px]`, 유려한 카드 그림자, 부드러운 화이트/다크 모드 색감 적용.
- **Interaction**: `framer-motion`을 사용한 선언적 애니메이션 구현 (페이지 전환 및 카드 리스트 렌더링 시 시각적 만족도 극대화).
- **Responsive**: 데스크톱 대시보드 환경에 최적화된 2단/3단 그리드 레이아웃.

## 5. 성능 및 구조 개선 제안
- **데이터 통합**: 실시간 시세(WebSocket)와 정적 정보(Query)를 통합하는 **'단일 진실 공급원'** 구축을 위해 `setQueryData` 패턴 도입 필요.
- **컴포넌트 추상화**: 현재 Feature 레이어의 일부 컴포넌트들이 비즈니스 로직과 너무 강하게 결합되어 있는데, 이를 Presentational & Container 패턴으로 분리하는 것이 유리함.
- **하이드레이션 최적화**: 서버 사이드 렌더링(SSR) 시점에서 핵심 데이터를 미리 패칭(Prefetch)하여 페이지 로드 즉시 정보를 표시하도록 개선 필요.
