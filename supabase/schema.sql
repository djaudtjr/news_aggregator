-- 뉴스 요약 정보를 저장하는 테이블
-- Supabase SQL Editor에서 실행하거나 자동 마이그레이션 사용

CREATE TABLE IF NOT EXISTS news_summaries (
  -- 기본 키: 뉴스 기사의 고유 ID (link URL 기반 해시)
  news_id TEXT PRIMARY KEY,

  -- 뉴스 기본 정보
  news_url TEXT NOT NULL,
  news_title TEXT,
  category TEXT, -- 뉴스 카테고리 (world, business, technology, science, health, sports, entertainment)

  -- AI 요약 정보
  summary TEXT NOT NULL,
  key_points TEXT[], -- 핵심 포인트 배열

  -- 메타 정보
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  -- 통계
  view_count INTEGER DEFAULT 0
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_news_summaries_news_url ON news_summaries(news_url);
CREATE INDEX IF NOT EXISTS idx_news_summaries_key_points ON news_summaries(key_points);
CREATE INDEX IF NOT EXISTS idx_news_summaries_category ON news_summaries(category);
CREATE INDEX IF NOT EXISTS idx_news_summaries_created_at ON news_summaries(created_at DESC);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_news_summaries_updated_at BEFORE UPDATE ON news_summaries
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) 활성화
ALTER TABLE news_summaries ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능
CREATE POLICY "Enable read access for all users" ON news_summaries
  FOR SELECT USING (true);

-- 모든 사용자가 삽입 가능 (요약 생성)
CREATE POLICY "Enable insert for all users" ON news_summaries
  FOR INSERT WITH CHECK (true);

-- 모든 사용자가 업데이트 가능 (조회수 증가)
CREATE POLICY "Enable update for all users" ON news_summaries
  FOR UPDATE USING (true);

-- 설명
COMMENT ON TABLE news_summaries IS 'AI로 요약된 뉴스 기사 정보 저장';
COMMENT ON COLUMN news_summaries.news_id IS '뉴스 기사의 고유 ID (link URL 기반 해시)';
COMMENT ON COLUMN news_summaries.category IS '뉴스 카테고리 (world, business, technology, science, health, sports, entertainment)';
COMMENT ON COLUMN news_summaries.summary IS 'AI가 생성한 요약 텍스트';
COMMENT ON COLUMN news_summaries.key_points IS 'AI가 추출한 핵심 포인트 배열';
COMMENT ON COLUMN news_summaries.view_count IS '요약이 조회된 횟수';


-- ============================================================================
-- AI 요약 사용 통계 테이블
-- 사용자별 AI 요약 요청 및 뉴스 링크 클릭 추적
-- ============================================================================

CREATE TABLE IF NOT EXISTS news_summary_analytics (
  -- 복합 기본 키: 사용자 + 뉴스 ID
  id BIGSERIAL PRIMARY KEY,

  -- 사용자 정보 (비로그인 사용자는 'Anonymous')
  user_id TEXT NOT NULL DEFAULT 'Anonymous',

  -- 뉴스 ID (news_summaries 테이블 참조)
  news_id TEXT NOT NULL,

  -- Cron Job ID (Vercel cron job에서 실행될 때만 사용, nullable)
  job_id TEXT,

  -- AI 요약 요청 횟수
  summary_request_count INTEGER DEFAULT 1 NOT NULL,

  -- 뉴스 전문 링크 클릭 횟수
  link_click_count INTEGER DEFAULT 0 NOT NULL,

  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  -- 제약 조건: user_id + news_id 조합은 유일해야 함
  CONSTRAINT unique_user_news UNIQUE (user_id, news_id)
);

-- 외래 키 제약 조건 (news_summaries 테이블 참조)
ALTER TABLE news_summary_analytics
  ADD CONSTRAINT fk_news_summary
  FOREIGN KEY (news_id)
  REFERENCES news_summaries(news_id)
  ON DELETE CASCADE;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_news_summary_analytics_user_id
  ON news_summary_analytics(user_id);

CREATE INDEX IF NOT EXISTS idx_news_summary_analytics_news_id
  ON news_summary_analytics(news_id);

CREATE INDEX IF NOT EXISTS idx_news_summary_analytics_job_id
  ON news_summary_analytics(job_id) WHERE job_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_news_summary_analytics_created_at
  ON news_summary_analytics(created_at DESC);

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_news_summary_analytics_updated_at
  BEFORE UPDATE ON news_summary_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) 활성화
ALTER TABLE news_summary_analytics ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능
CREATE POLICY "Enable read access for all users" ON news_summary_analytics
  FOR SELECT USING (true);

-- 모든 사용자가 삽입 가능 (통계 기록)
CREATE POLICY "Enable insert for all users" ON news_summary_analytics
  FOR INSERT WITH CHECK (true);

-- 모든 사용자가 업데이트 가능 (카운트 증가)
CREATE POLICY "Enable update for all users" ON news_summary_analytics
  FOR UPDATE USING (true);

-- 인증된 사용자만 자신의 데이터 삭제 가능
CREATE POLICY "Enable delete for users based on user_id" ON news_summary_analytics
  FOR DELETE USING (auth.uid()::text = user_id);

-- 설명
COMMENT ON TABLE news_summary_analytics IS '사용자별 AI 요약 요청 및 뉴스 링크 클릭 통계';
COMMENT ON COLUMN news_summary_analytics.user_id IS '사용자 UID (Supabase Auth), 비로그인은 Anonymous';
COMMENT ON COLUMN news_summary_analytics.news_id IS '뉴스 기사 ID (news_summaries 참조)';
COMMENT ON COLUMN news_summary_analytics.job_id IS 'Vercel Cron Job ID (cron 실행 시에만)';
COMMENT ON COLUMN news_summary_analytics.summary_request_count IS 'AI 요약 요청 횟수';
COMMENT ON COLUMN news_summary_analytics.link_click_count IS '뉴스 전문 링크 클릭 횟수';


-- ============================================================================
-- 검색 키워드 통계 테이블
-- 사용자별 검색 키워드 조회 통계 추적
-- ============================================================================

CREATE TABLE IF NOT EXISTS search_keyword_analytics (
  -- 기본 키
  id BIGSERIAL PRIMARY KEY,

  -- 사용자 정보 (비로그인 사용자는 'Anonymous')
  user_id TEXT NOT NULL DEFAULT 'Anonymous',

  -- 검색 키워드
  keyword TEXT NOT NULL,

  -- 조회수 (해당 사용자가 이 키워드로 검색한 횟수)
  search_count INTEGER DEFAULT 1 NOT NULL,

  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  last_searched_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  -- 제약 조건: user_id + keyword 조합은 유일해야 함
  CONSTRAINT unique_user_keyword UNIQUE (user_id, keyword)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_search_keyword_analytics_user_id
  ON search_keyword_analytics(user_id);

CREATE INDEX IF NOT EXISTS idx_search_keyword_analytics_keyword
  ON search_keyword_analytics(keyword);

CREATE INDEX IF NOT EXISTS idx_search_keyword_analytics_last_searched
  ON search_keyword_analytics(last_searched_at DESC);

CREATE INDEX IF NOT EXISTS idx_search_keyword_analytics_search_count
  ON search_keyword_analytics(search_count DESC);

-- last_searched_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_last_searched_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_searched_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_search_keyword_analytics_last_searched
  BEFORE UPDATE ON search_keyword_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_last_searched_at_column();

-- Row Level Security (RLS) 활성화
ALTER TABLE search_keyword_analytics ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능
CREATE POLICY "Enable read access for all users" ON search_keyword_analytics
  FOR SELECT USING (true);

-- 모든 사용자가 삽입 가능 (검색 기록)
CREATE POLICY "Enable insert for all users" ON search_keyword_analytics
  FOR INSERT WITH CHECK (true);

-- 모든 사용자가 업데이트 가능 (카운트 증가)
CREATE POLICY "Enable update for all users" ON search_keyword_analytics
  FOR UPDATE USING (true);

-- 인증된 사용자만 자신의 데이터 삭제 가능
CREATE POLICY "Enable delete for users based on user_id" ON search_keyword_analytics
  FOR DELETE USING (auth.uid()::text = user_id);

-- 설명
COMMENT ON TABLE search_keyword_analytics IS '사용자별 검색 키워드 조회 통계';
COMMENT ON COLUMN search_keyword_analytics.user_id IS '사용자 UID (Supabase Auth), 비로그인은 Anonymous';
COMMENT ON COLUMN search_keyword_analytics.keyword IS '검색한 키워드';
COMMENT ON COLUMN search_keyword_analytics.search_count IS '해당 사용자가 이 키워드로 검색한 총 횟수';
COMMENT ON COLUMN search_keyword_analytics.last_searched_at IS '마지막 검색 일시';


-- ============================================================================
-- 북마크 테이블
-- 사용자가 저장한 뉴스 기사를 저장
-- ============================================================================

CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  article_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  link TEXT NOT NULL,
  source TEXT,
  image_url TEXT,
  category TEXT,
  region TEXT,
  pub_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, article_id)
);

-- 북마크 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks(created_at DESC);

-- Row Level Security (RLS) 정책 설정
-- 북마크: 사용자는 자신의 북마크만 조회/수정/삭제 가능
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bookmarks"
  ON bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookmarks"
  ON bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks"
  ON bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- 설명
COMMENT ON TABLE bookmarks IS '사용자가 저장한 뉴스 기사 북마크';
COMMENT ON COLUMN bookmarks.user_id IS '사용자 UID (Supabase Auth)';
COMMENT ON COLUMN bookmarks.article_id IS '뉴스 기사의 고유 ID';
COMMENT ON COLUMN bookmarks.title IS '뉴스 제목';
COMMENT ON COLUMN bookmarks.link IS '뉴스 원문 링크';


-- ============================================================================
-- 사용자 설정 테이블
-- 사용자의 관심 카테고리, 지역 등 개인화 설정 저장
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  preferred_categories TEXT[] DEFAULT '{}',
  preferred_region TEXT DEFAULT 'all',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) 정책 설정
-- 사용자 설정: 사용자는 자신의 설정만 조회/수정 가능
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- 설명
COMMENT ON TABLE user_preferences IS '사용자 개인화 설정 (관심 카테고리, 지역 등)';
COMMENT ON COLUMN user_preferences.user_id IS '사용자 UID (Supabase Auth)';
COMMENT ON COLUMN user_preferences.preferred_categories IS '선호하는 뉴스 카테고리 배열';
COMMENT ON COLUMN user_preferences.preferred_region IS '선호하는 지역 (all, domestic, international)';
