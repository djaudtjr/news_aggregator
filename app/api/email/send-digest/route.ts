import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email/gmail"
import { supabase } from "@/lib/supabase/client"
import { categorizeArticle } from "@/lib/news/categorizer"

interface NewsItem {
  id: string
  title: string
  description: string
  link: string
  source?: string
  pubDate?: string
  summary?: string
  keyPoints?: string[]
  category?: string
}

interface KeywordNews {
  keyword: string
  articles: NewsItem[]
}

/**
 * 이메일 다이제스트 발송
 * POST /api/email/send-digest
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // 1. 이메일 설정 조회
    const { data: settings, error: settingsError } = await supabaseServer
      .from("email_subscription_settings")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (settingsError || !settings) {
      return NextResponse.json({ error: "Email settings not found" }, { status: 404 })
    }

    if (!settings.enabled) {
      return NextResponse.json({ error: "Email subscription is disabled" }, { status: 400 })
    }

    // 2. 구독 키워드 조회
    // 참고: 요일/시간 체크는 Cron API에서 이미 수행됨
    const { data: keywords, error: keywordsError } = await supabaseServer
      .from("subscribed_keywords")
      .select("keyword")
      .eq("user_id", userId)

    if (keywordsError || !keywords || keywords.length === 0) {
      return NextResponse.json({ error: "No subscribed keywords found" }, { status: 404 })
    }

    // 3. 최근 24시간 이내 뉴스 검색 (키워드별로 5개씩)
    const keywordNewsArray: KeywordNews[] = []
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)

    // 각 키워드별로 뉴스 API에서 직접 검색
    for (const { keyword } of keywords) {
      try {
        const searchResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/search?q=${encodeURIComponent(keyword)}`,
          { next: { revalidate: 0 } } // 캐시 사용 안함
        )

        if (searchResponse.ok) {
          const searchData = await searchResponse.json()
          const articles = searchData.articles || []

          // 최근 24시간 이내 뉴스만 필터링하고 키워드당 최대 5개
          const recentArticles = articles
            .filter((article: any) => {
              const pubDate = new Date(article.pubDate)
              return pubDate >= yesterday
            })
            .slice(0, 5)

          if (recentArticles.length > 0) {
            // 각 기사의 전문 크롤링 및 AI 요약 (기존 API 활용)
            const articlesWithSummary = await Promise.all(
              recentArticles.map(async (article: any) => {
                const newsId = article.id
                let summary = article.description || ""
                let keyPoints: string[] = []

                // 기사 카테고리 자동 분류
                const articleCategory = categorizeArticle(
                  article.title,
                  article.description || "",
                  article.category
                )

                try {
                  // 1. DB에서 기존 요약 확인
                  const { data: existingSummary } = await supabase
                    .from("news_summaries")
                    .select("*")
                    .eq("news_id", newsId)
                    .single()

                  // 기존 요약이 있으면 재사용
                  if (existingSummary && existingSummary.summary && existingSummary.summary.trim() !== "") {
                    console.log(`[Email Digest] Using cached summary for: ${article.title}`)
                    summary = existingSummary.summary
                    keyPoints = existingSummary.key_points || []

                    // 조회수 증가
                    await supabase
                      .from("news_summaries")
                      .update({ view_count: (existingSummary.view_count || 0) + 1 })
                      .eq("news_id", newsId)
                  } else {
                    // 기존 요약이 없으면 새로 생성
                    console.log(`[Email Digest] Processing article: ${article.link}`)

                    // 2. 기사 전문 크롤링
                    const crawlResponse = await fetch(
                      `${process.env.NEXT_PUBLIC_BASE_URL}/api/crawl`,
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ url: article.link }),
                        signal: AbortSignal.timeout(10000), // 10초 타임아웃
                      }
                    )

                    let fullContent = ""
                    if (crawlResponse.ok) {
                      const crawlData = await crawlResponse.json()
                      fullContent = crawlData.content || ""
                      console.log(`[Email Digest] Crawled ${fullContent.length} characters`)
                    }

                    // 3. OpenAI로 요약 생성
                    const content = fullContent || `${article.title}\n\n${article.description || ""}`

                    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
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

                    if (openaiResponse.ok) {
                      const aiData = await openaiResponse.json()
                      const aiResponse = aiData.choices?.[0]?.message?.content || ""

                      // 응답 파싱 (요약과 핵심 포인트 분리)
                      const parts = aiResponse.split("[핵심 포인트]")
                      summary = parts[0].replace("[요약]", "").trim()

                      if (parts.length > 1) {
                        const pointsText = parts[1].trim()
                        keyPoints = pointsText
                          .split("\n")
                          .filter((line: string) => line.trim().startsWith("-"))
                          .map((line: string) => line.trim().replace(/^-\s*/, ""))
                      }

                      console.log(`[Email Digest] Summary generated for: ${article.title}`)

                      // 4. DB에 요약 저장 (UPSERT)
                      try {
                        await supabase.from("news_summaries").upsert(
                          {
                            news_id: newsId,
                            news_url: article.link,
                            news_title: article.title,
                            category: articleCategory, // categorizer로 분류한 카테고리 사용
                            summary,
                            key_points: keyPoints.length > 0 ? keyPoints : null,
                            view_count: 1,
                          },
                          {
                            onConflict: "news_id",
                          }
                        )
                        console.log(`[Email Digest] Summary saved to DB for newsId: ${newsId} with category: ${articleCategory}`)
                      } catch (dbError) {
                        console.error(`[Email Digest] Failed to save summary to DB:`, dbError)
                      }
                    }
                  }
                } catch (error) {
                  console.error(`[Email Digest] Error processing article ${article.link}:`, error)
                  // 요약 실패시 기존 description 사용
                }

                return {
                  id: newsId,
                  title: article.title,
                  description: article.description || "",
                  link: article.link,
                  source: article.source,
                  pubDate: article.pubDate,
                  summary,
                  keyPoints,
                  category: articleCategory,
                }
              })
            )

            keywordNewsArray.push({
              keyword,
              articles: articlesWithSummary,
            })
          }
        }
      } catch (error) {
        console.error(`[Email Digest] Error searching keyword "${keyword}":`, error)
      }
    }

    if (keywordNewsArray.length === 0) {
      // 뉴스가 없어도 로그 기록
      await supabaseServer.from("email_delivery_logs").insert({
        user_id: userId,
        email: settings.email,
        status: "success",
        news_count: 0,
        error_message: "No matching news found",
      })

      return NextResponse.json({
        message: "No matching news found in the last 24 hours",
        newsCount: 0
      })
    }

    // 전체 뉴스 개수 계산
    const totalNewsCount = keywordNewsArray.reduce((sum, kn) => sum + kn.articles.length, 0)

    // 4. 이메일 HTML 생성
    const emailHtml = generateEmailHtml(keywordNewsArray)

    // 5. Gmail SMTP로 즉시 이메일 발송
    try {
      console.log(`[Email Digest] Sending email to ${settings.email} via Gmail SMTP...`)

      const keywordList = keywordNewsArray.map(kn => kn.keyword).join(", ")
      const emailResult = await sendEmail({
        to: settings.email,
        subject: `📰 오늘의 뉴스 다이제스트 - ${keywordList}`,
        html: emailHtml,
      })

      // 6. 성공 로그 기록 및 last_sent_at 업데이트
      await Promise.all([
        supabaseServer.from("email_delivery_logs").insert({
          user_id: userId,
          email: settings.email,
          status: "success",
          news_count: totalNewsCount,
        }),
        supabaseServer
          .from("email_subscription_settings")
          .update({ last_sent_at: new Date().toISOString() })
          .eq("user_id", userId),
      ])

      return NextResponse.json({
        success: true,
        newsCount: totalNewsCount,
        messageId: emailResult.messageId,
      })
    } catch (emailError: any) {
      console.error("[Email Digest] Gmail SMTP error:", emailError)

      await supabaseServer.from("email_delivery_logs").insert({
        user_id: userId,
        email: settings.email,
        status: "failed",
        news_count: totalNewsCount,
        error_message: emailError.message || "Unknown error",
      })

      return NextResponse.json({ error: "Failed to send email", details: emailError.message }, { status: 500 })
    }
  } catch (error: any) {
    console.error("[Email Digest] Error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}

/**
 * 이메일 HTML 생성 (테이블 형태로 키워드별 뉴스를 나란히 표시)
 */
function generateEmailHtml(keywordNewsArray: KeywordNews[]): string {
  const totalArticles = keywordNewsArray.reduce((sum, kn) => sum + kn.articles.length, 0)

  // 최대 뉴스 개수 찾기 (가장 많은 뉴스를 가진 키워드 기준)
  const maxArticles = Math.max(...keywordNewsArray.map(kn => kn.articles.length))

  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>뉴스 다이제스트</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 20px;
      background-color: #f8fafc;
    }
    .container {
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    /* 헤더 */
    .header {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 32px;
      font-weight: 700;
    }
    .header-info {
      font-size: 14px;
      opacity: 0.9;
    }

    /* 키워드 탭 네비게이션 */
    .keyword-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 20px 30px;
      background-color: #f1f5f9;
      border-bottom: 2px solid #e2e8f0;
      justify-content: center;
    }
    .keyword-tab {
      display: inline-block;
      padding: 10px 20px;
      background-color: #ffffff;
      color: #2563eb;
      border-radius: 20px;
      font-weight: 600;
      font-size: 14px;
      border: 2px solid #2563eb;
    }
    .keyword-tab-separator {
      display: inline-block;
      color: #cbd5e1;
      font-weight: 300;
      padding: 0 5px;
    }

    /* 테이블 영역 */
    .content {
      padding: 30px;
      overflow-x: auto;
    }
    .news-table {
      width: 100%;
      table-layout: fixed;
      border-collapse: separate;
      border-spacing: 0;
      margin-bottom: 20px;
    }
    .news-table th {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: white;
      padding: 16px 12px;
      text-align: center;
      font-weight: 700;
      font-size: 16px;
      border: 1px solid #1d4ed8;
      width: auto;
    }
    .news-table th:first-child {
      border-top-left-radius: 8px;
    }
    .news-table th:last-child {
      border-top-right-radius: 8px;
    }
    .news-table td {
      padding: 16px 12px;
      vertical-align: top;
      border: 1px solid #e2e8f0;
      background-color: #ffffff;
      width: auto;
    }
    .news-table tr:last-child td:first-child {
      border-bottom-left-radius: 8px;
    }
    .news-table tr:last-child td:last-child {
      border-bottom-right-radius: 8px;
    }
    .news-table tr:hover td {
      background-color: #f8fafc;
    }

    /* 뉴스 카드 (테이블 셀 내부) */
    .news-card {
      background-color: #f8fafc;
      border-radius: 8px;
      padding: 16px;
      height: 100%;
      border: 1px solid #e2e8f0;
    }
    .news-title {
      font-size: 15px;
      font-weight: 700;
      color: #1e293b;
      line-height: 1.4;
      margin: 0 0 10px 0;
    }
    .news-title a {
      color: #1e293b;
      text-decoration: none;
    }
    .news-title a:hover {
      color: #2563eb;
    }
    .news-meta {
      font-size: 11px;
      color: #94a3b8;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
    }
    .news-summary {
      color: #475569;
      font-size: 13px;
      line-height: 1.6;
      margin-bottom: 12px;
      padding: 10px;
      background-color: #ffffff;
      border-radius: 6px;
      border-left: 3px solid #3b82f6;
    }
    .news-keypoints {
      margin-top: 10px;
      padding: 10px;
      background-color: #fefce8;
      border-radius: 6px;
      border-left: 3px solid #eab308;
    }
    .keypoint-title {
      font-size: 11px;
      font-weight: 700;
      color: #854d0e;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .keypoint-list {
      margin: 0;
      padding-left: 18px;
      color: #713f12;
      font-size: 12px;
    }
    .keypoint-list li {
      margin-bottom: 3px;
      line-height: 1.4;
    }
    .empty-cell {
      text-align: center;
      color: #cbd5e1;
      font-size: 13px;
      padding: 20px;
    }

    /* 푸터 */
    .footer {
      padding: 30px;
      background-color: #f8fafc;
      text-align: center;
      color: #64748b;
      font-size: 13px;
      border-top: 2px solid #e2e8f0;
    }
    .footer p {
      margin: 8px 0;
    }
    .footer a {
      color: #2563eb;
      text-decoration: none;
      font-weight: 600;
    }
    .footer a:hover {
      text-decoration: underline;
    }

    /* 반응형 */
    @media (max-width: 768px) {
      .content {
        padding: 15px;
      }
      .news-table {
        font-size: 12px;
      }
      .news-table th,
      .news-table td {
        padding: 10px 8px;
      }
      .keyword-tabs {
        flex-direction: column;
        align-items: stretch;
      }
      .keyword-tab {
        text-align: center;
      }
      .keyword-tab-separator {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- 헤더 -->
    <div class="header">
      <h1>📰 오늘의 뉴스 다이제스트</h1>
      <div class="header-info">
        총 ${keywordNewsArray.length}개 키워드 · ${totalArticles}개 기사 · AI 요약 제공
      </div>
    </div>

    <!-- 키워드 탭 네비게이션 -->
    <div class="keyword-tabs">
      ${keywordNewsArray.map((keywordNews, index) => `
        <span class="keyword-tab">${keywordNews.keyword}</span>${index < keywordNewsArray.length - 1 ? '<span class="keyword-tab-separator">|</span>' : ''}
      `).join("")}
    </div>

    <!-- 뉴스 테이블 -->
    <div class="content">
      <table class="news-table">
        <thead>
          <tr>
            ${keywordNewsArray.map(kn => `<th>${kn.keyword} (${kn.articles.length})</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${Array.from({ length: maxArticles }, (_, rowIndex) => `
            <tr>
              ${keywordNewsArray.map(kn => {
                const article = kn.articles[rowIndex]
                if (!article) {
                  return '<td class="empty-cell">-</td>'
                }
                return `
                  <td>
                    <div class="news-card">
                      <h3 class="news-title">
                        <a href="${article.link}" target="_blank">${article.title}</a>
                      </h3>
                      <div class="news-meta">
                        ${article.source ? `📌 ${article.source}` : ""}
                        ${article.pubDate ? ` · 🕐 ${new Date(article.pubDate).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}` : ""}
                      </div>
                      <div class="news-summary">
                        ${article.summary || article.description}
                      </div>
                      ${article.keyPoints && article.keyPoints.length > 0 ? `
                        <div class="news-keypoints">
                          <div class="keypoint-title">💡 핵심 포인트</div>
                          <ul class="keypoint-list">
                            ${article.keyPoints.map(point => `<li>${point}</li>`).join("")}
                          </ul>
                        </div>
                      ` : ""}
                    </div>
                  </td>
                `
              }).join("")}
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>

    <!-- 푸터 -->
    <div class="footer">
      <p><strong>News Aggregator</strong> 구독 서비스</p>
      <p>구독을 변경하거나 취소하려면 <a href="${process.env.NEXT_PUBLIC_BASE_URL}/mypage">마이페이지</a>를 방문하세요.</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}
