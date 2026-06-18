// src/pages/PartnerDashboard.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useApp } from '../context/AppContext';
import { ChevronLeft, Copy, Check, Share2, TrendingUp, Users, Target, Award, Bell } from 'lucide-react';

const DIRECT_RATE = 14950;
const OVERRIDE_RATE = 2990;
const SUB_PRICE = 59800;
const BASE_URL = 'https://wellfit-checkup.co.kr';

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
          setGoalInput(String(d.goalAmount || ''));
        }
      } catch (e) { console.warn(e); }
      finally { setLoading(false); }
    })();
  }, [user, navigate]);

  // 파트너 카운팅
  useEffect(() => {
    if (!user || user.isGuest || !myReferralCode) return;
    (async () => {
      try {
        const allQ = query(collection(db, 'users'), where('referredBy', '==', myReferralCode));
        const allSnap = await getDocs(allQ);
        const allUsers = allSnap.docs;
        const paid = allUsers.filter(d => d.data().subscriptionStatus === 'paid');
        const trial = allUsers.filter(d => d.data().subscriptionStatus === 'free_trial');
        setPaidCount(paid.length);
        setTrialCount(trial.length);

        // 첫 유료 전환 축하
        if (paid.length === 1 && trial.length === 0) {
          setCelebType('first_paid'); setShowCelebModal(true);
        }
        // 구독료 0원 달성 (2명 이상)
        if (paid.length >= 2 && paid.length === allUsers.length) {
          setCelebType('free_sub'); setShowCelebModal(true);
        }

        let over = 0;
        await Promise.all(paid.map(async (d) => {
          const theirCode = d.data().myReferralCode;
          if (!theirCode) return;
          const overQ = query(collection(db, 'users'), where('referredBy', '==', theirCode), where('subscriptionStatus', '==', 'paid'));
          const overSnap = await getDocs(overQ);
          over += overSnap.size;
        }));
        setOverrideCount(over);
      } catch (e) { console.warn(e); }
    })();
  }, [user, myReferralCode]);

  // 수익 계산
  const directIncome = paidCount * DIRECT_RATE;
  const overrideIncome = overrideCount * OVERRIDE_RATE;
  const totalMonthly = directIncome + overrideIncome;
  const grade = getGrade(paidCount);

  // 목표 저장
  const handleSaveGoal = async () => {
    const val = parseInt(goalInput.replace(/,/g, '')) || 0;
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
          <div style={{ fontSize: 11, fontWeight: 700, color: grade.color, background: grade.bg, padding: '4px 10px', borderRadius: 20, letterSpacing: '0.5px' }}>
            {grade.icon} {grade.label}
          </div>
        </div>

        {/* 히어로 — 이번달 수익 */}
        <div style={{ margin: '16px 20px', borderRadius: 24, overflow: 'hidden', position: 'relative' }}>
          <div style={{ background: 'linear-gradient(135deg, #3D2B2B 0%, #5A3A6B 50%, #2B3D3A 100%)', padding: '28px 24px 24px', position: 'relative' }}>
            {/* 배경 패턴 */}
            <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(200,149,108,0.08)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: -20, left: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(139,94,131,0.08)', pointerEvents: 'none' }} />

            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '1.5px', marginBottom: 6, textTransform: 'uppercase' }}>Partner Dashboard</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 4 }}>이번달 예상 수익</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 20 }}>
              <span style={{ fontSize: 44, fontWeight: 900, color: '#fff', letterSpacing: '-2px', lineHeight: 1 }}>
                {totalMonthly.toLocaleString()}
              </span>
              <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>원</span>
            </div>

            {/* 수익 분해 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { label: '직접 추천', value: directIncome.toLocaleString() + '원', sub: `${paidCount}명 유료`, color: '#C8956C' },
                { label: '오버라이딩', value: overrideIncome.toLocaleString() + '원', sub: `${overrideCount}명`, color: '#8B5E83' },
                { label: '누적 수익', value: totalEarnings.toLocaleString() + '원', sub: '총합', color: '#7DBFA8' },
              ].map((item) => (
                <div key={item.label} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: '10px 8px', textAlign: 'center', border: '0.5px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', marginBottom: 4, letterSpacing: '0.5px' }}>{item.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: item.color, letterSpacing: '-0.3px' }}>{item.value}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{item.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 목표 진행률 */}
          <div style={{ background: 'rgba(253,250,246,0.95)', padding: '14px 20px', borderTop: '0.5px solid rgba(200,149,108,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Target size={13} color="#C8956C" />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#3D2B2B' }}>이번달 목표</span>
              </div>
              {editingGoal ? (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input
                    type="number"
                    value={goalInput}
                    onChange={e => setGoalInput(e.target.value)}
                    placeholder="목표 금액"
                    style={{ width: 110, padding: '4px 8px', borderRadius: 8, border: '1px solid rgba(200,149,108,0.4)', fontSize: 12, color: '#3D2B2B', background: 'white', outline: 'none' }}
                    autoFocus
                  />
                  <button onClick={handleSaveGoal} style={{ padding: '4px 10px', borderRadius: 8, background: '#C8956C', color: '#fff', fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer' }}>저장</button>
                </div>
              ) : (
                <button onClick={() => setEditingGoal(true)} style={{ fontSize: 11, color: '#C8956C', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
                  {goalAmount > 0 ? `${goalAmount.toLocaleString()}원 ✏️` : '목표 설정하기 +'}
                </button>
              )}
            </div>
            {goalAmount > 0 && (
              <>
                <div style={{ height: 6, borderRadius: 4, background: 'rgba(200,149,108,0.12)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg, #C8956C, #8B5E83)', width: `${goalProgress}%`, transition: 'width 0.8s cubic-bezier(0.22,1,0.36,1)' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                  <span style={{ fontSize: 10, color: '#9A8080' }}>{Math.round(goalProgress)}% 달성</span>
                  <span style={{ fontSize: 10, color: '#C8956C', fontWeight: 700 }}>
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
              <span style={{ marginLeft: 'auto', fontSize: 10, color: '#9A8080' }}>실시간 자동 반영</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0 }}>
            {[
              { label: '유료 구독고객', value: paidCount, unit: '명', sub: '수익 발생 중', color: '#C8956C', bg: 'rgba(200,149,108,0.06)' },
              { label: '무료 체험 중', value: trialCount, unit: '명', sub: `전환 시 +${(trialCount * DIRECT_RATE).toLocaleString()}원`, color: '#7DBFA8', bg: 'rgba(125,191,168,0.06)' },
              { label: '파트너 고객', value: overrideCount, unit: '명', sub: '오버라이딩', color: '#8B5E83', bg: 'rgba(139,94,131,0.06)' },
            ].map((item, i) => (
              <div key={item.label} style={{ padding: '16px 12px', textAlign: 'center', background: item.bg, borderRight: i < 2 ? '0.5px solid rgba(200,149,108,0.1)' : 'none' }}>
                <div style={{ fontSize: 10, color: '#9A8080', marginBottom: 6, lineHeight: 1.4 }}>{item.label}</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: item.color, lineHeight: 1, letterSpacing: '-1px' }}>
                  {item.value}<span style={{ fontSize: 13, fontWeight: 600, color: '#9A8080' }}>{item.unit}</span>
                </div>
                <div style={{ fontSize: 9, color: item.color, marginTop: 5, fontWeight: 600, lineHeight: 1.4 }}>{item.sub}</div>
              </div>
            ))}
          </div>

          {/* 내 추천코드 */}
          <div style={{ padding: '14px 20px', borderTop: '0.5px solid rgba(200,149,108,0.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: '#9A8080', marginBottom: 3 }}>내 추천 링크</div>
              <div style={{ fontSize: 11, color: '#7A6060', wordBreak: 'break-all', lineHeight: 1.5 }}>
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
              <span style={{ marginLeft: 'auto', fontSize: 10, color: '#9A8080' }}>슬라이더로 조절하세요</span>
            </div>
          </div>

          <div style={{ padding: '20px' }}>
            {/* 예상 수익 표시 */}
            <div style={{ textAlign: 'center', marginBottom: 20, padding: '16px', background: 'linear-gradient(135deg, rgba(200,149,108,0.08), rgba(139,94,131,0.08))', borderRadius: 16, border: '0.5px solid rgba(200,149,108,0.2)' }}>
              <div style={{ fontSize: 11, color: '#9A8080', marginBottom: 4 }}>예상 월 수익</div>
              <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-1.5px', background: 'linear-gradient(135deg, #C8956C, #8B5E83)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1 }}>
                {graphIncome.toLocaleString()}
              </div>
              <div style={{ fontSize: 13, color: '#9A8080', marginTop: 2 }}>원 / 월</div>
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
                  const maxIncome = 20 * DIRECT_RATE + 20 * 10 * OVERRIDE_RATE;
                  const points = Array.from({ length: 11 }, (_, i) => {
                    const d = i * 2;
                    const inc = d * DIRECT_RATE + d * sliderOverride * OVERRIDE_RATE;
                    const x = 30 + (i / 10) * 260;
                    const y = 95 - (inc / maxIncome) * 80;
                    return `${x},${y}`;
                  });
                  const pathD = `M${points[0]} Q${points[2]} ${points[3]} T${points[5]} T${points[7]} T${points[9]} T${points[10]}`;
                  const fillD = pathD + ` L290,95 L30,95 Z`;
                  const curX = 30 + (sliderDirect / 20) * 260;
                  const curInc = sliderDirect * DIRECT_RATE + sliderDirect * sliderOverride * OVERRIDE_RATE;
                  const curY = 95 - (curInc / maxIncome) * 80;
                  return (
                    <>
                      <path d={fillD} fill="url(#graphFill)" />
                      <path d={pathD} fill="none" stroke="url(#graphLine)" strokeWidth="2" strokeLinecap="round" />
                      {/* 현재 위치 */}
                      <circle cx={curX} cy={curY} r="5" fill="#8B5E83" stroke="white" strokeWidth="2" />
                      <line x1={curX} y1={curY} x2={curX} y2="95" stroke="rgba(139,94,131,0.3)" strokeWidth="1" strokeDasharray="3 2" />
                      {/* 현재 수익 레이블 */}
                      <rect x={Math.min(curX - 30, 240)} y={curY - 22} width="70" height="18" rx="5" fill="#8B5E83" />
                      <text x={Math.min(curX + 5, 275)} y={curY - 10} textAnchor="middle" fontSize="9" fill="white" fontWeight="700">
                        {curInc >= 1000000 ? `${(curInc / 1000000).toFixed(1)}M` : `${Math.round(curInc / 1000)}K`}원
                      </text>
                    </>
                  );
                })()}

                {/* X축 레이블 */}
                {[0, 5, 10, 15, 20].map((n) => (
                  <text key={n} x={30 + (n / 20) * 260} y="110" textAnchor="middle" fontSize="9" fill="#B0A0A0">{n}명</text>
                ))}

                {/* Y축 레이블 */}
                <text x="28" y="14" textAnchor="end" fontSize="8" fill="#B0A0A0">고</text>
                <text x="28" y="98" textAnchor="end" fontSize="8" fill="#B0A0A0">저</text>
              </svg>
            </div>

            {/* 슬라이더 — 직접 추천 */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#3D2B2B' }}>직접 추천 고객</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#C8956C' }}>{sliderDirect}명</span>
              </div>
              <input
                type="range" min="0" max="20" step="1" value={sliderDirect}
                onChange={e => setSliderDirect(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#C8956C', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                <span style={{ fontSize: 9, color: '#B0A0A0' }}>0명</span>
                <span style={{ fontSize: 9, color: '#C8956C', fontWeight: 600 }}>월 {(sliderDirect * DIRECT_RATE).toLocaleString()}원</span>
                <span style={{ fontSize: 9, color: '#B0A0A0' }}>20명</span>
              </div>
            </div>

            {/* 슬라이더 — 파트너당 고객 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#3D2B2B' }}>파트너당 평균 고객</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#8B5E83' }}>{sliderOverride}명</span>
              </div>
              <input
                type="range" min="0" max="10" step="1" value={sliderOverride}
                onChange={e => setSliderOverride(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#8B5E83', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                <span style={{ fontSize: 9, color: '#B0A0A0' }}>0명</span>
                <span style={{ fontSize: 9, color: '#8B5E83', fontWeight: 600 }}>오버라이딩 {(sliderDirect * sliderOverride * OVERRIDE_RATE).toLocaleString()}원</span>
                <span style={{ fontSize: 9, color: '#B0A0A0' }}>10명</span>
              </div>
            </div>

            {/* 수익 분해 요약 */}
            <div style={{ marginTop: 16, padding: '12px', background: 'rgba(253,250,246,0.8)', borderRadius: 12, border: '0.5px solid rgba(200,149,108,0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: '#9A8080' }}>직접 추천 수익</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#C8956C' }}>{(sliderDirect * DIRECT_RATE).toLocaleString()}원</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: '#9A8080' }}>오버라이딩 수익</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#8B5E83' }}>{(sliderDirect * sliderOverride * OVERRIDE_RATE).toLocaleString()}원</span>
              </div>
              <div style={{ height: '0.5px', background: 'rgba(200,149,108,0.2)', margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#3D2B2B' }}>예상 합계</span>
                <span style={{ fontSize: 13, fontWeight: 900, color: '#3D2B2B' }}>{graphIncome.toLocaleString()}원</span>
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
              <span style={{ marginLeft: 'auto', fontSize: 10, color: '#9A8080' }}>추천코드 자동 포함</span>
            </div>
          </div>

          <div style={{ padding: '16px 20px' }}>
            {/* 탭 */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {[{ id: 'friend', label: '친구용' }, { id: 'menopause', label: '갱년기 공감형' }, { id: 'free', label: '구독료 0원형' }].map(t => (
                <button key={t.id} onClick={() => setScriptTab(t.id)}
                  style={{ flex: 1, padding: '7px 0', borderRadius: 10, fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                    background: scriptTab === t.id ? 'linear-gradient(135deg, #C8956C, #8B5E83)' : 'rgba(200,149,108,0.08)',
                    color: scriptTab === t.id ? '#fff' : '#9A8080' }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* 스크립트 미리보기 */}
            <div style={{ background: '#FEF9E7', border: '1px solid rgba(254,229,0,0.3)', borderRadius: 16, padding: '14px 16px', marginBottom: 12 }}>
              <p style={{ fontSize: 12, color: '#3C3C3C', lineHeight: 1.8, whiteSpace: 'pre-line', margin: 0 }}>
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
          <p style={{ fontSize: 11, color: '#9A8080', lineHeight: 1.7, margin: 0 }}>
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
