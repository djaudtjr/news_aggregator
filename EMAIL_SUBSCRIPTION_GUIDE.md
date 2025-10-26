# 뉴스 이메일 구독 기능 가이드

## 📧 기능 개요

사용자가 관심 키워드를 구독하고, 매일 지정된 시간에 관련 뉴스를 이메일로 받을 수 있는 기능입니다.

## ✨ 주요 기능

### 1. 키워드 구독 관리
- 최대 3개의 키워드 구독 가능
- 키워드는 뉴스 제목과 본문에서 검색
- 실시간 추가/삭제 기능
- 한 번에 모든 키워드 삭제 가능

### 2. 이메일 발송 설정
- 이메일 주소 설정
- 발송 요일 선택 (일~토)
- 발송 시간 선택 (6시, 12시, 18시 중 라디오 버튼 선택)
- 활성화/비활성화 토글

### 3. 예약 이메일 발송 시스템
- **Cron Job 실행 시간**: KST 기준 5시, 11시, 17시 (발송 1시간 전)
- **실제 발송 시간**: KST 기준 6시, 12시, 18시 (Resend 예약 발송)
- **처리 방식**:
  - 5시 Cron: 6시 발송 구독자를 위한 뉴스 수집 및 예약 발송
  - 11시 Cron: 12시 발송 구독자를 위한 뉴스 수집 및 예약 발송
  - 17시 Cron: 18시 발송 구독자를 위한 뉴스 수집 및 예약 발송
- 최근 24시간 이내 뉴스만 선별
- 최대 10개 뉴스 포함
- 깔끔한 HTML 이메일 템플릿

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
  delivery_hour INTEGER DEFAULT 6 CHECK (delivery_hour IN (6, 12, 18)),  -- 6, 12, 18시만 허용
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
# Resend API 키 (https://resend.com에서 발급)
RESEND_API_KEY=re_your_api_key_here

# 기존 설정들
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# (선택) Cron Job 보안을 위한 시크릿
CRON_SECRET=your_random_secret
```

### 2. Resend 설정

1. [Resend](https://resend.com)에 가입
2. API 키 생성
3. 발신 도메인 설정 (또는 테스트용 onboarding@resend.dev 사용)
4. `app/api/email/send-digest/route.ts`에서 `from` 필드 수정:
   ```typescript
   from: "News Aggregator <noreply@yourdomain.com>", // 실제 도메인으로 변경
   ```

### 3. Supabase 데이터베이스 설정

Supabase SQL Editor에서 `supabase/schema-subscription.sql` 파일의 내용을 실행하세요.

### 4. Vercel 배포 설정

Vercel에 배포 시 다음 환경 변수들을 설정하세요:
- `RESEND_API_KEY`
- `NEXT_PUBLIC_BASE_URL` (실제 배포 URL)
- `CRON_SECRET` (선택사항)

Cron Job은 `vercel.json`에 정의되어 있으며, 배포 시 자동으로 설정됩니다.

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

1. **예약 발송 (Cron Job)**
   - **실행 시간**: KST 5시, 11시, 17시 (실제 발송 1시간 전)
   - **발송 시간**: KST 6시, 12시, 18시 (Resend 예약 발송 기능 사용)
   - 활성화된 모든 구독자 조회
   - 오늘이 발송 요일이고, 1시간 후 발송 시간에 해당하는 사용자만 필터링
   - 각 사용자별로 뉴스 수집 → 이메일 생성 → 예약 발송

2. **처리 흐름**
   ```
   KST 05:00 (UTC 20:00) - Cron Job 실행
       ↓
   delivery_hour = 6인 구독자 필터링
       ↓
   각 구독자의 키워드로 뉴스 검색 & 크롤링
       ↓
   이메일 HTML 생성
       ↓
   Resend scheduledAt="06:00 KST"로 예약 발송
       ↓
   KST 06:00 - Resend가 자동으로 이메일 발송
   ```

3. **뉴스 선별**
   - 각 키워드별로 최근 24시간 이내 뉴스 검색
   - 제목 또는 본문에 키워드 포함된 뉴스만 선택
   - 중복 제거 후 최신순 정렬
   - 상위 10개 선택

4. **이메일 템플릿**
   - 깔끔한 HTML 디자인
   - 뉴스 제목, 설명, 출처, 날짜 포함
   - 원문 링크 제공
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
POST   /api/email/send-digest           # 특정 사용자에게 발송 (즉시 또는 예약)
       Body: { userId: string, scheduledDeliveryHour?: number }
       Response: { success: boolean, newsCount: number, scheduledAt?: string }

GET    /api/cron/send-daily-digest      # 모든 구독자에게 예약 발송 (Cron용)
       - KST 5시, 11시, 17시에 실행
       - 1시간 후 발송 시간 구독자 필터링
       - Resend 예약 발송 API 사용
```

## 🔍 테스트 방법

### 로컬 테스트

1. **즉시 이메일 발송 테스트**
   ```bash
   curl -X POST http://localhost:3000/api/email/send-digest \
     -H "Content-Type: application/json" \
     -d '{"userId": "your-user-id"}'
   ```

2. **예약 이메일 발송 테스트** (1시간 후 발송)
   ```bash
   curl -X POST http://localhost:3000/api/email/send-digest \
     -H "Content-Type: application/json" \
     -d '{"userId": "your-user-id", "scheduledDeliveryHour": 12}'
   ```

3. **Cron Job 테스트**
   ```bash
   curl http://localhost:3000/api/cron/send-daily-digest
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

1. **Resend 무료 플랜 제한**
   - 월 3,000통까지 무료
   - 발신 도메인 인증 필요 (테스트는 onboarding@resend.dev 사용 가능)

2. **Cron Job 제한**
   - Vercel Pro 플랜: 매월 10,000 Cron 실행 무료
   - Hobby 플랜: 제한적 사용

3. **데이터베이스 부하**
   - 구독자가 많을 경우 뉴스 검색 쿼리 최적화 필요
   - 인덱스 추가 고려:
     ```sql
     CREATE INDEX idx_news_summaries_search
     ON news_summaries(pub_date DESC);
     ```

4. **타임존 및 스케줄**
   - 모든 시간은 KST(UTC+9) 기준
   - Vercel Cron은 UTC로 설정 (vercel.json):
     - `0 20 * * *` (20:00 UTC = 05:00 KST 다음날)
     - `0 2 * * *` (02:00 UTC = 11:00 KST)
     - `0 8 * * *` (08:00 UTC = 17:00 KST)
   - Resend 예약 발송은 KST로 변환하여 ISO 8601 형식으로 전달

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
   echo $RESEND_API_KEY
   ```

2. **Resend 대시보드 확인**
   - API 키 유효성
   - 발신 도메인 인증 상태
   - 발송 로그

3. **Cron Job 실행 확인**
   - Vercel Functions 로그 확인
   - `email_delivery_logs` 테이블 확인

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

- [x] **예약 발송 시스템**: Resend scheduledAt API 사용
- [x] **1시간 전 뉴스 수집**: 발송 시간 1시간 전에 Cron 실행
- [x] **발송 시간 제한**: 6시, 12시, 18시만 선택 가능 (라디오 버튼)
- [x] **서버 부하 분산**: 여러 구독자의 뉴스를 충분한 시간동안 수집
- [x] **정확한 발송 시간**: Resend의 예약 발송으로 정확한 시간에 배달

## 📈 향후 개선 사항

- [ ] 이메일 템플릿 커스터마이징
- [ ] 발송 빈도 설정 (매일/주간/월간)
- [ ] 카테고리별 구독 기능
- [ ] 읽음/안 읽음 추적
- [ ] 구독 통계 대시보드
- [ ] 다국어 지원
- [ ] 푸시 알림 통합
- [ ] 뉴스 수집 실패 시 재시도 로직
