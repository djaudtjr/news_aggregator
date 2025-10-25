"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

const categories = [
  { id: "all", label: "전체" },
  { id: "world", label: "세계" },
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
}

export function NewsCategories({ activeCategory, onCategoryChange }: NewsCategoriesProps) {
  return (
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
  )
}
