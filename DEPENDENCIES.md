# 의존성 관계

## 📊 전체 의존성 다이어그램

```mermaid
graph TD
    %% Pages
    HomePage[app/page.tsx]
    MyPage[app/mypage/page.tsx]

    %% API Routes
    NewsAPI[app/api/news/route.ts]
    SearchAPI[app/api/search/route.ts]
    SummarizeAPI[app/api/summarize/route.ts]
    TrendingAPI[app/api/trending/route.ts]
    LinkClickAPI[app/api/analytics/link-click/route.ts]
    SearchKeywordAPI[app/api/analytics/search-keyword/route.ts]
    EmailDigestAPI[app/api/email/send-digest/route.ts]
    BookmarksAPI[app/api/bookmarks/route.ts]

    %% Feature Components
    NewsHeader[components/news-header.tsx]
    NewsFeed[components/news-feed.tsx]
    NewsCard[components/news-card.tsx]
    NewsCategories[components/news-categories.tsx]
    RegionFilter[components/region-filter.tsx]
    TimeRangeFilter[components/time-range-filter.tsx]
    LayoutSwitcher[components/layout-switcher.tsx]
    TrendingKeywords[components/trending-keywords.tsx]
    RecentArticles[components/recent-articles.tsx]
    ThemeToggle[components/theme-toggle.tsx]
    ThemeProvider[components/theme-provider.tsx]
    LoginModal[components/auth/login-modal.tsx]

    %% Hooks
    UseNewsFilters[hooks/useNewsFilters.ts]
    UseLayoutMode[hooks/useLayoutMode.ts]
    UseRecentArticles[hooks/useRecentArticles.ts]
    UseAuth[hooks/useAuth.ts]
    UseArticleSummary[hooks/useArticleSummary.ts]

    %% Utils & Libs
    Categorizer[lib/news/categorizer.ts]
    RSSFetcher[lib/news/rss-fetcher.ts]
    NaverFetcher[lib/news/naver-news-fetcher.ts]
    SupabaseClient[lib/supabase/client.ts]
    Utils[lib/utils.ts]

    %% UI Components
    UIComponents[components/ui/*]

    %% External Libraries
    NextJS[Next.js]
    React[React]
    Supabase[@supabase/supabase-js]
    XMLParser[fast-xml-parser]
    OpenAI[OpenAI API]
    Resend[resend]
    DateFns[date-fns]
    NextThemes[next-themes]
    ShadcnUI[shadcn/ui]

    %% Page Dependencies
    HomePage --> NewsHeader
    HomePage --> NewsFeed
    HomePage --> NewsCategories
    HomePage --> RegionFilter
    HomePage --> TimeRangeFilter
    HomePage --> LayoutSwitcher
    HomePage --> TrendingKeywords
    HomePage --> RecentArticlesSidebar
    HomePage --> UseNewsFilters
    HomePage --> UseLayoutMode

    MyPage --> UseAuth
    MyPage --> SupabaseClient

    %% NewsHeader Dependencies
    NewsHeader --> ThemeToggle
    NewsHeader --> LoginModal
    NewsHeader --> UseAuth
    NewsHeader --> SearchKeywordAPI
    NewsHeader --> UIComponents

    %% NewsFeed Dependencies
    NewsFeed --> NewsCard
    NewsFeed --> UIComponents
    NewsFeed --> NewsAPI
    NewsFeed --> SearchAPI

    %% NewsCard Dependencies
    NewsCard --> SummarizeAPI
    NewsCard --> LinkClickAPI
    NewsCard --> UseAuth
    NewsCard --> UseArticleSummary
    NewsCard --> UIComponents
    NewsCard --> DateFns

    %% TrendingKeywords Dependencies
    TrendingKeywords --> TrendingAPI
    TrendingKeywords --> UIComponents

    %% RecentArticles Dependencies
    RecentArticles --> UseRecentArticles
    RecentArticles --> UIComponents
    RecentArticles --> DateFns

    %% API Dependencies
    NewsAPI --> RSSFetcher
    NewsAPI --> NaverFetcher
    NewsAPI --> Categorizer
    NewsAPI --> XMLParser
    NewsAPI --> NextJS
    SearchAPI --> NaverFetcher
    SearchAPI --> SupabaseClient
    SummarizeAPI --> OpenAI
    SummarizeAPI --> SupabaseClient
    SummarizeAPI --> NextJS
    TrendingAPI --> SupabaseClient
    LinkClickAPI --> SupabaseClient
    SearchKeywordAPI --> OpenAI
    SearchKeywordAPI --> SupabaseClient
    EmailDigestAPI --> Resend
    EmailDigestAPI --> SupabaseClient
    BookmarksAPI --> SupabaseClient

    %% Lib Dependencies
    RSSFetcher --> XMLParser
    RSSFetcher --> Categorizer
    NaverFetcher --> Categorizer
    SupabaseClient --> Supabase

    %% Hook Dependencies
    UseAuth --> SupabaseClient
    UseArticleSummary --> SupabaseClient

    %% Utils Dependencies
    Utils --> ShadcnUI

    %% Theme Dependencies
    ThemeToggle --> ThemeProvider
    ThemeProvider --> NextThemes

    %% Component Dependencies
    NewsCategories --> UIComponents
    RegionFilter --> UIComponents
    TimeRangeFilter --> UIComponents
    LayoutSwitcher --> UIComponents
    LoginModal --> UIComponents
    LoginModal --> SupabaseClient
    RecentArticlesSidebar --> UseRecentArticles
    RecentArticlesSidebar --> UIComponents

    %% Styling
    style HomePage fill:#f9f,stroke:#333,stroke-width:3px
    style MyPage fill:#f9f,stroke:#333,stroke-width:3px
    style NewsAPI fill:#f9f,stroke:#333,stroke-width:3px
    style SearchAPI fill:#f9f,stroke:#333,stroke-width:3px
    style SummarizeAPI fill:#f9f,stroke:#333,stroke-width:3px
    style TrendingAPI fill:#f9f,stroke:#333,stroke-width:3px
    style EmailDigestAPI fill:#f9f,stroke:#333,stroke-width:3px

    style NewsFeed fill:#bbf,stroke:#333,stroke-width:2px
    style NewsCard fill:#bbf,stroke:#333,stroke-width:2px
    style NewsHeader fill:#bbf,stroke:#333,stroke-width:2px
    style TrendingKeywords fill:#bbf,stroke:#333,stroke-width:2px
    style RecentArticles fill:#bbf,stroke:#333,stroke-width:2px

    style Categorizer fill:#bfb,stroke:#333,stroke-width:2px
    style RSSFetcher fill:#bfb,stroke:#333,stroke-width:2px
    style NaverFetcher fill:#bfb,stroke:#333,stroke-width:2px
    style SupabaseClient fill:#bfb,stroke:#333,stroke-width:2px
    style Utils fill:#bfb,stroke:#333,stroke-width:2px

    style UIComponents fill:#ffa,stroke:#333,stroke-width:2px
```

**범례**:
- 🟪 핵심 비즈니스 로직 (페이지, API)
- 🟦 기능 컴포넌트
- 🟩 유틸리티/헬퍼
- 🟨 UI 컴포넌트 라이브러리

## 📦 외부 라이브러리

### 프로덕션 의존성

#### 핵심 프레임워크
- `next`: 15.2.4 - Next.js 프레임워크 (App Router)
- `react`: ^19 - React 라이브러리
- `react-dom`: ^19 - React DOM 렌더러

#### UI 컴포넌트 라이브러리 (Radix UI)
- `@radix-ui/react-accordion`: 1.2.2 - 아코디언 컴포넌트
- `@radix-ui/react-alert-dialog`: 1.1.4 - 알림 다이얼로그
- `@radix-ui/react-avatar`: 1.1.2 - 아바타 컴포넌트
- `@radix-ui/react-checkbox`: latest - 체크박스
- `@radix-ui/react-dialog`: latest - 다이얼로그 (모달)
- `@radix-ui/react-dropdown-menu`: 2.1.4 - 드롭다운 메뉴
- `@radix-ui/react-label`: latest - 라벨
- `@radix-ui/react-navigation-menu`: 1.2.3 - 네비게이션 메뉴
- `@radix-ui/react-scroll-area`: latest - 스크롤 영역
- `@radix-ui/react-slider`: latest - 슬라이더
- `@radix-ui/react-slot`: latest - 슬롯 컴포넌트
- 기타 Radix UI 컴포넌트들...

#### 스타일링
- `tailwindcss`: ^4.1.9 - CSS 프레임워크
- `tailwindcss-animate`: ^1.0.7 - 애니메이션 유틸리티
- `class-variance-authority`: ^0.7.1 - CVA (컴포넌트 variant 관리)
- `clsx`: ^2.1.1 - className 조건부 결합
- `tailwind-merge`: ^2.5.5 - Tailwind className 병합
- `autoprefixer`: ^10.4.20 - CSS vendor prefix 자동 추가
- `postcss`: ^8.5 - CSS 후처리

#### AI & API
- `@ai-sdk/openai`: 2.0.52 - OpenAI SDK
- `ai`: 5.0.76 - Vercel AI SDK
- `openai` (환경변수): OpenAI API 통합

#### 데이터베이스
- `@supabase/supabase-js`: latest - Supabase JavaScript 클라이언트
- `@supabase/ssr`: latest - Supabase SSR 헬퍼

#### 이메일
- `resend`: latest - 이메일 발송 서비스

#### 데이터 처리
- `fast-xml-parser`: latest - RSS XML 파싱
- `date-fns`: latest - 날짜 포맷팅 및 조작
- `zod`: 3.25.76 - 스키마 검증

#### 테마
- `next-themes`: latest - 다크모드 지원

#### UI 유틸리티
- `lucide-react`: ^0.454.0 - 아이콘 라이브러리
- `sonner`: ^1.7.4 - 토스트 알림
- `cmdk`: 1.0.4 - 커맨드 팔레트
- `react-resizable-panels`: ^2.1.7 - 리사이즈 가능한 패널
- `recharts`: 2.15.4 - 차트 라이브러리
- `embla-carousel-react`: 8.5.1 - 캐러셀
- `vaul`: ^0.9.9 - 드로어 컴포넌트

#### 폼 관리
- `react-hook-form`: ^7.60.0 - 폼 상태 관리
- `@hookform/resolvers`: ^3.10.0 - 폼 검증 리졸버
- `react-day-picker`: 9.8.0 - 날짜 선택기
- `input-otp`: 1.4.1 - OTP 입력

#### 분석
- `@vercel/analytics`: latest - Vercel 분석

### 개발 의존성

#### TypeScript
- `typescript`: ^5 - TypeScript 컴파일러
- `@types/node`: ^22 - Node.js 타입 정의
- `@types/react`: ^19 - React 타입 정의
- `@types/react-dom`: ^19 - React DOM 타입 정의

#### PostCSS & Tailwind
- `@tailwindcss/postcss`: ^4.1.9 - Tailwind PostCSS 플러그인
- `tw-animate-css`: 1.3.3 - Tailwind 애니메이션 확장

## 🔗 주요 의존성 흐름

### 1. 뉴스 데이터 흐름
```
NewsAPI (RSS + Naver News 수집)
    ↓
Categorizer (카테고리 자동 분류)
    ↓
NewsFeed (데이터 페칭)
    ↓
NewsCard (개별 기사 표시)
    ↓
SummarizeAPI (AI 요약 + Supabase 저장)
```

### 2. 검색 흐름
```
NewsHeader (검색 입력)
    ↓
SearchKeywordAPI (키워드 분석 + OpenAI 분리 + Supabase 저장)
    ↓
SearchAPI (Naver News 검색)
    ↓
NewsFeed (검색 결과 표시)
    ↓
TrendingKeywords (인기 검색어 업데이트)
```

### 3. 인증 흐름
```
LoginModal (Google OAuth)
    ↓
Supabase Auth
    ↓
UseAuth Hook (세션 관리)
    ↓
전역 사용자 상태
```

### 4. 분석 흐름
```
NewsCard (링크 클릭 / AI 요약 요청)
    ↓
LinkClickAPI / SummarizeAPI
    ↓
Supabase (news_summary_analytics 저장)
    ↓
MyPage (사용자별 통계 표시)
```

### 5. 이메일 다이제스트 흐름
```
Cron Job (매일 정기 실행)
    ↓
EmailDigestAPI
    ↓
Supabase (구독 키워드 + 뉴스 조회)
    ↓
Resend (이메일 발송)
```

### 6. 테마 관리 흐름
```
ThemeProvider (next-themes)
    ↓
ThemeToggle (테마 전환)
    ↓
전역 CSS 변수 업데이트
```

### 7. 필터 상태 흐름
```
HomePage (useNewsFilters 훅)
    ↓
NewsCategories/RegionFilter/TimeRangeFilter (필터 UI)
    ↓
NewsFeed (필터 적용 + availableCategories 계산)
    ↓
NewsCard (필터링된 데이터 표시)
    ↓
HomePage (콜백을 통한 통계 업데이트)
    - onTotalCountChange: 총 뉴스 개수
    - onPageChange: 현재 페이지
    - onTotalPagesChange: 총 페이지 수
    ↓
뉴스 통계 박스에 표시
```

### 8. 레이아웃 모드 흐름
```
HomePage (useLayoutMode 훅)
    ↓
LayoutSwitcher (레이아웃 선택)
    ↓
LocalStorage (설정 저장)
    ↓
NewsFeed (Grid/List/Compact 렌더링)
```

## ⚠️ 의존성 품질 체크

### ✅ 순환 의존성
- **상태**: 없음 ✓
- **분석**: 모든 의존성이 단방향으로 흐름

### ✅ 의존성 깊이
- **최대 깊이**: 4 단계
- **평가**: 적절함 ✓
- **경로 예시**: HomePage → NewsFeed → NewsCard → SummarizeAPI

### ⚠️ 주의사항

#### 1. 중복 API 호출
**문제**:
- `NewsFeed`와 `BulkActions`가 각각 독립적으로 `/api/news`를 호출
- 데이터 동기화 이슈 발생 가능

**해결 방안**:
```typescript
// HomePage에서 한 번만 데이터 페칭
// BulkActions에는 선택된 기사 데이터를 props로 전달
```

#### 2. localStorage 의존성
**위치**:
- `components/news-card.tsx` (API 키 저장)
- `components/bulk-actions.tsx` (선택된 기사 ID)

**문제**:
- 서버 사이드 렌더링 시 호환성 이슈
- 상태 동기화 어려움

**해결 방안**:
```typescript
// Context API 또는 상태 관리 라이브러리 사용 고려
// React Query를 사용한 서버 상태 관리
```

#### 3. 직접 API 호출
**위치**:
- `components/news-card.tsx`: `/api/summarize` 호출
- `components/news-feed.tsx`: `/api/news` 호출
- `components/bulk-actions.tsx`: `/api/news` 호출

**문제**:
- API 클라이언트 로직이 컴포넌트에 분산
- 재사용성 및 테스트 어려움

**해결 방안**:
```typescript
// lib/api/ 폴더 생성
// - lib/api/news.ts
// - lib/api/summarize.ts
// 또는 React Query hooks:
// - hooks/useNews.ts
// - hooks/useSummarize.ts
```

#### 4. 과도한 Radix UI 의존성
**분석**:
- 30개 이상의 Radix UI 패키지 설치
- 현재 사용: checkbox, dialog, label, scroll-area, slider 등 약 10개
- 미사용 패키지: accordion, alert-dialog, avatar, dropdown-menu 등 20개+

**제안**:
```bash
# 사용하지 않는 패키지 제거로 번들 사이즈 최적화
# package.json 정리 필요
```

## 💡 개선 제안

### 1. API 클라이언트 레이어 추가
```typescript
// lib/api/client.ts - 공통 fetch 래퍼
// lib/api/news.ts - 뉴스 API 함수들
// lib/api/summarize.ts - 요약 API 함수들
```

### 2. React Query 도입 고려
```typescript
// 서버 상태 관리, 캐싱, 자동 리페칭
// 중복 API 호출 방지
import { useQuery, useMutation } from '@tanstack/react-query'
```

### 3. 타입 정의 중앙화
```typescript
// types/article.ts - NewsArticle 인터페이스
// types/api.ts - API 응답 타입들
// 현재 여러 파일에 중복 정의됨
```

### 4. 커스텀 훅 추출
```typescript
// hooks/useNews.ts - 뉴스 데이터 페칭
// hooks/useSummarize.ts - AI 요약
// hooks/useLocalStorage.ts - localStorage 추상화
```

## 📊 의존성 통계

- **총 프로덕션 의존성**: 58개
- **총 개발 의존성**: 7개
- **외부 API**: 3개 (Naver News, OpenAI, Resend)
- **데이터베이스**: Supabase (PostgreSQL)
- **외부 서비스**: Supabase Auth, Supabase Storage
- **사용 중인 Radix UI**: ~10개
- **미사용 Radix UI**: ~20개 (정리 권장)
- **커스텀 훅**: 5개 (useNewsFilters, useLayoutMode, useRecentArticles, useAuth, useArticleSummary)
- **API 엔드포인트**: 15개+

## 🎯 최적화 우선순위

1. **High**: API 클라이언트 레이어 추가 (코드 중복 제거)
2. **High**: 미사용 Radix UI 패키지 제거 (번들 사이즈 최적화)
3. **Medium**: React Query 도입 (서버 상태 관리)
4. **Medium**: 타입 정의 중앙화 (타입 안정성)
5. **Low**: localStorage 추상화 (재사용성)
