/**
 * 문자열을 안정적인 해시값으로 변환
 * 동일한 문자열은 항상 동일한 해시를 반환
 * @param str 해시할 문자열
 * @returns 36진수 해시 문자열
 */
export function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}

/**
 * URL을 기반으로 고유한 뉴스 ID 생성
 * @param url 뉴스 기사 URL
 * @param prefix ID 접두사 (예: 'rss', 'naver')
 * @returns 고유한 뉴스 ID
 */
export function generateNewsId(url: string, prefix: string = "news"): string {
  const urlHash = hashString(url)
  return `${prefix}-${urlHash}`
}
