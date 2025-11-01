import { NextResponse } from "next/server"
import { RSS_FEEDS } from "@/lib/news/feeds"
import { fetchRSSFeed } from "@/lib/news/rss-fetcher"
import { fetchNaverNewsByQueries } from "@/lib/news/naver-news-fetcher"
import { deduplicateArticles } from "@/lib/utils"
import { supabase } from "@/lib/supabase/client"
import type { NewsArticle } from "@/types/article"

// Next.js 캐싱 설정: 5분간 캐시 유지
export const revalidate = 300 // 5분

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

    // AI가 분류한 카테고리 적용 (news_summaries 테이블에서 조회)
    try {
      // 모든 뉴스 ID 추출
      const newsIds = articles.map(article => article.id)

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
        articles.forEach(article => {
          const aiCategory = aiCategoryMap.get(article.id)
          if (aiCategory) {
            article.category = aiCategory
            updatedCount++
          }
        })

        console.log(`[v0] Applied AI-classified categories to ${updatedCount} articles`)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch AI categories:", error)
      // 에러가 발생해도 계속 진행 (기본 카테고리 사용)
    }

    // 카테고리별 통계 출력
    const categoryStats = articles.reduce(
      (acc, article) => {
        const cat = article.category || "all"
        acc[cat] = (acc[cat] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )
    console.log("[v0] Category distribution (with AI categories):", categoryStats)
    console.log(
      "[v0] Ambiguous articles (category='all') will only show in 'all' category filter:",
      categoryStats["all"] || 0
    )

    return NextResponse.json(
      { articles },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    )
  } catch (error) {
    console.error("[v0] Error in news API:", error)
    return NextResponse.json({ error: "Failed to fetch news", articles: [] }, { status: 500 })
  }
}
