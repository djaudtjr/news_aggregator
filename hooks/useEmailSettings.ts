"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "./useAuth"

export interface EmailSettings {
  user_id: string
  enabled: boolean
  email: string
  delivery_days: number[] // 0=일, 1=월, ..., 6=토
  delivery_hour: number // 6, 12, 18 중 선택
  last_sent_at: string | null
  created_at: string
  updated_at: string
}

export function useEmailSettings() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<EmailSettings | null>(null)
  const [loading, setLoading] = useState(false)

  // 설정 불러오기
  const fetchSettings = useCallback(async () => {
    if (!user) {
      setSettings(null)
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/subscriptions/email-settings?userId=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
      }
    } catch (error) {
      console.error("Failed to fetch email settings:", error)
    } finally {
      setLoading(false)
    }
  }, [user])

  // 초기 로드
  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  // 설정 저장/업데이트
  const saveSettings = async (newSettings: {
    email: string
    enabled: boolean
    deliveryDays: number[]
    deliveryHour: number
  }) => {
    if (!user) {
      console.warn("User not logged in")
      alert("로그인이 필요합니다.")
      return false
    }

    // 이메일 유효성 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newSettings.email)) {
      alert("올바른 이메일 주소를 입력해주세요.")
      return false
    }

    // 발송 요일 검사
    if (newSettings.enabled && newSettings.deliveryDays.length === 0) {
      alert("최소 하나의 발송 요일을 선택해주세요.")
      return false
    }

    try {
      const response = await fetch("/api/subscriptions/email-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          ...newSettings,
        }),
      })

      if (response.ok) {
        await fetchSettings() // 목록 새로고침
        return true
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error("Failed to save settings:", errorData)
        return false
      }
    } catch (error) {
      console.error("Failed to save settings:", error)
      return false
    }
  }

  // 설정 삭제
  const deleteSettings = async () => {
    if (!user) {
      console.warn("User not logged in")
      return false
    }

    try {
      const response = await fetch(`/api/subscriptions/email-settings?userId=${user.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setSettings(null)
        return true
      } else {
        console.error("Failed to delete settings")
        return false
      }
    } catch (error) {
      console.error("Failed to delete settings:", error)
      return false
    }
  }

  return {
    settings,
    loading,
    saveSettings,
    deleteSettings,
    refreshSettings: fetchSettings,
  }
}
