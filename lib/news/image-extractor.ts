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
      next: { revalidate: 3600 }, // 1시간 캐시
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) return undefined

    const html = await response.text()

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
