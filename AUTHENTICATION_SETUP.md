# 인증 설정 가이드

## 🔑 개요

이 프로젝트는 Supabase Auth를 사용하여 간편하고 안전한 Google OAuth 로그인을 구현합니다. 사용자는 Google 계정으로 로그인하고, 북마크 및 이메일 구독과 같은 개인화된 기능을 사용할 수 있습니다.

## ⚙️ 설정 절차

### 1. Supabase 프로젝트 준비

1.  [Supabase 대시보드](https://app.supabase.com/)에서 프로젝트를 선택합니다.
2.  `Authentication` > `Providers` 메뉴로 이동하여 `Google` 제공업체를 활성화합니다.

### 2. Google Cloud Console 설정

1.  [Google Cloud Console](https://console.cloud.google.com/)에서 OAuth 클라이언트 ID를 생성합니다.
2.  `Authorized redirect URIs`에 Supabase 프로젝트의 콜백 URL을 추가해야 합니다. 이 URL은 Supabase 대시보드의 Google 제공업체 설정 페이지에서 찾을 수 있으며, 일반적으로 아래와 같은 형식입니다.
    ```
    https://<YOUR-PROJECT-ID>.supabase.co/auth/v1/callback
    ```
3.  생성된 `Client ID`와 `Client Secret`을 복사합니다.

### 3. Supabase에 Google 정보 입력

1.  다시 Supabase 대시보드의 Google 제공업체 설정으로 돌아옵니다.
2.  Google Cloud Console에서 복사한 `Client ID`와 `Client Secret`을 붙여넣고 저장합니다.

### 4. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 Supabase 프로젝트의 API 정보를 입력합니다. 이 정보는 Supabase 대시보드의 `Settings` > `API`에서 찾을 수 있습니다.

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Supabase URL 설정

- Supabase 대시보드의 `Authentication` > `URL Configuration`에서 `Site URL`을 개발 환경인 `http://localhost:3000`으로 설정합니다.
- 배포 후에는 실제 프로덕션 도메인을 추가해야 합니다.

## 📁 관련 파일 구조

```
app/
└── auth/
    └── callback/
        └── route.ts      # Google OAuth 인증 후 콜백을 처리하는 라우트
hooks/
└── useAuth.ts            # useUser 훅을 감싸 인증 상태 및 프로필 정보를 제공
lib/
└── supabase/
    ├── browser-client.ts # 브라우저 환경용 Supabase 클라이언트
    ├── server-client.ts  # 서버 환경용 Supabase 클라이언트
    └── server.ts         # (사용되지 않음, 레거시)
components/
└── auth/
    └── login-modal.tsx   # 로그인 버튼 및 모달 UI
```

## 🔄 인증 흐름

1.  사용자가 `login-modal.tsx`의 로그인 버튼을 클릭합니다.
2.  `useAuth` 훅의 `signInWithGoogle` 함수가 호출되어 Supabase의 Google 로그인 페이지로 리디렉션됩니다.
3.  사용자가 Google 계정으로 인증을 완료하면, Google은 Supabase의 콜백 URL로 리디렉션합니다.
4.  Supabase는 인증을 처리하고, `app/auth/callback/route.ts`에 설정된 애플리케이션의 콜백 핸들러로 다시 리디렉션합니다.
5.  콜백 핸들러는 세션을 생성하고 사용자를 홈페이지로 리디렉션합니다.
6.  `useAuth` 훅은 세션 변경을 감지하고 사용자 정보를 업데이트하여, UI가 로그인 상태를 반영하도록 합니다.