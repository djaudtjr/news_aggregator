/**
 * 문자열이 한글을 포함하는지 확인
 */
export function containsKorean(text: string): boolean {
  const koreanRegex = /[가-힣ㄱ-ㅎㅏ-ㅣ]/
  return koreanRegex.test(text)
}

/**
 * 문자열이 영문을 포함하는지 확인
 */
export function containsEnglish(text: string): boolean {
  const englishRegex = /[a-zA-Z]/
  return englishRegex.test(text)
}

/**
 * Papago API를 사용한 한글 → 영문 번역
 * Naver Cloud Platform Papago NMT API 사용
 *
 * curl 예제:
 * curl --location --request POST 'https://papago.apigw.ntruss.com/nmt/v1/translation' \
 *   --header 'X-NCP-APIGW-API-KEY-ID: {Client ID}' \
 *   --header 'X-NCP-APIGW-API-KEY: {Client Secret}' \
 *   --header 'Content-Type: application/x-www-form-urlencoded' \
 *   --data-urlencode 'source=ko' \
 *   --data-urlencode 'target=en' \
 *   --data-urlencode 'text=안녕하세요'
 */
export async function translateToEnglish(text: string): Promise<string> {
  const clientIdCloud = process.env.NAVER_CLOUD_CLIENT_ID
  const clientSecretCloud = process.env.NAVER_CLOUD_CLIENT_SECRET

  // Cloud API 키 확인
  if (!clientIdCloud || !clientSecretCloud) {
    console.log("[v0] Naver Cloud API credentials not found for translation")
    return text
  }

  console.log(`[v0] Starting translation for: "${text}"`)

  try {
    // NCP Papago API - curl 예제와 동일한 형식
    const params = new URLSearchParams()
    params.append("source", "ko")
    params.append("target", "en")
    params.append("text", text)

    // 5초 타임아웃 설정
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch("https://papago.apigw.ntruss.com/nmt/v1/translation", {
      method: "POST",
      headers: {
        "X-NCP-APIGW-API-KEY-ID": clientIdCloud,
        "X-NCP-APIGW-API-KEY": clientSecretCloud,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    console.log(`[v0] Response status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.log(`[v0] NCP Papago API error: ${response.status} - ${errorText}`)
      return text
    }

    const data = await response.json()
    const translatedText = data.message?.result?.translatedText

    if (translatedText) {
      console.log(`[v0] Translated "${text}" to "${translatedText}"`)
      return translatedText
    }

    console.log("[v0] Translation response did not contain translatedText:", JSON.stringify(data))
    return text
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log("[v0] Translation timeout - proceeding with original text")
    } else {
      console.log("[v0] Translation error:", error instanceof Error ? error.message : "Unknown error")
    }
    return text
  }
}

/**
 * 검색어 언어 감지 및 번역 처리
 * @param query 검색어
 * @returns { original: 원본, translated?: 번역본, isKorean: 한글 여부 }
 */
export async function processSearchQuery(query: string): Promise<{
  original: string
  translated?: string
  isKorean: boolean
}> {
  const isKorean = containsKorean(query)

  if (isKorean) {
    const translated = await translateToEnglish(query)
    return {
      original: query,
      translated: translated !== query ? translated : undefined,
      isKorean: true,
    }
  }

  return {
    original: query,
    isKorean: false,
  }
}
