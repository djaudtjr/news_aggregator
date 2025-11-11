import { type NextRequest, NextResponse } from "next/server"
import * as cheerio from "cheerio"

/**
 * 허용된 뉴스 도메인 리스트 (SSRF 방지)
 * RSS 피드 및 네이버 뉴스 API에서 사용하는 모든 도메인 포함
 */
const ALLOWED_NEWS_DOMAINS = [
  // 네이버 API
  "openapi.naver.com",

  // 국내 주요 언론사
  "news.naver.com",
  "www.chosun.com",
  "www.donga.com",
  "www.joongang.co.kr",
  "www.hani.co.kr",
  "www.khan.co.kr",
  "www.mk.co.kr",
  "www.seoul.co.kr",
  "www.yna.co.kr",
  "news.kbs.co.kr",
  "imnews.imbc.com",
  "news.sbs.co.kr",
  "news.jtbc.co.kr",
  "www.ytn.co.kr",
  "biz.chosun.com",
  "www.hankyung.com",
  "www.fnnews.com",
  "www.edaily.co.kr",
  "www.mt.co.kr",
  "www.newsis.com",
  "www.nocutnews.co.kr",
  "www.ohmynews.com",
  "news.mt.co.kr",

  // 해외 언론사 (RSS 피드)
  "feeds.bbci.co.uk",
  "www.bbc.com",
  "www.bbc.co.uk",
  "www.theguardian.com",
  "rss.nytimes.com",
  "www.nytimes.com",
  "www.reddit.com",
  "rss.cnn.com",
  "www.cnn.com",
  "edition.cnn.com",
  "feeds.feedburner.com",
  "techcrunch.com",
  "www.technologyreview.com",
]

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

    // SSRF 방지: URL 파싱 및 hostname 검증
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch (error) {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    // hostname이 허용된 도메인 리스트에 있는지 확인
    const hostname = parsedUrl.hostname
    if (!ALLOWED_NEWS_DOMAINS.includes(hostname)) {
      return NextResponse.json(
        {
          error: "Domain not allowed",
          message: `The domain '${hostname}' is not in the allowed news domains list`,
        },
        { status: 400 }
      )
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
          article.find("script, style, aside, nav, footer, iframe, form, button, noscript").remove()
          article
            .find("div[class*='ad' i], div[class*='banner' i], div[class*='related' i], div[class*='recommend' i]")
            .remove()

          // 텍스트 추출
          const text = article.text()
          const lines = text
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => {
              // JavaScript 코드 패턴 필터링
              if (line.includes("function") || line.includes("var ") || line.includes("const ") || line.includes("let ")) {
                return false
              }
              // GnbContainer, ArticleContainer 등 JavaScript 관련 키워드 필터링
              if (line.includes("Container") || line.includes("render") || line.includes("initialize")) {
                return false
              }
              return line.length > 10
            })

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
          // script, style, 기타 불필요한 태그 제거
          $("script, style, aside, nav, footer, iframe, form, button, noscript").remove()
          $("div[class*='ad' i], div[class*='banner' i], div[class*='related' i], div[class*='recommend' i]").remove()

          const bodyText = $("body").text()
          const lines = bodyText
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => {
              // JavaScript 코드 패턴 필터링
              if (line.includes("function") || line.includes("var ") || line.includes("const ") || line.includes("let ")) {
                return false
              }
              // GnbContainer, ArticleContainer 등 JavaScript 관련 키워드 필터링
              if (line.includes("Container") || line.includes("render") || line.includes("initialize")) {
                return false
              }
              return line.length > 20
            })
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
