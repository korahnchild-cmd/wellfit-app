// src/lib/track.js
//
// 2026.8.21 — 측정 기준선(baseline) 수집용 이벤트 래퍼.
//
// 배경: 구조 개편(v2) 배포 후 "v1 마지막 30일과 비교해 전환율이 20% 이상
// 하락하면 롤백"이라는 판단 기준을 세웠는데, 그때까지 이 앱은 firebase.js에서
// getAnalytics()를 호출만 하고 커스텀 이벤트를 한 건도 찍지 않고 있었다.
// 즉 비교 대상 자체가 존재하지 않았다. 소급 수집이 불가능하므로 개편 착수보다
// 먼저 배포해 기준선을 쌓는다.
//
// 원칙: 측정 실패가 기능을 절대 막지 않는다. 모든 호출을 try/catch로 감싼다.

import { logEvent } from 'firebase/analytics';
import { analytics } from '../firebase';

// GA4 이벤트명 규칙: 영문 소문자·숫자·언더스코어, 40자 이내.
// 자사 이벤트임을 구분하려고 wf_ 접두사를 붙인다.
export const EV = {
  // ── 분석 퍼널 (체험 → 리포트)
  START_CLICK: 'wf_start_click',           // 홈 "AI 건강 분석 시작하기"
  UPLOAD_NEXT: 'wf_upload_next',           // 사진·나이·성별 입력 완료 → 설문
  ANALYSIS_START: 'wf_analysis_start',     // 유료 Gemini 호출이 나가는 지점
  ANALYSIS_SUCCESS: 'wf_analysis_success', // 분석 성공 (saved=Firestore 저장 여부)
  ANALYSIS_FAIL: 'wf_analysis_fail',

  // ── 전파 (공유 → 신규 유입)
  REPORT_VIEW_CLICK: 'wf_report_view_click',   // "리포트 보기"
  REPORT_SHARE_CLICK: 'wf_report_share_click', // "공유하기"
  SHARED_CTA_CLICK: 'wf_shared_cta_click',     // 공유 리포트 방문자의 "무료로 시작하기"

  // ── 결제 의향
  SUBSCRIBE_MODAL_OPEN: 'wf_subscribe_modal_open',

  // ── 계정
  LOGIN_SUCCESS: 'wf_login_success',
};

/**
 * 이벤트 1건 기록.
 * @param {string} name  EV 상수 사용 권장
 * @param {object} [params] GA4 파라미터 (값은 100자 이내 문자열/숫자/불리언)
 */
export function track(name, params) {
  try {
    if (!analytics || !name) return;
    logEvent(analytics, name, params || {});
  } catch (err) {
    // 광고 차단기·쿠키 차단·미지원 브라우저 등에서 흔히 실패한다.
    // 측정은 부가 기능이므로 조용히 넘어간다.
    if (import.meta.env?.DEV) console.warn('[track] 실패:', name, err?.message);
  }
}
