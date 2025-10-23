/**
 * 뉴스 소스별 로고 URL 매핑
 * 이미지 로딩 실패 시 fallback으로 사용
 */

export const NEWS_LOGOS: Record<string, string> = {
  // 국내 언론사
  "네이버": "https://www.naver.com/favicon.ico",
  "연합뉴스": "https://www.yna.co.kr/favicon.ico",
  "SBS": "https://www.sbs.co.kr/favicon.ico",
  "네이버 뉴스": "https://www.naver.com/favicon.ico",

  // 해외 언론사
  "BBC World": "https://www.bbc.com/favicon.ico",
  "The Guardian": "https://www.theguardian.com/favicon.ico",
  "NY Times World": "https://www.nytimes.com/vi-assets/static-assets/favicon-4bf96cb6a1093748bf5b3c429accb9b4.ico",
  "Reddit World News": "https://www.reddit.com/favicon.ico",
  "CNN World": "https://www.cnn.com/favicon.ico",
  "TechCrunch": "https://techcrunch.com/favicon.ico",
  "MIT Technology Review": "https://www.technologyreview.com/favicon.ico",
}

/**
 * 뉴스 소스에 맞는 로고 URL 반환
 * @param source 뉴스 소스명
 * @returns 로고 URL 또는 기본 placeholder
 */
export function getNewsLogo(source: string): string {
  // 정확히 일치하는 경우
  if (NEWS_LOGOS[source]) {
    return NEWS_LOGOS[source]
  }

  // 부분 일치 검색 (예: "네이버 - IT" -> "네이버")
  for (const [key, logo] of Object.entries(NEWS_LOGOS)) {
    if (source.includes(key) || key.includes(source)) {
      return logo
    }
  }

  // 기본 placeholder
  return "/placeholder.svg"
}
