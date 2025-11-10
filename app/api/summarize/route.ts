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

    // 0. DB에서 활성화된 카테고리 목록 가져오기 (AI 카테고리 분류에 사용)
    let availableCategories: string[] = []
    try {
      const { data: categoriesData } = await supabase
        .from("codes")
        .select("code, label_ko")
        .eq("code_type", "news_category")
        .eq("is_active", true)
        .neq("code", "all") // "all"은 제외
        .order("display_order", { ascending: true })

      if (categoriesData && categoriesData.length > 0) {
        availableCategories = categoriesData.map((c) => `${c.code} (${c.label_ko})`)
        console.log(`[v0] Loaded ${availableCategories.length} categories for AI classification`)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch categories, using defaults:", error)
      // 기본 카테고리 사용
      availableCategories = [
        "world (세계)",
        "politics (정치)",
        "business (비즈니스)",
        "technology (기술)",
        "science (과학)",
        "health (건강)",
        "sports (스포츠)",
        "entertainment (엔터테인먼트)",
      ]
    }

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
          category: existingSummary.category,
          fromCache: true,
          viewCount: existingSummary.view_count + 1,
        })
      }
    } catch (error) {
      console.log("[v0] DB check error (continuing with new summary):", error)
    }

    // 2. 뉴스 전문 크롤링 (10초 타임아웃)
    console.log("[v0] Crawling article content from:", link)
    let fullContent = ""

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10초 타임아웃

      const crawlResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/crawl`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: link }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (crawlResponse.ok) {
        const crawlData = await crawlResponse.json()
        fullContent = crawlData.content || ""
        console.log(`[v0] Crawled ${fullContent.length} characters`)
      } else {
        console.log("[v0] Crawling failed, using title and description")
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("[v0] Crawling timeout (10s), using title and description")
      } else {
        console.log("[v0] Crawling error, using title and description:", error)
      }
    }

    // 크롤링 실패 시 title + description 사용
    const content = fullContent || `${title}\n\n${description || ""}`

    // 3. OpenAI API로 요약 생성
    const openaiApiKey = apiKey || process.env.OPENAI_API_KEY

    if (!openaiApiKey) {
      return NextResponse.json({ error: "OpenAI API key is required" }, { status: 400 })
    }

    console.log("[v0] Calling OpenAI API for summarization and categorization")

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-5-nano",
          messages: [
            {
              role: "system",
              content: `뉴스 기사를 정확하게 분석 및 분류하여 다음 JSON 형식으로 응답하세요:
{
  "summary": "주요 내용을 3-5문장으로 300자 이내로 요약합니다.",
  "keyPoints": ["핵심 포인트 1", "핵심 포인트 2", "핵심 포인트 3"],
  "category": "적절한 카테고리 코드 (예: 정치, 경제, 사회, 문화, 국제, IT/과학, 스포츠 등)"
}
- 기사 본문을 주의 깊게 읽고 핵심 내용을 파악합니다.
- reasoning: 기사 내용 분석 → 요약에 반영할 주요 정보 파악 → 요약문 작성 → 3가지 핵심 포인트 도출 → 카테고리 선정 (이 순서를 반드시 지킵니다; 절대 결과부터 시작하지 마세요.)
- conclusion: summary, keyPoints, category를 위 JSON 구조에 맞춰 최종적으로 작성합니다.
- 반드시 reasoning(분석과 판단) 후 결론(응답 JSON)을 제시합니다.
- 응답은 반드시 위의 JSON 구조로만 작성하며, 코드블록으로 감싸지 않습니다.

요약 및 핵심 포인트 작성 규칙:
1. summary: 핵심 내용만 간결하게 요약, 중요한 사실과 수치 포함, 객관적이고 중립적인 톤 유지, 300자 이내, 한국어로 작성
2. keyPoints: 3-5개의 핵심 포인트를 배열로 제공, 각 포인트는 간결하게 작성
3. category: 위의 분류 기준에 따라 가장 적합한 카테고리의 코드만 입력 (괄호 안의 한글은 제외하고 영문 코드만)

예시:
입력:
[뉴스 기사 본문]

출력:
{
  "summary": "이 뉴스는 [주요 내용 요약, 3-5문장, 300자 이내].",
  "keyPoints": [
    "[핵심 정보 1]",
    "[핵심 정보 2]",
    "[핵심 정보 3]"
  ],
  "category": "[카테고리 예: 경제]"
}
(실제 뉴스 기사 입력의 길이에 따라 summary, keyPoints 항목 내용이 더 구체적이고 풍부해야 합니다.)

중요: 기사 분석, 요약, 핵심 포인트 추출, 카테고리 분류(순서대로), 그 후에만 결과 JSON을 작성하세요. 항상 reasoning을 결론보다 먼저 수행하세요.


카테고리 선택 가능 목록:
${availableCategories.join(", ")}

카테고리 분류 기준:
- world (세계): 국제 정세, 외교, 국가 간 관계, 글로벌 이슈
- politics (정치): 정부, 정당, 선거, 정책, 법안, 의회 활동
- business (비즈니스): 기업 경영, 주식시장, 경제 지표, 산업 동향, 부동산 (스포츠/연예 관련 비즈니스 제외)
- technology (기술): IT, 소프트웨어, 하드웨어, AI, 인터넷, 앱, 게임
- science (과학): 연구, 발견, 우주, 환경, 기후, 학술
- health (건강): 의료, 질병, 건강 관리, 병원, 제약
- sports (스포츠): 모든 스포츠 관련 뉴스 (선수 이적, 계약, 경기 결과, 스포츠 비즈니스 포함)
- entertainment (엔터테인먼트): 연예인, 영화, 음악, 드라마, 예능, K-POP (연예계 비즈니스 포함)

중요한 분류 규칙:
1. 스포츠 선수의 이적, 계약, 연봉 등은 금액이 언급되어도 "sports" 카테고리입니다
2. 연예인의 계약, 수익, 활동 등은 "entertainment" 카테고리입니다
3. 기사의 주요 주제가 무엇인지 파악하여 가장 적합한 카테고리를 선택하세요
4. 예시:
   - "축구 선수 A가 B팀으로 이적, 이적료 100억" → sports
   - "배우 C가 드라마 출연료 1억 받아" → entertainment
   - "삼성전자 영업이익 증가" → business
   - "AI 기술로 신약 개발" → technology (또는 science)`,
            },
            {
              role: "user",
              content: `다음 뉴스 기사를 분석하고 분류해주세요:\n\n${content}`,
            },
          ],
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
      console.log("[v0] Summary and categorization generated successfully")

      const aiResponse = data.choices?.[0]?.message?.content || "{}"

      // JSON 응답 파싱
      let summary = "요약을 생성할 수 없습니다."
      let keyPoints: string[] = []
      let aiCategory: string | null = null

      try {
        const parsedResponse = JSON.parse(aiResponse)
        summary = parsedResponse.summary || "요약을 생성할 수 없습니다."
        keyPoints = Array.isArray(parsedResponse.keyPoints) ? parsedResponse.keyPoints : []
        // AI가 분류한 카테고리 사용, 없으면 기존 텍스트 기반 카테고리 사용
        aiCategory = parsedResponse.category || category || null

        console.log(`[v0] Parsed AI response - Category: ${aiCategory}, KeyPoints: ${keyPoints.length}`)
      } catch (parseError) {
        console.error("[v0] Failed to parse AI JSON response:", parseError)
        console.error("[v0] Raw AI response:", aiResponse)
        // JSON 파싱 실패시 기존 카테고리 사용
        aiCategory = category || null
      }

      // 4. DB에 저장 (AI 요약 정보 및 AI가 분류한 카테고리 저장)
      // UPSERT 사용: 링크 클릭으로 이미 레코드가 있을 수 있음
      // AI 요약 실행 후에는 AI가 분류한 카테고리로 업데이트됨
      try {
        const { error: upsertError } = await supabase.from("news_summaries").upsert(
          {
            news_id: newsId,
            news_url: link,
            news_title: title,
            category: aiCategory, // AI가 분류한 카테고리 사용
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
        category: aiCategory,
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
