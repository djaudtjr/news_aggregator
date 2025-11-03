"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  // 페이지 번호 배열 생성
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 7 // 최대 표시할 페이지 번호 개수

    if (totalPages <= maxVisible) {
      // 전체 페이지가 적으면 모두 표시
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // 많으면 축약 표시
      if (currentPage <= 3) {
        // 시작 부분
        for (let i = 1; i <= 5; i++) {
          pages.push(i)
        }
        pages.push("...")
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        // 끝 부분
        pages.push(1)
        pages.push("...")
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        // 중간 부분
        pages.push(1)
        pages.push("...")
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push("...")
        pages.push(totalPages)
      }
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      {/* 이전 버튼 */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="h-9 w-9 rounded-full transition-all duration-300 hover:scale-110 shadow-md hover:shadow-lg"
        title="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* 페이지 번호 */}
      {pageNumbers.map((page, index) => {
        if (page === "...") {
          return (
            <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
              ...
            </span>
          )
        }

        const pageNum = page as number
        return (
          <Button
            key={pageNum}
            variant={currentPage === pageNum ? "default" : "outline"}
            onClick={() => onPageChange(pageNum)}
            className="h-9 w-9 rounded-full transition-all duration-300 hover:scale-110 shadow-md hover:shadow-lg"
          >
            {pageNum}
          </Button>
        )
      })}

      {/* 다음 버튼 */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="h-9 w-9 rounded-full transition-all duration-300 hover:scale-110 shadow-md hover:shadow-lg"
        title="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
