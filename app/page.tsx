"use client"

import { NewsHeader } from "@/components/news-header"
import { NewsFeed } from "@/components/news-feed"
import { NewsCategories } from "@/components/news-categories"
import { TimeRangeFilter } from "@/components/time-range-filter"
import { RegionFilter } from "@/components/region-filter"
import { useNewsFilters } from "@/hooks/useNewsFilters"

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

  return (
    <div className="min-h-screen bg-background">
      <NewsHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} onRefresh={refresh} />
      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col gap-6">
          <RegionFilter activeRegion={activeRegion} onRegionChange={setActiveRegion} />
          <NewsCategories activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
          <TimeRangeFilter timeRange={timeRange} onTimeRangeChange={setTimeRange} />
          <NewsFeed
            activeCategory={activeCategory}
            searchQuery={searchQuery}
            timeRange={timeRange}
            refreshTrigger={refreshTrigger}
            activeRegion={activeRegion}
          />
        </div>
      </main>
    </div>
  )
}
