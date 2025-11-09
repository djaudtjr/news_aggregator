import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/client"

/**
 * 뉴스 조회수 증가 API
 * POST /api/news/view
 *
 * 원문 보기 클릭 시 view_count를 증가시킵니다.
 * news_summaries 테이블에 레코드가 없으면 생성하고, 있으면 view_count만 증가시킵니다.
 */
export async function POST(request: NextRequest) {
  try {
    const { newsId, title, link } = await request.json()

    if (!newsId) {
      return NextResponse.json({ error: "News ID is required" }, { status: 400 })
    }

    console.log(`[View] Incrementing view count for newsId: ${newsId}`)

    // 1. 기존 레코드 확인
    const { data: existingRecord, error: selectError } = await supabase
      .from("news_summaries")
      .select("*")
      .eq("news_id", newsId)
      .single()

    if (existingRecord && !selectError) {
      // 기존 레코드가 있으면 view_count만 증가
      const { error: updateError } = await supabase
        .from("news_summaries")
        .update({
          view_count: (existingRecord.view_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq("news_id", newsId)

      if (updateError) {
        console.error("[View] Failed to update view count:", updateError)
        return NextResponse.json({ error: "Failed to update view count" }, { status: 500 })
      }

      console.log(`[View] Updated view count to ${(existingRecord.view_count || 0) + 1}`)

      return NextResponse.json({
        success: true,
        viewCount: (existingRecord.view_count || 0) + 1
      })
    } else {
      // 레코드가 없으면 새로 생성 (view_count = 1)
      const { error: insertError } = await supabase
        .from("news_summaries")
        .insert({
          news_id: newsId,
          title: title || "",
          link: link || "",
          view_count: 1,
          summary: null,
          key_points: null,
          category: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (insertError) {
        console.error("[View] Failed to create view record:", insertError)
        return NextResponse.json({ error: "Failed to create view record" }, { status: 500 })
      }

      console.log(`[View] Created new record with view count 1`)

      return NextResponse.json({
        success: true,
        viewCount: 1
      })
    }
  } catch (error) {
    console.error("[View] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
