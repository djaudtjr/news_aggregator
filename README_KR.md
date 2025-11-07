# Pulse 뉴스 애그리게이터

전 세계 여러 소스에서 뉴스를 수집하고, 분류하며, AI로 요약하는 현대적인 뉴스 플랫폼입니다.

[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js%2015-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

[English](./README.md) | **한국어**

## 주요 기능

### 🌍 다중 소스 뉴스 수집
- **해외 뉴스 소스**: BBC World, The Guardian, NY Times, CNN, Reddit World News
- **기술 뉴스**: TechCrunch, MIT Technology Review
- **국내 뉴스 소스**: 연합뉴스, SBS 뉴스, 네이버 뉴스 API
- 자동 RSS 피드 파싱 및 네이버 뉴스 API 연동
- 소스 간 중복 기사 자동 제거

### 🤖 AI 기반 요약
- **전문 크롤링**: 뉴스 웹사이트에서 전체 기사 내용 추출
- **OpenAI 연동**: GPT-4o-mini를 사용한 간결한 요약 생성
- **핵심 포인트 추출**: 주요 내용을 자동으로 식별하고 강조
- **데이터베이스 캐싱**: Supabase에 요약 저장으로 API 비용 절감
- **스마트 캐싱**: 기존 요약 재사용 및 조회수 추적

### 🔍 고급 검색 & 필터링
- **실시간 검색**: 모든 뉴스 소스를 통합 검색
- **한영 자동 번역**: 한국어 감지 및 Papago API 번역 연동
- **지역 필터**: 국내/해외 뉴스 구분 (전체/국내/해외)
- **카테고리 필터**: 세계, 정치, 비즈니스, 기술, 과학, 건강, 스포츠, 엔터테인먼트
- **시간 범위**: 최근 1시간부터 30일까지 필터링
- **맞춤법 검사**: OpenAI GPT-4o-mini를 활용한 자동 오타 교정
  - 한글 및 영문 오타 감지 및 교정
  - 문맥을 고려한 지능형 교정
  - 교정된 키워드 알림 표시

### 🎨 현대적인 UI/UX
- **다크/라이트 모드**: next-themes를 활용한 완벽한 테마 지원
- **반응형 디자인**: Tailwind CSS 기반 모바일 우선 디자인
- **부드러운 애니메이션**: tailwindcss-animate와 사용자 정의 cubic-bezier 이징 적용
- **이미지 폴백**: 자동 재시도 및 뉴스 소스 로고로 대체
- **일괄 작업**: 여러 기사 선택 및 일괄 처리
- **최근 본 기사 사이드바**: 접고 펴는 기능과 부드러운 애니메이션이 적용된 사이드바
- **뉴스 통계 박스**: 총 뉴스 개수와 페이지 정보를 보여주는 고정 위치 박스
- **레이아웃 안정성**: 스크롤바 위치 고정으로 레이아웃 시프트 방지

### 📊 스마트 기능
- **고유 기사 ID**: URL 기반 해싱으로 일관된 식별
- **조회수 추적**: 요약이 조회된 횟수 추적
- **자동 새로고침**: 수동 새로고침 및 상태 초기화
- **로딩 상태**: 스켈레톤 화면 및 로딩 인디케이터

### 📧 이메일 구독 기능
- **키워드 구독**: 최대 3개 키워드 구독 (뉴스 제목/본문 검색)
- **즉시 발송 시스템**:
  - Cron 실행: KST 오전 5시, 11시, 오후 5시 (Vercel Cron 딜레이를 고려한 ±3시간의 유연한 시간)
  - Gmail SMTP를 통한 즉시 발송 (별도 DNS 설정 불필요)
  - 키워드당 최신 뉴스 5개 제공 (예: 3개 키워드 → 최대 15개 기사)
- **발송 설정**:
  - 발송 요일 선택 (일~토)
  - 발송 시간 선택 (오전 6시 또는 오후 6시)
  - 전체 기능 활성화/비활성화 토글
  - 즉시 테스트 전송 기능
- **AI 기반 이메일 템플릿**:
  - 키워드별 컬럼을 가진 테이블 레이아웃
  - 각 행에 키워드별 뉴스를 나란히 표시하여 가독성 극대화
  - AI 요약 및 핵심 포인트 추출 기능 포함
  - 반응형 HTML 디자인

### 🔥 실시간 인기 검색어
- **Supabase Realtime 통합**: 검색 키워드 변경 시 실시간 업데이트
- **스마트 중복 제거**: 키워드 정규화 (공백 제거, 대소문자 통일)로 정확한 집계
- **다중 브라우저 동기화**: 연결된 모든 브라우저에서 동시에 업데이트 확인
- **시간 범위 필터**: 1시간, 24시간, 7일 단위로 인기 검색어 조회

## 기술 스택

### 프론트엔드
- **프레임워크**: Next.js 15 (App Router)
- **언어**: TypeScript 5
- **스타일링**: Tailwind CSS 4
- **UI 컴포넌트**: Radix UI primitives (shadcn/ui 사용)
- **아이콘**: Lucide React
- **날짜 포맷팅**: date-fns

### 백엔드
- **런타임**: Node.js (Next.js API Routes)
- **RSS 파싱**: fast-xml-parser
- **웹 크롤링**: Cheerio
- **AI**: OpenAI API (GPT-4o-mini)
- **데이터베이스**: Supabase (PostgreSQL with Realtime)
- **번역**: Naver Cloud Papago API
- **이메일**: Gmail SMTP (Nodemailer)
- **Cron**: Vercel Cron Jobs

### 개발
- **패키지 매니저**: pnpm
- **빌드 도구**: Turbopack (Next.js)
- **타입 체킹**: TypeScript strict mode
- **린팅**: ESLint

## 프로젝트 구조

```
news-aggregator/
├── app/
│   ├── api/
│   │   ├── news/          # 메인 뉴스 수집 엔드포인트
│   │   ├── search/        # 번역 지원 검색
│   │   ├── crawl/         # 전문 크롤러
│   │   ├── summarize/     # 캐싱 기능 AI 요약
│   │   ├── cron/          # Cron Job 핸들러
│   │   └── ... (인증, 북마크 등)
│   ├── layout.tsx         # 테마 프로바이더를 포함한 루트 레이아웃
│   └── page.tsx           # 메인 페이지 컴포넌트
├── components/
│   ├── ui/                # Radix UI 컴포넌트 래퍼 (shadcn/ui)
│   ├── news-header.tsx    # 검색 및 액션이 포함된 헤더
│   ├── news-feed.tsx      # 뉴스 그리드
│   ├── news-card.tsx      # 개별 뉴스 카드
│   └── ... (필터, 사이드바 등)
├── lib/
│   ├── news/              # 뉴스 관련 로직
│   ├── email/             # 이메일 발송 로직
│   └── supabase/          # Supabase 클라이언트
├── hooks/                 # 커스텀 훅
├── types/                 # 타입 정의
├── supabase/
│   └── schema.sql         # 데이터베이스 스키마
└── .env.local.example     # 환경 변수 템플릿
```

## 설치 방법

### 사전 요구사항
- Node.js 18+ 
- pnpm (권장)
- Supabase 계정
- OpenAI API 키
- Naver Cloud Platform 계정 (Papago API용)
- Naver Developers 계정 (뉴스 API용)
- Gmail 계정 및 앱 비밀번호

### 설정

1.  **저장소 클론**
    ```bash
    git clone <repository-url>
    cd news-aggregator
    ```

2.  **의존성 설치**
    ```bash
    pnpm install
    ```

3.  **환경 변수 설정**
    `.env.local.example` 파일을 복사하여 `.env.local` 파일을 생성하고, 아래 내용을 채웁니다.
    ```env
    # Supabase
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

    # OpenAI
    OPENAI_API_KEY=your_openai_api_key

    # Naver Cloud Platform (Papago 번역)
    NAVER_CLOUD_CLIENT_ID=your_ncp_client_id
    NAVER_CLOUD_CLIENT_SECRET=your_ncp_client_secret

    # Naver Developers (뉴스 API)
    NAVER_CLIENT_ID=your_naver_client_id
    NAVER_CLIENT_SECRET=your_naver_client_secret

    # Gmail SMTP (이메일 발송)
    GMAIL_USERNAME=your_gmail_address@gmail.com
    GMAIL_APP_PASSWORD=your_16_digit_app_password

    # Base URL
    NEXT_PUBLIC_BASE_URL=http://localhost:3000

    # Cron Job 보안
    CRON_SECRET=your_random_secret
    ```

4.  **Supabase 데이터베이스 설정**
    - Supabase 프로젝트의 `SQL Editor`로 이동합니다.
    - `supabase/schema.sql` 파일의 전체 내용을 복사하여 실행합니다.
    - 이 과정에서 필요한 모든 테이블과 정책이 생성됩니다.

5.  **개발 서버 실행**
    ```bash
    pnpm dev
    ```

6.  **애플리케이션 열기**
    브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속합니다.

## API 엔드포인트

`app/api/`에 위치한 주요 API 엔드포인트 요약입니다:

- **`GET /api/news`**: 설정된 모든 RSS 및 네이버 뉴스 소스에서 뉴스를 가져와 통합합니다.
- **`GET /api/search`**: 뉴스 기사에 대한 검색을 수행합니다. 해외 검색을 위해 한영 번역을 처리합니다.
- **`POST /api/crawl`**: 주어진 기사 URL의 전체 콘텐츠를 스크래핑합니다.
- **`POST /api/summarize`**: 기사에 대한 AI 요약을 생성하고 결과를 데이터베이스에 캐시합니다.
- **`GET /api/cron/send-daily-digest`**: 구독자에게 일일 이메일 다이제스트를 보내는 Cron Job 엔드포인트입니다. Vercel Cron에 의해 트리거됩니다.
- **`/api/auth/**`**: 사용자 인증 콜백을 처리합니다.
- **`/api/bookmarks`**: 사용자 북마크를 관리합니다.
- **`/api/subscriptions/**`**: 사용자 키워드 구독 및 이메일 설정을 관리합니다.

## 데이터베이스 스키마

핵심 데이터베이스 스키마는 `supabase/schema.sql`에 정의되어 있습니다. 주요 테이블은 다음과 같습니다:

- **`news_summaries`**: 비용 및 지연 시간을 줄이기 위해 기사에 대한 AI 생성 요약 및 핵심 포인트를 캐시합니다.
- **`user_profiles`**: 사용자 이름, 아바타와 같은 공개 사용자 데이터를 저장합니다.
- **`email_subscription_settings`**: 전송 요일 및 시간을 포함한 이메일 다이제스트에 대한 사용자 기본 설정을 관리합니다.
- **`subscribed_keywords`**: 각 사용자가 구독하는 키워드를 저장합니다.
- **`bookmarks`**: 사용자와 북마크한 기사를 연결합니다.
- **`search_keyword_analytics`**: 인기 검색어 분석을 위해 검색어를 기록합니다.
- **`email_delivery_logs`**: 발송된 이메일 다이제스트의 상태를 기록합니다.

## 기여하기

모든 기여를 환영합니다! 변경 사항에 대해 논의하기 위해 먼저 이슈를 열어주세요.

## 라이선스

이 프로젝트는 비공개 및 독점 소유입니다.