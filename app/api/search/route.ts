import { NextRequest, NextResponse } from "next/server"
import { fetchNaverNews } from "@/lib/news/naver-news-fetcher"
import { processSearchQuery } from "@/lib/utils/language-utils"
import type { NewsArticle } from "@/types/article"

/**
 * 국제 뉴스 검색 (RSS 피드 대신 검색 API 사용)
 */
async function searchInternationalNews(query: string): Promise<NewsArticle[]> {
  // 간단한 구현: Guardian API 또는 News API 사용 가능
  // 여기서는 제목/설명에서 키워드 매칭하는 방식으로 구현
  // 실제로는 News API (newsapi.org) 같은 서비스 사용 권장

  try {
    // 기존 RSS 피드에서 검색어로 필터링
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/news`)
    const data = await response.json()
    const allArticles: NewsArticle[] = data.articles || []

    const queryLower = query.toLowerCase()
    const filtered = allArticles.filter(
      (article) =>
        article.region === "international" &&
        (article.title.toLowerCase().includes(queryLower) ||
          article.description.toLowerCase().includes(queryLower))
    )

    return filtered.slice(0, 10) // 최대 10개
  } catch (error) {
    console.log("[v0] International search error:", error)
    return []
  }
}

/**
 * 검색 API 엔드포인트
 * 언어를 자동 감지하여 국내/해외 뉴스 검색
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q")
    const region = searchParams.get("region") || "all" // 지역 필터 추가

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ articles: [], message: "검색어를 입력해주세요" })
    }

    console.log(`[v0] Search query: "${query}", region: "${region}"`)

    // 언어 감지 및 번역
    const { original, translated, isKorean } = await processSearchQuery(query)

    const results: NewsArticle[] = []

    // 지역 필터에 따라 검색 범위 결정
    const shouldSearchDomestic = region === "all" || region === "domestic"
    const shouldSearchInternational = region === "all" || region === "international"

    if (isKorean) {
      // 한글 검색어
      if (shouldSearchDomestic) {
        console.log(`[v0] Searching Korean news with: "${original}"`)
        const koreanNews = await fetchNaverNews(original, 15)
        results.push(...koreanNews)
      }

      // 번역된 검색어로 해외 뉴스 검색
      if (shouldSearchInternational) {
        if (translated) {
          console.log(`[v0] Searching international news with translated query: "${translated}"`)
          const internationalNews = await searchInternationalNews(translated)
          results.push(...internationalNews)
          console.log(`[v0] Found ${internationalNews.length} international articles with translated query`)
        } else {
          console.log(`[v0] Translation failed or returned same text. Searching international news with original: "${original}"`)
          const internationalNews = await searchInternationalNews(original)
          results.push(...internationalNews)
          console.log(`[v0] Found ${internationalNews.length} international articles with original query`)
        }
      }
    } else {
      // 영문 검색어
      if (shouldSearchInternational) {
        console.log(`[v0] Searching international news with: "${original}"`)
        const internationalNews = await searchInternationalNews(original)
        results.push(...internationalNews)
      }

      // 영문으로도 네이버 뉴스 검색 (영문 키워드가 있는 한국 뉴스)
      if (shouldSearchDomestic) {
        const koreanNews = await fetchNaverNews(original, 10)
        results.push(...koreanNews)
      }
    }

    // 날짜순 정렬
    const sortedResults = results.sort(
      (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
    )

    console.log(
      `[v0] Search completed: ${sortedResults.length} articles found (Region: ${region}, Korean: ${isKorean ? "yes" : "no"}, Translated: ${translated || "no"})`
    )

    return NextResponse.json({
      articles: sortedResults,
      query: {
        original,
        translated,
        isKorean,
      },
    })
  } catch (error) {
    console.error("[v0] Search API error:", error)
    return NextResponse.json({ error: "검색 중 오류가 발생했습니다", articles: [] }, { status: 500 })
  }
}
