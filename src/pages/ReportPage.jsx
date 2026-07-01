// src/pages/ReportPage.jsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { RefreshCw, ChevronDown, ChevronUp, Shield, Star, FileText, X } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

function getRiskLevel(value) {
  if (value < 30) return { label: '양호', color: 'text-green-500', bg: 'bg-green-100', bar: 'from-green-400 to-green-500' };
  if (value < 60) return { label: '주의', color: 'text-yellow-600', bg: 'bg-yellow-100', bar: 'from-yellow-400 to-orange-400' };
  return { label: '관리 필요', color: 'text-red-500', bg: 'bg-red-100', bar: 'from-red-400 to-rose-500' };
}

function GaugeBar({ value, gradient, delay = 0 }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 300 + delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return (
    <div className="h-3 bg-cream-deeper rounded-full overflow-hidden">
      <div className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-1000 ease-out`} style={{ width: `${width}%` }} />
    </div>
  );
}

function SectionCard({ title, icon, children, className = '' }) {
  return (
    <div className={`card ${className}`}>
      <h3 className="section-title flex items-center gap-2"><span>{icon}</span>{title}</h3>
      {children}
    </div>
  );
}

function getHormoneItems(hormones, gender) {
  if (gender === 'male') {
    return [
      { name: '테스토스테론', value: hormones.testosterone, comment: hormones.testosteroneComment, gradient: 'from-blue-400 to-indigo-500' },
      { name: '코르티솔', value: hormones.cortisol, comment: hormones.cortisolComment, gradient: 'from-orange-400 to-red-400' },
      { name: '인슐린', value: hormones.insulin, comment: hormones.insulinComment, gradient: 'from-purple-400 to-violet-500' },
      { name: '갑상선', value: hormones.thyroid, comment: hormones.thyroidComment, gradient: 'from-teal-400 to-cyan-500' },
      { name: 'DHEA', value: hormones.dhea, comment: hormones.dheaComment, gradient: 'from-amber-400 to-yellow-500' },
      { name: '성장호르몬', value: hormones.growthHormone, comment: hormones.growthHormoneComment, gradient: 'from-green-400 to-emerald-500' },
    ];
  }
  return [
    { name: '에스트로겐', value: hormones.estrogen, comment: hormones.estrogenComment, gradient: 'from-mauve to-rose-gold' },
    { name: '코르티솔', value: hormones.cortisol, comment: hormones.cortisolComment, gradient: 'from-orange-400 to-red-400' },
    { name: '인슐린', value: hormones.insulin, comment: hormones.insulinComment, gradient: 'from-purple-400 to-violet-500' },
    { name: '갑상선', value: hormones.thyroid, comment: hormones.thyroidComment, gradient: 'from-teal-400 to-cyan-500' },
    { name: 'DHEA', value: hormones.dhea, comment: hormones.dheaComment, gradient: 'from-amber-400 to-yellow-500' },
    { name: '프로게스테론', value: hormones.progesterone, comment: hormones.progesteroneComment, gradient: 'from-pink-400 to-rose-400' },
  ];
}

function getNutrientItems(nutrients) {
  return [
    { name: '비타민 D', emoji: '☀️', value: nutrients.vitaminD, comment: nutrients.vitaminDComment, gradient: 'from-yellow-400 to-orange-400' },
    { name: '비타민 B12', emoji: '💊', value: nutrients.vitaminB12, comment: nutrients.vitaminB12Comment, gradient: 'from-red-400 to-orange-300' },
    { name: '철분', emoji: '🩸', value: nutrients.iron, comment: nutrients.ironComment, gradient: 'from-red-400 to-rose-gold' },
    { name: '아연', emoji: '🌿', value: nutrients.zinc, comment: nutrients.zincComment, gradient: 'from-green-400 to-teal-400' },
    { name: '마그네슘', emoji: '💪', value: nutrients.magnesium, comment: nutrients.magnesiumComment, gradient: 'from-blue-400 to-cyan-400' },
    { name: '오메가3', emoji: '🐟', value: nutrients.omega3, comment: nutrients.omega3Comment, gradient: 'from-blue-500 to-indigo-400' },
    { name: '칼슘', emoji: '🦴', value: nutrients.calcium, comment: nutrients.calciumComment, gradient: 'from-slate-400 to-gray-500' },
    { name: '비타민 C', emoji: '🍊', value: nutrients.vitaminC, comment: nutrients.vitaminCComment, gradient: 'from-orange-400 to-amber-300' },
  ];
}

export default function ReportPage() {
  const navigate = useNavigate();
  const { user, report, setReport, actualAge, setActualAge, gender, setGender, resetAll } = useApp();
  const [loading, setLoading] = useState(true);
  const [showFullPlan, setShowFullPlan] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [userName, setUserName] = useState('');
  const [userCity, setUserCity] = useState('');
  const [shareLoading, setShareLoading] = useState(false);
  const [pastReports, setPastReports] = useState([]);
  const [analysisCount, setAnalysisCount] = useState(0);
  const [showCertModal, setShowCertModal] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [activeTab, setActiveTab] = useState('paid');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  // 컨텍스트에 report가 있으면 즉시 사용, 없으면 Firestore에서 복원
  useEffect(() => {
    if (report) {
      setLoading(false);
      return;
    }

    const lastShareId = localStorage.getItem('lastShareId');
    if (!lastShareId) {
      navigate('/');
      return;
    }

    getDoc(doc(db, 'reports', lastShareId))
      .then((snap) => {
        if (!snap.exists()) {
          navigate('/');
          return;
        }
        const data = snap.data();
        const rd = data.reportData;
        setReport({ ...rd, shareId: snap.id });
        if (rd?.actualAge) setActualAge(String(rd.actualAge));
        setGender(data.gender || rd?.gender || 'female');
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, []);

  // 과거 분석 기록 불러오기 (로그인 사용자만)
  useEffect(() => {
    if (!user || user.isGuest) return;
    const fetchPastReports = async () => {
      try {
        const q = query(
          collection(db, 'reports'),
          where('userId', '==', user.uid),
          orderBy('timestamp', 'desc'),
          limit(10)
        );
        const snap = await getDocs(q);
        const docs = snap.docs.map(d => ({
          id: d.id,
          healthAge: d.data().reportData?.healthAge,
          createdAt: d.data().reportData?.createdAt,
          cortisol: d.data().reportData?.hormones?.cortisol,
        })).filter(d => d.healthAge);
        setPastReports(docs);
        setAnalysisCount(docs.length);
      } catch (e) {
        console.warn('과거 분석 로드 실패:', e);
      }
    };
    fetchPastReports();
  }, [user]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#FDFAF6' }}
           className="flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-rose mx-auto mb-4" />
          <p className="text-sm text-[#9A8080]">리포트 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!report) return <div style={{ minHeight: '100vh', backgroundColor: '#FDFAF6' }} />;

  const ageDiff = report.healthAge - actualAge;

  // 건강나이 챌린지 달성 여부 — 6회 이상 + 처음 대비 -3세 이상
  const challengeAchieved = (() => {
    if (analysisCount < 6 || pastReports.length < 6) return false;
    const oldest = pastReports[pastReports.length - 1]?.healthAge;
    const latest = pastReports[0]?.healthAge;
    if (!oldest || !latest) return false;
    return (oldest - latest) >= 3; // 건강나이가 3세 이상 낮아짐
  })();

  // 챌린지 개선 수치
  const challengeImprovement = (() => {
    if (pastReports.length < 2) return 0;
    const oldest = pastReports[pastReports.length - 1]?.healthAge;
    const latest = pastReports[0]?.healthAge;
    return oldest && latest ? oldest - latest : 0;
  })();
  const visiblePlan = showFullPlan ? report.plan14days : report.plan14days?.slice(0, 7);
  const isMale = (gender || report.gender) === 'male';
  const hormoneItems = report.hormones ? getHormoneItems(report.hormones, isMale ? 'male' : 'female') : [];
  const nutrientItems = report.nutrients ? getNutrientItems(report.nutrients) : [];

  // 리포트 보기
  const handleViewReport = async () => {
    if (!userName.trim()) { alert('이름을 입력해주세요'); return; }
    if (!report.shareId) { alert('리포트 저장 중입니다. 잠시 후 다시 시도해주세요.'); return; }
    try {
      await updateDoc(doc(db, 'reports', report.shareId), { userName, userCity });
    } catch (e) {
      console.warn('Firestore update failed:', e);
    }
    window.open(`https://korahnchild-cmd.github.io/wellfit-app/report-view/${report.shareId}`, '_blank');
    setReportGenerated(true);
    setShowInfoModal(false);
  };

  // 클립보드 복사 (clipboard API 미지원 환경 대응)
  const copyToClipboard = async (text) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
  };

  // 공유하기
  const handleShare = async () => {
    if (!report.shareId) { alert('리포트 저장 중입니다. 잠시 후 다시 시도해주세요.'); return; }
    const shareUrl = `https://korahnchild-cmd.github.io/wellfit-app/report-view/${report.shareId}`;
    setShareLoading(true);
    try {
      if (report.shareId) {
        try {
          await updateDoc(doc(db, 'reports', report.shareId), { userName, userCity });
        } catch (e) {
          console.warn('Firestore update failed:', e);
        }
      }
      if (navigator.share) {
        await navigator.share({
          title: '웰핏+ CHECK-UP 건강 분석 결과',
          text: 'AI가 분석한 나의 건강 나이와 호르몬·영양 위험도 리포트를 확인해보세요!',
          url: shareUrl,
        });
      } else {
        await copyToClipboard(shareUrl);
        showToast('링크가 복사되었습니다');
      }
    } catch (err) {
      if (err.name === 'AbortError') return; // 사용자가 공유 취소
      // navigator.share 실패 시 클립보드 복사로 폴백
      try {
        await copyToClipboard(shareUrl);
        showToast('링크가 복사되었습니다');
      } catch {
        showToast('공유에 실패했습니다');
      }
    } finally {
      setShareLoading(false);
    }
  };

  // 챌린지 인증서 공유
  const handleCertShare = async () => {
    const text = `🏆 웰핏+ CHECK-UP 건강나이 챌린지 달성!\n\n${actualAge}세 실제 나이, AI 건강나이 ${challengeImprovement}세 젊어졌어요 ✨\n3개월 꾸준한 관리로 건강나이 챌린지 달성!\n\n나도 분석 받아보기 👇\nhttps://korahnchild-cmd.github.io/wellfit-app/`;
    if (navigator.share) {
      try { await navigator.share({ title: '웰핏+ 건강나이 챌린지 달성!', text, url: 'https://korahnchild-cmd.github.io/wellfit-app/' }); }
      catch {}
    } else {
      await copyToClipboard(text);
      showToast('공유 텍스트가 복사되었습니다');
    }
    setShowCertModal(false);
  };

  const handleRestart = () => {
    localStorage.removeItem('lastShareId');
    resetAll();
    navigate('/upload');
  };

  const catColors = {
    '영양': 'bg-purple-50 text-purple-600', '수면': 'bg-blue-50 text-blue-600',
    '운동': 'bg-green-50 text-green-600', '마음': 'bg-pink-50 text-pink-600',
    '생활': 'bg-teal-50 text-teal-600', '휴식': 'bg-indigo-50 text-indigo-600', '점검': 'bg-rose-50 text-rose-600',
  };

  return (
    <div className="page-container pb-32">
      {/* 헤더 */}
      <div className="bg-rose-gradient px-4 pt-12 pb-8 text-white relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-5 -left-5 w-32 h-32 rounded-full bg-white/5" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Star size={14} className="fill-white" />
            <span className="text-xs font-medium opacity-90">AI 건강 분석 리포트</span>
          </div>
          <h1 className="text-2xl font-black mb-1">웰핏+ CHECK-UP</h1>
          <p className="text-sm opacity-80">
            {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} 분석 완료
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full">
            <span className="text-sm">{isMale ? '👨' : '👩'}</span>
            <span className="text-xs font-semibold">{actualAge}세 · {isMale ? '남성' : '여성'}</span>
          </div>
        </div>
      </div>

      <div className="bg-cream-gradient" style={{ backgroundColor: '#FDFAF6' }}>
        <div className="p-4 space-y-4">

          {/* 건강 나이 */}
          <div className="card bg-gradient-to-br from-white to-cream-dark border-none shadow-lg overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🧬</span>
              <h3 className="section-title mb-0">건강 나이 비교</h3>
            </div>
            <div className="flex items-center justify-around">
              <div className="text-center">
                <div className="text-xs text-[#9A8080] mb-1 font-medium">실제 나이</div>
                <div className="text-5xl font-black text-[#3D2B2B]">{actualAge}</div>
                <div className="text-sm text-[#9A8080]">세</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-lg font-bold text-[#C0B0B0] mb-2">VS</div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${ageDiff < 0 ? 'bg-green-100 text-green-600' : ageDiff > 0 ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-500'}`}>
                  {ageDiff < 0 ? `−${Math.abs(ageDiff)}세 젊음 ✨` : ageDiff > 0 ? `+${ageDiff}세 높음` : '동일'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-[#9A8080] mb-1 font-medium">AI 건강 나이</div>
                <div className="text-5xl font-black text-gradient">{report.healthAge}</div>
                <div className="text-sm text-rose-gold">세</div>
              </div>
            </div>
            {ageDiff > 0 && (
              <div className="mt-3 p-3 bg-orange-50 rounded-2xl border border-orange-100 text-center">
                <p className="text-sm text-orange-700 font-medium leading-relaxed">지금 관리하면 충분히 되돌릴 수 있어요 💪</p>
              </div>
            )}
            {report.summary && (
              <div className="mt-4 p-4 bg-rose-gold/5 rounded-2xl border border-rose-gold/20">
                <p className="text-sm text-[#5A4A4A] leading-relaxed">{report.summary}</p>
              </div>
            )}
          </div>

          {/* 건강나이 누적 타임라인 + 패턴 감지 */}
          {user && !user.isGuest && (
            <div className="card overflow-hidden" style={{ background: 'linear-gradient(135deg, #FDF6F0 0%, #F8F0FA 100%)', border: '1px solid rgba(200,149,108,0.2)' }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">📊</span>
                <h3 className="font-bold text-[#3D2B2B] text-sm">내 건강나이 변화 기록</h3>
                {analysisCount > 0 && (
                  <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(200,149,108,0.15)', color: '#C8956C' }}>
                    총 {analysisCount}회 분석
                  </span>
                )}
              </div>

              {/* 1~2회: 변화 수치 표시 */}
              {analysisCount <= 2 && pastReports.length >= 2 && (() => {
                const prev = pastReports[1];
                const curr = pastReports[0];
                const diff = curr.healthAge - prev.healthAge;
                return (
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/70 mb-2">
                    <div className="text-center">
                      <div className="text-xs text-[#9A8080] mb-1">지난 분석</div>
                      <div className="text-2xl font-black text-[#3D2B2B]">{prev.healthAge}<span className="text-sm font-medium">세</span></div>
                    </div>
                    <div className="flex-1 text-center">
                      <div className={`text-lg font-black ${diff < 0 ? 'text-green-500' : diff > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                        {diff < 0 ? `▼ ${Math.abs(diff)}세 젊어짐 ✨` : diff > 0 ? `▲ ${diff}세 높아짐` : '변화 없음'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-[#9A8080] mb-1">이번 분석</div>
                      <div className="text-2xl font-black text-gradient">{curr.healthAge}<span className="text-sm font-medium text-rose-gold">세</span></div>
                    </div>
                  </div>
                );
              })()}

              {/* 1회: 첫 분석 안내 */}
              {analysisCount === 1 && (
                <div className="p-3 rounded-2xl bg-white/70 mb-2 text-center">
                  <p className="text-sm font-bold text-[#8B5E83]">첫 번째 분석을 완료했어요! 🎉</p>
                  <p className="text-xs text-[#9A8080] mt-1">다음 분석부터 건강나이 변화를 추적합니다</p>
                </div>
              )}

              {/* 3~5회: 반복 패턴 감지 */}
              {analysisCount >= 3 && analysisCount <= 5 && (() => {
                const highCortisol = pastReports.slice(0, 3).filter(r => r.cortisol && r.cortisol >= 60).length;
                return (
                  <div className="space-y-2 mb-2">
                    {/* 미니 꺾은선 */}
                    <div className="flex items-end gap-1 px-2 py-3 bg-white/70 rounded-2xl" style={{ height: 64 }}>
                      {pastReports.slice(0, 5).reverse().map((r, i) => {
                        const maxAge = Math.max(...pastReports.map(p => p.healthAge));
                        const minAge = Math.min(...pastReports.map(p => p.healthAge));
                        const range = maxAge - minAge || 1;
                        const h = 8 + ((maxAge - r.healthAge) / range) * 36;
                        return (
                          <div key={r.id} className="flex-1 flex flex-col items-center gap-1">
                            <div className="text-xs font-bold" style={{ color: '#C8956C', fontSize: '9px' }}>{r.healthAge}세</div>
                            <div className="w-full rounded-t-md" style={{ height: h, background: i === pastReports.slice(0, 5).length - 1 ? 'linear-gradient(180deg,#8B5E83,#C8956C)' : 'rgba(200,149,108,0.3)' }} />
                          </div>
                        );
                      })}
                    </div>
                    {highCortisol >= 3 && (
                      <div className="flex items-start gap-2 p-3 rounded-2xl" style={{ background: 'rgba(255,180,100,0.12)', border: '1px solid rgba(255,160,80,0.25)' }}>
                        <span className="text-base flex-shrink-0">⚠️</span>
                        <div>
                          <p className="text-xs font-bold text-orange-700">패턴 감지: 코르티솔 {highCortisol}회 연속 주의 수준</p>
                          <p className="text-xs text-orange-600 mt-0.5">수면 패턴과 스트레스 관리를 집중적으로 체크해보세요</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* 6회+: 나만의 패턴 리포트 */}
              {analysisCount >= 6 && (() => {
                const ages = pastReports.slice(0, 6).map(r => r.healthAge);
                const trend = ages[0] - ages[ages.length - 1]; // 최근 - 가장 예전
                const highCortisol = pastReports.slice(0, 6).filter(r => r.cortisol && r.cortisol >= 60).length;
                return (
                  <div className="space-y-2 mb-2">
                    <div className="flex items-end gap-1 px-2 py-3 bg-white/70 rounded-2xl" style={{ height: 64 }}>
                      {pastReports.slice(0, 6).reverse().map((r, i, arr) => {
                        const maxAge = Math.max(...arr.map(p => p.healthAge));
                        const minAge = Math.min(...arr.map(p => p.healthAge));
                        const range = maxAge - minAge || 1;
                        const h = 8 + ((maxAge - r.healthAge) / range) * 36;
                        return (
                          <div key={r.id} className="flex-1 flex flex-col items-center gap-1">
                            <div className="text-xs font-bold" style={{ color: '#C8956C', fontSize: '9px' }}>{r.healthAge}</div>
                            <div className="w-full rounded-t-md" style={{ height: h, background: i === arr.length - 1 ? 'linear-gradient(180deg,#8B5E83,#C8956C)' : 'rgba(200,149,108,0.3)' }} />
                          </div>
                        );
                      })}
                    </div>
                    <div className="p-3 rounded-2xl" style={{ background: 'linear-gradient(135deg,rgba(139,94,131,0.08),rgba(200,149,108,0.08))', border: '1px solid rgba(139,94,131,0.15)' }}>
                      <p className="text-xs font-bold text-[#8B5E83] mb-1.5">🔍 당신만의 건강 패턴이 보입니다</p>
                      {trend < 0 && <p className="text-xs text-[#5A4A4A] leading-relaxed">최근 6회 분석에서 건강나이가 <span className="font-bold text-green-600">총 {Math.abs(trend)}세 젊어졌어요</span>. 꾸준한 관리가 효과를 내고 있습니다.</p>}
                      {trend > 0 && <p className="text-xs text-[#5A4A4A] leading-relaxed">건강나이가 소폭 높아졌어요. <span className="font-bold text-orange-600">지금이 집중 관리 타이밍</span>입니다.</p>}
                      {trend === 0 && <p className="text-xs text-[#5A4A4A] leading-relaxed">건강나이가 안정적으로 유지되고 있어요. 꾸준한 관리의 힘입니다.</p>}
                      {highCortisol >= 4 && <p className="text-xs text-orange-600 mt-1 leading-relaxed">⚠️ 코르티솔이 {highCortisol}회 연속 높게 나왔어요. 수면·스트레스 패턴을 꼭 체크하세요.</p>}
                    </div>
                    <p className="text-xs text-center text-[#B0A0A0]">탈퇴 시 {analysisCount}회 누적 기록이 모두 삭제됩니다</p>
                  </div>
                );
              })()}

              {/* 0회 (첫 분석) */}
              {analysisCount === 0 && (
                <div className="p-3 rounded-2xl bg-white/70 text-center">
                  <p className="text-sm font-bold text-[#8B5E83]">첫 분석을 완료했어요! 🎉</p>
                  <p className="text-xs text-[#9A8080] mt-1">분석을 반복할수록 나만의 건강 패턴이 보입니다</p>
                </div>
              )}
            </div>
          )}

          {/* 이미지 분석 */}
          {(report.faceAnalysis || report.nailAnalysis) && (
            <SectionCard title="이미지 분석 결과" icon="🔬">
              <div className="space-y-3">
                {report.faceAnalysis && (
                  <div className="flex gap-3 p-3 bg-cream-dark rounded-2xl">
                    <span className="text-2xl">🤳</span>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-mauve mb-1">얼굴 피부 분석</p>
                      {typeof report.faceAnalysis === 'object' ? (
                        <div className="space-y-1">
                          {[
                            { icon: '💧', label: '수분도', key: 'moisture' },
                            { icon: '✨', label: '피부 톤 균일도', key: 'tone' },
                            { icon: '👁️', label: '다크서클', key: 'darkCircle' },
                            { icon: '🔬', label: '모공 상태', key: 'pore' },
                            { icon: '📊', label: '주름 분포', key: 'wrinkle' },
                          ].filter(f => report.faceAnalysis[f.key]).map(f => (
                            <p key={f.key} className="text-xs text-[#5A4A4A] leading-relaxed">
                              <span className="mr-1">{f.icon}</span><span className="font-semibold">{f.label}:</span> {report.faceAnalysis[f.key]}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-[#5A4A4A] leading-relaxed">{report.faceAnalysis}</p>
                      )}
                    </div>
                  </div>
                )}
                {report.nailAnalysis && (
                  <div className="flex gap-3 p-3 bg-cream-dark rounded-2xl">
                    <span className="text-2xl">💅</span>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-mauve mb-1">손톱 상태 분석</p>
                      {typeof report.nailAnalysis === 'object' ? (
                        <div className="space-y-1">
                          {[
                            { icon: '🎨', label: '색상/강도', key: 'color' },
                            { icon: '🌿', label: '큐티클 상태', key: 'cuticle' },
                            { icon: '〰️', label: '세로줄', key: 'ridge' },
                            { icon: '🌙', label: '반달(루눌라)', key: 'lunula' },
                          ].filter(f => report.nailAnalysis[f.key]).map(f => (
                            <p key={f.key} className="text-xs text-[#5A4A4A] leading-relaxed">
                              <span className="mr-1">{f.icon}</span><span className="font-semibold">{f.label}:</span> {report.nailAnalysis[f.key]}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-[#5A4A4A] leading-relaxed">{report.nailAnalysis}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {/* 호르몬 */}
          {report.hormones && hormoneItems.length > 0 && (
            <SectionCard title="호르몬 참고 지수" icon="⚗️">
              <div className="space-y-4">
                {hormoneItems.map((item, i) => {
                  if (item.value === undefined || item.value === null) return null;
                  const level = getRiskLevel(item.value);
                  return (
                    <div key={item.name}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-[#3D2B2B]">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#3D2B2B]">참고 지수 {item.value}%</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${level.bg} ${level.color}`}>{level.label}</span>
                        </div>
                      </div>
                      <GaugeBar value={item.value} gradient={item.gradient} delay={i * 200} />
                      {item.comment && <p className="text-xs text-[#7A6060] mt-2 leading-relaxed">{item.comment}</p>}
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          )}

          {/* 영양 */}
          {report.nutrients && nutrientItems.length > 0 && (
            <SectionCard title="영양 결핍 참고 지수" icon="🔬">
              <div className="space-y-4">
                {nutrientItems.map((item, i) => {
                  if (item.value === undefined || item.value === null) return null;
                  const level = getRiskLevel(item.value);
                  return (
                    <div key={item.name}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-[#3D2B2B] flex items-center gap-1.5"><span>{item.emoji}</span>{item.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#3D2B2B]">참고 지수 {item.value}%</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${level.bg} ${level.color}`}>{level.label}</span>
                        </div>
                      </div>
                      <GaugeBar value={item.value} gradient={item.gradient} delay={i * 150} />
                      {item.comment && <p className="text-xs text-[#7A6060] mt-2 leading-relaxed">{item.comment}</p>}
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          )}

          {/* 14일 플랜 */}
          {report.plan14days && (
            <SectionCard title="14일 맞춤 가이드" icon="📅">
              <div className="grid grid-cols-1 gap-3">
                {visiblePlan?.map((item) => (
                  <div key={item.day} className="flex gap-3 items-start p-3 rounded-2xl bg-cream-dark hover:bg-cream-deeper transition-colors">
                    <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-rose-gradient flex flex-col items-center justify-center shadow-rose">
                      <span className="text-white text-xs font-bold leading-none">D</span>
                      <span className="text-white text-sm font-black leading-none">{item.day}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">{item.emoji}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${catColors[item.category] || 'bg-gray-100 text-gray-500'}`}>{item.category}</span>
                      </div>
                      <p className="text-sm text-[#3D2B2B] leading-relaxed">{item.tip}</p>
                    </div>
                  </div>
                ))}
              </div>
              {report.plan14days.length > 7 && (
                <button onClick={() => setShowFullPlan((v) => !v)} className="w-full mt-4 flex items-center justify-center gap-2 text-sm text-rose-gold font-semibold py-3 rounded-2xl border border-rose-gold/30 hover:bg-rose-gold/5 transition-colors">
                  {showFullPlan ? <><ChevronUp size={16} />접기</> : <><ChevronDown size={16} />14일 전체 보기</>}
                </button>
              )}
            </SectionCard>
          )}

          {/* 유료 전환 유도 섹션 - 비로그인 또는 무료체험 사용자에게만 표시 */}
          {(!user || user.isGuest || user.subscriptionStatus !== 'paid') && (
            <div className="card overflow-hidden border-rose-gold/30 bg-gradient-to-br from-white via-rose-50/30 to-purple-50/20">
              {/* 탭 헤더 */}
              <div className="flex rounded-2xl p-1 mb-4" style={{ backgroundColor: '#F3EDF7' }}>
                <button
                  onClick={() => setActiveTab('free')}
                  className="flex-1 py-2 text-sm font-bold rounded-xl transition-all"
                  style={
                    activeTab === 'free'
                      ? { background: 'linear-gradient(135deg, #C8956C 0%, #8B5E83 100%)', color: '#fff' }
                      : { color: '#8B5E83', opacity: 0.65 }
                  }
                >
                  무료 체험
                </button>
                <button
                  onClick={() => setActiveTab('paid')}
                  className="flex-1 py-2 text-sm font-bold rounded-xl transition-all"
                  style={
                    activeTab === 'paid'
                      ? { background: 'linear-gradient(135deg, #C8956C 0%, #8B5E83 100%)', color: '#fff' }
                      : { color: '#8B5E83', opacity: 0.65 }
                  }
                >
                  유료 구독
                </button>
              </div>

              {/* 무료 체험 탭 */}
              {activeTab === 'free' && (
                <div className="space-y-1.5 mb-5">
                  {[
                    { ok: true,  text: '1회 AI 분석' },
                    { ok: true,  text: '본문리포트 확인 (건강나이/호르몬/영양/14일플랜)' },
                    { ok: true,  text: '생성된 리포트 공유' },
                    { ok: true,  text: '14일 이용' },
                    { ok: false, text: '월별 변화 그래프' },
                    { ok: false, text: '건강나이 챌린지' },
                    { ok: false, text: '3개월 예상 피부 미리보기' },
                    { ok: false, text: '앰배서더 수익' },
                  ].map((item, i) => (
                    <div key={i} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl ${item.ok ? 'bg-white/60' : ''}`} style={!item.ok ? { opacity: 0.45 } : {}}>
                      <span className="text-sm flex-shrink-0">{item.ok ? '✅' : '❌'}</span>
                      <span className={`text-sm ${item.ok ? 'font-medium text-[#3D2B2B]' : 'text-[#9A8080] line-through'}`}>{item.text}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* 유료 구독 탭 */}
              {activeTab === 'paid' && (
                <>
                  <div className="flex items-center justify-center gap-1 mb-3">
                    <span className="text-xl font-black" style={{ color: '#C8956C' }}>월 59,800원</span>
                  </div>

                  {/* 월별 건강나이 추이 미리보기 */}
                  <div className="mb-4 p-3 rounded-2xl border border-rose-gold/20" style={{ background: 'linear-gradient(135deg, #FDF6F0 0%, #F8F0FA 100%)' }}>
                    <p className="text-xs font-bold text-[#8B5E83] mb-2">📈 월별 건강나이 변화 추이 (구독 시 제공)</p>
                    <svg viewBox="0 0 280 72" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 72 }}>
                      <defs>
                        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#C8956C" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#C8956C" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {/* 그리드 라인 */}
                      <line x1="0" y1="16" x2="280" y2="16" stroke="#E8DDD5" strokeWidth="0.5" strokeDasharray="4 3" />
                      <line x1="0" y1="36" x2="280" y2="36" stroke="#E8DDD5" strokeWidth="0.5" strokeDasharray="4 3" />
                      <line x1="0" y1="56" x2="280" y2="56" stroke="#E8DDD5" strokeWidth="0.5" strokeDasharray="4 3" />
                      {/* 채우기 영역 */}
                      <path d="M20,52 Q80,46 120,38 T200,26 T260,14 L260,68 L20,68 Z" fill="url(#chartFill)" />
                      {/* 꺾은선 */}
                      <path d="M20,52 Q80,46 120,38 T200,26 T260,14" fill="none" stroke="#C8956C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      {/* 데이터 포인트 */}
                      <circle cx="20"  cy="52" r="3" fill="#C8956C" />
                      <circle cx="90"  cy="44" r="3" fill="#C8956C" />
                      <circle cx="160" cy="30" r="3" fill="#C8956C" />
                      <circle cx="260" cy="14" r="4" fill="#8B5E83" stroke="white" strokeWidth="1.5" />
                      {/* 월 레이블 */}
                      <text x="20"  y="68" textAnchor="middle" fontSize="9" fill="#B09090">3월</text>
                      <text x="90"  y="68" textAnchor="middle" fontSize="9" fill="#B09090">4월</text>
                      <text x="160" y="68" textAnchor="middle" fontSize="9" fill="#B09090">5월</text>
                      <text x="260" y="68" textAnchor="middle" fontSize="9" fill="#8B5E83" fontWeight="700">6월</text>
                      {/* 최신 값 레이블 */}
                      <text x="260" y="10" textAnchor="middle" fontSize="9" fill="#8B5E83" fontWeight="700">-3세 ✨</text>
                    </svg>
                    <p className="text-xs text-[#9A8080] mt-1 text-center">구독 유지 시 건강나이가 이렇게 변화합니다</p>
                  </div>
                  <div className="space-y-1.5 mb-5">
                    {[
                      { text: '월 4회 정기 분석 (주 1회 관리)' },
                      { text: '월별 변화 그래프' },
                      { text: '건강나이 챌린지 (-3세 목표 + 인증서)' },
                      { text: '3개월 예상 피부 미리보기' },
                      { text: '앰배서더 수익 (단 2명 추천 = 구독료 0원)' },
                      { text: '🌸 생리 주기·계절 변화 반영 맞춤 코멘트', desc: '갱년기 증상은 계절과 주기에 따라 달라져요. AI가 내 몸의 리듬을 읽고 맞춤 코멘트를 드립니다.' },
                      { text: '🔔 매주 맞춤 건강 푸시 알림', desc: '1주차 실천체크 · 2주차 중간점검 · 3주차 분석알림 · 4주차 월마무리' },
                      { text: '무료 체험 모든 기능 포함' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-2.5 px-3 py-2 rounded-xl bg-white/60">
                        <span className="text-sm flex-shrink-0 mt-0.5">✅</span>
                        <div>
                          <span className="text-sm font-medium text-[#3D2B2B]">{item.text}</span>
                          {item.desc && <p className="text-xs text-[#9A8080] mt-0.5 leading-relaxed">{item.desc}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* CTA 버튼 */}
              {(!user || user.isGuest) ? (
                <>
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full py-3.5 rounded-2xl font-bold text-sm text-white shadow-rose transition-all active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #C9956B 0%, #B8829A 100%)' }}
                  >
                    14일 무료 체험 시작하기
                  </button>
                  <p className="text-xs text-center text-[#B0A0A0] mt-2">신용카드 없이 시작 · 언제든 해지 가능</p>
                </>
              ) : (
                <button
                  onClick={() => navigate('/subscribe')}
                  className="w-full py-3.5 rounded-2xl font-bold text-sm text-white shadow-rose transition-all active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #C9956B 0%, #B8829A 100%)' }}
                >
                  유료 구독하기 · 월 59,800원
                </button>
              )}
            </div>
          )}

          {/* 챌린지 달성 배너 */}
          {challengeAchieved && (
            <div
              onClick={() => setShowCertModal(true)}
              className="card cursor-pointer active:scale-95 transition-transform"
              style={{ background: 'linear-gradient(135deg, #8B5E83 0%, #C8956C 100%)', border: 'none' }}
            >
              <div className="text-center text-white">
                <div className="text-3xl mb-2">🏆</div>
                <p className="font-black text-lg mb-1">건강나이 챌린지 달성!</p>
                <p className="text-sm opacity-90 mb-3">
                  {analysisCount}회 분석으로 건강나이 <span className="font-black text-yellow-200">{challengeImprovement}세</span> 젊어졌어요
                </p>
                <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm font-bold">
                  🎖️ 인증서 발급 · SNS 공유하기
                </div>
              </div>
            </div>
          )}

          {/* 챌린지 진행 중 안내 (3회 이상, 미달성) */}
          {!challengeAchieved && analysisCount >= 3 && challengeImprovement < 3 && (
            <div className="card" style={{ background: 'linear-gradient(135deg, #FDF6F0, #F8F0FA)', border: '1px solid rgba(139,94,131,0.2)' }}>
              <div className="flex items-center gap-3">
                <div className="text-2xl">🎯</div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-[#8B5E83]">건강나이 챌린지 진행 중</p>
                  <p className="text-xs text-[#9A8080] mt-0.5">
                    목표: 건강나이 -3세 달성 · 현재 {challengeImprovement > 0 ? `${challengeImprovement}세 개선됨` : '시작 단계'}
                  </p>
                </div>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(139,94,131,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#8B5E83' }}>
                    {Math.min(Math.round((challengeImprovement / 3) * 100), 99)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 의료 고지 */}
          <div className="flex items-start gap-3 p-4 bg-cream-deeper/40 rounded-3xl border border-cream-deeper">
            <Shield size={16} className="text-rose-gold flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[#9A8080] leading-relaxed">
              {report.disclaimer || '본 분석 결과는 AI 기반 라이프스타일 코칭 참고 자료이며, 의료 진단을 대체하지 않습니다.'}
            </p>
          </div>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pb-6 pt-4 bg-cream-gradient border-t border-cream-deeper">
        <div className="flex gap-2">
          <button onClick={() => setShowInfoModal(true)} className="flex-1 btn-primary flex items-center justify-center gap-2">
            <FileText size={17} />리포트 보기
          </button>
          <button onClick={handleRestart} className="flex-1 btn-secondary flex items-center justify-center gap-2">
            <RefreshCw size={17} />다시하기
          </button>
        </div>
        <div className="flex justify-center mt-2">
          <button onClick={() => navigate('/')} className="text-xs text-[#B0A0A0] hover:text-rose-gold transition-colors">
            🏠 홈으로
          </button>
        </div>
      </div>

      {/* 토스트 메시지 */}
      {toastMsg && (
        <div className="fixed bottom-36 left-1/2 -translate-x-1/2 z-50 bg-[#3D2B2B]/90 text-white text-sm px-5 py-2.5 rounded-full shadow-lg whitespace-nowrap">
          {toastMsg}
        </div>
      )}

      {/* 챌린지 인증서 모달 */}
      {showCertModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={(e) => e.target === e.currentTarget && setShowCertModal(false)}>
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
            {/* 인증서 헤더 */}
            <div style={{ background: 'linear-gradient(135deg, #8B5E83 0%, #C8956C 100%)', padding: '32px 24px', textAlign: 'center', color: 'white' }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🏆</div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', opacity: 0.8, marginBottom: 6 }}>WELLFIT+ CHECK-UP</div>
              <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>건강나이 챌린지 달성 인증서</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>
                {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
            {/* 인증서 본문 */}
            <div style={{ padding: '24px', background: '#FDFAF6' }}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: '#9A8080', marginBottom: 4 }}>위 사용자는</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#3D2B2B', marginBottom: 8 }}>
                  {actualAge}세 · 총 {analysisCount}회 분석
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,rgba(139,94,131,0.1),rgba(200,149,108,0.1))', border: '1px solid rgba(200,149,108,0.3)', borderRadius: 16, padding: '12px 24px' }}>
                  <span style={{ fontSize: 28, fontWeight: 900, background: 'linear-gradient(135deg,#8B5E83,#C8956C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    -{challengeImprovement}세
                  </span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#3D2B2B' }}>건강나이 개선</div>
                    <div style={{ fontSize: 10, color: '#9A8080' }}>AI 분석 기준</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#9A8080', marginTop: 12, lineHeight: 1.6 }}>
                  꾸준한 건강 관리로 건강나이 챌린지를<br />성공적으로 달성하였음을 인증합니다.
                </div>
              </div>
              {/* 특허 뱃지 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(200,149,108,0.08)', border: '1px solid rgba(200,149,108,0.2)', borderRadius: 12, padding: '10px 14px', marginBottom: 20 }}>
                <span style={{ fontSize: 14 }}>🔬</span>
                <span style={{ fontSize: 11, color: '#7A6060', lineHeight: 1.5 }}>특허 출원 기술 기반 AI 분석 · 웰핏+ CHECK-UP</span>
              </div>
              {/* 버튼 */}
              <button
                onClick={handleCertShare}
                style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg,#8B5E83,#C8956C)', color: 'white', fontWeight: 800, fontSize: 15, border: 'none', borderRadius: 16, cursor: 'pointer', marginBottom: 10 }}
              >
                🎉 SNS에 공유하기
              </button>
              <button
                onClick={() => setShowCertModal(false)}
                style={{ width: '100%', padding: '12px', background: 'transparent', color: '#9A8080', fontSize: 13, border: 'none', cursor: 'pointer' }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 이름/거주지 입력 모달 */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={(e) => e.target === e.currentTarget && setShowInfoModal(false)}>
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#3D2B2B]">리포트에 표시할 정보</h2>
              <button onClick={() => setShowInfoModal(false)} className="p-2 hover:bg-cream-dark rounded-full transition-colors">
                <X size={18} className="text-[#7A6060]" />
              </button>
            </div>
            <div className="space-y-3 mb-5">
              <div>
                <label className="text-sm font-semibold text-[#3D2B2B] mb-1.5 block">이름 <span className="text-rose-gold">*</span></label>
                <input type="text" placeholder="예: 김미경" value={userName} onChange={(e) => setUserName(e.target.value)} className="input-field w-full" maxLength={10} />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#3D2B2B] mb-1.5 block">거주지 (시 단위)</label>
                <input type="text" placeholder="예: 경산시, 서울시" value={userCity} onChange={(e) => setUserCity(e.target.value)} className="input-field w-full" maxLength={10} />
              </div>
            </div>
            <button onClick={handleViewReport} className="btn-primary w-full flex items-center justify-center gap-2">
              <FileText size={17} />리포트 열기
            </button>
            <p className="text-xs text-center text-[#B0A0A0] mt-3">입력 정보는 리포트 표시용으로만 사용됩니다</p>
          </div>
        </div>
      )}
    </div>
  );
}