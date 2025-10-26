"use client"

import { useState, useEffect } from "react"
import { supabaseBrowser } from "@/lib/supabase/browser-client"
import type { User } from "@supabase/supabase-js"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 현재 사용자 정보 가져오기
    const fetchUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabaseBrowser.auth.getUser()

        // Refresh token 에러 처리
        if (error) {
          console.warn("[Auth] Token error:", error.message)
          // 토큰이 유효하지 않으면 세션 정리
          if (error.message.includes("refresh") || error.message.includes("token")) {
            await supabaseBrowser.auth.signOut()
            setUser(null)
          }
        } else {
          setUser(user)
        }
      } catch (err) {
        console.error("[Auth] Fetch user error:", err)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()

    // 인증 상태 변경 리스너
    const {
      data: { subscription },
    } = supabaseBrowser.auth.onAuthStateChange(async (event, session) => {
      console.log("[Auth] State change:", event)

      // 토큰 만료나 에러 발생 시 자동 로그아웃
      if (event === "TOKEN_REFRESHED") {
        console.log("[Auth] Token refreshed successfully")
      } else if (event === "SIGNED_OUT") {
        setUser(null)
      } else if (event === "SIGNED_IN") {
        setUser(session?.user ?? null)
      }

      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signInWithGoogle = async () => {
    const { error } = await supabaseBrowser.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      console.error("Error signing in with Google:", error.message)
      throw error
    }
  }

  const signOut = async () => {
    const { error } = await supabaseBrowser.auth.signOut()
    if (error) {
      console.error("Error signing out:", error.message)
      throw error
    }
  }

  return {
    user,
    loading,
    signInWithGoogle,
    signOut,
  }
}
