import type { NewsArticle } from "@/types/article"
import { categorizeArticle } from "./categorizer"
import { fetchOGImage } from "./image-extractor"
import { generateNewsId } from "@/lib/utils/hash"

/**
 * 네이버 뉴스 API 응답 인터페이스
 */
interface NaverNewsItem {
  title: string
  originallink: string
  link: string
  description: string
  pubDate: string
}

interface NaverNewsResponse {
  items: NaverNewsItem[]
}

/**
 * 네이버 뉴스 API에서 뉴스 검색
 * @param query 검색 키워드
 * @param display 검색 결과 개수 (기본 10, 최대 100)
 * @param skipImageExtraction 이미지 추출 건너뛰기 (검색 시 빠른 응답을 위해)
 * @param imageLimit 이미지 추출 개수 제한 (0 = 모두, undefined = skipImageExtraction에 따름)
 * @returns 뉴스 기사 배열
 */
export async function fetchNaverNews(
  query: string = "최신뉴스",
  display: number = 10,
  skipImageExtraction: boolean = false,
  imageLimit?: number
): Promise<NewsArticle[]> {
  const clientId = process.env.NAVER_CLIENT_ID
  const clientSecret = process.env.NAVER_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.log("[v0] Naver API credentials not found, skipping Naver news")
    return []
  }

  try {
    console.log(`[v0] Fetching Naver News with query: ${query}`)

    const url = new URL("https://openapi.naver.com/v1/search/news.json")
    url.searchParams.set("query", query)
    url.searchParams.set("display", display.toString())
    url.searchParams.set("sort", "date") // 최신순 정렬

    const response = await fetch(url.toString(), {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
      next: { revalidate: 300 }, // 5분 캐시
    })

    if (!response.ok) {
      console.log(`[v0] Naver News API error: ${response.status}`)
      return []
    }

    const data: NaverNewsResponse = await response.json()
    console.log(`[v0] Successfully fetched ${data.items.length} articles from Naver News`)

    // 네이버 뉴스 아이템을 NewsArticle로 변환
    const articles: NewsArticle[] = data.items.map((item) => {
      // HTML 태그 제거
      const cleanTitle = item.title.replace(/<\/?b>/g, "").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
      const cleanDescription = item.description.replace(/<\/?b>/g, "").replace(/&quot;/g, '"').replace(/&apos;/g, "'")

      // 카테고리 자동 분류
      const category = categorizeArticle(cleanTitle, cleanDescription)

      // 원본 링크
      const articleLink = item.originallink || item.link

      // 링크 URL을 기반으로 고유한 ID 생성
      const articleId = generateNewsId(articleLink, "naver")

      return {
        id: articleId,
        title: cleanTitle,
        description: cleanDescription,
        link: articleLink,
        pubDate: item.pubDate,
        source: "네이버 뉴스",
        imageUrl: undefined, // 이미지는 나중에 병렬로 추출
        category,
        region: "domestic",
      }
    })

    // 이미지 추출을 병렬로 처리
    // imageLimit이 설정되어 있으면 해당 개수만큼만 추출
    // skipImageExtraction이 false일 때만 추출
    if (!skipImageExtraction) {
      const limitCount = imageLimit !== undefined ? imageLimit : articles.length
      const articlesToFetchImages = articles.slice(0, limitCount)

      if (articlesToFetchImages.length > 0) {
        const imageResults = await Promise.allSettled(
          articlesToFetchImages.map((article) => fetchOGImage(article.link))
        )

        // 이미지 URL을 기사에 할당
        imageResults.forEach((result, index) => {
          if (result.status === "fulfilled" && result.value) {
            articles[index].imageUrl = result.value
          }
        })
      }
    }

    return articles
  } catch (error) {
    console.log(
      "[v0] Naver News fetch error:",
      error instanceof Error ? error.message : "Unknown error"
    )
    return []
  }
}

/**
 * 여러 키워드로 네이버 뉴스 검색
 * @param queries 검색 키워드 배열
 * @param displayPerQuery 각 키워드당 결과 개수
 * @returns 모든 뉴스 기사 배열
 */
export async function fetchNaverNewsByQueries(
  queries: string[] = ["최신뉴스", "IT", "경제", "정치"],
  displayPerQuery: number = 5
): Promise<NewsArticle[]> {
  const results = await Promise.all(
    queries.map((query) => fetchNaverNews(query, displayPerQuery))
  )

  return results.flat()
}
