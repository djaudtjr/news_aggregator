"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { TrendingUp, History, Search, Clock, X, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"
import { format, formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"
import { useRecentArticles, type RecentArticle } from "@/hooks/useRecentArticles"

interface TrendingKeyword {
  keyword: string
  searchCount: number
  rank: number
  percentage: number
}

interface TrendingResponse {
  keywords: TrendingKeyword[]
  totalSearches: number
  timeRange: string
  requestedTimeRange?: string
  fallbackApplied?: boolean
  customDateRange?: { startDate: string; endDate: string }
  generatedAt: string
}

interface TrendingRecentSplitProps {
  onKeywordClick?: (keyword: string) => void
  onArticleClick?: (article: RecentArticle) => void
}

async function fetchTrendingKeywords(
  timeRange: string,
  customDates?: { startDate: Date; endDate: Date }
): Promise<TrendingResponse> {
  let url = `/api/trending?limit=7&timeRange=${timeRange}`

  if (customDates) {
    url += `&startDate=${customDates.startDate.toISOString()}&endDate=${customDates.endDate.toISOString()}`
  }

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error("Failed to fetch trending keywords")
  }
  return response.json()
}

export function TrendingRecentSplit({ onKeywordClick, onArticleClick }: TrendingRecentSplitProps) {
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d">("24h")
  const [isDateDialogOpen, setIsDateDialogOpen] = useState(false)
  const [customDateRange, setCustomDateRange] = useState<{ startDate: Date; endDate: Date } | null>(null)
  const [startDateInput, setStartDateInput] = useState("")
  const [endDateInput, setEndDateInput] = useState("")
  const [dateError, setDateError] = useState("")

  const { recentArticles, removeRecentArticle, clearRecentArticles } = useRecentArticles()

  const { data, isLoading: loading, refetch } = useQuery({
    queryKey: ['trending', timeRange, customDateRange],
    queryFn: () => fetchTrendingKeywords(timeRange, customDateRange || undefined),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
  })

  // Supabase Realtime 구독
  useEffect(() => {
    let channel: RealtimeChannel | null = null

    const setupRealtimeSubscription = () => {
      channel = supabase
        .channel("search_keyword_analytics_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "search_keyword_analytics",
          },
          (payload) => {
            refetch()
          }
        )
        .subscribe()
    }

    setupRealtimeSubscription()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [refetch])

  const handleKeywordClick = async (keyword: string) => {
    if (onKeywordClick) {
      onKeywordClick(keyword)
    }

    try {
      await fetch("/api/analytics/search-keyword", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: null,
          keyword: keyword.trim(),
        }),
      })
    } catch (error) {
      console.error("Failed to track trending keyword click:", error)
    }
  }

  const getTimeRangeLabel = (range: string) => {
    switch (range) {
      case "1h":
        return "1시간"
      case "24h":
        return "24시간"
      case "7d":
        return "7일"
      default:
        return "24시간"
    }
  }

  const handleResetToPreset = (preset: "1h" | "24h" | "7d") => {
    setTimeRange(preset)
    setCustomDateRange(null)
    setStartDateInput("")
    setEndDateInput("")
    setDateError("")
  }

  const handleArticleClick = (article: RecentArticle) => {
    if (onArticleClick) {
      onArticleClick(article)
    } else {
      window.open(article.link, "_blank", "noopener,noreferrer")
    }
  }

  const handleRemove = (e: React.MouseEvent, articleId: string) => {
    e.stopPropagation()
    removeRecentArticle(articleId)
  }

  const handleClearAll = () => {
    if (confirm("최근 본 기사를 모두 삭제하시겠습니까?")) {
      clearRecentArticles()
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-3 md:gap-4">
      {/* 인기 검색어 섹션 */}
      <Card className="rounded-xl shadow-sm border-border/50">
        <CardHeader className="pb-2 md:pb-3 px-3 md:px-6 pt-3 md:pt-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm md:text-base flex items-center gap-1.5 md:gap-2">
              <span className="text-base md:text-lg">🔥</span>
              <span>인기 검색어</span>
              <Badge variant="destructive" className="h-5 px-1.5 text-xs animate-pulse ml-1">LIVE</Badge>
            </CardTitle>
            <Dialog open={isDateDialogOpen} onOpenChange={setIsDateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" title="기간 설정" className="h-8 w-8 rounded-full">
                  <Clock className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] rounded-xl">
                <DialogHeader>
                  <DialogTitle>검색 기간 설정</DialogTitle>
                  <DialogDescription>
                    인기 검색어를 조회할 기간을 입력하세요 (최대 91일)
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="start-date" className="text-sm font-medium">
                        시작일
                      </label>
                      <input
                        id="start-date"
                        type="date"
                        value={startDateInput}
                        onChange={(e) => setStartDateInput(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="end-date" className="text-sm font-medium">
                        종료일
                      </label>
                      <input
                        id="end-date"
                        type="date"
                        value={endDateInput}
                        onChange={(e) => setEndDateInput(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>

                  {dateError && (
                    <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-2 rounded-md">
                      {dateError}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={() => {/* handleApplyCustomDates */}} className="flex-1 rounded-md">
                      적용
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setIsDateDialogOpen(false)
                      setDateError("")
                    }} className="rounded-md">
                      취소
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 md:space-y-3 px-3 md:px-6 pb-3 md:pb-6">
          {/* 시간대 선택 - 모바일에서 숨김 */}
          <div className="hidden md:flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-muted-foreground">기간:</span>
            <div className="flex gap-1 flex-wrap">
              {(["1h", "24h", "7d"] as const).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range && !customDateRange ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleResetToPreset(range)}
                  className="h-6 md:h-7 px-2 md:px-3 text-xs rounded-full"
                >
                  {getTimeRangeLabel(range)}
                </Button>
              ))}
            </div>
            {customDateRange && (
              <Badge variant="secondary" className="text-xs h-6">
                {format(new Date(customDateRange.startDate), "MM.dd")} ~ {format(new Date(customDateRange.endDate), "MM.dd")}
              </Badge>
            )}
          </div>

          {/* 인기 검색어 목록 */}
          {loading ? (
            <div className="flex flex-wrap gap-1.5 md:gap-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-7 md:h-8 w-20 md:w-24 rounded-full" />
              ))}
            </div>
          ) : !data || data.keywords.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">검색 결과가 없습니다</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto -mx-1 px-1">
                <div className="flex md:flex-wrap gap-1.5 md:gap-2 pb-1 min-w-max md:min-w-0">
                  {data.keywords.map((item, index) => (
                    <Button
                      key={`${item.keyword}-${index}`}
                      variant="outline"
                      size="sm"
                      className="h-7 md:h-8 px-2 md:px-3 rounded-full hover:scale-105 transition-all duration-200 group shrink-0"
                      onClick={() => handleKeywordClick(item.keyword)}
                    >
                      <Badge
                        variant={item.rank <= 3 ? "default" : "secondary"}
                        className="h-4 w-4 md:h-5 md:w-5 flex items-center justify-center p-0 rounded-full text-xs mr-1 md:mr-1.5"
                      >
                        {item.rank}
                      </Badge>
                      <span className="text-xs md:text-sm whitespace-nowrap">{item.keyword}</span>
                      <span className="text-xs text-muted-foreground ml-1 md:ml-1.5 opacity-70 group-hover:opacity-100">
                        {item.searchCount}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
              {data.totalSearches > 0 && (
                <div className="text-center pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    총 {data.totalSearches.toLocaleString()}회 검색
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 최근 본 기사 섹션 */}
      <Card className="rounded-xl shadow-sm border-border/50">
        <CardHeader className="pb-2 md:pb-3 px-3 md:px-6 pt-3 md:pt-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm md:text-base flex items-center gap-1.5 md:gap-2">
              <span className="text-base md:text-lg">📰</span>
              <span>최근 본 기사</span>
              {recentArticles.length > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">{recentArticles.length}</Badge>
              )}
            </CardTitle>
            {recentArticles.length > 0 && (
              <Button variant="ghost" size="icon" onClick={handleClearAll} title="전체 삭제" className="h-8 w-8 rounded-full">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
          {recentArticles.length === 0 ? (
            <div className="text-center py-4 md:py-6 text-muted-foreground">
              <History className="h-6 w-6 md:h-8 md:w-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs md:text-sm">아직 본 기사가 없습니다</p>
            </div>
          ) : (
            <>
              {/* 모바일: 세로 리스트 (컴팩트) */}
              <div className="md:hidden space-y-2">
                {recentArticles.slice(0, 3).map((article) => (
                  <div
                    key={article.id}
                    className="group flex gap-2 p-2 rounded-lg border hover:bg-accent cursor-pointer transition-all duration-200"
                    onClick={() => handleArticleClick(article)}
                  >
                    {article.imageUrl && (
                      <div className="shrink-0 w-16 h-16 overflow-hidden rounded-md">
                        <img
                          src={article.imageUrl}
                          alt={article.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none"
                          }}
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-medium line-clamp-2 mb-1">{article.title}</h4>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {article.source && <span className="truncate text-xs">{article.source}</span>}
                        <span>•</span>
                        <span className="whitespace-nowrap text-xs">
                          {formatDistanceToNow(new Date(article.viewedAt), { addSuffix: true, locale: ko })}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                      onClick={(e) => handleRemove(e, article.id)}
                      title="삭제"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* 데스크탑: 가로 스크롤 카드 */}
              <div className="hidden md:block overflow-x-auto -mx-1 px-1">
                <div className="flex gap-3 pb-2 min-w-max">
                  {recentArticles.slice(0, 4).map((article) => (
                    <div
                      key={article.id}
                      className="group relative rounded-lg border hover:bg-accent cursor-pointer transition-all duration-200 hover:shadow-md shrink-0 w-[280px]"
                      onClick={() => handleArticleClick(article)}
                    >
                      {article.imageUrl && (
                        <div className="w-full h-32 overflow-hidden rounded-t-lg">
                          <img
                            src={article.imageUrl}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            onError={(e) => {
                              e.currentTarget.style.display = "none"
                            }}
                          />
                        </div>
                      )}
                      <div className="p-3">
                        <h4 className="text-sm font-medium line-clamp-2 mb-2">{article.title}</h4>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                            {article.source && <span className="truncate">{article.source}</span>}
                            <span>•</span>
                            <span className="whitespace-nowrap">
                              {formatDistanceToNow(new Date(article.viewedAt), { addSuffix: true, locale: ko })}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                            onClick={(e) => handleRemove(e, article.id)}
                            title="삭제"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
