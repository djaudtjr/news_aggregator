"use client"

import { useState, useEffect } from "react"
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
import { useEmailSettings } from "@/hooks/useEmailSettings"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"
import type { NewsCategory, NewsRegion } from "@/types/article"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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
  const { settings: emailSettings, saveSettings, loading: emailSettingsLoading } = useEmailSettings()
  const { user } = useAuth()
  const { toast } = useToast()

  // 즐겨찾기 관련 데이터 로딩 중인지 확인
  const isFavoriteLoading = keywordsLoading || emailSettingsLoading

  // 즐겨찾기 뉴스 조회 활성화 상태 (이메일 설정에서 가져옴)
  const [favoriteNewsEnabled, setFavoriteNewsEnabled] = useState<boolean>(
    emailSettings?.favorite_news_enabled ?? true
  )

  // emailSettings 변경 시 로컬 상태 동기화
  useEffect(() => {
    if (emailSettings) {
      setFavoriteNewsEnabled(emailSettings.favorite_news_enabled)
    }
  }, [emailSettings])

  // 선택된 키워드들 (멀티 선택 가능)
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set())

  // 즐겨찾기 ON 상태이고 구독 키워드가 있으면 모든 키워드를 자동으로 선택
  useEffect(() => {
    if (favoriteNewsEnabled && keywords && keywords.length > 0) {
      setSelectedKeywords(new Set(keywords.map(kw => kw.keyword)))
    } else {
      setSelectedKeywords(new Set())
    }
  }, [favoriteNewsEnabled, keywords])

  const [availableCategories, setAvailableCategories] = useState<Set<string> | undefined>(undefined)
  const [totalNewsCount, setTotalNewsCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)

  // 디버깅: 키워드 로딩 상태 확인
  console.log('[HomePage] Keywords:', keywords)
  console.log('[HomePage] Keywords loading:', keywordsLoading)
  console.log('[HomePage] Keywords length:', keywords?.length)

  const handleTrendingKeywordClick = (keyword: string) => {
    // 인기검색어 클릭 시 즐겨찾기 전체 해제하고 검색어 설정
    setSelectedKeywords(new Set())
    setSearchQuery(keyword)
  }

  const handleSubscribedKeywordClick = (keyword: string) => {
    // 키워드 토글 (선택/비선택)
    setSelectedKeywords(prev => {
      const newSet = new Set(prev)
      if (newSet.has(keyword)) {
        newSet.delete(keyword)
      } else {
        newSet.add(keyword)
      }
      return newSet
    })
  }

  // 별 아이콘 토글 핸들러
  const handleToggleFavoriteNews = async () => {
    if (!user) {
      toast({
        title: "⚠️ 로그인 필요",
        description: "로그인이 필요합니다.",
        variant: "destructive",
      })
      return
    }

    if (!keywords || keywords.length === 0) {
      toast({
        title: "⚠️ 키워드 없음",
        description: "구독 키워드를 먼저 추가해주세요.",
        variant: "destructive",
      })
      return
    }

    const newValue = !favoriteNewsEnabled

    // 낙관적 업데이트
    setFavoriteNewsEnabled(newValue)

    // DB 업데이트
    const success = await saveSettings({
      email: emailSettings?.email || user.email || "",
      enabled: emailSettings?.enabled ?? false,
      deliveryDays: emailSettings?.delivery_days || [1, 2, 3, 4, 5],
      deliveryHour: emailSettings?.delivery_hour || 6,
      favoriteNewsEnabled: newValue,
    })

    if (success) {
      toast({
        title: newValue ? "✅ 나의 뉴스 ON" : "✅ 나의 뉴스 OFF",
        description: newValue
          ? "구독 키워드로만 뉴스가 조회됩니다."
          : "전체 뉴스가 조회됩니다.",
      })
    } else {
      // 실패 시 원래 상태로 되돌리기
      setFavoriteNewsEnabled(!newValue)
      toast({
        title: "❌ 저장 실패",
        description: "설정 저장에 실패했습니다. 다시 시도해주세요.",
        variant: "destructive",
      })
    }
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

      {/* 데스크톱: 카테고리 + 구독 키워드 (2줄) + 인기 검색어 */}
      <div className="hidden md:block bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-2">
          <div className="flex items-start gap-3">
            {/* 왼쪽: 카테고리 */}
            <div className="shrink-0">
              <NewsCategories
                activeCategory={activeCategory}
                onCategoryChange={handleCategoryChange}
                availableCategories={availableCategories}
              />
            </div>

            {/* 구분선 */}
            <div className="h-16 w-px bg-muted-foreground/30 shrink-0" />

            {/* 중앙: 즐겨찾기 키워드 (2줄) */}
            {isFavoriteLoading ? (
              // 로딩 중 스켈레톤
              <div className="w-auto shrink-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="h-3.5 w-3.5 bg-muted rounded animate-pulse" />
                  <div className="h-3.5 w-16 bg-muted rounded animate-pulse" />
                </div>
                <div className="flex gap-1.5">
                  <div className="h-6 w-16 bg-muted rounded-full animate-pulse" />
                  <div className="h-6 w-20 bg-muted rounded-full animate-pulse" />
                  <div className="h-6 w-14 bg-muted rounded-full animate-pulse" />
                </div>
              </div>
            ) : keywords && keywords.length > 0 ? (
              <div className="w-auto shrink-0">
                {/* 첫 번째 줄: 별 아이콘 + "즐겨찾기" */}
                <div className="flex items-center gap-2 mb-1.5">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={handleToggleFavoriteNews}
                          className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          <Star
                            className={`h-3.5 w-3.5 ${favoriteNewsEnabled ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`}
                          />
                          <span className="text-sm font-semibold text-muted-foreground">즐겨찾기</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">{favoriteNewsEnabled ? '나의 뉴스 On (클릭하여 Off)' : '나의 뉴스 Off (클릭하여 On)'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                {/* 두 번째 줄: 키워드 버튼들 */}
                <div className="flex gap-1.5 flex-wrap">
                  {keywords.map((kw) => (
                    <Button
                      key={kw.id}
                      variant={selectedKeywords.has(kw.keyword) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSubscribedKeywordClick(kw.keyword)}
                      disabled={!favoriteNewsEnabled}
                      className="h-6 px-2.5 rounded-full text-xs transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {kw.keyword}
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}

            {/* 구분선 */}
            {(isFavoriteLoading || (keywords && keywords.length > 0)) && (
              <div className="h-16 w-px bg-muted-foreground/20 shrink-0" />
            )}

            {/* 오른쪽: 인기 검색어 */}
            <div className="flex-1 min-w-0">
              <TrendingKeywordsCompact
                onKeywordClick={handleTrendingKeywordClick}
                showNewsInfo={false}
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

          {/* 즐겨찾기 키워드 (모바일, 2줄) */}
          {isFavoriteLoading ? (
            // 로딩 중 스켈레톤
            <div className="mt-2 pb-1 space-y-1">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 bg-muted rounded animate-pulse" />
                <div className="h-3.5 w-14 bg-muted rounded animate-pulse" />
                <div className="h-3 w-20 bg-muted rounded animate-pulse" />
              </div>
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                <div className="h-6 w-14 bg-muted rounded-full animate-pulse shrink-0" />
                <div className="h-6 w-16 bg-muted rounded-full animate-pulse shrink-0" />
                <div className="h-6 w-12 bg-muted rounded-full animate-pulse shrink-0" />
              </div>
            </div>
          ) : keywords && keywords.length > 0 ? (
            <div className="mt-2 pb-1 space-y-1">
              {/* 첫 번째 줄: 별 아이콘 + "즐겨찾기" */}
              <button
                onClick={handleToggleFavoriteNews}
                className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
              >
                <Star
                  className={`h-3 w-3 ${favoriteNewsEnabled ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`}
                />
                <span className="text-sm font-semibold text-muted-foreground">즐겨찾기</span>
                <span className="text-[10px] text-muted-foreground">
                  ({favoriteNewsEnabled ? '나의 뉴스 On' : '나의 뉴스 Off'})
                </span>
              </button>
              {/* 두 번째 줄: 키워드 버튼들 */}
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                {keywords.map((kw) => (
                  <Button
                    key={kw.id}
                    variant={selectedKeywords.has(kw.keyword) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSubscribedKeywordClick(kw.keyword)}
                    disabled={!favoriteNewsEnabled}
                    className="h-6 px-2.5 rounded-full text-xs whitespace-nowrap shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {kw.keyword}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* 모바일: 인기 검색어 (총 뉴스/페이지 포함) */}
      <div className="md:hidden bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <TrendingKeywordsCompact
            onKeywordClick={handleTrendingKeywordClick}
            showNewsInfo={false}
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
          favoriteKeywords={Array.from(selectedKeywords)}
          readyToFetch={!isFavoriteLoading}
          onAvailableCategoriesChange={setAvailableCategories}
          onTotalCountChange={setTotalNewsCount}
          onPageChange={setCurrentPage}
          onTotalPagesChange={setTotalPages}
        />
      </main>



      {/* 오른쪽 고정 사이드바: 최근 본 기사 (데스크톱만) */}
      <div className="hidden md:block">
        <RecentArticlesSidebar
          totalNewsCount={totalNewsCount}
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </div>

      <Footer />
    </div>
  )
}
