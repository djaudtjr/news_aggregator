"use client"

import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Calendar } from "lucide-react"

interface TimeRangeFilterProps {
  timeRange: number
  onTimeRangeChange: (days: number) => void
}

export function TimeRangeFilter({ timeRange, onTimeRangeChange }: TimeRangeFilterProps) {
  const getTimeRangeLabel = (days: number) => {
    if (days === 1) return "Last 24 hours"
    if (days === 3) return "Last 3 days"
    if (days === 7) return "Last week"
    if (days === 14) return "Last 2 weeks"
    if (days === 30) return "Last month"
    return `Last ${days} days`
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm font-medium">Time Range: {getTimeRangeLabel(timeRange)}</Label>
      </div>
      <Slider
        value={[timeRange]}
        onValueChange={(value) => onTimeRangeChange(value[0])}
        min={1}
        max={30}
        step={1}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-muted-foreground mt-2">
        <span>1 day</span>
        <span>30 days</span>
      </div>
    </div>
  )
}
