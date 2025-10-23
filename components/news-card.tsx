"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ExternalLink, Clock, Sparkles } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Image from "next/image"
import { useArticleSummary } from "@/hooks/useArticleSummary"
import { getNewsLogo } from "@/lib/utils/news-logos"
import type { NewsArticle } from "@/types/article"

interface NewsCardProps {
  article: NewsArticle
  isSelected: boolean
  onToggleSelection: (id: string) => void
}

export function NewsCard({ article, isSelected, onToggleSelection }: NewsCardProps) {
  const timeAgo = formatDistanceToNow(new Date(article.pubDate), { addSuffix: true })
  const { summary, keyPoints, isLoading, fromCache, generateSummary } = useArticleSummary()
  const [imageUrl, setImageUrl] = useState(article.imageUrl)
  const [retryCount, setRetryCount] = useState(0)

  const handleSummarize = () => {
    generateSummary(article.title, article.description, article.link, article.id)
  }

  const handleImageError = () => {
    // 첫 번째 실패: 한 번 더 시도
    if (retryCount === 0) {
      console.log(`[v0] Image load failed for ${article.source}, retrying...`)
      setRetryCount(1)
      // 이미지 URL에 timestamp를 추가하여 재시도
      if (article.imageUrl) {
        setImageUrl(`${article.imageUrl}?retry=1`)
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
    <Card className="flex flex-col overflow-hidden transition-all hover:shadow-lg relative">
      <div className="absolute top-3 left-3 z-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelection(article.id)}
          className="bg-background border-2"
        />
      </div>
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
        <Button variant="outline" className="flex-1 bg-transparent" asChild>
          <a href={article.link} target="_blank" rel="noopener noreferrer">
            Read More
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  )
}
