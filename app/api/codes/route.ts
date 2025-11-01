import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/client"

/**
 * 코드 데이터 조회 API
 * GET /api/codes?codeType={codeType}
 *
 * @param codeType - 조회할 코드 타입 (예: 'news_category')
 * @returns 활성화된 코드 목록 (display_order 순으로 정렬)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const codeType = searchParams.get("codeType")

    if (!codeType) {
      return NextResponse.json({ error: "Code type is required" }, { status: 400 })
    }

    console.log(`[Codes API] Fetching codes for type: ${codeType}`)

    // DB에서 활성화된 코드 조회 (display_order 순으로 정렬)
    const { data, error } = await supabase
      .from("codes")
      .select("id, code, label_ko, label_en, display_order")
      .eq("code_type", codeType)
      .eq("is_active", true)
      .order("display_order", { ascending: true })

    if (error) {
      console.error(`[Codes API] Error fetching codes:`, error)
      return NextResponse.json({ error: "Failed to fetch codes" }, { status: 500 })
    }

    console.log(`[Codes API] Found ${data?.length || 0} codes`)

    return NextResponse.json({
      codes: data || [],
    })
  } catch (error) {
    console.error("[Codes API] Unexpected error:", error)
    return NextResponse.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 })
  }
}
