import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"

/**
 * 매일 오전 7시 KST에 실행되는 Cron Job
 * 현재 시간 ±3시간 범위의 구독자에게 즉시 뉴스 다이제스트 발송
 * Vercel Cron Job의 딜레이를 고려하여 시간 범위를 넓게 설정
 * GET /api/cron/send-daily-digest
 */
export async function GET(request: NextRequest) {
  try {
    // Vercel Cron Secret 검증 (선택사항, 보안 강화)
    const authHeader = request.headers.get("authorization")
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[Cron] Starting daily digest job...")

    // 1. 현재 시간 (KST) 계산
    const now = new Date()
    const kstOffset = 9 * 60 // KST는 UTC+9
    const kstTime = new Date(now.getTime() + kstOffset * 60 * 1000)
    const currentDay = kstTime.getUTCDay() // 0=일, 1=월, ..., 6=토
    const currentHour = kstTime.getUTCHours() // 0-23

    // Vercel Cron Job 딜레이를 고려한 시간 범위 (±3시간)
    const minHour = currentHour - 3
    const maxHour = currentHour + 3

    console.log(`[Cron] Current KST time: ${kstTime.toISOString()}, Day: ${currentDay}, Hour: ${currentHour}`)
    console.log(`[Cron] Searching subscribers with delivery_hour between ${minHour} and ${maxHour}`)

    // 2. 활성화된 이메일 설정 조회 (시간 범위 ±3시간, 오늘 요일 포함)
    // PostgreSQL의 @> 연산자로 배열에 currentDay가 포함되어 있는지 확인
    const { data: subscribers, error: subscribersError } = await supabaseServer
      .from("email_subscription_settings")
      .select("user_id, email, delivery_days, delivery_hour")
      .eq("enabled", true)
      .gte("delivery_hour", minHour)
      .lte("delivery_hour", maxHour)
      .contains("delivery_days", [currentDay])

    if (subscribersError) {
      console.error("[Cron] Error fetching subscribers:", subscribersError)
      return NextResponse.json({ error: "Failed to fetch subscribers" }, { status: 500 })
    }

    if (!subscribers || subscribers.length === 0) {
      console.log("[Cron] No subscribers found for current time window")
      return NextResponse.json({
        message: "No subscribers scheduled for this time",
        currentDay,
        currentHour,
        timeRange: { minHour, maxHour },
        processedCount: 0,
        successCount: 0,
        failedCount: 0
      })
    }

    console.log(`[Cron] Found ${subscribers.length} subscribers for immediate delivery`)

    // 3. 각 구독자에게 즉시 이메일 발송
    const results = []

    for (const subscriber of subscribers) {
      try {
        console.log(`[Cron] Sending email immediately to ${subscriber.email}...`)

        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/email/send-digest`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: subscriber.user_id,
          }),
        })

        const result = await response.json()

        if (response.ok) {
          console.log(`[Cron] Successfully sent email to ${subscriber.email}`)
          results.push({
            email: subscriber.email,
            success: true,
            newsCount: result.newsCount,
          })
        } else {
          console.error(`[Cron] Failed to send email to ${subscriber.email}:`, result.error)
          results.push({
            email: subscriber.email,
            success: false,
            error: result.error
          })
        }
      } catch (error: any) {
        console.error(`[Cron] Error sending to ${subscriber.email}:`, error)
        results.push({
          email: subscriber.email,
          success: false,
          error: error.message
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failedCount = results.filter(r => !r.success).length

    console.log(`[Cron] Completed. Success: ${successCount}, Failed: ${failedCount}`)

    return NextResponse.json({
      message: "Daily digest immediate email job completed",
      currentDay,
      currentHour,
      timeRange: { minHour, maxHour },
      processedCount: subscribers.length,
      successCount,
      failedCount,
      results
    })
  } catch (error: any) {
    console.error("[Cron] Error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}
