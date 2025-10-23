# 의존성 관계

## 📊 전체 의존성 다이어그램

```mermaid
graph TD
    %% Pages
    HomePage[app/page.tsx]

    %% API Routes
    NewsAPI[app/api/news/route.ts]
    SummarizeAPI[app/api/summarize/route.ts]

    %% Feature Components
    NewsHeader[components/news-header.tsx]
    NewsFeed[components/news-feed.tsx]
    NewsCard[components/news-card.tsx]
    NewsCategories[components/news-categories.tsx]
    RegionFilter[components/region-filter.tsx]
    TimeRangeFilter[components/time-range-filter.tsx]
    BulkActions[components/bulk-actions.tsx]
    ApiKeySettings[components/api-key-settings.tsx]
    ThemeToggle[components/theme-toggle.tsx]
    ThemeProvider[components/theme-provider.tsx]

    %% Utils
    PDFUtils[lib/pdf-utils.ts]
    Utils[lib/utils.ts]

    %% UI Components
    UIComponents[components/ui/*]

    %% External Libraries
    NextJS[Next.js]
    React[React]
    XMLParser[fast-xml-parser]
    OpenAI[OpenAI API]
    jsPDF[jspdf]
    DateFns[date-fns]
    NextThemes[next-themes]
    ShadcnUI[shadcn/ui]

    %% Page Dependencies
    HomePage --> NewsHeader
    HomePage --> NewsFeed
    HomePage --> NewsCategories
    HomePage --> RegionFilter
    HomePage --> TimeRangeFilter
    HomePage --> BulkActions

    %% NewsHeader Dependencies
    NewsHeader --> ApiKeySettings
    NewsHeader --> ThemeToggle
    NewsHeader --> UIComponents

    %% NewsFeed Dependencies
    NewsFeed --> NewsCard
    NewsFeed --> UIComponents
    NewsFeed --> NewsAPI

    %% NewsCard Dependencies
    NewsCard --> PDFUtils
    NewsCard --> SummarizeAPI
    NewsCard --> UIComponents
    NewsCard --> DateFns

    %% BulkActions Dependencies
    BulkActions --> PDFUtils
    BulkActions --> NewsAPI
    BulkActions --> UIComponents

    %% API Dependencies
    NewsAPI --> XMLParser
    NewsAPI --> NextJS
    SummarizeAPI --> OpenAI
    SummarizeAPI --> NextJS

    %% Utils Dependencies
    PDFUtils --> jsPDF
    Utils --> ShadcnUI

    %% Theme Dependencies
    ThemeToggle --> ThemeProvider
    ThemeProvider --> NextThemes

    %% Component Dependencies
    NewsCategories --> UIComponents
    RegionFilter --> UIComponents
    TimeRangeFilter --> UIComponents
    ApiKeySettings --> UIComponents

    %% Styling
    style HomePage fill:#f9f,stroke:#333,stroke-width:3px
    style NewsAPI fill:#f9f,stroke:#333,stroke-width:3px
    style SummarizeAPI fill:#f9f,stroke:#333,stroke-width:3px

    style NewsFeed fill:#bbf,stroke:#333,stroke-width:2px
    style NewsCard fill:#bbf,stroke:#333,stroke-width:2px
    style NewsHeader fill:#bbf,stroke:#333,stroke-width:2px
    style BulkActions fill:#bbf,stroke:#333,stroke-width:2px

    style PDFUtils fill:#bfb,stroke:#333,stroke-width:2px
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

#### 데이터 처리
- `fast-xml-parser`: latest - RSS XML 파싱
- `date-fns`: latest - 날짜 포맷팅 및 조작
- `zod`: 3.25.76 - 스키마 검증

#### PDF 생성
- `jspdf`: latest - PDF 문서 생성

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
NewsAPI (RSS 수집)
    ↓
NewsFeed (데이터 페칭)
    ↓
NewsCard (개별 기사 표시)
    ↓
SummarizeAPI (AI 요약)
```

### 2. PDF 생성 흐름
```
NewsCard/BulkActions (사용자 액션)
    ↓
lib/pdf-utils.ts (PDF 생성)
    ↓
jsPDF (PDF 라이브러리)
```

### 3. 테마 관리 흐름
```
ThemeProvider (next-themes)
    ↓
ThemeToggle (테마 전환)
    ↓
전역 CSS 변수 업데이트
```

### 4. 필터 상태 흐름
```
HomePage (상태 관리)
    ↓
NewsCategories/RegionFilter/TimeRangeFilter (필터 UI)
    ↓
NewsFeed (필터 적용)
    ↓
NewsCard (필터링된 데이터 표시)
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
- `components/api-key-settings.tsx` (API 키 저장)

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

- **총 프로덕션 의존성**: 56개
- **총 개발 의존성**: 7개
- **외부 API**: 2개 (Naver News, OpenAI)
- **사용 중인 Radix UI**: ~10개
- **미사용 Radix UI**: ~20개 (정리 권장)

## 🎯 최적화 우선순위

1. **High**: API 클라이언트 레이어 추가 (코드 중복 제거)
2. **High**: 미사용 Radix UI 패키지 제거 (번들 사이즈 최적화)
3. **Medium**: React Query 도입 (서버 상태 관리)
4. **Medium**: 타입 정의 중앙화 (타입 안정성)
5. **Low**: localStorage 추상화 (재사용성)
