"use client"

import { FileQuestion, Search } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface EmptyStateProps {
  searchQuery: string
  isSearchMode: boolean
}

export function EmptyState({ searchQuery, isSearchMode }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          {isSearchMode ? (
            <>
              <div className="mx-auto mb-4 h-12 w-12 text-muted-foreground">
                <Search className="h-full w-full" />
              </div>
              <CardTitle>검색 결과가 없습니다</CardTitle>
              <CardDescription>
                &quot;{searchQuery}&quot;에 대한 뉴스를 찾을 수 없습니다.
              </CardDescription>
            </>
          ) : (
            <>
              <div className="mx-auto mb-4 h-12 w-12 text-muted-foreground">
                <FileQuestion className="h-full w-full" />
              </div>
              <CardTitle>표시할 뉴스가 없습니다</CardTitle>
              <CardDescription>
                선택한 필터 조건에 맞는 뉴스가 없습니다.
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          <p>다른 검색어를 사용하거나 필터 조건을 변경해보세요.</p>
        </CardContent>
      </Card>
    </div>
  )
}
