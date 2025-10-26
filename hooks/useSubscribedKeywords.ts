"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "./useAuth"

export interface SubscribedKeyword {
  id: string
  user_id: string
  keyword: string
  created_at: string
}

export function useSubscribedKeywords() {
  const { user } = useAuth()
  const [keywords, setKeywords] = useState<SubscribedKeyword[]>([])
  const [loading, setLoading] = useState(false)

  // 키워드 목록 불러오기
  const fetchKeywords = useCallback(async () => {
    if (!user) {
      setKeywords([])
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/subscriptions/keywords?userId=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setKeywords(data.keywords || [])
      }
    } catch (error) {
      console.error("Failed to fetch keywords:", error)
    } finally {
      setLoading(false)
    }
  }, [user])

  // 초기 로드
  useEffect(() => {
    fetchKeywords()
  }, [fetchKeywords])

  // 키워드 추가
  const addKeyword = async (keyword: string) => {
    if (!user) {
      console.warn("User not logged in")
      return false
    }

    try {
      const response = await fetch("/api/subscriptions/keywords", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          keyword,
        }),
      })

      if (response.ok) {
        await fetchKeywords() // 목록 새로고침
        return true
      } else if (response.status === 409) {
        console.warn("Keyword already subscribed")
        return false
      } else {
        console.error("Failed to add keyword")
        return false
      }
    } catch (error) {
      console.error("Failed to add keyword:", error)
      return false
    }
  }

  // 키워드 삭제
  const removeKeyword = async (keywordId: string) => {
    if (!user) {
      console.warn("User not logged in")
      return false
    }

    try {
      const response = await fetch(`/api/subscriptions/keywords?userId=${user.id}&keywordId=${keywordId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchKeywords() // 목록 새로고침
        return true
      } else {
        console.error("Failed to remove keyword")
        return false
      }
    } catch (error) {
      console.error("Failed to remove keyword:", error)
      return false
    }
  }

  return {
    keywords,
    loading,
    addKeyword,
    removeKeyword,
    refreshKeywords: fetchKeywords,
  }
}
