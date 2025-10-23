"use client"

import { Button } from "@/components/ui/button"
import { Globe, MapPin } from "lucide-react"

interface RegionFilterProps {
  activeRegion: string
  onRegionChange: (region: string) => void
}

export function RegionFilter({ activeRegion, onRegionChange }: RegionFilterProps) {
  const regions = [
    { id: "all", label: "전체", icon: Globe },
    { id: "domestic", label: "국내", icon: MapPin },
    { id: "international", label: "해외", icon: Globe },
  ]

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm font-medium text-muted-foreground">지역:</span>
      {regions.map((region) => {
        const Icon = region.icon
        return (
          <Button
            key={region.id}
            variant={activeRegion === region.id ? "default" : "outline"}
            size="sm"
            onClick={() => onRegionChange(region.id)}
            className="gap-2"
          >
            <Icon className="h-4 w-4" />
            {region.label}
          </Button>
        )
      })}
    </div>
  )
}
