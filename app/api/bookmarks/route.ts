import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"

/**
 * 북마크 목록 조회
 * GET /api/bookmarks?userId={userId}
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const { data, error } = await supabaseServer
      .from("bookmarks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[Bookmarks] Error:", error)
      return NextResponse.json({ error: "Failed to fetch bookmarks" }, { status: 500 })
    }

    return NextResponse.json({ bookmarks: data })
  } catch (error) {
    console.error("[Bookmarks] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * 북마크 추가
 * POST /api/bookmarks
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, articleId, title, description, link, source, imageUrl, category, region, pubDate } = body

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    if (!articleId || !title || !link) {
      return NextResponse.json({ error: "Article ID, title, and link are required" }, { status: 400 })
    }

    const { data, error } = await supabaseServer
      .from("bookmarks")
      .insert({
        user_id: userId,
        article_id: articleId,
        title,
        description,
        link,
        source,
        image_url: imageUrl,
        category,
        region,
        pub_date: pubDate,
      })
      .select()
      .single()

    if (error) {
      // 중복 북마크 체크
      if (error.code === "23505") {
        return NextResponse.json({ error: "Already bookmarked" }, { status: 409 })
      }
      console.error("[Bookmarks] Insert error:", error)
      return NextResponse.json({ error: "Failed to add bookmark" }, { status: 500 })
    }

    return NextResponse.json({ bookmark: data })
  } catch (error) {
    console.error("[Bookmarks] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * 북마크 삭제
 * DELETE /api/bookmarks?userId={userId}&articleId={articleId} - 특정 북마크 삭제
 * DELETE /api/bookmarks?userId={userId}&deleteAll=true - 모든 북마크 삭제
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")
    const articleId = searchParams.get("articleId")
    const deleteAll = searchParams.get("deleteAll")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // 모든 북마크 삭제
    if (deleteAll === "true") {
      const { error } = await supabaseServer
        .from("bookmarks")
        .delete()
        .eq("user_id", userId)

      if (error) {
        console.error("[Bookmarks] Delete all error:", error)
        return NextResponse.json({ error: "Failed to delete all bookmarks" }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    // 특정 북마크 삭제
    if (!articleId) {
      return NextResponse.json({ error: "Article ID is required" }, { status: 400 })
    }

    const { error } = await supabaseServer
      .from("bookmarks")
      .delete()
      .eq("user_id", userId)
      .eq("article_id", articleId)

    if (error) {
      console.error("[Bookmarks] Delete error:", error)
      return NextResponse.json({ error: "Failed to delete bookmark" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Bookmarks] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
