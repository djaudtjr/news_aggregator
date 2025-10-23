-- 뉴스 요약 정보를 저장하는 테이블
-- Supabase SQL Editor에서 실행하거나 자동 마이그레이션 사용

CREATE TABLE IF NOT EXISTS news_summaries (
  -- 기본 키: 뉴스 기사의 고유 ID (link URL 기반 해시)
  news_id TEXT PRIMARY KEY,

  -- 뉴스 기본 정보
  news_url TEXT NOT NULL,
  news_title TEXT,

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
COMMENT ON COLUMN news_summaries.summary IS 'AI가 생성한 요약 텍스트';
COMMENT ON COLUMN news_summaries.key_points IS 'AI가 추출한 핵심 포인트 배열';
COMMENT ON COLUMN news_summaries.view_count IS '요약이 조회된 횟수';
