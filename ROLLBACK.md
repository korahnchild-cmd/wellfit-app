# 웰핏+ CHECK-UP — 롤백 런북

> 2026.8.21 작성 (구조 개편 v2 착수 전 P0)
> **원칙: 모든 변경은 스위치 하나로 이전 상태로 돌아갈 수 있어야 한다.**
> 급할 때 읽는 문서다. 위에서부터 순서대로 하면 된다.

---

## ⚠️ 먼저 — 브리프 §8-2의 전제가 틀렸습니다

브리프는 *"웹앱(Firebase Hosting) → 콘솔 > Hosting > 롤백 버튼 1회"* 를 적었으나, **이 앱은 Firebase Hosting을 쓰지 않습니다.**

```
firebase.json → functions, firestore 만 있고 hosting 키 없음
.github/workflows/deploy.yml → peaceiris/actions-gh-pages@v4, publish_dir: ./dist
                               cname: wellfit-checkup.co.kr
```

즉 **GitHub Pages 배포**이고, 콘솔 롤백 버튼도 `firebase hosting:channel:deploy` 미리보기도 존재하지 않습니다. 아래는 그에 맞춰 다시 쓴 절차입니다.

---

## 1. 가장 빠른 롤백 — 30초 (재빌드 없음)

`gh-pages` 브랜치에는 **빌드 결과물이 커밋 단위로 쌓여 있습니다.** 이걸 직전 커밋으로 되감으면 Actions를 다시 돌리지 않고 즉시 라이브가 돌아갑니다. Firebase Hosting 롤백 버튼의 실질적 대체재입니다.

```powershell
cd "D:\AI_인공지능\앱비지니스\웰핏+체크업\wellfit-app"

git fetch origin gh-pages
git log --oneline origin/gh-pages -10        # 되돌릴 커밋 고르기

git push origin <되돌릴SHA>:gh-pages --force
```

CDN 캐시 때문에 반영까지 1~2분. 확인은 **Ctrl+Shift+R**.

> `rollback.ps1`을 실행하면 위 과정을 대화형으로 안내합니다.

---

## 2. 소스까지 되돌리기

```powershell
git fetch origin --tags
git switch master
git reset --hard v1-before-redesign
git push origin master --force-with-lease   # Actions가 재빌드·재배포 (2~3분)
```

`--force-with-lease`를 씁니다. 그냥 `--force`는 그 사이 다른 사람이 올린 커밋을 말없이 지웁니다.

**태그**: `v1-before-redesign` = 측정 이벤트까지 포함한 v1 마지막 상태. 롤백해도 계측은 계속 돌아야 하므로 태그를 P0-A **이후**에 찍었습니다.

---

## 3. 재배포 없이 되돌리기 — 원격 스위치 (권장 1순위)

배포를 건드리지 않고 Firestore 콘솔에서 값 하나만 바꾸면 **전체 사용자가 즉시** 되돌아갑니다. 사고 대응에서 가장 빠르고 위험이 낮은 경로입니다.

| 무엇을 되돌리나 | 문서 | 값 |
|---|---|---|
| 디자인 전체 | `config/app` | `theme: "v1"` |
| 가격·수당 | `config/pricing` | v1 값으로 복구 (`src/config/pricing.js`의 `PRICING_V1` 참고) |

문서가 **없으면 자동으로 v1**입니다. 즉 `config/app` 문서를 삭제해도 롤백됩니다.

읽기 실패(규칙 거부·오프라인·차단 확장)도 **정상 경로로 처리**되어 하드코딩 폴백(`PRICING_FALLBACK` = v1)을 씁니다. 원격 설정이 죽어도 가격 화면은 깨지지 않습니다.

⚠️ `config` 컬렉션을 쓰려면 `firestore.rules`에 read 허용이 배포돼 있어야 합니다. 현행 규칙의 catch-all `match /{document=**} { allow read, write: if false; }` 에 걸려 읽기가 거부됩니다.

```powershell
firebase deploy --only firestore:rules
```

---

## 4. 규칙만 되돌리기

```powershell
git checkout v1-before-redesign -- firestore.rules
firebase deploy --only firestore:rules
```

> 규칙과 프론트는 **쌍으로** 되돌립니다. 한쪽만 되돌리면 프론트는 허용하는데 규칙이 막는(또는 그 반대) 상태가 되어 저장 실패가 조용히 발생합니다.

---

## 5. 배포 순서와 롤백 순서

| | 배포할 때 | 되돌릴 때 |
|---|---|---|
| 1 | 프론트 (기능 플래그 OFF 상태로) | 원격 스위치 (`config/app`) ← 여기서 대부분 끝남 |
| 2 | 관찰 (수 분) | gh-pages 되감기 |
| 3 | 규칙 | 규칙 |
| 4 | 원격 스위치 ON | master 되돌리기 |

역순으로 규칙을 먼저 배포하면, 배포 사이에 진행 중이던 분석이 전부 저장 실패합니다.

---

## 6. 미리보기 (Firebase Hosting preview channel 대체)

GitHub Pages에는 브랜치별 미리보기가 없습니다. 대신 **테마 URL 파라미터**를 넣어 뒀습니다.

```
https://wellfit-checkup.co.kr/?theme=v2     ← v2 디자인으로 열기
https://wellfit-checkup.co.kr/?theme=v1     ← 되돌리기
```

우선순위: `?theme=` → `localStorage.wf_theme` → `config/app.theme` → 기본 `v1`.
URL 파라미터로 볼 때는 원격 설정이 덮어쓰지 않습니다(테스트 중 값이 튀지 않도록).

로컬 확인은 `npm run dev` 후 같은 파라미터를 붙이면 됩니다.

---

## 7. 디자인 롤백의 구조

`src/styles/tokens.css` 한 파일에 v1/v2 토큰이 나란히 있고, **v1 값은 2026.8.21 시점의 실제 색과 100% 동일**합니다. `data-theme="v1"`에서 화면이 지금과 조금도 달라지지 않습니다.

`tailwind.config.js`가 색을 `rgb(var(--c-x) / <alpha-value>)` 형태로 참조하므로, **JSX를 한 줄도 고치지 않고** 기존 `bg-rose-gold`, `text-mauve`, `border-cream-deeper`가 전부 테마를 따라갑니다. 투명도 수식어(`bg-rose-gold/10` 등 코드에 40곳 이상)도 그대로 동작합니다.

**아직 안 따라오는 것**: JSX에 박힌 임의값(`text-[#3D2B2B]` 같은 것). P3에서 화면 단위로 `text-ink` 등 신규 토큰 클래스로 교체합니다.

아이콘은 `<Icon name="sleep" />` 래퍼 뒤에 숨겨 두었습니다. v1은 이모지, v2는 lucide 선 아이콘. 되돌릴 때 `Icon.jsx`의 매핑만 보면 됩니다.

---

## 8. 데이터는 되돌릴 수 없다 — 보존 규칙

코드와 설정은 되돌아가지만 **DB에 쓴 것은 안 돌아옵니다.**

- 기존 59,800원 구독자 레코드는 `plan: 'legacy_59800'`으로 **보존**합니다. 삭제·덮어쓰기 금지.
- 신규 플랜 전환 스크립트를 쓸 때는 **역방향 스크립트를 같이** 작성해 두고, 실행 전 해당 컬렉션을 export합니다.
- 파트너 자동 부여 → 신청제 전환 시, 기존 자동 파트너는 `partner_legacy_auto: true`로 남기고 신규 로직만 `partner_applied`로 분기합니다.

```powershell
# 마이그레이션 전 백업 (Blaze 요금제 필요, 스토리지 비용 발생)
gcloud firestore export gs://wellfit-checkup.appspot.com/backup-YYYYMMDD --project=wellfit-checkup
```

---

## 9. 랜딩 롤백

랜딩은 별도 리포입니다: `korahnchild-cmd/wellfit-checkup` (브랜치 `main`, GitHub 웹 업로드로만 관리돼 왔음).

```powershell
cd "D:\AI_인공지능\앱비지니스\웰핏+체크업\wellfit-checkup-live"
git fetch origin --tags
git reset --hard v1-before-redesign
git push origin main --force-with-lease
```

> `웰핏+체크업\wellfit-checkup-repo` 폴더는 `.git` 껍데기만 있고 objects·refs가 비어 있어 **저장소로 동작하지 않습니다.** 새로 clone한 `wellfit-checkup-live`를 쓰고, 옛 폴더는 이름을 바꾸거나 지우세요.

교체 전 파일을 `index_v1.html`, `partners_v1.html`로 리포에 남겨 둘 경우 반드시 `<meta name="robots" content="noindex,nofollow">`를 넣어 색인을 막습니다.

---

## 10. 롤백 판단 기준 (§8-5)

배포 후 **7일**간 아래를 v1 마지막 30일과 비교합니다.

| 지표 | 측정 방법 |
|---|---|
| 체험 → 결제 의향 전환율 | `wf_start_click` → `wf_subscribe_modal_open` |
| 분석 완주율 | `wf_analysis_start` → `wf_analysis_success` |
| 리포트 공유 클릭률 | `wf_report_share_click` ÷ `wf_analysis_success` |
| 전파 효과 | `wf_shared_cta_click` ÷ `wf_report_share_click` |
| 저장 실패율 | `wf_analysis_success` 중 `saved: false` 비율 |

**전환율 20% 이상 하락 또는 결제 오류 발생 시 즉시 롤백 후 원인 분석.**

### ⚠️ 측정에 대한 두 가지 주의

**① 기준선은 2026.8.21부터 쌓입니다.** 그 전에는 커스텀 이벤트를 한 건도 찍지 않았습니다(`getAnalytics()` 선언만 있고 `logEvent` 호출 0건). 소급 수집이 불가능하므로 **v2 배포는 최소 30일 뒤**여야 비교가 성립합니다.

**② 해지율은 앱에서 안 잡힙니다.** 베타 결제가 계좌이체 수동 운영이라 해지 이벤트가 존재하지 않습니다. Firebase Console에서 `subscriptionStatus`를 바꿀 때 **날짜와 사유를 별도 시트에 수기 기록**해야 합니다. 이것만이 유일한 해지 데이터입니다.

**③ GA4 중복 계측 확인 필요.** `index.html`에 gtag.js(`G-Z4KGRYTSL6`)가 직접 삽입돼 있고, 동시에 `firebase.js`의 `getAnalytics()`도 GA4로 보냅니다. 두 measurementId가 같다면 `page_view`가 **2배로 집계**됩니다. `.env`의 `VITE_FIREBASE_MEASUREMENT_ID`를 확인해서, 같으면 `index.html`의 gtag 스니펫을 제거하는 쪽을 권합니다(커스텀 이벤트가 Firebase 경로로 나가므로).

---

## 11. 체크리스트 — 공사 시작 전 이게 다 되어 있어야 함

- [ ] `v1-before-redesign` 태그가 웹앱·랜딩 **양쪽** 리포에 있고 push됨
- [ ] `redesign/v2` 브랜치 생성, `master`는 배포 중인 v1 유지
- [ ] 측정 이벤트가 master에 배포되어 데이터가 쌓이기 시작함
- [ ] `firestore.rules`에 `config` 읽기 허용 배포됨
- [ ] `?theme=v2` 미리보기가 실제로 동작함
- [ ] `rollback.ps1`을 한 번 읽어봄 (급할 때 처음 보면 늦음)
- [ ] Firestore export를 한 번 떠 봄 (명령이 실제로 되는지 확인)
