import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"

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

    const { data, error } = await supabaseServer
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

    // 키워드 정규화 (공백 제거)
    const normalizedKeyword = keyword.trim()

    if (!normalizedKeyword) {
      return NextResponse.json({ error: "Keyword cannot be empty" }, { status: 400 })
    }

    // 기존 키워드 개수 확인 (최대 3개)
    const { data: existingKeywords, error: countError } = await supabaseServer
      .from("subscribed_keywords")
      .select("id")
      .eq("user_id", userId)

    if (countError) {
      console.error("[Keywords] Count error:", countError)
      return NextResponse.json({ error: "Failed to check keyword count" }, { status: 500 })
    }

    if (existingKeywords && existingKeywords.length >= 3) {
      return NextResponse.json({ error: "Maximum 3 keywords allowed" }, { status: 400 })
    }

    const { data, error } = await supabaseServer
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
      console.error("[Keywords] Insert error:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      return NextResponse.json({
        error: "Failed to add keyword",
        details: error.message
      }, { status: 500 })
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

    const { error } = await supabaseServer
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
