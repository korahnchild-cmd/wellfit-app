// src/components/Icon.jsx
//
// 2026.8.21 — 아이콘 래퍼. 이모지 → 선 아이콘 교체를 한 곳에서 되돌리기 위한 장치.
//
// 배경: 현재 UI에 이모지가 200개 가까이 직접 박혀 있다
// (generateReport.js 103 · ReportPage 52 · MyPage 37 · HomePage 3 등, 2026.8.21 실측).
// OS마다 다르게 렌더링되고 톤 통일이 불가능해 "템플릿 느낌"의 1순위 원인이다.
//
// 사용법: <span>😴</span>  →  <Icon name="sleep" />
//   v1 테마: 기존 이모지 그대로 (화면이 지금과 동일)
//   v2 테마: lucide-react 선 아이콘
// 교체는 P3에서 화면 단위로 점진 적용한다. 되돌릴 때는 이 파일의 매핑만 바꾸면 된다.

import {
  Moon, Sparkles, Scale, Thermometer, Pill, Frown, TrendingUp, Trophy,
  Bell, Wallet, Flower2, BarChart3, Gift, Rocket, Coffee, Droplet,
  Eye, Microscope, FlaskConical, Calendar, Hand, Users, HelpCircle,
} from 'lucide-react';
import { getTheme } from '../lib/theme';

// name → [이모지(v1), lucide 컴포넌트(v2)]
const MAP = {
  sleep:      ['😴', Moon],
  shine:      ['✨', Sparkles],
  balance:    ['⚖️', Scale],
  hotflash:   ['🌡️', Thermometer],
  supplement: ['💊', Pill],
  mood:       ['😔', Frown],
  trend:      ['📈', TrendingUp],
  trophy:     ['🏆', Trophy],
  bell:       ['🔔', Bell],
  money:      ['💰', Wallet],
  flower:     ['🌸', Flower2],
  chart:      ['📊', BarChart3],
  gift:       ['🎁', Gift],
  rocket:     ['🚀', Rocket],
  coffee:     ['☕', Coffee],
  moisture:   ['💧', Droplet],
  darkcircle: ['👁️', Eye],
  pore:       ['🔬', Microscope],
  hormone:    ['⚗️', FlaskConical],
  plan:       ['📅', Calendar],
  nail:       ['💅', Hand],
  family:     ['👨‍👩‍👧', Users],
};

/**
 * @param {string} name  MAP의 키
 * @param {number} [size=18]  v2 아이콘 크기(px). v1 이모지는 em 기준이라 무시됨
 * @param {string} [className]
 */
export default function Icon({ name, size = 18, className = '', ...rest }) {
  const entry = MAP[name];
  if (!entry) {
    // 매핑 누락은 조용히 넘어가되 개발 중에는 알린다.
    if (import.meta.env?.DEV) console.warn('[Icon] 알 수 없는 name:', name);
    return <HelpCircle size={size} className={className} aria-hidden="true" {...rest} />;
  }
  const [emoji, Glyph] = entry;

  if (getTheme() === 'v2') {
    return <Glyph size={size} strokeWidth={1.5} className={className} aria-hidden="true" {...rest} />;
  }
  return <span className={className} aria-hidden="true" {...rest}>{emoji}</span>;
}
