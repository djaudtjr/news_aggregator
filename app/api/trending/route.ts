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
 * 인기 검색어 조회 API
 * 최근 24시간 동안 가장 많이 검색된 키워드를 반환
 * 정규화된 키워드로 그룹핑하여 중복 제거
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get("limit") || "10")
    const timeRange = searchParams.get("timeRange") || "24h" // 24h, 7d, 30d

    // 시간 범위 계산
    const now = new Date()
    let cutoffDate = new Date()

    switch (timeRange) {
      case "1h":
        cutoffDate.setHours(now.getHours() - 1)
        break
      case "24h":
        cutoffDate.setHours(now.getHours() - 24)
        break
      case "7d":
        cutoffDate.setDate(now.getDate() - 7)
        break
      case "30d":
        cutoffDate.setDate(now.getDate() - 30)
        break
      default:
        cutoffDate.setHours(now.getHours() - 24)
    }

    // 모든 검색어 조회 (시간 범위 내)
    const { data, error } = await supabase
      .from("search_keyword_analytics")
      .select("keyword, search_count")
      .gte("last_searched_at", cutoffDate.toISOString())

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
    const sortedKeywords = Array.from(groupedMap.values())
      .sort((a, b) => b.searchCount - a.searchCount)
      .slice(0, limit)

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
      timeRange,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[Trending] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
