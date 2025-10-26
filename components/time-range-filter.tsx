"use client"

import { Button } from "@/components/ui/button"
import { Clock } from "lucide-react"

interface TimeRangeFilterProps {
  timeRange: number
  onTimeRangeChange: (days: number) => void
}

export function TimeRangeFilter({ timeRange, onTimeRangeChange }: TimeRangeFilterProps) {
  const timeRanges = [
    { value: 0.042, label: "1시간" }, // 1/24 일
    { value: 1, label: "1일" },
    { value: 7, label: "7일" },
    { value: 30, label: "30일" },
  ]

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm font-medium text-muted-foreground">검색 기간:</span>
      {timeRanges.map((range) => (
        <Button
          key={range.value}
          variant={timeRange === range.value ? "default" : "outline"}
          size="sm"
          onClick={() => onTimeRangeChange(range.value)}
          className="gap-2"
        >
          <Clock className="h-4 w-4" />
          {range.label}
        </Button>
      ))}
    </div>
  )
}
