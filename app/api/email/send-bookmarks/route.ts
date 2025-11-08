import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"
import { supabase } from "@/lib/supabase/client"
import { sendEmail } from "@/lib/email/gmail"
import { categorizeArticle } from "@/lib/news/categorizer"

interface BookmarkRecord {
  id: string
  article_id?: string | null
  title: string
  description?: string | null
  link: string
  source?: string | null
  category?: string | null
  created_at: string
  pub_date?: string | null
}

interface SummarizedBookmark {
  id: string
  title: string
  link: string
  source?: string | null
  category?: string | null
  summary: string
  keyPoints: string[]
  createdAt: string
  publishedAt?: string | null
}

const MAX_BOOKMARK_SELECTION = 10

export async function POST(request: NextRequest) {
  let requestedUserId: string | null = null
  let requestedEmail: string | null = null
  let attemptedCount = 0

  try {
    const body = await request.json()
    const { userId, email, bookmarkIds } = body || {}
    requestedUserId = userId
    requestedEmail = email

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    if (!email || typeof email !== "string" || !isValidEmail(email)) {
      return NextResponse.json({ error: "유효한 이메일 주소가 필요합니다." }, { status: 400 })
    }

    if (!Array.isArray(bookmarkIds) || bookmarkIds.length === 0) {
      return NextResponse.json({ error: "메일로 보낼 북마크가 없습니다." }, { status: 400 })
    }

    const normalizedBookmarkIds: string[] = bookmarkIds.map((id: string) => String(id))
    const uniqueBookmarkIds = normalizedBookmarkIds.filter(
      (id: string, index: number) => normalizedBookmarkIds.indexOf(id) === index
    )

    if (uniqueBookmarkIds.length > MAX_BOOKMARK_SELECTION) {
      return NextResponse.json(
        { error: `최대 ${MAX_BOOKMARK_SELECTION}개의 북마크만 선택할 수 있습니다.` },
        { status: 400 }
      )
    }

    const { data: bookmarks, error: bookmarksError } = await supabaseServer
      .from("bookmarks")
      .select("*")
      .eq("user_id", userId)
      .in("id", uniqueBookmarkIds)

    if (bookmarksError) {
      console.error("[SendBookmarksEmail] Failed to load bookmarks:", bookmarksError)
      return NextResponse.json({ error: "북마크를 불러오지 못했습니다." }, { status: 500 })
    }

    if (!bookmarks || bookmarks.length === 0) {
      return NextResponse.json({ error: "선택한 북마크를 찾을 수 없습니다." }, { status: 404 })
    }

    const bookmarkOrder = new Map<string, number>()
    uniqueBookmarkIds.forEach((id, index) => bookmarkOrder.set(id, index))

    const sortedBookmarks = bookmarks.sort((a, b) => {
      return (bookmarkOrder.get(a.id) ?? 0) - (bookmarkOrder.get(b.id) ?? 0)
    })

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin
    const summarizedBookmarks = await Promise.all(
      sortedBookmarks.map((bookmark) => summarizeBookmark(bookmark, baseUrl))
    )
    attemptedCount = summarizedBookmarks.length

    const emailHtml = generateBookmarksEmailHtml(summarizedBookmarks)
    const now = new Date()
    const subject = `📌 북마크 뉴스 요약 (${summarizedBookmarks.length}건) - ${formatKoreanDate(now)}`

    await sendEmail({
      to: email,
      subject,
      html: emailHtml,
    })

    await supabaseServer.from("email_delivery_logs").insert({
      user_id: userId,
      email,
      status: "success",
      news_count: summarizedBookmarks.length,
    })

    return NextResponse.json({
      success: true,
      sentCount: summarizedBookmarks.length,
    })
  } catch (error: any) {
    console.error("[SendBookmarksEmail] Error:", error)

    if (requestedUserId || requestedEmail) {
      await supabaseServer.from("email_delivery_logs").insert({
        user_id: requestedUserId,
        email: requestedEmail,
        status: "failed",
        news_count: attemptedCount,
        error_message: error?.message ?? "Unknown error",
      })
    }

    return NextResponse.json(
      { error: "메일 발송 중 문제가 발생했습니다.", details: error?.message ?? "Unknown error" },
      { status: 500 }
    )
  }
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

function formatKoreanDate(date: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

async function summarizeBookmark(bookmark: BookmarkRecord, baseUrl: string): Promise<SummarizedBookmark> {
  const newsId = String(bookmark.article_id || bookmark.id)
  let summary = bookmark.description?.trim() ?? ""
  let keyPoints: string[] = []
  const category = categorizeArticle(bookmark.title, bookmark.description || "", bookmark.category || undefined)

  try {
    const { data: existingSummary } = await supabase
      .from("news_summaries")
      .select("*")
      .eq("news_id", newsId)
      .maybeSingle()

    if (existingSummary && existingSummary.summary?.trim()) {
      summary = existingSummary.summary.trim()
      keyPoints = existingSummary.key_points || []

      await supabase
        .from("news_summaries")
        .update({ view_count: (existingSummary.view_count || 0) + 1 })
        .eq("news_id", newsId)
    } else {
      const fullContent = await fetchArticleContent(bookmark.link, baseUrl)
      const aiSummary = await generateAiSummary(fullContent || composeFallbackContent(bookmark))
      summary = aiSummary.summary
      keyPoints = aiSummary.keyPoints

      await supabase.from("news_summaries").upsert(
        {
          news_id: newsId,
          news_url: bookmark.link,
          news_title: bookmark.title,
          category,
          summary,
          key_points: keyPoints.length > 0 ? keyPoints : null,
          view_count: 1,
        },
        { onConflict: "news_id" }
      )
    }
  } catch (error) {
    console.error(`[SendBookmarksEmail] Failed to summarize bookmark ${bookmark.id}:`, error)
    summary = summary || "요약을 불러올 수 없습니다. 링크를 통해 기사를 확인해주세요."
    keyPoints = keyPoints.length > 0 ? keyPoints : []
  }

  return {
    id: bookmark.id,
    title: bookmark.title,
    link: bookmark.link,
    source: bookmark.source,
    category,
    summary,
    keyPoints,
    createdAt: bookmark.created_at,
    publishedAt: bookmark.pub_date,
  }
}

async function fetchArticleContent(url: string, baseUrl: string) {
  try {
    const crawlResponse = await fetch(`${baseUrl}/api/crawl`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(10000),
    })

    if (crawlResponse.ok) {
      const crawlData = await crawlResponse.json()
      return crawlData.content || ""
    }
  } catch (error) {
    console.error("[SendBookmarksEmail] Failed to crawl article:", error)
  }

  return ""
}

function composeFallbackContent(bookmark: BookmarkRecord) {
  return `${bookmark.title}\n\n${bookmark.description ?? ""}`
}

async function generateAiSummary(content: string) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set")
  }

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

  if (!openaiResponse.ok) {
    const errorText = await openaiResponse.text()
    throw new Error(`OpenAI API error: ${errorText}`)
  }

  const aiData = await openaiResponse.json()
  const aiResponse = aiData.choices?.[0]?.message?.content || ""
  const parts = aiResponse.split("[핵심 포인트]")

  const summary = parts[0]?.replace("[요약]", "").trim() || "요약을 생성하지 못했습니다."
  let keyPoints: string[] = []

  if (parts.length > 1) {
    keyPoints = parts[1]
      .split("\n")
      .filter((line: string) => line.trim().startsWith("-"))
      .map((line: string) => line.replace(/^-+\s*/, "").trim())
  }

  return { summary, keyPoints }
}

function generateBookmarksEmailHtml(bookmarks: SummarizedBookmark[]): string {
  const generatedAt = formatKoreanDate(new Date())

  const bookmarkSections = bookmarks
    .map((bookmark, index) => {
      const summaryHtml = bookmark.summary.replace(/\n/g, "<br />")
      const keyPointsHtml =
        bookmark.keyPoints.length > 0
          ? `<ul style="margin: 8px 0 0 20px; padding: 0; color: #1F2933;">
        ${bookmark.keyPoints.map((point) => `<li style="margin-bottom: 4px;">${point}</li>`).join("")}
      </ul>`
          : ""

      return `
      <div style="padding: 16px; border: 1px solid #E5E7EB; border-radius: 12px; margin-bottom: 16px; background: #FFFFFF;">
        <div style="font-size: 13px; color: #9CA3AF; margin-bottom: 4px;">기사 ${index + 1}</div>
        <h2 style="font-size: 18px; margin: 0 0 8px 0; color: #111827;">
          <a href="${bookmark.link}" target="_blank" rel="noopener noreferrer" style="color: #0EA5E9; text-decoration: none;">
            ${bookmark.title}
          </a>
        </h2>
        <div style="font-size: 13px; color: #6B7280; margin-bottom: 12px; display: flex; flex-wrap: wrap; gap: 8px;">
          ${bookmark.source ? `<span style="padding: 2px 8px; border-radius: 999px; background: #E0F2FE; color: #0369A1;">${bookmark.source}</span>` : ""}
          ${bookmark.category ? `<span style="padding: 2px 8px; border-radius: 999px; background: #F5F3FF; color: #5B21B6;">${bookmark.category}</span>` : ""}
          ${
            bookmark.publishedAt
              ? `<span>${new Date(bookmark.publishedAt).toLocaleString("ko-KR", {
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}</span>`
              : ""
          }
        </div>
        <div style="font-size: 15px; line-height: 1.5; color: #1F2933;">${summaryHtml}</div>
        ${keyPointsHtml}
      </div>
    `
    })
    .join("")

  return `
<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>북마크 뉴스 요약</title>
  </head>
  <body style="margin: 0; padding: 0; background: #F3F4F6; font-family: 'Noto Sans KR', Arial, sans-serif;">
    <div style="max-width: 640px; margin: 0 auto; padding: 24px;">
      <div style="background: #FFFFFF; border-radius: 16px; padding: 24px; border: 1px solid #E5E7EB;">
        <h1 style="margin: 0 0 8px 0; font-size: 24px; color: #111827;">선택한 북마크 뉴스 요약</h1>
        <p style="margin: 0 0 16px 0; color: #6B7280; font-size: 14px;">
          AI가 요약한 ${bookmarks.length}개의 북마크 기사를 전달드립니다.<br />
          생성 시각: ${generatedAt}
        </p>
        ${bookmarkSections}
        <p style="margin-top: 24px; font-size: 12px; color: #9CA3AF; text-align: center;">
          본 메일은 사용자가 직접 요청하여 발송되었습니다.
        </p>
      </div>
    </div>
  </body>
</html>
`
}
