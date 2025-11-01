import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"

/**
 * 사용자 마이페이지 데이터 조회 API
 * GET /api/mypage?userId={userId}
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    console.log("[MyPage] Fetching data for user:", userId)

    // 1. 사용 통계 조회
    const { data: summaryStats, error: summaryError } = await supabaseServer
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

    // 2. 검색 키워드 통계 - 전체 검색 횟수 (사용자 직접 입력 키워드만)
    const { data: allSearchStats, error: allSearchError } = await supabaseServer
      .from("search_keyword_analytics")
      .select("search_count")
      .eq("user_id", userId)
      .eq("keyword_source", "user_input")

    if (allSearchError) {
      console.error("[MyPage] All search stats error:", allSearchError)
    }

    // 총 검색 횟수 계산
    const totalSearches = allSearchStats?.reduce((sum, stat) => sum + (stat.search_count || 0), 0) || 0

    // 최근 검색 키워드 (사용자 직접 입력 키워드만, 페이징은 프론트엔드에서 처리)
    const { data: recentSearchStats, error: recentSearchError } = await supabaseServer
      .from("search_keyword_analytics")
      .select("keyword, search_count, last_searched_at")
      .eq("user_id", userId)
      .eq("keyword_source", "user_input")
      .order("last_searched_at", { ascending: false })

    if (recentSearchError) {
      console.error("[MyPage] Recent search stats error:", recentSearchError)
    }

    // 3. 북마크 전체 개수 조회
    const { count: bookmarkCount, error: bookmarkCountError } = await supabaseServer
      .from("bookmarks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)

    if (bookmarkCountError) {
      console.error("[MyPage] Bookmark count error:", bookmarkCountError)
    }

    // 4. 북마크 전체 조회 (페이징은 프론트엔드에서 처리)
    const { data: recentBookmarks, error: bookmarksError } = await supabaseServer
      .from("bookmarks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (bookmarksError) {
      console.error("[MyPage] Recent bookmarks error:", bookmarksError)
    }

    console.log("[MyPage] Data fetched successfully")

    return NextResponse.json({
      stats: {
        totalSummaryRequests,
        totalLinkClicks,
        totalSearches,
        totalBookmarks: bookmarkCount || 0,
      },
      recentSearches: recentSearchStats || [],
      recentBookmarks: recentBookmarks || [],
    })
  } catch (error) {
    console.error("[MyPage] Unexpected error:", error)
    return NextResponse.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
