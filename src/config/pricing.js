// src/config/pricing.js
//
// 2026.8.21 — 가격·수당 정의를 코드에서 분리.
//
// 브리프 §8-4: "롤백 = Firestore 문서 값 복구". 그러려면 두 가지가 필요하다.
//   ① Firestore `config/pricing` 문서 (원격 스위치)
//   ② 그 문서를 못 읽었을 때 쓸 하드코딩 폴백 ← 이게 없으면 규칙 거부·오프라인·
//      네트워크 실패 시 가격 화면이 통째로 깨진다. 결제 화면은 절대 빈 값이 되면 안 된다.
//
// ⚠️ Firestore에 config 컬렉션을 두려면 firestore.rules에 read 허용을 추가해야 한다.
//    현행 규칙 마지막의 catch-all `match /{document=**} { allow read, write: if false; }`
//    에 걸려 읽기가 거부된다. (_v2_stage/root/firestore.rules 참조)

/** v1 — 2026.8.21까지 운영한 단일 티어. 롤백 시 이 값으로 돌아온다. */
export const PRICING_V1 = {
  version: 'v1',
  plans: [
    {
      id: 'single',
      name: '웰핏+ CHECK-UP',
      price: 59800,
      period: 'month',
      profiles: 1,
      analysesPerMonth: 4,
      features: ['AI 건강나이', '호르몬 6종·영양 8종 참고 지수', '20페이지 리포트', '14일 맞춤 플랜', '리포트 공유'],
    },
  ],
  commission: {
    // v1: 구독료 비율 기반
    mode: 'percent',
    directRate: 0.25,      // 14,950원
    overrideRate: 0.20,    // 직접수당의 20% = 2,990원
  },
  trialDays: 14,
};

/** v2 — 2티어 + 정액 수당. 확정 전까지 Firestore 문서로만 켠다. */
export const PRICING_V2 = {
  version: 'v2',
  plans: [
    {
      id: 'basic',
      name: '베이직',
      price: 19800,
      period: 'month',
      profiles: 1,
      analysesPerMonth: 4,
      features: ['AI 건강나이', '호르몬 6종·영양 8종 참고 지수', '20페이지 리포트', '14일 맞춤 플랜', '리포트 공유'],
    },
    {
      id: 'plus',
      name: '플러스',
      price: 39800,
      period: 'month',
      profiles: 3,
      analysesPerMonth: 4,
      features: ['베이직의 모든 것 · 프로필 3명', '결핍 위험 기준 주간 식단 + 장보기 리스트', '갱년기 증상일기 + 주간 AI 코멘트', '매주 새 수면·호흡 가이드 오디오'],
    },
  ],
  commission: {
    // v2: 티어 무관 정액 (파트너가 비싼 플랜을 밀 유인을 없애기 위함)
    mode: 'flat',
    directAmount: 4950,
    overrideAmount: 990,
  },
  trialDays: 14,
};

/**
 * 기존 59,800원 구독자 보존용 플랜 ID.
 * ⚠️ 이 값을 가진 사용자 레코드는 절대 삭제·변경하지 않는다.
 *    신규 플랜으로 옮길 때는 마이그레이션 스크립트와 **역방향 스크립트를 함께** 작성한다.
 */
export const LEGACY_PLAN_ID = 'legacy_59800';

/** 폴백 기본값 — 원격 설정을 못 읽으면 이걸 쓴다. 롤백 상태와 동일해야 한다. */
export const PRICING_FALLBACK = PRICING_V1;

/** 수당 계산 — mode에 따라 분기. 화면·정산 어디서든 이 함수만 쓴다. */
export function calcCommission(pricing, planPrice) {
  const c = pricing?.commission;
  if (!c) return { direct: 0, override: 0 };
  if (c.mode === 'flat') {
    return { direct: c.directAmount || 0, override: c.overrideAmount || 0 };
  }
  const direct = Math.round((planPrice || 0) * (c.directRate || 0));
  return { direct, override: Math.round(direct * (c.overrideRate || 0)) };
}
