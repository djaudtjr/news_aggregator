"use client"

import { useEffect, useMemo, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import { NewsCard } from "@/components/news-card"
import { NewsCardCompact } from "@/components/news-card-compact"
import { NewsCardList } from "@/components/news-card-list"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import type { NewsArticle } from "@/types/article"
import type { LayoutMode } from "@/hooks/useLayoutMode"

interface NewsFeedProps {
  activeCategory: string
  searchQuery: string
  timeRange: number
  refreshTrigger: number
  activeRegion: string
  layoutMode: LayoutMode
  onAvailableCategoriesChange?: (categories: Set<string>) => void
}

async function fetchNews(searchQuery: string, activeRegion: string): Promise<NewsArticle[]> {
  // 검색어가 있으면 검색 API 사용, 없으면 전체 뉴스 API 사용
  const url = searchQuery.trim()
    ? `/api/search?q=${encodeURIComponent(searchQuery)}&region=${activeRegion}`
    : `/api/news`

  console.log("[NewsFeed] Fetching news from:", url)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000) // 10초 타임아웃

  try {
    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`서버 응답 오류: ${response.status}`)
    }
    const data = await response.json()
    console.log("[NewsFeed] Fetched articles:", data.articles?.length || 0)
    return data.articles || []
  } catch (fetchError) {
    clearTimeout(timeoutId)
    if (fetchError instanceof Error && fetchError.name === 'AbortError') {
      throw new Error("요청 시간이 초과되었습니다. 다시 시도해주세요.")
    }
    throw fetchError
  }
}

export function NewsFeed({
  activeCategory,
  searchQuery,
  timeRange,
  refreshTrigger,
  activeRegion,
  layoutMode,
  onAvailableCategoriesChange,
}: NewsFeedProps) {
  // React Query로 데이터 fetching
  const { data: articles = [], isLoading: loading, error } = useQuery({
    queryKey: ['news', searchQuery, activeRegion, refreshTrigger],
    queryFn: () => fetchNews(searchQuery, activeRegion),
    staleTime: 5 * 60 * 1000, // 5분간 fresh 상태 유지
    gcTime: 10 * 60 * 1000, // 10분간 캐시 유지
  })

  const filteredArticles = articles.filter((article) => {
    const isSearchMode = searchQuery.trim().length > 0

    // 시간 범위 필터링 (밀리초 단위로 계산)
    const articleDate = new Date(article.pubDate)
    const cutoffDate = new Date()
    const millisecondsInDay = 24 * 60 * 60 * 1000
    cutoffDate.setTime(cutoffDate.getTime() - timeRange * millisecondsInDay)
    const matchesTimeRange = articleDate >= cutoffDate

    // 카테고리 필터링 (검색 모드와 일반 모드 모두 적용)
    // - activeCategory === "all": 모든 기사 표시 (article.category가 "all"인 것도 포함)
    // - activeCategory가 특정 카테고리: 정확히 매칭되는 것만 표시 (article.category === "all"인 애매한 분류는 제외)
    const matchesCategory =
      activeCategory === "all" || (article.category && article.category === activeCategory && article.category !== "all")

    // 지역 필터링 (일반 모드에서만 적용, 검색 모드는 API에서 이미 처리됨)
    const matchesRegion = isSearchMode || activeRegion === "all" || article.region === activeRegion

    return matchesCategory && matchesTimeRange && matchesRegion
  })

  // 검색 모드일 때: 사용 가능한 카테고리 목록 계산
  const availableCategories = useMemo(() => {
    if (searchQuery.trim().length > 0) {
      const categories = new Set<string>(["all"]) // "all"은 항상 활성화
      articles.forEach((article) => {
        if (article.category && article.category !== "all") {
          categories.add(article.category)
        }
      })
      return categories
    } else {
      // 일반 모드에서는 모든 카테고리 활성화
      return new Set(["all", "world", "politics", "business", "technology", "science", "health", "sports", "entertainment"])
    }
  }, [articles, searchQuery])

  // 카테고리 변경을 상위 컴포넌트에 전달 (무한 루프 방지)
  const prevCategoriesRef = useRef<Set<string>>()
  useEffect(() => {
    if (!onAvailableCategoriesChange) return

    // 이전과 동일한 카테고리면 호출하지 않음
    const prevCategories = prevCategoriesRef.current
    const categoriesChanged = !prevCategories ||
      prevCategories.size !== availableCategories.size ||
      ![...availableCategories].every(cat => prevCategories.has(cat))

    if (categoriesChanged) {
      prevCategoriesRef.current = availableCategories
      onAvailableCategoriesChange(availableCategories)
    }
  }, [availableCategories, onAvailableCategoriesChange])

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error instanceof Error ? error.message : "뉴스를 불러오는 중 오류가 발생했습니다"}</AlertDescription>
      </Alert>
    )
  }

  if (filteredArticles.length === 0) {
    const isSearchMode = searchQuery.trim().length > 0

    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{isSearchMode ? "검색 결과 없음" : "뉴스 없음"}</AlertTitle>
        <AlertDescription>
          {isSearchMode
            ? `"${searchQuery}"에 대한 관련 뉴스를 찾을 수 없습니다.`
            : activeCategory === "all"
              ? "최신 뉴스를 불러오는 중입니다. 잠시 후 다시 확인해주세요."
              : `${activeCategory} 카테고리에 뉴스가 없습니다.`}
        </AlertDescription>
      </Alert>
    )
  }

  // 레이아웃 모드에 따른 컨테이너 클래스
  const containerClass =
    layoutMode === "grid"
      ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3"
      : layoutMode === "list"
        ? "grid gap-6 md:grid-cols-1"
        : "space-y-3"

  return (
    <div className={containerClass}>
      {filteredArticles.map((article) => {
        if (layoutMode === "compact") {
          return <NewsCardCompact key={article.id} article={article} />
        } else if (layoutMode === "list") {
          return <NewsCardList key={article.id} article={article} />
        } else {
          return <NewsCard key={article.id} article={article} />
        }
      })}
    </div>
  )
}
