"use client"

import { History, X, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRecentArticles, type RecentArticle } from "@/hooks/useRecentArticles"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"

interface RecentArticlesProps {
  onArticleClick?: (article: RecentArticle) => void
}

export function RecentArticles({ onArticleClick }: RecentArticlesProps) {
  const { recentArticles, removeRecentArticle, clearRecentArticles } = useRecentArticles()

  const handleArticleClick = (article: RecentArticle) => {
    if (onArticleClick) {
      onArticleClick(article)
    } else {
      // 기본 동작: 새 탭에서 링크 열기
      window.open(article.link, "_blank", "noopener,noreferrer")
    }
  }

  const handleRemove = (e: React.MouseEvent, articleId: string) => {
    e.stopPropagation()
    removeRecentArticle(articleId)
  }

  const handleClearAll = () => {
    if (confirm("최근 본 기사를 모두 삭제하시겠습니까?")) {
      clearRecentArticles()
    }
  }

  if (recentArticles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5" />
            <CardTitle>최근 본 기사</CardTitle>
          </div>
          <CardDescription>아직 본 기사가 없습니다</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <CardTitle>최근 본 기사</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClearAll} title="전체 삭제">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>{recentArticles.length}개의 기사</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {recentArticles.map((article) => (
            <div
              key={article.id}
              className="group relative rounded-lg border p-3 hover:bg-accent cursor-pointer transition-colors"
              onClick={() => handleArticleClick(article)}
            >
              <div className="flex gap-3">
                {article.imageUrl && (
                  <div className="shrink-0">
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-16 h-16 object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.style.display = "none"
                      }}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium line-clamp-2 mb-1">{article.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {article.source && <span>{article.source}</span>}
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(article.viewedAt), { addSuffix: true, locale: ko })}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => handleRemove(e, article.id)}
                  title="삭제"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
