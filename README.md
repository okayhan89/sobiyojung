# 소비요정의 쇼핑구매희망리스트

> 이번 주에 어디서 뭘 살지 스토어별로 적어두는 공유 메모장 PWA.
> 당근·쿠팡·마켓컬리 같은 스토어마다 홈 화면 숏컷으로 바로 진입.

- **Domain**: `sobiyojung.ggogom.co.kr`
- **Stack**: Next.js 16 (App Router) · Supabase (Postgres + Auth + Realtime) · Tailwind v4 · Vercel
- **Auth**: Google OAuth via Supabase
- **Sync**: Supabase Realtime (아내와 실시간 공유)

---

## 1. Supabase 설정 (공유 프로젝트)

이 앱은 다른 앱들과 Supabase 프로젝트를 **공유**하기 때문에 테이블이 모두 전용 스키마 `sobiyojung` 안에 들어갑니다. 순서가 중요합니다.

### 1-1. 기존 public 스키마 정리 (이전에 실행한 적이 있을 때만)

**SQL Editor**에서 `supabase/migrations/0000_cleanup_public.sql` 실행.
처음 세팅이면 건너뛰어도 됩니다.

### 1-2. 스키마 + 테이블 생성

**SQL Editor**에서 `supabase/migrations/0001_init.sql` 전체 복사 → Run.

포함되는 것:
- `sobiyojung` 스키마 생성 및 권한 부여
- `sobiyojung.households`, `household_members`, `stores`, `items`
- Row Level Security 정책 (household 멤버만 접근)
- Realtime publication 추가

### 1-3. Data API에 스키마 노출

**Integrations → Data API → Settings** (또는 `/project/<ref>/settings/api`):
- **Exposed schemas**: 기존 `public`, `graphql_public` 에 더해 `sobiyojung` 추가 → Save
- **Extra search path**: `sobiyojung` 추가 → Save

> 주의: 드롭다운은 *이미 존재하는 스키마*만 보여줍니다. 그래서 반드시 **1-2 먼저 실행한 뒤** 이 단계를 해야 `sobiyojung`이 선택지에 나타납니다.

### 1-4. API 키 복사

**Settings → API Keys**에서:
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL` (이미 `.env.local.example`에 프리필됨)
- `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 2. Google OAuth 연결

### Google Cloud Console

1. https://console.cloud.google.com → 프로젝트 생성
2. **APIs & Services → OAuth consent screen**
   - User Type: External
   - 앱 이름: `소비요정`
   - 사용자 지원 이메일 / 개발자 이메일 입력
   - Scopes는 `email`, `profile`, `openid` 만
3. **Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - Authorized redirect URIs:
     ```
     https://<project-ref>.supabase.co/auth/v1/callback
     ```
   - Client ID, Client Secret 복사

### Supabase에 Google provider 등록

1. Supabase 대시보드 → **Authentication → Providers → Google**
2. Enable Google → Client ID / Secret 붙여넣기 → Save
3. **Authentication → URL Configuration**
   - Site URL: `https://sobiyojung.ggogom.co.kr`
   - Redirect URLs (한 줄씩 추가):
     ```
     https://sobiyojung.ggogom.co.kr/auth/callback
     http://localhost:3000/auth/callback
     ```

---

## 3. 로컬 실행

```bash
cp .env.local.example .env.local
# .env.local 에 실제 Supabase URL / anon key / SITE_URL 입력

pnpm install
pnpm dev
```

→ http://localhost:3000

---

## 4. Vercel 배포

```bash
# Vercel 프로젝트 연결
vercel link
```

또는 GitHub 연동 후 Vercel 대시보드에서 Import.

### 환경변수 (Production / Preview / Development 모두)

| Key | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public key |
| `NEXT_PUBLIC_SITE_URL` | `https://sobiyojung.ggogom.co.kr` |

### 서브도메인 연결

1. Vercel 프로젝트 → **Settings → Domains → Add**
   - `sobiyojung.ggogom.co.kr` 입력
2. 안내되는 DNS 레코드 확인. 일반적으로:
   ```
   Type: CNAME
   Name: sobiyojung
   Value: cname.vercel-dns.com
   ```
3. `ggogom.co.kr` 도메인의 DNS 관리자(가비아/Cloudflare 등)에서 위 레코드 추가
4. Vercel에서 인증서 자동 발급 → 몇 분 내 완료

---

## 5. 사용 흐름

1. **첫 로그인** → `/onboarding`
   - "새로 시작하기" → 기본 스토어 7개와 함께 household 생성
   - "코드로 합류" → 짝꿍이 공유한 6자리 초대 코드 입력
2. **초대 공유** → 대시보드 상단의 초대 코드를 복사해서 짝꿍에게 전달
3. **홈 화면 숏컷 (Android Chrome)**
   - 사이트 방문 → 메뉴 → `홈 화면에 추가` 또는 `앱 설치`
   - 설치 후 **아이콘 길게 누르면** 스토어별 7개 숏컷 노출됨
     (manifest `shortcuts` 기능 — Android Chrome/Edge에서 동작)
4. **메인 앱 진입** → 스토어 카드 탭 → `/s/<slug>` 로 이동해 항목 추가·체크

---

## 6. 파일 구조

```
src/
├── app/
│   ├── page.tsx                  대시보드 (모든 스토어)
│   ├── layout.tsx
│   ├── globals.css
│   ├── manifest.ts               PWA manifest + shortcuts
│   ├── actions.ts                스토어 추가 server action
│   ├── _components/              대시보드용 컴포넌트
│   ├── login/                    Google 로그인
│   ├── auth/callback/            OAuth 콜백
│   ├── auth/signout/             로그아웃
│   ├── onboarding/               household 생성/합류
│   └── s/[slug]/                 개별 스토어 상세 + 리스트
├── lib/
│   ├── supabase/{client,server,proxy}.ts
│   ├── household.ts              auth + household 헬퍼
│   ├── default-stores.ts         기본 7개 스토어 정의
│   ├── types.ts
│   └── utils.ts
└── proxy.ts                      Next 16 proxy (ex-middleware)

public/icons/                     PWA + shortcut SVG 아이콘
supabase/migrations/0001_init.sql DB 스키마 + RLS
```

---

## 7. 커스텀 스토어

기본 스토어(당근·아웃렛·시장·오아시스·마켓컬리·네이버·쿠팡)는 홈 화면 숏컷으로도 나와요.
**직접 추가한 스토어**는 앱 안에서만 보이고 숏컷엔 나오지 않음 (manifest는 빌드 타임 정적이라 그래요).
추가한 스토어를 숏컷으로도 쓰고 싶으면 `src/lib/default-stores.ts`에 추가 후 아이콘 SVG를 `public/icons/shortcut-<slug>.svg`로 만들고 재배포하면 됨.
