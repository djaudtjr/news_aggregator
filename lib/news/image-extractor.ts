/**
 * 웹 페이지에서 OG(Open Graph) 이미지를 추출
 * @param url 추출할 페이지 URL
 * @returns 이미지 URL 또는 undefined
 */
export async function fetchOGImage(url: string): Promise<string | undefined> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5초 타임아웃

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; NewsBot/1.0)",
      },
      cache: "no-store", // 캐시 비활성화 (대용량 페이지로 인한 2MB 제한 회피)
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) return undefined

    // 응답 크기가 너무 크면 head 부분만 읽기 (최대 500KB)
    const contentLength = response.headers.get("content-length")
    let html: string

    if (contentLength && Number.parseInt(contentLength) > 500000) {
      // 스트림에서 일부만 읽기
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let chunks = ""
      let bytesRead = 0
      const maxBytes = 500000 // 500KB

      if (reader) {
        while (bytesRead < maxBytes) {
          const { done, value } = await reader.read()
          if (done) break
          chunks += decoder.decode(value, { stream: true })
          bytesRead += value.length

          // head 태그를 찾았으면 중단
          if (chunks.includes("</head>")) {
            reader.cancel()
            break
          }
        }
        html = chunks
      } else {
        html = await response.text()
      }
    } else {
      html = await response.text()
    }

    // OG 이미지 추출 시도
    const ogImage = extractOGImage(html)
    if (ogImage) return ogImage

    // Twitter 이미지 추출 시도 (fallback)
    const twitterImage = extractTwitterImage(html)
    if (twitterImage) return twitterImage

    return undefined
  } catch (error) {
    // 타임아웃 또는 네트워크 에러 시 무시
    return undefined
  }
}

/**
 * HTML에서 og:image 메타 태그 추출
 */
function extractOGImage(html: string): string | undefined {
  const ogImageMatch =
    html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["'][^>]*>/i)

  return ogImageMatch?.[1]
}

/**
 * HTML에서 twitter:image 메타 태그 추출
 */
function extractTwitterImage(html: string): string | undefined {
  const twitterImageMatch =
    html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["'][^>]*>/i)

  return twitterImageMatch?.[1]
}
