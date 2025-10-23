import type { NewsCategory } from "@/types/article"

/**
 * 기사의 제목과 설명을 분석하여 카테고리를 자동으로 분류
 * @param title 기사 제목
 * @param description 기사 설명
 * @param rssCategory RSS 피드의 카테고리 정보
 * @returns 분류된 카테고리
 */
export function categorizeArticle(
  title: string,
  description: string,
  rssCategory?: string | string[]
): NewsCategory {
  const text = `${title} ${description}`.toLowerCase()

  // RSS 카테고리 기반 분류
  if (rssCategory) {
    const categoryStr = normalizeCategoryString(rssCategory)
    const categoryLower = categoryStr.toLowerCase()

    const rssCategoryMapping = checkRSSCategory(categoryLower)
    if (rssCategoryMapping) return rssCategoryMapping
  }

  // 키워드 기반 분류
  return categorizeByKeywords(text)
}

/**
 * RSS 카테고리를 문자열로 정규화
 */
function normalizeCategoryString(rssCategory: string | string[]): string {
  if (Array.isArray(rssCategory)) {
    return rssCategory[0]?.toString() || ""
  }
  if (typeof rssCategory === "object") {
    return JSON.stringify(rssCategory)
  }
  return String(rssCategory)
}

/**
 * RSS 카테고리 문자열에서 카테고리 추출
 */
function checkRSSCategory(categoryLower: string): NewsCategory | null {
  if (categoryLower.includes("business") || categoryLower.includes("economy") || categoryLower.includes("finance")) {
    return "business"
  }
  if (categoryLower.includes("tech") || categoryLower.includes("science")) {
    return "technology"
  }
  if (categoryLower.includes("health") || categoryLower.includes("medical")) {
    return "health"
  }
  if (categoryLower.includes("sport")) {
    return "sports"
  }
  if (categoryLower.includes("entertainment") || categoryLower.includes("culture")) {
    return "entertainment"
  }
  return null
}

/**
 * 키워드 기반 카테고리 분류
 */
function categorizeByKeywords(text: string): NewsCategory {
  // Business
  if (
    text.includes("business") ||
    text.includes("economy") ||
    text.includes("market") ||
    text.includes("stock") ||
    text.includes("trade") ||
    text.includes("finance")
  ) {
    return "business"
  }

  // Technology
  if (
    text.includes("technology") ||
    text.includes("tech") ||
    text.includes("ai") ||
    text.includes("software") ||
    text.includes("computer") ||
    text.includes("digital")
  ) {
    return "technology"
  }

  // Science
  if (
    text.includes("science") ||
    text.includes("research") ||
    text.includes("study") ||
    text.includes("scientist") ||
    text.includes("discovery")
  ) {
    return "science"
  }

  // Health
  if (
    text.includes("health") ||
    text.includes("medical") ||
    text.includes("hospital") ||
    text.includes("doctor") ||
    text.includes("disease") ||
    text.includes("vaccine")
  ) {
    return "health"
  }

  // Sports
  if (
    text.includes("sport") ||
    text.includes("football") ||
    text.includes("basketball") ||
    text.includes("soccer") ||
    text.includes("olympic") ||
    text.includes("championship")
  ) {
    return "sports"
  }

  // Entertainment
  if (
    text.includes("entertainment") ||
    text.includes("movie") ||
    text.includes("music") ||
    text.includes("celebrity") ||
    text.includes("film") ||
    text.includes("actor")
  ) {
    return "entertainment"
  }

  // Default: world news
  return "world"
}
