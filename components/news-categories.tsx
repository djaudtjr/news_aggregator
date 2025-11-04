"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tag } from "lucide-react"

interface Category {
  id: number
  code: string
  label_ko: string
  label_en: string | null
  display_order: number
}

interface NewsCategoriesProps {
  activeCategory: string
  onCategoryChange: (category: string) => void
  availableCategories?: Set<string>
}

export function NewsCategories({ activeCategory, onCategoryChange, availableCategories }: NewsCategoriesProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch("/api/codes?codeType=news_category")
        if (!response.ok) {
          throw new Error("Failed to fetch categories")
        }
        const data = await response.json()
        setCategories(data.codes || [])
      } catch (error) {
        console.error("Error fetching categories:", error)
        // 에러 발생 시 기본 카테고리 사용
        setCategories([
          { id: 1, code: "all", label_ko: "전체", label_en: "All", display_order: 1 },
          { id: 2, code: "world", label_ko: "세계", label_en: "World", display_order: 2 },
          { id: 3, code: "politics", label_ko: "정치", label_en: "Politics", display_order: 3 },
          { id: 4, code: "business", label_ko: "비즈니스", label_en: "Business", display_order: 4 },
          { id: 5, code: "technology", label_ko: "기술", label_en: "Technology", display_order: 5 },
          { id: 6, code: "science", label_ko: "과학", label_en: "Science", display_order: 6 },
          { id: 7, code: "health", label_ko: "건강", label_en: "Health", display_order: 7 },
          { id: 8, code: "sports", label_ko: "스포츠", label_en: "Sports", display_order: 8 },
          { id: 9, code: "entertainment", label_ko: "엔터테인먼트", label_en: "Entertainment", display_order: 9 },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategories()
  }, [])

  const activeLabel = categories.find(c => c.code === activeCategory)?.label_ko || "전체"

  if (isLoading) {
    return (
      <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b py-3 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-sm text-muted-foreground">로딩 중...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3">
        {/* 모바일: 드롭다운 */}
        <div className="md:hidden">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary shrink-0" />
            <Select value={activeCategory} onValueChange={onCategoryChange}>
              <SelectTrigger className="h-9 w-full rounded-lg">
                <SelectValue placeholder="카테고리 선택">
                  {activeLabel}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => {
                  const isAvailable = !availableCategories || availableCategories.has(category.code)
                  return (
                    <SelectItem
                      key={category.code}
                      value={category.code}
                      disabled={!isAvailable}
                    >
                      {category.label_ko}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 데스크탑: 가로 스크롤 */}
        <div className="hidden md:block">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 shrink-0">
              <Tag className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">카테고리</span>
            </div>
            <div className="overflow-x-auto -mx-1 px-1 flex-1">
              <div className="flex gap-2 pb-1">
                {categories.map((category) => {
                  const isAvailable = !availableCategories || availableCategories.has(category.code)

                  return (
                    <Button
                      key={category.code}
                      variant={activeCategory === category.code ? "default" : "outline"}
                      size="sm"
                      onClick={() => onCategoryChange(category.code)}
                      disabled={!isAvailable}
                      className="shrink-0 rounded-full h-8 px-4 transition-all duration-200 hover:scale-105 whitespace-nowrap text-sm"
                    >
                      {category.label_ko}
                    </Button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
