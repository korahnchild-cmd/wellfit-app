// src/lib/theme.js
//
// 2026.8.21 — 테마 런타임 스위치.
//
// 브리프 §8-3은 "REACT_APP_THEME 환경변수로 빌드 없이 전환"을 적었으나 두 가지가 사실과 다르다:
//   ① 이 앱은 CRA가 아니라 Vite라 접두사가 VITE_ 다.
//   ② 더 중요한 건, 환경변수는 빌드 타임에 문자열로 박히므로 "빌드 없이 전환"이
//      원리적으로 불가능하다. 무빌드 전환을 하려면 런타임에 값을 읽어야 한다.
//
// 그래서 우선순위를 이렇게 잡는다 (앞이 이김):
//   1) URL 파라미터 ?theme=v2   → 배포 없이 미리보기. GitHub Pages에는 Firebase Hosting의
//                                 preview channel 같은 게 없으므로 이것이 그 대체재다.
//   2) localStorage wf_theme    → 테스터가 한 번 고르면 유지
//   3) Firestore config/app.theme → **진짜 킬스위치.** 콘솔에서 값 하나 바꾸면
//                                 전체 사용자가 재배포 없이 즉시 되돌아간다.
//   4) 기본값 'v1'
//
// 1~2는 즉시(동기) 적용되고, 3은 네트워크라 도착하는 대로 덮어쓴다.

const THEMES = ['v1', 'v2'];
const STORAGE_KEY = 'wf_theme';
export const DEFAULT_THEME = 'v1';

function normalize(value) {
  return THEMES.includes(value) ? value : null;
}

/** URL·localStorage만 보고 즉시 결정 (네트워크 없음) */
export function resolveLocalTheme() {
  try {
    const fromUrl = normalize(new URLSearchParams(window.location.search).get('theme'));
    if (fromUrl) {
      // 미리보기 링크를 공유했을 때 이동해도 유지되도록 저장한다.
      try { localStorage.setItem(STORAGE_KEY, fromUrl); } catch { /* 무시 */ }
      return fromUrl;
    }
    const fromStorage = normalize(localStorage.getItem(STORAGE_KEY));
    if (fromStorage) return fromStorage;
  } catch {
    // 프라이빗 모드 등에서 접근 자체가 throw 할 수 있다.
  }
  return DEFAULT_THEME;
}

/** <html data-theme="..."> 적용 */
export function applyTheme(theme) {
  const t = normalize(theme) || DEFAULT_THEME;
  try {
    document.documentElement.setAttribute('data-theme', t);
  } catch { /* 무시 */ }
  return t;
}

/** 테스터용 수동 전환 (설정 화면 등에서 호출) */
export function setTheme(theme) {
  const t = normalize(theme) || DEFAULT_THEME;
  try { localStorage.setItem(STORAGE_KEY, t); } catch { /* 무시 */ }
  return applyTheme(t);
}

export function clearThemeOverride() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* 무시 */ }
}

export function getTheme() {
  try {
    return normalize(document.documentElement.getAttribute('data-theme')) || DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}
