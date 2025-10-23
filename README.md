# Pulse News Aggregator

A modern, AI-powered news aggregation platform that collects, categorizes, and summarizes news from multiple sources worldwide.

[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js%2015-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

## Features

### 🌍 Multi-Source News Aggregation
- **International Sources**: BBC World, The Guardian, NY Times, CNN, Reddit World News
- **Technology News**: TechCrunch, MIT Technology Review
- **Domestic Sources (Korean)**: 연합뉴스, SBS 뉴스, Naver News API
- Automatic RSS feed parsing and Naver News API integration
- Smart deduplication to remove duplicate articles across sources

### 🤖 AI-Powered Summaries
- **Full Article Crawling**: Extracts complete article content from news websites
- **OpenAI Integration**: Generates concise summaries using GPT-4o-mini
- **Key Points Extraction**: Automatically identifies and highlights main points
- **Database Caching**: Stores summaries in Supabase to reduce API costs
- **Smart Caching**: Reuses existing summaries with view count tracking

### 🔍 Advanced Search & Filtering
- **Real-time Search**: Search across all news sources
- **Bilingual Support**: Korean language detection (Papago API integration)
- **Region Filtering**: Filter by domestic/international news
- **Category Filtering**: World, Technology, Business, Science, Health, Sports, Entertainment
- **Time Range**: Filter news by recency (1-48 hours)

### 🎨 Modern UI/UX
- **Dark/Light Mode**: Full theme support with next-themes
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Smooth Animations**: Powered by tailwindcss-animate
- **Image Fallbacks**: Automatic retry and fallback to source logos
- **Bulk Actions**: Select multiple articles for batch operations

### 📊 Smart Features
- **Unique Article IDs**: URL-based hashing for consistent identification
- **View Count Tracking**: Track how many times summaries are viewed
- **Auto-refresh**: Manual refresh with state reset
- **Loading States**: Skeleton screens and loading indicators

## Tech Stack

### Frontend
- **Framework**: Next.js 15.2.4 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4.1.9
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **Date Formatting**: date-fns

### Backend
- **Runtime**: Node.js with Next.js API Routes
- **RSS Parsing**: fast-xml-parser
- **Web Scraping**: Cheerio
- **AI**: OpenAI API (GPT-4o-mini)
- **Database**: Supabase (PostgreSQL)
- **Translation**: Naver Cloud Papago API

### Development
- **Package Manager**: pnpm
- **Build Tool**: Turbopack (Next.js)
- **Type Checking**: TypeScript strict mode
- **Linting**: ESLint

## Project Structure

```
news-aggregator/
├── app/
│   ├── api/
│   │   ├── news/          # Main news aggregation endpoint
│   │   ├── search/        # Search with translation support
│   │   ├── crawl/         # Full article content crawler
│   │   ├── summarize/     # AI summarization with caching
│   │   └── test-translate/ # Translation testing endpoint
│   ├── layout.tsx         # Root layout with theme provider
│   └── page.tsx           # Main page component
├── components/
│   ├── ui/                # Radix UI component wrappers
│   ├── news-header.tsx    # Header with search and actions
│   ├── news-feed.tsx      # News grid with infinite scroll
│   ├── news-card.tsx      # Individual article card
│   ├── news-categories.tsx # Category filter tabs
│   ├── region-filter.tsx  # Domestic/International toggle
│   ├── time-range-filter.tsx # Time range slider
│   ├── bulk-actions.tsx   # Bulk selection actions
│   └── theme-toggle.tsx   # Dark/light mode switcher
├── lib/
│   ├── news/
│   │   ├── feeds.ts       # RSS feed configuration
│   │   ├── rss-fetcher.ts # RSS feed parser
│   │   ├── naver-news-fetcher.ts # Naver News API client
│   │   ├── categorizer.ts # AI-based categorization
│   │   └── image-extractor.ts # Image URL extraction
│   ├── utils/
│   │   ├── language-utils.ts # Korean detection & translation
│   │   ├── news-logos.ts  # Source logo mappings
│   │   └── hash.ts        # URL-based ID generation
│   └── supabase/
│       └── client.ts      # Supabase client configuration
├── hooks/
│   ├── useNewsFilters.ts  # Filter state management
│   └── useArticleSummary.ts # AI summary hook
├── types/
│   └── article.ts         # TypeScript interfaces
├── supabase/
│   └── schema.sql         # Database schema
└── .env.local             # Environment variables (not in repo)
```

## Installation

### Prerequisites
- Node.js 18+ or compatible runtime
- pnpm (recommended) or npm
- Supabase account
- OpenAI API key
- Naver Cloud Platform account (for Papago API)
- Naver Developers account (for News API)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd news-aggregator
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Supabase
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

   # OpenAI
   OPENAI_API_KEY=your_openai_api_key

   # Naver Cloud Platform (Papago Translation)
   NAVER_CLOUD_CLIENT_ID=your_ncp_client_id
   NAVER_CLOUD_CLIENT_SECRET=your_ncp_client_secret

   # Naver Developers (News API)
   NAVER_CLIENT_ID=your_naver_client_id
   NAVER_CLIENT_SECRET=your_naver_client_secret

   # Base URL
   NEXT_PUBLIC_BASE_URL=http://localhost:3001
   ```

4. **Set up Supabase database**
   Run the SQL schema in your Supabase SQL Editor:
   ```bash
   # Copy contents from supabase/schema.sql and execute in Supabase
   ```

5. **Run the development server**
   ```bash
   pnpm dev
   ```

6. **Open the application**
   Navigate to [http://localhost:3001](http://localhost:3001)

## API Endpoints

### GET /api/news
Fetches aggregated news from all sources (RSS + Naver News).

**Query Parameters:**
- `t` (optional): Timestamp for cache busting

**Response:**
```json
{
  "articles": [...],
  "stats": {
    "total": 105,
    "naver": 25,
    "rss": 100,
    "duplicatesRemoved": 20
  }
}
```

### GET /api/search
Search news with automatic Korean-to-English translation.

**Query Parameters:**
- `q`: Search query
- `region`: "all" | "domestic" | "international"
- `t` (optional): Timestamp

**Response:**
```json
{
  "articles": [...],
  "query": "AI",
  "region": "all",
  "isKorean": false,
  "translated": false
}
```

### POST /api/crawl
Crawls full article content from a URL.

**Request Body:**
```json
{
  "url": "https://example.com/article"
}
```

**Response:**
```json
{
  "success": true,
  "content": "Full article text...",
  "wordCount": 1250,
  "url": "https://example.com/article"
}
```

### POST /api/summarize
Generates AI summary with database caching.

**Request Body:**
```json
{
  "title": "Article title",
  "description": "Article description",
  "link": "https://example.com/article",
  "newsId": "news-abc123",
  "apiKey": "optional_openai_key"
}
```

**Response:**
```json
{
  "summary": "AI-generated summary...",
  "keyPoints": ["Point 1", "Point 2", "Point 3"],
  "fromCache": false,
  "viewCount": 1
}
```

## Database Schema

### news_summaries Table
```sql
CREATE TABLE news_summaries (
  news_id TEXT PRIMARY KEY,           -- Unique article ID (URL hash)
  news_url TEXT NOT NULL,             -- Original article URL
  news_title TEXT,                    -- Article title
  summary TEXT NOT NULL,              -- AI-generated summary
  key_points TEXT[],                  -- Array of key points
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0        -- Number of views
);
```

## Key Features Implementation

### AI Summarization Flow
1. User clicks "AI 요약" button on news card
2. System checks Supabase for existing summary by `news_id`
3. If cached: Return summary and increment view count
4. If not cached:
   - Crawl full article content using Cheerio
   - Send to OpenAI GPT-4o-mini for summarization
   - Parse response into summary + key points
   - Save to Supabase for future use
5. Display summary with cache indicator

### Article Deduplication
- Uses URL-based hashing to generate unique IDs
- Compares articles across Naver News and RSS sources
- Removes duplicates based on matching IDs
- Logs deduplication statistics

### Image Fallback Strategy
1. Try loading article's original image
2. On first error: Retry with `?retry=1` parameter
3. On second error: Fall back to news source logo
4. Logos stored in `lib/utils/news-logos.ts`

### Bilingual Search
1. Detect if query is Korean using regex
2. If Korean: Search Naver News directly
3. Attempt translation to English via Papago API
4. Search international sources with translated query
5. Combine results from both searches

## Development

### Run development server
```bash
pnpm dev
```

### Build for production
```bash
pnpm build
```

### Start production server
```bash
pnpm start
```

### Lint code
```bash
pnpm lint
```

## Environment Setup

### Supabase
1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your URL and anon key
3. Run the SQL from `supabase/schema.sql` in SQL Editor
4. Enable Row Level Security (already configured in schema)

### OpenAI
1. Sign up at [platform.openai.com](https://platform.openai.com)
2. Create an API key
3. Add billing information (GPT-4o-mini is cost-effective)

### Naver Cloud Platform
1. Register at [ncloud.com](https://ncloud.com)
2. Create a Papago NMT API application
3. Get Client ID and Client Secret

### Naver Developers
1. Register at [developers.naver.com](https://developers.naver.com)
2. Create a News Search API application
3. Get Client ID and Client Secret

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is private and proprietary.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)
- AI powered by [OpenAI](https://openai.com/)
- Database by [Supabase](https://supabase.com/)
- News sources: BBC, The Guardian, NY Times, CNN, TechCrunch, MIT Tech Review, 연합뉴스, SBS, Naver

## Support

For issues, questions, or suggestions, please open an issue in the repository.

---

**Made with ❤️ using Next.js and AI**
