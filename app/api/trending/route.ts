import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/client"

/**
 * 키워드 정규화 (집계용)
 * - 공백 제거
 * - 영문 대문자로 변환
 */
function normalizeKeywordForGrouping(keyword: string): string {
  return keyword
    .replace(/\s+/g, "") // 모든 공백 제거
    .toUpperCase() // 영문 대문자 변환
}

/**
 * 특정 기간의 검색어 데이터 조회
 */
async function fetchKeywordsForTimeRange(cutoffDate: Date, limit: number) {
  const { data, error } = await supabase
    .from("search_keyword_analytics")
    .select("keyword, search_count")
    .eq("keyword_source", "user_input")
    .gte("last_searched_at", cutoffDate.toISOString())

  if (error) {
    throw error
  }

  // 정규화된 키워드로 그룹핑
  const groupedMap = new Map<string, { keyword: string; searchCount: number }>()

  for (const item of data) {
    const normalizedKey = normalizeKeywordForGrouping(item.keyword)
    const existing = groupedMap.get(normalizedKey)

    if (existing) {
      // 기존 그룹에 카운트 합산
      existing.searchCount += item.search_count
    } else {
      // 새로운 그룹 생성 (DB에 저장된 원본 키워드 사용)
      groupedMap.set(normalizedKey, {
        keyword: item.keyword,
        searchCount: item.search_count,
      })
    }
  }

  // Map을 배열로 변환하고 검색 횟수 기준 정렬
  return Array.from(groupedMap.values())
    .sort((a, b) => b.searchCount - a.searchCount)
    .slice(0, limit)
}

/**
 * 인기 검색어 조회 API
 * 폴백 로직: 1h -> 24h -> 7d -> 빈 결과
 * 정규화된 키워드로 그룹핑하여 중복 제거
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get("limit") || "10")
    const requestedTimeRange = searchParams.get("timeRange") || "24h"
    const customStartDate = searchParams.get("startDate")
    const customEndDate = searchParams.get("endDate")

    const now = new Date()
    let sortedKeywords: { keyword: string; searchCount: number }[] = []
    let actualTimeRange = requestedTimeRange
    let cutoffDate: Date

    // 커스텀 날짜 범위가 지정된 경우
    if (customStartDate && customEndDate) {
      const startDate = new Date(customStartDate)
      const endDate = new Date(customEndDate)

      // 최대 91일 제한
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      if (daysDiff > 91) {
        return NextResponse.json({ error: "Date range cannot exceed 91 days" }, { status: 400 })
      }

      const { data, error } = await supabase
        .from("search_keyword_analytics")
        .select("keyword, search_count")
        .eq("keyword_source", "user_input")
        .gte("last_searched_at", startDate.toISOString())
        .lte("last_searched_at", endDate.toISOString())

      if (error) {
        console.error("[Trending] Database error:", error)
        return NextResponse.json({ error: "Failed to fetch trending keywords" }, { status: 500 })
      }

      // 정규화된 키워드로 그룹핑
      const groupedMap = new Map<string, { keyword: string; searchCount: number }>()

      for (const item of data) {
        const normalizedKey = normalizeKeywordForGrouping(item.keyword)
        const existing = groupedMap.get(normalizedKey)

        if (existing) {
          existing.searchCount += item.search_count
        } else {
          groupedMap.set(normalizedKey, {
            keyword: item.keyword,
            searchCount: item.search_count,
          })
        }
      }

      sortedKeywords = Array.from(groupedMap.values())
        .sort((a, b) => b.searchCount - a.searchCount)
        .slice(0, limit)

      const totalSearches = sortedKeywords.reduce((sum, item) => sum + item.searchCount, 0)
      const trendingKeywords = sortedKeywords.map((item, index) => ({
        keyword: item.keyword,
        searchCount: item.searchCount,
        rank: index + 1,
        percentage: totalSearches > 0 ? Math.round((item.searchCount / totalSearches) * 100) : 0,
      }))

      return NextResponse.json({
        keywords: trendingKeywords,
        totalSearches,
        timeRange: "custom",
        customDateRange: { startDate: customStartDate, endDate: customEndDate },
        generatedAt: new Date().toISOString(),
      })
    }

    // 폴백 로직: 1h -> 24h -> 7d
    const timeRanges: Array<{ range: string; hours?: number; days?: number }> = []

    if (requestedTimeRange === "1h") {
      timeRanges.push(
        { range: "1h", hours: 1 },
        { range: "24h", hours: 24 },
        { range: "7d", days: 7 }
      )
    } else if (requestedTimeRange === "24h") {
      timeRanges.push(
        { range: "24h", hours: 24 },
        { range: "7d", days: 7 }
      )
    } else if (requestedTimeRange === "7d") {
      timeRanges.push(
        { range: "7d", days: 7 }
      )
    } else {
      // 기본값
      timeRanges.push({ range: "24h", hours: 24 })
    }

    // 폴백 시도
    for (const timeRangeConfig of timeRanges) {
      cutoffDate = new Date(now)

      if (timeRangeConfig.hours !== undefined) {
        cutoffDate.setHours(now.getHours() - timeRangeConfig.hours)
      } else if (timeRangeConfig.days !== undefined) {
        cutoffDate.setDate(now.getDate() - timeRangeConfig.days)
      }

      try {
        sortedKeywords = await fetchKeywordsForTimeRange(cutoffDate, limit)

        if (sortedKeywords.length > 0) {
          actualTimeRange = timeRangeConfig.range
          break
        }
      } catch (error) {
        console.error(`[Trending] Error fetching ${timeRangeConfig.range}:`, error)
        // 에러가 발생해도 다음 폴백 시도
        continue
      }
    }

    // 전체 검색 횟수 계산
    const totalSearches = sortedKeywords.reduce((sum, item) => sum + item.searchCount, 0)

    // 검색어 데이터 가공
    const trendingKeywords = sortedKeywords.map((item, index) => ({
      keyword: item.keyword,
      searchCount: item.searchCount,
      rank: index + 1,
      percentage: totalSearches > 0 ? Math.round((item.searchCount / totalSearches) * 100) : 0,
    }))

    return NextResponse.json({
      keywords: trendingKeywords,
      totalSearches,
      timeRange: actualTimeRange,
      requestedTimeRange,
      fallbackApplied: actualTimeRange !== requestedTimeRange,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[Trending] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
