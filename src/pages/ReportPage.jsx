// src/pages/ReportPage.jsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { RefreshCw, ChevronDown, ChevronUp, Shield, Star, FileText, X } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

function getRiskLevel(value) {
  if (value < 30) return { label: '양호', color: 'text-green-500', bg: 'bg-green-100', bar: 'from-green-400 to-green-500' };
  if (value < 60) return { label: '주의', color: 'text-yellow-600', bg: 'bg-yellow-100', bar: 'from-yellow-400 to-orange-400' };
  return { label: '위험', color: 'text-red-500', bg: 'bg-red-100', bar: 'from-red-400 to-rose-500' };
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
      { name: '테스토스테론 (남성 호르몬)', value: hormones.testosterone, comment: hormones.testosteroneComment, gradient: 'from-blue-400 to-indigo-500' },
      { name: '코르티솔 (스트레스 호르몬)', value: hormones.cortisol, comment: hormones.cortisolComment, gradient: 'from-orange-400 to-red-400' },
    ];
  }
  return [
    { name: '코르티솔 (스트레스 호르몬)', value: hormones.cortisol, comment: hormones.cortisolComment, gradient: 'from-orange-400 to-red-400' },
    { name: '에스트로겐 (여성 호르몬)', value: hormones.estrogen, comment: hormones.estrogenComment, gradient: 'from-mauve to-rose-gold' },
  ];
}

function getNutrientItems(nutrients, gender) {
  if (gender === 'male') {
    return [
      { name: '비타민 D', emoji: '☀️', value: nutrients.vitaminD, comment: nutrients.vitaminDComment, gradient: 'from-yellow-400 to-orange-400' },
      { name: '아연 (Zinc)', emoji: '🌿', value: nutrients.zinc, comment: nutrients.zincComment, gradient: 'from-green-400 to-teal-400' },
      { name: '마그네슘', emoji: '💪', value: nutrients.magnesium, comment: nutrients.magnesiumComment, gradient: 'from-blue-400 to-cyan-400' },
    ];
  }
  return [
    { name: '비타민 D', emoji: '☀️', value: nutrients.vitaminD, comment: nutrients.vitaminDComment, gradient: 'from-yellow-400 to-orange-400' },
    { name: '철분 (Iron)', emoji: '🩸', value: nutrients.iron, comment: nutrients.ironComment, gradient: 'from-red-400 to-rose-gold' },
    { name: '아연 (Zinc)', emoji: '🌿', value: nutrients.zinc, comment: nutrients.zincComment, gradient: 'from-green-400 to-teal-400' },
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
  const [reportGenerated, setReportGenerated] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

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

  const ageDiff = actualAge - report.healthAge;
  const visiblePlan = showFullPlan ? report.plan14days : report.plan14days?.slice(0, 7);
  const isMale = (gender || report.gender) === 'male';
  const hormoneItems = report.hormones ? getHormoneItems(report.hormones, isMale ? 'male' : 'female') : [];
  const nutrientItems = report.nutrients ? getNutrientItems(report.nutrients, isMale ? 'male' : 'female') : [];

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

  const handleRestart = () => {
    localStorage.removeItem('lastShareId');
    resetAll();
    navigate('/');
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
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${ageDiff > 0 ? 'bg-green-100 text-green-600' : ageDiff < 0 ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-500'}`}>
                  {ageDiff > 0 ? `−${ageDiff}세 젊음 ✨` : ageDiff < 0 ? `+${Math.abs(ageDiff)}세 높음` : '동일'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-[#9A8080] mb-1 font-medium">AI 건강 나이</div>
                <div className="text-5xl font-black text-gradient">{report.healthAge}</div>
                <div className="text-sm text-rose-gold">세</div>
              </div>
            </div>
            {ageDiff < 0 && (
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

          {/* 이미지 분석 */}
          {(report.faceAnalysis || report.nailAnalysis) && (
            <SectionCard title="이미지 분석 결과" icon="🔬">
              <div className="space-y-3">
                {report.faceAnalysis && (
                  <div className="flex gap-3 p-3 bg-cream-dark rounded-2xl">
                    <span className="text-2xl">🤳</span>
                    <div><p className="text-xs font-bold text-mauve mb-1">얼굴 피부 분석</p><p className="text-xs text-[#5A4A4A] leading-relaxed">{report.faceAnalysis}</p></div>
                  </div>
                )}
                {report.nailAnalysis && (
                  <div className="flex gap-3 p-3 bg-cream-dark rounded-2xl">
                    <span className="text-2xl">💅</span>
                    <div><p className="text-xs font-bold text-mauve mb-1">손톱 상태 분석</p><p className="text-xs text-[#5A4A4A] leading-relaxed">{report.nailAnalysis}</p></div>
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {/* 호르몬 */}
          {report.hormones && hormoneItems.length > 0 && (
            <SectionCard title="호르몬 위험도" icon="⚗️">
              <div className="space-y-4">
                {hormoneItems.map((item, i) => {
                  if (item.value === undefined || item.value === null) return null;
                  const level = getRiskLevel(item.value);
                  return (
                    <div key={item.name}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-[#3D2B2B]">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black text-[#3D2B2B]">{item.value}%</span>
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
            <SectionCard title="영양 결핍 위험도" icon="🔬">
              <div className="space-y-4">
                {nutrientItems.map((item, i) => {
                  if (item.value === undefined || item.value === null) return null;
                  const level = getRiskLevel(item.value);
                  return (
                    <div key={item.name}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-[#3D2B2B] flex items-center gap-1.5"><span>{item.emoji}</span>{item.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black text-[#3D2B2B]">{item.value}%</span>
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
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">🔒</span>
                <h3 className="text-base font-black text-[#3D2B2B]">구독하면 더 많은 게 가능해요</h3>
              </div>
              <div className="space-y-3 mb-5">
                <div className="flex items-start gap-3 p-3 bg-blue-50/60 rounded-2xl">
                  <span className="text-xl flex-shrink-0">📈</span>
                  <div>
                    <p className="text-sm font-bold text-[#3D2B2B]">월별 변화 그래프</p>
                    <p className="text-xs text-[#7A6060] mt-0.5">건강 나이·호르몬·영양 추이를 매달 시각화</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-amber-50/60 rounded-2xl">
                  <span className="text-xl flex-shrink-0">🏆</span>
                  <div>
                    <p className="text-sm font-bold text-[#3D2B2B]">건강나이 챌린지 −3세 목표 + 인증서</p>
                    <p className="text-xs text-[#7A6060] mt-0.5">달성 시 공식 인증서 발급 및 커뮤니티 공유</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-pink-50/60 rounded-2xl">
                  <span className="text-xl flex-shrink-0">✨</span>
                  <div>
                    <p className="text-sm font-bold text-[#3D2B2B]">3개월 예상 피부 미리보기</p>
                    <p className="text-xs text-[#7A6060] mt-0.5">AI가 예측하는 관리 후 피부 변화 시뮬레이션</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-green-50/60 rounded-2xl">
                  <span className="text-xl flex-shrink-0">💰</span>
                  <div>
                    <p className="text-sm font-bold text-[#3D2B2B]">단 2명 추천 = 구독료 0원</p>
                    <p className="text-xs text-[#7A6060] mt-0.5">친구 2명이 가입하면 다음 달 구독이 무료</p>
                  </div>
                </div>
              </div>
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
      </div>

      {/* 토스트 메시지 */}
      {toastMsg && (
        <div className="fixed bottom-36 left-1/2 -translate-x-1/2 z-50 bg-[#3D2B2B]/90 text-white text-sm px-5 py-2.5 rounded-full shadow-lg whitespace-nowrap">
          {toastMsg}
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