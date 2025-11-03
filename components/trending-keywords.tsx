"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { TrendingUp, Search, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"
import { format } from "date-fns"

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

interface TrendingKeywordsProps {
  onKeywordClick?: (keyword: string) => void
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

export function TrendingKeywords({ onKeywordClick }: TrendingKeywordsProps) {
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d">("24h")
  const [isDateDialogOpen, setIsDateDialogOpen] = useState(false)
  const [customDateRange, setCustomDateRange] = useState<{ startDate: Date; endDate: Date } | null>(null)
  const [startDateInput, setStartDateInput] = useState("")
  const [endDateInput, setEndDateInput] = useState("")
  const [dateError, setDateError] = useState("")

  const { data, isLoading: loading, refetch } = useQuery({
    queryKey: ['trending', timeRange, customDateRange],
    queryFn: () => fetchTrendingKeywords(timeRange, customDateRange || undefined),
    staleTime: 2 * 60 * 1000, // 2분간 fresh 상태 유지
    gcTime: 5 * 60 * 1000, // 5분간 캐시 유지
    refetchOnWindowFocus: false, // 윈도우 포커스 시 재요청 방지
    refetchOnMount: false, // 마운트 시 재요청 방지
    retry: 1, // 실패 시 1번만 재시도
  })

  // Supabase Realtime 구독
  useEffect(() => {
    let channel: RealtimeChannel | null = null

    const setupRealtimeSubscription = () => {
      console.log("[TrendingKeywords] Setting up Realtime subscription...")

      // search_keyword_analytics 테이블 변경 구독
      channel = supabase
        .channel("search_keyword_analytics_changes")
        .on(
          "postgres_changes",
          {
            event: "*", // INSERT, UPDATE, DELETE 모두 감지
            schema: "public",
            table: "search_keyword_analytics",
          },
          (payload) => {
            console.log("[TrendingKeywords] Realtime update received:", payload)

            // 테이블 변경 감지시 인기 검색어 목록 즉시 업데이트
            refetch()
          }
        )
        .subscribe((status) => {
          console.log("[TrendingKeywords] Subscription status:", status)
        })
    }

    setupRealtimeSubscription()

    // Cleanup: 컴포넌트 언마운트시 구독 해제
    return () => {
      if (channel) {
        console.log("[TrendingKeywords] Unsubscribing from Realtime...")
        supabase.removeChannel(channel)
      }
    }
  }, [refetch]) // refetch가 변경될 때만 재구독

  const handleKeywordClick = async (keyword: string) => {
    // 1. 먼저 검색 실행 (사용자에게 빠르게 결과 표시)
    if (onKeywordClick) {
      onKeywordClick(keyword)
    }

    // 2. 검색 키워드 통계 기록 (백그라운드로 비동기 실행)
    // Realtime 구독이 자동으로 업데이트를 처리하므로 별도 refetch 불필요
    try {
      await fetch("/api/analytics/search-keyword", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: null, // 인기 검색어 클릭은 익명으로 기록
          keyword: keyword.trim(),
        }),
      })
      // DB 업데이트시 Realtime으로 자동 감지되어 refetch됨
    } catch (error) {
      // 통계 추적 실패해도 검색에는 영향 없음
      console.error("Failed to track trending keyword click:", error)
    }
  }

  const getTimeRangeLabel = (range: string) => {
    switch (range) {
      case "1h":
        return "최근 1시간"
      case "24h":
        return "오늘"
      case "7d":
        return "이번 주"
      case "custom":
        return "커스텀 기간"
      default:
        return "오늘"
    }
  }

  const handleApplyCustomDates = () => {
    setDateError("")

    // 날짜 형식 검증
    if (!startDateInput || !endDateInput) {
      setDateError("시작일과 종료일을 모두 입력해주세요.")
      return
    }

    const startDate = new Date(startDateInput)
    const endDate = new Date(endDateInput)

    // 유효한 날짜인지 확인
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      setDateError("올바른 날짜 형식이 아닙니다.")
      return
    }

    // 시작일이 종료일보다 늦은지 확인
    if (startDate > endDate) {
      setDateError("시작일이 종료일보다 늦을 수 없습니다.")
      return
    }

    // 최대 91일 제한 확인
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    if (daysDiff > 91) {
      setDateError("최대 91일까지만 선택할 수 있습니다.")
      return
    }

    // 미래 날짜 확인
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    if (endDate > today) {
      setDateError("미래 날짜는 선택할 수 없습니다.")
      return
    }

    setCustomDateRange({ startDate, endDate })
    setIsDateDialogOpen(false)
    setDateError("")
  }

  const handleResetToPreset = (preset: "1h" | "24h" | "7d") => {
    setTimeRange(preset)
    setCustomDateRange(null)
    setStartDateInput("")
    setEndDateInput("")
    setDateError("")
  }

  if (loading) {
    return (
      <Card className="rounded-2xl shadow-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <CardTitle>인기 검색어</CardTitle>
          </div>
          <CardDescription>지금 많이 검색되는 키워드</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (!data || data.keywords.length === 0) {
    return (
      <Card className="rounded-2xl shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              <CardTitle>인기 검색어</CardTitle>
            </div>
            <Dialog open={isDateDialogOpen} onOpenChange={setIsDateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" title="기간 설정" className="rounded-full transition-all duration-300 hover:scale-110">
                  <Clock className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] rounded-2xl shadow-2xl">
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
                        className="w-full px-3 py-2 border border-input bg-background rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-sm"
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
                        className="w-full px-3 py-2 border border-input bg-background rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-sm"
                      />
                    </div>
                  </div>

                  {dateError && (
                    <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-2 rounded-xl">
                      {dateError}
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    예시: 시작일 2025-07-01, 종료일 2025-10-31 (최대 91일)
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleApplyCustomDates} className="flex-1 rounded-xl transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg">
                      적용
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setIsDateDialogOpen(false)
                      setDateError("")
                    }} className="rounded-xl transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md">
                      취소
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <CardDescription>
            {customDateRange ? (
              <>
                {format(new Date(customDateRange.startDate), "yyyy.MM.dd")} ~{" "}
                {format(new Date(customDateRange.endDate), "yyyy.MM.dd")} 기간 내 검색 결과가 없습니다
              </>
            ) : (
              "최근 검색 결과가 없습니다"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={timeRange} onValueChange={(v) => handleResetToPreset(v as "1h" | "24h" | "7d")} className="mb-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="1h">1시간</TabsTrigger>
              <TabsTrigger value="24h">24시간</TabsTrigger>
              <TabsTrigger value="7d">7일</TabsTrigger>
            </TabsList>
          </Tabs>

          {customDateRange && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => handleResetToPreset("24h")} className="rounded-xl transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md">
                검색 기간 초기화
              </Button>
            </div>
          )}

          <div className="text-center py-8 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="font-medium">검색 결과가 없습니다</p>
            <p className="text-sm mt-1">선택한 기간 내 검색 데이터가 없습니다</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-2xl shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle>인기 검색어</CardTitle>
          </div>
          <Dialog open={isDateDialogOpen} onOpenChange={setIsDateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" title="기간 설정" className="rounded-full transition-all duration-300 hover:scale-110">
                <Clock className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-2xl shadow-2xl">
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
                      className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
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
                      className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    />
                  </div>
                </div>

                {dateError && (
                  <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-2 rounded-md">
                    {dateError}
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  예시: 시작일 2025-07-01, 종료일 2025-10-31 (최대 91일)
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleApplyCustomDates} className="flex-1">
                    적용
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setIsDateDialogOpen(false)
                    setDateError("")
                  }}>
                    취소
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <CardDescription>
          {data.customDateRange ? (
            <>
              {format(new Date(data.customDateRange.startDate), "yyyy.MM.dd")} ~{" "}
              {format(new Date(data.customDateRange.endDate), "yyyy.MM.dd")}
            </>
          ) : (
            <>{getTimeRangeLabel(data.timeRange)} 인기 키워드</>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={timeRange} onValueChange={(v) => handleResetToPreset(v as "1h" | "24h" | "7d")} className="mb-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="1h">1시간</TabsTrigger>
            <TabsTrigger value="24h">24시간</TabsTrigger>
            <TabsTrigger value="7d">7일</TabsTrigger>
          </TabsList>
        </Tabs>

        {customDateRange && (
          <div className="mb-4 flex items-center justify-between p-2 bg-muted rounded-xl">
            <span className="text-sm text-muted-foreground">커스텀 기간 적용 중</span>
            <Button variant="ghost" size="sm" onClick={() => handleResetToPreset("24h")} className="rounded-xl transition-all duration-300 hover:scale-105">
              기본 기간으로 돌아가기
            </Button>
          </div>
        )}

        <div className="space-y-2">
          {data.keywords.map((item, index) => (
            <Button
              key={`${item.keyword}-${index}`}
              variant="ghost"
              className="w-full justify-start h-auto py-2 px-3 hover:bg-accent rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-sm"
              onClick={() => handleKeywordClick(item.keyword)}
            >
              <div className="flex items-center gap-3 w-full">
                <Badge variant={item.rank <= 3 ? "default" : "secondary"} className="shrink-0 w-6 h-6 flex items-center justify-center p-0 rounded-full">
                  {item.rank}
                </Badge>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate">{item.keyword}</span>
                </div>
                <div className="text-xs text-muted-foreground shrink-0">{item.searchCount}회</div>
              </div>
            </Button>
          ))}
        </div>

        {data.totalSearches > 0 && (
          <div className="mt-4 pt-4 border-t text-center">
            <p className="text-xs text-muted-foreground">
              총 검색 {data.totalSearches.toLocaleString()}회
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
