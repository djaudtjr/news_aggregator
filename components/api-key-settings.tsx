"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Settings, Check } from "lucide-react"

export function ApiKeySettings() {
  const [apiKey, setApiKey] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    // Load API key from localStorage on mount
    const savedKey = localStorage.getItem("openai_api_key")
    if (savedKey) {
      setApiKey(savedKey)
      setIsSaved(true)
    }
  }, [])

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem("openai_api_key", apiKey.trim())
      setIsSaved(true)
      setTimeout(() => {
        setIsOpen(false)
      }, 1000)
    }
  }

  const handleClear = () => {
    localStorage.removeItem("openai_api_key")
    setApiKey("")
    setIsSaved(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Settings className="h-5 w-5" />
          {isSaved && <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-green-500" />}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>OpenAI API 설정</DialogTitle>
          <DialogDescription>AI 요약 기능을 사용하려면 OpenAI API 키를 입력하세요.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="api-key">API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">API 키는 브라우저에만 저장되며 서버로 전송되지 않습니다.</p>
          </div>
        </div>
        <DialogFooter className="flex gap-2">
          {isSaved && (
            <Button variant="outline" onClick={handleClear}>
              삭제
            </Button>
          )}
          <Button onClick={handleSave} disabled={!apiKey.trim()}>
            {isSaved ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                저장됨
              </>
            ) : (
              "저장"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
