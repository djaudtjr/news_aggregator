"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

const categories = [
  { id: "all", label: "전체" },
  { id: "world", label: "세계" },
  { id: "politics", label: "정치" },
  { id: "business", label: "비즈니스" },
  { id: "technology", label: "기술" },
  { id: "science", label: "과학" },
  { id: "health", label: "건강" },
  { id: "sports", label: "스포츠" },
  { id: "entertainment", label: "엔터테인먼트" },
]

interface NewsCategoriesProps {
  activeCategory: string
  onCategoryChange: (category: string) => void
  availableCategories?: Set<string>
}

export function NewsCategories({ activeCategory, onCategoryChange, availableCategories }: NewsCategoriesProps) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-sm font-medium text-muted-foreground whitespace-nowrap pt-2">카테고리:</span>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 pb-4">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? "default" : "outline"}
              onClick={() => onCategoryChange(category.id)}
              className="shrink-0"
            >
              {category.label}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}
