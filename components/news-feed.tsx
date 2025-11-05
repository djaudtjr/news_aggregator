"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { NewsCard } from "@/components/news-card"
import { NewsCardCompact } from "@/components/news-card-compact"
import { NewsCardList } from "@/components/news-card-list"
import { NewsCardSkeleton, NewsCardCompactSkeleton, NewsCardListSkeleton } from "@/components/news-card-skeleton"
import { EmptyState } from "@/components/empty-state"
import { Pagination } from "@/components/pagination"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, Newspaper } from "lucide-react"
import type { NewsArticle } from "@/types/article"
import type { LayoutMode } from "@/hooks/useLayoutMode"

interface Category {
  id: number
  code: string
  label_ko: string
  label_en: string | null
  display_order: number
}

interface NewsFeedProps {
  activeCategory: string
  searchQuery: string
  timeRange: number
  refreshTrigger: number
  activeRegion: string
  layoutMode: LayoutMode
  onAvailableCategoriesChange?: (categories: Set<string>) => void
  onTotalCountChange?: (count: number) => void
  onPageChange?: (page: number) => void
  onTotalPagesChange?: (totalPages: number) => void
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
  onTotalCountChange,
  onPageChange,
  onTotalPagesChange,
}: NewsFeedProps) {
  const [allCategories, setAllCategories] = useState<Set<string>>(new Set())
  const [showLoadingMessage, setShowLoadingMessage] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const ITEMS_PER_PAGE = 9 // 3x3 그리드

  // DB에서 카테고리 목록 가져오기
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch("/api/codes?codeType=news_category")
        if (!response.ok) {
          throw new Error("Failed to fetch categories")
        }
        const data = await response.json()
        const categories = new Set<string>(data.codes?.map((c: Category) => c.code) || [])
        setAllCategories(categories)
      } catch (error) {
        console.error("Error fetching categories:", error)
        // 에러 발생 시 기본 카테고리 사용
        setAllCategories(new Set(["all", "world", "politics", "business", "technology", "science", "health", "sports", "entertainment"]))
      }
    }

    fetchCategories()
  }, [])

  // React Query로 데이터 fetching
  const { data: articles = [], isLoading: loading, error } = useQuery({
    queryKey: ['news', searchQuery, activeRegion, refreshTrigger],
    queryFn: () => fetchNews(searchQuery, activeRegion),
    staleTime: 5 * 60 * 1000, // 5분간 fresh 상태 유지
    gcTime: 10 * 60 * 1000, // 10분간 캐시 유지
    refetchOnWindowFocus: false, // 윈도우 포커스 시 재요청 방지
    refetchOnMount: true, // 마운트 시 fresh하지 않은 데이터만 재요청
    retry: 2, // 실패 시 2번만 재시도
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
      // 일반 모드에서는 DB에서 가져온 모든 카테고리 활성화
      return allCategories
    }
  }, [articles, searchQuery, allCategories])

  // 카테고리 변경을 상위 컴포넌트에 전달 (무한 루프 방지)
  const prevCategoriesRef = useRef<Set<string> | undefined>(undefined)
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

  // 총 뉴스 개수를 상위 컴포넌트에 전달
  useEffect(() => {
    if (onTotalCountChange) {
      onTotalCountChange(filteredArticles.length)
    }
  }, [filteredArticles.length, onTotalCountChange])

  // 현재 페이지를 상위 컴포넌트에 전달
  useEffect(() => {
    if (onPageChange) {
      onPageChange(currentPage)
    }
  }, [currentPage, onPageChange])

  // 총 페이지 수 계산
  const totalPages = useMemo(() => {
    return Math.ceil(filteredArticles.length / ITEMS_PER_PAGE)
  }, [filteredArticles.length, ITEMS_PER_PAGE])

  // 총 페이지 수를 상위 컴포넌트에 전달
  useEffect(() => {
    if (onTotalPagesChange) {
      onTotalPagesChange(totalPages)
    }
  }, [totalPages, onTotalPagesChange])

  // 필터 변경 시 페이지 1로 리셋
  useEffect(() => {
    setCurrentPage(1)
  }, [activeCategory, searchQuery, timeRange, activeRegion])

  // 로딩 진행률 시뮬레이션
  useEffect(() => {
    if (loading) {
      setLoadingProgress(0)
      const interval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const messageTimer = setTimeout(() => {
        setShowLoadingMessage(true)
      }, 2000)

      return () => {
        clearInterval(interval)
        clearTimeout(messageTimer)
        setShowLoadingMessage(false)
      }
    } else {
      setLoadingProgress(100)
      setTimeout(() => setLoadingProgress(0), 500)
      setShowLoadingMessage(false)
    }
  }, [loading])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Newspaper className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-semibold">뉴스를 불러오는 중입니다</h3>
              <p className="text-sm text-muted-foreground">Loading {loadingProgress}%</p>
            </div>
          </div>
          <Progress value={loadingProgress} className="h-2" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <NewsCardSkeleton key={i} />
          ))}
        </div>
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
    return <EmptyState searchQuery={searchQuery} isSearchMode={isSearchMode} />
  }

  // 페이징 계산
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedArticles = filteredArticles.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // 페이지 변경 시 상단으로 부드럽게 스크롤
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="space-y-6">
      {/* 뉴스 그리드 (3x3) */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {paginatedArticles.map((article) => (
          <NewsCard key={article.id} article={article} />
        ))}
      </div>

      {/* 페이징 */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  )
}
