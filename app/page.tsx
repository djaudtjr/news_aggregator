"use client"

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

  const handleTrendingKeywordClick = (keyword: string) => {
    setSearchQuery(keyword)
  }

  const handleTimeRangeChange = (days: number) => {
    setTimeRange(days)
    refresh() // 시간 범위 변경 시 새로고침
  }

  return (
    <div className="min-h-screen bg-background">
      <NewsHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} onRefresh={refresh} />
      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 메인 콘텐츠 */}
          <div className="flex-1 flex flex-col gap-6">
            <RegionFilter activeRegion={activeRegion} onRegionChange={setActiveRegion} />
            <NewsCategories activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
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
            />
          </div>

          {/* 사이드바 */}
          <aside className="w-full lg:w-80 shrink-0">
            <div className="sticky top-20 space-y-6 max-h-[calc(100vh-6rem)] overflow-y-auto">
              <TrendingKeywords onKeywordClick={handleTrendingKeywordClick} />
              <RecentArticles />
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
