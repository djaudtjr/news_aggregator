"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "./useAuth"

export interface Bookmark {
  id: string
  user_id: string
  article_id: string
  title: string
  description?: string
  link: string
  source?: string
  image_url?: string
  category?: string
  region?: string
  pub_date?: string
  created_at: string
}

export function useBookmarks() {
  const { user } = useAuth()
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  // 북마크 목록 불러오기
  const fetchBookmarks = useCallback(async () => {
    if (!user) {
      setBookmarks([])
      setBookmarkedIds(new Set())
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/bookmarks?userId=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setBookmarks(data.bookmarks || [])
        setBookmarkedIds(new Set(data.bookmarks?.map((b: Bookmark) => b.article_id) || []))
      }
    } catch (error) {
      console.error("Failed to fetch bookmarks:", error)
    } finally {
      setLoading(false)
    }
  }, [user])

  // 초기 로드
  useEffect(() => {
    fetchBookmarks()
  }, [fetchBookmarks])

  // 북마크 추가
  const addBookmark = async (article: {
    id: string
    title: string
    description?: string
    link: string
    source?: string
    imageUrl?: string
    category?: string
    region?: string
    pubDate?: string
  }) => {
    if (!user) {
      console.warn("User not logged in")
      return false
    }

    try {
      const response = await fetch("/api/bookmarks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          articleId: article.id,
          title: article.title,
          description: article.description,
          link: article.link,
          source: article.source,
          imageUrl: article.imageUrl,
          category: article.category,
          region: article.region,
          pubDate: article.pubDate,
        }),
      })

      if (response.ok) {
        await fetchBookmarks() // 목록 새로고침
        return true
      } else if (response.status === 409) {
        console.warn("Already bookmarked")
        return false
      } else {
        console.error("Failed to add bookmark")
        return false
      }
    } catch (error) {
      console.error("Failed to add bookmark:", error)
      return false
    }
  }

  // 북마크 삭제
  const removeBookmark = async (articleId: string) => {
    if (!user) {
      console.warn("User not logged in")
      return false
    }

    try {
      const response = await fetch(`/api/bookmarks?userId=${user.id}&articleId=${articleId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchBookmarks() // 목록 새로고침
        return true
      } else {
        console.error("Failed to remove bookmark")
        return false
      }
    } catch (error) {
      console.error("Failed to remove bookmark:", error)
      return false
    }
  }

  // 북마크 토글
  const toggleBookmark = async (article: {
    id: string
    title: string
    description?: string
    link: string
    source?: string
    imageUrl?: string
    category?: string
    region?: string
    pubDate?: string
  }) => {
    if (bookmarkedIds.has(article.id)) {
      return await removeBookmark(article.id)
    } else {
      return await addBookmark(article)
    }
  }

  // 북마크 여부 확인
  const isBookmarked = (articleId: string) => {
    return bookmarkedIds.has(articleId)
  }

  return {
    bookmarks,
    loading,
    addBookmark,
    removeBookmark,
    toggleBookmark,
    isBookmarked,
    refreshBookmarks: fetchBookmarks,
  }
}
