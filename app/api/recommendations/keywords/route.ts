import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/client"

/**
 * 키워드 정규화 (집계용)
 * - 공백 제거
 * - 영문 대문자로 변환
 */
function normalizeKeywordForGrouping(keyword: string): string {
  return keyword
    .replace(/\s+/g, "") // 모든 공백 제거
    .toUpperCase() // 영문 대문자 변환
}

/**
 * 개인화된 키워드 추천 API
 * 사용자가 아직 구독하지 않은 인기 키워드를 추천
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")
    const limit = parseInt(searchParams.get("limit") || "5")

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    // 1. 사용자가 현재 구독 중인 키워드 조회
    const { data: subscribedKeywords, error: subscribedError } = await supabase
      .from("subscribed_keywords")
      .select("keyword")
      .eq("user_id", userId)

    if (subscribedError) {
      console.error("[Keyword Recommendations] Error fetching subscribed keywords:", subscribedError)
      return NextResponse.json({ error: "Failed to fetch subscribed keywords" }, { status: 500 })
    }

    // 정규화된 구독 키워드 Set 생성
    const subscribedKeywordsSet = new Set(
      (subscribedKeywords || []).map((item) => normalizeKeywordForGrouping(item.keyword))
    )

    // 2. 모든 구독 키워드 조회 (인기도 집계용)
    const { data: allSubscriptions, error: allError } = await supabase
      .from("subscribed_keywords")
      .select("keyword")

    if (allError) {
      console.error("[Keyword Recommendations] Error fetching all subscriptions:", allError)
      return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 })
    }

    if (!allSubscriptions || allSubscriptions.length === 0) {
      return NextResponse.json({
        recommendations: [],
        totalKeywords: 0,
        generatedAt: new Date().toISOString(),
      })
    }

    // 3. 키워드별 구독자 수 집계
    const groupedMap = new Map<string, { keyword: string; subscriberCount: number }>()

    for (const item of allSubscriptions) {
      const normalizedKey = normalizeKeywordForGrouping(item.keyword)
      const existing = groupedMap.get(normalizedKey)

      if (existing) {
        existing.subscriberCount += 1
      } else {
        groupedMap.set(normalizedKey, {
          keyword: item.keyword,
          subscriberCount: 1,
        })
      }
    }

    // 4. 사용자가 구독하지 않은 키워드만 필터링
    const unsubscribedKeywords = Array.from(groupedMap.entries())
      .filter(([normalizedKey, _]) => !subscribedKeywordsSet.has(normalizedKey))
      .map(([_, value]) => value)
      .sort((a, b) => b.subscriberCount - a.subscriberCount) // 구독자 수 내림차순
      .slice(0, limit) // 상위 N개만

    // 5. 추천 데이터 가공
    const recommendations = unsubscribedKeywords.map((item, index) => ({
      keyword: item.keyword,
      subscriberCount: item.subscriberCount,
      rank: index + 1,
    }))

    return NextResponse.json({
      recommendations,
      totalKeywords: groupedMap.size,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[Keyword Recommendations] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
