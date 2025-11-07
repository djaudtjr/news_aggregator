"use client"

import { useState } from "react"
import { Newspaper, Search, Star, X } from "lucide-react"
import { NewsHeader } from "@/components/news-header"
import { NewsFeed } from "@/components/news-feed"
import { NewsCategories } from "@/components/news-categories"
import { TrendingKeywordsCompact } from "@/components/trending-keywords-compact"
import { RecentArticlesSidebar } from "@/components/recent-articles-sidebar"
import { HeroSubscribeBanner } from "@/components/subscription/hero-subscribe-banner"
import { Footer } from "@/components/footer"
import { useNewsFilters } from "@/hooks/useNewsFilters"
import { useSubscribedKeywords } from "@/hooks/useSubscribedKeywords"
import type { NewsCategory, NewsRegion } from "@/types/article"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

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

  const { keywords, loading: keywordsLoading } = useSubscribedKeywords()

  // 테스트용: 로그인 없이도 테스트하려면 아래 주석 해제
  // const testKeywords = [
  //   { id: 'test1', keyword: 'AI', user_id: 'test', created_at: new Date().toISOString() },
  //   { id: 'test2', keyword: '삼성', user_id: 'test', created_at: new Date().toISOString() },
  //   { id: 'test3', keyword: '기술', user_id: 'test', created_at: new Date().toISOString() },
  // ]
  // const displayKeywords = keywords?.length > 0 ? keywords : testKeywords

  // 현재 세션에서 숨긴 키워드 ID 목록 (다음 로그인 시 초기화됨)
  const [hiddenKeywordIds, setHiddenKeywordIds] = useState<Set<string>>(new Set())

  // 숨기지 않은 키워드만 표시
  const visibleKeywords = keywords?.filter(kw => !hiddenKeywordIds.has(kw.id)) || []

  const [availableCategories, setAvailableCategories] = useState<Set<string> | undefined>(undefined)
  const [totalNewsCount, setTotalNewsCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)

  // 디버깅: 키워드 로딩 상태 확인
  console.log('[HomePage] Keywords:', keywords)
  console.log('[HomePage] Keywords loading:', keywordsLoading)
  console.log('[HomePage] Keywords length:', keywords?.length)

  const handleTrendingKeywordClick = (keyword: string) => {
    setSearchQuery(keyword)
  }

  const handleSubscribedKeywordClick = (keyword: string) => {
    setSearchQuery(keyword)
  }

  const handleHideKeyword = (keywordId: string) => {
    setHiddenKeywordIds(prev => new Set([...prev, keywordId]))
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

      {/* 데스크톱: 카테고리 + 구독 키워드 + 인기 검색어 */}
      <div className="hidden md:block bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3">
          <div className="flex items-center gap-4">
            {/* 카테고리 */}
            <div className="shrink-0">
              <NewsCategories
                activeCategory={activeCategory}
                onCategoryChange={handleCategoryChange}
                availableCategories={availableCategories}
              />
            </div>

            {/* 즐겨찾기 키워드 */}
            {visibleKeywords && visibleKeywords.length > 0 && (
              <>
                <div className="h-8 w-px bg-muted-foreground/30 shrink-0" />
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-semibold text-muted-foreground">즐겨찾기:</span>
                  <div className="flex gap-2">
                    {visibleKeywords.map((kw) => (
                      <div key={kw.id} className="relative group">
                        <Button
                          variant={searchQuery === kw.keyword ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleSubscribedKeywordClick(kw.keyword)}
                          className="h-8 pl-3 pr-8 rounded-full transition-all duration-200 hover:scale-105"
                        >
                          {kw.keyword}
                        </Button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleHideKeyword(kw.id)
                          }}
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full flex items-center justify-center hover:bg-muted/80 transition-colors"
                          title="이번 세션에서 숨기기"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* 구분선 */}
            <div className="h-8 w-px bg-muted-foreground/30 shrink-0" />

            {/* 인기 검색어 */}
            <div className="flex-1 min-w-0">
              <TrendingKeywordsCompact
                onKeywordClick={handleTrendingKeywordClick}
                totalNewsCount={totalNewsCount}
                currentPage={currentPage}
                totalPages={totalPages}
                showNewsInfo={true}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 모바일: 카테고리 | 키워드 입력창 */}
      <div className="md:hidden bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center gap-3">
            {/* 왼쪽: 카테고리 */}
            <div className="shrink-0">
              <NewsCategories
                activeCategory={activeCategory}
                onCategoryChange={handleCategoryChange}
                availableCategories={availableCategories}
              />
            </div>
            {/* 구분선 */}
            <div className="h-[40px] w-px bg-muted-foreground/30 shrink-0" />
            {/* 오른쪽: 키워드 입력창 + 검색 버튼 */}
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <input
                type="text"
                placeholder="키워드 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSearchQuery(searchQuery)
                  }
                }}
                className="flex-1 h-8 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0"
              />
              <Button
                variant="default"
                size="icon"
                className="h-8 w-8 shrink-0 rounded-md"
                onClick={() => setSearchQuery(searchQuery)}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 즐겨찾기 키워드 (모바일) */}
          {visibleKeywords && visibleKeywords.length > 0 && (
            <div className="flex items-center gap-2 mt-2 pb-1">
              <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 shrink-0" />
              <span className="text-xs font-semibold text-muted-foreground shrink-0">즐겨찾기:</span>
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide flex-1">
                {visibleKeywords.map((kw) => (
                  <div key={kw.id} className="relative group shrink-0">
                    <Button
                      variant={searchQuery === kw.keyword ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSubscribedKeywordClick(kw.keyword)}
                      className="h-7 pl-2.5 pr-7 rounded-full text-xs whitespace-nowrap"
                    >
                      {kw.keyword}
                    </Button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleHideKeyword(kw.id)
                      }}
                      className="absolute right-0.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full flex items-center justify-center hover:bg-muted/80 transition-colors"
                      title="이번 세션에서 숨기기"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 모바일: 인기 검색어 (총 뉴스/페이지 포함) */}
      <div className="md:hidden bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <TrendingKeywordsCompact
            onKeywordClick={handleTrendingKeywordClick}
            totalNewsCount={totalNewsCount}
            currentPage={currentPage}
            totalPages={totalPages}
            showNewsInfo={true}
            isMobile={true}
          />
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-3 md:px-8 py-4 md:py-6">
        <NewsFeed
          activeCategory={activeCategory}
          searchQuery={searchQuery}
          timeRange={timeRange}
          refreshTrigger={refreshTrigger}
          activeRegion={activeRegion}
          layoutMode="grid"
          favoriteKeywords={visibleKeywords?.map(kw => kw.keyword) || []}
          onAvailableCategoriesChange={setAvailableCategories}
          onTotalCountChange={setTotalNewsCount}
          onPageChange={setCurrentPage}
          onTotalPagesChange={setTotalPages}
        />
      </main>



      {/* 오른쪽 고정 사이드바: 최근 본 기사 (데스크톱만) */}
      <div className="hidden md:block">
        <RecentArticlesSidebar />
      </div>

      <Footer />
    </div>
  )
}
