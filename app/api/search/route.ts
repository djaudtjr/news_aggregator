import { NextRequest, NextResponse } from "next/server"
import { fetchNaverNews } from "@/lib/news/naver-news-fetcher"
import { processSearchQuery } from "@/lib/utils/language-utils"
import { deduplicateArticles } from "@/lib/utils"
import { RSS_FEEDS } from "@/lib/news/feeds"
import { fetchRSSFeed } from "@/lib/news/rss-fetcher"
import { supabase } from "@/lib/supabase/client"
import type { NewsArticle } from "@/types/article"

// 국제 뉴스 캐시 (메모리 캐시, 5분 유효)
let internationalNewsCache: { articles: NewsArticle[]; timestamp: number } | null = null
const CACHE_DURATION = 5 * 60 * 1000 // 5분

/**
 * 국제 뉴스 검색 (캐시 사용하여 성능 개선, RSS 직접 검색)
 */
async function searchInternationalNews(query: string): Promise<NewsArticle[]> {
  try {
    // 캐시가 유효하면 캐시에서 검색
    const now = Date.now()
    if (internationalNewsCache && (now - internationalNewsCache.timestamp < CACHE_DURATION)) {
      console.log("[v0] Using cached international news for search")
      const queryLower = query.toLowerCase()
      const filtered = internationalNewsCache.articles.filter(
        (article) =>
          article.title.toLowerCase().includes(queryLower) ||
          article.description.toLowerCase().includes(queryLower)
      )
      return filtered.slice(0, 10)
    }

    // 캐시가 없거나 만료되었으면 RSS 피드에서 직접 가져오기
    console.log("[v0] Fetching fresh international news from RSS feeds")

    // 국제 뉴스 RSS 피드만 병렬로 가져오기
    const internationalFeeds = RSS_FEEDS.filter((feed) => feed.region === "international")
    const results = await Promise.all(internationalFeeds.map((feed) => fetchRSSFeed(feed)))
    const internationalArticles = results.flat()

    // 캐시에 저장
    internationalNewsCache = {
      articles: internationalArticles,
      timestamp: now
    }

    // 검색 수행
    const queryLower = query.toLowerCase()
    const filtered = internationalArticles.filter(
      (article) =>
        article.title.toLowerCase().includes(queryLower) ||
        article.description.toLowerCase().includes(queryLower)
    )

    return filtered.slice(0, 10)
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

    // 언어 감지 (번역은 건너뛰기 - 성능 향상)
    const isKorean = /[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(query)
    const original = query
    const translated = undefined // 번역 비활성화

    const results: NewsArticle[] = []

    // 지역 필터에 따라 검색 범위 결정
    const shouldSearchDomestic = region === "all" || region === "domestic"
    const shouldSearchInternational = region === "all" || region === "international"

    if (isKorean) {
      // 한글 검색어
      if (shouldSearchDomestic) {
        console.log(`[v0] Searching Korean news with: "${original}"`)
        const koreanNews = await fetchNaverNews(original, 15, false, 6) // 상위 6개만 이미지 추출
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
        const koreanNews = await fetchNaverNews(original, 10, false, 6) // 상위 6개만 이미지 추출
        results.push(...koreanNews)
      }
    }

    // 날짜순 정렬
    const sortedResults = results.sort(
      (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
    )

    // 중복 제거 (ID 기반 + 제목 유사도 80% 이상)
    const uniqueResults = deduplicateArticles(sortedResults, 0.8)

    // AI가 분류한 카테고리 적용 (news_summaries 테이블에서 조회)
    try {
      // 모든 뉴스 ID 추출
      const newsIds = uniqueResults.map(article => article.id)

      if (newsIds.length > 0) {
        // news_summaries 테이블에서 AI가 분류한 카테고리 조회
        const { data: summaries } = await supabase
          .from("news_summaries")
          .select("news_id, category")
          .in("news_id", newsIds)
          .not("category", "is", null)

        if (summaries && summaries.length > 0) {
          // AI 카테고리를 Map으로 변환
          const aiCategoryMap = new Map(
            summaries.map(s => [s.news_id, s.category])
          )

          // 뉴스 데이터에 AI 카테고리 적용
          let updatedCount = 0
          uniqueResults.forEach(article => {
            const aiCategory = aiCategoryMap.get(article.id)
            if (aiCategory) {
              article.category = aiCategory
              updatedCount++
            }
          })

          console.log(`[v0] Applied AI-classified categories to ${updatedCount} search results`)
        }
      }
    } catch (error) {
      console.error("[v0] Failed to fetch AI categories for search results:", error)
      // 에러가 발생해도 계속 진행 (기본 카테고리 사용)
    }

    console.log(
      `[v0] Search completed: ${sortedResults.length} articles found, ${uniqueResults.length} unique (Region: ${region}, Korean: ${isKorean ? "yes" : "no"}, Translated: ${translated || "no"})`
    )

    return NextResponse.json(
      {
        articles: uniqueResults,
        query: {
          original,
          translated,
          isKorean,
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=180, stale-while-revalidate=360',
        },
      }
    )
  } catch (error) {
    console.error("[v0] Search API error:", error)
    return NextResponse.json({ error: "검색 중 오류가 발생했습니다", articles: [] }, { status: 500 })
  }
}
