import { useState } from "react"
import { useAuth } from "./useAuth"

/**
 * 기사 AI 요약 커스텀 훅
 * 전문 크롤링 + OpenAI API + Supabase 저장/조회
 */
export function useArticleSummary() {
  const { user } = useAuth()
  const [summary, setSummary] = useState<string | null>(null)
  const [keyPoints, setKeyPoints] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fromCache, setFromCache] = useState(false)

  /**
   * 기사 요약 생성 (전문 크롤링 + DB 캐싱)
   */
  const generateSummary = async (title: string, description: string, link: string, newsId: string) => {
    // API 키 확인 (localStorage 또는 환경변수)
    const apiKey = localStorage.getItem("openai_api_key")

    setIsLoading(true)
    setError(null)
    setFromCache(false)

    try {
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
          apiKey,
          userId: user?.id || null, // 로그인한 사용자 ID 전달 (비로그인은 null -> 'Anonymous')
        }),
      })

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
    generateSummary,
    resetSummary,
  }
}
