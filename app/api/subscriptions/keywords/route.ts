import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/client"

/**
 * 구독 키워드 목록 조회
 * GET /api/subscriptions/keywords?userId={userId}
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("subscribed_keywords")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[Keywords] Error:", error)
      return NextResponse.json({ error: "Failed to fetch keywords" }, { status: 500 })
    }

    return NextResponse.json({ keywords: data })
  } catch (error) {
    console.error("[Keywords] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * 구독 키워드 추가
 * POST /api/subscriptions/keywords
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, keyword } = body

    if (!userId || !keyword) {
      return NextResponse.json({ error: "User ID and keyword are required" }, { status: 400 })
    }

    // 키워드 정규화 (공백 제거, 소문자 변환)
    const normalizedKeyword = keyword.trim()

    if (!normalizedKeyword) {
      return NextResponse.json({ error: "Keyword cannot be empty" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("subscribed_keywords")
      .insert({
        user_id: userId,
        keyword: normalizedKeyword,
      })
      .select()
      .single()

    if (error) {
      // 중복 키워드 체크
      if (error.code === "23505") {
        return NextResponse.json({ error: "Keyword already subscribed" }, { status: 409 })
      }
      console.error("[Keywords] Insert error:", error)
      return NextResponse.json({ error: "Failed to add keyword" }, { status: 500 })
    }

    return NextResponse.json({ keyword: data })
  } catch (error) {
    console.error("[Keywords] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * 구독 키워드 삭제
 * DELETE /api/subscriptions/keywords?userId={userId}&keywordId={keywordId}
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")
    const keywordId = searchParams.get("keywordId")

    if (!userId || !keywordId) {
      return NextResponse.json({ error: "User ID and keyword ID are required" }, { status: 400 })
    }

    const { error } = await supabase
      .from("subscribed_keywords")
      .delete()
      .eq("user_id", userId)
      .eq("id", keywordId)

    if (error) {
      console.error("[Keywords] Delete error:", error)
      return NextResponse.json({ error: "Failed to delete keyword" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Keywords] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
