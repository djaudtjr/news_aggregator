import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/client"

export async function POST(request: NextRequest) {
  try {
    const { title, description, link, apiKey, newsId, userId, category } = await request.json()

    console.log("[v0] Summarize request received")

    if (!link) {
      return NextResponse.json({ error: "Link is required" }, { status: 400 })
    }

    if (!newsId) {
      return NextResponse.json({ error: "News ID is required" }, { status: 400 })
    }

    // 사용자 ID (비로그인은 'Anonymous')
    const effectiveUserId = userId || "Anonymous"

    // 1. DB에서 기존 요약 확인
    try {
      const { data: existingSummary, error: dbError } = await supabase
        .from("news_summaries")
        .select("*")
        .eq("news_id", newsId)
        .single()

      // 기존 요약이 있고, summary가 비어있지 않은 경우에만 캐시 사용
      if (existingSummary && !dbError && existingSummary.summary && existingSummary.summary.trim() !== "") {
        console.log(`[v0] Found existing summary in DB for newsId: ${newsId}`)

        // 조회수 증가
        await supabase
          .from("news_summaries")
          .update({ view_count: (existingSummary.view_count || 0) + 1 })
          .eq("news_id", newsId)

        // 사용자별 통계 기록 (UPSERT)
        await recordSummaryRequest(effectiveUserId, newsId)

        return NextResponse.json({
          summary: existingSummary.summary,
          keyPoints: existingSummary.key_points,
          fromCache: true,
          viewCount: existingSummary.view_count + 1,
        })
      }
    } catch (error) {
      console.log("[v0] DB check error (continuing with new summary):", error)
    }

    // 2. 뉴스 전문 크롤링
    console.log("[v0] Crawling article content from:", link)
    let fullContent = ""

    try {
      const crawlResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/crawl`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: link }),
      })

      if (crawlResponse.ok) {
        const crawlData = await crawlResponse.json()
        fullContent = crawlData.content || ""
        console.log(`[v0] Crawled ${fullContent.length} characters`)
      } else {
        console.log("[v0] Crawling failed, using title and description")
      }
    } catch (error) {
      console.log("[v0] Crawling error, using title and description:", error)
    }

    // 크롤링 실패 시 title + description 사용
    const content = fullContent || `${title}\n\n${description || ""}`

    // 3. OpenAI API로 요약 생성
    const openaiApiKey = apiKey || process.env.OPENAI_API_KEY

    if (!openaiApiKey) {
      return NextResponse.json({ error: "OpenAI API key is required" }, { status: 400 })
    }

    console.log("[v0] Calling OpenAI API for summarization")

    try {
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
              content: `당신은 뉴스 기사를 분석하는 전문가입니다.
다음 형식으로 응답해주세요:

[요약]
(3-5문장으로 핵심 내용 요약)

[핵심 포인트]
- (핵심 포인트 1)
- (핵심 포인트 2)
- (핵심 포인트 3)

규칙:
1. 핵심 내용만 간결하게 요약
2. 중요한 사실과 수치 포함
3. 객관적이고 중립적인 톤 유지
4. 300자 이내로 작성
5. 한국어로 작성`,
            },
            {
              role: "user",
              content: `다음 뉴스 기사를 분석해주세요:\n\n${content}`,
            },
          ],
          max_tokens: 800,
          temperature: 0.3,
        }),
      })

      console.log("[v0] OpenAI API response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] OpenAI API error response:", errorText)

        if (response.status === 401) {
          return NextResponse.json(
            { error: "Invalid API key. Please check your OpenAI API key in settings." },
            { status: 401 },
          )
        }

        if (response.status === 429) {
          return NextResponse.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 })
        }

        return NextResponse.json({ error: `OpenAI API error: ${response.statusText}` }, { status: response.status })
      }

      const data = await response.json()
      console.log("[v0] Summary generated successfully")

      const aiResponse = data.choices?.[0]?.message?.content || "요약을 생성할 수 없습니다."

      // 응답 파싱 (요약과 핵심 포인트 분리)
      const parts = aiResponse.split("[핵심 포인트]")
      const summary = parts[0].replace("[요약]", "").trim()
      let keyPoints: string[] = []

      if (parts.length > 1) {
        const pointsText = parts[1].trim()
        keyPoints = pointsText
          .split("\n")
          .filter((line) => line.trim().startsWith("-"))
          .map((line) => line.trim().replace(/^-\s*/, ""))
      }

      // 4. DB에 저장 (AI 요약 정보만 저장, 크롤링된 전문은 저장하지 않음)
      // UPSERT 사용: 링크 클릭으로 이미 레코드가 있을 수 있음
      try {
        const { error: upsertError } = await supabase.from("news_summaries").upsert(
          {
            news_id: newsId,
            news_url: link,
            news_title: title,
            category: category || null,
            summary,
            key_points: keyPoints.length > 0 ? keyPoints : null,
            view_count: 1,
          },
          {
            onConflict: "news_id",
          },
        )

        if (upsertError) {
          console.error("[v0] Failed to save summary to DB:", upsertError)
        } else {
          console.log(`[v0] Summary saved to DB for newsId: ${newsId}`)
        }

        // 사용자별 통계 기록 (UPSERT)
        await recordSummaryRequest(effectiveUserId, newsId)
      } catch (error) {
        console.error("[v0] DB save error:", error)
      }

      return NextResponse.json({
        summary,
        keyPoints: keyPoints.length > 0 ? keyPoints : undefined,
        fromCache: false,
        viewCount: 1,
      })
    } catch (apiError: any) {
      console.error("[v0] OpenAI API error:", apiError)
      console.error("[v0] Error details:", apiError.message)

      return NextResponse.json({ error: "Failed to call OpenAI API. Please check your API key." }, { status: 500 })
    }
  } catch (error) {
    console.error("[v0] Summarization error:", error)
    if (error instanceof Error) {
      console.error("[v0] Error message:", error.message)
      console.error("[v0] Error stack:", error.stack)
    }
    return NextResponse.json({ error: "Failed to generate summary. Please try again." }, { status: 500 })
  }
}

/**
 * 사용자별 AI 요약 요청 통계 기록
 * @param userId 사용자 UID (비로그인은 'Anonymous')
 * @param newsId 뉴스 ID
 */
async function recordSummaryRequest(userId: string, newsId: string) {
  try {
    // 기존 레코드 확인
    const { data: existing } = await supabase
      .from("news_summary_analytics")
      .select("*")
      .eq("user_id", userId)
      .eq("news_id", newsId)
      .single()

    if (existing) {
      // 기존 레코드가 있으면 카운트 증가
      const { error } = await supabase
        .from("news_summary_analytics")
        .update({
          summary_request_count: existing.summary_request_count + 1,
        })
        .eq("user_id", userId)
        .eq("news_id", newsId)

      if (error) {
        console.error("[v0] Failed to update analytics:", error)
      } else {
        console.log(`[v0] Analytics updated for user ${userId}, news ${newsId}`)
      }
    } else {
      // 새 레코드 생성
      const { error } = await supabase.from("news_summary_analytics").insert({
        user_id: userId,
        news_id: newsId,
        summary_request_count: 1,
        link_click_count: 0,
      })

      if (error) {
        console.error("[v0] Failed to insert analytics:", error)
      } else {
        console.log(`[v0] Analytics created for user ${userId}, news ${newsId}`)
      }
    }
  } catch (error) {
    console.error("[v0] Error recording analytics:", error)
  }
}
