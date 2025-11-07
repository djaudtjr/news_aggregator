-- ============================================================================
-- 뉴스 구독 키워드 테이블
-- 사용자가 구독한 키워드 저장
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscribed_keywords (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  keyword TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, keyword)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_subscribed_keywords_user_id ON subscribed_keywords(user_id);
CREATE INDEX IF NOT EXISTS idx_subscribed_keywords_keyword ON subscribed_keywords(keyword);

-- Row Level Security (RLS)
ALTER TABLE subscribed_keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own keywords"
  ON subscribed_keywords FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own keywords"
  ON subscribed_keywords FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own keywords"
  ON subscribed_keywords FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE subscribed_keywords IS '사용자가 구독한 뉴스 키워드';
COMMENT ON COLUMN subscribed_keywords.user_id IS '사용자 UID (Supabase Auth)';
COMMENT ON COLUMN subscribed_keywords.keyword IS '구독 키워드';


-- ============================================================================
-- 이메일 구독 설정 테이블
-- 사용자의 이메일 발송 설정 저장
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_subscription_settings (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,

  -- 이메일 발송 활성화 여부
  enabled BOOLEAN DEFAULT false NOT NULL,

  -- 수신 이메일 (Supabase Auth의 email과 다를 수 있음)
  email TEXT NOT NULL,

  -- 발송 요일 (0=일요일, 1=월요일, ..., 6=토요일)
  delivery_days INTEGER[] DEFAULT '{1,2,3,4,5}' NOT NULL, -- 기본값: 월~금

  -- 발송 시간 (KST 기준, 6, 18 중 선택)
  delivery_hour INTEGER DEFAULT 6 NOT NULL CHECK (delivery_hour IN (6, 18)),

  -- 즐겨찾기 뉴스 조회 기능 활성화 여부 (메인 페이지에서 구독 키워드로만 뉴스 조회)
  favorite_news_enabled BOOLEAN DEFAULT true NOT NULL,

  -- 마지막 발송 일시
  last_sent_at TIMESTAMP WITH TIME ZONE,

  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_email_subscription_settings_enabled
  ON email_subscription_settings(enabled) WHERE enabled = true;

CREATE INDEX IF NOT EXISTS idx_email_subscription_settings_delivery_days
  ON email_subscription_settings USING GIN (delivery_days);

-- updated_at 자동 업데이트 트리거 (기존 함수 재사용)
CREATE TRIGGER update_email_subscription_settings_updated_at
  BEFORE UPDATE ON email_subscription_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE email_subscription_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings"
  ON email_subscription_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON email_subscription_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON email_subscription_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings"
  ON email_subscription_settings FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE email_subscription_settings IS '사용자별 이메일 구독 설정';
COMMENT ON COLUMN email_subscription_settings.enabled IS '이메일 발송 활성화 여부';
COMMENT ON COLUMN email_subscription_settings.email IS '수신 이메일 주소';
COMMENT ON COLUMN email_subscription_settings.delivery_days IS '발송 요일 배열 (0=일, 1=월, ..., 6=토)';
COMMENT ON COLUMN email_subscription_settings.delivery_hour IS '발송 시간 (KST 기준 6, 18 중 선택)';
COMMENT ON COLUMN email_subscription_settings.favorite_news_enabled IS '즐겨찾기 뉴스 조회 활성화 여부 (메인 페이지에서 구독 키워드로만 뉴스 조회)';
COMMENT ON COLUMN email_subscription_settings.last_sent_at IS '마지막 이메일 발송 일시';


-- ============================================================================
-- 이메일 발송 로그 테이블
-- 발송 내역 추적 및 디버깅용
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_delivery_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,

  -- 발송 상태
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),

  -- 발송된 뉴스 개수
  news_count INTEGER DEFAULT 0,

  -- 에러 메시지 (실패 시)
  error_message TEXT,

  -- 발송 일시
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_email_delivery_logs_user_id ON email_delivery_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_delivery_logs_sent_at ON email_delivery_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_delivery_logs_status ON email_delivery_logs(status);

-- Row Level Security (RLS)
ALTER TABLE email_delivery_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own logs"
  ON email_delivery_logs FOR SELECT
  USING (auth.uid() = user_id);

-- 시스템이 로그 삽입 가능하도록 (모든 사용자 허용)
CREATE POLICY "Enable insert for all users"
  ON email_delivery_logs FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE email_delivery_logs IS '이메일 발송 내역 로그';
COMMENT ON COLUMN email_delivery_logs.status IS '발송 상태 (success, failed, pending)';
COMMENT ON COLUMN email_delivery_logs.news_count IS '발송된 뉴스 기사 개수';
