import { XMLParser } from "fast-xml-parser"
import type { NewsArticle, RSSFeed, RSSItem } from "@/types/article"
import { categorizeArticle } from "./categorizer"
import { fetchOGImage } from "./image-extractor"
import { generateNewsId } from "@/lib/utils/hash"

/**
 * RSS 피드에서 뉴스 기사 수집
 * @param feed RSS 피드 설정
 * @returns 수집된 뉴스 기사 배열
 */
export async function fetchRSSFeed(feed: RSSFeed): Promise<NewsArticle[]> {
  try {
    console.log(`[v0] Fetching ${feed.source} from ${feed.url}`)

    const response = await fetch(feed.url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; NewsBot/1.0)",
      },
      next: { revalidate: 300 }, // 5분 캐시
    })

    if (!response.ok) {
      console.log(`[v0] Skipping ${feed.source}: ${response.status}`)
      return []
    }

    const xmlData = await response.text()
    const items = parseRSSXML(xmlData)

    console.log(`[v0] Successfully fetched ${items.length} articles from ${feed.source}`)

    // RSS 아이템을 NewsArticle로 변환
    const articles = await Promise.all(
      items.slice(0, 10).map((item, index) => convertRSSItemToArticle(item, feed, index))
    )

    return articles
  } catch (error) {
    console.log(
      `[v0] Skipping ${feed.source} due to error:`,
      error instanceof Error ? error.message : "Unknown error"
    )
    return []
  }
}

/**
 * XML 데이터를 파싱하여 RSS 아이템 배열 추출
 */
function parseRSSXML(xmlData: string): RSSItem[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  })

  const result = parser.parse(xmlData)
  const items = result.rss?.channel?.item || result.feed?.entry || []

  return Array.isArray(items) ? items : [items]
}

/**
 * RSS 아이템을 NewsArticle로 변환
 */
async function convertRSSItemToArticle(
  item: RSSItem,
  feed: RSSFeed,
  index: number
): Promise<NewsArticle> {
  // 이미지 URL 추출
  let imageUrl = extractImageFromRSSItem(item)

  // RSS에 이미지가 없으면 OG 이미지 추출 시도
  if (!imageUrl && item.link) {
    imageUrl = await fetchOGImage(item.link)
  }

  // 카테고리 분류
  const category = categorizeArticle(item.title || "", item.description || "", item.category)

  // 링크 URL을 기반으로 고유한 ID 생성
  const articleLink = item.link || "#"
  const articleId = generateNewsId(articleLink, "rss")

  return {
    id: articleId,
    title: item.title || "No title",
    description: item.description || item.summary || "No description available",
    link: articleLink,
    pubDate: item.pubDate || item.published || new Date().toISOString(),
    source: feed.source,
    imageUrl,
    category,
    region: feed.region,
  }
}

/**
 * RSS 아이템에서 이미지 URL 추출
 */
function extractImageFromRSSItem(item: RSSItem): string | undefined {
  // media:thumbnail 시도
  if (item["media:thumbnail"]?.["@_url"]) {
    return item["media:thumbnail"]["@_url"]
  }

  // media:content 시도
  if (item["media:content"]?.["@_url"]) {
    return item["media:content"]["@_url"]
  }

  // media:group > media:content 시도
  if (item["media:group"]?.["media:content"]?.["@_url"]) {
    return item["media:group"]["media:content"]["@_url"]
  }

  // enclosure 시도 (이미지 타입인 경우만)
  if (item.enclosure?.["@_type"]?.startsWith("image")) {
    return item.enclosure["@_url"]
  }

  return undefined
}
