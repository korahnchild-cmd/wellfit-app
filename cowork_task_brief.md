# 웰핏+ CHECK-UP — Cowork 작업 지시문 (우선순위 1, 2026.7.3 기준)

이 세션은 웰핏+ CHECK-UP 앱 개발 작업만 다룹니다.
정부지원사업 관련 파일(wellfit_gov_support_v1.md, wellfit_patent.md)은 이번 작업과 무관하니 참고하지 마세요.

작업 폴더: D:\AI_인공지능\앱비지니스\웰핏+체크업\wellfit-app
(프로젝트 지식파일 wellfit_project_context_v9.md를 먼저 읽고 전체 맥락을 파악한 뒤 시작하세요)

이 세션에 첨부해야 할 파일: gemini.js, AnalyzingPage.jsx, firestore.rules,
firebase.json(수정본), firestore.indexes.json
(firestore.beta.rules는 참고용으로만 전달 — 이번 세션에서 배포하지 않음)

---

## 작업 1 — 로컬 파일 반영 상태 확인
아래 6개 파일이 실제로 로컬 프로젝트 폴더에 최신 버전으로 반영되어 있는지 확인해줘.
누락되거나 이전 버전이면 알려줘 (수정된 버전은 이번 대화에 첨부된 파일 참고):
- src/gemini.js (healthAge v4 구조로 변경됨)
- src/pages/AnalyzingPage.jsx (Firestore 저장 재시도 로직 추가됨)
- src/pages/ReportPage.jsx
- src/utils/generateReport.js
- index.html (wellfit-checkup 레포)
- wellfit_ambassador.html (wellfit-checkup 레포)

## 작업 2 — Firestore 보안 규칙 배포 (⚠️ 승인 필수 작업)
firestore.rules 파일(테스트용, 이번 대화에 첨부)을 적용해줘.
firestore.beta.rules는 지금은 배포하지 마 — 베타 전환 시점까지 파일로만 보관.

절차:
1. 먼저 배포 방법을 콘솔(Firebase Console 규칙 탭에 직접 붙여넣기)과
   CLI(firebase deploy --only firestore:rules) 중 뭐가 더 적합한지 판단해서 제안해줘.
   CLI를 쓴다면 firebase.json(이번 대화에 첨부된 수정본, firestore 섹션 추가됨)과
   firestore.indexes.json(빈 파일, 이번 대화에 첨부)을 프로젝트 루트에 배치하고,
   .firebaserc가 wellfit-checkup 프로젝트를 가리키는지 먼저 확인해줘.
2. 실제 게시/배포 전에 반드시 Firebase 콘솔의 규칙 시뮬레이터로 테스트해줘:
   - 로그인 사용자가 자기 reports 문서를 쓰기/읽기 가능한지
   - 필수 필드(userId/reportData/timestamp) 없는 문서 생성이 거부되는지
   - saveFailures 컬렉션 쓰기가 허용되는지 (읽기는 거부되어야 함)
3. 시뮬레이터 결과를 정리해서 먼저 보고해줘. 문제없어 보여도 **여기서 멈추고
   내 승인을 기다려줘 — 이 작업은 절대 자동으로 게시/배포까지 진행하지 마.**
4. 승인 후에만 실제 게시/배포를 진행하고, 배포 완료 후 아래 3가지를 실제로 테스트해줘:
   - 로그인 사용자가 분석 결과를 정상적으로 저장/조회하는지
   - ReportPage.jsx의 이름/거주지 입력이 정상 동작하는지
   - 공유 리포트 링크(report-view/{shareId})를 비로그인 상태에서 열람 가능한지

## 작업 3 — healthAge v4 재현성 테스트 (2~3건)
로컬 dev 서버를 실행하고, 아래 조합으로 실제 분석을 돌려서 결과를 정리해줘:
- 여성, 40대, 설문 응답을 최대한 낮게(전부 1점 근처) 입력
- 여성 또는 남성, 60대, 설문 응답을 최대한 높게(전부 5점 근처) 입력
각 케이스마다 다음을 확인하고 표로 정리해줘:
- healthAgeBreakdown의 4개 필드(surveyScore, surveyAdjustment, imageAdjustment, finalHealthAge)
- 산수가 실제로 맞는지 (actualAge + surveyAdjustment + imageAdjustment == finalHealthAge)
- faceAssessment/nailAssessment 값이 정확히 "양호" 또는 "주의" 두 단어로만 왔는지

## 작업 4 — Firestore 저장 확인
위 테스트에서 만든 분석 결과가 Firestore reports 컬렉션에 실제로 저장되는지 콘솔에서 확인해줘.
저장이 안 된 케이스가 있으면 saveFailures 컬렉션에 로그가 남았는지도 확인해줘.

## 작업 5 — 화면 노출 안전성 확인
ReportPage.jsx와 generateReport.js를 확인해서, faceAssessment/nailAssessment
(내부 계산용 "양호"/"주의" 판정 필드)가 사용자 화면에 그대로 노출되지 않는지 확인해줘.
화면에는 faceAnalysis/nailAnalysis의 서술형 문장만 표시되어야 정상이야.
만약 assessment 필드가 그대로 노출되는 코드가 있으면 찾아서 알려줘 (수정은 아직 하지 말고 보고만).

---

## 완료 후 보고 형식
각 작업별로 "완료/이슈 발견" 여부와 구체적인 근거(로그, 스크린샷, 콘솔 확인 결과)를 정리해서 알려줘.
수정이 필요한 부분을 발견해도 바로 고치지 말고, 무엇을 발견했는지 먼저 보고해줘 —
특히 작업 2(Firestore 규칙)와 작업 5(화면 노출)는 사용자 데이터·컴플라이언스와 직결되니 승인 후 진행해줘.
