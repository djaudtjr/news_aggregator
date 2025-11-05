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
 * 이메일 HTML 생성 (Material Design 3 적용 - 반응형 모바일 최적화)
 */
function generateEmailHtml(keywordNewsArray: KeywordNews[]): string {
  const totalArticles = keywordNewsArray.reduce((sum, kn) => sum + kn.articles.length, 0)

  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
  <title>뉴스 다이제스트</title>
  <style>
    /* Google Fonts - Noto Sans KR */
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap');

    /*
      Material Design 3 Colors - Hardcoded for email compatibility
      이메일 클라이언트는 CSS 변수(:root, var())를 지원하지 않으므로 직접 색상값 사용

      Primary: #006A6A / On-Primary: #FFFFFF
      Secondary: #4A6363 / On-Secondary: #FFFFFF
      Error: #BA1A1A / Error-Container: #FFDAD6 / On-Error-Container: #410002
      Surface: #FAFDFD / On-Surface: #191C1C
      Surface-Variant: #DAE5E4 / On-Surface-Variant: #3F4948
      Outline: #6F7978 / Outline-Variant: #BFC8C7
      Surface-Container-Low: #F3F6F6 / Surface-Container-Lowest: #FFFFFF
      Surface-Container-High: #EDEFEF
    */

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #191C1C;
      margin: 0;
      padding: 0;
      background-color: #FAFDFD;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .email-container {
      max-width: 680px;
      margin: 0 auto;
      background-color: #FAFDFD;
      border-radius: 12px;
      overflow: hidden;
    }

    /* Material Design 3 Elevation */
    .elevation-1 {
      box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15);
    }

    .elevation-2 {
      box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 2px 6px 2px rgba(0, 0, 0, 0.15);
    }

    /* 헤더 - Material Design 3 */
    .header {
      background: linear-gradient(135deg, #006A6A 0%, #4A6363 100%);
      color: #FFFFFF;
      padding: 48px 24px 40px;
      text-align: center;
    }

    .header h1 {
      margin: 0 0 12px 0;
      font-size: 32px;
      font-weight: 700;
      letter-spacing: -0.5px;
      line-height: 1.3;
    }

    .header-info {
      font-size: 16px;
      font-weight: 400;
      opacity: 0.95;
      letter-spacing: 0.15px;
    }

    /* 키워드 네비게이션 - Material Design 3 Filter Chips */
    .keyword-nav {
      background-color: #F3F6F6;
      padding: 24px;
      border-bottom: 1px solid #BFC8C7;
    }

    .keyword-nav-title {
      font-size: 12px;
      font-weight: 600;
      color: #3F4948;
      margin-bottom: 16px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .keyword-badges {
      display: block;
    }

    .keyword-badge {
      display: inline-block;
      padding: 10px 18px;
      background-color: #DAE5E4;
      color: #3F4948;
      border-radius: 24px; /* MD3 Filter Chip */
      font-weight: 600;
      font-size: 14px;
      letter-spacing: 0.1px;
      border: 1px solid #BFC8C7; /* MD3 Filter Chip Style */
      cursor: default; /* Filter Chip은 일반적으로 선택 가능한 상태가 아닌 태그 역할 */
      margin-right: 12px;
      margin-bottom: 12px;
    }

    .keyword-badge:hover {
        background-color: #EDEFEF;
        border-color: #6F7978;
    }

    /* 메인 컨텐츠 */
    .content {
      padding: 24px;
    }

    /* 키워드 섹션 */
    .keyword-section {
      margin-bottom: 48px;
    }

    .keyword-section:last-child {
      margin-bottom: 0;
    }

    .keyword-header {
      display: block;
      width: 100%;
      margin-bottom: 24px;
      padding: 16px 20px;
      background: linear-gradient(135deg, #006A6A 0%, #4A6363 100%);
      border-radius: 16px;
      overflow: hidden;
    }

    .keyword-title {
      display: inline-block;
      font-size: 24px;
      font-weight: 700;
      color: #FFFFFF;
      margin: 0;
      letter-spacing: -0.5px;
      vertical-align: middle;
    }

    .keyword-count {
      display: inline-block;
      min-width: 36px;
      height: 36px;
      padding: 0 12px;
      background-color: #FFFFFF;
      color: #006A6A;
      border-radius: 20px;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-align: center;
      line-height: 36px;
      float: right;
      vertical-align: middle;
    }

    /* 뉴스 카드 - Material Design 3 Cards */
    .news-list {
      display: block;
      width: 100%;
    }

    .news-card {
      display: block;
      width: 100%;
      background-color: #FFFFFF;
      border: 1px solid #BFC8C7;
      border-radius: 16px; /* MD3 Card */
      padding: 24px;
      margin-bottom: 20px;
      box-sizing: border-box;
      transition: box-shadow 0.25s ease; /* Transform 제거 후 Shadow만 */
    }

    .news-card:last-child {
      margin-bottom: 0;
    }

    .news-card:hover {
      box-shadow: 0px 4px 8px 3px rgba(0, 0, 0, 0.15), 0px 2px 4px 2px rgba(0, 0, 0, 0.15); /* Elevation 3 */
      border-color: #6F7978; /* 호버 시 테두리 강조 */
    }

    /* prefers-reduced-motion: 사용자가 애니메이션을 선호하지 않을 경우 */
    @media (prefers-reduced-motion: reduce) {
        .news-card {
            transition: none;
        }
        .news-card:hover {
            /* transform 효과 제거 */
        }
    }

    .news-title {
      font-size: 20px;
      font-weight: 700;
      color: #191C1C;
      line-height: 1.4;
      margin: 0 0 16px 0;
      letter-spacing: -0.3px;
    }

    .news-title a {
      color: inherit; /* 부모(.news-title) 색상 상속 */
      text-decoration: none;
      transition: color 0.2s ease;
    }

    .news-title a:hover {
      color: #006A6A;
    }

    .news-meta {
      display: block;
      font-size: 14px;
      color: #3F4948;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid #BFC8C7;
    }

    .news-meta-item {
      display: inline-block;
      font-weight: 500;
      letter-spacing: 0.1px;
      position: relative;
      padding-left: 10px; /* 구분선을 위한 공간 */
      padding-right: 6px;
      margin-right: 10px;
    }

    .news-meta-item:not(:first-child)::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 1px;
        height: 16px;
        background-color: #BFC8C7;
    }

    .news-summary {
      color: #191C1C;
      font-size: 16px;
      font-weight: 400;
      line-height: 1.7;
      margin-bottom: 20px;
      padding: 20px;
      background-color: #F3F6F6;
      border-radius: 12px;
      border-left: 4px solid #006A6A;
      letter-spacing: 0.15px;
    }

    .news-keypoints {
      margin-top: 20px;
      padding: 20px;
      background-color: #FFDAD6; /* MD3 Error Container Color */
      border-radius: 12px;
      border-left: 4px solid #BA1A1A; /* MD3 Error Color */
    }

    .keypoint-title {
      font-size: 13px;
      font-weight: 700;
      color: #410002; /* MD3 On Error Container Color */
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .keypoint-list {
      margin: 0;
      padding-left: 24px;
      color: #410002; /* MD3 On Error Container Color */
      font-size: 15px;
      line-height: 1.7;
      font-weight: 400;
    }

    .keypoint-list li {
      margin-bottom: 8px;
      letter-spacing: 0.15px;
    }

    .keypoint-list li:last-child {
      margin-bottom: 0;
    }

    /* 푸터 - Material Design 3 */
    .footer {
      padding: 40px 24px;
      background-color: #F3F6F6;
      text-align: center;
      color: #3F4948;
      font-size: 14px;
      border-top: 1px solid #BFC8C7;
    }

    .footer-brand {
      font-weight: 700;
      font-size: 18px;
      color: #191C1C;
      margin-bottom: 12px;
      letter-spacing: 0.1px;
    }

    .footer-text {
      margin: 12px 0;
      line-height: 1.7;
      letter-spacing: 0.15px;
    }

    .footer a {
      color: #006A6A;
      text-decoration: none;
      font-weight: 600;
      transition: color 0.2s ease;
    }

    .footer a:hover {
      color: #4A6363;
      text-decoration: underline;
    }

    .footer-divider {
      width: 64px;
      height: 4px;
      background: linear-gradient(90deg, #006A6A 0%, #4A6363 100%);
      margin: 24px auto;
      border-radius: 2px;
    }

    /* 반응형 모바일 최적화 */
    @media (max-width: 600px) {
      .header {
        padding: 36px 20px 32px;
      }

      .header h1 {
        font-size: 26px;
      }

      .header-info {
        font-size: 14px;
      }

      .content {
        padding: 16px;
      }

      .keyword-nav {
        padding: 20px 16px;
      }

      .keyword-badges {
        gap: 8px;
      }

      .keyword-badge {
        padding: 8px 14px;
        font-size: 13px;
      }

      .keyword-section {
        margin-bottom: 36px;
      }

      .keyword-header {
        padding: 12px 16px;
        flex-wrap: wrap;
        border-radius: 12px;
      }

      .keyword-title {
        font-size: 20px;
      }

      .keyword-count {
        min-width: 32px;
        height: 32px;
        padding: 0 10px;
        font-size: 14px;
      }

      .news-list {
        gap: 16px;
      }

      .news-card {
        padding: 20px;
        border-radius: 12px;
      }

      .news-title {
        font-size: 18px;
        margin-bottom: 14px;
      }

      .news-meta {
        gap: 12px;
        font-size: 13px;
        margin-bottom: 16px;
        padding-bottom: 14px;
      }

      .news-meta-item {
          padding-left: 8px; /* 작은 화면에서 간격 조정 */
      }

      .news-meta-item:not(:first-child)::before {
          height: 14px; /* 작은 화면에서 구분선 높이 조정 */
      }

      .news-summary {
        font-size: 15px;
        padding: 16px;
        margin-bottom: 16px;
        border-radius: 10px;
      }

      .news-keypoints {
        padding: 16px;
        margin-top: 16px;
        border-radius: 10px;
      }

      .keypoint-title {
        font-size: 12px;
        margin-bottom: 10px;
      }

      .keypoint-list {
        padding-left: 20px;
        font-size: 14px;
      }

      .keypoint-list li {
        margin-bottom: 6px;
      }

      .footer {
        padding: 32px 20px;
      }

      .footer-brand {
        font-size: 16px;
      }

      .footer-text {
        font-size: 13px;
      }
    }

    /* 초소형 모바일 (320px~) */
    @media (max-width: 400px) {
      .header h1 {
        font-size: 22px;
      }

      .header-info {
        font-size: 13px;
      }

      .keyword-title {
        font-size: 18px;
      }

      .news-title {
        font-size: 16px;
      }

      .news-summary {
        font-size: 14px;
        padding: 14px;
      }

      .keypoint-list {
        font-size: 13px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- 헤더 -->
    <div class="header">
      <h1>📰 오늘의 뉴스 다이제스트</h1>
      <div class="header-info">
        ${keywordNewsArray.length}개 키워드 · ${totalArticles}개 기사 · AI 요약 제공
      </div>
    </div>

    <!-- 키워드 네비게이션 -->
    <div class="keyword-nav">
      <div class="keyword-nav-title">구독 중인 키워드</div>
      <div class="keyword-badges">
        ${keywordNewsArray.map(keywordNews => `
          <span class="keyword-badge">${keywordNews.keyword} (${keywordNews.articles.length})</span>
        `).join("")}
      </div>
    </div>

    <!-- 메인 컨텐츠 -->
    <div class="content">
      ${keywordNewsArray.map(keywordNews => `
        <div class="keyword-section">
          <div class="keyword-header">
            <h2 class="keyword-title">${keywordNews.keyword}</h2>
            <span class="keyword-count">${keywordNews.articles.length}</span>
          </div>

          <div class="news-list">
            ${keywordNews.articles.map(article => `
              <div class="news-card elevation-1">
                <h3 class="news-title">
                  <a href="${article.link}" target="_blank">${article.title}</a>
                </h3>

                <div class="news-meta">
                  ${article.source ? `
                    <span class="news-meta-item">
                      📌 ${article.source}
                    </span>
                  ` : ""}
                  ${article.pubDate ? `
                    <span class="news-meta-item">
                      🕐 ${new Date(article.pubDate).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  ` : ""}
                </div>

                ${article.summary ? `
                  <div class="news-summary">
                    ${article.summary}
                  </div>
                ` : article.description ? `
                  <div class="news-summary">
                    ${article.description}
                  </div>
                ` : ""}

                ${article.keyPoints && article.keyPoints.length > 0 ? `
                  <div class="news-keypoints">
                    <div class="keypoint-title">
                      💡 핵심 포인트
                    </div>
                    <ul class="keypoint-list">
                      ${article.keyPoints.map(point => `<li>${point}</li>`).join("")}
                    </ul>
                  </div>
                ` : ""}
              </div>
            `).join("")}
          </div>
        </div>
      `).join("")}
    </div>

    <!-- 푸터 -->
    <div class="footer">
      <div class="footer-brand">News Aggregator</div>
      <div class="footer-divider"></div>
      <p class="footer-text">
        구독 키워드를 변경하거나 이메일 설정을 조정하려면<br>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/mypage">마이페이지</a>를 방문하세요.
      </p>
      <p class="footer-text" style="margin-top: 16px; font-size: 12px; opacity: 0.8;">
        매일 선택한 시간에 맞춤형 뉴스를 받아보세요
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()
}
