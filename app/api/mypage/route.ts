import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/client"

/**
 * 사용자 마이페이지 데이터 조회 API
 * GET /api/mypage?userId={userId}
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")

    if (!userId || userId === "Anonymous") {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // 1. 사용 통계 조회
    const { data: summaryStats, error: summaryError } = await supabase
      .from("news_summary_analytics")
      .select("summary_request_count, link_click_count")
      .eq("user_id", userId)

    if (summaryError) {
      console.error("[MyPage] Summary stats error:", summaryError)
    }

    // AI 요약 총 횟수
    const totalSummaryRequests =
      summaryStats?.reduce((sum, stat) => sum + (stat.summary_request_count || 0), 0) || 0

    // 링크 클릭 총 횟수
    const totalLinkClicks = summaryStats?.reduce((sum, stat) => sum + (stat.link_click_count || 0), 0) || 0

    // 2. 검색 키워드 통계
    const { data: searchStats, error: searchError } = await supabase
      .from("search_keyword_analytics")
      .select("keyword, search_count, last_searched_at")
      .eq("user_id", userId)
      .order("last_searched_at", { ascending: false })
      .limit(10)

    if (searchError) {
      console.error("[MyPage] Search stats error:", searchError)
    }

    // 총 검색 횟수
    const totalSearches = searchStats?.reduce((sum, stat) => sum + (stat.search_count || 0), 0) || 0

    // 3. 북마크 조회 (최근 10개)
    const { data: bookmarks, error: bookmarksError } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10)

    if (bookmarksError) {
      console.error("[MyPage] Bookmarks error:", bookmarksError)
    }

    return NextResponse.json({
      stats: {
        totalSummaryRequests,
        totalLinkClicks,
        totalSearches,
        totalBookmarks: bookmarks?.length || 0,
      },
      recentSearches: searchStats || [],
      recentBookmarks: bookmarks || [],
    })
  } catch (error) {
    console.error("[MyPage] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
