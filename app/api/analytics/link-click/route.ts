import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/client"

/**
 * 뉴스 링크 클릭 추적 API
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, newsId } = await request.json()

    if (!newsId) {
      return NextResponse.json({ error: "News ID is required" }, { status: 400 })
    }

    // 사용자 ID (비로그인은 'Anonymous')
    const effectiveUserId = userId || "Anonymous"

    // 링크 클릭 기록
    await recordLinkClick(effectiveUserId, newsId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Analytics] Link click tracking error:", error)
    return NextResponse.json({ error: "Failed to track link click" }, { status: 500 })
  }
}

/**
 * 뉴스 링크 클릭 통계 기록
 * @param userId 사용자 UID (비로그인은 'Anonymous')
 * @param newsId 뉴스 ID
 */
async function recordLinkClick(userId: string, newsId: string) {
  try {
    // 기존 레코드 확인
    const { data: existing } = await supabase
      .from("news_summary_analytics")
      .select("*")
      .eq("user_id", userId)
      .eq("news_id", newsId)
      .single()

    if (existing) {
      // 기존 레코드가 있으면 링크 클릭 카운트 증가
      const { error } = await supabase
        .from("news_summary_analytics")
        .update({
          link_click_count: existing.link_click_count + 1,
        })
        .eq("user_id", userId)
        .eq("news_id", newsId)

      if (error) {
        console.error("[Analytics] Failed to update link click count:", error)
      } else {
        console.log(`[Analytics] Link click recorded for user ${userId}, news ${newsId}`)
      }
    } else {
      // 새 레코드 생성 (요약 없이 링크만 클릭한 경우)
      const { error } = await supabase.from("news_summary_analytics").insert({
        user_id: userId,
        news_id: newsId,
        summary_request_count: 0,
        link_click_count: 1,
      })

      if (error) {
        console.error("[Analytics] Failed to insert link click record:", error)
      } else {
        console.log(`[Analytics] Link click record created for user ${userId}, news ${newsId}`)
      }
    }
  } catch (error) {
    console.error("[Analytics] Error recording link click:", error)
  }
}
