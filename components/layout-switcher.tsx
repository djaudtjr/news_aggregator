"use client"

import { LayoutGrid, List, AlignJustify } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { LayoutMode } from "@/hooks/useLayoutMode"

interface LayoutSwitcherProps {
  layoutMode: LayoutMode
  onLayoutChange: (mode: LayoutMode) => void
}

export function LayoutSwitcher({ layoutMode, onLayoutChange }: LayoutSwitcherProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground hidden sm:inline">레이아웃:</span>
      <Tabs value={layoutMode} onValueChange={(v) => onLayoutChange(v as LayoutMode)}>
        <TabsList>
          <TabsTrigger value="grid" title="그리드 뷰">
            <LayoutGrid className="h-4 w-4" />
            <span className="ml-2 hidden sm:inline">그리드</span>
          </TabsTrigger>
          <TabsTrigger value="list" title="리스트 뷰">
            <List className="h-4 w-4" />
            <span className="ml-2 hidden sm:inline">리스트</span>
          </TabsTrigger>
          <TabsTrigger value="compact" title="컴팩트 뷰">
            <AlignJustify className="h-4 w-4" />
            <span className="ml-2 hidden sm:inline">컴팩트</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}
