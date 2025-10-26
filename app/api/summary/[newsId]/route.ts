import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/client"

/**
 * 기존 요약 조회 API
 * GET /api/summary/[newsId]
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ newsId: string }> }) {
  try {
    const { newsId } = await params

    // Supabase에서 기존 요약 조회
    const { data, error } = await supabase.from("news_summaries").select("*").eq("news_id", newsId).single()

    if (error) {
      if (error.code === "PGRST116") {
        // 요약이 없음
        return NextResponse.json({ summary: null }, { status: 200 })
      }
      console.error("[Summary] Database error:", error)
      return NextResponse.json({ error: "Failed to fetch summary" }, { status: 500 })
    }

    return NextResponse.json({
      summary: data.summary,
      keyPoints: data.key_points || [],
      viewCount: data.view_count,
    })
  } catch (error) {
    console.error("[Summary] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
