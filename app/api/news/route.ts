import { NextResponse } from "next/server"
import { RSS_FEEDS } from "@/lib/news/feeds"
import { fetchRSSFeed } from "@/lib/news/rss-fetcher"
import { fetchNaverNewsByQueries } from "@/lib/news/naver-news-fetcher"
import { deduplicateArticles } from "@/lib/utils"
import type { NewsArticle } from "@/types/article"

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
        [
          "최신뉴스",
          "IT",
          "경제",
          "정치",
          "사회",
          "과학",
          "건강",
          "스포츠",
          "KBO",
          "프리미어리그",
          "연예",
          "케이팝",
          "하이브",
          "SM엔터",
        ],
        3
      ),
    ])

    // 결과 병합
    const allArticles = [...rssArticles.flat(), ...naverArticles]

    console.log(`[v0] Articles before deduplication: ${allArticles.length} (Naver: ${naverArticles.length}, RSS: ${rssArticles.flat().length})`)

    // 중복 제거 (ID 기반 + 제목 유사도 80% 이상)
    const uniqueArticles = deduplicateArticles(allArticles, 0.8)

    console.log(`[v0] Articles after deduplication: ${uniqueArticles.length} (removed ${allArticles.length - uniqueArticles.length} duplicates)`)

    // 날짜순 정렬
    const articles = uniqueArticles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())

    // 카테고리별 통계 출력
    const categoryStats = articles.reduce(
      (acc, article) => {
        const cat = article.category || "all"
        acc[cat] = (acc[cat] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )
    console.log("[v0] Category distribution:", categoryStats)
    console.log(
      "[v0] Ambiguous articles (category='all') will only show in 'all' category filter:",
      categoryStats["all"] || 0
    )

    return NextResponse.json({ articles })
  } catch (error) {
    console.error("[v0] Error in news API:", error)
    return NextResponse.json({ error: "Failed to fetch news", articles: [] }, { status: 500 })
  }
}
