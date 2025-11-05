"use client"

import { useState, memo } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ExternalLink, Clock, Sparkles, Bookmark, BookmarkCheck, ChevronDown, ChevronUp, Maximize2 } from "lucide-react"
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

function NewsCardComponent({ article }: NewsCardProps) {
  const timeAgo = formatDistanceToNow(new Date(article.pubDate), { addSuffix: true })
  const { user } = useAuth()
  const { summary, keyPoints, isLoading, fromCache, loadingProgress, loadingMessage, generateSummary } = useArticleSummary(article.id)
  const { addRecentArticle } = useRecentArticles()
  const { toggleBookmark, isBookmarked } = useBookmarks()

  // AI 요약 UI 상태 관리
  const [isExpanded, setIsExpanded] = useState(false) // 접힘/펼침 상태
  const [isModalOpen, setIsModalOpen] = useState(false) // 모달 열림/닫힘 상태

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
    <>
    <Card className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] rounded-2xl">
      {imageUrl && (
        <div className="relative h-40 w-full overflow-hidden bg-muted">
          <Image
            src={imageUrl}
            alt={article.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={handleImageError}
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
          />
          {/* 북마크 버튼을 이미지 위에 배치 */}
          <Button
            variant="secondary"
            size="icon"
            className={`absolute top-2 right-2 backdrop-blur-sm shadow-lg transition-all duration-300 hover:scale-110 rounded-full ${
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
        <CardDescription className="line-clamp-2">{article.description}</CardDescription>
        {/* 요약이 완료되고 펼쳐진 상태일 때만 표시 */}
        {summary && isExpanded && (
          <div className="mt-4 p-4 bg-muted rounded-2xl border shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">
                  AI 요약 {fromCache && <span className="text-xs text-muted-foreground">(캐시됨)</span>}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(false)}
                className="h-6 w-6 shrink-0"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
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
        {/* AI 요약 버튼 */}
        {summary ? (
          // 요약 완료 상태: Popup 아이콘 + 요약완료 버튼
          <div className="flex items-center gap-2 w-full">
            {/* Popover로 감싼 Popup 아이콘 - 마우스 오버 시 요약 내용 표시 */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 transition-all duration-300 hover:scale-110 rounded-full shadow-md hover:shadow-lg"
                  onClick={() => setIsModalOpen(true)}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 max-h-96 overflow-y-auto rounded-2xl shadow-2xl">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h4 className="font-semibold text-sm">AI 요약</h4>
                    {fromCache && <span className="text-xs text-muted-foreground">(캐시됨)</span>}
                  </div>
                  <p className="text-sm">{summary}</p>
                  {keyPoints && keyPoints.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs font-semibold mb-2">핵심 포인트</p>
                      <ul className="space-y-1">
                        {keyPoints.map((point, index) => (
                          <li key={index} className="text-xs flex items-start gap-2">
                            <span className="text-primary">•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* 요약완료 버튼 - 열고닫기 아이콘 */}
            <Button
              variant="outline"
              className="flex-1 bg-transparent transition-all duration-300 hover:scale-105 rounded-xl"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              <span>요약 완료</span>
              {isExpanded ? (
                <ChevronUp className="ml-2 h-4 w-4" />
              ) : (
                <ChevronDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          </div>
        ) : (
          // 요약 전 또는 로딩 중
          <Button
            variant="outline"
            className="w-full bg-transparent transition-all duration-300 hover:scale-105 rounded-xl shadow-md hover:shadow-lg"
            onClick={handleSummarize}
            disabled={isLoading}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {isLoading ? (
              <div className="flex flex-col items-center gap-1 w-full">
                <span>{loadingMessage}</span>
                <span className="text-xs text-muted-foreground">{loadingProgress}%</span>
              </div>
            ) : (
              "AI 요약"
            )}
          </Button>
        )}

        {/* Read More 버튼 - 전체 너비 */}
        <Button variant="default" className="w-full transition-all duration-300 hover:scale-105 rounded-xl shadow-md hover:shadow-lg" asChild>
          <a href={article.link} target="_blank" rel="noopener noreferrer" onClick={handleLinkClick}>
            <ExternalLink className="mr-2 h-4 w-4" />
            원문 보기
          </a>
        </Button>
      </CardFooter>
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
export const NewsCard = memo(NewsCardComponent, (prevProps, nextProps) => {
  return prevProps.article.id === nextProps.article.id
})
