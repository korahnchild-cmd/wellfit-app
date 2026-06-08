// src/pages/SharedReportPage.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Shield, Star, ChevronDown, ChevronUp } from 'lucide-react';

function getRiskLevel(value) {
  if (value < 30) return { label: '양호', color: 'text-green-500', bg: 'bg-green-100', bar: 'from-green-400 to-green-500' };
  if (value < 60) return { label: '주의', color: 'text-yellow-600', bg: 'bg-yellow-100', bar: 'from-yellow-400 to-orange-400' };
  return { label: '위험', color: 'text-red-500', bg: 'bg-red-100', bar: 'from-red-400 to-rose-500' };
}

function GaugeBar({ value, gradient }) {
  const [width, setWidth] = useState(0);
  useEffect(() => { const t = setTimeout(() => setWidth(value), 300); return () => clearTimeout(t); }, [value]);
  return (
    <div className="h-3 bg-cream-deeper rounded-full overflow-hidden">
      <div className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-1000 ease-out`} style={{ width: `${width}%` }} />
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

export default function SharedReportPage() {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFullPlan, setShowFullPlan] = useState(false);
  const [userName, setUserName] = useState('');
  const [userCity, setUserCity] = useState('');

  useEffect(() => {
    const MAX_RETRIES = 3;
    let retries = 0;

    const fetchReport = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'reports', shareId));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setReport(data.reportData);
          setUserName(data.userName || '');
          setUserCity(data.userCity || '');
          setLoading(false);
        } else if (retries < MAX_RETRIES) {
          retries++;
          setTimeout(fetchReport, 1500);
        } else {
          setError('리포트를 찾을 수 없습니다.');
          setLoading(false);
        }
      } catch (e) {
        if (retries < MAX_RETRIES) {
          retries++;
          setTimeout(fetchReport, 1500);
        } else {
          setError('리포트를 불러오는 중 오류가 발생했습니다.');
          setLoading(false);
        }
      }
    };
    fetchReport();
  }, [shareId]);

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="spinner-large mx-auto mb-4" />
          <p className="text-sm text-[#9A8080]">리포트 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || (!loading && !report)) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-screen p-8 text-center">
        <div className="text-5xl mb-4">😢</div>
        <h2 className="text-xl font-bold text-[#3D2B2B] mb-2">{error || '리포트를 불러올 수 없습니다.'}</h2>
      </div>
    );
  }

  const isMale = report.gender === 'male';
  const actualAge = report.actualAge;
  const ageDiff = actualAge - report.healthAge;
  const hormoneItems = report.hormones ? getHormoneItems(report.hormones, isMale ? 'male' : 'female') : [];
  const nutrientItems = report.nutrients ? getNutrientItems(report.nutrients, isMale ? 'male' : 'female') : [];
  const visiblePlan = showFullPlan ? report.plan14days : report.plan14days?.slice(0, 7);

  const catColors = {
    '영양': 'bg-purple-50 text-purple-600', '수면': 'bg-blue-50 text-blue-600',
    '운동': 'bg-green-50 text-green-600', '마음': 'bg-pink-50 text-pink-600',
    '생활': 'bg-teal-50 text-teal-600', '휴식': 'bg-indigo-50 text-indigo-600', '점검': 'bg-rose-50 text-rose-600',
  };

  return (
    <div className="page-container pb-24">
      {/* 헤더 */}
      <div className="bg-rose-gradient px-4 pt-12 pb-8 text-white relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Star size={14} className="fill-white" />
            <span className="text-xs font-medium opacity-90">AI 건강 분석 리포트 공유본</span>
          </div>
          <h1 className="text-2xl font-black mb-1">웰핏+ CHECK-UP</h1>
          <p className="text-sm opacity-80">
            {new Date(report.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} 분석 완료
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full">
            <span className="text-sm">{isMale ? '👨' : '👩'}</span>
            <span className="text-xs font-semibold">{actualAge}세 · {isMale ? '남성' : '여성'}</span>
          </div>
          {userName && (
            <div className="mt-1.5 inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full ml-2">
              <span className="text-xs font-semibold">{userName}{userCity ? ` · ${userCity}` : ''}</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* 건강 나이 */}
        <div className="card bg-gradient-to-br from-white to-cream-dark border-none shadow-lg">
          <div className="flex items-center gap-2 mb-4"><span className="text-xl">🧬</span><h3 className="section-title mb-0">건강 나이 비교</h3></div>
          <div className="flex items-center justify-around">
            <div className="text-center">
              <div className="text-xs text-[#9A8080] mb-1">실제 나이</div>
              <div className="text-5xl font-black text-[#3D2B2B]">{actualAge}</div>
              <div className="text-sm text-[#9A8080]">세</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-lg font-bold text-[#C0B0B0] mb-2">VS</div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${ageDiff > 0 ? 'bg-green-100 text-green-600' : ageDiff < 0 ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-500'}`}>
                {ageDiff > 0 ? `${ageDiff}세 젊음 ✨` : ageDiff < 0 ? `${Math.abs(ageDiff)}세 높음 ⚠️` : '동일'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-[#9A8080] mb-1">AI 건강 나이</div>
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
          <div className="card">
            <h3 className="section-title flex items-center gap-2 mb-4"><span>🔬</span>이미지 분석 결과</h3>
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
          </div>
        )}

        {/* 호르몬 */}
        {report.hormones && (
          <div className="card">
            <h3 className="section-title flex items-center gap-2 mb-4"><span>⚗️</span>호르몬 위험도</h3>
            <div className="space-y-4">
              {hormoneItems.map((item, i) => {
                if (!item.value && item.value !== 0) return null;
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
                    <GaugeBar value={item.value} gradient={item.gradient} />
                    {item.comment && <p className="text-xs text-[#7A6060] mt-2">{item.comment}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 영양 */}
        {report.nutrients && (
          <div className="card">
            <h3 className="section-title flex items-center gap-2 mb-4"><span>🔬</span>영양 결핍 위험도</h3>
            <div className="space-y-4">
              {nutrientItems.map((item, i) => {
                if (!item.value && item.value !== 0) return null;
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
                    <GaugeBar value={item.value} gradient={item.gradient} />
                    {item.comment && <p className="text-xs text-[#7A6060] mt-2">{item.comment}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 14일 플랜 */}
        {report.plan14days && (
          <div className="card">
            <h3 className="section-title flex items-center gap-2 mb-4"><span>📅</span>14일 맞춤 가이드</h3>
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
              <button onClick={() => setShowFullPlan(v => !v)} className="w-full mt-4 flex items-center justify-center gap-2 text-sm text-rose-gold font-semibold py-3 rounded-2xl border border-rose-gold/30">
                {showFullPlan ? <><ChevronUp size={16} />접기</> : <><ChevronDown size={16} />14일 전체 보기</>}
              </button>
            )}
          </div>
        )}

        {/* 면책 고지 */}
        <div className="flex items-start gap-3 p-4 bg-cream-darker/40 rounded-3xl border border-cream-deeper">
          <Shield size={16} className="text-rose-gold flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[#9A8080] leading-relaxed">{report.disclaimer || '본 분석 결과는 AI 기반 라이프스타일 코칭 참고 자료이며, 의료 진단을 대체하지 않습니다.'}</p>
        </div>

        {/* 나도 받기 CTA */}
        <div className="card bg-rose-gradient text-white text-center p-6">
          <p className="font-bold text-lg mb-2">나도 AI 건강 분석 받아보기</p>
          <p className="text-sm opacity-80 mb-4">셀카 한 장으로 나만의 건강 리포트를 받아보세요</p>
          <button onClick={() => navigate('/')} className="bg-white text-rose-gold font-bold px-6 py-3 rounded-full text-sm">
            무료로 시작하기 →
          </button>
        </div>
      </div>
    </div>
  );
}
