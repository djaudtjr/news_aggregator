import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/client"

/**
 * 인기 검색어 조회 API
 * 최근 24시간 동안 가장 많이 검색된 키워드를 반환
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

    // 인기 검색어 조회
    const { data, error } = await supabase
      .from("search_keyword_analytics")
      .select("keyword, search_count")
      .gte("last_searched_at", cutoffDate.toISOString())
      .order("search_count", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("[Trending] Database error:", error)
      return NextResponse.json({ error: "Failed to fetch trending keywords" }, { status: 500 })
    }

    // 전체 검색 횟수 계산
    const totalSearches = data.reduce((sum, item) => sum + item.search_count, 0)

    // 검색어 데이터 가공
    const trendingKeywords = data.map((item, index) => ({
      keyword: item.keyword,
      searchCount: item.search_count,
      rank: index + 1,
      percentage: totalSearches > 0 ? Math.round((item.search_count / totalSearches) * 100) : 0,
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
