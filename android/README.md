# 소비요정 안드로이드 위젯

**소비요정의 쇼핑구매희망리스트** 웹앱과 같은 데이터를 홈 화면 위젯으로 띄우는 얇은 안드로이드 앱입니다.

- **데이터**: 같은 Supabase 프로젝트(`sobiyojung` 스키마)의 `widget_summary` RPC를 호출
- **인증**: Google 로그인 불필요 — 웹앱 대시보드의 **초대 코드**를 한 번 앱에 입력하면 끝
- **새로고침**: WorkManager로 15분 주기 (시스템 정책상 실제로는 15~30분 가변)
- **탭 동작**: 각 타일을 누르면 Chrome 인텐트로 `https://sobiyojung.ggogom.co.kr/s/<slug>` 진입

---

## 선행 조건

1. **Supabase에 `widget_summary` RPC가 배포돼 있어야 합니다.**
   - 루트 리포 `supabase/migrations/0004_widget_rpc.sql`을 SQL Editor에서 실행.
2. **Android Studio** (Ladybug 이상 권장) 설치
3. **JDK 17** (Android Studio에 번들됨)

---

## 빌드

```bash
cd android
# 최초엔 Android Studio에서 폴더 열면 Gradle 동기화가 자동으로 gradle wrapper를 생성합니다.
# CLI만 쓰실 거면 시스템에 gradle이 있어야 합니다:
#   gradle wrapper --gradle-version 8.9
#   ./gradlew :app:assembleDebug
```

- 출력물: `android/app/build/outputs/apk/debug/app-debug.apk`
- 설치: `adb install -r app-debug.apk`  (또는 APK를 USB/클라우드로 폰에 전달해서 열기)

### 공개 키 · URL 오버라이드

기본값으로 웹과 동일한 Supabase 프로젝트에 연결돼 있습니다. 바꿀 땐 `gradle.properties` 또는 CLI 파라미터:

```bash
./gradlew :app:assembleDebug \
  -PSUPABASE_URL=https://xxx.supabase.co \
  -PSUPABASE_ANON_KEY=sb_publishable_xxx \
  -PSITE_URL=https://sobiyojung.ggogom.co.kr
```

---

## 사용

1. APK 설치 후 소비요정 앱 실행
2. 웹앱 대시보드 상단의 **6자리 초대 코드** 입력 → **저장하기**
3. 홈 화면 길게 누르기 → **위젯** → `소비요정 쇼핑리스트` 찾아서 드래그
4. 위젯이 2열 그리드로 스토어별 타일 + 열린 항목 수를 표시
5. 타일 탭 → 기본 브라우저(이미 PWA 설치돼 있으면 PWA)로 해당 스토어 페이지 진입

### 위젯 새로고침
- 자동: 15~30분마다 백그라운드로 업데이트
- 수동: 좌측 상단 "🧚‍♀️ 소비요정" 또는 "↻" 영역 탭 → 앱 진입 후 다시 홈으로 나오면 최신 반영

---

## 프로젝트 구조

```
android/
├── settings.gradle.kts
├── build.gradle.kts
├── gradle.properties
├── gradle/libs.versions.toml
└── app/
    ├── build.gradle.kts            # Supabase URL/anon key를 BuildConfig에 주입
    ├── proguard-rules.pro
    └── src/main/
        ├── AndroidManifest.xml
        ├── res/                    # 아이콘·문자열·위젯 메타
        └── kotlin/kr/co/ggogom/sobiyojung/widget/
            ├── SobiyojungApp.kt             # Application — WorkManager 스케줄 시작
            ├── MainActivity.kt              # 온보딩(초대 코드 입력) Compose UI
            ├── data/
            │   ├── Models.kt                # StoreSummary DTO
            │   ├── Preferences.kt           # DataStore (초대 코드 · 스토어 캐시)
            │   ├── SupabaseApi.kt           # Ktor + sobiyojung.widget_summary RPC
            │   └── StoreRepository.kt
            ├── sync/
            │   ├── RefreshScheduler.kt      # WorkManager enqueue
            │   └── RefreshWorker.kt         # 주기 갱신
            └── widget/
                ├── ShoppingListWidget.kt            # Glance 위젯 UI
                └── ShoppingListWidgetReceiver.kt    # 시스템 onUpdate 훅
```

---

## 릴리즈 서명

데뷔는 debug 빌드로 충분합니다. Play Store에 올리려면:

1. `keytool`로 keystore 생성
2. `app/build.gradle.kts`에 `signingConfigs { release { ... } }` 추가
3. `./gradlew :app:bundleRelease` → AAB 파일

Play Store 올릴 거면 아이콘/스크린샷/텍스트 등은 별도 작업 필요.

---

## 제약 / 주의

- **iOS 위젯은 불가능합니다**(iOS는 WidgetKit 네이티브). 이 프로젝트는 안드로이드 전용.
- 위젯의 **새로고침 최소 주기는 15분**(WorkManager) / **30분**(AppWidget updatePeriodMillis). 즉시 반영이 필요하면 PWA를 직접 여세요.
- Supabase 초대 코드로 인증하기 때문에, 코드가 유출되면 쇼핑 내역이 읽힐 수 있습니다 (기존 household 초대 모델과 동일한 수준). 쓰기는 불가능하고 오직 `widget_summary` RPC만 접근합니다.
