# 백엔드 아키텍처 분석서 (시니어 아키텍트 관점)

## 1. 프로젝트 한 줄 요약
**"한국투자증권(KIS) 금융 데이터와 AI 분석 로직을 결합하여 실시간 투자 통찰력을 제공하는 고성능 NestJS 모듈형 서버"**

## 2. 계층형 아키텍처 및 책임 분리 (Modular Layered Architecture)

### 2.1 API 계층 (Controller)
- **책임**: 클라이언트의 HTTP 요청 수신, 입력 데이터 검증, HTTP 응답 상태 관리.
- **핵심 기술**: NestJS `ValidationPipe`, `class-validator`, `class-transformer`.
- **주요 컨트롤러**:
    - `StocksController`: 주식 시세, 차트, 검색 및 순위 기능 제공.
    - `NewsController`: 종목별 관련 뉴스 및 시장 핫 클립 제공.
    - `ChatController`: AI 분석 추천 및 대화형 투자 상담 기능.

### 2.2 비즈니스 로직 계층 (Service)
- **책임**: 비즈니스 규점 수행, 여러 소스의 데이터 오케스트레이션.
- **주요 서비스**:
    - `KisService`: KIS API 토큰 관리(1분 쿨다운 포함), 실시간/과거 시세 데이터 통신.
    - `AnalysisService`: OpenAI GPT-4o-mini 프롬프트 생성 및 그라운딩(업종 정보 포함) 처리.
    - `StocksService`: DB의 종목 마스터 정보와 KIS의 실시간 데이터를 병합하여 반환.

### 2.3 데이터 접근 계층 (Repository / Entity)
- **책임**: 데이터베이스 영속성 관리 (PostgreSQL / TypeORM).
- **핵심 엔티티**:
    - `Stock`: 전 종목 코드, 이름, 업종, 시가총액 등 마스터 정보 저장.
    - `News`: 크롤링된 뉴스 및 업종별 뉴스 스토리지.

### 2.4 인프라 공통 계층 (Common)
- **책임**: 서버 전반에서 사용되는 공통 기술 지원.
- **핵심 기능**:
    - `RedisService`: 분산 환경에서의 상태 관리 및 캐싱 지원.
    - `RateLimiterService`: Redis LUA 스크립트를 활용한 슬라이딩 윈도우 기반 API 호출 제한.
    - `KisException`: KIS API 전용 커스텀 예외 처리 필터 제공.

## 3. 핵심 요청 처리 흐름 (Request Lifecycle)
1. **인증 단계**: `main.ts` 로드 -> `JwtAuthGuard`가 헤더의 JWT 검증 및 `User` 컨텍스트 주입.
2. **요청 진입**: 컨트롤러 메서드 호출 전 `ValidationPipe`를 통해 DTO 형식 검증.
3. **로직 실행**: 서비스가 Redis에서 레이트 리미트 권한을 획득 후 KIS API를 호출하여 시세를 가져옴.
4. **AI 결합**: `AnalysisService`가 DB의 업종 정보와 KIS 시세를 조합하여 AI 분석 결과를 생성(캐시 연동).
5. **응답 수립**: `HttpExceptionFilter`가 전체적인 에러 핸들링을 수행하며 표준화된 JSON 반환.

## 4. 주목할만한 설계 결정사항 (Design Decisions)
- **분산 레이트 리미팅**: 여러 호스트 인스턴스가 실행되더라도 KIS API 제한(초당 2회)을 넘지 않도록 Redis를 중앙 집중식 카운터로 활용.
- **Fail-Fast 검증**: `env.validation.ts`를 통해 서버 부팅 시 `.env` 파일의 필수 변수 누락을 즉시 감지하여 안정성을 확보.
- **로컬 폴백(Fallback)**: Redis 서버가 오프라인일 경우 자동으로 로컬 메모리 기반 리미터로 전환되어 서비스 무중단 보장.

## 5. 유지보수 및 확장 제안
- **의존성 관리**: 현재 `Stocks`와 `Analysis` 모듈 간의 순환 참조를 제거하기 위해 `Domain Service` 패턴 도입 권장.
- **트랜잭션 고도화**: 커뮤니티 댓글 및 알림 기능 등 다중 테이블 업데이트 로직에 명시적 트랜잭션(`QueryRunner`) 추가 필요.
- **에러 로깅**: 오픈소스 로깅 솔루션(Sentry, ELK 등) 연동을 위한 인터셉터 레이어 추가 필요.
