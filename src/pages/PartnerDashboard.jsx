// src/pages/PartnerDashboard.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useApp } from '../context/AppContext';
import { ChevronLeft, Copy, Check, Share2, TrendingUp, Users, Target, Award, Bell } from 'lucide-react';

const DIRECT_RATE = 14950;
const OVERRIDE_RATE = 2990;
const SUB_PRICE = 59800;
const BASE_URL = 'https://wellfit-checkup.co.kr';
// 2026.7.4 — 파트너 추천인 집계는 users 컬렉션 필드 검색이 필요해 클라이언트에서
// 직접 Firestore 쿼리 시 보안 규칙과 충돌함(아래 useEffect 주석 참조). Cloud
// Function(Admin SDK, getPartnerStats)으로 이관 — gemini.js와 동일한 방식으로
// Functions 엔드포인트 URL 구성
const FUNCTIONS_BASE_URL = import.meta.env.VITE_FUNCTIONS_URL ||
  `https://us-central1-${import.meta.env.VITE_FIREBASE_PROJECT_ID}.cloudfunctions.net`;

// 등급 계산
function getGrade(paidCount) {
  if (paidCount >= 20) return { label: '슈퍼 파트너', color: '#C8956C', bg: 'rgba(200,149,108,0.12)', icon: '👑' };
  if (paidCount >= 5)  return { label: '파트너',      color: '#8B5E83', bg: 'rgba(139,94,131,0.12)', icon: '⭐' };
  return                      { label: '새싹 파트너',  color: '#7DBFA8', bg: 'rgba(125,191,168,0.12)', icon: '🌱' };
}

export default function PartnerDashboard() {
  const navigate = useNavigate();
  const { user, myReferralCode } = useApp();

  const [loading, setLoading] = useState(true);
  const [paidCount, setPaidCount] = useState(0);
  const [trialCount, setTrialCount] = useState(0);
  const [overrideCount, setOverrideCount] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [goalAmount, setGoalAmount] = useState(0);
  const [goalInput, setGoalInput] = useState('');
  const [editingGoal, setEditingGoal] = useState(false);
  const [scriptTab, setScriptTab] = useState('friend');
  const [copied, setCopied] = useState(false);
  const [scriptCopied, setScriptCopied] = useState(false);
  const [toast, setToast] = useState('');
  const [showCelebModal, setShowCelebModal] = useState(false);
  const [celebType, setCelebType] = useState('');
  // 2026.7.4 — users 컬렉션 필드 검색(referredBy 기반) 쿼리는 firestore.rules와
  // 구조적으로 충돌해 클라이언트에서 직접 실행 불가 → getPartnerStats Cloud
  // Function(Admin SDK)으로 이관 완료. 그래도 네트워크 오류 등 예외 상황 대비해
  // 배너는 유지.
  const [countError, setCountError] = useState(false);
  // XY 그래프 슬라이더
  const [sliderDirect, setSliderDirect] = useState(5);
  const [sliderOverride, setSliderOverride] = useState(3);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  // 데이터 로드
  useEffect(() => {
    if (!user || user.isGuest) { navigate('/login'); return; }
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const d = snap.data();
          setTotalEarnings(d.totalEarnings || 0);
          setGoalAmount(d.goalAmount || 0);
          // 입력창은 만원 단위로 보여줌 (예: 2,000,000원 → "200")
          setGoalInput(d.goalAmount ? String(Math.round(d.goalAmount / 10000)) : '');
        }
      } catch (e) { console.warn(e); }
      finally { setLoading(false); }
    })();
  }, [user, navigate]);

  // 파트너 카운팅 — getPartnerStats Cloud Function 호출 (2026.7.4 이관)
  // 서버가 idToken에서 검증된 uid로 본인 추천코드를 직접 조회해 집계하므로
  // 클라이언트가 myReferralCode를 보낼 필요 없음(스푸핑 방지 겸 단순화)
  useEffect(() => {
    if (!user || user.isGuest) return;
    (async () => {
      try {
        const idToken = await auth.currentUser.getIdToken();
        const res = await fetch(`${FUNCTIONS_BASE_URL}/getPartnerStats`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || '파트너 통계 조회 실패');

        const { paidCount: paid, trialCount: trial, overrideCount: over, totalDirectCount } = json;
        setPaidCount(paid);
        setTrialCount(trial);
        setOverrideCount(over);

        // 첫 유료 전환 축하
        if (paid === 1 && trial === 0) {
          setCelebType('first_paid'); setShowCelebModal(true);
        }
        // 구독료 0원 달성 (2명 이상)
        if (paid >= 2 && paid === totalDirectCount) {
          setCelebType('free_sub'); setShowCelebModal(true);
        }
      } catch (e) { console.warn(e); setCountError(true); }
    })();
  }, [user]);

  // 수익 계산
  const directIncome = paidCount * DIRECT_RATE;
  const overrideIncome = overrideCount * OVERRIDE_RATE;
  const totalMonthly = directIncome + overrideIncome;
  const grade = getGrade(paidCount);

  // 목표 저장 — 입력은 만원 단위, 저장은 원 단위로 환산
  const handleSaveGoal = async () => {
    const manwon = parseInt(goalInput.replace(/,/g, '')) || 0;
    const val = manwon * 10000;
    setGoalAmount(val);
    setEditingGoal(false);
    try { await updateDoc(doc(db, 'users', user.uid), { goalAmount: val }); }
    catch (e) { console.warn(e); }
  };

  const goalProgress = goalAmount > 0 ? Math.min((totalMonthly / goalAmount) * 100, 100) : 0;

  // 그래프 수익
  const graphIncome = sliderDirect * DIRECT_RATE + sliderDirect * sliderOverride * OVERRIDE_RATE;

  // 스크립트
  const getScript = useCallback((type) => {
    const link = `${BASE_URL}/?ref=${myReferralCode}`;
    const map = {
      friend: `나 요즘 AI 건강 분석 서비스 쓰고 있는데\n셀카 한 장으로 호르몬이랑 영양 상태 분석해 줘 😮\n\n나이 들수록 이런 거 챙겨야 하는데\n병원 가기 전에 미리 체크할 수 있어서 좋더라고\n\n14일 무료 체험이니까 한번 해봐 👇\n${link}\n\n약 5분이면 돼, 이미지도 분석 후 바로 삭제된대 👍`,
      menopause: `언니 혹시 요즘 몸이 예전 같지 않다는 느낌 있어? 🥲\n\n아무리 자도 피곤하고, 얼굴 달아오를 때 있고\n검진은 정상인데 몸은 이상하고...\n\n나도 그랬는데 AI 건강 분석 해봤더니\n호르몬이랑 영양 부분에서 딱 짚어주더라고\n\n14일 무료니까 한번 해봐, 셀카 한 장이면 돼 👇\n${link}\n\n특허 기술이라 믿을 만하고, 이미지 저장도 안 된대 ✔`,
      free: `나 요즘 웰핏+ CHECK-UP 쓰는데 진짜 좋아 😊\n\n셀카 + 간단한 설문으로 호르몬·영양 분석해 주고\n14일 맞춤 건강 플랜도 줘\n\n친구 2명만 초대하면 매달 구독료가 0원이 돼 🤩\n\n👇 내 링크\n${link}`,
    };
    return map[type] || map.friend;
  }, [myReferralCode]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${BASE_URL}/?ref=${myReferralCode}`);
      setCopied(true); showToast('추천 링크가 복사되었습니다 ✓');
      setTimeout(() => setCopied(false), 2000);
    } catch { showToast('복사 실패'); }
  };

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(getScript(scriptTab));
      setScriptCopied(true); showToast('스크립트가 복사되었습니다 ✓');
      setTimeout(() => setScriptCopied(false), 2000);
    } catch { showToast('복사 실패'); }
  };

  const handleKakaoShare = async () => {
    try {
      await navigator.clipboard.writeText(getScript(scriptTab));
      showToast('복사 완료! 카카오톡 열어서 붙여넣기 하세요 💛');
    } catch { showToast('복사 실패'); }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#FDFAF6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner-rose" />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #FDFAF6 0%, #F8F0FA 50%, #F0FAF6 100%)', fontFamily: 'Pretendard, -apple-system, sans-serif' }}>

      {/* 배경 장식 */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0, width: '100%' }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,149,108,0.12) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,94,131,0.1) 0%, transparent 70%)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 448, margin: '0 auto', paddingBottom: 100 }}>

        {/* 헤더 */}
        <div style={{ padding: '52px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: '#9A8080', fontSize: 13, cursor: 'pointer' }}>
            <ChevronLeft size={16} /> 돌아가기
          </button>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: grade.color, background: grade.bg, padding: '5px 12px', borderRadius: 20, letterSpacing: '0.5px' }}>
            {grade.icon} {grade.label}
          </div>
        </div>

        {/* 히어로 — 이번달 수익 */}
        <div style={{ margin: '16px 20px', borderRadius: 24, overflow: 'hidden', position: 'relative' }}>
          <div style={{ background: 'linear-gradient(135deg, #3D2B2B 0%, #5A3A6B 50%, #2B3D3A 100%)', padding: '28px 24px 24px', position: 'relative' }}>
            {/* 배경 패턴 */}
            <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(200,149,108,0.08)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -20, left: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(139,94,131,0.08)', pointerEvents: 'none' }} />

            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.65)', letterSpacing: '1.5px', marginBottom: 6, textTransform: 'uppercase' }}>Partner Dashboard</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 4 }}>이번달 예상 수익</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 20 }}>
              <span style={{ fontSize: 44, fontWeight: 900, color: '#fff', letterSpacing: '-2px', lineHeight: 1 }}>
                {totalMonthly.toLocaleString()}
              </span>
              <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.72)', fontWeight: 500 }}>원</span>
            </div>

            {/* 수익 분해 — 어두운 배경 전용 밝은 톤 컬러로 교체(기존 브랜드 색은 어두운
                그라데이션 위에서 명도 대비가 부족해 눈에 잘 안 들어온다는 피드백 반영).
                라이트 배경(파트너현황/시뮬레이터)에서는 기존 브랜드 색을 그대로 사용. */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { label: '직접 추천', value: directIncome.toLocaleString() + '원', sub: `${paidCount}명 유료`, color: '#F0C49A', glow: 'rgba(240,196,154,0.5)' },
                { label: '오버라이딩', value: overrideIncome.toLocaleString() + '원', sub: `${overrideCount}명`, color: '#E0B8E8', glow: 'rgba(224,184,232,0.5)' },
                { label: '누적 수익', value: totalEarnings.toLocaleString() + '원', sub: '총합', color: '#A8EAC8', glow: 'rgba(168,234,200,0.5)' },
              ].map((item) => (
                <div key={item.label} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: '12px 8px', textAlign: 'center', border: '0.5px solid rgba(255,255,255,0.14)' }}>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 5, letterSpacing: '0.5px', fontWeight: 600 }}>{item.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: item.color, letterSpacing: '-0.3px', textShadow: `0 0 10px ${item.glow}` }}>{item.value}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.62)', marginTop: 3 }}>{item.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 목표 진행률 */}
          <div style={{ background: 'rgba(253,250,246,0.95)', padding: '14px 20px', borderTop: '0.5px solid rgba(200,149,108,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Target size={14} color="#C8956C" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#3D2B2B' }}>이번달 목표</span>
              </div>
              {editingGoal ? (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <div style={{ position: 'relative', width: 100 }}>
                    <input
                      type="number"
                      value={goalInput}
                      onChange={e => setGoalInput(e.target.value)}
                      placeholder="목표(만원)"
                      style={{ width: '100%', padding: '5px 30px 5px 8px', borderRadius: 8, border: '1px solid rgba(200,149,108,0.4)', fontSize: 13, color: '#3D2B2B', background: 'white', outline: 'none', boxSizing: 'border-box' }}
                      autoFocus
                    />
                    <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: '#9A8080', pointerEvents: 'none' }}>만원</span>
                  </div>
                  <button onClick={handleSaveGoal} style={{ padding: '5px 10px', borderRadius: 8, background: '#C8956C', color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer' }}>저장</button>
                </div>
              ) : (
                <button onClick={() => setEditingGoal(true)} style={{ fontSize: 13, color: '#C8956C', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
                  {goalAmount > 0 ? `${Math.round(goalAmount / 10000).toLocaleString()}만원 ✏️` : '목표 설정하기 +'}
                </button>
              )}
            </div>
            {goalAmount > 0 && (
              <>
                <div style={{ height: 7, borderRadius: 4, background: 'rgba(200,149,108,0.12)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg, #C8956C, #8B5E83)', width: `${goalProgress}%`, transition: 'width 0.8s cubic-bezier(0.22,1,0.36,1)' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                  <span style={{ fontSize: 12, color: '#7A6060' }}>{Math.round(goalProgress)}% 달성</span>
                  <span style={{ fontSize: 12, color: '#C8956C', fontWeight: 700 }}>
                    {goalProgress >= 100 ? '🎉 목표 달성!' : `${(goalAmount - totalMonthly).toLocaleString()}원 남음`}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 파트너 현황 카드 */}
        <div style={{ margin: '0 20px 16px', background: 'rgba(255,255,255,0.8)', borderRadius: 20, border: '0.5px solid rgba(200,149,108,0.15)', backdropFilter: 'blur(12px)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 12px', borderBottom: '0.5px solid rgba(200,149,108,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={15} color="#C8956C" />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#3D2B2B' }}>파트너 현황</span>
              <span
                className={countError ? 'live-badge live-badge--warn' : 'live-badge live-badge--live'}
                style={{ marginLeft: 'auto' }}
              >
                <span className="live-dot" />
                {countError ? '집계 점검 중' : '실시간 반영'}
              </span>
            </div>
            {countError && (
              <div style={{ marginTop: 8, padding: '8px 10px', background: 'rgba(200,149,108,0.08)', borderRadius: 10, fontSize: 11, color: '#7A6060', lineHeight: 1.5 }}>
                추천 고객 집계 시스템을 점검 중입니다. 실제 추천·수익 내역은 정산 시 별도 확인해 드립니다.
              </div>
            )}
            {/* "실시간 자동 반영" 평문 텍스트를 은은하게 빛나는 pulse 배지로 고급화.
                초록(정상) / 호박색(점검중) 두 상태, 살아있는 점 + 발광 테두리 애니메이션 */}
            <style>{`
              @keyframes liveBadgeGlow {
                0%, 100% { box-shadow: 0 0 0 0 rgba(125,191,168,0.4), 0 0 6px 0 rgba(125,191,168,0.25); }
                50% { box-shadow: 0 0 0 4px rgba(125,191,168,0), 0 0 12px 2px rgba(125,191,168,0.55); }
              }
              @keyframes liveBadgeGlowWarn {
                0%, 100% { box-shadow: 0 0 0 0 rgba(200,149,108,0.4), 0 0 6px 0 rgba(200,149,108,0.25); }
                50% { box-shadow: 0 0 0 4px rgba(200,149,108,0), 0 0 12px 2px rgba(200,149,108,0.55); }
              }
              @keyframes liveDotBlink {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.35; transform: scale(0.7); }
              }
              .live-badge {
                display: inline-flex; align-items: center; gap: 5px;
                padding: 4px 10px 4px 8px; border-radius: 20px;
                font-size: 11px; font-weight: 700; letter-spacing: 0.2px;
                color: #fff;
              }
              .live-badge--live {
                background: linear-gradient(135deg, #7DBFA8, #5DA898);
                animation: liveBadgeGlow 2.2s ease-in-out infinite;
              }
              .live-badge--warn {
                background: linear-gradient(135deg, #C8956C, #B87F52);
                animation: liveBadgeGlowWarn 2.2s ease-in-out infinite;
              }
              .live-dot {
                width: 6px; height: 6px; border-radius: 50%;
                background: #fff;
                animation: liveDotBlink 1.3s ease-in-out infinite;
              }
            `}</style>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0 }}>
            {[
              { label: '유료 구독고객', value: paidCount, unit: '명', sub: '수익 발생 중', color: '#C8956C', bg: 'rgba(200,149,108,0.06)' },
              { label: '무료 체험 중', value: trialCount, unit: '명', sub: `전환 시 +${(trialCount * DIRECT_RATE).toLocaleString()}원`, color: '#7DBFA8', bg: 'rgba(125,191,168,0.06)' },
              { label: '파트너 고객', value: overrideCount, unit: '명', sub: '오버라이딩', color: '#8B5E83', bg: 'rgba(139,94,131,0.06)' },
            ].map((item, i) => (
              <div key={item.label} style={{ padding: '16px 12px', textAlign: 'center', background: item.bg, borderRight: i < 2 ? '0.5px solid rgba(200,149,108,0.1)' : 'none' }}>
                <div style={{ fontSize: 11, color: '#7A6060', marginBottom: 6, lineHeight: 1.4 }}>{item.label}</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: item.color, lineHeight: 1, letterSpacing: '-1px' }}>
                  {item.value}<span style={{ fontSize: 13, fontWeight: 600, color: '#7A6060' }}>{item.unit}</span>
                </div>
                <div style={{ fontSize: 10.5, color: item.color, marginTop: 5, fontWeight: 600, lineHeight: 1.4 }}>{item.sub}</div>
              </div>
            ))}
          </div>

          {/* 내 추천코드 */}
          <div style={{ padding: '14px 20px', borderTop: '0.5px solid rgba(200,149,108,0.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: '#7A6060', marginBottom: 3 }}>내 추천 링크</div>
              <div style={{ fontSize: 12, color: '#5A4A4A', wordBreak: 'break-all', lineHeight: 1.5 }}>
                {BASE_URL}/?ref={myReferralCode}
              </div>
            </div>
            <button
              onClick={handleCopyLink}
              style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 12, background: copied ? 'rgba(125,191,168,0.15)' : 'rgba(200,149,108,0.1)', border: `1px solid ${copied ? 'rgba(125,191,168,0.3)' : 'rgba(200,149,108,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              {copied ? <Check size={16} color="#7DBFA8" /> : <Copy size={16} color="#C8956C" />}
            </button>
          </div>
        </div>

        {/* XY 수익 시뮬레이터 */}
        <div style={{ margin: '0 20px 16px', background: 'rgba(255,255,255,0.8)', borderRadius: 20, border: '0.5px solid rgba(139,94,131,0.15)', backdropFilter: 'blur(12px)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 12px', borderBottom: '0.5px solid rgba(139,94,131,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={15} color="#8B5E83" />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#3D2B2B' }}>수익 시뮬레이터</span>
            </div>
          </div>

          <div style={{ padding: '20px' }}>
            {/* 예상 수익 표시 */}
            <div style={{ textAlign: 'center', marginBottom: 20, padding: '16px', background: 'linear-gradient(135deg, rgba(200,149,108,0.08), rgba(139,94,131,0.08))', borderRadius: 16, border: '0.5px solid rgba(200,149,108,0.2)' }}>
              <div style={{ fontSize: 13, color: '#7A6060', marginBottom: 4 }}>예상 월 수익</div>
              <div style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-1.5px', background: 'linear-gradient(135deg, #C8956C, #8B5E83)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1 }}>
                {graphIncome.toLocaleString()}
              </div>
              <div style={{ fontSize: 13, color: '#7A6060', marginTop: 2 }}>원 / 월</div>
            </div>

            {/* SVG 그래프 */}
            <div style={{ marginBottom: 20, position: 'relative' }}>
              <svg viewBox="0 0 300 120" style={{ width: '100%', height: 120, overflow: 'visible' }}>
                <defs>
                  <linearGradient id="graphFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C8956C" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#C8956C" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="graphLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#C8956C" />
                    <stop offset="100%" stopColor="#8B5E83" />
                  </linearGradient>
                </defs>

                {/* Y축 그리드 */}
                {[0, 1, 2, 3].map((i) => (
                  <line key={i} x1="30" y1={10 + i * 28} x2="290" y2={10 + i * 28} stroke="rgba(200,149,108,0.1)" strokeWidth="0.5" />
                ))}

                {/* 곡선 — 슬라이더 값 기반 */}
                {(() => {
                  const maxIncome = 50 * DIRECT_RATE + 50 * 50 * OVERRIDE_RATE;
                  const points = Array.from({ length: 11 }, (_, i) => {
                    const d = i * 5;
                    const inc = d * DIRECT_RATE + d * sliderOverride * OVERRIDE_RATE;
                    const x = 30 + (i / 10) * 260;
                    const y = 95 - (inc / maxIncome) * 80;
                    return `${x},${y}`;
                  });
                  const pathD = `M${points[0]} Q${points[2]} ${points[3]} T${points[5]} T${points[7]} T${points[9]} T${points[10]}`;
                  const fillD = pathD + ` L290,95 L30,95 Z`;
                  const curX = 30 + (sliderDirect / 50) * 260;
                  const curInc = sliderDirect * DIRECT_RATE + sliderDirect * sliderOverride * OVERRIDE_RATE;
                  const curY = 95 - (curInc / maxIncome) * 80;
                  return (
                    <>
                      <path d={fillD} fill="url(#graphFill)" />
                      <path d={pathD} fill="none" stroke="url(#graphLine)" strokeWidth="2" strokeLinecap="round" />
                      {/* 현재 위치 */}
                      <circle cx={curX} cy={curY} r="5" fill="#8B5E83" stroke="white" strokeWidth="2" />
                      <line x1={curX} y1={curY} x2={curX} y2="95" stroke="rgba(139,94,131,0.3)" strokeWidth="1" strokeDasharray="3 2" />
                      {/* 현재 수익 레이블 — 만원 단위 반올림 표기 */}
                      <rect x={Math.min(curX - 32, 236)} y={curY - 22} width="74" height="18" rx="5" fill="#8B5E83" />
                      <text x={Math.min(curX + 5, 273)} y={curY - 10} textAnchor="middle" fontSize="9.5" fill="white" fontWeight="700">
                        {Math.round(curInc / 10000).toLocaleString()}만원
                      </text>
                    </>
                  );
                })()}

                {/* X축 레이블 */}
                {[0, 10, 20, 30, 40, 50].map((n) => (
                  <text key={n} x={30 + (n / 50) * 260} y="110" textAnchor="middle" fontSize="10" fill="#8A7A7A">{n}명</text>
                ))}

                {/* Y축 레이블 */}
                <text x="28" y="14" textAnchor="end" fontSize="9" fill="#8A7A7A">고</text>
                <text x="28" y="98" textAnchor="end" fontSize="9" fill="#8A7A7A">저</text>
              </svg>
            </div>

            {/* 슬라이더 — 직접 추천 (손잡이 깜빡임으로 조작 가능함을 안내, 별도 캡션 텍스트 제거) */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#3D2B2B' }}>직접 추천 고객</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#C8956C' }}>{sliderDirect}명</span>
              </div>
              <input
                type="range" min="0" max="50" step="1" value={sliderDirect}
                onChange={e => setSliderDirect(Number(e.target.value))}
                className="pulse-slider pulse-slider--direct"
                style={{ width: '100%', accentColor: '#C8956C', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                <span style={{ fontSize: 10.5, color: '#8A7A7A' }}>0명</span>
                <span style={{ fontSize: 10.5, color: '#8A7A7A' }}>50명</span>
              </div>
            </div>

            {/* 슬라이더 — 파트너당 고객 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#3D2B2B' }}>파트너당 평균 고객</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#8B5E83' }}>{sliderOverride}명</span>
              </div>
              <input
                type="range" min="0" max="50" step="1" value={sliderOverride}
                onChange={e => setSliderOverride(Number(e.target.value))}
                className="pulse-slider pulse-slider--override"
                style={{ width: '100%', accentColor: '#8B5E83', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                <span style={{ fontSize: 10.5, color: '#8A7A7A' }}>0명</span>
                <span style={{ fontSize: 10.5, color: '#8A7A7A' }}>50명</span>
              </div>
            </div>

            {/* 슬라이더 손잡이 깜빡임 애니메이션 — "슬라이더로 조절하세요" 캡션 텍스트 대체.
                네이티브 range input의 thumb는 인라인 style로 꾸밀 수 없어 컴포넌트
                스코프 style 태그로 처리 (className으로 연결) */}
            <style>{`
              @keyframes pulseThumb {
                0%, 100% { box-shadow: 0 0 0 0 rgba(200,149,108,0.55); }
                50% { box-shadow: 0 0 0 7px rgba(200,149,108,0); }
              }
              @keyframes pulseThumbOverride {
                0%, 100% { box-shadow: 0 0 0 0 rgba(139,94,131,0.55); }
                50% { box-shadow: 0 0 0 7px rgba(139,94,131,0); }
              }
              .pulse-slider--direct::-webkit-slider-thumb {
                -webkit-appearance: none; appearance: none;
                width: 18px; height: 18px; border-radius: 50%;
                background: #C8956C; border: 2px solid #fff; cursor: pointer;
                animation: pulseThumb 1.8s ease-out infinite;
              }
              .pulse-slider--direct::-moz-range-thumb {
                width: 18px; height: 18px; border-radius: 50%;
                background: #C8956C; border: 2px solid #fff; cursor: pointer;
                animation: pulseThumb 1.8s ease-out infinite;
              }
              .pulse-slider--override::-webkit-slider-thumb {
                -webkit-appearance: none; appearance: none;
                width: 18px; height: 18px; border-radius: 50%;
                background: #8B5E83; border: 2px solid #fff; cursor: pointer;
                animation: pulseThumbOverride 1.8s ease-out infinite;
              }
              .pulse-slider--override::-moz-range-thumb {
                width: 18px; height: 18px; border-radius: 50%;
                background: #8B5E83; border: 2px solid #fff; cursor: pointer;
                animation: pulseThumbOverride 1.8s ease-out infinite;
              }
            `}</style>

            {/* 수익 분해 요약 */}
            <div style={{ marginTop: 16, padding: '12px', background: 'rgba(253,250,246,0.8)', borderRadius: 12, border: '0.5px solid rgba(200,149,108,0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12.5, color: '#7A6060' }}>직접 추천 수익</span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: '#C8956C' }}>{(sliderDirect * DIRECT_RATE).toLocaleString()}원</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12.5, color: '#7A6060' }}>오버라이딩 수익</span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: '#8B5E83' }}>{(sliderDirect * sliderOverride * OVERRIDE_RATE).toLocaleString()}원</span>
              </div>
              <div style={{ height: '0.5px', background: 'rgba(200,149,108,0.2)', margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#3D2B2B' }}>예상 합계</span>
                <span style={{ fontSize: 14, fontWeight: 900, color: '#3D2B2B' }}>{graphIncome.toLocaleString()}원</span>
              </div>
            </div>
          </div>
        </div>

        {/* 공유 스크립트 */}
        <div style={{ margin: '0 20px 16px', background: 'rgba(255,255,255,0.8)', borderRadius: 20, border: '0.5px solid rgba(200,149,108,0.15)', backdropFilter: 'blur(12px)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 12px', borderBottom: '0.5px solid rgba(200,149,108,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Share2 size={15} color="#C8956C" />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#3D2B2B' }}>친구 초대 스크립트</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: '#7A6060' }}>추천코드 자동 포함</span>
            </div>
          </div>

          <div style={{ padding: '16px 20px' }}>
            {/* 탭 */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {[{ id: 'friend', label: '친구용' }, { id: 'menopause', label: '갱년기 공감형' }, { id: 'free', label: '구독료 0원형' }].map(t => (
                <button key={t.id} onClick={() => setScriptTab(t.id)}
                  style={{ flex: 1, padding: '7px 0', borderRadius: 10, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                    background: scriptTab === t.id ? 'linear-gradient(135deg, #C8956C, #8B5E83)' : 'rgba(200,149,108,0.08)',
                    color: scriptTab === t.id ? '#fff' : '#7A6060' }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* 스크립트 미리보기 */}
            <div style={{ background: '#FEF9E7', border: '1px solid rgba(254,229,0,0.3)', borderRadius: 16, padding: '14px 16px', marginBottom: 12 }}>
              <p style={{ fontSize: 13, color: '#3C3C3C', lineHeight: 1.8, whiteSpace: 'pre-line', margin: 0 }}>
                {getScript(scriptTab)}
              </p>
            </div>

            {/* 버튼 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button onClick={handleCopyScript}
                style={{ padding: '13px 0', borderRadius: 14, fontSize: 13, fontWeight: 700, border: scriptCopied ? '1px solid rgba(125,191,168,0.4)' : '1px solid rgba(200,149,108,0.25)', background: scriptCopied ? 'rgba(125,191,168,0.1)' : 'rgba(200,149,108,0.08)', color: scriptCopied ? '#5DA898' : '#C8956C', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s' }}>
                {scriptCopied ? <Check size={14} /> : <Copy size={14} />}
                {scriptCopied ? '복사됨!' : '전체 복사'}
              </button>
              <button onClick={handleKakaoShare}
                style={{ padding: '13px 0', borderRadius: 14, fontSize: 13, fontWeight: 700, border: '1px solid rgba(254,229,0,0.4)', background: '#FEE500', color: '#3C1E1E', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#3C1E1E">
                  <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.632 1.608 4.938 4 6.322V21l3.5-2.1A11.5 11.5 0 0012 19c5.523 0 10-3.477 10-7.5S17.523 3 12 3z" />
                </svg>
                카카오 공유
              </button>
            </div>
          </div>
        </div>

        {/* 안내 */}
        <div style={{ margin: '0 20px', padding: '12px 16px', background: 'rgba(255,255,255,0.5)', borderRadius: 14, border: '0.5px solid rgba(200,149,108,0.12)' }}>
          <p style={{ fontSize: 12.5, color: '#7A6060', lineHeight: 1.7, margin: 0 }}>
            💡 수익은 매월 말 정산 후 익월 10일 입금됩니다.<br />
            구독고객 수는 실시간 자동 반영됩니다.
          </p>
        </div>
      </div>

      {/* 축하 모달 */}
      {showCelebModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setShowCelebModal(false)}>
          <div style={{ background: '#FDFAF6', borderRadius: 24, overflow: 'hidden', width: '100%', maxWidth: 340 }} onClick={e => e.stopPropagation()}>
            <div style={{ background: 'linear-gradient(135deg, #C8956C, #8B5E83)', padding: '28px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 52, marginBottom: 8 }}>{celebType === 'free_sub' ? '🎉' : '⭐'}</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 6 }}>
                {celebType === 'free_sub' ? '구독료 0원 달성!' : '첫 파트너 탄생!'}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>
                {celebType === 'free_sub'
                  ? '2명 이상이 유료 전환했어요!\n이번 달 구독료가 상쇄됩니다 🙌'
                  : '내 추천으로 첫 번째 유료 구독자가 생겼어요!\n계속 초대하면 수익이 쌓입니다 💪'}
              </div>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(200,149,108,0.08)', borderRadius: 14, marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: '#9A8080', marginBottom: 4 }}>이번달 예상 수익</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#C8956C', letterSpacing: '-1px' }}>{totalMonthly.toLocaleString()}원</div>
              </div>
              <button onClick={() => setShowCelebModal(false)}
                style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #C8956C, #8B5E83)', color: '#fff', fontWeight: 800, fontSize: 14, border: 'none', borderRadius: 14, cursor: 'pointer' }}>
                계속 초대하기 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 토스트 */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)', background: 'rgba(61,43,43,0.9)', color: '#fff', fontSize: 13, fontWeight: 600, padding: '12px 24px', borderRadius: 24, zIndex: 300, whiteSpace: 'nowrap', backdropFilter: 'blur(8px)' }}>
          {toast}
        </div>
      )}
    </div>
  );
}
