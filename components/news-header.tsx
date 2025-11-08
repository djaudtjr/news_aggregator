"use client"
import { useState, useEffect } from "react"
import { Search, Menu, Radio, RefreshCw, LogIn, LogOut, User, HelpCircle, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LoginModal } from "@/components/auth/login-modal"
import { UserGuideModal } from "@/components/user-guide-modal"
import { useAuth } from "@/hooks/useAuth"
import Link from "next/link"

interface NewsHeaderProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  onRefresh: () => void
  onSearchTracked?: () => void
  activeRegion: string
  onRegionChange: (region: string) => void
  timeRange: number
  onTimeRangeChange: (days: number) => void
  hasUnsavedChanges?: boolean
  onLogoutAttempt?: () => void
  hideSearchBar?: boolean
  isLoading?: boolean
}

export function NewsHeader({
  searchQuery,
  onSearchChange,
  onRefresh,
  onSearchTracked,
  activeRegion,
  onRegionChange,
  timeRange,
  onTimeRangeChange,
  hasUnsavedChanges,
  onLogoutAttempt,
  hideSearchBar = false,
  isLoading = false,
}: NewsHeaderProps) {
  const [inputValue, setInputValue] = useState(searchQuery)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false)
  const [correctedKeyword, setCorrectedKeyword] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const { user, signOut } = useAuth()

  const regions = [
    { value: "all", label: "전체" },
    { value: "domestic", label: "국내" },
    { value: "international", label: "해외" },
  ]

  const timeRanges = [
    { value: "0.042", label: "1 Hour" },
    { value: "1", label: "1 Day" },
    { value: "7", label: "7 Days" },
    { value: "30", label: "30 Days" },
  ]

  // searchQuery가 외부에서 변경되면 inputValue도 동기화 (예: 새로고침)
  useEffect(() => {
    if (searchQuery === "") {
      setInputValue("")
    }
  }, [searchQuery])

  // 로딩 완료 시 잠시 성공 아이콘 표시
  useEffect(() => {
    if (!isLoading && searchQuery) {
      setShowSuccess(true)
      const timer = setTimeout(() => {
        setShowSuccess(false)
      }, 2000) // 2초 동안 표시
      return () => clearTimeout(timer)
    } else {
      setShowSuccess(false)
    }
  }, [isLoading, searchQuery])

  const handleSearch = async (keyword: string) => {
    if (!keyword || keyword.trim().length === 0) {
      onSearchChange("")
      setCorrectedKeyword(null)
      return
    }

    const trimmedKeyword = keyword.trim()

    // 1. 오타 교정 확인
    try {
      const spellcheckResponse = await fetch("/api/spellcheck", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          keyword: trimmedKeyword,
        }),
      })

      if (spellcheckResponse.ok) {
        const spellcheckData = await spellcheckResponse.json()

        if (spellcheckData.hasTypo) {
          // 오타가 있으면 수정된 검색어로 검색
          const finalKeyword = spellcheckData.corrected
          setCorrectedKeyword(finalKeyword)
          setInputValue(finalKeyword) // 입력창도 수정된 검색어로 업데이트

          // 2. 수정된 검색어로 검색 실행
          onSearchChange(finalKeyword)

          // 3. 검색 키워드 통계 기록 (수정된 검색어로)
          await fetch("/api/analytics/search-keyword", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: user?.id || null,
              keyword: finalKeyword,
            }),
          })

          // 4. 인기 검색어 업데이트 트리거
          if (onSearchTracked) {
            setTimeout(() => {
              onSearchTracked()
            }, 200)
          }
          return
        }
      }
    } catch (error) {
      console.error("Spellcheck failed, proceeding with original keyword:", error)
    }

    // 오타가 없거나 spellcheck 실패 시 원본 검색어로 진행
    setCorrectedKeyword(null)

    // 2. 검색 실행
    onSearchChange(trimmedKeyword)

    // 3. 검색 키워드 통계 기록 (백그라운드로 비동기 실행)
    try {
      await fetch("/api/analytics/search-keyword", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.id || null,
          keyword: trimmedKeyword,
        }),
      })

      // 4. 통계 기록 후 인기 검색어 업데이트 트리거
      if (onSearchTracked) {
        setTimeout(() => {
          onSearchTracked()
        }, 200) // 0.2초 후 업데이트
      }
    } catch (error) {
      // 통계 추적 실패해도 검색에는 영향 없음
      console.error("Failed to track search keyword:", error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch(inputValue)
    }
  }

  const handleSearchClick = () => {
    handleSearch(inputValue)
  }

  const handleRefresh = () => {
    // 새로고침 버튼 클릭 시 메인화면으로 이동
    // 1. 검색어 초기화
    setInputValue("")
    onSearchChange("")
    setCorrectedKeyword(null)

    // 2. 새로고침 트리거
    onRefresh()
  }

  const handleLogoClick = () => {
    // 로고 클릭 시 메인화면으로 이동
    // 1. 검색어 초기화
    setInputValue("")
    onSearchChange("")
    setCorrectedKeyword(null)

    // 2. 새로고침 트리거
    onRefresh()
  }

  const handleLogout = async () => {
    // 저장하지 않은 변경사항이 있으면 경고 다이얼로그 표시
    if (hasUnsavedChanges && onLogoutAttempt) {
      onLogoutAttempt()
      return
    }

    try {
      await signOut()
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={handleLogoClick}>
          <Radio className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Pulse</h1>
        </div>

        {!hideSearchBar && (
          <div className="hidden md:flex flex-1 max-w-3xl mx-8 gap-2">
            <div className="relative flex-1">
              {isLoading ? (
                <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary animate-spin" />
              ) : showSuccess ? (
                <CheckCircle2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500" />
              ) : (
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              )}
              <Input
                type="search"
                placeholder="Search news... (Press Enter)"
                className="pl-10 rounded-xl shadow-sm"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <Select value={activeRegion} onValueChange={onRegionChange}>
              <SelectTrigger className="w-[140px] rounded-xl shadow-sm">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-lg">
                {regions.map((region) => (
                  <SelectItem key={region.value} value={region.value}>
                    {region.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={timeRange.toString()} onValueChange={(value) => onTimeRangeChange(parseFloat(value))}>
              <SelectTrigger className="w-[120px] rounded-xl shadow-sm">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-lg">
                {timeRanges.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="default" size="icon" onClick={handleSearchClick} title="Search" className="rounded-full transition-all duration-300 hover:scale-110 shadow-md hover:shadow-lg">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleRefresh} title="Refresh news" className="rounded-full transition-all duration-300 hover:scale-110">
            <RefreshCw className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsGuideModalOpen(true)} title="사용 가이드" className="rounded-full transition-all duration-300 hover:scale-110">
            <HelpCircle className="h-5 w-5" />
          </Button>
          <ThemeToggle />
          {user ? (
            <>
              <Button variant="ghost" size="sm" asChild className="gap-2 rounded-xl transition-all duration-300 hover:scale-105">
                <Link href="/mypage">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">마이페이지</span>
                </Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 rounded-xl transition-all duration-300 hover:scale-105">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">로그아웃</span>
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setIsLoginModalOpen(true)} className="gap-2 rounded-xl transition-all duration-300 hover:scale-105">
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">로그인</span>
            </Button>
          )}
          {/* 모바일 메뉴바 - 숨김 처리 */}
          {/* <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="rounded-full transition-all duration-300 hover:scale-110">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
                <SheetDescription>Navigate through news categories</SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <div className="flex gap-2">
                  <Input
                    type="search"
                    placeholder="Search news... (Press Enter)"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="rounded-xl shadow-sm"
                  />
                  <Button variant="default" size="icon" onClick={handleSearchClick} title="Search" className="rounded-full transition-all duration-300 hover:scale-110 shadow-md hover:shadow-lg">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet> */}
        </div>
        </div>
        {/* 오타 교정 안내 메시지 */}
        {!hideSearchBar && correctedKeyword && (
          <div className="pb-2 pt-1">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span>검색어가 수정되었습니다:</span>
              <span className="font-medium text-primary">{correctedKeyword}</span>
            </div>
          </div>
        )}
      </div>
      <LoginModal open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen} />
      <UserGuideModal open={isGuideModalOpen} onOpenChange={setIsGuideModalOpen} />
    </header>
  )
}
