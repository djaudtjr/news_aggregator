"use client"

import { useEffect, useState } from "react"
import { NewsCard } from "@/components/news-card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import type { NewsArticle } from "@/types/article"

interface NewsFeedProps {
  activeCategory: string
  searchQuery: string
  timeRange: number
  refreshTrigger: number
  selectedArticles: string[]
  onSelectionChange: (selected: string[]) => void
  activeRegion: string
}

export function NewsFeed({
  activeCategory,
  searchQuery,
  timeRange,
  refreshTrigger,
  selectedArticles,
  onSelectionChange,
  activeRegion,
}: NewsFeedProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchNews() {
      try {
        setLoading(true)

        // 검색어가 있으면 검색 API 사용, 없으면 전체 뉴스 API 사용
        const url = searchQuery.trim()
          ? `/api/search?q=${encodeURIComponent(searchQuery)}&region=${activeRegion}&t=${Date.now()}`
          : `/api/news?t=${Date.now()}`

        const response = await fetch(url)
        if (!response.ok) {
          throw new Error("Failed to fetch news")
        }
        const data = await response.json()
        setArticles(data.articles || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
  }, [refreshTrigger, searchQuery, activeRegion])

  const filteredArticles = articles.filter((article) => {
    // 검색 모드일 때는 카테고리 필터만 무시 (지역 필터는 API에서 처리됨)
    const isSearchMode = searchQuery.trim().length > 0

    if (isSearchMode) {
      // 검색 모드: 시간 범위만 적용 (지역은 API에서 이미 필터링됨)
      const articleDate = new Date(article.pubDate)
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - timeRange)
      const matchesTimeRange = articleDate >= cutoffDate

      return matchesTimeRange
    }

    // 일반 모드: 기존 필터 적용
    const matchesCategory = activeCategory === "all" || article.category === activeCategory
    const matchesRegion = activeRegion === "all" || article.region === activeRegion

    const articleDate = new Date(article.pubDate)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - timeRange)
    const matchesTimeRange = articleDate >= cutoffDate

    return matchesCategory && matchesTimeRange && matchesRegion
  })

  const handleToggleSelection = (articleId: string) => {
    if (selectedArticles.includes(articleId)) {
      onSelectionChange(selectedArticles.filter((id) => id !== articleId))
    } else {
      onSelectionChange([...selectedArticles, articleId])
    }
  }

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
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (filteredArticles.length === 0) {
    const isSearchMode = searchQuery.trim().length > 0

    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No articles found</AlertTitle>
        <AlertDescription>
          {isSearchMode
            ? `"${searchQuery}" 검색 결과가 없습니다. 국내/해외 뉴스를 모두 검색했습니다.`
            : activeCategory === "all"
              ? "최신 뉴스를 불러오는 중입니다. 잠시 후 다시 확인해주세요."
              : `${activeCategory} 카테고리에 뉴스가 없습니다.`}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {filteredArticles.map((article) => (
        <NewsCard
          key={article.id}
          article={article}
          isSelected={selectedArticles.includes(article.id)}
          onToggleSelection={handleToggleSelection}
        />
      ))}
    </div>
  )
}
