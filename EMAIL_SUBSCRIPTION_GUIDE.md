# 뉴스 이메일 구독 기능 가이드

## 📧 기능 개요

사용자가 관심 키워드를 구독하고, 지정된 시간에 관련 뉴스를 AI 요약과 함께 이메일로 받을 수 있는 기능입니다.

## ✨ 주요 기능

### 1. 키워드 구독 관리
- 최대 3개의 키워드 구독 가능
- 키워드는 뉴스 제목과 본문에서 검색
- 실시간 추가/삭제 기능
- 한 번에 모든 키워드 삭제 가능

### 2. 이메일 발송 설정
- 이메일 주소 설정
- 발송 요일 선택 (일~토)
- 발송 시간 선택 (6시, 18시 중 라디오 버튼 선택)
- 활성화/비활성화 토글

### 3. 즉시 이메일 발송 시스템
- **Cron Job 실행 시간**: KST 기준 오전 6시, 오후 6시
- **실제 발송 시간**: Gmail SMTP를 통해 즉시 발송
- **시간 범위**: ±3시간 범위의 뉴스 수집 (Vercel Cron 딜레이 대응)
  - 오전 6시 Cron: 6시 발송 구독자에게 3-9시 범위 뉴스 수집 및 즉시 발송
  - 오후 6시 Cron: 18시 발송 구독자에게 15-21시 범위 뉴스 수집 및 즉시 발송
- **키워드별 뉴스 수집**: 각 키워드당 최신 뉴스 5개씩 (최대 3개 키워드 → 15개 기사)
- **AI 기반 이메일 템플릿**:
  - 전문 크롤링 (Cheerio)으로 전체 기사 내용 추출
  - OpenAI GPT-4o-mini로 AI 요약 및 핵심 포인트 생성
  - Supabase에 요약 캐싱으로 API 비용 절감
  - 자동 카테고리 분류 (categorizer.ts)
  - 반응형 HTML 디자인

## 🗄️ 데이터베이스 스키마

### subscribed_keywords
```sql
CREATE TABLE subscribed_keywords (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  keyword TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, keyword)
);
```

### email_subscription_settings
```sql
CREATE TABLE email_subscription_settings (
  user_id UUID PRIMARY KEY,
  enabled BOOLEAN DEFAULT false,
  email TEXT NOT NULL,
  delivery_days INTEGER[] DEFAULT '{1,2,3,4,5}',  -- 0=일, 1=월, ..., 6=토
  delivery_hour INTEGER DEFAULT 6 CHECK (delivery_hour IN (6, 18)),  -- 6, 18시만 허용
  last_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

### email_delivery_logs
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

## 📁 파일 구조

```
app/
├── api/
│   ├── subscriptions/
│   │   ├── keywords/route.ts          # 키워드 CRUD API
│   │   └── email-settings/route.ts    # 이메일 설정 API
│   ├── email/
│   │   └── send-digest/route.ts       # 개별 이메일 발송
│   └── cron/
│       └── send-daily-digest/route.ts # 일괄 발송 (Cron Job)
├── mypage/
│   └── page.tsx                        # 마이페이지 UI
hooks/
├── useSubscribedKeywords.ts            # 키워드 관리 훅
└── useEmailSettings.ts                 # 이메일 설정 훅
vercel.json                             # Cron Job 설정
```

## 🔧 설정 방법

### 1. 환경 변수 설정

`.env.local` 파일에 다음 변수들을 추가하세요:

```env
# Gmail SMTP 설정 (App Password 필요)
GMAIL_USERNAME=your_gmail@gmail.com
GMAIL_APP_PASSWORD=your_16_character_app_password

# 기존 설정들
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# OpenAI API (AI 요약용)
OPENAI_API_KEY=your_openai_api_key

# (선택) Cron Job 보안을 위한 시크릿
CRON_SECRET=your_random_secret
```

### 2. Gmail SMTP 설정

1. Gmail 계정 로그인
2. Google 계정 설정 → 보안 → 2단계 인증 활성화
3. 앱 비밀번호 생성:
   - Google 계정 관리 → 보안 → 2단계 인증
   - "앱 비밀번호" 선택
   - "메일"과 사용 중인 기기 선택
   - 생성된 16자리 비밀번호를 `GMAIL_APP_PASSWORD`에 입력
4. DNS 설정 불필요 (Gmail SMTP 서버 직접 사용)
5. 참고:
   - 발신자 이메일: `GMAIL_USERNAME`에 설정한 Gmail 주소
   - 하루 최대 500통 발송 가능 (Gmail 무료 계정 기준)

### 3. Supabase 데이터베이스 설정

Supabase SQL Editor에서 `supabase/schema-subscription.sql` 파일의 내용을 실행하세요.

### 4. Vercel 배포 설정

Vercel에 배포 시 다음 환경 변수들을 설정하세요:
- `GMAIL_USERNAME`
- `GMAIL_APP_PASSWORD`
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_BASE_URL` (실제 배포 URL)
- `CRON_SECRET` (선택사항)

Cron Job은 `vercel.json`에 정의되어 있으며, 배포 시 자동으로 설정됩니다.

### 5. Supabase Realtime 설정 (인기 검색어용)

Supabase SQL Editor에서 실행:

```sql
-- Realtime publication 생성
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;

-- search_keyword_analytics 테이블 추가
ALTER PUBLICATION supabase_realtime ADD TABLE search_keyword_analytics;
```

Supabase 대시보드에서:
1. Database → Replication 메뉴
2. `search_keyword_analytics` 테이블의 Realtime 토글 활성화
3. RLS 정책 확인

## 🚀 사용 방법

### 마이페이지에서 설정

1. **키워드 구독**
   - "구독 키워드" 섹션에서 원하는 키워드 입력
   - 최대 3개까지 추가 가능
   - X 버튼으로 개별 삭제 또는 휴지통 아이콘으로 전체 삭제

2. **이메일 설정**
   - 이메일 알림 토글 활성화
   - 수신 이메일 주소 입력
   - 원하는 발송 요일 선택 (일~토)
   - 발송 시간 설정 (0-23시)
   - "설정 저장" 버튼 클릭

### 이메일 발송 로직

1. **즉시 발송 (Cron Job)**
   - **실행 시간**: KST 오전 6시, 오후 6시
   - **발송 시간**: Gmail SMTP로 즉시 발송 (Cron 실행 직후)
   - **시간 범위**: ±3시간 범위 뉴스 수집 (Vercel Cron 딜레이 대응)
   - 활성화된 모든 구독자 조회
   - 오늘이 발송 요일이고, 발송 시간에 해당하는 사용자만 필터링
   - 각 사용자별로 뉴스 수집 → AI 요약 생성 → 이메일 발송

2. **처리 흐름**
   ```
   KST 06:00 (UTC 21:00 전날) - Cron Job 실행
       ↓
   delivery_hour = 6인 구독자 필터링
       ↓
   각 키워드별로 최신 뉴스 5개씩 검색 (3-9시 범위)
       ↓
   전체 기사 내용 크롤링 (Cheerio)
       ↓
   AI 요약 및 핵심 포인트 생성 (GPT-4o-mini)
       ↓
   자동 카테고리 분류 (categorizer.ts)
       ↓
   Supabase에 요약 캐싱 (중복 방지)
       ↓
   키워드별로 구성된 HTML 이메일 생성
       ↓
   Gmail SMTP로 즉시 발송 (nodemailer)
       ↓
   발송 로그 저장 (email_delivery_logs)
   ```

3. **뉴스 수집 및 선별**
   - **키워드별 수집**: 각 키워드당 최신 5개 (최대 3개 키워드 → 15개 기사)
   - **시간 범위**: 발송 시간 ±3시간 (예: 6시 발송 → 3-9시 뉴스, 18시 발송 → 15-21시 뉴스)
   - **검색 방식**: 제목 또는 본문에 키워드 포함
   - **정렬**: 최신순
   - **크롤링**: 전체 기사 텍스트 추출 (요약용)

4. **AI 요약 시스템**
   - **크롤링**: Cheerio로 전체 기사 내용 추출
   - **요약 생성**: OpenAI GPT-4o-mini 사용
   - **핵심 포인트**: 3-5개 자동 추출
   - **캐싱**: Supabase `news_summaries` 테이블에 저장
   - **재사용**: 동일 기사는 기존 요약 재사용 (API 비용 절감)
   - **카테고리**: 자동 분류 (세계, 기술, 비즈니스 등 9개 카테고리)

5. **이메일 템플릿**
   - 반응형 HTML 디자인
   - **테이블 레이아웃**: 키워드별 컬럼 구성
     - 상단: 키워드 탭 (예: "KOSPI | ETF | KOSDAQ")
     - 테이블 헤더: 각 키워드명과 뉴스 개수 표시
     - 각 행: 키워드별 뉴스 1개씩 나란히 배치
     - 균등한 컬럼 넓이 (`table-layout: fixed`)
   - 각 기사 카드 정보:
     - 뉴스 제목 (클릭 가능한 링크)
     - AI 생성 요약 (파란색 좌측 테두리)
     - 핵심 포인트 (노란색 배경, 불릿 포인트)
     - 출처 및 날짜 (이모지 포함)
   - 빈 셀 처리: 뉴스가 없는 경우 "-" 표시
   - 구독 관리 링크 포함

## 📊 API 엔드포인트

### 키워드 관리
```
GET    /api/subscriptions/keywords?userId={userId}
POST   /api/subscriptions/keywords
DELETE /api/subscriptions/keywords?userId={userId}&keywordId={keywordId}
```

### 이메일 설정
```
GET    /api/subscriptions/email-settings?userId={userId}
POST   /api/subscriptions/email-settings
DELETE /api/subscriptions/email-settings?userId={userId}
```

### 이메일 발송
```
POST   /api/email/send-digest           # 특정 사용자에게 즉시 발송
       Body: { userId: string }
       Response: {
         success: boolean,
         newsCount: number,
         keywordCounts: { [keyword: string]: number }
       }

GET    /api/cron/send-daily-digest      # 모든 구독자에게 즉시 발송 (Cron용)
       - KST 오전 6시, 오후 6시에 실행
       - 발송 시간 해당 구독자 필터링
       - ±3시간 범위 뉴스 수집
       - 키워드당 최대 5개 기사
       - AI 요약 및 카테고리 자동 분류
       - Gmail SMTP로 즉시 발송
```

## 🔍 테스트 방법

### 로컬 테스트

1. **즉시 이메일 발송 테스트**
   ```bash
   curl -X POST http://localhost:3000/api/email/send-digest \
     -H "Content-Type: application/json" \
     -d '{"userId": "your-user-id"}'
   ```

2. **Cron Job 테스트**
   ```bash
   curl http://localhost:3000/api/cron/send-daily-digest
   ```

3. **응답 예시**
   ```json
   {
     "success": true,
     "newsCount": 15,
     "keywordCounts": {
       "AI": 5,
       "blockchain": 5,
       "climate": 5
     }
   }
   ```

### 프로덕션 테스트

Vercel 대시보드에서:
1. Cron Jobs 탭 이동
2. `send-daily-digest` 확인
3. "Trigger" 버튼으로 수동 실행

## 📝 로그 확인

### Supabase에서 확인
```sql
-- 발송 로그 조회
SELECT * FROM email_delivery_logs
ORDER BY sent_at DESC
LIMIT 10;

-- 사용자별 발송 통계
SELECT
  user_id,
  COUNT(*) as total_sent,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count,
  AVG(news_count) as avg_news_count
FROM email_delivery_logs
GROUP BY user_id;
```

### Vercel 로그
1. Vercel 대시보드 → 프로젝트 선택
2. Functions 탭 → Cron Jobs
3. 실행 로그 확인

## ⚠️ 주의사항

1. **Gmail SMTP 제한**
   - 무료 계정: 하루 최대 500통 발송 가능
   - Google Workspace: 하루 최대 2,000통
   - 2단계 인증 및 앱 비밀번호 필수
   - 과도한 발송 시 일시적 차단 가능

2. **OpenAI API 비용**
   - GPT-4o-mini 사용 (비용 효율적)
   - 요약 캐싱으로 중복 요청 방지
   - 키워드당 5개 × 3개 키워드 = 최대 15개 요약
   - 구독자가 많을 경우 비용 모니터링 필요

3. **Cron Job 제한**
   - Vercel Pro 플랜: 매월 10,000 Cron 실행 무료
   - Hobby 플랜: 제한적 사용
   - ±3시간 시간 범위로 Vercel Cron 딜레이 대응

4. **데이터베이스 부하**
   - 구독자가 많을 경우 뉴스 검색 쿼리 최적화 필요
   - 인덱스 추가 고려:
     ```sql
     CREATE INDEX idx_news_summaries_search
     ON news_summaries(pub_date DESC);

     CREATE INDEX idx_search_keyword_analytics
     ON search_keyword_analytics(search_time DESC);
     ```

5. **타임존 및 스케줄**
   - 모든 시간은 KST(UTC+9) 기준
   - Vercel Cron은 UTC로 설정 (vercel.json):
     - `0 21 * * *` (21:00 UTC = 06:00 KST 다음날)
     - `0 9 * * *` (09:00 UTC = 18:00 KST)
   - Gmail SMTP로 즉시 발송 (예약 기능 없음)

6. **Supabase Realtime**
   - 인기 검색어 실시간 업데이트용
   - RLS 정책 확인 필수
   - 연결 제한: 무료 플랜 200개 동시 연결

## 🔒 보안

1. **RLS (Row Level Security) 정책**
   - 모든 테이블에 RLS 활성화
   - 사용자는 자신의 데이터만 접근 가능

2. **Cron Secret**
   - Cron 엔드포인트는 선택적으로 secret으로 보호
   - 환경 변수에 `CRON_SECRET` 설정 시 Bearer 토큰으로 검증

3. **이메일 검증**
   - 이메일 형식 유효성 검사
   - Resend가 자동으로 스팸 필터링

## 🛠️ 트러블슈팅

### 이메일이 발송되지 않음

1. **환경 변수 확인**
   ```bash
   echo $GMAIL_USERNAME
   echo $GMAIL_APP_PASSWORD
   echo $OPENAI_API_KEY
   ```

2. **Gmail 설정 확인**
   - 2단계 인증 활성화 상태
   - 앱 비밀번호 유효성 (16자리)
   - Gmail 계정 보안 설정
   - 하루 발송 제한 초과 여부

3. **Cron Job 실행 확인**
   - Vercel Functions 로그 확인
   - `email_delivery_logs` 테이블 확인
   - nodemailer 에러 로그 확인

4. **OpenAI API 확인**
   - API 키 유효성
   - 사용량 한도 확인
   - 요금 결제 상태

### 잘못된 뉴스가 선택됨

1. **키워드 확인**
   - 너무 일반적인 키워드는 피하기
   - 특정한 키워드 사용 권장

2. **검색 로직 수정**
   - `app/api/email/send-digest/route.ts`에서 검색 쿼리 수정
   - `ilike` 대신 정확한 매칭 사용 고려

### Cron Job이 실행되지 않음

1. **vercel.json 확인**
   - Cron 스케줄 형식 확인
   - 경로 확인

2. **Vercel 배포 확인**
   - 최신 코드가 배포되었는지 확인
   - Functions 탭에서 Cron 설정 확인

## 🎯 구현 완료 기능

- [x] **즉시 발송 시스템**: Gmail SMTP로 Cron 실행 직후 즉시 발송
- [x] **시간 범위 대응**: ±3시간 범위 뉴스 수집 (Vercel Cron 딜레이 대응)
- [x] **키워드별 수집**: 각 키워드당 최신 5개 뉴스 (최대 15개)
- [x] **AI 요약 통합**: GPT-4o-mini로 전문 크롤링 및 요약 생성
- [x] **요약 캐싱**: Supabase에 저장하여 중복 요청 방지 및 비용 절감
- [x] **자동 카테고리 분류**: categorizer.ts로 9개 카테고리 자동 분류
- [x] **발송 시간 제한**: 6시, 18시만 선택 가능 (라디오 버튼)
- [x] **실시간 인기 검색어**: Supabase Realtime 기능으로 실시간 업데이트
- [x] **키워드 중복 제거**: 정규화 알고리즘 (공백 제거, 대문자 변환)
- [x] **테이블 레이아웃 이메일**: 키워드별 컬럼으로 한눈에 비교 가능
- [x] **마이페이지 UX 개선**: AlertDialog와 Toast로 테스트 이메일 발송 경험 향상

## 📈 향후 개선 사항

- [ ] 이메일 템플릿 커스터마이징 (사용자 선택)
- [ ] 발송 빈도 설정 (매일/주간/월간)
- [ ] 카테고리별 구독 기능
- [ ] 읽음/안 읽음 추적
- [ ] 구독 통계 대시보드
- [ ] 다국어 지원 (영문 뉴스 자동 번역)
- [ ] 푸시 알림 통합
- [ ] 뉴스 수집 실패 시 재시도 로직
- [ ] 요약 품질 향상 (다른 모델 실험)
- [ ] 키워드 추천 기능 (인기 검색어 기반)
