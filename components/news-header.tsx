"use client"
import { useState, useEffect } from "react"
import { Search, Menu, Radio, RefreshCw, LogIn, LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { LoginModal } from "@/components/auth/login-modal"
import { useAuth } from "@/hooks/useAuth"
import Link from "next/link"

interface NewsHeaderProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  onRefresh: () => void
}

export function NewsHeader({ searchQuery, onSearchChange, onRefresh }: NewsHeaderProps) {
  const [inputValue, setInputValue] = useState(searchQuery)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const { user, signOut } = useAuth()

  // searchQuery가 외부에서 변경되면 inputValue도 동기화 (예: 새로고침)
  useEffect(() => {
    if (searchQuery === "") {
      setInputValue("")
    }
  }, [searchQuery])

  const handleSearch = (keyword: string) => {
    if (!keyword || keyword.trim().length === 0) {
      onSearchChange("")
      return
    }

    // 1. 먼저 검색 실행 (사용자에게 빠르게 결과 표시)
    onSearchChange(keyword)

    // 2. 검색 키워드 통계 기록 (백그라운드로 비동기 실행, await 없이)
    fetch("/api/analytics/search-keyword", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: user?.id || null,
        keyword: keyword.trim(),
      }),
    }).catch((error) => {
      // 통계 추적 실패해도 검색에는 영향 없음
      console.error("Failed to track search keyword:", error)
    })
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
    // 검색창이 비어있으면 검색 모드 초기화
    if (inputValue.trim().length === 0) {
      onSearchChange("")
    }
    onRefresh()
  }

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Radio className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Pulse</h1>
        </Link>

        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search news... (Press Enter)"
                className="pl-10"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <Button variant="default" size="icon" onClick={handleSearchClick} title="Search">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleRefresh} title="Refresh news">
            <RefreshCw className="h-5 w-5" />
          </Button>
          <ThemeToggle />
          {user ? (
            <>
              <Button variant="ghost" size="sm" asChild className="gap-2">
                <Link href="/mypage">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">마이페이지</span>
                </Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">로그아웃</span>
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setIsLoginModalOpen(true)} className="gap-2">
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">로그인</span>
            </Button>
          )}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
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
                  />
                  <Button variant="default" size="icon" onClick={handleSearchClick} title="Search">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <LoginModal open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen} />
    </header>
  )
}
