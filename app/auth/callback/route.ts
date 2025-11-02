import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server-client"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  // 환경 변수에서 BASE_URL 가져오기, 없으면 현재 origin 사용
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || requestUrl.origin

  console.log("[Auth Callback] Redirecting to:", baseUrl, "from:", requestUrl.origin)

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error("Error exchanging code for session:", error)
      return NextResponse.redirect(`${baseUrl}?error=auth_error`)
    }
  }

  // 메인 페이지로 리다이렉트
  return NextResponse.redirect(baseUrl)
}
