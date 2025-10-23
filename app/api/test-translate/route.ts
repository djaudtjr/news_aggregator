import { NextResponse } from "next/server"
import { translateToEnglish } from "@/lib/utils/language-utils"

/**
 * 번역 테스트 API
 * 사용법: /api/test-translate?text=인공지능
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const text = searchParams.get("text") || "인공지능"

  console.log(`[v0] Test translation API called with text: "${text}"`)

  const translated = await translateToEnglish(text)

  return NextResponse.json({
    original: text,
    translated: translated,
    success: translated !== text,
    message: translated !== text ? "Translation successful" : "Translation failed or returned same text",
  })
}
