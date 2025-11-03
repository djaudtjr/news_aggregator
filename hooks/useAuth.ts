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
        // 먼저 세션이 있는지 확인
        const {
          data: { session },
          error: sessionError,
        } = await supabaseBrowser.auth.getSession()

        if (sessionError) {
          console.warn("[Auth] Session error:", sessionError.message)
          setUser(null)
          setLoading(false)
          return
        }

        // 세션이 없으면 로그인하지 않은 상태
        if (!session) {
          setUser(null)
          setLoading(false)
          return
        }

        // 세션이 있으면 사용자 정보 가져오기
        const {
          data: { user },
          error: userError,
        } = await supabaseBrowser.auth.getUser()

        // Refresh token 에러 처리
        if (userError) {
          // AuthApiError는 일반적인 에러이므로 warn으로 처리
          if (userError.message.includes("Refresh Token Not Found") ||
              userError.message.includes("Invalid Refresh Token")) {
            // 조용히 세션 정리 (콘솔 로그 최소화)
            await supabaseBrowser.auth.signOut({ scope: "local" })
            setUser(null)
          } else {
            console.warn("[Auth] Token error:", userError.message)
            // 다른 토큰 관련 에러도 세션 정리
            if (userError.message.includes("refresh") || userError.message.includes("token")) {
              await supabaseBrowser.auth.signOut({ scope: "local" })
              setUser(null)
            }
          }
          setUser(null)
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
        setUser(session?.user ?? null)
      } else if (event === "SIGNED_OUT") {
        setUser(null)
      } else if (event === "SIGNED_IN") {
        setUser(session?.user ?? null)
      } else if (event === "USER_UPDATED") {
        setUser(session?.user ?? null)
      }

      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signInWithGoogle = async () => {
    // 환경 변수에서 BASE_URL 가져오기
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin
    const redirectUrl = `${baseUrl}/auth/callback`

    console.log("[Auth] Sign in redirect URL:", redirectUrl)

    const { error } = await supabaseBrowser.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
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
