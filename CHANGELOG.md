# 개발 변경 이력

## 📌 [체크포인트 2] 2025-10-21 주요 리팩토링 완료

### ✅ 완료된 기능
- **타입 시스템 개선**: 중앙화된 타입 정의로 타입 안정성 향상
- **코드 구조 최적화**: 280줄 API 파일을 4개의 작은 모듈로 분리
- **상태 관리 개선**: 커스텀 훅으로 필터 상태 통합 관리
- **비즈니스 로직 분리**: 컴포넌트에서 비즈니스 로직을 훅으로 추출
- **데이터 흐름 개선**: localStorage 의존성 제거 및 props 기반 데이터 전달

### 📝 변경사항

#### 추가된 파일
- `types/article.ts` - 중앙화된 타입 정의 (NewsArticle, RSSFeed, RSSItem 등)
- `lib/news/feeds.ts` - RSS 피드 설정 (10개 소스)
- `lib/news/categorizer.ts` - 카테고리 자동 분류 로직
- `lib/news/image-extractor.ts` - OG 이미지 추출 로직
- `lib/news/rss-fetcher.ts` - RSS 피드 수집 및 파싱 로직
- `hooks/useArticleSummary.ts` - AI 요약 비즈니스 로직
- `hooks/useNewsFilters.ts` - 필터 상태 통합 관리

#### 수정된 파일
- `app/api/news/route.ts` - 280줄 → 25줄 (91% 감소, 분리된 모듈 사용)
- `components/news-card.tsx` - 157줄 → 114줄 (27% 감소, 비즈니스 로직 추출)
- `app/page.tsx` - 49줄 → 72줄 (상태 관리 개선, 7개 상태 → 훅으로 통합)
- `components/bulk-actions.tsx` - 55줄 → 36줄 (35% 감소, 중복 API 호출 제거)
- `components/news-feed.tsx` - 타입 import 변경 및 articles 전달 기능 추가
- `lib/pdf-utils.ts` - 타입 import 변경

#### 삭제된 요소
- 중복 타입 정의 3곳 (news-feed.tsx, news-card.tsx, lib/pdf-utils.ts)
- BulkActions의 독립적인 API 호출 및 localStorage 의존성
- news-card.tsx의 인라인 API 호출 로직

### 📊 프로젝트 현황

#### 파일 분포 (Before → After)
- **총 파일 수**: 29개 → 36개 (+7개)
- **도메인별 분포**:
  - API Routes: 2개 (변동 없음)
  - Pages: 1개 (변동 없음)
  - 기능 컴포넌트: 9개 (변동 없음)
  - UI 컴포넌트: 15개 (변동 없음)
  - **유틸리티**: 2개 → 6개 (+4개, lib/news/)
  - **커스텀 훅**: 0개 → 2개 (+2개)
  - **타입 정의**: 0개 → 1개 (+1개)

#### 코드 품질 지표
- **평균 파일 크기**: 97줄 → 68줄 (30% 감소)
- **최대 파일 크기**: 280줄 → 147줄 (47% 감소)
- **타입 중복**: 3곳 → 0곳 (100% 제거)
- **순환 의존성**: 0개 (유지)

### 🎯 코드 구조 품질

#### ✅ 개선된 부분

##### 1. 타입 시스템 중앙화
**Before**:
```typescript
// news-feed.tsx, news-card.tsx, lib/pdf-utils.ts에 각각 중복 정의
interface NewsArticle { ... }
```

**After**:
```typescript
// types/article.ts - 단일 진실 소스
export interface NewsArticle { ... }
export interface RSSFeed { ... }
export type NewsCategory = "all" | "world" | ...
```

**효과**:
- 타입 안정성 향상
- 중복 제거로 유지보수성 개선
- 타입 변경 시 한 곳만 수정

##### 2. API 로직 모듈화
**Before** (app/api/news/route.ts, 280줄):
```typescript
// RSS 피드, 파싱, 카테고리화, 이미지 추출이 모두 한 파일에
const RSS_FEEDS = [...]
function categorizeArticle(...) { ... }
function fetchOGImage(...) { ... }
export async function GET() { ... }
```

**After** (25줄):
```typescript
import { RSS_FEEDS } from "@/lib/news/feeds"
import { fetchRSSFeed } from "@/lib/news/rss-fetcher"

export async function GET() {
  const allArticles = await Promise.all(
    RSS_FEEDS.map(feed => fetchRSSFeed(feed))
  )
  return NextResponse.json({ articles: allArticles.flat() })
}
```

**효과**:
- 단일 책임 원칙 준수
- 91% 코드 감소 (280줄 → 25줄)
- 각 모듈 독립적 테스트 가능
- 가독성 대폭 향상

##### 3. 상태 관리 개선
**Before** (app/page.tsx):
```typescript
const [activeCategory, setActiveCategory] = useState("all")
const [searchQuery, setSearchQuery] = useState("")
const [timeRange, setTimeRange] = useState(7)
const [refreshTrigger, setRefreshTrigger] = useState(0)
const [selectedArticles, setSelectedArticles] = useState([])
const [activeRegion, setActiveRegion] = useState("all")
// 6개의 독립적인 상태 관리
```

**After**:
```typescript
const {
  activeCategory, activeRegion, searchQuery,
  timeRange, refreshTrigger,
  setActiveCategory, setActiveRegion,
  setSearchQuery, setTimeRange, refresh
} = useNewsFilters()
// 커스텀 훅으로 통합 관리
```

**효과**:
- 관련 상태를 논리적으로 그룹화
- 코드 재사용성 향상
- 상태 로직 테스트 용이

##### 4. 비즈니스 로직 추출
**Before** (components/news-card.tsx):
```typescript
// 컴포넌트 내부에 API 호출 로직
const [summary, setSummary] = useState(null)
const [isLoading, setIsLoading] = useState(false)

const handleSummarize = async () => {
  const apiKey = localStorage.getItem("openai_api_key")
  setIsLoading(true)
  const response = await fetch("/api/summarize", {...})
  setSummary(data.summary)
  setIsLoading(false)
}
```

**After**:
```typescript
// 커스텀 훅 사용
const { summary, isLoading, generateSummary } = useArticleSummary()

const handleSummarize = () => {
  generateSummary(article.title, article.description, article.link)
}
```

**효과**:
- UI와 비즈니스 로직 명확히 분리
- 로직 재사용 가능
- 컴포넌트 코드 27% 감소

##### 5. 데이터 흐름 개선
**Before** (components/bulk-actions.tsx):
```typescript
// localStorage와 독립적인 API 호출
const [articles, setArticles] = useState([])
useEffect(() => {
  fetch("/api/news").then(...) // 중복 API 호출
}, [])
const selectedIds = JSON.parse(localStorage.getItem(...))
```

**After**:
```typescript
// Props로 데이터 직접 전달
function BulkActions({ selectedArticles }: Props) {
  generatePDF(selectedArticles) // 바로 사용
}
```

**효과**:
- 중복 API 호출 제거
- localStorage 의존성 제거
- 데이터 흐름 명확화
- 35% 코드 감소

### 📈 개선 효과 요약

| 항목 | Before | After | 개선율 |
|------|--------|-------|--------|
| app/api/news/route.ts | 280줄 | 25줄 | 91% ↓ |
| news-card.tsx | 157줄 | 114줄 | 27% ↓ |
| bulk-actions.tsx | 55줄 | 36줄 | 35% ↓ |
| 타입 중복 | 3곳 | 0곳 | 100% ↓ |
| 평균 파일 크기 | 97줄 | 68줄 | 30% ↓ |
| API 호출 중복 | 2곳 | 0곳 | 100% ↓ |
| localStorage 의존 | 3곳 | 1곳 | 67% ↓ |

### 🔄 남은 개선 작업

#### 선택적 개선 사항
- [ ] 미사용 Radix UI 패키지 제거 (~20개)
- [ ] React Query 도입 검토 (서버 상태 관리)
- [ ] E2E 테스트 추가
- [ ] 성능 최적화 (이미지 lazy loading, 코드 스플리팅)
- [ ] API 클라이언트 레이어 추가 (lib/api/)

### 💡 구조 품질 최종 평가

#### ✅ 단일 책임 원칙
- **app/api/news/route.ts**: ✅ 피드 조율만 담당
- **lib/news/categorizer.ts**: ✅ 카테고리 분류만 담당
- **lib/news/image-extractor.ts**: ✅ 이미지 추출만 담당
- **lib/news/rss-fetcher.ts**: ✅ RSS 수집만 담당
- **hooks/useArticleSummary.ts**: ✅ 요약 로직만 담당
- **hooks/useNewsFilters.ts**: ✅ 필터 상태만 담당

#### ✅ 재사용성
- **타입 정의**: 모든 컴포넌트에서 공통 사용
- **커스텀 훅**: 다른 프로젝트에서도 재사용 가능
- **lib/news 모듈**: 독립적으로 사용 가능

#### ✅ 응집도
- **관련 기능 그룹화**: lib/news/ 폴더에 뉴스 관련 모든 로직 집중
- **타입 정의 중앙화**: types/ 폴더에 모든 타입 집중
- **훅 분리**: hooks/ 폴더에 재사용 가능한 로직 집중

#### ✅ 결합도
- **낮은 결합도**: 각 모듈이 독립적으로 동작
- **명확한 인터페이스**: 타입으로 계약 정의
- **의존성 방향**: 단방향 의존성 유지

---

## 📌 [체크포인트 1] 2025-10-21 프로젝트 분석 및 문서화

### ✅ 완료된 작업
- **프로젝트 구조 분석**: 전체 29개 소스 파일 분석 완료
- **STRUCTURE.md 생성**: 파일별 역할 및 구조 품질 분석 문서화
- **DEPENDENCIES.md 생성**: 의존성 관계 다이어그램 및 외부 라이브러리 문서화
- **코드 품질 체크**: 단일 책임 원칙, 재사용성, 의존성 복잡도 분석

### 📝 현재 프로젝트 상태

#### 프로젝트 개요
- **이름**: Pulse News Aggregator
- **목적**: RSS 피드 기반 다중 소스 뉴스 애그리게이터
- **주요 기능**:
  - 국내/해외 다중 RSS 피드 수집
  - 카테고리별 자동 분류 (world, technology, business, science, health, sports, entertainment)
  - 지역별 필터링 (국내/해외)
  - 시간 범위 필터링
  - AI 기반 기사 요약 (OpenAI GPT-4o-mini)
  - PDF 다운로드 (개별/일괄)
  - 이메일 공유
  - 다크모드 지원

#### 기술 스택
- **프레임워크**: Next.js 15.2.4 (App Router)
- **UI**: React 19, Tailwind CSS 4.1.9, shadcn/ui (Radix UI)
- **AI**: OpenAI API (GPT-4o-mini)
- **데이터 처리**: fast-xml-parser, date-fns
- **PDF**: jspdf
- **테마**: next-themes
- **언어**: TypeScript 5

### 📊 프로젝트 현황

#### 파일 분포
- **총 파일 수**: 29개
- **도메인별 분포**:
  - API Routes: 2개
  - Pages: 1개
  - 기능 컴포넌트: 9개
  - UI 컴포넌트: 15개 (shadcn/ui)
  - 유틸리티: 2개

#### RSS 피드 소스
- **국제 뉴스** (5개): BBC, The Guardian, NY Times, CNN, Reddit
- **기술 뉴스** (2개): TechCrunch, MIT Technology Review
- **국내 뉴스** (3개): 연합뉴스 (사회, 산업), SBS 뉴스

### 🎯 코드 구조 품질

#### ✅ 잘 구현된 부분
1. **단일 책임 원칙**:
   - ✅ `lib/pdf-utils.ts`: PDF 생성만 담당
   - ✅ `app/api/summarize/route.ts`: AI 요약만 담당
   - ✅ `components/news-categories.tsx`: 카테고리 필터만 담당
   - ✅ `components/region-filter.tsx`: 지역 필터만 담당
   - ✅ `components/time-range-filter.tsx`: 시간 필터만 담당

2. **재사용성**:
   - ✅ `lib/` 폴더에 유틸리티 함수 잘 추출
   - ✅ shadcn/ui 컴포넌트 재사용 구조

3. **응집도**:
   - ✅ UI 컴포넌트들이 `components/ui/`에 잘 그룹화
   - ✅ API routes가 기능별로 분리

#### ⚠️ 개선 필요 영역

##### 1. app/page.tsx - 상태 관리 과다
**현재 문제**:
```typescript
// 7개의 독립적인 상태 관리
const [activeCategory, setActiveCategory] = useState("all")
const [searchQuery, setSearchQuery] = useState("")
const [timeRange, setTimeRange] = useState(7)
const [refreshTrigger, setRefreshTrigger] = useState(0)
const [selectedArticles, setSelectedArticles] = useState<string[]>([])
const [activeRegion, setActiveRegion] = useState("all")
```

**개선 방안**:
```typescript
// 커스텀 훅으로 필터 상태 통합
hooks/useNewsFilters.ts

// 또는 Context API 사용
contexts/NewsFilterContext.tsx
```

##### 2. app/api/news/route.ts - 다중 책임
**현재 문제**:
- RSS 피드 수집 (280줄)
- XML 파싱
- 카테고리 자동 분류 (categorizeArticle 함수, 87줄)
- OG 이미지 추출 (fetchOGImage 함수, 40줄)
- 모두 한 파일에 혼재

**개선 방안**:
```
lib/news/
├── rss-fetcher.ts      # RSS 피드 수집 로직
├── categorizer.ts      # 카테고리 분류 로직
├── image-extractor.ts  # OG 이미지 추출 로직
├── types.ts           # 공통 타입 정의
└── feeds.ts           # RSS_FEEDS 설정
```

##### 3. components/news-card.tsx - 비즈니스 로직 혼재
**현재 문제**:
- UI 렌더링 (157줄)
- API 호출 (요약)
- PDF 생성
- 이메일 공유
- 모두 한 컴포넌트에 혼재

**개선 방안**:
```typescript
// 비즈니스 로직 추출
hooks/useArticleSummary.ts   # 요약 API 호출 로직
hooks/useArticleActions.ts   # 공유/다운로드 액션

// 컴포넌트는 순수 UI만 담당
components/news-card.tsx
```

##### 4. components/bulk-actions.tsx - 데이터 동기화 이슈
**현재 문제**:
```typescript
// localStorage에 의존
const selectedIds = JSON.parse(localStorage.getItem("selectedArticles") || "[]")

// 독립적으로 API 호출
useEffect(() => {
  async function fetchArticles() {
    const response = await fetch("/api/news")
    // ...
  }
  fetchArticles()
}, [])
```

**문제점**:
- `NewsFeed`와 중복 API 호출
- localStorage와 props 상태 불일치 가능

**개선 방안**:
```typescript
// Props로 선택된 기사 데이터 직접 전달
interface BulkActionsProps {
  selectedArticles: NewsArticle[]  // ID가 아닌 전체 데이터
  onClearSelection: () => void
}
```

##### 5. 타입 정의 중복
**현재 문제**:
- `NewsArticle` 인터페이스가 여러 파일에 중복 정의:
  - `components/news-feed.tsx`
  - `components/news-card.tsx`
  - `lib/pdf-utils.ts`

**개선 방안**:
```typescript
// 중앙화된 타입 정의
types/article.ts

export interface NewsArticle {
  id: string
  title: string
  description: string
  link: string
  pubDate: string
  source: string
  imageUrl?: string
  category?: string
  region?: string
}
```

##### 6. 과도한 외부 의존성
**현재 문제**:
- Radix UI 패키지 30개 이상 설치
- 실제 사용: 약 10개
- 미사용: 약 20개

**개선 방안**:
```bash
# package.json 정리
# 사용하지 않는 Radix UI 패키지 제거
# 번들 사이즈 최적화
```

### 💡 개선 제안 요약

#### High Priority (즉시 개선 권장)
1. **API 비즈니스 로직 분리**:
   - `app/api/news/route.ts` → `lib/news/` 폴더로 기능 분리
   - 280줄 → 각 50-70줄씩 4-5개 파일로 분리

2. **컴포넌트 비즈니스 로직 추출**:
   - `news-card.tsx`의 API 호출 로직 → 커스텀 훅으로 분리
   - UI와 비즈니스 로직 명확히 분리

3. **타입 정의 중앙화**:
   - `types/article.ts` 생성
   - 중복 타입 정의 제거

4. **미사용 패키지 제거**:
   - Radix UI 미사용 패키지 약 20개 제거
   - 번들 사이즈 최적화

#### Medium Priority (단계적 개선)
1. **상태 관리 개선**:
   - `page.tsx`의 7개 상태 → 커스텀 훅 또는 Context API로 통합

2. **데이터 페칭 최적화**:
   - `BulkActions`의 중복 API 호출 제거
   - props로 데이터 전달

3. **API 클라이언트 레이어 추가**:
   - `lib/api/` 폴더 생성
   - fetch 로직 중앙화

#### Low Priority (선택적 개선)
1. **React Query 도입 고려**:
   - 서버 상태 관리
   - 자동 캐싱 및 리페칭
   - 중복 요청 방지

2. **localStorage 추상화**:
   - `hooks/useLocalStorage.ts` 생성
   - SSR 호환성 개선

### 🔄 다음 단계

#### 즉시 실행 가능한 작업
- [ ] `types/article.ts` 생성 및 타입 중앙화
- [ ] `lib/news/` 폴더 생성 및 API 로직 분리
- [ ] `hooks/useArticleSummary.ts` 생성
- [ ] `package.json` 정리 (미사용 패키지 제거)

#### 중기 개선 작업
- [ ] `hooks/useNewsFilters.ts` 생성
- [ ] `BulkActions` props 구조 개선
- [ ] `lib/api/` 클라이언트 레이어 추가

#### 장기 고려 사항
- [ ] React Query 도입 검토
- [ ] E2E 테스트 추가 (Playwright)
- [ ] 성능 최적화 (이미지 lazy loading, 코드 스플리팅)

### 📈 기대 효과

개선 작업 완료 시:
- ✅ **코드 가독성**: 파일당 평균 줄 수 280줄 → 70줄 (75% 감소)
- ✅ **유지보수성**: 단일 책임 원칙 준수로 버그 수정 용이
- ✅ **재사용성**: 커스텀 훅으로 로직 재사용 증가
- ✅ **번들 사이즈**: 미사용 패키지 제거로 약 15-20% 감소 예상
- ✅ **타입 안정성**: 중앙화된 타입으로 타입 에러 방지

---

**다음 체크포인트**: 주요 리팩토링 작업 완료 후 기록 예정
