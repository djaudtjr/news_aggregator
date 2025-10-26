"use client"

import { useState, useEffect } from "react"

export type LayoutMode = "grid" | "list" | "compact"

const STORAGE_KEY = "news_layout_mode"

export function useLayoutMode() {
  const [layoutMode, setLayoutModeState] = useState<LayoutMode>("grid")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // 로컬 스토리지에서 레이아웃 모드 로드
    const stored = localStorage.getItem(STORAGE_KEY) as LayoutMode | null
    if (stored && ["grid", "list", "compact"].includes(stored)) {
      setLayoutModeState(stored)
    }
  }, [])

  const setLayoutMode = (mode: LayoutMode) => {
    setLayoutModeState(mode)
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, mode)
    }
  }

  return {
    layoutMode: mounted ? layoutMode : "grid",
    setLayoutMode,
  }
}
