/**
 * 뉴스 기사 인터페이스
 * 모든 컴포넌트와 API에서 공통으로 사용되는 타입 정의
 */
export interface NewsArticle {
  id: string
  title: string
  description: string
  link: string
  pubDate: string
  source: string
  imageUrl?: string
  category?: string
  region?: "domestic" | "international"
}

/**
 * RSS 피드 설정 인터페이스
 */
export interface RSSFeed {
  url: string
  source: string
  region: "domestic" | "international"
}

/**
 * RSS 아이템 인터페이스 (파싱용)
 */
export interface RSSItem {
  title: string
  description: string
  summary?: string
  link: string
  pubDate: string
  published?: string
  category?: string | string[]
  "media:thumbnail"?: { "@_url": string }
  "media:content"?: { "@_url": string }
  enclosure?: { "@_url": string; "@_type": string }
  "media:group"?: {
    "media:content": { "@_url": string }
  }
}

/**
 * 뉴스 카테고리 타입
 */
export type NewsCategory = "all" | "world" | "politics" | "technology" | "business" | "science" | "health" | "sports" | "entertainment"

/**
 * 지역 필터 타입
 */
export type NewsRegion = "all" | "domestic" | "international"

/**
 * 뉴스 필터 상태 인터페이스
 */
export interface NewsFilters {
  category: NewsCategory
  region: NewsRegion
  searchQuery: string
  timeRange: number
}
