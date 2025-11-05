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
 * - created_at 기준으로 조회 (키워드 등록 일시)
 * - 정규화된 키워드로 그룹핑하여 중복 제거
 */
async function fetchKeywordsForTimeRange(cutoffDate: Date, limit: number) {
  const { data, error } = await supabase
    .from("search_keyword_analytics")
    .select("keyword, search_count")
    .gte("created_at", cutoffDate.toISOString())

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
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())

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

    // 요청된 시간대의 데이터만 조회 (fallback 없음)
    cutoffDate = new Date(now)

    if (requestedTimeRange === "1h") {
      cutoffDate.setHours(now.getHours() - 1)
    } else if (requestedTimeRange === "7d") {
      cutoffDate.setDate(now.getDate() - 7)
    } else {
      // 기본값: 24h
      cutoffDate.setHours(now.getHours() - 24)
    }

    try {
      sortedKeywords = await fetchKeywordsForTimeRange(cutoffDate, limit)
      actualTimeRange = requestedTimeRange
    } catch (error) {
      console.error(`[Trending] Error fetching ${requestedTimeRange}:`, error)
      return NextResponse.json({ error: "Failed to fetch trending keywords" }, { status: 500 })
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
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[Trending] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
