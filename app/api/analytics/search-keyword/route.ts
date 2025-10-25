import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/client"

/**
 * 한글, 영문, 숫자, 공백만 남기고 나머지 문자 제거
 */
function sanitizeKeyword(keyword: string): string {
  // 한글(ㄱ-ㅎ, ㅏ-ㅣ, 가-힣), 영문(a-zA-Z), 숫자(0-9), 공백만 유지
  return keyword.replace(/[^ㄱ-ㅎㅏ-ㅣ가-힣a-zA-Z0-9\s]/g, "").trim()
}

/**
 * OpenAI API를 사용하여 키워드를 단어별로 분리
 */
async function splitKeywordsByAI(keyword: string): Promise<string[]> {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY

    if (!openaiApiKey) {
      console.warn("[Analytics] OpenAI API key not found, using simple split")
      // API 키가 없으면 공백 기준 분리
      const words = keyword.split(/\s+/).filter((w) => w.length > 0)
      return [keyword, ...words]
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `당신은 검색 키워드를 의미 있는 단어로 분리하는 전문가입니다.
입력된 키워드를 원본 전체와 의미 있는 단어 단위로 분리하여 JSON 배열로 반환하세요.

규칙:
1. 첫 번째 요소는 항상 원본 키워드 전체
2. 그 다음부터는 의미 있는 단어 단위로 분리
3. 중복 제거
4. **의미 없는 키워드는 제외**: 숫자만으로 이루어진 단어, 한 글자짜리 영문자, 특수기호만 있는 단어는 제외
5. JSON 배열 형식으로만 응답 (다른 텍스트 없이)

예시:
입력: "인공지능 컴퓨터"
출력: ["인공지능 컴퓨터", "인공지능", "컴퓨터"]

입력: "machine learning algorithm"
출력: ["machine learning algorithm", "machine learning", "machine", "learning", "algorithm"]

입력: "machine learning 123"
출력: ["machine learning 123", "machine learning", "machine", "learning"]

입력: "AI 2024 news"
출력: ["ai 2024 news", "news"]`,
          },
          {
            role: "user",
            content: keyword,
          },
        ],
        max_tokens: 200,
        temperature: 0.1,
      }),
    })

    if (!response.ok) {
      console.error("[Analytics] OpenAI API error:", response.status)
      // API 호출 실패 시 공백 기준 분리
      const words = keyword.split(/\s+/).filter((w) => w.length > 0)
      return [keyword, ...words]
    }

    const data = await response.json()
    const aiResponse = data.choices?.[0]?.message?.content || "[]"

    // JSON 파싱
    const keywords = JSON.parse(aiResponse.trim()) as string[]

    // 중복 제거 및 빈 문자열 필터링
    const uniqueKeywords = Array.from(new Set(keywords)).filter((k) => k.trim().length > 0)

    console.log(`[Analytics] AI split result: ${keyword} -> ${JSON.stringify(uniqueKeywords)}`)
    return uniqueKeywords.length > 0 ? uniqueKeywords : [keyword]
  } catch (error) {
    console.error("[Analytics] Keyword splitting error:", error)
    // 에러 발생 시 공백 기준 분리
    const words = keyword.split(/\s+/).filter((w) => w.length > 0)
    return [keyword, ...words]
  }
}

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

    // 1. 키워드 정규화 (한글, 영문, 숫자만 유지)
    const sanitizedKeyword = sanitizeKeyword(keyword)

    if (sanitizedKeyword.length === 0) {
      return NextResponse.json({ error: "Invalid keyword (no valid characters)" }, { status: 400 })
    }

    // 2. OpenAI로 키워드를 단어별로 분리
    const keywords = await splitKeywordsByAI(sanitizedKeyword)

    // 3. 각 키워드를 DB에 저장
    for (const kw of keywords) {
      await recordSearchKeyword(effectiveUserId, kw.toLowerCase())
    }

    return NextResponse.json({ success: true, keywords })
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
