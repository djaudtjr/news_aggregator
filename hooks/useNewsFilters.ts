import { useState, useCallback } from "react"
import type { NewsCategory, NewsRegion } from "@/types/article"

/**
 * 뉴스 필터 상태 관리 커스텀 훅
 * 카테고리, 지역, 검색어, 시간 범위 필터를 통합 관리
 */
export function useNewsFilters() {
  const [activeCategory, setActiveCategory] = useState<NewsCategory>("all")
  const [activeRegion, setActiveRegion] = useState<NewsRegion>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [timeRange, setTimeRange] = useState(7) // 기본 7일
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  /**
   * 새로고침 트리거
   */
  const refresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1)
  }, [])

  /**
   * 모든 필터 초기화
   */
  const resetFilters = useCallback(() => {
    setActiveCategory("all")
    setActiveRegion("all")
    setSearchQuery("")
    setTimeRange(7)
  }, [])

  return {
    // 상태
    activeCategory,
    activeRegion,
    searchQuery,
    timeRange,
    refreshTrigger,

    // 상태 변경 함수
    setActiveCategory,
    setActiveRegion,
    setSearchQuery,
    setTimeRange,

    // 유틸리티 함수
    refresh,
    resetFilters,
  }
}
