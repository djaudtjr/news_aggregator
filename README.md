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
- **Region Filtering**: Filter by domestic/international news (전체/국내/해외)
- **Category Filtering**: World, Politics, Business, Technology, Science, Health, Sports, Entertainment
- **Time Range**: Filter news by recency (1 hour to 30 days)
- **Spell Check**: Automatic typo correction using OpenAI GPT-4o-mini
  - Detects and corrects Korean and English typos
  - Context-aware corrections
  - Displays corrected keyword notification

### 🎨 Modern UI/UX
- **Dark/Light Mode**: Full theme support with next-themes
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Smooth Animations**: Powered by tailwindcss-animate with cubic-bezier easing
- **Image Fallbacks**: Automatic retry and fallback to source logos
- **Bulk Actions**: Select multiple articles for batch operations
- **Recent Articles Sidebar**: Collapsible sidebar with smooth animations
  - Toggle expand/collapse with icon button
  - Animated transitions (width, opacity, staggered card appearance)
  - Displays up to 10 recent articles with thumbnails
- **News Statistics Box**: Fixed position box showing total news count and pagination
  - Displays current page and total pages (e.g., "Page 1 / 11")
  - Aligned with news cards for consistent layout
- **Layout Stability**: Fixed scrollbar position to prevent layout shifts
  - No content movement when opening dropdown menus
  - Forced scrollbar visibility for consistent viewport width

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
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI primitives (via shadcn/ui)
- **Icons**: Lucide React
- **Date Formatting**: date-fns

### Backend
- **Runtime**: Node.js with Next.js API Routes
- **RSS Parsing**: fast-xml-parser
- **Web Scraping**: Cheerio
- **AI**: OpenAI API (GPT-4o-mini)
- **Database**: Supabase (PostgreSQL with Realtime)
- **Translation**: Naver Cloud Papago API
- **Email**: Gmail SMTP (Nodemailer)
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
│   │   ├── cron/          # Cron job handlers
│   │   └── ... (auth, bookmarks, etc.)
│   ├── layout.tsx         # Root layout with theme provider
│   └── page.tsx           # Main page component
├── components/
│   ├── ui/                # Radix UI component wrappers (shadcn/ui)
│   ├── news-header.tsx    # Header with search and actions
│   ├── news-feed.tsx      # News grid with infinite scroll
│   ├── news-card.tsx      # Individual article card
│   └── ... (filters, sidebars, etc.)
├── lib/
│   ├── news/
│   │   ├── feeds.ts       # RSS feed configuration
│   │   ├── rss-fetcher.ts # RSS feed parser
│   │   └── naver-news-fetcher.ts # Naver News API client
│   ├── email/
│   │   └── gmail.ts       # Nodemailer Gmail transport
│   └── supabase/
│       ├── client.ts      # Client-side Supabase client
│       └── server.ts      # Server-side Supabase client
├── hooks/
│   ├── useNewsFilters.ts  # Filter state management
│   └── useArticleSummary.ts # AI summary hook
├── types/
│   └── article.ts         # TypeScript interfaces
├── supabase/
│   └── schema.sql         # Database schema
└── .env.local.example     # Environment variable template
```

## Installation

### Prerequisites
- Node.js 18+
- pnpm (recommended)
- Supabase account
- OpenAI API key
- Naver Cloud Platform account (for Papago API)
- Naver Developers account (for News API)
- Gmail account with App Password

### Setup

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd news-aggregator
    ```

2.  **Install dependencies**
    ```bash
    pnpm install
    ```

3.  **Configure environment variables**
    Create a `.env.local` file from the `.env.local.example` template and fill in the values.
    ```env
    # Supabase
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

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

    # Cron Job Security
    CRON_SECRET=your_random_secret
    ```

4.  **Set up Supabase database**
    - In your Supabase project, go to the `SQL Editor`.
    - Copy the entire content of `supabase/schema.sql` and run it.
    - This will create the necessary tables and policies.

5.  **Run the development server**
    ```bash
    pnpm dev
    ```

6.  **Open the application**
    Navigate to [http://localhost:3000](http://localhost:3000)

## API Endpoints

A brief overview of the main API endpoints located in `app/api/`:

- **`GET /api/news`**: Fetches and aggregates news from all configured RSS and Naver News sources.
- **`GET /api/search`**: Performs a search query against the news articles. Handles Korean-to-English translation for international searches.
- **`POST /api/crawl`**: Scrapes the full content of a given article URL.
- **`POST /api/summarize`**: Generates an AI summary for an article, caching the result in the database.
- **`GET /api/cron/send-daily-digest`**: A cron job endpoint to send out daily email digests to subscribers. Triggered by Vercel Cron.
- **`/api/auth/**`**: Handles user authentication callbacks.
- **`/api/bookmarks`**: Manages user bookmarks.
- **`/api/subscriptions/**`**: Manages user keyword subscriptions and email settings.

## Database Schema

The core database schema is defined in `supabase/schema.sql`. Here are the main tables:

- **`news_summaries`**: Caches AI-generated summaries and key points for articles to reduce costs and latency.
- **`user_profiles`**: Stores public user data like username and avatar.
- **`email_subscription_settings`**: Manages user preferences for email digests, including delivery days and time.
- **`subscribed_keywords`**: Stores the keywords each user is subscribed to.
- **`bookmarks`**: Associates users with their bookmarked articles.
- **`search_keyword_analytics`**: Logs search queries for trending keyword analysis.
- **`email_delivery_logs`**: Logs the status of sent email digests.

## Contributing

Contributions are welcome! Please open an issue to discuss any changes.

## License

This project is private and proprietary.