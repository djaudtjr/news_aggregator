# 프로젝트 구조

## 📂 폴더 구조

```
news-aggregator/
├── app/                          # Next.js App Router
│   ├── api/                     # API Routes
│   │   ├── analytics/           # 분석 API
│   │   │   ├── link-click/     # 링크 클릭 추적
│   │   │   └── search-keyword/  # 검색 키워드 분석
│   │   ├── auth/               # 인증 API
│   │   │   └── callback/       # OAuth callback
│   │   ├── bookmarks/          # 북마크 관리
│   │   ├── cron/               # Cron 작업
│   │   │   └── send-daily-digest/ # 일일 다이제스트 발송
│   │   ├── email/              # 이메일 관련
│   │   │   └── send-digest/    # 이메일 다이제스트
│   │   ├── mypage/             # 마이페이지 API
│   │   ├── news/               # 뉴스 데이터
│   │   ├── search/             # 검색
│   │   ├── subscriptions/      # 구독 관리
│   │   │   ├── email-settings/ # 이메일 설정
│   │   │   └── keywords/       # 구독 키워드
│   │   ├── summarize/          # AI 요약
│   │   ├── summary/[newsId]/   # 뉴스별 요약 조회
│   │   └── trending/           # 인기 검색어
│   ├── mypage/                 # 마이페이지
│   │   └── page.tsx
│   ├── favicon.ico
│   ├── globals.css             # 전역 스타일
│   ├── layout.tsx              # 루트 레이아웃
│   └── page.tsx                # 메인 페이지
├── components/                  # React 컴포넌트
│   ├── auth/                   # 인증 관련 컴포넌트
│   │   └── login-modal.tsx
│   ├── ui/                     # shadcn/ui 기본 컴포넌트
│   ├── subscription/           # 구독 관련 컴포넌트
│   │   └── hero-subscribe-banner.tsx
│   ├── layout-switcher.tsx     # 레이아웃 전환
│   ├── news-card.tsx           # 뉴스 카드 (그리드)
│   ├── news-card-compact.tsx   # 뉴스 카드 (컴팩트)
│   ├── news-card-list.tsx      # 뉴스 카드 (리스트)
│   ├── news-card-skeleton.tsx  # 뉴스 카드 스켈레톤
│   ├── news-categories.tsx     # 카테고리 필터
│   ├── news-feed.tsx           # 뉴스 피드
│   ├── news-header.tsx         # 헤더
│   ├── recent-articles-sidebar.tsx  # 최근 본 기사 (접기/펴기)
│   ├── region-filter.tsx       # 지역 필터 (전체/국내/해외)
│   ├── theme-provider.tsx      # 테마 제공자
│   ├── theme-toggle.tsx        # 테마 토글
│   ├── time-range-filter.tsx   # 시간 범위 필터
│   ├── trending-keywords.tsx   # 인기 검색어
│   ├── trending-keywords-compact.tsx  # 인기 검색어 (컴팩트)
│   ├── pagination.tsx          # 페이지네이션
│   ├── empty-state.tsx         # 빈 상태 컴포넌트
│   └── footer.tsx              # 푸터
├── hooks/                      # Custom React Hooks
│   ├── useArticleSummary.ts    # 기사 요약 훅
│   ├── useAuth.ts              # 인증 훅
│   ├── useLayoutMode.ts        # 레이아웃 모드 훅
│   ├── useNewsFilters.ts       # 뉴스 필터 훅
│   └── useRecentArticles.ts    # 최근 기사 훅
├── lib/                        # 라이브러리 & 유틸리티
│   ├── news/                   # 뉴스 관련 로직
│   │   ├── categorizer.ts      # 카테고리 분류
│   │   ├── feeds.ts            # RSS 피드 목록
│   │   ├── naver-news-fetcher.ts # 네이버 뉴스 수집
│   │   └── rss-fetcher.ts      # RSS 피드 수집
│   ├── supabase/               # Supabase 관련
│   │   └── client.ts           # Supabase 클라이언트
│   └── utils.ts                # 공통 유틸리티
├── supabase/                   # Supabase 스키마
│   └── schema.sql              # 데이터베이스 스키마
├── types/                      # TypeScript 타입 정의
│   └── article.ts              # 뉴스 기사 타입
├── .env.local                  # 환경변수 (로컬)
├── .env                        # 환경변수
├── middleware.ts               # Next.js 미들웨어
├── next.config.ts              # Next.js 설정
├── package.json
├── tailwind.config.ts          # Tailwind CSS 설정
├── tsconfig.json               # TypeScript 설정
└── README.md
```

## 📄 주요 파일별 역할

### Pages

#### app/page.tsx
- **역할**: 메인 홈페이지 - 뉴스 애그리게이터 UI
- **주요 컴포넌트**: NewsHeader, NewsFeed, NewsCategories, RegionFilter, TimeRangeFilter, LayoutSwitcher, TrendingKeywords, RecentArticlesSidebar
- **상태 관리**:
  - useNewsFilters: 카테고리, 지역, 검색어, 시간 범위
  - useLayoutMode: 그리드/리스트/컴팩트 레이아웃
  - availableCategories: 검색 모드에서 사용 가능한 카테고리
  - totalNewsCount: 총 뉴스 개수
  - currentPage, totalPages: 페이지 정보
- **특징**:
  - 사이드바에 인기 검색어 및 최근 본 기사 표시
  - 검색 모드에서 카테고리 필터 동적 활성화/비활성화
  - 고정 위치 뉴스 통계 박스 (총 뉴스, 페이지 정보)
  - 레이아웃 시프트 방지 CSS (scrollbar, padding, overflow 제어)

#### app/mypage/page.tsx
- **역할**: 사용자 마이페이지
- **주요 기능**:
  - AI 요약 사용 통계
  - 링크 클릭 통계
  - 검색 키워드 통계
  - 이메일 구독 설정
  - 북마크 관리

### API Routes

#### app/api/news/route.ts
- **역할**: 뉴스 데이터 수집 및 제공
- **데이터 소스**:
  - RSS 피드 (국제 뉴스)
  - 네이버 뉴스 API (국내 뉴스)
- **주요 기능**:
  - 다중 소스에서 뉴스 수집
  - 자동 카테고리 분류
  - 중복 제거
  - 날짜순 정렬

#### app/api/search/route.ts
- **역할**: 키워드 검색
- **데이터 소스**: 네이버 뉴스 API
- **주요 기능**:
  - 국내/해외 뉴스 검색
  - 카테고리 자동 분류
  - Supabase에 검색 결과 저장

#### app/api/summarize/route.ts
- **역할**: AI 기사 요약
- **AI 모델**: OpenAI GPT-4o-mini
- **주요 기능**:
  - 기사 요약 생성
  - 핵심 포인트 추출
  - Supabase에 요약 캐싱
  - 요약 통계 기록

#### app/api/trending/route.ts
- **역할**: 인기 검색어 조회
- **데이터 소스**: Supabase (search_keyword_analytics)
- **주요 기능**:
  - 시간 범위별 인기 검색어 (1시간/24시간/7일)
  - 검색 횟수 및 순위 반환

#### app/api/analytics/link-click/route.ts
- **역할**: 링크 클릭 추적
- **데이터 저장**: Supabase (news_summary_analytics)
- **주요 기능**:
  - 사용자별 클릭 통계 기록
  - news_summaries에 기사 정보 자동 생성

#### app/api/analytics/search-keyword/route.ts
- **역할**: 검색 키워드 분석
- **AI 모델**: OpenAI GPT-4o-mini
- **주요 기능**:
  - 키워드 정제 (특수문자 제거)
  - OpenAI로 키워드 분리
  - 의미 없는 키워드 필터링
  - Supabase에 키워드 통계 저장

#### app/api/cron/send-daily-digest/route.ts
- **역할**: Cron Job 오케스트레이터 - 예약 발송 일괄 처리
- **실행 시간**: KST 5시, 11시, 17시 (UTC 20시, 2시, 8시)
- **주요 기능**:
  - 현재 시간 기준 1시간 후 발송 시간 계산 (targetDeliveryHour)
  - 해당 시간에 발송 받을 구독자 필터링
  - 각 구독자별로 /api/email/send-digest 호출
  - scheduledDeliveryHour 파라미터 전달

#### app/api/email/send-digest/route.ts
- **역할**: 이메일 다이제스트 발송 (즉시 또는 예약)
- **이메일 서비스**: Resend
- **주요 기능**:
  - 구독 키워드 기반 뉴스 조회 (최근 24시간)
  - HTML 이메일 템플릿 생성
  - **즉시 발송**: scheduledDeliveryHour 없이 호출 시
  - **예약 발송**: scheduledDeliveryHour 제공 시 Resend scheduledAt API 사용
  - KST → UTC 시간 변환
  - 발송 로그 기록 (email_delivery_logs)

### Components

#### components/news-feed.tsx
- **역할**: 뉴스 피드 표시 및 필터링
- **주요 기능**:
  - 일반 모드: 전체 뉴스 표시
  - 검색 모드: 검색 결과 표시
  - 카테고리/지역/시간 범위 필터링
  - 레이아웃 모드별 렌더링 (Grid/List/Compact)
  - 사용 가능한 카테고리 계산 및 전달
  - 페이지네이션 (3x3 그리드, 페이지당 9개)
  - 콜백을 통한 상위 컴포넌트 알림:
    - onTotalCountChange: 총 뉴스 개수
    - onPageChange: 현재 페이지
    - onTotalPagesChange: 총 페이지 수

#### components/news-card.tsx (Grid)
- **역할**: 뉴스 카드 (그리드 레이아웃)
- **주요 기능**:
  - 기사 정보 표시
  - AI 요약 생성
  - Read More 링크
  - 링크 클릭 분석

#### components/news-card-list.tsx
- **역할**: 뉴스 카드 (리스트 레이아웃)
- **특징**: 가로로 긴 레이아웃, 썸네일 왼쪽 배치

#### components/news-card-compact.tsx
- **역할**: 뉴스 카드 (컴팩트 레이아웃)
- **특징**: 최소한의 정보만 표시, 높은 정보 밀도

#### components/news-categories.tsx
- **역할**: 카테고리 필터 버튼
- **카테고리**: 전체, 세계, 정치, 비즈니스, 기술, 과학, 건강, 스포츠, 엔터테인먼트
- **주요 기능**:
  - 검색 모드에서 사용 불가능한 카테고리 비활성화
  - 활성 카테고리 강조 표시

#### components/trending-keywords.tsx
- **역할**: 인기 검색어 표시
- **주요 기능**:
  - 시간 범위별 탭 (1시간/24시간/7일)
  - 순위 및 검색 횟수 표시
  - 클릭 시 해당 키워드로 검색

#### components/recent-articles-sidebar.tsx
- **역할**: 최근 본 기사 표시 (접고 펴기 가능)
- **저장소**: 세션 스토리지 (최대 10개)
- **주요 기능**:
  - 기사 썸네일 및 제목 표시
  - 상대적 시간 표시 (예: 5분 전)
  - 개별 삭제 및 전체 삭제
  - 접기/펴기 토글 버튼 (ChevronRight/ChevronDown 아이콘)
  - 애니메이션 효과:
    - 너비 전환: 200px ↔ 40px (cubic-bezier 이징)
    - 투명도 전환으로 텍스트 부드럽게 숨김
    - 카드별 순차 등장 애니메이션 (slideIn keyframes)

#### components/layout-switcher.tsx
- **역할**: 레이아웃 모드 전환
- **모드**: Grid, List, Compact
- **저장**: 로컬 스토리지

### Hooks

#### hooks/useNewsFilters.ts
- **역할**: 뉴스 필터 상태 관리
- **상태**: activeCategory, activeRegion, searchQuery, timeRange, refreshTrigger
- **함수**: refresh, resetFilters

#### hooks/useLayoutMode.ts
- **역할**: 레이아웃 모드 상태 관리
- **상태**: layoutMode (grid/list/compact)
- **저장**: 로컬 스토리지

#### hooks/useRecentArticles.ts
- **역할**: 최근 본 기사 관리
- **저장**: 세션 스토리지
- **함수**: addRecentArticle, removeRecentArticle, clearRecentArticles

#### hooks/useAuth.ts
- **역할**: 사용자 인증 상태 관리
- **기능**: Supabase Auth 세션 관리, Google OAuth

#### hooks/useArticleSummary.ts
- **역할**: 기사 요약 생성 및 관리
- **기능**: OpenAI API 호출, Supabase 캐싱

### Libraries

#### lib/news/categorizer.ts
- **역할**: 뉴스 자동 카테고리 분류
- **분류 방법**:
  1. RSS 카테고리 정보 우선 사용
  2. 키워드 기반 분류 (한글/영문)
- **카테고리**: world, politics, business, technology, science, health, sports, entertainment
- **특징**:
  - 정치 키워드: 정치, 국회, 선거, 대통령 등
  - 스포츠 키워드: 리그명 (KBO, MLB, NBA, 프리미어리그 등)
  - 엔터 키워드: 엔터사 (SM, JYP, HYBE, 디즈니, 넷플릭스 등)
  - 애매한 분류는 "all"로 반환

#### lib/news/rss-fetcher.ts
- **역할**: RSS 피드 수집
- **기능**: XML 파싱, 이미지 추출, 카테고리 분류

#### lib/news/naver-news-fetcher.ts
- **역할**: 네이버 뉴스 API 호출
- **기능**: 키워드 검색, 카테고리 분류

#### lib/supabase/client.ts
- **역할**: Supabase 클라이언트
- **환경변수**: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY

### Types

#### types/article.ts
- **NewsArticle**: 뉴스 기사 인터페이스
- **NewsCategory**: 카테고리 타입 (all, world, politics, business, technology, science, health, sports, entertainment)
- **NewsRegion**: 지역 타입 (all, domestic, international)
- **RSSFeed**: RSS 피드 설정
- **RSSItem**: RSS 아이템 (파싱용)

## 🗄️ 데이터베이스 스키마

### news_summaries
- **용도**: AI 요약 캐싱 및 뉴스 메타데이터
- **컬럼**: news_id, news_url, news_title, category, summary, key_points, view_count, created_at, updated_at

### news_summary_analytics
- **용도**: 사용자별 뉴스 이용 통계
- **컬럼**: user_id, news_id, summary_request_count, link_click_count

### search_keyword_analytics
- **용도**: 검색 키워드 통계
- **컬럼**: keyword, search_count, last_searched_at

### email_subscription_settings
- **용도**: 이메일 구독 설정
- **컬럼**:
  - user_id (PK)
  - email
  - enabled (boolean)
  - delivery_days (integer[], 0=일, 1=월, ..., 6=토)
  - delivery_hour (integer, 6/12/18만 허용)
  - last_sent_at
  - created_at, updated_at

### subscribed_keywords
- **용도**: 사용자별 구독 키워드
- **컬럼**: user_id, keyword

### email_delivery_logs
- **용도**: 이메일 발송 로그
- **컬럼**: user_id, email, status, news_count, error_message, sent_at

### bookmarks
- **용도**: 사용자 북마크
- **컬럼**: user_id, news_id, title, url, category, created_at

## 🔄 데이터 흐름

### 1. 뉴스 조회
```
User → app/page.tsx → NewsFeed
                    ↓
            app/api/news/route.ts
                    ↓
        RSS Fetcher + Naver Fetcher
                    ↓
             Categorizer
                    ↓
         NewsCard (Grid/List/Compact)
```

### 2. 검색
```
User → NewsHeader (검색 입력)
            ↓
  SearchKeywordAPI (키워드 분석 + OpenAI 분리)
            ↓
      Supabase 저장
            ↓
    SearchAPI (네이버 검색)
            ↓
      NewsFeed (결과 표시)
```

### 3. AI 요약
```
User → NewsCard (요약 버튼 클릭)
            ↓
   useArticleSummary Hook
            ↓
 app/api/summarize/route.ts
            ↓
     OpenAI API (GPT-4o-mini)
            ↓
  Supabase (news_summaries 캐싱)
            ↓
 Supabase (analytics 기록)
            ↓
  NewsCard (요약 표시)
```

### 4. 분석 추적
```
User Action (링크 클릭 / 검색 / 요약)
            ↓
   Analytics API (link-click / search-keyword)
            ↓
   Supabase (통계 저장)
            ↓
 MyPage (통계 조회 및 표시)
```

### 5. 이메일 예약 발송
```
Vercel Cron (KST 5/11/17시, UTC 20/2/8시)
            ↓
app/api/cron/send-daily-digest (GET)
            ↓
  현재 시간 KST 변환 + targetDeliveryHour = currentHour + 1
            ↓
  Supabase에서 enabled=true 구독자 조회
            ↓
  delivery_days에 currentDay 포함 & delivery_hour = targetDeliveryHour 필터링
            ↓
  각 구독자별 루프:
    app/api/email/send-digest (POST)
      Body: { userId, scheduledDeliveryHour: targetDeliveryHour }
            ↓
    subscribed_keywords 조회
            ↓
    news_summaries에서 키워드별 뉴스 검색 (최근 24시간)
            ↓
    중복 제거 & 최신순 정렬 & 상위 10개
            ↓
    HTML 이메일 생성
            ↓
    scheduledAt = KST targetDeliveryHour → UTC 변환
            ↓
    Resend.emails.send({ ..., scheduledAt })
            ↓
    email_delivery_logs 기록
            ↓
  결과 집계 및 반환
            ↓
Resend가 scheduledAt 시간에 자동 발송 (KST 6/12/18시)
```

## 🎨 CSS 및 스타일링

### app/globals.css
- **역할**: 전역 스타일 및 테마 변수 정의
- **주요 기능**:
  - CSS 변수로 다크/라이트 테마 색상 정의
  - Tailwind CSS 통합 (`@import 'tailwindcss'`)
  - 레이아웃 시프트 방지:
    ```css
    html {
      overflow-y: scroll; /* 스크롤바 항상 표시 */
    }
    body {
      overflow: visible !important;
      padding-right: 0 !important;
      margin-right: 0 !important;
    }
    /* Radix UI의 동적 스타일 변경 방지 */
    body[style*="overflow"],
    body[style*="padding-right"],
    body[style*="margin-right"] {
      overflow: visible !important;
      padding-right: 0 !important;
      margin-right: 0 !important;
    }
    ```
  - Select/Dialog 열 때 콘텐츠 이동 방지

## 📊 코드 품질 메트릭

### ✅ 장점
1. **모듈화**: 기능별로 명확하게 분리된 컴포넌트
2. **타입 안정성**: TypeScript로 모든 인터페이스 정의
3. **재사용성**: 커스텀 훅으로 로직 추상화
4. **확장성**: API 라우트 구조화
5. **성능**: Supabase 캐싱으로 중복 요청 최소화
6. **UX 안정성**: 레이아웃 시프트 방지로 일관된 사용자 경험

### ⚠️ 개선 필요
1. **API 클라이언트 레이어 부재**: 컴포넌트에서 직접 fetch 호출
2. **에러 처리**: 일관되지 않은 에러 핸들링
3. **테스트**: 테스트 코드 부재
4. **문서화**: 일부 복잡한 로직에 주석 부족

## 🎯 권장 사항

1. **API 클라이언트 레이어 추가**
   ```typescript
   // lib/api/client.ts - 공통 fetch 래퍼
   // lib/api/news.ts - 뉴스 API 함수들
   ```

2. **React Query 도입**
   - 서버 상태 관리
   - 자동 캐싱 및 리페칭
   - 중복 요청 방지

3. **에러 바운더리 추가**
   - 컴포넌트 레벨 에러 처리
   - 사용자 친화적인 에러 메시지

4. **단위 테스트 추가**
   - 유틸리티 함수 테스트
   - API 라우트 테스트
   - 컴포넌트 테스트
