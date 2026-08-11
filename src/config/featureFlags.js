// src/config/featureFlags.js
//
// 베타 전환 스위치 모음. 값을 바꾸고 재배포하면 즉시 반영됩니다.
//
// REQUIRE_LOGIN_FOR_ANALYSIS
// - false(기본, 테스트 단계): 로그인 없이도 업로드/설문/분석 진행 가능
// - true(베타 오픈 시): UploadPage/SurveyPage 진입 전 로그인 강제, 게스트는 /login으로 리다이렉트
// - ⚠️ 이 값을 true로 바꿀 때는 반드시 firestore.beta.rules 배포와 같이 진행할 것
//   (firestore.rules는 reports 생성에 로그인을 요구하지 않아, 코드에서만 강제하면
//   규칙과 프론트가 어긋난 상태가 됨 — wellfit_project_context_v10.md 참조)
export const REQUIRE_LOGIN_FOR_ANALYSIS = false;
