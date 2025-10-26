import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/client"

/**
 * 매일 오전 7시 KST에 실행되는 Cron Job
 * 모든 활성화된 이메일 구독자에게 뉴스 다이제스트 발송
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

    // 1. 현재 시간 (KST) 및 발송 대상 시간 계산
    const now = new Date()
    const kstOffset = 9 * 60 // KST는 UTC+9
    const kstTime = new Date(now.getTime() + kstOffset * 60 * 1000)
    const currentDay = kstTime.getUTCDay() // 0=일, 1=월, ..., 6=토
    const currentHour = kstTime.getUTCHours() // 0-23
    const targetDeliveryHour = currentHour + 1 // 1시간 후 발송 예정

    console.log(`[Cron] Current KST time: ${kstTime.toISOString()}, Day: ${currentDay}, Hour: ${currentHour}`)
    console.log(`[Cron] Target delivery hour: ${targetDeliveryHour}시 구독자를 위한 뉴스 수집`)

    // 2. 활성화된 이메일 설정 조회 (오늘이 발송 요일이고 현재 시간이 발송 시간인 경우만)
    const { data: subscribers, error: subscribersError } = await supabase
      .from("email_subscription_settings")
      .select("user_id, email, delivery_days, delivery_hour")
      .eq("enabled", true)

    if (subscribersError) {
      console.error("[Cron] Error fetching subscribers:", subscribersError)
      return NextResponse.json({ error: "Failed to fetch subscribers" }, { status: 500 })
    }

    if (!subscribers || subscribers.length === 0) {
      console.log("[Cron] No active subscribers found")
      return NextResponse.json({
        message: "No active subscribers",
        processedCount: 0,
        successCount: 0,
        failedCount: 0
      })
    }

    console.log(`[Cron] Found ${subscribers.length} active subscribers`)

    // 3. 오늘 요일 + 1시간 후 발송 시간에 해당하는 구독자 필터링
    const todaySubscribers = subscribers.filter(sub =>
      sub.delivery_days &&
      sub.delivery_days.includes(currentDay) &&
      sub.delivery_hour === targetDeliveryHour
    )

    console.log(`[Cron] ${todaySubscribers.length} subscribers will receive email at ${targetDeliveryHour}:00 KST (Day: ${currentDay})`)

    if (todaySubscribers.length === 0) {
      return NextResponse.json({
        message: "No subscribers scheduled for this time",
        currentDay,
        currentHour,
        processedCount: 0,
        successCount: 0,
        failedCount: 0
      })
    }

    // 4. 각 구독자에게 이메일 예약 발송 (1시간 후)
    const results = []

    for (const subscriber of todaySubscribers) {
      try {
        console.log(`[Cron] Preparing scheduled email for ${subscriber.email} at ${targetDeliveryHour}:00 KST...`)

        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/email/send-digest`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: subscriber.user_id,
            scheduledDeliveryHour: targetDeliveryHour, // 예약 발송 시간 전달
          }),
        })

        const result = await response.json()

        if (response.ok) {
          console.log(`[Cron] Successfully scheduled email for ${subscriber.email} at ${targetDeliveryHour}:00 KST`)
          results.push({
            email: subscriber.email,
            success: true,
            newsCount: result.newsCount,
            scheduledAt: result.scheduledAt
          })
        } else {
          console.error(`[Cron] Failed to schedule email for ${subscriber.email}:`, result.error)
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
      message: "Daily digest scheduled email job completed",
      currentDay,
      currentHour,
      targetDeliveryHour,
      processedCount: todaySubscribers.length,
      successCount,
      failedCount,
      results
    })
  } catch (error: any) {
    console.error("[Cron] Error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}
