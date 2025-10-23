# 프로젝트 구조

## 📂 폴더 구조

```
news-aggregator/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── news/         # 뉴스 RSS 피드 수집 API
│   │   └── summarize/    # AI 요약 API
│   ├── layout.tsx        # 루트 레이아웃
│   └── page.tsx          # 메인 페이지
├── components/            # React 컴포넌트
│   ├── ui/              # shadcn/ui 기본 컴포넌트
│   └── [feature components] # 기능별 컴포넌트
├── lib/                  # 유틸리티 함수
├── public/              # 정적 파일
└── styles/              # 전역 스타일
```

## 📄 파일별 역할

### app/page.tsx
- **역할**: 메인 페이지 컴포넌트 - 전체 뉴스 애그리게이터 UI 구성
- **주요 export**: `HomePage` (default)
- **의존성**: NewsHeader, NewsFeed, NewsCategories, TimeRangeFilter, BulkActions, RegionFilter
- **상태 관리**:
  - activeCategory: 선택된 카테고리
  - searchQuery: 검색어
  - timeRange: 시간 범위 필터
  - selectedArticles: 선택된 기사 목록
  - activeRegion: 선택된 지역 (국내/해외)
- **상태**: ⚠️ 검토 필요 - 너무 많은 상태 관리 (7개 이상)

### app/api/news/route.ts
- **역할**: RSS 피드 수집 및 뉴스 데이터 제공 API
- **주요 export**: `GET` (API handler)
- **의존성**: fast-xml-parser, Next.js
- **주요 기능**:
  - RSS_FEEDS 배열에서 다중 소스 뉴스 수집
  - XML 파싱 및 정규화
  - 카테고리 자동 분류 (categorizeArticle)
  - OG 이미지 추출 (fetchOGImage)
  - 지역별 분류 (국내/해외)
- **상태**: ⚠️ 검토 필요 - 여러 책임 혼재 (피드 수집, 파싱, 카테고리화, 이미지 추출)

### app/api/summarize/route.ts
- **역할**: OpenAI API를 사용한 뉴스 기사 요약 API
- **주요 export**: `POST` (API handler)
- **의존성**: Next.js, OpenAI API
- **주요 기능**:
  - OpenAI GPT-4o-mini 모델로 기사 요약
  - API 키 검증
  - 에러 핸들링 (401, 429, 500)
- **상태**: ✅ 최적 구조 - 단일 책임 준수

### components/news-feed.tsx
- **역할**: 뉴스 기사 목록 표시 및 필터링
- **주요 export**: `NewsFeed`
- **의존성**: NewsCard, UI 컴포넌트
- **주요 기능**:
  - 뉴스 API 호출 및 데이터 로딩
  - 카테고리, 검색어, 시간 범위, 지역별 필터링
  - 선택된 기사 관리
  - 로딩/에러 상태 처리
- **상태**: ✅ 최적 구조 - 명확한 데이터 페칭 및 필터링 책임

### components/news-card.tsx
- **역할**: 개별 뉴스 기사 카드 UI 및 액션
- **주요 export**: `NewsCard`
- **의존성**: UI 컴포넌트, pdf-utils, date-fns
- **주요 기능**:
  - 기사 정보 표시 (제목, 설명, 이미지, 시간)
  - AI 요약 요청 및 표시
  - 이메일 공유
  - PDF 다운로드
  - 체크박스 선택
- **상태**: ⚠️ 검토 필요 - 너무 많은 책임 (UI + API 호출 + PDF 생성 + 이메일)

### components/bulk-actions.tsx
- **역할**: 선택된 기사들의 일괄 작업 UI
- **주요 export**: `BulkActions`
- **의존성**: pdf-utils, UI 컴포넌트
- **주요 기능**:
  - 선택된 기사 수 표시
  - 일괄 PDF 다운로드
  - 선택 해제
- **상태**: ⚠️ 검토 필요 - localStorage 사용 및 독립적인 API 호출

### components/news-header.tsx
- **역할**: 상단 헤더 - 검색 및 새로고침 기능
- **주요 export**: `NewsHeader`
- **의존성**: UI 컴포넌트, ApiKeySettings, ThemeToggle
- **주요 기능**:
  - 검색 입력
  - 새로고침 버튼
  - 설정 모달 (API 키)
  - 테마 토글
- **상태**: ✅ 최적 구조

### components/news-categories.tsx
- **역할**: 카테고리 필터 UI
- **주요 export**: `NewsCategories`
- **주요 기능**: 카테고리 선택 (all, world, technology, business, etc.)
- **상태**: ✅ 최적 구조

### components/region-filter.tsx
- **역할**: 지역 필터 UI (국내/해외)
- **주요 export**: `RegionFilter`
- **주요 기능**: 지역 선택 (all, domestic, international)
- **상태**: ✅ 최적 구조

### components/time-range-filter.tsx
- **역할**: 시간 범위 필터 UI
- **주요 export**: `TimeRangeFilter`
- **주요 기능**: 시간 범위 선택 (1일, 3일, 7일, 30일)
- **상태**: ✅ 최적 구조

### components/api-key-settings.tsx
- **역할**: OpenAI API 키 설정 모달
- **주요 export**: `ApiKeySettings`
- **주요 기능**:
  - API 키 입력 및 localStorage 저장
  - 키 표시/숨김 토글
- **상태**: ✅ 최적 구조

### components/theme-provider.tsx
- **역할**: next-themes 기반 다크모드 제공자
- **주요 export**: `ThemeProvider`
- **의존성**: next-themes
- **상태**: ✅ 최적 구조

### components/theme-toggle.tsx
- **역할**: 테마 전환 버튼
- **주요 export**: `ThemeToggle`
- **의존성**: ThemeProvider
- **상태**: ✅ 최적 구조

### lib/pdf-utils.ts
- **역할**: PDF 생성 유틸리티
- **주요 export**: `generatePDF`
- **의존성**: jspdf
- **주요 기능**: 뉴스 기사 배열을 PDF 문서로 변환
- **상태**: ✅ 최적 구조 - 재사용 가능한 유틸리티

### lib/utils.ts
- **역할**: 공통 유틸리티 함수
- **주요 export**: `cn` (className 유틸리티)
- **의존성**: clsx, tailwind-merge
- **상태**: ✅ 최적 구조

### components/ui/*
- **역할**: shadcn/ui 기반 재사용 가능한 UI 컴포넌트들
- **파일들**: alert, badge, button, card, checkbox, dialog, input, label, scroll-area, sheet, skeleton, slider
- **상태**: ✅ 최적 구조 - 재사용 가능한 컴포넌트

## 🔍 구조 품질 체크

### ✅ 잘된 점
- **단일 책임**: 대부분의 컴포넌트가 명확한 단일 책임 준수
- **재사용성**: lib/ 폴더의 유틸리티 함수들이 잘 추출됨
- **응집도**: UI 컴포넌트들이 잘 그룹화됨
- **컴포넌트 분리**: 기능별로 적절히 컴포넌트 분리

### ⚠️ 개선 필요 영역

#### 1. app/page.tsx - 상태 관리 과다
**문제점**:
- 7개의 독립적인 상태 관리
- 모든 필터 상태를 페이지 레벨에서 관리

**제안**:
- 필터 상태를 통합 관리하는 useNewsFilters 커스텀 훅 생성
- 또는 Context API를 사용한 전역 상태 관리

#### 2. app/api/news/route.ts - 다중 책임
**문제점**:
- RSS 피드 수집
- XML 파싱
- 카테고리 자동 분류
- OG 이미지 추출
- 모두 한 파일에 혼재

**제안**:
```
lib/news/
├── rss-fetcher.ts      # RSS 피드 수집 로직
├── categorizer.ts      # 카테고리 분류 로직
├── image-extractor.ts  # OG 이미지 추출 로직
└── types.ts           # 공통 타입 정의
```

#### 3. components/news-card.tsx - 비즈니스 로직 혼재
**문제점**:
- UI 렌더링
- API 호출 (요약)
- PDF 생성
- 이메일 공유
- 모두 한 컴포넌트에 혼재

**제안**:
```
hooks/
├── useArticleSummary.ts   # 요약 API 호출 로직
└── useArticleActions.ts   # 공유/다운로드 액션

components/
└── news-card.tsx          # 순수 UI만 담당
```

#### 4. components/bulk-actions.tsx - 데이터 동기화 이슈
**문제점**:
- localStorage에 의존
- 독립적으로 API를 호출하여 기사 목록 가져옴
- 부모 컴포넌트의 상태와 동기화되지 않음

**제안**:
- 선택된 기사 데이터를 props로 직접 전달
- localStorage 의존성 제거

## 💡 전체적인 개선 제안

### 추천 구조 개선
```
news-aggregator/
├── app/
├── components/
├── hooks/              # 🆕 커스텀 훅
│   ├── useNewsFilters.ts
│   ├── useArticleSummary.ts
│   └── useArticleActions.ts
├── lib/
│   ├── news/          # 🆕 뉴스 관련 유틸리티
│   │   ├── rss-fetcher.ts
│   │   ├── categorizer.ts
│   │   ├── image-extractor.ts
│   │   └── types.ts
│   ├── api/           # 🆕 API 클라이언트
│   │   └── openai.ts
│   └── utils.ts
└── types/             # 🆕 전역 타입 정의
    └── article.ts
```

### 개선 우선순위
1. **High**: app/api/news/route.ts 리팩토링 (비즈니스 로직 분리)
2. **High**: news-card.tsx 비즈니스 로직 추출
3. **Medium**: page.tsx 상태 관리 개선
4. **Medium**: bulk-actions.tsx 데이터 흐름 개선
5. **Low**: 공통 타입 정의 추출

## 📊 파일 통계
- **총 파일 수**: 29개 (소스 파일)
- **API Routes**: 2개
- **페이지**: 1개
- **컴포넌트**: 22개 (UI 포함)
- **유틸리티**: 2개
