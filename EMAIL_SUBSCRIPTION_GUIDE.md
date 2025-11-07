# 뉴스 이메일 구독 기능 가이드

## 📧 기능 개요

사용자가 관심 키워드를 구독하고, 지정된 시간에 관련 뉴스를 AI 요약과 함께 이메일로 받을 수 있는 기능입니다. Nodemailer와 Gmail SMTP를 사용하여 외부 이메일 서비스 의존성 없이 구현되었습니다.

## ✨ 주요 기능

- **키워드 구독**: 최대 3개의 관심 키워드를 등록하고 관리합니다.
- **이메일 설정**: 수신 이메일 주소, 발송 요일, 발송 시간(오전 6시, 오후 6시)을 설정하고 전체 기능을 켜고 끌 수 있습니다.
- **자동 발송**: Vercel Cron이 정해진 시간에 API를 호출하여, 조건에 맞는 구독자에게 이메일을 자동으로 발송합니다.
- **AI 요약 통합**: 이메일에 포함될 뉴스는 Cheerio로 크롤링되고, OpenAI(GPT-4o-mini)를 통해 요약 및 핵심 포인트가 생성됩니다.
- **테스트 발송**: 마이페이지에서 현재 설정으로 테스트 이메일을 즉시 발송해볼 수 있습니다.

## 🗄️ 데이터베이스 스키마

*관련 스키마는 `supabase/schema.sql`에 모두 정의되어 있습니다.*

- **`subscribed_keywords`**: 사용자가 구독한 키워드를 저장합니다. (`user_id`, `keyword`)
- **`email_subscription_settings`**: 사용자의 이메일 구독 설정을 저장합니다. (`user_id`, `enabled`, `email`, `delivery_days`, `delivery_hour`)
- **`email_delivery_logs`**: 이메일 발송 결과를 기록하여 추적합니다. (`user_id`, `status`, `news_count`)

## 📁 파일 구조

```
app/
├── api/
│   ├── subscriptions/               # 구독 관련 API
│   │   ├── keywords/route.ts       # 키워드 CRUD
│   │   └── email-settings/route.ts # 이메일 설정 CRUD
│   ├── email/
│   │   └── send-digest/route.ts    # (테스트용) 개별 이메일 발송
│   └── cron/
│       └── send-daily-digest/route.ts # Cron Job이 호출하는 일괄 발송 API
├── mypage/
│   └── page.tsx                     # 마이페이지 UI
hooks/
├── useSubscribedKeywords.ts         # 키워드 관리 훅
└── useEmailSettings.ts              # 이메일 설정 훅
lib/
└── email/                           
    └── gmail.ts                     # Nodemailer를 사용한 Gmail 발송 로직
vercel.json                          # Cron Job 스케줄 정의
```

## 🔧 설정 방법

### 1. 환경 변수

`.env.local` 파일에 다음 Gmail 관련 변수를 설정해야 합니다.

```env
# Gmail SMTP 설정 (2단계 인증 및 앱 비밀번호 필요)
GMAIL_USERNAME=your_gmail_address@gmail.com
GMAIL_APP_PASSWORD=your_16_digit_app_password

# Cron Job 보안 (선택 사항)
CRON_SECRET=a_secure_random_string
```

### 2. Gmail 앱 비밀번호 생성

1.  Google 계정에서 2단계 인증을 활성화합니다.
2.  `보안` > `앱 비밀번호` 메뉴로 이동합니다.
3.  `앱 선택`에서 '메일', `기기 선택`에서 '기타'를 선택하고 이름을 지정합니다.
4.  생성된 16자리 비밀번호를 `GMAIL_APP_PASSWORD` 값으로 사용합니다.

## 🔄 발송 로직 흐름

1.  **Cron 트리거**: `vercel.json`에 설정된 스케줄(KST 오전 5시, 오후 5시)에 따라 Vercel이 `GET /api/cron/send-daily-digest`를 호출합니다.

2.  **구독자 필터링**: API는 현재 시간에 맞는 발송 대상자를 `email_subscription_settings` 테이블에서 조회합니다. (예: 오전 5시 Cron 실행 시, `delivery_hour`가 6시인 사용자를 필터링)

3.  **뉴스 수집 및 요약**: 각 대상자별로 `subscribed_keywords`를 가져와 지난 12시간 동안의 관련 뉴스를 검색합니다. AI 요약이 필요한 경우 생성하고 결과를 `news_summaries`에 캐싱합니다.

4.  **이메일 생성 및 발송**: 수집된 뉴스를 바탕으로 HTML 이메일 본문을 생성하고, `lib/email/gmail.ts`의 `sendEmail` 함수를 호출하여 Gmail SMTP를 통해 이메일을 발송합니다.

5.  **로깅**: 발송 결과를 `email_delivery_logs` 테이블에 기록합니다.

## ⚠️ 주요 제약사항

- **Gmail SMTP 제한**: 일반 Gmail 계정은 일일 발송량이 약 500개로 제한됩니다. 대규모 사용자에게는 부적합할 수 있습니다.
- **Cron 정확성**: Vercel의 Hobby 플랜 Cron은 실행 시간이 정확하지 않을 수 있습니다. 로직은 이를 감안하여 뉴스를 충분한 시간 범위(12시간) 내에서 조회합니다.
- **API 비용**: 구독자가 많아지면 뉴스 검색 및 AI 요약에 사용되는 OpenAI API 비용이 증가할 수 있습니다. 요약 캐싱으로 비용을 최소화합니다.