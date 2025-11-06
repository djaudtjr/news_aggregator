"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { Clock, Newspaper } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

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

interface TrendingKeywordsCompactProps {
  onKeywordClick?: (keyword: string) => void
  totalNewsCount?: number
  currentPage?: number
  totalPages?: number
  showNewsInfo?: boolean // 총 뉴스 개수 표시 여부
  isMobile?: boolean // 모바일 레이아웃 여부
}

async function fetchTrendingKeywords(timeRange: string): Promise<TrendingResponse> {
  const url = `/api/trending?limit=7&timeRange=${timeRange}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error("Failed to fetch trending keywords")
  }
  return response.json()
}

export function TrendingKeywordsCompact({ onKeywordClick, totalNewsCount, currentPage, totalPages, showNewsInfo = true, isMobile = false }: TrendingKeywordsCompactProps) {
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d">("24h")

  const { data, isLoading: loading, refetch } = useQuery({
    queryKey: ['trending', timeRange],
    queryFn: () => fetchTrendingKeywords(timeRange),
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

  return (
    <div className="space-y-2 md:min-w-[400px] w-full">
      {/* 첫째 줄: 제목 + 기간 선택 + 뉴스 개수 */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* 제목 */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold"><span className="hidden md:inline">🔥 </span>인기검색어</span>
            <Badge variant="destructive" className="hidden md:flex h-4 px-1.5 text-[10px] animate-pulse">LIVE</Badge>
          </div>

          {/* 기간 선택 - 모바일: 드롭다운, 데스크톱: 버튼 */}
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">기간:</span>

            {/* 모바일: Select 드롭다운 */}
            <Select value={timeRange} onValueChange={(value) => setTimeRange(value as "1h" | "24h" | "7d")}>
              <SelectTrigger className="md:hidden h-6 w-[88px] text-xs rounded-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="1h">{getTimeRangeLabel("1h")}</SelectItem>
                <SelectItem value="24h">{getTimeRangeLabel("24h")}</SelectItem>
                <SelectItem value="7d">{getTimeRangeLabel("7d")}</SelectItem>
              </SelectContent>
            </Select>

            {/* 데스크톱: 버튼 */}
            <div className="hidden md:flex items-center gap-1.5">
              {(["1h", "24h", "7d"] as const).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                  className="h-6 px-2 text-xs rounded-full"
                >
                  {getTimeRangeLabel(range)}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* 총 뉴스 개수 - showNewsInfo가 true일 때만 표시 (한 줄) */}
        {showNewsInfo && totalNewsCount !== undefined && (
          <div className={`flex items-center gap-2 text-xs text-muted-foreground ${isMobile ? 'bg-transparent' : 'bg-muted px-3 py-1 rounded-full'}`}>
            <div className="flex items-center gap-1">
              <Newspaper className="h-3 w-3" />
              <span className="font-medium">{isMobile ? '' : '총 '}{totalNewsCount.toLocaleString()}</span>
            </div>
            {/* 페이지 정보 - 같은 줄에 */}
            {currentPage !== undefined && totalPages !== undefined && totalPages > 0 && (
              <>
                <span className="text-muted-foreground/50">|</span>
                <span className="font-medium">Page {currentPage}/{totalPages}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* 둘째 줄: 검색어 목록 (모바일에서만 최대 2줄) */}
      <div className="flex flex-wrap gap-2 overflow-hidden max-h-16 md:max-h-none">
        {loading ? (
          Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-7 w-20 bg-muted animate-pulse rounded-full" />
          ))
        ) : !data || data.keywords.length === 0 ? (
          <p className="text-xs text-muted-foreground">검색 결과가 없습니다</p>
        ) : (
          data.keywords.map((item, index) => (
            <Button
              key={`${item.keyword}-${index}`}
              variant="outline"
              size="sm"
              className="h-7 px-3 rounded-full hover:scale-105 transition-all duration-200 group"
              onClick={() => handleKeywordClick(item.keyword)}
            >
              <Badge
                variant={item.rank <= 3 ? "default" : "secondary"}
                className="h-4 w-4 flex items-center justify-center p-0 rounded-full text-[10px] mr-1"
              >
                {item.rank}
              </Badge>
              <span className="text-xs whitespace-nowrap">{item.keyword}</span>
              <span className="text-[10px] text-muted-foreground ml-1 opacity-70 group-hover:opacity-100">
                {item.searchCount}
              </span>
            </Button>
          ))
        )}
      </div>
    </div>
  )
}
