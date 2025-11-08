import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/client"

/**
 * 한글, 영문, 숫자, 공백만 남기고 나머지 문자 제거
 */
function sanitizeKeyword(keyword: string): string {
  // 한글/영문/숫자만 남기고 모든 공백 제거
  return keyword.replace(/[^ㄱ-ㅎㅏ-ㅣ가-힣a-zA-Z0-9\s]/g, "").replace(/\s+/g, "").trim()
}

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
 * 검색 키워드 통계 추적 API
 * - 1시간 내 동일 키워드가 있으면 카운트 증가
 * - 1시간 지났으면 새 레코드 생성
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, keyword } = await request.json()

    if (!keyword || keyword.trim().length === 0) {
      return NextResponse.json({ error: "Keyword is required" }, { status: 400 })
    }

    // 사용자 ID (비로그인은 'Anonymous')
    const effectiveUserId = userId || "Anonymous"

    // 1. 키워드 정규화 (한글, 영문, 숫자만 유지)
    const sanitizedKeyword = sanitizeKeyword(keyword)

    if (sanitizedKeyword.length === 0) {
      return NextResponse.json({ error: "Invalid keyword (no valid characters)" }, { status: 400 })
    }

    // 2. 키워드 기록 (1시간 기준 로직)
    await recordSearchKeyword(effectiveUserId, sanitizedKeyword)

    return NextResponse.json({ success: true, keyword: sanitizedKeyword })
  } catch (error) {
    console.error("[Analytics] Search keyword tracking error:", error)
    return NextResponse.json({ error: "Failed to track search keyword" }, { status: 500 })
  }
}

/**
 * 검색 키워드 통계 기록
 * - created_at 기준 1시간 내 동일 키워드(정규화 기준)가 있으면 카운트 증가
 * - 1시간 지났거나 없으면 새 레코드 생성
 * @param userId 사용자 UID (비로그인은 'Anonymous')
 * @param keyword 검색 키워드
 */
async function recordSearchKeyword(userId: string, keyword: string) {
  try {
    const trimmedKeyword = keyword.trim()
    const normalizedKeyword = normalizeKeywordForGrouping(trimmedKeyword)

    // 1시간 전 시각 계산
    const oneHourAgo = new Date()
    oneHourAgo.setHours(oneHourAgo.getHours() - 1)

    // created_at 기준 1시간 내에 생성된 모든 키워드 조회 (user_id 기준)
    const { data: recentRecords } = await supabase
      .from("search_keyword_analytics")
      .select("*")
      .eq("user_id", userId)
      .gte("created_at", oneHourAgo.toISOString())

    // 정규화된 키워드가 일치하는 1시간 내 레코드 찾기
    const existing = recentRecords?.find(
      (record) => normalizeKeywordForGrouping(record.keyword) === normalizedKeyword
    )

    if (existing) {
      // 1시간 내 동일 키워드가 있으면 카운트 증가
      const { error } = await supabase
        .from("search_keyword_analytics")
        .update({
          search_count: existing.search_count + 1,
          // last_searched_at은 트리거에서 자동 업데이트
        })
        .eq("id", existing.id)

      if (error) {
        console.error("[Analytics] Failed to update search keyword count:", error)
      }
    } else {
      // 1시간 지났거나 없으면 새 레코드 생성
      const { error } = await supabase.from("search_keyword_analytics").insert({
        user_id: userId,
        keyword: trimmedKeyword,
        search_count: 1,
      })

      if (error) {
        console.error("[Analytics] Failed to insert search keyword record:", error)
      }
    }
  } catch (error) {
    console.error("[Analytics] Error recording search keyword:", error)
  }
}
