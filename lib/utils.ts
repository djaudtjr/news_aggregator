import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { NewsArticle } from '@/types/article'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 제목 유사도 계산 (Levenshtein distance 기반)
 * @param str1 첫 번째 문자열
 * @param str2 두 번째 문자열
 * @returns 유사도 (0~1 사이의 값, 1이 완전히 동일)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1

  if (longer.length === 0) {
    return 1.0
  }

  const editDistance = levenshteinDistance(longer, shorter)
  return (longer.length - editDistance) / longer.length
}

/**
 * Levenshtein distance 계산
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}

/**
 * 뉴스 기사 배열에서 중복 제거 (최적화된 버전)
 * - ID가 같은 경우 중복으로 간주
 * - 제목 유사도가 80% 이상인 경우 중복으로 간주
 * @param articles 뉴스 기사 배열
 * @param similarityThreshold 제목 유사도 임계값 (기본 0.8)
 * @returns 중복이 제거된 뉴스 기사 배열
 */
export function deduplicateArticles(
  articles: NewsArticle[],
  similarityThreshold: number = 0.8
): NewsArticle[] {
  const uniqueArticles: NewsArticle[] = []
  const seenIds = new Set<string>()
  const titleMap = new Map<string, string>() // 정규화된 제목 -> 원본 제목 매핑

  for (const article of articles) {
    // 1. ID 기반 중복 체크 (빠른 경로)
    if (seenIds.has(article.id)) {
      continue
    }

    // 제목 정규화 (소문자 + 공백/특수문자 제거)
    const normalizedTitle = article.title
      .toLowerCase()
      .replace(/[^\w\s가-힣]/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    // 2. 정규화된 제목으로 빠른 중복 체크
    if (titleMap.has(normalizedTitle)) {
      continue
    }

    // 3. 제목 유사도 기반 중복 체크 (Levenshtein distance)
    // 최적화: 길이 차이가 20% 이상이면 스킵 (유사도 80% 이상 불가능)
    let isDuplicate = false
    const titleLower = article.title.toLowerCase()

    for (const [seenNormalized, seenOriginal] of titleMap) {
      const seenLower = seenOriginal.toLowerCase()
      const lengthDiff = Math.abs(titleLower.length - seenLower.length)
      const maxLength = Math.max(titleLower.length, seenLower.length)

      // 길이 차이가 크면 유사도 계산 스킵
      if (lengthDiff / maxLength > (1 - similarityThreshold)) {
        continue
      }

      const similarity = calculateSimilarity(titleLower, seenLower)
      if (similarity >= similarityThreshold) {
        isDuplicate = true
        console.log(`[v0] Duplicate detected (${(similarity * 100).toFixed(0)}% similar): "${article.title}" ≈ "${seenOriginal}"`)
        break
      }
    }

    if (!isDuplicate) {
      uniqueArticles.push(article)
      seenIds.add(article.id)
      titleMap.set(normalizedTitle, article.title)
    }
  }

  return uniqueArticles
}
