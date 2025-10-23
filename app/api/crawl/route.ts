import { type NextRequest, NextResponse } from "next/server"
import * as cheerio from "cheerio"

/**
 * 뉴스 기사 크롤링 API
 * Python crawler.py의 로직을 TypeScript로 구현
 */
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    console.log(`[v0] Crawling article from: ${url}`)

    // 재시도 로직 (최대 2회)
    const maxRetries = 2
    let content: string | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const userAgents = [
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        ]

        const headers = {
          "User-Agent": userAgents[attempt % userAgents.length],
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
          "Accept-Encoding": "gzip, deflate, br",
          Connection: "keep-alive",
          "Upgrade-Insecure-Requests": "1",
        }

        const response = await fetch(url, {
          headers,
          redirect: "follow",
          signal: AbortSignal.timeout(15000), // 15초 타임아웃
        })

        if (!response.ok) {
          console.log(`[v0] HTTP error: ${response.status} (attempt ${attempt + 1}/${maxRetries + 1})`)
          if (attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 1000))
            continue
          }
          throw new Error(`HTTP error: ${response.status}`)
        }

        const html = await response.text()
        const $ = cheerio.load(html)

        let article: cheerio.Cheerio<any> | null = null

        // 네이버 뉴스 특화 선택자
        if (url.includes("news.naver.com")) {
          article =
            $("#dic_area").first() ||
            $("#articleBodyContents").first() ||
            $(".article_body").first() ||
            $(".article_viewer").first() ||
            $("#articeBody").first()
        } else {
          // 일반 뉴스 사이트
          article =
            $("article[class*='article' i]").first() ||
            $("div[class*='article' i], div[class*='content' i], div[class*='body' i], div[class*='post' i]").first() ||
            $("article").first() ||
            $("div[id*='article' i], div[id*='content' i], div[id*='main' i]").first()
        }

        if (article && article.length > 0) {
          // 불필요한 태그 제거
          article.find("script, style, aside, nav, footer, iframe, form, button").remove()
          article
            .find("div[class*='ad' i], div[class*='banner' i], div[class*='related' i], div[class*='recommend' i]")
            .remove()

          // 텍스트 추출
          const text = article.text()
          const lines = text
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.length > 10)

          const fullText = lines.join("\n")

          if (fullText.length >= 100) {
            content = fullText
            console.log(`[v0] ✓ Crawling success: ${fullText.length} characters`)
            break
          } else {
            console.log(
              `[v0] Content too short: ${fullText.length} chars (attempt ${attempt + 1}/${maxRetries + 1})`
            )
          }
        }

        // 마지막 시도에서도 실패하면 body 전체에서 추출
        if (!content && attempt === maxRetries) {
          const bodyText = $("body").text()
          const lines = bodyText
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.length > 20)
          const fullText = lines.join("\n")

          if (fullText.length >= 100) {
            content = fullText
            console.log(`[v0] ⚠ Extracted from entire body: ${fullText.length} characters`)
            break
          }
        }

        if (attempt < maxRetries) {
          console.log(`[v0] Retrying... (attempt ${attempt + 1}/${maxRetries + 1})`)
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      } catch (error) {
        console.log(`[v0] Crawl attempt ${attempt + 1} failed:`, error)
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 2000))
        }
      }
    }

    if (!content) {
      console.log(`[v0] ✗ Crawling failed after all retries`)
      return NextResponse.json(
        { error: "Failed to extract article content", content: null, success: false },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      content,
      wordCount: content.length,
      url,
    })
  } catch (error) {
    console.error("[v0] Crawl API error:", error)
    return NextResponse.json(
      { error: "Failed to crawl article", content: null, success: false },
      { status: 500 }
    )
  }
}
