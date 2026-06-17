// src/pages/MyPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { useApp } from '../context/AppContext';
import { ChevronLeft, LogOut, Copy, Check } from 'lucide-react';

const BASE_URL = 'https://korahnchild-cmd.github.io/wellfit-app';

// 28일 플랜 (generateReport.js와 동일)
const ALL_DAYS = [
  { d:1,  cat:'수면', emoji:'🌙', task:'취침 시간 고정: 밤 11시 목표. 스마트폰은 침대 밖에' },
  { d:2,  cat:'식단', emoji:'🥗', task:'아침 식사 시작: 견과류 한 줌 + 바나나' },
  { d:3,  cat:'운동', emoji:'🚶', task:'점심 후 10분 걷기 — 습관의 씨앗 심기' },
  { d:4,  cat:'수분', emoji:'💧', task:'물 하루 6잔 목표. 알람 설정으로 리마인드' },
  { d:5,  cat:'마음', emoji:'🧘', task:'취침 전 복식 호흡 3분 (4-7-8 호흡법)' },
  { d:6,  cat:'식단', emoji:'🥦', task:'저녁 식사에 채소 1가지 추가하기' },
  { d:7,  cat:'점검', emoji:'✅', task:'1주차 실천 체크: 잘 된 것 3가지 메모' },
  { d:8,  cat:'영양', emoji:'☀️', task:'영양제 시작: 식후 복용' },
  { d:9,  cat:'식단', emoji:'🐟', task:'등 푸른 생선(고등어·연어) 섭취 — 오메가3·비타민D' },
  { d:10, cat:'영양', emoji:'💪', task:'마그네슘 취침 전 복용 시작 — 수면 질 개선' },
  { d:11, cat:'식단', emoji:'🥚', task:'달걀 하루 1~2개: 단백질 + 영양소 보충' },
  { d:12, cat:'운동', emoji:'🏋️', task:'가벼운 근력 운동: 스쿼트·푸시업 각 10회 3세트' },
  { d:13, cat:'수면', emoji:'🌙', task:'수면 퀄리티 체크: 기상 시 개운함 점수 매기기' },
  { d:14, cat:'점검', emoji:'📊', task:'2주차 영양 보충 상태 확인, 몸 상태 기록' },
  { d:15, cat:'운동', emoji:'🚶', task:'유산소 30분: 빠르게 걷기 또는 자전거' },
  { d:16, cat:'운동', emoji:'💪', task:'근력 운동: 상체 집중 (어깨·팔·등)' },
  { d:17, cat:'식단', emoji:'🥩', task:'단백질 섭취량 체크: 체중(kg) × 1.2g 목표' },
  { d:18, cat:'운동', emoji:'🤸', task:'스트레칭 20분: 유연성 확보 + 부상 예방' },
  { d:19, cat:'마음', emoji:'🧘', task:'명상 5분: 마보·코끼리 앱 활용' },
  { d:20, cat:'운동', emoji:'🏃', task:'유산소 30분 + 핵심 운동(플랭크·데드버그) 추가' },
  { d:21, cat:'점검', emoji:'📏', task:'3주차 체중·체지방 측정, 운동 강도 조정' },
  { d:22, cat:'영양', emoji:'💊', task:'영양제 복용 루틴 점검: 빠진 날 없이 복용 확인' },
  { d:23, cat:'수면', emoji:'🌙', task:'수면 패턴 분석: 입면 시간·기상 시간 기록' },
  { d:24, cat:'식단', emoji:'🥗', task:'이달의 식단 돌아보기: 잘 먹은 날 vs 부족한 날' },
  { d:25, cat:'운동', emoji:'🏋️', task:'4주 운동 성과 체크: 횟수 늘었나? 강도 높이기' },
  { d:26, cat:'마음', emoji:'😊', task:'스트레스 지수 셀프 체크 (1~10점)' },
  { d:27, cat:'생활', emoji:'🌿', task:'다음 달 목표 설정: 가장 개선된 항목 유지, 부족한 항목 보완' },
  { d:28, cat:'점검', emoji:'🎉', task:'4주 완료! 웰핏+ 재검사로 건강나이 변화 확인' },
];

const CAT_COLORS = {
  수면: '#8B5E83', 식단: '#7DBFA8', 운동: '#C8956C',
  수분: '#5DA8C8', 마음: '#A87898', 영양: '#9B6FA8',
  점검: '#3D2B2B', 수분: '#5DA8C8', 생활: '#7DBFA8',
};

export default function MyPage() {
  const navigate = useNavigate();
  const { user, myReferralCode } = useApp();

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({});
  const [referredBy, setReferredBy] = useState(null);
  const [refCode, setRefCode] = useState('');
  const [savingRef, setSavingRef] = useState(false);
  const [latestReport, setLatestReport] = useState(null);
  const [dayCount, setDayCount] = useState(0);
  const [isPaid, setIsPaid] = useState(false);

  // 프로필 편집
  const [editName, setEditName] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editCity, setEditCity] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    if (!user || user.isGuest) { navigate('/login'); return; }
    (async () => {
      try {
        // 유저 기본 정보
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const d = snap.data();
          setUserData(d);
          setReferredBy(d.referredBy || null);
          setIsPaid(d.subscriptionStatus === 'paid');
          setEditName(d.userName || d.displayName || '');
          setEditGender(d.gender || '');
          setEditAge(d.age ? String(d.age) : '');
          setEditCity(d.userCity || '');

          // Day 카운트 계산
          const startDate = d.trialStartDate?.toDate?.() || new Date(d.trialStartDate || d.createdAt);
          const diff = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          setDayCount(Math.max(1, diff + 1));
        }

        // 최근 분석 리포트
        const rq = query(
          collection(db, 'reports'),
          where('userId', '==', user.uid),
          orderBy('timestamp', 'desc'),
          limit(1)
        );
        const rSnap = await getDocs(rq);
        if (!rSnap.empty) {
          setLatestReport(rSnap.docs[0].data().reportData);
        }
      } catch (e) { console.warn(e); }
      finally { setLoading(false); }
    })();
  }, [user, navigate]);

  // 프로필 저장
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        userName: editName.trim(),
        gender: editGender,
        age: parseInt(editAge) || 0,
        userCity: editCity.trim(),
      });
      showToast('프로필이 저장되었습니다 ✓');
    } catch { showToast('저장 중 오류가 발생했습니다'); }
    finally { setSavingProfile(false); }
  };

  // 추천코드 저장
  const handleSaveRef = async () => {
    if (!refCode.trim()) return;
    setSavingRef(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { referredBy: refCode.trim() });
      setReferredBy(refCode.trim());
      showToast('추천코드가 등록되었습니다 ✓');
    } catch { showToast('저장 중 오류가 발생했습니다'); }
    finally { setSavingRef(false); }
  };

  // 로그아웃
  const handleLogout = async () => {
    try { await signOut(auth); navigate('/'); }
    catch { showToast('로그아웃 중 오류가 발생했습니다'); }
  };

  // 링크 복사
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${BASE_URL}/?ref=${myReferralCode}`);
      setCopied(true); showToast('추천 링크 복사됨 ✓');
      setTimeout(() => setCopied(false), 2000);
    } catch { showToast('복사 실패'); }
  };

  // 오늘의 플랜
  const todayPlan = (() => {
    const maxDay = isPaid ? 28 : 14;
    const d = Math.min(dayCount, maxDay);
    return ALL_DAYS.find(p => p.d === d) || ALL_DAYS[0];
  })();

  // 전날·다음날
  const prevPlan = ALL_DAYS.find(p => p.d === Math.max(1, Math.min(dayCount - 1, isPaid ? 28 : 14)));
  const nextPlan = ALL_DAYS.find(p => p.d === Math.min(Math.min(dayCount + 1, isPaid ? 28 : 14), 28));

  // 건강 기록 요약
  const topHormones = (() => {
    if (!latestReport?.hormones) return [];
    return Object.entries(latestReport.hormones)
      .filter(([k, v]) => typeof v === 'number' && !k.includes('Comment'))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([k, v]) => {
        const labels = {
          estrogen: '에스트로겐', cortisol: '코르티솔', insulin: '인슐린 저항성',
          thyroid: '갑상선', dhea: 'DHEA', progesterone: '프로게스테론',
          testosterone: '테스토스테론', growthHormone: '성장호르몬',
        };
        return { name: labels[k] || k, value: v };
      });
  })();

  const topNutrients = (() => {
    if (!latestReport?.nutrients) return [];
    return Object.entries(latestReport.nutrients)
      .filter(([k, v]) => typeof v === 'number' && !k.includes('Comment'))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([k, v]) => {
        const labels = {
          vitaminD: '비타민D', vitaminB12: '비타민B12', iron: '철분',
          zinc: '아연', magnesium: '마그네슘', omega3: '오메가3',
          calcium: '칼슘', vitaminC: '비타민C',
        };
        return { name: labels[k] || k, value: v };
      });
  })();

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#FDFAF6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner-rose" />
    </div>
  );

  const s = (obj) => Object.assign({}, obj);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #FDFAF6 0%, #F8F0FA 60%, #F0FAF6 100%)', fontFamily: 'Pretendard, -apple-system, sans-serif' }}>
      {/* 배경 장식 */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,149,108,0.1) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,94,131,0.08) 0%, transparent 70%)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 430, margin: '0 auto', paddingBottom: 100 }}>

        {/* 헤더 */}
        <div style={{ padding: '52px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: '#9A8080', fontSize: 13, cursor: 'pointer' }}>
            <ChevronLeft size={16} /> 돌아가기
          </button>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: '#9A8080', fontSize: 13, cursor: 'pointer' }}>
            <LogOut size={14} /> 로그아웃
          </button>
        </div>

        {/* ── 히어로 — Day 카운터 ── */}
        <div style={{ margin: '16px 20px', borderRadius: 24, background: 'linear-gradient(135deg, #3D2B2B 0%, #5A3A6B 50%, #2B3D3A 100%)', padding: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(200,149,108,0.08)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -20, left: 20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(125,191,168,0.08)', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', letterSpacing: '1.5px', marginBottom: 6, textTransform: 'uppercase' }}>
                {isPaid ? '유료 구독 중' : '무료 체험 중'}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 64, fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-3px' }}>{Math.min(dayCount, isPaid ? 28 : 14)}</span>
                <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>일째</span>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                {isPaid ? '4주 건강 실천 플랜' : '14일 건강 가이드'}
              </div>
            </div>

            {/* 원형 진행률 */}
            <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
              <svg viewBox="0 0 72 72" style={{ width: 72, height: 72, transform: 'rotate(-90deg)' }}>
                <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="5" />
                <circle cx="36" cy="36" r="30" fill="none" stroke="url(#progGrad)" strokeWidth="5"
                  strokeDasharray={`${2 * Math.PI * 30}`}
                  strokeDashoffset={`${2 * Math.PI * 30 * (1 - Math.min(dayCount, isPaid ? 28 : 14) / (isPaid ? 28 : 14))}`}
                  strokeLinecap="round" />
                <defs>
                  <linearGradient id="progGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#C8956C" />
                    <stop offset="100%" stopColor="#7DBFA8" />
                  </linearGradient>
                </defs>
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff' }}>
                {Math.round((Math.min(dayCount, isPaid ? 28 : 14) / (isPaid ? 28 : 14)) * 100)}%
              </div>
            </div>
          </div>

          {/* 최근 건강나이 */}
          {latestReport?.healthAge && (
            <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(255,255,255,0.08)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '0.5px solid rgba(255,255,255,0.12)' }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>AI 건강나이</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 22, fontWeight: 900, color: '#C8956C', letterSpacing: '-0.5px' }}>{latestReport.healthAge}</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>세</span>
                {userData.age && (
                  <span style={{ fontSize: 11, color: latestReport.healthAge < userData.age ? '#7DBFA8' : '#F59E0B', fontWeight: 700, marginLeft: 6 }}>
                    {latestReport.healthAge < userData.age ? `▼ ${userData.age - latestReport.healthAge}세 젊음` : `▲ ${latestReport.healthAge - userData.age}세 높음`}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── 오늘의 건강 가이드 ── */}
        <div style={{ margin: '0 20px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9A8080', letterSpacing: '1px', marginBottom: 10, paddingLeft: 2 }}>TODAY'S PLAN</div>

          {/* 어제 */}
          {dayCount > 1 && prevPlan && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.4)', borderRadius: 14, marginBottom: 6, opacity: 0.6 }}>
              <div style={{ fontSize: 18, flexShrink: 0 }}>{prevPlan.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 9, color: '#B0A0A0', marginBottom: 2 }}>DAY {prevPlan.d} · {prevPlan.cat}</div>
                <div style={{ fontSize: 12, color: '#7A6060', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prevPlan.task}</div>
              </div>
              <div style={{ fontSize: 10, color: '#7DBFA8', fontWeight: 700, flexShrink: 0 }}>완료 ✓</div>
            </div>
          )}

          {/* 오늘 (메인) */}
          <div style={{ background: 'rgba(255,255,255,0.85)', borderRadius: 20, border: `1.5px solid ${CAT_COLORS[todayPlan.cat] || '#C8956C'}30`, backdropFilter: 'blur(12px)', overflow: 'hidden', boxShadow: `0 4px 24px ${CAT_COLORS[todayPlan.cat] || '#C8956C'}18` }}>
            <div style={{ background: `linear-gradient(135deg, ${CAT_COLORS[todayPlan.cat] || '#C8956C'}15, ${CAT_COLORS[todayPlan.cat] || '#C8956C'}05)`, padding: '16px 18px', borderBottom: `0.5px solid ${CAT_COLORS[todayPlan.cat] || '#C8956C'}20` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: CAT_COLORS[todayPlan.cat] || '#C8956C', boxShadow: `0 0 8px ${CAT_COLORS[todayPlan.cat] || '#C8956C'}60` }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: CAT_COLORS[todayPlan.cat] || '#C8956C', letterSpacing: '1px' }}>DAY {todayPlan.d} · {todayPlan.cat.toUpperCase()}</span>
                <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: '#fff', background: CAT_COLORS[todayPlan.cat] || '#C8956C', padding: '2px 8px', borderRadius: 10 }}>오늘</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ fontSize: 36, lineHeight: 1, flexShrink: 0 }}>{todayPlan.emoji}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#3D2B2B', lineHeight: 1.55 }}>{todayPlan.task}</div>
              </div>
            </div>

            {/* 무료 체험 유료 유도 (14일 이하, 무료 유저) */}
            {!isPaid && dayCount <= 14 && dayCount >= 7 && (
              <div style={{ padding: '12px 18px', background: 'linear-gradient(135deg, rgba(200,149,108,0.06), rgba(139,94,131,0.06))', borderBottom: '0.5px solid rgba(200,149,108,0.12)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#C8956C', marginBottom: 2 }}>
                      {14 - dayCount}일 후 체험 종료
                    </div>
                    <div style={{ fontSize: 10, color: '#9A8080' }}>유료 구독 시 4주 플랜 + 더 많은 기능</div>
                  </div>
                  <button onClick={() => navigate('/report')} style={{ padding: '7px 14px', borderRadius: 10, background: 'linear-gradient(135deg, #C8956C, #8B5E83)', color: '#fff', fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                    구독하기
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 내일 */}
          {nextPlan && nextPlan.d !== todayPlan.d && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.4)', borderRadius: 14, marginTop: 6, opacity: 0.5 }}>
              <div style={{ fontSize: 18, flexShrink: 0 }}>{nextPlan.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 9, color: '#B0A0A0', marginBottom: 2 }}>내일 · DAY {nextPlan.d} · {nextPlan.cat}</div>
                <div style={{ fontSize: 12, color: '#7A6060', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nextPlan.task}</div>
              </div>
            </div>
          )}
        </div>

        {/* ── 건강 기록 요약 ── */}
        {latestReport && (
          <div style={{ margin: '0 20px 16px', background: 'rgba(255,255,255,0.8)', borderRadius: 20, border: '0.5px solid rgba(200,149,108,0.15)', backdropFilter: 'blur(12px)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '0.5px solid rgba(200,149,108,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#3D2B2B' }}>최근 분석 요약</span>
              <button onClick={() => navigate('/report')} style={{ fontSize: 11, color: '#C8956C', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>리포트 보기 →</button>
            </div>

            <div style={{ padding: '14px 18px' }}>
              {/* 호르몬 Top 2 */}
              {topHormones.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, color: '#9A8080', fontWeight: 600, marginBottom: 8, letterSpacing: '0.5px' }}>⚗️ 호르몬 주의 항목</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {topHormones.map(h => (
                      <div key={h.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 12, color: '#5A4A4A', flex: 1 }}>{h.name}</span>
                        <div style={{ flex: 2, height: 5, borderRadius: 3, background: 'rgba(200,149,108,0.12)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 3, background: h.value >= 60 ? '#D4504A' : h.value >= 40 ? '#F59E0B' : '#7DBFA8', width: `${h.value}%`, transition: 'width 0.8s ease' }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: h.value >= 60 ? '#D4504A' : h.value >= 40 ? '#F59E0B' : '#7DBFA8', minWidth: 32, textAlign: 'right' }}>{h.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 영양소 Top 2 */}
              {topNutrients.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, color: '#9A8080', fontWeight: 600, marginBottom: 8, letterSpacing: '0.5px' }}>🔬 영양소 주의 항목</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {topNutrients.map(n => (
                      <div key={n.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 12, color: '#5A4A4A', flex: 1 }}>{n.name}</span>
                        <div style={{ flex: 2, height: 5, borderRadius: 3, background: 'rgba(139,94,131,0.12)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 3, background: n.value >= 60 ? '#D4504A' : n.value >= 40 ? '#F59E0B' : '#7DBFA8', width: `${n.value}%`, transition: 'width 0.8s ease' }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: n.value >= 60 ? '#D4504A' : n.value >= 40 ? '#F59E0B' : '#7DBFA8', minWidth: 32, textAlign: 'right' }}>{n.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 내 프로필 ── */}
        <div style={{ margin: '0 20px 16px', background: 'rgba(255,255,255,0.8)', borderRadius: 20, border: '0.5px solid rgba(200,149,108,0.15)', backdropFilter: 'blur(12px)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '0.5px solid rgba(200,149,108,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #C8956C, #8B5E83)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 16 }}>
                {(user.displayName || user.email || '?').slice(0, 1).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#3D2B2B' }}>{user.displayName || '사용자'}</div>
                <div style={{ fontSize: 11, color: '#9A8080' }}>{user.email}</div>
              </div>
            </div>
          </div>

          <div style={{ padding: '16px 18px' }}>
            {/* 이름 */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: '#9A8080', fontWeight: 600, marginBottom: 5, display: 'block' }}>이름 (리포트에 자동 반영)</label>
              <input type="text" value={editName} onChange={e => setEditName(e.target.value)} placeholder="이름 입력"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(200,149,108,0.25)', fontSize: 13, color: '#3D2B2B', background: 'rgba(253,250,246,0.8)', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            {/* 성별 */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: '#9A8080', fontWeight: 600, marginBottom: 5, display: 'block' }}>성별</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[{ val: 'female', label: '👩 여성' }, { val: 'male', label: '👨 남성' }].map(g => (
                  <button key={g.val} onClick={() => setEditGender(g.val)}
                    style={{ padding: '10px', borderRadius: 12, fontSize: 13, fontWeight: 700, border: `2px solid ${editGender === g.val ? (g.val === 'female' ? '#C8956C' : '#8B5E83') : 'rgba(200,149,108,0.2)'}`, background: editGender === g.val ? (g.val === 'female' ? 'rgba(200,149,108,0.1)' : 'rgba(139,94,131,0.1)') : 'rgba(253,250,246,0.8)', color: editGender === g.val ? (g.val === 'female' ? '#C8956C' : '#8B5E83') : '#9A8080', cursor: 'pointer' }}>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 나이 */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: '#9A8080', fontWeight: 600, marginBottom: 5, display: 'block' }}>나이</label>
              <input type="number" value={editAge} onChange={e => setEditAge(e.target.value)} placeholder="만 나이 입력" min="20" max="80"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(200,149,108,0.25)', fontSize: 13, color: '#3D2B2B', background: 'rgba(253,250,246,0.8)', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            {/* 거주지 */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: '#9A8080', fontWeight: 600, marginBottom: 5, display: 'block' }}>거주지 (리포트에 자동 반영)</label>
              <input type="text" value={editCity} onChange={e => setEditCity(e.target.value)} placeholder="예: 대구시 수성구"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(200,149,108,0.25)', fontSize: 13, color: '#3D2B2B', background: 'rgba(253,250,246,0.8)', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <button onClick={handleSaveProfile} disabled={savingProfile}
              style={{ width: '100%', padding: '13px', borderRadius: 14, background: 'linear-gradient(135deg, #C8956C, #8B5E83)', color: '#fff', fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer', opacity: savingProfile ? 0.7 : 1 }}>
              {savingProfile ? '저장 중...' : '프로필 저장'}
            </button>
          </div>
        </div>

        {/* ── 추천코드 등록 ── */}
        <div style={{ margin: '0 20px 16px', background: 'rgba(255,255,255,0.8)', borderRadius: 20, border: '0.5px solid rgba(200,149,108,0.15)', backdropFilter: 'blur(12px)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '0.5px solid rgba(200,149,108,0.1)' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#3D2B2B' }}>추천코드 등록</span>
          </div>
          <div style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: 11, color: '#9A8080', marginBottom: 12, lineHeight: 1.6 }}>
              친구에게 받은 추천코드를 입력하면 혜택이 적용됩니다.
            </div>
            {referredBy ? (
              <div style={{ background: 'rgba(139,94,131,0.08)', borderRadius: 12, padding: '12px 14px', textAlign: 'center', border: '1px solid rgba(139,94,131,0.15)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#8B5E83' }}>추천코드가 등록되어 있습니다</div>
                <div style={{ fontSize: 11, color: '#9A8080', marginTop: 3 }}>{referredBy}</div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" value={refCode} onChange={e => setRefCode(e.target.value.toUpperCase())} placeholder="추천코드 입력" maxLength={20}
                  style={{ flex: 1, padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(200,149,108,0.25)', fontSize: 13, color: '#3D2B2B', background: 'rgba(253,250,246,0.8)', outline: 'none' }} />
                <button onClick={handleSaveRef} disabled={savingRef || !refCode.trim()}
                  style={{ padding: '10px 18px', borderRadius: 12, background: '#C8956C', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', opacity: (savingRef || !refCode.trim()) ? 0.5 : 1, flexShrink: 0 }}>
                  {savingRef ? '...' : '확인'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── 내 추천링크 ── */}
        {myReferralCode && (
          <div style={{ margin: '0 20px 16px', background: 'rgba(255,255,255,0.8)', borderRadius: 20, border: '0.5px solid rgba(200,149,108,0.15)', backdropFilter: 'blur(12px)', padding: '14px 18px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#3D2B2B', marginBottom: 10 }}>내 추천 링크</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, background: 'rgba(253,250,246,0.8)', borderRadius: 12, padding: '10px 14px', border: '1px solid rgba(200,149,108,0.2)' }}>
                <div style={{ fontSize: 10, color: '#9A8080', marginBottom: 2 }}>추천코드</div>
                <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: '2px', color: '#3D2B2B' }}>{myReferralCode}</div>
              </div>
              <button onClick={handleCopyLink}
                style={{ width: 44, height: 44, borderRadius: 12, background: copied ? 'rgba(125,191,168,0.15)' : 'rgba(200,149,108,0.1)', border: `1px solid ${copied ? 'rgba(125,191,168,0.3)' : 'rgba(200,149,108,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                {copied ? <Check size={16} color="#7DBFA8" /> : <Copy size={16} color="#C8956C" />}
              </button>
            </div>
            <button onClick={() => navigate('/partner-dashboard')}
              style={{ width: '100%', marginTop: 10, padding: '11px', borderRadius: 12, background: 'linear-gradient(135deg, rgba(200,149,108,0.1), rgba(139,94,131,0.1))', border: '0.5px solid rgba(200,149,108,0.25)', color: '#8B5E83', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              파트너 대시보드 →
            </button>
          </div>
        )}

        {/* 안내 */}
        <div style={{ margin: '0 20px', padding: '12px 16px', background: 'rgba(255,255,255,0.4)', borderRadius: 14, border: '0.5px solid rgba(200,149,108,0.1)' }}>
          <p style={{ fontSize: 11, color: '#9A8080', lineHeight: 1.7, margin: 0 }}>
            💡 이름·거주지는 생성된 리포트에 자동으로 반영됩니다.<br />
            본 서비스는 의료 진단을 대체하지 않습니다.
          </p>
        </div>
      </div>

      {/* 토스트 */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)', background: 'rgba(61,43,43,0.9)', color: '#fff', fontSize: 13, fontWeight: 600, padding: '12px 24px', borderRadius: 24, zIndex: 300, whiteSpace: 'nowrap', backdropFilter: 'blur(8px)' }}>
          {toast}
        </div>
      )}
    </div>
  );
}
