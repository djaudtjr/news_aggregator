"use client"

import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface BulkActionsProps {
  selectedCount: number
  onClearSelection: () => void
}

export function BulkActions({ selectedCount, onClearSelection }: BulkActionsProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-primary text-primary-foreground rounded-full shadow-lg px-6 py-3 flex items-center gap-4">
        <span className="font-medium">{selectedCount} selected</span>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClearSelection}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
