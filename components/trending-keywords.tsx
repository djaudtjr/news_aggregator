"use client"

import { useEffect, useState } from "react"
import { TrendingUp, Search, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
  generatedAt: string
}

interface TrendingKeywordsProps {
  onKeywordClick?: (keyword: string) => void
}

export function TrendingKeywords({ onKeywordClick }: TrendingKeywordsProps) {
  const [data, setData] = useState<TrendingResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d">("24h")

  useEffect(() => {
    fetchTrendingKeywords()
  }, [timeRange])

  const fetchTrendingKeywords = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/trending?limit=7&timeRange=${timeRange}`)
      if (response.ok) {
        const data = await response.json()
        setData(data)
      }
    } catch (error) {
      console.error("Failed to fetch trending keywords:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleKeywordClick = (keyword: string) => {
    if (onKeywordClick) {
      onKeywordClick(keyword)
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
      default:
        return "오늘"
    }
  }

  if (loading) {
    return (
      <Card>
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
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <CardTitle>인기 검색어</CardTitle>
          </div>
          <CardDescription>아직 검색 데이터가 없습니다</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle>인기 검색어</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchTrendingKeywords} title="새로고침">
            <Clock className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>{getTimeRangeLabel(timeRange)} 인기 키워드</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as "1h" | "24h" | "7d")} className="mb-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="1h">1시간</TabsTrigger>
            <TabsTrigger value="24h">24시간</TabsTrigger>
            <TabsTrigger value="7d">7일</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-2">
          {data.keywords.map((item, index) => (
            <Button
              key={`${item.keyword}-${index}`}
              variant="ghost"
              className="w-full justify-start h-auto py-2 px-3 hover:bg-accent"
              onClick={() => handleKeywordClick(item.keyword)}
            >
              <div className="flex items-center gap-3 w-full">
                <Badge variant={item.rank <= 3 ? "default" : "secondary"} className="shrink-0 w-6 h-6 flex items-center justify-center p-0">
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
