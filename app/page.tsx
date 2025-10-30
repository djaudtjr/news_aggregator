"use client"

import { useState, useRef } from "react"
import { NewsHeader } from "@/components/news-header"
import { NewsFeed } from "@/components/news-feed"
import { NewsCategories } from "@/components/news-categories"
import { TimeRangeFilter } from "@/components/time-range-filter"
import { RegionFilter } from "@/components/region-filter"
import { TrendingKeywords } from "@/components/trending-keywords"
import { RecentArticles } from "@/components/recent-articles"
import { LayoutSwitcher } from "@/components/layout-switcher"
import { useNewsFilters } from "@/hooks/useNewsFilters"
import { useLayoutMode } from "@/hooks/useLayoutMode"
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

  const { layoutMode, setLayoutMode } = useLayoutMode()

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
      />
      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 메인 콘텐츠 */}
          <div className="flex-1 flex flex-col gap-6">
            <RegionFilter activeRegion={activeRegion} onRegionChange={handleRegionChange} />
            <NewsCategories
              activeCategory={activeCategory}
              onCategoryChange={handleCategoryChange}
              availableCategories={availableCategories}
            />
            <div className="flex items-center justify-between gap-4">
              <TimeRangeFilter timeRange={timeRange} onTimeRangeChange={handleTimeRangeChange} />
              <LayoutSwitcher layoutMode={layoutMode} onLayoutChange={setLayoutMode} />
            </div>
            <NewsFeed
              activeCategory={activeCategory}
              searchQuery={searchQuery}
              timeRange={timeRange}
              refreshTrigger={refreshTrigger}
              activeRegion={activeRegion}
              layoutMode={layoutMode}
              onAvailableCategoriesChange={setAvailableCategories}
            />
          </div>

          {/* 사이드바 */}
          <aside className="w-full lg:w-80 shrink-0">
            <div className="sticky top-20 space-y-6 max-h-[calc(100vh-6rem)] overflow-y-auto">
              <TrendingKeywords
                key={trendingRefreshKey}
                onKeywordClick={handleTrendingKeywordClick}
              />
              <RecentArticles />
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
