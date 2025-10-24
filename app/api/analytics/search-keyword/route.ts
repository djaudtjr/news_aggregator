import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/client"

/**
 * 검색 키워드 통계 추적 API
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, keyword } = await request.json()

    if (!keyword || keyword.trim().length === 0) {
      return NextResponse.json({ error: "Keyword is required" }, { status: 400 })
    }

    // 사용자 ID (비로그인은 'Anonymous')
    const effectiveUserId = userId || "Anonymous"

    // 키워드 정규화 (앞뒤 공백 제거, 소문자 변환)
    const normalizedKeyword = keyword.trim().toLowerCase()

    // 검색 키워드 기록
    await recordSearchKeyword(effectiveUserId, normalizedKeyword)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Analytics] Search keyword tracking error:", error)
    return NextResponse.json({ error: "Failed to track search keyword" }, { status: 500 })
  }
}

/**
 * 검색 키워드 통계 기록
 * @param userId 사용자 UID (비로그인은 'Anonymous')
 * @param keyword 검색 키워드
 */
async function recordSearchKeyword(userId: string, keyword: string) {
  try {
    // 기존 레코드 확인
    const { data: existing } = await supabase
      .from("search_keyword_analytics")
      .select("*")
      .eq("user_id", userId)
      .eq("keyword", keyword)
      .single()

    if (existing) {
      // 기존 레코드가 있으면 검색 카운트 증가
      const { error } = await supabase
        .from("search_keyword_analytics")
        .update({
          search_count: existing.search_count + 1,
          // last_searched_at은 트리거에서 자동 업데이트
        })
        .eq("user_id", userId)
        .eq("keyword", keyword)

      if (error) {
        console.error("[Analytics] Failed to update search keyword count:", error)
      } else {
        console.log(`[Analytics] Search keyword recorded for user ${userId}, keyword: "${keyword}"`)
      }
    } else {
      // 새 레코드 생성
      const { error } = await supabase.from("search_keyword_analytics").insert({
        user_id: userId,
        keyword: keyword,
        search_count: 1,
      })

      if (error) {
        console.error("[Analytics] Failed to insert search keyword record:", error)
      } else {
        console.log(`[Analytics] Search keyword record created for user ${userId}, keyword: "${keyword}"`)
      }
    }
  } catch (error) {
    console.error("[Analytics] Error recording search keyword:", error)
  }
}
