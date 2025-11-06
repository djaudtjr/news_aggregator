"use client"

import { useState } from "react"
import { Newspaper } from "lucide-react"
import { NewsHeader } from "@/components/news-header"
import { NewsFeed } from "@/components/news-feed"
import { NewsCategories } from "@/components/news-categories"
import { TrendingKeywordsCompact } from "@/components/trending-keywords-compact"
import { RecentArticlesSidebar } from "@/components/recent-articles-sidebar"
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
  const [totalNewsCount, setTotalNewsCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)

  const handleTrendingKeywordClick = (keyword: string) => {
    setSearchQuery(keyword)
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
        activeRegion={activeRegion}
        onRegionChange={handleRegionChange}
        timeRange={timeRange}
        onTimeRangeChange={handleTimeRangeChange}
      />
      <HeroSubscribeBanner />

      {/* 모바일: 총 뉴스 개수 & 페이지 정보 - 상단에 표시 */}
      <div className="md:hidden bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Newspaper className="h-3.5 w-3.5" />
              <span className="font-medium">총 {totalNewsCount.toLocaleString()} 뉴스</span>
            </div>
            {currentPage > 0 && totalPages > 0 && (
              <div className="text-xs text-muted-foreground font-medium">
                Page {currentPage} / {totalPages}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 카테고리 + 인기 검색어 - 같은 행에 배치 */}
      <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3">
          <div className="flex items-start gap-6">
            {/* 왼쪽: 카테고리 */}
            <div className="shrink-0">
              <NewsCategories
                activeCategory={activeCategory}
                onCategoryChange={handleCategoryChange}
                availableCategories={availableCategories}
              />
            </div>
            {/* 구분선 */}
            <div className="hidden md:block h-[60px] w-px bg-muted-foreground/30 shrink-0" />
            {/* 오른쪽: 인기 검색어 - 모바일에서는 총 뉴스 정보 숨김 */}
            <div className="hidden md:block shrink-0">
              <TrendingKeywordsCompact
                onKeywordClick={handleTrendingKeywordClick}
                totalNewsCount={totalNewsCount}
                currentPage={currentPage}
                totalPages={totalPages}
                showNewsInfo={true}
              />
            </div>
            {/* 모바일: 인기 검색어만 표시 */}
            <div className="md:hidden flex-1 min-w-0">
              <TrendingKeywordsCompact
                onKeywordClick={handleTrendingKeywordClick}
                showNewsInfo={false}
              />
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <NewsFeed
          activeCategory={activeCategory}
          searchQuery={searchQuery}
          timeRange={timeRange}
          refreshTrigger={refreshTrigger}
          activeRegion={activeRegion}
          layoutMode="grid"
          onAvailableCategoriesChange={setAvailableCategories}
          onTotalCountChange={setTotalNewsCount}
          onPageChange={setCurrentPage}
          onTotalPagesChange={setTotalPages}
        />
      </main>



      {/* 오른쪽 고정 사이드바: 최근 본 기사 */}
      <RecentArticlesSidebar />

      <Footer />
    </div>
  )
}
