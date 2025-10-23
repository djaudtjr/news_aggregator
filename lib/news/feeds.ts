import type { RSSFeed } from "@/types/article"

/**
 * RSS 피드 소스 목록
 * 국내/해외 뉴스 소스를 중앙에서 관리
 */
export const RSS_FEEDS: RSSFeed[] = [
  // 국제 뉴스
  {
    url: "https://feeds.bbci.co.uk/news/world/rss.xml",
    source: "BBC World",
    region: "international",
  },
  {
    url: "https://www.theguardian.com/world/rss",
    source: "The Guardian",
    region: "international",
  },
  {
    url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
    source: "NY Times World",
    region: "international",
  },
  {
    url: "https://www.reddit.com/r/worldnews/.rss",
    source: "Reddit World News",
    region: "international",
  },
  {
    url: "http://rss.cnn.com/rss/edition_world.rss",
    source: "CNN World",
    region: "international",
  },
  // 기술 뉴스
  {
    url: "https://feeds.feedburner.com/TechCrunch/",
    source: "TechCrunch",
    region: "international",
  },
  {
    url: "https://www.technologyreview.com/topnews.rss",
    source: "MIT Technology Review",
    region: "international",
  },
  // 국내 뉴스
  {
    url: "https://www.yna.co.kr/rss/society.xml",
    source: "연합뉴스 사회",
    region: "domestic",
  },
  {
    url: "https://www.yna.co.kr/rss/industry.xml",
    source: "연합뉴스 산업",
    region: "domestic",
  },
  {
    url: "https://news.sbs.co.kr/news/newsflashRssFeed.do?plink=RSSREADER",
    source: "SBS 뉴스",
    region: "domestic",
  },
]
