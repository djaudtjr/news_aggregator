"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/hooks/useAuth"

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

interface BookmarksContextType {
  bookmarks: Bookmark[]
  bookmarkedIds: Set<string>
  loading: boolean
  addBookmark: (article: {
    id: string
    title: string
    description?: string
    link: string
    source?: string
    imageUrl?: string
    category?: string
    region?: string
    pubDate?: string
  }) => Promise<boolean>
  removeBookmark: (articleId: string) => Promise<boolean>
  toggleBookmark: (article: {
    id: string
    title: string
    description?: string
    link: string
    source?: string
    imageUrl?: string
    category?: string
    region?: string
    pubDate?: string
  }) => Promise<boolean>
  isBookmarked: (articleId: string) => boolean
  refreshBookmarks: () => Promise<void>
}

const BookmarksContext = createContext<BookmarksContextType | undefined>(undefined)

// 북마크 조회 함수
async function fetchBookmarks(userId: string | undefined): Promise<Bookmark[]> {
  if (!userId) return []

  console.log("[BookmarksProvider] Fetching bookmarks for user:", userId)
  const response = await fetch(`/api/bookmarks?userId=${userId}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch bookmarks: ${response.status}`)
  }
  const data = await response.json()
  console.log("[BookmarksProvider] Fetched bookmarks:", data.bookmarks?.length || 0)
  return data.bookmarks || []
}

export function BookmarksProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // React Query로 북마크 데이터 캐싱
  const { data: bookmarks = [], isLoading: loading } = useQuery({
    queryKey: ['bookmarks', user?.id],
    queryFn: () => fetchBookmarks(user?.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5분간 fresh
    gcTime: 10 * 60 * 1000, // 10분간 캐시 유지
    refetchOnWindowFocus: false,
  })

  // 북마크 ID Set 계산 (메모이제이션)
  const bookmarkedIds = new Set(bookmarks.map(b => b.article_id))

  // 북마크 추가 Mutation
  const addBookmarkMutation = useMutation({
    mutationFn: async (article: {
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
      console.log("[BookmarksProvider] Adding bookmark:", article.id, article.title)
      const response = await fetch("/api/bookmarks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.id,
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

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error("ALREADY_BOOKMARKED")
        }
        throw new Error(`Failed to add bookmark: ${response.status}`)
      }
      return response.json()
    },
    onMutate: async (article) => {
      // 낙관적 업데이트: 진행 중인 쿼리 취소
      await queryClient.cancelQueries({ queryKey: ['bookmarks', user?.id] })

      // 이전 데이터 백업
      const previousBookmarks = queryClient.getQueryData<Bookmark[]>(['bookmarks', user?.id])

      // 낙관적으로 새 북마크 추가
      const optimisticBookmark: Bookmark = {
        id: `temp-${Date.now()}`,
        user_id: user?.id || '',
        article_id: article.id,
        title: article.title,
        description: article.description,
        link: article.link,
        source: article.source,
        image_url: article.imageUrl,
        category: article.category,
        region: article.region,
        pub_date: article.pubDate,
        created_at: new Date().toISOString(),
      }

      queryClient.setQueryData<Bookmark[]>(['bookmarks', user?.id], (old = []) => [optimisticBookmark, ...old])

      return { previousBookmarks }
    },
    onError: (error, article, context) => {
      // 에러 시 이전 상태로 롤백
      if (context?.previousBookmarks) {
        queryClient.setQueryData(['bookmarks', user?.id], context.previousBookmarks)
      }
      console.error("[BookmarksProvider] Failed to add bookmark:", error)
      if (error.message !== "ALREADY_BOOKMARKED") {
        alert("북마크 추가에 실패했습니다")
      }
    },
    onSuccess: () => {
      console.log("[BookmarksProvider] Successfully added bookmark")
      // 서버 데이터와 동기화
      queryClient.invalidateQueries({ queryKey: ['bookmarks', user?.id] })
    },
  })

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
      alert("로그인이 필요합니다")
      return false
    }

    try {
      await addBookmarkMutation.mutateAsync(article)
      return true
    } catch (error: any) {
      if (error.message === "ALREADY_BOOKMARKED") {
        console.warn("[BookmarksProvider] Already bookmarked")
        return false
      }
      return false
    }
  }

  // 북마크 삭제 Mutation
  const removeBookmarkMutation = useMutation({
    mutationFn: async (articleId: string) => {
      console.log("[BookmarksProvider] Removing bookmark:", articleId)
      const response = await fetch(`/api/bookmarks?userId=${user?.id}&articleId=${articleId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`Failed to remove bookmark: ${response.status}`)
      }
      return response.json()
    },
    onMutate: async (articleId) => {
      // 낙관적 업데이트: 진행 중인 쿼리 취소
      await queryClient.cancelQueries({ queryKey: ['bookmarks', user?.id] })

      // 이전 데이터 백업
      const previousBookmarks = queryClient.getQueryData<Bookmark[]>(['bookmarks', user?.id])

      // 낙관적으로 북마크 삭제
      queryClient.setQueryData<Bookmark[]>(['bookmarks', user?.id], (old = []) =>
        old.filter(b => b.article_id !== articleId)
      )

      return { previousBookmarks }
    },
    onError: (error, articleId, context) => {
      // 에러 시 이전 상태로 롤백
      if (context?.previousBookmarks) {
        queryClient.setQueryData(['bookmarks', user?.id], context.previousBookmarks)
      }
      console.error("[BookmarksProvider] Failed to remove bookmark:", error)
      alert("북마크 삭제에 실패했습니다")
    },
    onSuccess: () => {
      console.log("[BookmarksProvider] Successfully removed bookmark")
      // 서버 데이터와 동기화
      queryClient.invalidateQueries({ queryKey: ['bookmarks', user?.id] })
    },
  })

  const removeBookmark = async (articleId: string) => {
    if (!user) {
      console.warn("User not logged in")
      return false
    }

    try {
      await removeBookmarkMutation.mutateAsync(articleId)
      return true
    } catch (error) {
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
    if (!user) {
      alert("먼저 로그인 해주세요")
      return false
    }

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

  const value: BookmarksContextType = {
    bookmarks,
    bookmarkedIds,
    loading,
    addBookmark,
    removeBookmark,
    toggleBookmark,
    isBookmarked,
    refreshBookmarks: async () => {
      await queryClient.invalidateQueries({ queryKey: ['bookmarks', user?.id] })
    },
  }

  return <BookmarksContext.Provider value={value}>{children}</BookmarksContext.Provider>
}

export function useBookmarks() {
  const context = useContext(BookmarksContext)
  if (context === undefined) {
    throw new Error("useBookmarks must be used within a BookmarksProvider")
  }
  return context
}
