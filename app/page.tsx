"use client"

import { useState } from "react"
import { NewsHeader } from "@/components/news-header"
import { NewsFeed } from "@/components/news-feed"
import { NewsCategories } from "@/components/news-categories"
import { TimeRangeFilter } from "@/components/time-range-filter"
import { BulkActions } from "@/components/bulk-actions"
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

  const [selectedArticles, setSelectedArticles] = useState<string[]>([])

  const handleRefresh = () => {
    refresh()
    setSelectedArticles([])
  }

  return (
    <div className="min-h-screen bg-background">
      <NewsHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} onRefresh={handleRefresh} />
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
            selectedArticles={selectedArticles}
            onSelectionChange={setSelectedArticles}
            activeRegion={activeRegion}
          />
        </div>
      </main>
      {selectedArticles.length > 0 && (
        <BulkActions selectedCount={selectedArticles.length} onClearSelection={() => setSelectedArticles([])} />
      )}
    </div>
  )
}
