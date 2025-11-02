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
- **Category Filtering**: World, Politics, Business, Technology, Science, Health, Sports, Entertainment
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

### 📧 Email Subscription
- **Keyword Subscription**: Subscribe to up to 3 keywords (searches in news titles/content)
- **Immediate Delivery System**:
  - Cron execution: KST 5AM, 11AM, 5PM (±3 hour time window for Vercel Cron delay)
  - Immediate delivery via Gmail SMTP (no DNS configuration required)
  - 5 latest news articles per keyword (e.g., 3 keywords → up to 15 articles)
- **Delivery Settings**:
  - Select delivery days (Sun-Sat)
  - Choose delivery time (6AM or 6PM via radio buttons)
  - Enable/disable toggle
  - Test send button for immediate testing
- **AI-Powered Email Template**:
  - Table layout with keyword columns (e.g., "KOSPI | ETF | KOSDAQ")
  - Each row displays one news article per keyword side-by-side
  - Equal column widths for consistent viewing
  - Full article crawling and AI summarization (GPT-4o-mini)
  - Key points extraction for each article
  - Responsive HTML design with card-based layout
  - Includes news title, AI summary, key points, source, date, and original link

### 🔥 Real-time Trending Keywords
- **Supabase Realtime Integration**: Live updates when search keywords change
- **Smart Deduplication**: Normalizes keywords (removes spaces, converts to uppercase)
  - "AI", "ai", " AI " → unified as "AI"
  - "인공지능", " 인공지능 " → unified as "인공지능"
- **Multi-Browser Sync**: All connected browsers update simultaneously
- **Time Range Filters**: 1 hour, 24 hours, 7 days

### 🎯 User Experience Enhancements
- **MyPage Email Test Dialog**: Modern AlertDialog with detailed information
  - Shows recipient email and subscribed keywords
  - Styled "Send" button with clear visual hierarchy
  - Progress toast notifications (sending, success, failure)
  - Detailed success message with email stats (recipient, news count, keywords)

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
- **Database**: Supabase (PostgreSQL with Realtime)
- **Translation**: Naver Cloud Papago API
- **Email**: Gmail SMTP (nodemailer)
- **Cron**: Vercel Cron Jobs

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
- Supabase account (with Realtime enabled)
- OpenAI API key
- Naver Cloud Platform account (for Papago API)
- Naver Developers account (for News API)
- Gmail account with App Password (for email delivery)

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
   NEXT_SUPABASE_URL=your_supabase_project_url
   NEXT_SUPABASE_ANON_KEY=your_supabase_anon_key

   # OpenAI
   OPENAI_API_KEY=your_openai_api_key

   # Naver Cloud Platform (Papago Translation)
   NAVER_CLOUD_CLIENT_ID=your_ncp_client_id
   NAVER_CLOUD_CLIENT_SECRET=your_ncp_client_secret

   # Naver Developers (News API)
   NAVER_CLIENT_ID=your_naver_client_id
   NAVER_CLIENT_SECRET=your_naver_client_secret

   # Gmail SMTP (Email Delivery)
   GMAIL_USERNAME=your_gmail_address@gmail.com
   GMAIL_APP_PASSWORD=your_16_digit_app_password

   # Base URL
   NEXT_PUBLIC_BASE_URL=http://localhost:3000

   # (Optional) Cron Job Security
   CRON_SECRET=your_random_secret
   ```

   **Gmail App Password Setup**:
   1. Go to [Google Account Security](https://myaccount.google.com/security)
   2. Enable 2-Step Verification
   3. Go to "App passwords" section
   4. Generate new app password for "Mail"
   5. Copy the 16-digit password (without spaces)
   6. Use it as `GMAIL_APP_PASSWORD`

4. **Set up Supabase database**

   a. Run the SQL schema in your Supabase SQL Editor:
   ```bash
   # Copy contents from supabase/schema.sql and execute in Supabase
   ```

   b. Enable Realtime for `search_keyword_analytics` table:
   ```sql
   -- In Supabase SQL Editor
   CREATE PUBLICATION supabase_realtime FOR TABLE search_keyword_analytics;

   ALTER TABLE search_keyword_analytics ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "Allow public read access"
   ON search_keyword_analytics FOR SELECT TO public USING (true);

   CREATE POLICY "Allow authenticated write"
   ON search_keyword_analytics FOR INSERT TO authenticated WITH CHECK (true);
   ```

   c. Or use Supabase Dashboard:
   - Go to Database → Replication
   - Find `search_keyword_analytics` table
   - Click "Enable" toggle

5. **Run the development server**
   ```bash
   pnpm dev
   ```

6. **Open the application**
   Navigate to [http://localhost:3000](http://localhost:3000)

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

### POST /api/email/send-digest
Sends email digest (immediate or scheduled).

**Request Body:**
```json
{
  "userId": "user-uuid",
  "scheduledDeliveryHour": 12  // Optional: 6, 12, or 18 for scheduled delivery
}
```

**Response:**
```json
{
  "success": true,
  "newsCount": 8,
  "emailId": "email-id",
  "scheduledAt": "2025-10-26T12:00:00Z"  // Only present if scheduled
}
```

### GET /api/cron/send-daily-digest
Processes scheduled email delivery for all subscribers (Cron only).

**Execution Schedule:**
- KST 5AM, 11AM, 5PM (UTC 8PM, 2AM, 8AM)
- Filters subscribers by delivery hour (1 hour ahead)
- Uses Resend scheduled sending API

**Response:**
```json
{
  "message": "Daily digest scheduled email job completed",
  "currentDay": 1,
  "currentHour": 5,
  "targetDeliveryHour": 6,
  "processedCount": 25,
  "successCount": 24,
  "failedCount": 1,
  "results": [...]
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

### email_subscription_settings Table
```sql
CREATE TABLE email_subscription_settings (
  user_id UUID PRIMARY KEY,
  enabled BOOLEAN DEFAULT false,
  email TEXT NOT NULL,
  delivery_days INTEGER[] DEFAULT '{1,2,3,4,5}',  -- 0=Sun, 1=Mon, ..., 6=Sat
  delivery_hour INTEGER DEFAULT 6 CHECK (delivery_hour IN (6, 12, 18)),
  last_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

### subscribed_keywords Table
```sql
CREATE TABLE subscribed_keywords (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  keyword TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, keyword)
);
```

### email_delivery_logs Table
```sql
CREATE TABLE email_delivery_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  email TEXT NOT NULL,
  status TEXT CHECK (status IN ('success', 'failed', 'pending')),
  news_count INTEGER DEFAULT 0,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE
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

### Scheduled Email Delivery System
1. **Cron Job Execution** (KST 5AM, 11AM, 5PM):
   - Calculate target delivery hour: `currentHour + 1`
   - Query enabled subscribers from database
   - Filter by matching `delivery_days` and `delivery_hour`

2. **News Collection** (for each subscriber):
   - Fetch subscribed keywords
   - Search news from last 24 hours matching keywords
   - Deduplicate and sort by recency
   - Select top 10 articles

3. **Scheduled Sending**:
   - Generate HTML email template
   - Convert KST delivery time to UTC ISO 8601 format
   - Call Resend API with `scheduledAt` parameter
   - Log delivery attempt to database

4. **Automatic Delivery**:
   - Resend automatically sends emails at scheduled time
   - Actual delivery: KST 6AM, 12PM, 6PM

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

### Gmail
1. Use an existing Gmail account or create a new one
2. Enable 2-Step Verification in Google Account Security
3. Generate an App Password for "Mail" application
4. Copy the 16-digit password (remove spaces)
5. Add to `.env.local` as `GMAIL_APP_PASSWORD`

**Note**: Gmail has a daily sending limit of ~500 emails for regular accounts. For high-volume sending, consider Google Workspace or alternative services.

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
