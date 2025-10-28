"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, ExternalLink, Bookmark, BookmarkCheck } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"
import { useRecentArticles } from "@/hooks/useRecentArticles"
import { useAuth } from "@/hooks/useAuth"
import { useBookmarks } from "@/hooks/useBookmarks"
import type { NewsArticle } from "@/types/article"

interface NewsCardCompactProps {
  article: NewsArticle
}

export function NewsCardCompact({ article }: NewsCardCompactProps) {
  const timeAgo = formatDistanceToNow(new Date(article.pubDate), { addSuffix: true, locale: ko })
  const { addRecentArticle } = useRecentArticles()
  const { user } = useAuth()
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

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation() // 카드 클릭 이벤트 전파 방지
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

  const handleClick = async () => {
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

    // 새 탭에서 링크 열기
    window.open(article.link, "_blank", "noopener,noreferrer")
  }

  return (
    <div
      className="group flex items-center gap-4 rounded-lg border p-3 hover:bg-accent cursor-pointer transition-colors"
      onClick={handleClick}
    >
      {isValidUrl(article.imageUrl) && (
        <div className="relative shrink-0">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-20 h-20 object-cover rounded"
            onError={(e) => {
              e.currentTarget.style.display = "none"
            }}
          />
          {/* 이미지 위에 북마크 버튼 */}
          <Button
            variant="secondary"
            size="icon"
            className={`absolute -top-1 -right-1 h-6 w-6 backdrop-blur-sm shadow-md transition-all ${
              isBookmarked(article.id)
                ? "bg-yellow-400 hover:bg-yellow-500 text-yellow-900 opacity-100"
                : "bg-background/90 hover:bg-background opacity-0 group-hover:opacity-100"
            }`}
            onClick={handleBookmark}
            disabled={!user}
            title={user ? (isBookmarked(article.id) ? "북마크 해제" : "북마크") : "로그인 필요"}
          >
            {isBookmarked(article.id) ? (
              <BookmarkCheck className="h-3 w-3 fill-current" />
            ) : (
              <Bookmark className="h-3 w-3" />
            )}
          </Button>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="secondary" className="text-xs">
            {article.source}
          </Badge>
          {article.category && article.category !== "all" && (
            <Badge variant="outline" className="text-xs">
              {article.category}
            </Badge>
          )}
        </div>
        <h3 className="font-medium line-clamp-2 mb-1 text-sm">{article.title}</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{timeAgo}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {/* 이미지 없을 때만 북마크 버튼 표시 */}
        {!isValidUrl(article.imageUrl) && (
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 transition-all ${
              isBookmarked(article.id)
                ? "text-yellow-500 hover:text-yellow-600 opacity-100"
                : "opacity-0 group-hover:opacity-100"
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
        )}
        <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  )
}
