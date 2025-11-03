"use client"

import { useState } from "react"
import { NewsHeader } from "@/components/news-header"
import { NewsFeed } from "@/components/news-feed"
import { NewsCategories } from "@/components/news-categories"
import { TrendingKeywords } from "@/components/trending-keywords"
import { RecentArticles } from "@/components/recent-articles"
import { HeroSubscribeBanner } from "@/components/subscription/hero-subscribe-banner"
import { Footer } from "@/components/footer"
import { useNewsFilters } from "@/hooks/useNewsFilters"
import type { NewsCategory, NewsRegion } from "@/types/article"

export default function HomePage() {
  const {
    activeCategory,
    activeRegion,
    searchQuery,
    timeRange,
    refreshTrigger,
    setActiveCategory,
    setActiveRegion,
    setSearchQuery,
    setTimeRange,
    refresh,
  } = useNewsFilters()

  const [availableCategories, setAvailableCategories] = useState<Set<string> | undefined>(undefined)
  const [trendingRefreshKey, setTrendingRefreshKey] = useState(0)

  const handleTrendingKeywordClick = (keyword: string) => {
    setSearchQuery(keyword)
  }

  const handleSearchTracked = () => {
    // 인기 검색어 컴포넌트를 다시 렌더링하여 업데이트된 데이터 가져오기
    setTrendingRefreshKey(prev => prev + 1)
  }

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category as NewsCategory)
  }

  const handleRegionChange = (region: string) => {
    setActiveRegion(region as NewsRegion)
  }

  const handleTimeRangeChange = (days: number) => {
    setTimeRange(days)
    refresh() // 시간 범위 변경 시 새로고침
  }

  const handleRefresh = () => {
    // 메인화면으로 이동: 모든 필터 초기화
    setActiveCategory("all")
    setActiveRegion("all")
    setSearchQuery("")
    setTimeRange(1) // 1일로 초기화
    refresh()
  }

  return (
    <div className="min-h-screen bg-background">
      <NewsHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRefresh={handleRefresh}
        onSearchTracked={handleSearchTracked}
        activeRegion={activeRegion}
        onRegionChange={handleRegionChange}
        timeRange={timeRange}
        onTimeRangeChange={handleTimeRangeChange}
      />
      <HeroSubscribeBanner />
      <main className="max-w-7xl mx-auto px-8 py-6">
        <div className="flex flex-col gap-6">
          {/* 카테고리 필터만 유지 */}
          <NewsCategories
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
            availableCategories={availableCategories}
          />

          {/* 메인 뉴스 그리드 (3x3 고정) */}
          <NewsFeed
            activeCategory={activeCategory}
            searchQuery={searchQuery}
            timeRange={timeRange}
            refreshTrigger={refreshTrigger}
            activeRegion={activeRegion}
            layoutMode="grid"
            onAvailableCategoriesChange={setAvailableCategories}
          />

          {/* 하단 섹션 */}
          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <TrendingKeywords
              key={trendingRefreshKey}
              onKeywordClick={handleTrendingKeywordClick}
            />
            <RecentArticles />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
