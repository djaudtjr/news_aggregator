"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "./useAuth"
import { supabase } from "@/lib/supabase/client"

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
      const { data, error } = await supabase
        .from("subscribed_keywords")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Failed to fetch keywords:", error)
      } else {
        setKeywords(data || [])
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
      alert("로그인이 필요합니다.")
      return false
    }

    const normalizedKeyword = keyword.trim()

    if (!normalizedKeyword) {
      alert("키워드를 입력해주세요.")
      return false
    }

    // 최대 3개 체크
    if (keywords.length >= 3) {
      alert("구독 키워드는 최대 3개까지만 추가할 수 있습니다.")
      return false
    }

    try {
      const { data, error } = await supabase
        .from("subscribed_keywords")
        .insert({
          user_id: user.id,
          keyword: normalizedKeyword,
        })
        .select()
        .single()

      if (error) {
        // 중복 키워드 체크 (UNIQUE 제약 위반)
        if (error.code === "23505") {
          alert("이미 구독 중인 키워드입니다.")
          return false
        }

        console.error("Failed to add keyword:", error)
        alert("키워드 추가에 실패했습니다.")
        return false
      }

      await fetchKeywords() // 목록 새로고침
      return true
    } catch (error) {
      console.error("Failed to add keyword:", error)
      alert("키워드 추가 중 오류가 발생했습니다.")
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
      const { error } = await supabase
        .from("subscribed_keywords")
        .delete()
        .eq("user_id", user.id)
        .eq("id", keywordId)

      if (error) {
        console.error("Failed to remove keyword:", error)
        return false
      }

      await fetchKeywords() // 목록 새로고침
      return true
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
