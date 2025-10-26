import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { supabase } from "@/lib/supabase/client"

const resend = new Resend(process.env.RESEND_API_KEY)

interface NewsItem {
  title: string
  description: string
  link: string
  source?: string
  pubDate?: string
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
    const { data: settings, error: settingsError } = await supabase
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

    // 2. 현재 요일 및 시간 체크 (KST)
    const now = new Date()
    const kstOffset = 9 * 60 // KST는 UTC+9
    const kstTime = new Date(now.getTime() + kstOffset * 60 * 1000)
    const currentDay = kstTime.getUTCDay() // 0=일, 1=월, ..., 6=토
    const currentHour = kstTime.getUTCHours()

    // 발송 요일 체크
    if (!settings.delivery_days.includes(currentDay)) {
      return NextResponse.json({
        message: "Today is not a delivery day",
        currentDay,
        deliveryDays: settings.delivery_days
      })
    }

    // 3. 구독 키워드 조회
    const { data: keywords, error: keywordsError } = await supabase
      .from("subscribed_keywords")
      .select("keyword")
      .eq("user_id", userId)

    if (keywordsError || !keywords || keywords.length === 0) {
      return NextResponse.json({ error: "No subscribed keywords found" }, { status: 404 })
    }

    // 4. 최근 24시간 이내 뉴스 검색
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()

    const allNews: NewsItem[] = []

    // 각 키워드별로 뉴스 검색
    for (const { keyword } of keywords) {
      const { data: news, error: newsError } = await supabase
        .from("news_summaries")
        .select("title, description, link, source, pub_date")
        .or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%`)
        .gte("pub_date", yesterday)
        .order("pub_date", { ascending: false })
        .limit(10)

      if (!newsError && news) {
        allNews.push(...news.map(n => ({
          title: n.title,
          description: n.description || "",
          link: n.link,
          source: n.source,
          pubDate: n.pub_date,
        })))
      }
    }

    // 중복 제거 (같은 링크)
    const uniqueNews = Array.from(
      new Map(allNews.map(item => [item.link, item])).values()
    )

    // 최신순 정렬 및 최대 10개만
    const topNews = uniqueNews
      .sort((a, b) => {
        const dateA = a.pubDate ? new Date(a.pubDate).getTime() : 0
        const dateB = b.pubDate ? new Date(b.pubDate).getTime() : 0
        return dateB - dateA
      })
      .slice(0, 10)

    if (topNews.length === 0) {
      // 뉴스가 없어도 로그 기록
      await supabase.from("email_delivery_logs").insert({
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

    // 5. 이메일 HTML 생성
    const emailHtml = generateEmailHtml(topNews, keywords.map(k => k.keyword))

    // 6. 이메일 발송
    try {
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: "News Aggregator <onboarding@resend.dev>", // TODO: 실제 도메인으로 변경
        to: [settings.email],
        subject: `📰 오늘의 뉴스 다이제스트 - ${keywords.map(k => k.keyword).join(", ")}`,
        html: emailHtml,
      })

      if (emailError) {
        console.error("[Email Digest] Resend error:", emailError)

        // 실패 로그 기록
        await supabase.from("email_delivery_logs").insert({
          user_id: userId,
          email: settings.email,
          status: "failed",
          news_count: topNews.length,
          error_message: emailError.message || "Unknown error",
        })

        return NextResponse.json({ error: "Failed to send email", details: emailError }, { status: 500 })
      }

      // 7. 성공 로그 기록 및 last_sent_at 업데이트
      await Promise.all([
        supabase.from("email_delivery_logs").insert({
          user_id: userId,
          email: settings.email,
          status: "success",
          news_count: topNews.length,
        }),
        supabase
          .from("email_subscription_settings")
          .update({ last_sent_at: new Date().toISOString() })
          .eq("user_id", userId),
      ])

      return NextResponse.json({
        success: true,
        newsCount: topNews.length,
        emailId: emailData?.id
      })
    } catch (emailError: any) {
      console.error("[Email Digest] Send error:", emailError)

      await supabase.from("email_delivery_logs").insert({
        user_id: userId,
        email: settings.email,
        status: "failed",
        news_count: topNews.length,
        error_message: emailError.message || "Unknown error",
      })

      return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
    }
  } catch (error: any) {
    console.error("[Email Digest] Error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}

/**
 * 이메일 HTML 생성
 */
function generateEmailHtml(news: NewsItem[], keywords: string[]): string {
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
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      color: #2563eb;
      font-size: 24px;
      margin-bottom: 10px;
    }
    .keywords {
      color: #64748b;
      font-size: 14px;
      margin-bottom: 30px;
    }
    .news-item {
      border-bottom: 1px solid #e2e8f0;
      padding: 20px 0;
    }
    .news-item:last-child {
      border-bottom: none;
    }
    .news-title {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 8px;
    }
    .news-title a {
      color: #1e293b;
      text-decoration: none;
    }
    .news-title a:hover {
      color: #2563eb;
    }
    .news-description {
      color: #64748b;
      font-size: 14px;
      margin-bottom: 8px;
      line-height: 1.5;
    }
    .news-meta {
      font-size: 12px;
      color: #94a3b8;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      color: #94a3b8;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📰 오늘의 뉴스 다이제스트</h1>
    <div class="keywords">구독 키워드: ${keywords.join(", ")}</div>

    ${news.map((item, index) => `
      <div class="news-item">
        <div class="news-title">
          <a href="${item.link}" target="_blank">${index + 1}. ${item.title}</a>
        </div>
        <div class="news-description">${item.description}</div>
        <div class="news-meta">
          ${item.source ? `출처: ${item.source}` : ""}
          ${item.pubDate ? ` · ${new Date(item.pubDate).toLocaleDateString("ko-KR")}` : ""}
        </div>
      </div>
    `).join("")}

    <div class="footer">
      <p>이 이메일은 News Aggregator 구독 서비스에서 발송되었습니다.</p>
      <p>구독을 변경하거나 취소하려면 <a href="${process.env.NEXT_PUBLIC_BASE_URL}/mypage" style="color: #2563eb;">마이페이지</a>를 방문하세요.</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}
