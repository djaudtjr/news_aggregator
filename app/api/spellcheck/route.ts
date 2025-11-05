import { type NextRequest, NextResponse } from "next/server"

/**
 * OpenAI API를 사용하여 검색어 오타 교정
 */
async function correctSpelling(keyword: string): Promise<{ corrected: string; hasTypo: boolean }> {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY

    if (!openaiApiKey) {
      console.warn("[Spellcheck] OpenAI API key not found, skipping spellcheck")
      return { corrected: keyword, hasTypo: false }
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `당신은 검색어 오타를 교정하는 전문가입니다.
사용자가 입력한 검색어에 오타가 있는지 판단하고, 오타가 있다면 올바른 단어로 수정하세요.

규칙:
1. 오타가 있으면 "TYPO: 수정된검색어" 형식으로 응답
2. 오타가 없으면 "OK: 원본검색어" 형식으로 응답
3. 한글, 영문, 숫자 모두 검사
4. 맥락을 고려하여 의미 있는 단어로 수정
5. 띄어쓰기 오류도 교정
6. 너무 짧은 단어(1-2글자)는 오타 판단 신중히

예시:
입력: "인공지능"
출력: OK: 인공지능

입력: "인곡지능"
출력: TYPO: 인공지능

입력: "machin learning"
출력: TYPO: machine learning

입력: "양자컴퓨터"
출력: OK: 양자컴퓨터

입력: "양자컴퓨타"
출력: TYPO: 양자컴퓨터

입력: "aritificial inteligence"
출력: TYPO: artificial intelligence`,
          },
          {
            role: "user",
            content: keyword,
          },
        ],
        max_tokens: 100,
        temperature: 0.1,
      }),
    })

    if (!response.ok) {
      console.error("[Spellcheck] OpenAI API error:", response.status)
      return { corrected: keyword, hasTypo: false }
    }

    const data = await response.json()
    const aiResponse = data.choices?.[0]?.message?.content?.trim() || ""

    // 응답 파싱
    if (aiResponse.startsWith("TYPO:")) {
      const corrected = aiResponse.replace("TYPO:", "").trim()
      console.log(`[Spellcheck] Typo detected: "${keyword}" → "${corrected}"`)
      return { corrected, hasTypo: true }
    } else if (aiResponse.startsWith("OK:")) {
      const original = aiResponse.replace("OK:", "").trim()
      return { corrected: original, hasTypo: false }
    } else {
      // 예상치 못한 응답 형식
      console.warn("[Spellcheck] Unexpected AI response:", aiResponse)
      return { corrected: keyword, hasTypo: false }
    }
  } catch (error) {
    console.error("[Spellcheck] Error:", error)
    return { corrected: keyword, hasTypo: false }
  }
}

/**
 * 검색어 오타 교정 API
 */
export async function POST(request: NextRequest) {
  try {
    const { keyword } = await request.json()

    if (!keyword || keyword.trim().length === 0) {
      return NextResponse.json({ error: "Keyword is required" }, { status: 400 })
    }

    const trimmedKeyword = keyword.trim()

    // 오타 교정
    const result = await correctSpelling(trimmedKeyword)

    return NextResponse.json({
      original: trimmedKeyword,
      corrected: result.corrected,
      hasTypo: result.hasTypo,
    })
  } catch (error) {
    console.error("[Spellcheck] API error:", error)
    return NextResponse.json({ error: "Failed to check spelling" }, { status: 500 })
  }
}
