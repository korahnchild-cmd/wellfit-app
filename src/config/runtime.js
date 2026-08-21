// src/config/runtime.js
//
// 2026.8.21 — 원격 런타임 설정 로더 (테마 + 가격).
//
// 재배포 없이 되돌릴 수 있어야 하는 값들을 Firestore `config` 컬렉션에서 읽는다.
//   config/app     : { theme: 'v1' | 'v2' }
//   config/pricing : PRICING_V1 / PRICING_V2 와 같은 형태의 객체
//
// 설계 원칙
//   · 읽기 실패는 정상 경로다. 규칙 거부·오프라인·차단 확장 프로그램 모두 흔하다.
//     실패하면 조용히 폴백을 쓰고 앱은 그대로 동작한다.
//   · 문서가 없으면 = "아직 v2를 켜지 않았다"로 해석한다. 즉 기본은 항상 v1이다.
//   · 4초 안에 응답이 없으면 폴백. 가격 화면이 로딩으로 멈춰 있으면 안 된다.

import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { PRICING_FALLBACK } from './pricing';
import { DEFAULT_THEME } from '../lib/theme';

const TIMEOUT_MS = 4000;

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('config timeout')), ms)),
  ]);
}

async function readDoc(path) {
  const snap = await withTimeout(getDoc(doc(db, 'config', path)), TIMEOUT_MS);
  return snap.exists() ? snap.data() : null;
}

/** config/app 의 theme. 실패하면 null (호출 측이 로컬 결정을 유지) */
export async function fetchRemoteTheme() {
  try {
    const data = await readDoc('app');
    const t = data?.theme;
    return t === 'v1' || t === 'v2' ? t : null;
  } catch (err) {
    console.warn('[runtime] 원격 테마 읽기 실패(폴백 사용):', err?.message);
    return null;
  }
}

/** config/pricing. 실패하면 하드코딩 폴백 */
export async function fetchPricing() {
  try {
    const data = await readDoc('pricing');
    if (data && Array.isArray(data.plans) && data.plans.length > 0) return data;
    return PRICING_FALLBACK;
  } catch (err) {
    console.warn('[runtime] 가격 설정 읽기 실패(폴백 사용):', err?.message);
    return PRICING_FALLBACK;
  }
}

export { DEFAULT_THEME };
