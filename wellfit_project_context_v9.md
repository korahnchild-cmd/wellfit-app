# 웰핏+ CHECK-UP 프로젝트 컨텍스트 v9
> 새 대화 시작 시 이 파일을 첨부하면 이전 맥락이 그대로 유지됩니다.
> 최종 업데이트: 2026년 7월 3일 (v8 → v9)

---

## 앱 화면 명칭 정의
- **본문리포트**: 이름/거주지 입력 전 AI 분석 결과 화면 (건강나이/이미지분석/호르몬/영양/14일플랜)
- **생성된 리포트**: 이름/거주지 입력 후 나오는 다크배경 PDF스타일 HTML 리포트 화면

---

## 프로젝트 현황 (2026.7.3 기준)

### 기술 스택
- React + Firebase(Firestore/Auth/Functions/Storage) + Gemini API (gemini-2.5-flash-lite, Firebase Functions 프록시, Vertex AI)
- ⚠️ `@google/generative-ai` 라이브러리 사용 금지 — AQ. 형식 키 미지원. 반드시 fetch + 503 재시도 루프(3회, 5초 딜레이)
- 앱 폴더: `D:\AI_인공지능\앱비지니스\웰핏+체크업\wellfit-app`
- **앱 도메인: `https://wellfit-checkup.co.kr` (확정·운영중)**
- **랜딩페이지: `https://korahnchild-cmd.github.io/wellfit-checkup/`** (wellfit-checkup 레포, 별도)
- GitHub: `korahnchild-cmd/wellfit-app` (master → GitHub Actions → gh-pages 자동배포)
- `vite.config.js base: '/'`, `BrowserRouter` basename 제거 완료

### 기술 스택 로드맵 (단계별)
- **현재 ~ MAU 5,000**: Firebase Functions(Node.js) + 클라이언트 Gemini fetch 유지
- **MAU 5,000~10,000**: Google Cloud Run 도입 — Python FastAPI + Docker, 이미지 전처리 서버화
  - 예상 비용(MAU 5,000): Gemini ~15만원/월 + Cloud Run ~5,000원/월
  - 예상 공수: 2~3주
- **MAU 5,000+ (선택)**: MediaPipe 468 랜드마크 연동

### Firebase 설정
- 프로젝트명: wellfit-checkup, Blaze 요금제, 예산 알림 $10
- Firestore: 서울(asia-northeast3)
- **⚠️ 보안규칙 현재 상태: `allow read, write: if true` (전체 공개) — 베타 오픈 전 반드시 수정 필요. 아래 "우선순위 1" 참조**
- Authentication: 구글·카카오·네이버 로그인 전체 활성화, `wellfit-checkup.co.kr` Authorized domains 추가
- Cloud Functions: `kakaoCustomToken`, `naverCustomToken`, `analyzeHealth` (us-central1)
- Gemini API 키: Functions 서버사이드 전용 (클라이언트 노출 없음), 모델: `gemini-2.5-flash-lite`
- Storage: 얼굴/손톱 이미지는 분석 완료 후 즉시 삭제 (AnalyzingPage.jsx에서 deleteObject 호출)

### Firestore 컬렉션 구조 (2026.7.3 확인)
- `users/{uid}`: email, displayName, myReferralCode, referredBy, subscriptionStatus, trialStartDate, analysisCount, directPartners, partnerCustomers, totalEarnings, thisMonthEarnings, createdAt
- `reports/{shareId}`: userId, email, reportData(healthAge·healthAgeBreakdown·hormones·nutrients·faceAnalysis·nailAnalysis·plan14days 등), surveyAnswers, gender, isPublic, userName, userCity, timestamp
- `saveFailures/{id}` (2026.7.3 신규): userId, actualAge, gender, errorMessage, timestamp — Firestore 저장 재시도까지 실패했을 때만 기록되는 베스트에포트 로그

### Firestore 보안 규칙 — 2단계 운영 확정 (2026.7.3)
- **지금(테스트 단계)**: `firestore.rules` — 로그인 없이 분석 가능. `reports` 생성은 필수 필드(userId/reportData/timestamp) 존재 여부만 검증, 읽기는 테스트 데이터라 전체 허용
- **베타 오픈 시(가입 후 30일 무료 → 유료 전환 정책)**: `firestore.beta.rules`로 교체 — 로그인 필수. **A안 채택 확정**: 30일 만료는 규칙(서버) 레벨에서 강제하지 않고 화면(클라이언트) 안내 + Firebase Console 수동 `subscriptionStatus` 변경으로 운영(기존 "베타 수동 운영" 패턴과 일관성 유지). B안(30일 경과 시 규칙 레벨 강제 차단)은 템플릿으로 파일 안에 남겨두고 1,000명 이후 자동화 전환 시점에 재검토
- ⚠️ **규칙만으로는 부족함**: `firestore.beta.rules` 배포와 별개로, **UploadPage.jsx/SurveyPage.jsx 진입 전 로그인을 강제하는 라우트 가드가 프론트엔드 코드에 아직 없음** — 규칙은 로그인 안 한 사용자의 DB 쓰기만 막을 뿐, 로그인 안 한 사용자가 애초에 분석 화면까지 들어오는 걸 막지는 못함. 베타 전환 작업에 별도 항목으로 반드시 포함 필요 (아래 우선순위 2 참조)

---

## 완료 작업 이력

### 2026.6.17~18 — 도메인 이전 + 소셜 로그인
- `wellfit-checkup.co.kr` 가비아 구매, DNS 설정, GitHub Pages 연결
- 구글·카카오(비즈앱 전환)·네이버 로그인 3종 완성
- 카카오 트러블슈팅: KOE101(deploy.yml env 누락) → KOE006(플랫폼 키 화면 Redirect URI 등록)
- GitHub Secrets 저장만으론 빌드 미반영 — deploy.yml Build step env에 반드시 추가 필요

### 2026.6.18 — UI 개선
- WF+ 앱 아이콘 확정: 로즈골드→모브 그라디언트 + 흰색 WF + 우측상단 + + 하단 ECG 파형
- `index.html` favicon: `/wf_app_icon.png`
- `LoginPage.jsx`: 홈화면과 동일한 SVG 아이콘 + 카카오·네이버 버튼
- `PartnerDashboard.jsx` (`/partner-dashboard`): XY수익시뮬레이터 + 공유스크립트 + 축하모달
- `MyPage.jsx`: Day카운터 히어로 + 오늘의플랜 + 건강기록요약 + 추천코드
- `BottomNav.jsx`: 홈/분석하기(중앙돌출)/파트너/마이, `position:fixed; left:0; right:0`, 내부 `maxWidth:448px`
- `UploadPage`: face_guide.jpg + nail_guide.jpg 실사 가이드, `capture="environment"`

### 2026.6.18~7.1 — 법적 리스크 1차 수정 (v6 기준)
- `gemini.js`: comment 가이드 `"<의료 진단 없이, 생활습관 개선 조언 1문장>"` 적용
- `generateReport.js`: 혈액검사 단위 제거, "치료" → "생활습관 개선"
- `ReportPage.jsx`: "AI 측정 기준" → "AI 분석 기준"
- `index.html` / `wellfit_ambassador.html`: 단위표기 제거, 면책문구 보강

### 2026.7.1 — 법적 리스크 2차 수정
- 수정 근거: 식약처 2026.2 개정 웰니스 제품 판단기준 — "사용 목적"(질병 진단·치료 여부) + "위해도"로 의료기기 해당여부 결정. 단어 자체(에스트로겐/코르티솔/비타민D 등)는 문제없고, "정상 범위/경계 범위/진단/치료/확인됩니다" 류 표현만 금지
- `index.html` 21곳, `wellfit_ambassador.html` 1곳, `generateReport.js` 4곳, `ReportPage.jsx` 1곳 수정
- `gemini.js`: comment 필드 20개 전부 허용/금지 표현 명시한 구체적 가이드로 강화
- 4개 파일 위험 키워드 재검색 결과 0건 확인

### 2026.7.3 — healthAge 산출 로직 v4 + Firestore 저장 안정화 (오늘)
**배경**: v3(설문 점수 구간 매핑 + 이미지 양호/주의 가감 + clamp 전체를 Gemini 프롬프트 지시로 처리)를 실측 테스트한 결과, `healthAgeBreakdown` 필드끼리 산수가 맞지 않는 버그를 실제 응답에서 확인. 예: `imageAdjustment: 0`인데 `faceAnalysis`/`nailAnalysis` 서술 텍스트 근거로 역산하면 `+2`가 나와야 하는 모순, `actualAge + surveyAdjustment + imageAdjustment ≠ finalHealthAge`인 사례.

**원인 판단**: LLM에게 "정성 판독 → 카운팅 → 구간 매핑 → 덧셈 → clamp"까지 다단계 산술을 통째로 맡기는 구조적 한계로 판단(확신도: 중간 — 표본 1건 관찰 기반, 반복 재현 여부는 추가 검증 필요).

**적용한 해결책 — v4 (역할 분리)**:
- `gemini.js`에 `SURVEY_QUESTIONS` 배열을 모듈 상단으로 분리(기존엔 `buildSurveyText` 내부와 프롬프트 지시에 이중 관리됨)
- `calcSurveyAdjustment(surveyData)`: 설문 총점(18~90) → 구간별 조정값(-4~+4) 계산을 JS로 결정론적 처리
- `calcImagePartAdjustment(assessment, keys)`: 얼굴/손톱 각 항목 "양호"/"주의" 판정 개수 → ±1 계산을 JS로 결정론적 처리
- Gemini에게는 **정성 판정만** 요청: `faceAssessment{moisture,tone,darkCircle}`, `nailAssessment{color,ridge,lunula}` 각각 "양호" 또는 "주의" 단어만 반환하도록 프롬프트 축소. `healthAge`/`healthAgeBreakdown`은 Gemini 응답에서 제외
- `analyzeHealth()`가 Gemini 응답을 받은 직후 JS에서 `finalHealthAge = actualAge + surveyAdjustment + imageAdjustment`(±6세 clamp, 정수 반올림) 계산 후 `parsed.healthAge`/`parsed.healthAgeBreakdown`에 부착

**실측 검증**: 로컬 테스트 1건에서 `faceAssessment: {주의,주의,주의}`(imageAdjustment +1), `nailAssessment: {양호,주의,양호}`(imageAdjustment -1) → 합산 0, `surveyAdjustment -2` → `finalHealthAge 48` — 화면 표시(48세, -2세)와 breakdown 필드 산수가 정확히 일치함을 확인. **다만 표본 1건이라 통계적 신뢰도는 제한적. 다른 성별·극단치 설문 케이스 2~3건 추가 재현 테스트 필요(아래 다음 작업 참조)**

**AnalyzingPage.jsx — Firestore 저장 안정성 강화**:
- 기존 문제: `addDoc(collection(db,'reports'),...)` 타임아웃이 5초로 설정되어 있었고, 실패 시 `console.warn`만 찍고 조용히 넘어가는 구조. 실측 확인 결과 `analyzeHealth` 요청 자체가 10~11초 걸리는 네트워크 환경에서 5초 타임아웃은 실패 가능성이 높다고 판단(확신도: 중간 — 실제 실패 로그를 직접 확인하지는 못함)
- 수정: 타임아웃 5초 → 15초, 1차 실패 시 3초 대기 후 1회 재시도, 재시도까지 실패하면 `console.warn` → `console.error`로 격상하고 `saveFailures` 컬렉션에 최소 정보(userId, actualAge, gender, errorMessage, timestamp) 베스트에포트 기록

---

## 법적 표현 기준 (확정)

### 안전한 표현 ✅
- `에스트로겐 저하 위험도 XX%`
- `코르티솔 과다 위험 XX%`
- `비타민D 결핍 위험 참고 지표`
- `관리 권장 범위`, `참고 구간 주의 관찰`
- `~을 챙겨보세요`, `~하면 도움이 될 수 있어요`

### 절대 금지 표현 ❌
- `정상 범위`, `경계 범위`, `보충 후 정상 범위 진입`
- `수치가 낮다/높다`, `결핍입니다`, `과다입니다`
- `진단`, `치료`, `확인됩니다`, `여부를 확인`
- `혈액검사 수준`, `같은 수치` (등가성 주장)
- `Microsoft Azure` (실제 인프라: Google Vertex AI)
- `임상 연구 데이터 기반` → `공개 연구 문헌 참고 설계`

### ⚠️ 2026.7.3 추가 확인 필요 항목
`faceAssessment`/`nailAssessment`(내부 계산용 "양호"/"주의" 판정)는 **화면(UI)에 절대 그대로 노출되면 안 됨** — "주의"라는 단어가 사용자에게 의료적 판정처럼 보일 수 있음. 화면에는 기존처럼 `faceAnalysis`/`nailAnalysis`의 서술형 문장만 노출되는지 `ReportPage.jsx`·`generateReport.js` 재확인 필요(아직 미확인).

---

## 파일별 법적 안전 현황 (2026.7.3 기준)
| 파일 | 상태 | 비고 |
|---|---|---|
| `index.html` | ✅ 수정 완료 | 21곳 교체, 실배포 여부 미확인 |
| `wellfit_ambassador.html` | ✅ 수정 완료 | 1곳 교체, 실배포 여부 미확인 |
| `generateReport.js` | ✅ 수정 완료 | 4곳 교체, 실배포 여부 미확인 |
| `ReportPage.jsx` | ✅ 수정 완료 | 1곳 교체, 실배포 여부 미확인 |
| `gemini.js` | ✅ v4 구조 변경 완료 | healthAge 산식 JS 이관, 실배포 여부 미확인 |
| `AnalyzingPage.jsx` | ✅ 저장 재시도 로직 추가 (신규) | 실배포 여부 미확인 |
| `GeneratedReportPage.jsx` | ✅ 원래 안전 | 수정 불필요 |
| `SharedReportPage.jsx` | ✅ 원래 안전 | 수정 불필요 |

---

## 소셜 로그인 현황
- **구글**: `prompt: 'select_account'` — 완료 ✅
- **카카오**: 비즈앱 전환(514-22-27043) + Redirect URI(`wellfit-checkup.co.kr/auth/kakao`) 등록 완료 ✅
  - Redirect URI 위치: 카카오 개발자 → 앱 → **플랫폼 키** → 카카오 로그인 리다이렉트 URI (일반 탭 아님)
- **네이버**: Callback URL(`wellfit-checkup.co.kr/auth/naver`) PC웹·모바일웹 등록 완료 ✅
- deploy.yml Build step env에 `VITE_KAKAO_REST_API_KEY`, `VITE_NAVER_CLIENT_ID`, `VITE_NAVER_CLIENT_SECRET` 추가 필수

---

## 파트너 프로그램
- 직접추천 25%(14,950원) + 오버라이딩 20%(2,990원)
- 추천코드: 이메일 앞 영문 2자리+숫자4자리, `wellfit-checkup.co.kr/?ref=코드`, localStorage 7일
- **사업계획서에 파트너 프로그램 절대 언급 안 함**

---

## 구독/결제 정책
| 구분 | 내용 |
|---|---|
| 무료 체험 | 14일, 분석 1회 |
| 유료 구독 | 월 59,800원, 월 4회 분석 |
| 베타 수동 운영 | 카카오페이/계좌이체 → Firebase Console 수동 `subscriptionStatus:'paid'` |

---

## 특허 정보
- 특허①: 비침습적 바이오마커 추정 (출원번호 제2026-0102971호)
- 특허②: 손톱 이미지 분석 미세영양소 결핍 위험도 산출 (출원번호 제2026-0102972호)
- 출원인: 김성훈

---

## 다음 세션 작업 목록 (우선순위별, 2026.7.3 기준)

### 🔴 우선순위 1 — 베타 오픈 전 반드시 (이번 주)
1. **Firestore 보안 규칙 배포 (테스트용 `firestore.rules`)** — 현재 `allow read, write: if true`(전체 공개) 상태를 최소 검증 버전으로 교체. 베타 전환용 `firestore.beta.rules`는 지금은 배포하지 않고 파일만 준비해둠(A안 확정, 아래 우선순위 2 참조)
2. **6개 파일 실배포 확인** — `index.html`, `wellfit_ambassador.html`, `generateReport.js`, `ReportPage.jsx`, `gemini.js`, `AnalyzingPage.jsx`(신규). 로컬 수정만 하고 실제 `wellfit-checkup.co.kr`/Functions에 반영 안 됐을 가능성 있음
3. **로컬 재검증 마무리**:
   - `reports` 컬렉션에 분석 결과가 정상 저장되는지 Firestore 콘솔에서 직접 확인
   - healthAge v4 로직 재현성 테스트 2~3건 추가 (여성 케이스, 극단적으로 좋거나 나쁜 설문 응답 조합)
   - `saveFailures` 컬렉션 쓰기 가능 여부 확인 (Firestore 규칙 수정과 함께 검증)
4. **`faceAssessment`/`nailAssessment` UI 노출 여부 재확인** — 내부 계산용 필드가 화면에 그대로 뜨지 않는지 `ReportPage.jsx`·`generateReport.js` 점검

### 🟡 우선순위 2 — 베타 오픈 직전 권장
- 배포 후 실제 도메인에서 최신 버전 정상 반영 확인 (캐시/브랜치 이슈 이력 있음 — 트러블슈팅 노하우 참조)
- **로그인 강제 라우트 가드 추가 (2026.7.3 신규)** — 베타 전환 시 `UploadPage.jsx`/`SurveyPage.jsx` 진입 전 로그인 여부 체크 필요. `firestore.beta.rules`가 DB 쓰기는 막아주지만, 비로그인 사용자가 분석 화면까지 진입하는 것 자체는 프론트엔드 라우트 가드 없이는 못 막음. `firestore.beta.rules` 배포와 반드시 같이 진행할 것
- 카카오 알림톡 연동 — 카카오 비즈니스 채널 개설부터
- 랜딩페이지 도메인 정리 — `korahnchild-cmd.github.io/wellfit-checkup/` → `wellfit-checkup.co.kr` 연결 상태 재확인

### 🟢 우선순위 3 — 보류 중 (베타 이후, 지금 안 건드려도 됨)
- 14일 차단 로직 + 포트원 결제 시스템 (1,000명 이후)
- 3개월 예상 피부 미리보기 (Gemini Vision API)
- 네이티브 앱 (1,000명 이후)
- Google Cloud Run + MediaPipe (MAU 5,000명 이후)
- 건강나이 챌린지 인증서 SNS 공유 (3개월 후)

---

## 트러블슈팅 노하우
- **index.html 끝 잘림**: `</body></html>` 누락이 빌드 실패 원인 — 파일 작업 후 항상 끝부분 확인
- **git push 거부**: `git pull origin master --rebase` → 안 되면 `git push origin master --force`
- **Actions 안 돌 때**: `git commit --allow-empty -m "trigger" && git push`
- **detached HEAD 상태**: `git checkout master` 후 재시도
- **GitHub Secrets 빌드 미반영**: `deploy.yml` Build step `env:` 에도 반드시 추가
- **카카오 Redirect URI**: 비즈앱에서 [앱 > 플랫폼 키] 화면 하단에 있음 (일반 탭 아님)
- **favicon 미반영**: gh-pages 브랜치에 파일 있는지 확인, 확장자(jpeg/png) 불일치 주의
- **healthAge breakdown 불일치 의심 시(2026.7.3 추가)**: Gemini 응답의 `faceAssessment`/`nailAssessment` 값이 정확히 "양호"/"주의" 두 단어인지 먼저 확인 — 다른 단어가 들어오면 `calcImagePartAdjustment`가 카운트에서 누락시켜 조용히 0으로 계산됨
