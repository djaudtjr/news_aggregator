import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"

/**
 * 이메일 구독 설정 조회
 * GET /api/subscriptions/email-settings?userId={userId}
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const { data, error } = await supabaseServer
      .from("email_subscription_settings")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (error) {
      // 설정이 없으면 null 반환 (404가 아님)
      if (error.code === "PGRST116") {
        return NextResponse.json({ settings: null })
      }
      console.error("[Email Settings] Error:", error)
      return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
    }

    return NextResponse.json({ settings: data })
  } catch (error) {
    console.error("[Email Settings] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * 이메일 구독 설정 생성/업데이트
 * POST /api/subscriptions/email-settings
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, email, enabled, deliveryDays, deliveryHour } = body

    if (!userId || !email) {
      return NextResponse.json({ error: "User ID and email are required" }, { status: 400 })
    }

    // 이메일 유효성 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // 발송 요일 유효성 검사 (0-6)
    if (deliveryDays && !Array.isArray(deliveryDays)) {
      return NextResponse.json({ error: "Delivery days must be an array" }, { status: 400 })
    }

    if (deliveryDays && deliveryDays.some((day: number) => day < 0 || day > 6)) {
      return NextResponse.json({ error: "Invalid delivery day (must be 0-6)" }, { status: 400 })
    }

    // 발송 시간 유효성 검사 (6, 18만 허용)
    if (deliveryHour !== undefined && ![6, 18].includes(deliveryHour)) {
      return NextResponse.json({ error: "Invalid delivery hour (must be 6 or 18)" }, { status: 400 })
    }

    const settingsData = {
      user_id: userId,
      email,
      enabled: enabled ?? false,
      delivery_days: deliveryDays ?? [1, 2, 3, 4, 5], // 기본값: 월~금
      delivery_hour: deliveryHour ?? 6, // 기본값: 오전 6시
    }

    // UPSERT: 존재하면 업데이트, 없으면 생성
    const { data, error } = await supabaseServer
      .from("email_subscription_settings")
      .upsert(settingsData, {
        onConflict: "user_id",
      })
      .select()
      .single()

    if (error) {
      console.error("[Email Settings] Upsert error:", error)
      return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
    }

    return NextResponse.json({ settings: data })
  } catch (error) {
    console.error("[Email Settings] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * 이메일 구독 설정 삭제
 * DELETE /api/subscriptions/email-settings?userId={userId}
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const { error } = await supabaseServer.from("email_subscription_settings").delete().eq("user_id", userId)

    if (error) {
      console.error("[Email Settings] Delete error:", error)
      return NextResponse.json({ error: "Failed to delete settings" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Email Settings] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
