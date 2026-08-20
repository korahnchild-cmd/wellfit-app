// src/pages/SurveyPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, SURVEY_QUESTIONS } from '../context/AppContext';
import { useRequireLogin } from '../hooks/useRequireLogin';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

const CATEGORY_COLORS = {
  '수면': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', dot: 'bg-blue-400' },
  '식습관': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600', dot: 'bg-green-400' },
  '스트레스': { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600', dot: 'bg-orange-400' },
  '갱년기': { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-500', dot: 'bg-red-400' },
  '영양': { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', dot: 'bg-purple-400' },
};

const SCORE_LABELS = ['전혀\n아님', '거의\n아님', '가끔\n그러함', '자주\n그러함', '매우\n그러함'];

export default function SurveyPage() {
  const navigate = useNavigate();
  useRequireLogin();
  const { surveyAnswers, setAnswer, report, setReport } = useApp();
  const [current, setCurrent] = useState(0);
  const [showReanalyze, setShowReanalyze] = useState(false);
  const [animDir, setAnimDir] = useState('right');
  const [visible, setVisible] = useState(true);

  const question = SURVEY_QUESTIONS[current];
  const total = SURVEY_QUESTIONS.length;
  const progress = ((current + 1) / total) * 100;
  const color = CATEGORY_COLORS[question.category] || CATEGORY_COLORS['수면'];
  const answered = Object.values(surveyAnswers).filter((v) => v > 0).length;
  const allAnswered = answered === total; // 18문항 전부 완료

  const goTo = (dir) => {
    setAnimDir(dir);
    setVisible(false);
    setTimeout(() => {
      if (dir === 'right' && current < total - 1) setCurrent((c) => c + 1);
      else if (dir === 'left' && current > 0) setCurrent((c) => c - 1);
      setVisible(true);
    }, 200);
  };

  const handleAnswer = (val) => {
    setAnswer(question.id, val);
    if (current < total - 1) {
      setTimeout(() => goTo('right'), 300);
    }
  };

  const canFinish = answered >= total * 0.8;

  // 2026.8.20 — 재분석 확인.
  // /report에서 뒤로가기로 이 화면에 돌아온 뒤 '분석 시작'을 누르면 같은 설문으로
  // 유료 Gemini 호출이 다시 나가고 리포트가 중복 저장된다(분석 횟수·챌린지 집계도
  // 함께 왜곡됨). 막지는 않되, 비용이 발생한다는 사실을 반드시 알린다.
  const startAnalysis = () => {
    if (report?.shareId) {
      setShowReanalyze(true);
      return;
    }
    navigate('/analyzing');
  };

  const confirmReanalyze = () => {
    setReport(null);
    setShowReanalyze(false);
    navigate('/analyzing');
  };

  return (
    <div className="page-container">
      {/* 헤더 + 진행바 */}
      <div className="bg-white/90 backdrop-blur-sm sticky top-0 z-10 px-4 pt-4 pb-3 border-b border-cream-deeper">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => navigate('/upload')}
            className="p-2 hover:bg-cream-dark rounded-full transition-colors"
          >
            <ChevronLeft size={20} className="text-[#7A6060]" />
          </button>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <h2 className="font-bold text-[#3D2B2B] text-sm">건강 설문</h2>
              <span className="text-xs text-[#7A6060] font-medium">
                {current + 1} / {total}
              </span>
            </div>
            <div className="h-2 bg-cream-deeper rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-gradient rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* 카테고리 탭 */}
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {['수면', '식습관', '스트레스', '갱년기', '영양'].map((cat) => {
            const isCurrent = question.category === cat;
            const c = CATEGORY_COLORS[cat];
            return (
              <div
                key={cat}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                  isCurrent ? `${c.bg} ${c.text} border ${c.border}` : 'text-[#8A7A7A]'
                }`}
              >
                {cat}
              </div>
            );
          })}
        </div>
      </div>

      {/* 문항 카드 */}
      <div className="p-4 pb-48">
        <div
          className="transition-all duration-200"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateX(0)' : animDir === 'right' ? 'translateX(-20px)' : 'translateX(20px)',
          }}
        >
          {/* 카테고리 배지 */}
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4 ${color.bg} ${color.text} border ${color.border}`}>
            <div className={`w-2 h-2 rounded-full ${color.dot}`} />
            {question.category}
          </div>

          {/* 솔직 답변 유도 넛지 — 첫 문항에서만 노출 (자기보고 편향 완화용, 2026.7.3 추가) */}
          {current === 0 && (
            <div className="mb-4 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-2">
              <span className="text-base leading-none mt-0.5">💡</span>
              <p className="text-xs text-[#8A6D3B] leading-relaxed">
                망설여지는 항목도 있는 그대로, 솔직하게 답변해주세요. 실제와 다르게 답하면 리포트 정확도가 떨어질 수 있어요.
              </p>
            </div>
          )}

          {/* 문항 */}
          <div className="card mb-6">
            <div className="text-center py-4">
              <div className="text-5xl mb-4">{question.emoji}</div>
              <p className="text-xl font-bold text-[#3D2B2B] leading-snug mb-2">
                {question.text}
              </p>
              <p className="text-sm text-[#7A6060]">최근 2주 기준으로 답해주세요</p>
            </div>
          </div>

          {/* 점수 선택 */}
          <div className="space-y-3 mb-6">
            {[1, 2, 3, 4, 5].map((val) => {
              const selected = surveyAnswers[question.id] === val;
              const label = SCORE_LABELS[val - 1];
              return (
                <button
                  key={val}
                  id={`score-${question.id}-${val}`}
                  onClick={() => handleAnswer(val)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 ${
                    selected
                      ? 'border-rose-gold bg-gradient-to-r from-rose-gold/10 to-mauve/10 shadow-rose'
                      : 'border-cream-deeper bg-white hover:border-rose-gold-light hover:bg-cream-dark'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 transition-all duration-200 ${
                      selected ? 'bg-rose-gradient text-white shadow-rose' : 'bg-cream-deeper text-[#7A6060]'
                    }`}
                  >
                    {val}
                  </div>
                  <span className={`text-sm font-semibold leading-tight text-left ${selected ? 'text-rose-gold' : 'text-[#5A4A4A]'}`}>
                    {label.replace('\n', ' ')}
                  </span>
                  {selected && (
                    <div className="ml-auto w-6 h-6 rounded-full bg-rose-gold flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 이전/다음 내비게이션 */}
        <div className="flex gap-3">
          <button
            onClick={() => goTo('left')}
            disabled={current === 0}
            className="flex-1 btn-secondary flex items-center justify-center gap-2 disabled:opacity-30"
          >
            <ChevronLeft size={18} />
            이전
          </button>

          {current < total - 1 ? (
            <button
              onClick={() => goTo('right')}
              className="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              다음
              <ChevronRight size={18} />
            </button>
          ) : (
            <button
              id="survey-complete-btn"
              onClick={startAnalysis}
              disabled={!canFinish}
              className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
            >
              ✨ 분석 시작
            </button>
          )}
        </div>

        {/* 완료 상태 */}
        <div className="mt-4 text-center">
          <p className="text-xs text-[#7A6060]">
            답변 완료:{' '}
            <span className={`font-semibold ${allAnswered ? 'text-green-500' : 'text-rose-gold'}`}>
              {answered}
            </span>
            {' '}/ {total}문항
            {allAnswered && <span className="ml-1 text-green-500">✓ 완료</span>}
          </p>
        </div>
      </div>

      {/* 하단 고정 버튼 영역 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pb-6 pt-4 bg-cream-gradient border-t border-cream-deeper">
        {/* 18문항 전부 완료 시 분석 시작 버튼 표시 */}
        {allAnswered ? (
          <div className="space-y-2">
            <button
              id="analyze-now-btn"
              onClick={startAnalysis}
              className="btn-primary w-full flex items-center justify-center gap-2 animate-pulse-soft"
            >
              <Sparkles size={18} />
              AI 분석 시작하기
            </button>
            <p className="text-xs text-center text-green-500 font-semibold">
              ✅ 18문항 모두 완료! 지금 바로 분석할 수 있어요
            </p>
          </div>
        ) : (
          <p className="text-xs text-center text-[#8A7A7A] py-2">
            답변 완료: <span className="text-rose-gold font-semibold">{answered}</span> / {total}문항
            {answered >= total * 0.8 && (
              <span className="ml-1 text-[#7A6060]">· 80% 이상 완료 시 분석 가능</span>
            )}
          </p>
        )}
      </div>

      {/* 재분석 확인 모달 (2026.8.20 — 뒤로가기 후 중복 분석 방지) */}
      {showReanalyze && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50"
          onClick={(e) => e.target === e.currentTarget && setShowReanalyze(false)}
        >
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 animate-slide-up">
            <h2 className="text-lg font-bold text-[#3D2B2B] mb-2">이미 분석한 결과가 있어요</h2>
            <p className="text-sm text-[#7A6060] leading-relaxed mb-5">
              지금 다시 분석하면 <span className="font-semibold text-[#3D2B2B]">분석 횟수가 1회 더 사용되고</span>,
              새 리포트가 별도로 저장됩니다. 설문을 바꾸지 않으셨다면 기존 리포트를 그대로 보셔도 됩니다.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => { setShowReanalyze(false); navigate('/report'); }}
                className="btn-primary w-full"
              >
                기존 리포트 보기
              </button>
              <button
                onClick={confirmReanalyze}
                className="w-full py-3 rounded-2xl font-bold text-sm border border-rose-gold/40 text-rose-gold bg-white active:scale-95 transition-all"
              >
                새로 분석하기 (1회 사용)
              </button>
              <button
                onClick={() => setShowReanalyze(false)}
                className="w-full py-2 text-sm text-[#8A7A7A]"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
