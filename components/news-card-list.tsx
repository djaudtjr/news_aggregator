"use client"

import { useState, memo, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ExternalLink, Clock, Sparkles, Bookmark, BookmarkCheck } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"
import Image from "next/image"
import { useArticleSummary } from "@/hooks/useArticleSummary"
import { useAuth } from "@/hooks/useAuth"
import { useRecentArticles } from "@/hooks/useRecentArticles"
import { useBookmarks } from "@/hooks/useBookmarks"
import { getNewsLogo } from "@/lib/utils/news-logos"
import type { NewsArticle } from "@/types/article"

interface NewsCardListProps {
  article: NewsArticle
}

function NewsCardListComponent({ article }: NewsCardListProps) {
  const timeAgo = formatDistanceToNow(new Date(article.pubDate), { addSuffix: true, locale: ko })
  const { user } = useAuth()
  const { summary, keyPoints, isLoading, fromCache, generateSummary } = useArticleSummary(article.id)
  const { addRecentArticle } = useRecentArticles()
  const { toggleBookmark, isBookmarked } = useBookmarks()

  // Modal 상태 관리
  const [isModalOpen, setIsModalOpen] = useState(false)
  const previousSummaryRef = useRef<string | null>(null)

  // 요약이 완료되면 자동으로 Modal 열기
  useEffect(() => {
    if (summary && !fromCache && previousSummaryRef.current !== summary) {
      setIsModalOpen(true)
      previousSummaryRef.current = summary
    }
  }, [summary, fromCache])

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
    // AI 요약 생성
    generateSummary(article.title, article.description, article.link, article.id, article.category)

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

    // 링크 클릭 추적
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
      console.error("Failed to track link click:", error)
    }
  }

  const handleImageError = () => {
    if (retryCount === 0) {
      setRetryCount(1)
      if (article.imageUrl && isValidUrl(article.imageUrl)) {
        setImageUrl(`${article.imageUrl}?retry=1`)
      } else {
        const logoUrl = getNewsLogo(article.source)
        setImageUrl(logoUrl)
      }
    } else {
      const logoUrl = getNewsLogo(article.source)
      setImageUrl(logoUrl)
    }
  }

  return (
    <>
    <Card className="flex flex-row overflow-hidden transition-all hover:shadow-lg">
      {imageUrl && (
        <div className="relative w-48 shrink-0 overflow-hidden bg-muted">
          <Image
            src={imageUrl}
            alt={article.title}
            fill
            className="object-cover"
            sizes="192px"
            onError={handleImageError}
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
          />
          {/* 북마크 버튼을 이미지 위에 배치 */}
          <Button
            variant="secondary"
            size="icon"
            className={`absolute top-2 right-2 backdrop-blur-sm shadow-md transition-all ${
              isBookmarked(article.id)
                ? "bg-yellow-400 hover:bg-yellow-500 text-yellow-900"
                : "bg-background/80 hover:bg-background/90"
            }`}
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
        </div>
      )}
      <div className="flex flex-col flex-1">
        <CardHeader>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{article.source}</Badge>
              {article.category && article.category !== "all" && <Badge variant="outline">{article.category}</Badge>}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{timeAgo}</span>
            </div>
          </div>
          <CardTitle className="line-clamp-2 text-balance">{article.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          <CardDescription className="line-clamp-2">{article.description}</CardDescription>
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
        <CardFooter className="flex flex-col gap-2">
          {/* AI 요약 버튼 - 전체 너비 */}
          <Button
            variant="outline"
            className="w-full bg-transparent"
            onClick={handleSummarize}
            disabled={isLoading || !!summary}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {isLoading ? "요약 중..." : summary ? "요약 완료" : "AI 요약"}
          </Button>
          {/* Read More 버튼 - 전체 너비 */}
          <Button variant="default" className="w-full" asChild>
            <a href={article.link} target="_blank" rel="noopener noreferrer" onClick={handleLinkClick}>
              <ExternalLink className="mr-2 h-4 w-4" />
              원문 보기
            </a>
          </Button>
        </CardFooter>
      </div>
    </Card>

    {/* AI 요약 모달 Dialog */}
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent className="sm:max-w-3xl max-w-[90vw] max-h-[80vh] overflow-y-auto rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span>AI 요약</span>
            {fromCache && <Badge variant="secondary">캐시됨</Badge>}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {article.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* 요약 내용 */}
          <div>
            <h3 className="font-semibold text-sm mb-2">📝 요약</h3>
            <p className="text-sm leading-relaxed">{summary}</p>
          </div>

          {/* 핵심 포인트 */}
          {keyPoints && keyPoints.length > 0 && (
            <div className="pt-4 border-t">
              <h3 className="font-semibold text-sm mb-3">💡 핵심 포인트</h3>
              <ul className="space-y-2">
                {keyPoints.map((point, index) => (
                  <li key={index} className="text-sm flex items-start gap-3">
                    <span className="text-primary font-bold mt-0.5">{index + 1}.</span>
                    <span className="flex-1">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 원문 보기 버튼 */}
          <div className="pt-4 border-t">
            <Button variant="default" className="w-full transition-all duration-300 hover:scale-105 rounded-xl shadow-md hover:shadow-lg" asChild>
              <a href={article.link} target="_blank" rel="noopener noreferrer" onClick={handleLinkClick}>
                <ExternalLink className="mr-2 h-4 w-4" />
                원문 보기
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </>
  )
}

// 메모이제이션: article.id가 변경되지 않으면 리렌더링하지 않음
export const NewsCardList = memo(NewsCardListComponent, (prevProps, nextProps) => {
  return prevProps.article.id === nextProps.article.id
})
