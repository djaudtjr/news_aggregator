"use client"

import { useEffect, useState } from "react"

export interface RecentArticle {
  id: string
  title: string
  description?: string
  link: string
  source?: string
  imageUrl?: string
  category?: string
  region?: string
  pubDate?: string
  viewedAt: string
}

const MAX_RECENT_ARTICLES = 5
const STORAGE_KEY = "recent_articles"

export function useRecentArticles() {
  const [recentArticles, setRecentArticles] = useState<RecentArticle[]>([])

  // 초기 로드
  useEffect(() => {
    loadRecentArticles()
  }, [])

  // 세션 스토리지에서 로드
  const loadRecentArticles = () => {
    if (typeof window === "undefined") return

    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (stored) {
        const articles = JSON.parse(stored) as RecentArticle[]
        setRecentArticles(articles)
      }
    } catch (error) {
      console.error("Failed to load recent articles:", error)
    }
  }

  // 세션 스토리지에 저장
  const saveRecentArticles = (articles: RecentArticle[]) => {
    if (typeof window === "undefined") return

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(articles))
      setRecentArticles(articles)
    } catch (error) {
      console.error("Failed to save recent articles:", error)
    }
  }

  // 기사 추가
  const addRecentArticle = (article: Omit<RecentArticle, "viewedAt">) => {
    const newArticle: RecentArticle = {
      ...article,
      viewedAt: new Date().toISOString(),
    }

    // 기존 기사 제거 (중복 방지)
    const filtered = recentArticles.filter((a) => a.id !== article.id)

    // 최신 기사를 맨 앞에 추가
    const updated = [newArticle, ...filtered].slice(0, MAX_RECENT_ARTICLES)

    saveRecentArticles(updated)
  }

  // 기사 제거
  const removeRecentArticle = (articleId: string) => {
    const updated = recentArticles.filter((a) => a.id !== articleId)
    saveRecentArticles(updated)
  }

  // 전체 삭제
  const clearRecentArticles = () => {
    saveRecentArticles([])
  }

  return {
    recentArticles,
    addRecentArticle,
    removeRecentArticle,
    clearRecentArticles,
  }
}
