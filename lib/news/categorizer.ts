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
): NewsCategory | undefined {
  const text = `${title} ${description}`.toLowerCase()

  // RSS 카테고리 기반 분류
  if (rssCategory) {
    const categoryStr = normalizeCategoryString(rssCategory)
    const categoryLower = categoryStr.toLowerCase()

    const rssCategoryMapping = checkRSSCategory(categoryLower)
    if (rssCategoryMapping) {
      console.log(`[Categorizer] RSS category matched: "${title.substring(0, 50)}..." -> ${rssCategoryMapping}`)
      return rssCategoryMapping
    }
  }

  // 키워드 기반 분류
  const category = categorizeByKeywords(text)

  // 카테고리 분류 결과 로깅 (분류된 경우에만)
  if (category) {
    console.log(`[Categorizer] Keyword matched: "${title.substring(0, 50)}..." -> ${category}`)
  } else {
    console.log(`[Categorizer] Uncategorized: "${title.substring(0, 50)}..."`)
  }

  return category
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
  if (
    categoryLower.includes("business") ||
    categoryLower.includes("economy") ||
    categoryLower.includes("economic") ||
    categoryLower.includes("finance") ||
    categoryLower.includes("market") ||
    categoryLower.includes("경제") ||
    categoryLower.includes("비즈니스")
  ) {
    return "business"
  }
  if (
    categoryLower.includes("tech") ||
    categoryLower.includes("technology") ||
    categoryLower.includes("digital") ||
    categoryLower.includes("기술") ||
    categoryLower.includes("it")
  ) {
    return "technology"
  }
  if (
    categoryLower.includes("science") ||
    categoryLower.includes("scientific") ||
    categoryLower.includes("과학") ||
    categoryLower.includes("연구")
  ) {
    return "science"
  }
  if (
    categoryLower.includes("health") ||
    categoryLower.includes("medical") ||
    categoryLower.includes("medicine") ||
    categoryLower.includes("건강") ||
    categoryLower.includes("의료")
  ) {
    return "health"
  }
  if (
    categoryLower.includes("sport") ||
    categoryLower.includes("스포츠") ||
    categoryLower.includes("축구") ||
    categoryLower.includes("야구")
  ) {
    return "sports"
  }
  if (
    categoryLower.includes("entertainment") ||
    categoryLower.includes("culture") ||
    categoryLower.includes("movie") ||
    categoryLower.includes("music") ||
    categoryLower.includes("연예") ||
    categoryLower.includes("엔터")
  ) {
    return "entertainment"
  }
  return null
}

/**
 * 키워드 기반 카테고리 분류
 * 애매한 분류는 undefined 반환 (전체 카테고리에서만 표시)
 */
function categorizeByKeywords(text: string): NewsCategory | undefined {
  // Business (비즈니스)
  if (
    // 영문 키워드
    text.includes("business") ||
    text.includes("economy") ||
    text.includes("economic") ||
    text.includes("market") ||
    text.includes("stock") ||
    text.includes("trade") ||
    text.includes("trading") ||
    text.includes("finance") ||
    text.includes("financial") ||
    text.includes("investment") ||
    text.includes("investor") ||
    text.includes("company") ||
    text.includes("corporate") ||
    text.includes("startup") ||
    text.includes("entrepreneur") ||
    text.includes("agriculture") ||
    text.includes("farming") ||
    // 한글 키워드
    text.includes("경제") ||
    text.includes("시장") ||
    text.includes("주식") ||
    text.includes("기업") ||
    text.includes("금융") ||
    text.includes("투자") ||
    text.includes("무역") ||
    text.includes("재정") ||
    text.includes("비즈니스") ||
    text.includes("스타트업") ||
    text.includes("창업") ||
    text.includes("쌀") ||
    text.includes("경기미") ||
    text.includes("농산물") ||
    text.includes("농업") ||
    text.includes("농가") ||
    text.includes("수출") ||
    text.includes("수입")
  ) {
    return "business"
  }

  // Technology (기술)
  if (
    // 영문 키워드
    text.includes("technology") ||
    text.includes("tech") ||
    text.includes("ai") ||
    text.includes("artificial intelligence") ||
    text.includes("software") ||
    text.includes("computer") ||
    text.includes("digital") ||
    text.includes("internet") ||
    text.includes("startup") ||
    text.includes("app") ||
    text.includes("mobile") ||
    text.includes("robot") ||
    text.includes("automation") ||
    text.includes("cyber") ||
    // 한글 키워드
    text.includes("기술") ||
    text.includes("인공지능") ||
    text.includes("소프트웨어") ||
    text.includes("컴퓨터") ||
    text.includes("디지털") ||
    text.includes("인터넷") ||
    text.includes("앱") ||
    text.includes("모바일") ||
    text.includes("로봇") ||
    text.includes("자동화") ||
    text.includes("사이버")
  ) {
    return "technology"
  }

  // Science (과학)
  if (
    // 영문 키워드
    text.includes("science") ||
    text.includes("scientific") ||
    text.includes("research") ||
    text.includes("study") ||
    text.includes("scientist") ||
    text.includes("discovery") ||
    text.includes("experiment") ||
    text.includes("laboratory") ||
    text.includes("physics") ||
    text.includes("chemistry") ||
    text.includes("biology") ||
    text.includes("space") ||
    text.includes("climate") ||
    // 한글 키워드
    text.includes("과학") ||
    text.includes("연구") ||
    text.includes("실험") ||
    text.includes("과학자") ||
    text.includes("발견") ||
    text.includes("물리") ||
    text.includes("화학") ||
    text.includes("생물") ||
    text.includes("우주") ||
    text.includes("기후")
  ) {
    return "science"
  }

  // Health (건강)
  if (
    // 영문 키워드
    text.includes("health") ||
    text.includes("medical") ||
    text.includes("medicine") ||
    text.includes("hospital") ||
    text.includes("doctor") ||
    text.includes("disease") ||
    text.includes("vaccine") ||
    text.includes("virus") ||
    text.includes("patient") ||
    text.includes("treatment") ||
    text.includes("drug") ||
    text.includes("pharmaceutical") ||
    text.includes("wellness") ||
    // 한글 키워드
    text.includes("건강") ||
    text.includes("의료") ||
    text.includes("병원") ||
    text.includes("의사") ||
    text.includes("질병") ||
    text.includes("백신") ||
    text.includes("바이러스") ||
    text.includes("환자") ||
    text.includes("치료") ||
    text.includes("약물") ||
    text.includes("제약")
  ) {
    return "health"
  }

  // Sports (스포츠)
  if (
    // 영문 키워드
    text.includes("sport") ||
    text.includes("football") ||
    text.includes("basketball") ||
    text.includes("soccer") ||
    text.includes("baseball") ||
    text.includes("olympic") ||
    text.includes("championship") ||
    text.includes("tournament") ||
    text.includes("athlete") ||
    text.includes("player") ||
    text.includes("match") ||
    // 한글 키워드
    text.includes("스포츠") ||
    text.includes("축구") ||
    text.includes("야구") ||
    text.includes("농구") ||
    text.includes("배구") ||
    text.includes("올림픽") ||
    text.includes("선수") ||
    text.includes("우승") ||
    text.includes("골프") ||
    text.includes("테니스") ||
    text.includes("배드민턴") ||
    // "경기"는 스포츠 관련 단어와 함께 있을 때만 매칭
    (text.includes("경기") &&
      (text.includes("스포츠") ||
        text.includes("축구") ||
        text.includes("야구") ||
        text.includes("농구") ||
        text.includes("배구") ||
        text.includes("선수") ||
        text.includes("리그") ||
        text.includes("팀")))
  ) {
    return "sports"
  }

  // Entertainment (엔터테인먼트)
  if (
    // 영문 키워드
    text.includes("entertainment") ||
    text.includes("movie") ||
    text.includes("film") ||
    text.includes("music") ||
    text.includes("celebrity") ||
    text.includes("actor") ||
    text.includes("actress") ||
    text.includes("singer") ||
    text.includes("concert") ||
    text.includes("album") ||
    text.includes("show") ||
    text.includes("series") ||
    text.includes("drama") ||
    // 한글 키워드
    text.includes("엔터") ||
    text.includes("연예") ||
    text.includes("영화") ||
    text.includes("음악") ||
    text.includes("배우") ||
    text.includes("가수") ||
    text.includes("콘서트") ||
    text.includes("앨범") ||
    text.includes("드라마") ||
    text.includes("방송")
  ) {
    return "entertainment"
  }

  // World (세계/국제 뉴스)
  if (
    // 영문 키워드
    text.includes("world") ||
    text.includes("international") ||
    text.includes("global") ||
    text.includes("war") ||
    text.includes("conflict") ||
    text.includes("diplomacy") ||
    text.includes("united nations") ||
    text.includes("summit") ||
    text.includes("treaty") ||
    // 한글 키워드
    text.includes("세계") ||
    text.includes("국제") ||
    text.includes("글로벌") ||
    text.includes("전쟁") ||
    text.includes("분쟁") ||
    text.includes("외교") ||
    text.includes("유엔") ||
    text.includes("정상회담") ||
    text.includes("조약") ||
    text.includes("국가") ||
    text.includes("정부") ||
    text.includes("대통령") ||
    text.includes("총리")
  ) {
    return "world"
  }

  // Default: 애매한 분류는 undefined (전체 카테고리에서만 표시)
  return undefined
}
