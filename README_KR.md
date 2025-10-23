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
- **지역 필터**: 국내/해외 뉴스 구분
- **카테고리 필터**: 세계, 기술, 비즈니스, 과학, 건강, 스포츠, 엔터테인먼트
- **시간 범위**: 최근 1-48시간 내 뉴스 필터링

### 🎨 현대적인 UI/UX

- **다크/라이트 모드**: next-themes를 활용한 완벽한 테마 지원
- **반응형 디자인**: Tailwind CSS 기반 모바일 우선 디자인
- **부드러운 애니메이션**: tailwindcss-animate 활용
- **이미지 폴백**: 자동 재시도 및 뉴스 소스 로고 대체
- **일괄 작업**: 여러 기사 선택 및 일괄 처리

### 📊 스마트 기능

- **고유 기사 ID**: URL 기반 해싱으로 일관된 식별
- **조회수 추적**: 요약이 조회된 횟수 추적
- **자동 새로고침**: 수동 새로고침 및 상태 초기화
- **로딩 상태**: 스켈레톤 화면 및 로딩 인디케이터

## 기술 스택

### 프론트엔드

- **프레임워크**: Next.js 15.2.4 (App Router)
- **언어**: TypeScript 5
- **스타일링**: Tailwind CSS 4.1.9
- **UI 컴포넌트**: Radix UI primitives
- **아이콘**: Lucide React
- **날짜 포맷팅**: date-fns

### 백엔드

- **런타임**: Node.js with Next.js API Routes
- **RSS 파싱**: fast-xml-parser
- **웹 크롤링**: Cheerio
- **AI**: OpenAI API (GPT-4o-mini)
- **데이터베이스**: Supabase (PostgreSQL)
- **번역**: Naver Cloud Papago API

### 개발 도구

- **패키지 매니저**: pnpm
- **빌드 도구**: Turbopack (Next.js)
- **타입 체킹**: TypeScript strict mode
- **린팅**: ESLint

## 프로젝트 구조

```text
news-aggregator/
├── app/
│   ├── api/
│   │   ├── news/          # 메인 뉴스 수집 엔드포인트
│   │   ├── search/        # 번역 지원 검색
│   │   ├── crawl/         # 전문 크롤러
│   │   ├── summarize/     # 캐싱 기능 AI 요약
│   │   └── test-translate/ # 번역 테스트 엔드포인트
│   ├── layout.tsx         # 테마 프로바이더 포함 루트 레이아웃
│   └── page.tsx           # 메인 페이지 컴포넌트
├── components/
│   ├── ui/                # Radix UI 컴포넌트 래퍼
│   ├── news-header.tsx    # 검색 및 액션 헤더
│   ├── news-feed.tsx      # 무한 스크롤 뉴스 그리드
│   ├── news-card.tsx      # 개별 기사 카드
│   ├── news-categories.tsx # 카테고리 필터 탭
│   ├── region-filter.tsx  # 국내/해외 토글
│   ├── time-range-filter.tsx # 시간 범위 슬라이더
│   ├── bulk-actions.tsx   # 일괄 선택 액션
│   └── theme-toggle.tsx   # 다크/라이트 모드 스위처
├── lib/
│   ├── news/
│   │   ├── feeds.ts       # RSS 피드 설정
│   │   ├── rss-fetcher.ts # RSS 피드 파서
│   │   ├── naver-news-fetcher.ts # 네이버 뉴스 API 클라이언트
│   │   ├── categorizer.ts # AI 기반 분류
│   │   └── image-extractor.ts # 이미지 URL 추출
│   ├── utils/
│   │   ├── language-utils.ts # 한국어 감지 및 번역
│   │   ├── news-logos.ts  # 뉴스 소스 로고 매핑
│   │   └── hash.ts        # URL 기반 ID 생성
│   └── supabase/
│       └── client.ts      # Supabase 클라이언트 설정
├── hooks/
│   ├── useNewsFilters.ts  # 필터 상태 관리
│   └── useArticleSummary.ts # AI 요약 훅
├── types/
│   └── article.ts         # TypeScript 인터페이스
├── supabase/
│   └── schema.sql         # 데이터베이스 스키마
└── .env.local             # 환경 변수 (저장소에 미포함)
```

## 설치 방법

### 사전 요구사항

- Node.js 18+ 또는 호환 런타임
- pnpm (권장) 또는 npm
- Supabase 계정
- OpenAI API 키
- Naver Cloud Platform 계정 (Papago API용)
- 네이버 개발자 센터 계정 (뉴스 API용)

### 설정

1. **저장소 클론**

   ```bash
   git clone <repository-url>
   cd news-aggregator
   ```

2. **의존성 설치**

   ```bash
   pnpm install
   ```

3. **환경 변수 설정**

   루트 디렉토리에 `.env.local` 파일 생성:

   ```env
   # Supabase
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

   # OpenAI
   OPENAI_API_KEY=your_openai_api_key

   # Naver Cloud Platform (Papago 번역)
   NAVER_CLOUD_CLIENT_ID=your_ncp_client_id
   NAVER_CLOUD_CLIENT_SECRET=your_ncp_client_secret

   # Naver Developers (뉴스 API)
   NAVER_CLIENT_ID=your_naver_client_id
   NAVER_CLIENT_SECRET=your_naver_client_secret

   # Base URL
   NEXT_PUBLIC_BASE_URL=http://localhost:3001
   ```

4. **Supabase 데이터베이스 설정**

   Supabase SQL Editor에서 스키마 실행:

   ```bash
   # supabase/schema.sql 내용을 복사하여 Supabase에서 실행
   ```

5. **개발 서버 실행**

   ```bash
   pnpm dev
   ```

6. **애플리케이션 열기**

   [http://localhost:3001](http://localhost:3001)로 이동

## API 엔드포인트

### GET /api/news

모든 소스(RSS + 네이버 뉴스)에서 뉴스를 수집합니다.

**쿼리 파라미터:**

- `t` (선택): 캐시 무효화용 타임스탬프

**응답:**

```json
{
  "articles": [...],
  "stats": {
    "total": 105,
    "naver": 25,
    "rss": 100,
    "duplicatesRemoved": 20
  }
}
```

### GET /api/search

한국어-영어 자동 번역 지원 뉴스 검색.

**쿼리 파라미터:**

- `q`: 검색어
- `region`: "all" | "domestic" | "international"
- `t` (선택): 타임스탬프

**응답:**

```json
{
  "articles": [...],
  "query": "AI",
  "region": "all",
  "isKorean": false,
  "translated": false
}
```

### POST /api/crawl

URL에서 전체 기사 내용을 크롤링합니다.

**요청 본문:**

```json
{
  "url": "https://example.com/article"
}
```

**응답:**

```json
{
  "success": true,
  "content": "전체 기사 텍스트...",
  "wordCount": 1250,
  "url": "https://example.com/article"
}
```

### POST /api/summarize

데이터베이스 캐싱을 통한 AI 요약 생성.

**요청 본문:**

```json
{
  "title": "기사 제목",
  "description": "기사 설명",
  "link": "https://example.com/article",
  "newsId": "news-abc123",
  "apiKey": "선택적_openai_키"
}
```

**응답:**

```json
{
  "summary": "AI 생성 요약...",
  "keyPoints": ["포인트 1", "포인트 2", "포인트 3"],
  "fromCache": false,
  "viewCount": 1
}
```

## 데이터베이스 스키마

### news_summaries 테이블

```sql
CREATE TABLE news_summaries (
  news_id TEXT PRIMARY KEY,           -- 고유 기사 ID (URL 해시)
  news_url TEXT NOT NULL,             -- 원본 기사 URL
  news_title TEXT,                    -- 기사 제목
  summary TEXT NOT NULL,              -- AI 생성 요약
  key_points TEXT[],                  -- 핵심 포인트 배열
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0        -- 조회수
);
```

## 핵심 기능 구현

### AI 요약 플로우

1. 사용자가 뉴스 카드의 "AI 요약" 버튼 클릭
2. `news_id`로 Supabase에서 기존 요약 확인
3. 캐시된 경우: 요약 반환 및 조회수 증가
4. 캐시되지 않은 경우:
   - Cheerio로 전체 기사 내용 크롤링
   - OpenAI GPT-4o-mini로 요약 생성
   - 응답을 요약 + 핵심 포인트로 파싱
   - 향후 사용을 위해 Supabase에 저장
5. 캐시 표시와 함께 요약 표시

### 기사 중복 제거

- URL 기반 해싱으로 고유 ID 생성
- 네이버 뉴스와 RSS 소스 간 기사 비교
- 일치하는 ID 기반으로 중복 제거
- 중복 제거 통계 로그 기록

### 이미지 폴백 전략

1. 기사의 원본 이미지 로드 시도
2. 첫 번째 오류 시: `?retry=1` 파라미터로 재시도
3. 두 번째 오류 시: 뉴스 소스 로고로 대체
4. 로고는 `lib/utils/news-logos.ts`에 저장

### 한영 번역 검색

1. 정규식으로 쿼리가 한국어인지 감지
2. 한국어인 경우: 네이버 뉴스 직접 검색
3. Papago API를 통해 영어로 번역 시도
4. 번역된 쿼리로 해외 소스 검색
5. 두 검색 결과 통합

## 개발

### 개발 서버 실행

```bash
pnpm dev
```

### 프로덕션 빌드

```bash
pnpm build
```

### 프로덕션 서버 시작

```bash
pnpm start
```

### 코드 린트

```bash
pnpm lint
```

## 환경 설정

### Supabase

1. [supabase.com](https://supabase.com)에서 새 프로젝트 생성
2. Settings > API에서 URL과 anon key 확인
3. SQL Editor에서 `supabase/schema.sql` 실행
4. Row Level Security 활성화 (스키마에 이미 설정됨)

### OpenAI

1. [platform.openai.com](https://platform.openai.com)에서 가입
2. API 키 생성
3. 결제 정보 추가 (GPT-4o-mini는 비용 효율적)

### Naver Cloud Platform

1. [ncloud.com](https://ncloud.com)에서 등록
2. Papago NMT API 애플리케이션 생성
3. Client ID와 Client Secret 발급

### 네이버 개발자 센터

1. [developers.naver.com](https://developers.naver.com)에서 등록
2. 뉴스 검색 API 애플리케이션 생성
3. Client ID와 Client Secret 발급

## 기여하기

기여를 환영합니다! 다음 가이드라인을 따라주세요:

1. 저장소 포크
2. 기능 브랜치 생성: `git checkout -b feature/amazing-feature`
3. 변경사항 커밋: `git commit -m 'Add amazing feature'`
4. 브랜치에 푸시: `git push origin feature/amazing-feature`
5. Pull Request 오픈

## 라이선스

이 프로젝트는 비공개 및 독점 소유입니다.

## 감사의 말

- [Next.js](https://nextjs.org/)로 구축
- [Radix UI](https://www.radix-ui.com/)의 UI 컴포넌트
- [Tailwind CSS](https://tailwindcss.com/)로 스타일링
- [OpenAI](https://openai.com/)의 AI 기술
- [Supabase](https://supabase.com/)의 데이터베이스
- 뉴스 소스: BBC, The Guardian, NY Times, CNN, TechCrunch, MIT Tech Review, 연합뉴스, SBS, 네이버

## 지원

문제, 질문 또는 제안 사항이 있으면 저장소에 이슈를 등록해주세요.

---

**Next.js와 AI로 ❤️를 담아 제작**
