# 인증 설정 가이드

## 구글 로그인 설정

이 프로젝트는 Supabase Auth를 사용하여 구글 로그인을 제공합니다.

### 1. Supabase 프로젝트 설정

1. [Supabase 대시보드](https://app.supabase.com/)에 로그인합니다.
2. 프로젝트를 선택하거나 새 프로젝트를 생성합니다.

### 2. 환경 변수 설정

1. Supabase 대시보드에서 `Settings` > `API`로 이동합니다.
2. 다음 값들을 복사합니다:
   - `Project URL`
   - `anon` `public` 키

3. `.env.local` 파일을 열고 다음과 같이 설정합니다:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. Google OAuth 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에 로그인합니다.
2. 새 프로젝트를 만들거나 기존 프로젝트를 선택합니다.
3. `APIs & Services` > `Credentials`로 이동합니다.
4. `Create Credentials` > `OAuth client ID`를 선택합니다.
5. Application type으로 `Web application`을 선택합니다.
6. Authorized redirect URIs에 다음을 추가합니다:
   ```
   https://[YOUR_PROJECT_ID].supabase.co/auth/v1/callback
   ```
7. Client ID와 Client Secret을 복사합니다.

### 4. Supabase에 Google Provider 설정

1. Supabase 대시보드에서 `Authentication` > `Providers`로 이동합니다.
2. Google provider를 찾아서 활성화합니다.
3. Google Cloud Console에서 복사한 Client ID와 Client Secret을 입력합니다.
4. `Save`를 클릭합니다.

### 5. Redirect URL 설정

Supabase 대시보드의 `Authentication` > `URL Configuration`에서:
- Site URL: `http://localhost:3000` (개발 환경)
- Redirect URLs에 다음을 추가:
  - `http://localhost:3000/auth/callback`
  - 프로덕션 URL (배포 후)

### 6. 로컬에서 테스트

```bash
npm run dev
```

브라우저에서 `http://localhost:3000`을 열고 우측 상단의 "로그인" 버튼을 클릭하여 테스트합니다.

## 구현된 기능

- ✅ 구글 로그인
- ✅ 로그아웃
- ✅ 로그인 상태 관리
- ✅ 로그인/로그아웃 버튼 자동 전환
- ✅ OAuth 콜백 처리

## 파일 구조

```
lib/supabase/
  ├── browser-client.ts     # 브라우저용 Supabase 클라이언트
  └── client.ts             # 서버용 Supabase 클라이언트

hooks/
  └── useAuth.ts            # 인증 상태 관리 Hook

components/
  └── auth/
      └── login-modal.tsx   # 로그인 모달 컴포넌트

app/
  └── auth/
      └── callback/
          └── route.ts      # OAuth 콜백 핸들러
```

## 문제 해결

### "Supabase credentials not configured" 경고가 나타나는 경우

`.env.local` 파일에 올바른 환경 변수가 설정되어 있는지 확인하세요.

### 로그인 후 리다이렉트가 작동하지 않는 경우

Supabase 대시보드의 Redirect URLs 설정을 확인하세요.

### Google OAuth 오류가 발생하는 경우

Google Cloud Console의 Authorized redirect URIs 설정을 확인하세요.
