"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { differenceInDays } from "date-fns"

type RecentSearch = {
  keyword: string
  search_count: number
  last_searched_at: string
}

const RANGE_OPTIONS = [
  { label: "1주일", days: 7 },
  { label: "1개월", days: 30 },
  { label: "6개월", days: 180 },
  { label: "1년", days: 365 },
]

interface KeywordTrendsChartProps {
  searches: RecentSearch[]
}

export function KeywordTrendsChart({ searches }: KeywordTrendsChartProps) {
  const [selectedRange, setSelectedRange] = useState(RANGE_OPTIONS[0].days)

  const { chartData, maxCount, totalKeywords } = useMemo(() => {
    if (!searches || searches.length === 0) {
      return { chartData: [], maxCount: 1, totalKeywords: 0 }
    }

    const now = new Date()
    const filtered = searches.filter((item) => {
      const searchedAt = new Date(item.last_searched_at)
      const diffDays = differenceInDays(now, searchedAt)
      return diffDays <= selectedRange
    })

    const aggregated = filtered.reduce<Map<string, { keyword: string; count: number; last: Date }>>((acc, curr) => {
      const existing = acc.get(curr.keyword)
      const searchedAt = new Date(curr.last_searched_at)

      if (existing) {
        existing.count += curr.search_count
        if (searchedAt > existing.last) {
          existing.last = searchedAt
        }
      } else {
        acc.set(curr.keyword, {
          keyword: curr.keyword,
          count: curr.search_count,
          last: searchedAt,
        })
      }

      return acc
    }, new Map())

    const sorted = Array.from(aggregated.values())
      .map((item) => ({ keyword: item.keyword, count: item.count }))
      .filter((item) => item.count >= 2)
      .sort((a, b) => b.count - a.count)

    const grouped: { count: number; keywords: string[] }[] = []
    sorted.forEach((item) => {
      const lastGroup = grouped[grouped.length - 1]
      if (lastGroup && lastGroup.count === item.count) {
        lastGroup.keywords.push(item.keyword)
      } else {
        grouped.push({ count: item.count, keywords: [item.keyword] })
      }
    })

    const max = grouped[0]?.count ?? 1

    return {
      chartData: grouped,
      maxCount: max,
      totalKeywords: sorted.length,
    }
  }, [searches, selectedRange])

  return (
    <div className="mt-1 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {RANGE_OPTIONS.map((option) => (
            <Button
              key={option.days}
              variant={selectedRange === option.days ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedRange(option.days)}
              className="h-8 rounded-full px-3 text-xs"
            >
              {option.label}
            </Button>
          ))}
        </div>
        {totalKeywords > 0 && (
          <div className="flex flex-col text-xs text-muted-foreground gap-1 sm:flex-row sm:items-center">
            <span>총 {totalKeywords}개 키워드</span>
            <span className="hidden sm:inline">|</span>
            <span className="text-[11px] text-muted-foreground/80">
              2회 이상 검색한 키워드만 집계됩니다.
            </span>
          </div>
        )}
      </div>

      {chartData.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">선택한 기간의 검색 기록이 없습니다</p>
      ) : (
        <div className="space-y-2">
          {chartData.map((item, idx) => {
            const widthPercent =
              item.count === 0
                ? 0
                : Math.min(100, Math.max(6, Math.round((item.count / maxCount) * 100)))
            const label = item.keywords.join(", ")

            return (
              <div key={`${item.count}-${idx}`} className="space-y-1 rounded-lg border border-border/60 bg-muted/10 p-3">
                <div className="flex items-center justify-between gap-2 text-xs font-semibold">
                  <span className="truncate">{label}</span>
                  <span className="text-muted-foreground">{item.count}회</span>
                </div>
                <div className="h-2 rounded-full bg-muted/60">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary via-primary/80 to-primary/60 transition-all"
                    style={{ width: `${widthPercent}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
