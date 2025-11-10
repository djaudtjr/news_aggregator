import { useState, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useAuth } from "./useAuth"
import { useToast } from "./use-toast"
import type { NewsArticle } from "@/types/article"

// 카테고리 코드를 한글 라벨로 변환하는 맵
const CATEGORY_LABELS: Record<string, string> = {
  all: "전체",
  world: "세계",
  politics: "정치",
  business: "비즈니스",
  technology: "기술",
  science: "과학",
  health: "건강",
  sports: "스포츠",
  entertainment: "엔터테인먼트",
}

/**
 * 기사 AI 요약 커스텀 훅
 * 전문 크롤링 + OpenAI API + Supabase 저장/조회
 */
export function useArticleSummary(newsId: string) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [summary, setSummary] = useState<string | null>(null)
  const [keyPoints, setKeyPoints] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fromCache, setFromCache] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingMessage, setLoadingMessage] = useState("")
  const [isBackgroundMode, setIsBackgroundMode] = useState(false) // 백그라운드 모드 상태

  // 컴포넌트 마운트 시 기존 요약 불러오기
  useEffect(() => {
    if (newsId) {
      loadExistingSummary()
    }
  }, [newsId])

  /**
   * 기존 요약 불러오기 (캐시 확인)
   */
  const loadExistingSummary = async () => {
    if (!newsId) return

    try {
      const response = await fetch(`/api/summary/${newsId}`)
      if (response.ok) {
        const data = await response.json()
        // 유효한 요약만 로드 (에러 메시지는 제외)
        if (data.summary && data.summary !== "요약을 생성할 수 없습니다.") {
          setSummary(data.summary)
          setKeyPoints(data.keyPoints || [])
          setFromCache(true)
        }
      }
    } catch (err) {
      // 기존 요약이 없으면 무시
      console.log(`[v0] No cached summary for ${newsId}`)
    }
  }

  /**
   * 기사 요약 생성 (전문 크롤링 + DB 캐싱)
   */
  const generateSummary = async (
    title: string,
    description: string,
    link: string,
    newsId: string,
    category?: string,
    background: boolean = false // 백그라운드 모드 플래그
  ) => {
    // API 키 확인 (localStorage 또는 환경변수)
    const apiKey = localStorage.getItem("openai_api_key")

    setIsLoading(true)
    setError(null)
    setFromCache(false)
    setIsBackgroundMode(background) // 백그라운드 모드 상태 설정

    // 백그라운드 모드가 아닐 때만 로딩 UI 업데이트
    if (!background) {
      setLoadingProgress(0)
      setLoadingMessage("기사 내용을 가져오는 중...")
    }

    try {
      // 진행률 시뮬레이션 (백그라운드 모드가 아닐 때만)
      let progressInterval: NodeJS.Timeout | null = null
      let messageTimeout: NodeJS.Timeout | null = null

      if (!background) {
        progressInterval = setInterval(() => {
          setLoadingProgress(prev => {
            if (prev < 90) return prev + 10
            return prev
          })
        }, 500)

        messageTimeout = setTimeout(() => setLoadingMessage("AI가 요약을 생성하는 중..."), 1500)
      }

      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          link,
          newsId,
          category,
          apiKey,
          userId: user?.id || null, // 로그인한 사용자 ID 전달 (비로그인은 null -> 'Anonymous')
          background, // 백그라운드 모드 플래그 전달
        }),
      })

      if (!background) {
        if (progressInterval) clearInterval(progressInterval)
        if (messageTimeout) clearTimeout(messageTimeout)
        setLoadingProgress(100)
        setLoadingMessage("요약 완료!")
      }

      if (!response.ok) {
        throw new Error("Failed to summarize")
      }

      const data = await response.json()
      setSummary(data.summary)
      setKeyPoints(data.keyPoints || [])
      setFromCache(data.fromCache || false)

      if (data.fromCache) {
        console.log(`[v0] Summary loaded from cache (viewed ${data.viewCount} times)`)
      }

      // AI가 카테고리를 재분류했으면 React Query 캐시 업데이트 (즉시 반영)
      if (data.category) {
        console.log(`[v0] Updating category to "${data.category}" for article ${newsId}`)

        // 카테고리가 변경되었는지 확인
        const categoryChanged = category && data.category !== category

        if (categoryChanged) {
          const oldCategoryLabel = CATEGORY_LABELS[category] || category
          const newCategoryLabel = CATEGORY_LABELS[data.category] || data.category

          // 카테고리 변경 알림 표시
          toast({
            title: "📂 카테고리 재분류",
            description: `${oldCategoryLabel} → ${newCategoryLabel}`,
            duration: 3000,
          })

          console.log(`[v0] Category changed: ${category} → ${data.category}`)
        }

        // 모든 'news' 쿼리 캐시를 찾아서 업데이트
        const queries = queryClient.getQueriesData<{ articles: NewsArticle[] }>({
          queryKey: ['news']
        })

        console.log(`[v0] Found ${queries.length} news queries to update`)

        queries.forEach(([queryKey, queryData]) => {
          if (queryData?.articles) {
            const updatedArticles = queryData.articles.map((article) =>
              article.id === newsId
                ? { ...article, category: data.category }
                : article
            )

            // 실제로 변경된 경우에만 업데이트
            const hasChanges = updatedArticles.some(
              (article, idx) => article !== queryData.articles[idx]
            )

            if (hasChanges) {
              queryClient.setQueryData(queryKey, {
                ...queryData,
                articles: updatedArticles
              })
              console.log(`[v0] Updated query:`, queryKey)
            }
          }
        })

        console.log(`[v0] Category updated in cache, filter will now work without refresh`)
      }
    } catch (err) {
      console.error("[v0] Error summarizing article:", err)
      const errorMessage = "요약을 생성하는데 실패했습니다."
      setSummary(errorMessage)
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 요약 초기화
   */
  const resetSummary = () => {
    setSummary(null)
    setKeyPoints([])
    setError(null)
    setIsLoading(false)
    setFromCache(false)
  }

  return {
    summary,
    keyPoints,
    isLoading,
    error,
    fromCache,
    loadingProgress,
    loadingMessage,
    isBackgroundMode,
    generateSummary,
    resetSummary,
  }
}
