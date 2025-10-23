"use client"
import { useState, useEffect } from "react"
import { Search, Menu, Radio, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

interface NewsHeaderProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  onRefresh: () => void
}

export function NewsHeader({ searchQuery, onSearchChange, onRefresh }: NewsHeaderProps) {
  const [inputValue, setInputValue] = useState(searchQuery)

  // searchQuery가 외부에서 변경되면 inputValue도 동기화 (예: 새로고침)
  useEffect(() => {
    if (searchQuery === "") {
      setInputValue("")
    }
  }, [searchQuery])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSearchChange(inputValue)
    }
  }

  const handleSearchClick = () => {
    onSearchChange(inputValue)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Radio className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Pulse</h1>
        </div>

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
          <Button variant="ghost" size="icon" onClick={onRefresh} title="Refresh news">
            <RefreshCw className="h-5 w-5" />
          </Button>
          <ThemeToggle />
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
    </header>
  )
}
