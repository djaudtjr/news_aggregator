"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Clock, Sparkles, Bookmark, BookmarkCheck } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Image from "next/image"
import { useArticleSummary } from "@/hooks/useArticleSummary"
import { useAuth } from "@/hooks/useAuth"
import { useRecentArticles } from "@/hooks/useRecentArticles"
import { useBookmarks } from "@/hooks/useBookmarks"
import { getNewsLogo } from "@/lib/utils/news-logos"
import type { NewsArticle } from "@/types/article"

interface NewsCardProps {
  article: NewsArticle
}

export function NewsCard({ article }: NewsCardProps) {
  const timeAgo = formatDistanceToNow(new Date(article.pubDate), { addSuffix: true })
  const { user } = useAuth()
  const { summary, keyPoints, isLoading, fromCache, generateSummary } = useArticleSummary(article.id)
  const { addRecentArticle } = useRecentArticles()
  const { toggleBookmark, isBookmarked } = useBookmarks()

  // URL 유효성 검사
  const isValidUrl = (url: string | undefined): boolean => {
    if (!url) return false
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const [imageUrl, setImageUrl] = useState(isValidUrl(article.imageUrl) ? article.imageUrl : null)
  const [retryCount, setRetryCount] = useState(0)

  const handleSummarize = () => {
    generateSummary(article.title, article.description, article.link, article.id, article.category)
  }

  const handleBookmark = async () => {
    await toggleBookmark({
      id: article.id,
      title: article.title,
      description: article.description,
      link: article.link,
      source: article.source,
      imageUrl: article.imageUrl,
      category: article.category,
      region: article.region,
      pubDate: article.pubDate,
    })
  }

  const handleLinkClick = async () => {
    // 최근 본 기사에 추가
    addRecentArticle({
      id: article.id,
      title: article.title,
      description: article.description,
      link: article.link,
      source: article.source,
      imageUrl: article.imageUrl,
      category: article.category,
      region: article.region,
      pubDate: article.pubDate,
    })

    // 링크 클릭 추적 (백그라운드로 실행, 에러 무시)
    try {
      await fetch("/api/analytics/link-click", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.id || null,
          newsId: article.id,
          title: article.title,
          link: article.link,
          category: article.category,
        }),
      })
    } catch (error) {
      // 추적 실패해도 사용자 경험에 영향 없음
      console.error("Failed to track link click:", error)
    }
  }

  const handleImageError = () => {
    // 첫 번째 실패: 한 번 더 시도
    if (retryCount === 0) {
      console.log(`[v0] Image load failed for ${article.source}, retrying...`)
      setRetryCount(1)
      // 이미지 URL에 timestamp를 추가하여 재시도
      if (article.imageUrl && isValidUrl(article.imageUrl)) {
        setImageUrl(`${article.imageUrl}?retry=1`)
      } else {
        // URL이 유효하지 않으면 바로 로고로 전환
        const logoUrl = getNewsLogo(article.source)
        setImageUrl(logoUrl)
      }
    }
    // 두 번째 실패: 뉴스 소스 로고로 fallback
    else {
      console.log(`[v0] Image load failed again for ${article.source}, using source logo`)
      const logoUrl = getNewsLogo(article.source)
      setImageUrl(logoUrl)
    }
  }

  return (
    <Card className="flex flex-col overflow-hidden transition-all hover:shadow-lg">
      {imageUrl && (
        <div className="relative h-48 w-full overflow-hidden bg-muted">
          <Image
            src={imageUrl}
            alt={article.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={handleImageError}
          />
        </div>
      )}
      <CardHeader>
        <div className="flex items-center justify-between gap-2 mb-2">
          <Badge variant="secondary">{article.source}</Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{timeAgo}</span>
          </div>
        </div>
        <CardTitle className="line-clamp-2 text-balance">{article.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <CardDescription className="line-clamp-3">{article.description}</CardDescription>
        {summary && (
          <div className="mt-4 p-3 bg-muted rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">
                AI 요약 {fromCache && <span className="text-xs text-muted-foreground">(캐시됨)</span>}
              </span>
            </div>
            <p className="text-sm text-foreground mb-2">{summary}</p>
            {keyPoints && keyPoints.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs font-semibold mb-2">핵심 포인트</p>
                <ul className="space-y-1">
                  {keyPoints.map((point, index) => (
                    <li key={index} className="text-xs text-foreground flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1 bg-transparent"
          onClick={handleSummarize}
          disabled={isLoading || !!summary}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {isLoading ? "요약 중..." : summary ? "요약 완료" : "AI 요약"}
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="bg-transparent"
          onClick={handleBookmark}
          disabled={!user}
          title={user ? (isBookmarked(article.id) ? "북마크 해제" : "북마크") : "로그인 필요"}
        >
          {isBookmarked(article.id) ? (
            <BookmarkCheck className="h-4 w-4 fill-current" />
          ) : (
            <Bookmark className="h-4 w-4" />
          )}
        </Button>
        <Button variant="outline" className="flex-1 bg-transparent" asChild>
          <a href={article.link} target="_blank" rel="noopener noreferrer" onClick={handleLinkClick}>
            Read More
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  )
}
