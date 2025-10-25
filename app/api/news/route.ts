import { NextResponse } from "next/server"
import { RSS_FEEDS } from "@/lib/news/feeds"
import { fetchRSSFeed } from "@/lib/news/rss-fetcher"
import { fetchNaverNewsByQueries } from "@/lib/news/naver-news-fetcher"
import type { NewsArticle } from "@/types/article"

/**
 * 중복 기사 제거 함수
 * URL과 제목의 유사도를 기준으로 중복 판단
 */
function removeDuplicateArticles(articles: NewsArticle[]): NewsArticle[] {
  const seen = new Map<string, NewsArticle>()

  for (const article of articles) {
    // 유효성 검사: link와 title이 없으면 스킵
    if (!article.link || !article.title) {
      continue
    }

    // link를 문자열로 변환 (타입 안전성 보장)
    const linkStr = String(article.link)
    const titleStr = String(article.title)

    // URL을 정규화 (쿼리 파라미터 제거)
    const normalizedUrl = linkStr.split("?")[0].toLowerCase()

    // 제목을 정규화 (공백, 특수문자 제거)
    const normalizedTitle = titleStr
      .toLowerCase()
      .replace(/[^\w\s가-힣]/g, "")
      .replace(/\s+/g, " ")
      .trim()

    // 빈 제목이면 스킵
    if (!normalizedTitle) {
      continue
    }

    // URL 기준 중복 체크
    if (seen.has(normalizedUrl)) {
      continue
    }

    // 제목 기준 중복 체크 (매우 유사한 제목)
    let isDuplicate = false
    for (const [, existingArticle] of seen) {
      const existingTitle = existingArticle.title
        .toLowerCase()
        .replace(/[^\w\s가-힣]/g, "")
        .replace(/\s+/g, " ")
        .trim()

      // 제목이 70% 이상 일치하면 중복으로 간주
      if (calculateSimilarity(normalizedTitle, existingTitle) > 0.7) {
        isDuplicate = true
        break
      }
    }

    if (!isDuplicate) {
      seen.set(normalizedUrl, article)
    }
  }

  return Array.from(seen.values())
}

/**
 * 두 문자열의 유사도 계산 (Jaccard similarity)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.split(" "))
  const words2 = new Set(str2.split(" "))

  const intersection = new Set([...words1].filter((x) => words2.has(x)))
  const union = new Set([...words1, ...words2])

  return intersection.size / union.size
}

/**
 * 뉴스 피드 API 엔드포인트
 * RSS 피드 + 네이버 뉴스를 수집하여 통합된 뉴스 목록 반환
 */
export async function GET() {
  try {
    // RSS 피드와 네이버 뉴스를 병렬로 수집
    const [rssArticles, naverArticles] = await Promise.all([
      Promise.all(RSS_FEEDS.map((feed) => fetchRSSFeed(feed))),
      fetchNaverNewsByQueries(
        ["최신뉴스", "IT", "경제", "정치", "사회", "과학", "건강", "스포츠", "연예", "엔터테인먼트"],
        4
      ),
    ])

    // 결과 병합
    const allArticles = [...rssArticles.flat(), ...naverArticles]

    console.log(`[v0] Articles before deduplication: ${allArticles.length} (Naver: ${naverArticles.length}, RSS: ${rssArticles.flat().length})`)

    // 중복 제거
    const uniqueArticles = removeDuplicateArticles(allArticles)

    console.log(`[v0] Articles after deduplication: ${uniqueArticles.length} (removed ${allArticles.length - uniqueArticles.length} duplicates)`)

    // 날짜순 정렬
    const articles = uniqueArticles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())

    // 카테고리별 통계 출력
    const categoryStats = articles.reduce(
      (acc, article) => {
        const cat = article.category || "uncategorized"
        acc[cat] = (acc[cat] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )
    console.log("[v0] Category distribution:", categoryStats)
    console.log(
      "[v0] Uncategorized articles will only show in 'all' category:",
      categoryStats["uncategorized"] || 0
    )

    return NextResponse.json({ articles })
  } catch (error) {
    console.error("[v0] Error in news API:", error)
    return NextResponse.json({ error: "Failed to fetch news", articles: [] }, { status: 500 })
  }
}
