// src/pages/HomePage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../firebase';
import { useApp } from '../context/AppContext';
import { Link } from 'react-router-dom';
import { X, Mail, Lock, Eye, EyeOff, Sparkles, Shield } from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();
  const { user, setUser } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let ref = params.get('ref');
    if (!ref && params.has('q')) {
      const qParams = new URLSearchParams(params.get('q'));
      ref = qParams.get('ref');
    }
    if (ref) {
      localStorage.setItem('referralCode', ref);
      localStorage.setItem('referralCodeExpiry', String(Date.now() + 7 * 24 * 60 * 60 * 1000));
    }
  }, []);

  const handleStart = () => {
    if (user) {
      navigate('/upload');
    } else {
      navigate('/login');
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let userCred;
      if (isLogin) {
        userCred = await signInWithEmailAndPassword(auth, email, password);
      } else {
        userCred = await createUserWithEmailAndPassword(auth, email, password);
      }
      setUser(userCred.user);
      setShowModal(false);
      navigate('/upload');
    } catch (err) {
      const msgs = {
        'auth/user-not-found': '등록되지 않은 이메일입니다.',
        'auth/wrong-password': '비밀번호가 올바르지 않습니다.',
        'auth/email-already-in-use': '이미 사용 중인 이메일입니다.',
        'auth/weak-password': '비밀번호는 6자 이상이어야 합니다.',
        'auth/invalid-email': '이메일 형식을 확인해주세요.',
        'auth/invalid-credential': '이메일 또는 비밀번호를 확인해주세요.',
      };
      setError(msgs[err.code] || '오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestMode = () => {
    setUser({ uid: 'guest', email: 'guest@wellfit.com', isGuest: true });
    setShowModal(false);
    navigate('/upload');
  };

  return (
    <div className="page-container overflow-hidden">
      {/* 배경 장식 — 원본 그대로 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-br from-rose-gold/20 to-mauve/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-gradient-to-tr from-mauve/15 to-rose-gold/15 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-cream-deeper/50 blur-2xl" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen px-6 py-12">
        {/* 상단 배지 — 원본 그대로 */}
        <div className="flex justify-center mb-8 animate-fade-in">
          <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm border border-white/80">
            <Sparkles size={14} className="text-rose-gold" />
            <span className="text-xs font-medium text-mauve">AI 건강 분석 서비스</span>
          </div>
        </div>

        {/* 메인 로고 — 아이콘만 교체 */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          {/* 스캐너 시각 요소 */}
          <div className="animate-slide-up mb-2" style={{ animationDelay: '0s' }}>
            <div style={{ position: 'relative', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* 외부 회전 링 */}
              <div style={{
                position: 'absolute', width: '160px', height: '160px',
                border: '1.5px solid rgba(200,149,108,0.2)', borderRadius: '50%',
                animation: 'wf-spin 18s linear infinite',
              }} />
              <div style={{
                position: 'absolute', width: '124px', height: '124px',
                border: '1px dashed rgba(139,94,131,0.18)', borderRadius: '50%',
                animation: 'wf-spin 12s linear infinite reverse',
              }} />
              {/* 스캔 라인 */}
              <div style={{
                position: 'absolute', left: '50%', transform: 'translateX(-50%)',
                width: '120px', height: '2px',
                background: 'linear-gradient(90deg, transparent, rgba(200,149,108,0.7), transparent)',
                boxShadow: '0 0 10px rgba(200,149,108,0.4)',
                animation: 'wf-scan 2.8s ease-in-out infinite',
                zIndex: 3,
              }} />
              {/* 파티클 */}
              {[
                { w:4,h:4,top:'22%',left:'20%',delay:'0s' },
                { w:5,h:5,top:'28%',right:'18%',delay:'0.6s' },
                { w:3,h:3,bottom:'28%',left:'26%',delay:'1.1s' },
                { w:4,h:4,bottom:'22%',right:'22%',delay:'1.7s' },
              ].map((p, i) => (
                <div key={i} style={{
                  position: 'absolute', width: p.w, height: p.h,
                  borderRadius: '50%', background: '#C8956C', opacity: 0.5,
                  top: p.top, left: p.left, right: p.right, bottom: p.bottom,
                  animation: `wf-float 3s ease-in-out ${p.delay} infinite`,
                }} />
              ))}
              {/* 중앙 아이콘 */}
              <div className="animate-float" style={{ position: 'relative', zIndex: 2 }}>
                <div className="relative">
                  <div className="w-28 h-28 rounded-3xl bg-rose-gradient shadow-rose flex items-center justify-center mx-auto">
                {/* 🌸 → 분자구조+AI 복합 SVG 아이콘 */}
                <svg width="72" height="72" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="32" cy="32" r="29" stroke="rgba(255,255,255,0.22)" strokeWidth="1" fill="none" />
                  <polygon points="32,14 43,20 43,34 32,40 21,34 21,20"
                    stroke="rgba(255,255,255,0.85)" strokeWidth="1.6" fill="rgba(255,255,255,0.08)" />
                  <circle cx="32" cy="27" r="5.5" fill="rgba(255,255,255,0.95)" />
                  <text x="32" y="30.5" textAnchor="middle" fontSize="6" fontWeight="800"
                    fill="#8B5E83" fontFamily="-apple-system,sans-serif" letterSpacing="-0.3">AI</text>
                  <circle cx="32" cy="11" r="2.8" fill="rgba(255,255,255,0.9)" />
                  <circle cx="46" cy="18" r="2.8" fill="rgba(255,255,255,0.9)" />
                  <circle cx="46" cy="36" r="2.8" fill="rgba(255,255,255,0.9)" />
                  <circle cx="32" cy="43" r="2.8" fill="rgba(255,255,255,0.9)" />
                  <circle cx="18" cy="36" r="2.8" fill="rgba(255,255,255,0.9)" />
                  <circle cx="18" cy="18" r="2.8" fill="rgba(255,255,255,0.9)" />
                  <line x1="32" y1="13.8" x2="32" y2="21" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2"/>
                  <line x1="43.6" y1="19.4" x2="39" y2="22" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2"/>
                  <line x1="43.6" y1="34.6" x2="39" y2="32" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2"/>
                  <line x1="32" y1="40.2" x2="32" y2="33" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2"/>
                  <line x1="20.4" y1="34.6" x2="25" y2="32" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2"/>
                  <line x1="20.4" y1="19.4" x2="25" y2="22" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2"/>
                  <polyline points="14,52 20,52 23,46 27,58 31,49 35,52 41,52 44,46 48,52 50,52"
                    stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              {/* Heart → AI 뱃지 */}
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-mauve rounded-2xl flex items-center justify-center shadow-mauve">
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>AI</span>
              </div>
                </div>
              </div>
            </div>

            {/* 스캐너 keyframes */}
            <style>{`
              @keyframes wf-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
              @keyframes wf-scan {
                0% { top: 10%; opacity: 0; }
                15% { opacity: 1; }
                85% { opacity: 1; }
                100% { top: 90%; opacity: 0; }
              }
              @keyframes wf-float {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-7px); }
              }
            `}</style>
          </div>

          {/* 서비스명 */}
          <div className="mb-3 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <h1 className="text-3xl font-black text-gradient leading-tight">
              웰핏+ CHECK-UP
            </h1>
            <div className="text-xs font-medium text-rose-gold-dark mt-1 tracking-widest uppercase">
              Wellness AI Health Report
            </div>
          </div>

          <p className="text-xl font-bold text-[#3D2B2B] mb-3 animate-slide-up leading-snug" style={{ animationDelay: '0.2s' }}>
            내 몸이 보내는 신호를<br />
            읽어드립니다
          </p>

          <p className="text-sm text-[#7A6060] mb-10 animate-slide-up leading-relaxed" style={{ animationDelay: '0.3s' }}>
            셀카 한 장과 간단한 설문으로<br />
            <span className="text-rose-gold font-semibold">AI가 분석하는 나만의 건강 리포트</span>를 받아보세요
          </p>

          {/* 특징 카드 */}
          <div className="grid grid-cols-3 gap-2.5 w-full mb-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            {(() => {
              const cards = [
                {
                  label: '셀카 분석', sub: '얼굴·손톱',
                  grad: 'linear-gradient(135deg,#C8956C,#D4A882)',
                  line: '#C8956C', shadow: 'rgba(200,149,108,0.28)',
                  path: 'camera',
                },
                {
                  label: '18문항', sub: '건강 설문',
                  grad: 'linear-gradient(135deg,#9B6FA8,#8B5E83)',
                  line: '#8B5E83', shadow: 'rgba(139,94,131,0.25)',
                  path: 'survey',
                },
                {
                  label: 'AI 리포트', sub: '맞춤 분석',
                  grad: 'linear-gradient(135deg,#7DBFA8,#5DA898)',
                  line: '#7DBFA8', shadow: 'rgba(125,191,168,0.25)',
                  path: 'report',
                },
              ];
              return cards.map((c, i) => (
                <div key={c.label} style={{
                  position:'relative', background:'rgba(255,255,255,0.72)',
                  backdropFilter:'blur(12px)', borderRadius:'18px',
                  border:'1px solid rgba(255,255,255,0.9)',
                  boxShadow:`0 4px 20px ${c.shadow},0 1px 4px rgba(0,0,0,0.04)`,
                  overflow:'hidden', padding:'18px 8px 14px', textAlign:'center',
                }}>
                  {/* 상단 컬러 라인 */}
                  <div style={{ position:'absolute',top:0,left:0,right:0,height:'3px',background:c.line }} />
                  {/* 아이콘 박스 */}
                  <div style={{
                    position:'relative', width:'48px', height:'48px', borderRadius:'14px',
                    background:c.grad, display:'flex', alignItems:'center',
                    justifyContent:'center', margin:'0 auto 10px',
                    boxShadow:`0 4px 14px ${c.shadow}`,
                  }}>
                    {c.path === 'camera' && (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <rect x="2" y="5" width="20" height="15" rx="2.5" stroke="white" strokeWidth="1.7" fill="none"/>
                        <circle cx="12" cy="12.5" r="3.8" stroke="white" strokeWidth="1.7" fill="none"/>
                        <circle cx="12" cy="12.5" r="1.4" fill="white"/>
                        <path d="M8.5 5V3.5M15.5 5V3.5" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
                        <circle cx="18.2" cy="8" r="1" fill="white"/>
                      </svg>
                    )}
                    {c.path === 'survey' && (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <rect x="4" y="2" width="16" height="20" rx="2.5" stroke="white" strokeWidth="1.7" fill="none"/>
                        <line x1="7.5" y1="7" x2="16.5" y2="7" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
                        <line x1="7.5" y1="11" x2="16.5" y2="11" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
                        <line x1="7.5" y1="15" x2="13" y2="15" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
                        <circle cx="16.5" cy="16.5" r="3" fill="white" fillOpacity="0.92"/>
                        <path d="M15.1 16.5L16.1 17.5L18.1 15.5" stroke="#8B5E83" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                    {c.path === 'report' && (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="3" width="18" height="18" rx="2.5" stroke="white" strokeWidth="1.7" fill="none"/>
                        <polyline points="6,16 9,11 12,13.5 15,8 18,11" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                        <circle cx="18" cy="11" r="1.4" fill="white"/>
                        <text x="12" y="21" textAnchor="middle" fontSize="4.5" fill="white" fontWeight="800" fontFamily="-apple-system,sans-serif" letterSpacing="0.3">AI</text>
                      </svg>
                    )}
                    {/* pulse 링 */}
                    <div style={{
                      position:'absolute', inset:0, borderRadius:'14px',
                      border:`2px solid ${c.line}`,
                      animation:`wf-pulse 2.2s ease-out ${i*0.4}s infinite`,
                    }} />
                  </div>
                  <div style={{ fontSize:'12px', fontWeight:800, color:'#3D2B2B', marginBottom:'2px', letterSpacing:'-0.2px' }}>{c.label}</div>
                  <div style={{ fontSize:'10px', color:'#9A8080', fontWeight:500 }}>{c.sub}</div>
                  {i === 0 && <style>{`@keyframes wf-pulse{0%{transform:scale(1);opacity:.7}100%{transform:scale(1.55);opacity:0}}`}</style>}
                </div>
              ));
            })()}
          </div>

          {/* CTA */}
          <button
            id="start-button"
            onClick={handleStart}
            className="w-full animate-slide-up relative overflow-hidden"
            style={{
              animationDelay: '0.5s',
              background: 'linear-gradient(135deg, #C8956C 0%, #A87898 50%, #8B5E83 100%)',
              color: '#fff',
              fontWeight: 800,
              fontSize: '1.05rem',
              letterSpacing: '-0.3px',
              padding: '18px 0',
              borderRadius: '20px',
              border: 'none',
              boxShadow: '0 8px 32px rgba(200,149,108,0.35), 0 2px 8px rgba(139,94,131,0.18)',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.22,1,0.36,1)',
            }}
          >
            <span style={{ position: 'relative', zIndex: 1 }}>AI 건강 분석 시작하기</span>
            <span style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%)',
              borderRadius: '20px',
              pointerEvents: 'none',
            }} />
          </button>

          {/* 내 정보·추천코드 */}
          {user && !user.isGuest && (
            <button
              onClick={() => navigate('/mypage')}
              className="w-full mt-3 animate-slide-up"
              style={{
                animationDelay: '0.6s',
                padding: '14px 0',
                borderRadius: '16px',
                border: '1.5px solid rgba(200,149,108,0.35)',
                background: 'rgba(253,250,246,0.85)',
                color: '#8B5E83',
                fontWeight: 700,
                fontSize: '0.9rem',
                letterSpacing: '-0.2px',
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.2s ease',
              }}
            >
              내 정보 · 추천코드
            </button>
          )}

          {/* 오늘의 팁 */}
          <div className="w-full mt-4 animate-slide-up" style={{ animationDelay: '0.65s' }}>
            <div style={{
              display: 'flex', gap: '12px', alignItems: 'flex-start',
              background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(10px)',
              border: '1px solid rgba(200,149,108,0.18)',
              borderRadius: '16px', padding: '14px 16px',
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '12px', flexShrink: 0,
                background: 'linear-gradient(135deg, rgba(200,149,108,0.15), rgba(139,94,131,0.12))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px',
              }}>💡</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#C8956C', letterSpacing: '0.8px', marginBottom: '3px', textTransform: 'uppercase' }}>Today's Tip</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#3D2B2B', marginBottom: '2px' }}>셀카 한 장이 혈액검사를 대신할 수 있다면?</div>
                <div style={{ fontSize: '12px', color: '#7A6060', lineHeight: 1.6 }}>특허 기술 기반 AI가 얼굴·손톱에서 호르몬 위험 신호를 읽어냅니다.</div>
              </div>
            </div>
          </div>

          {/* 신뢰 칩 4개 — 폰트 11px */}
          <div className="flex items-center justify-center gap-1 flex-wrap mt-4 animate-slide-up" style={{ animationDelay: '0.6s' }}>
            {['약 5분 소요', '무료 체험', '이미지 미저장', '특허 기술'].map((chip, i) => (
              <span key={chip} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#9A8080' }}>
                <span style={{ color: '#7DBFA8', fontWeight: 700 }}>✓</span>
                {chip}
                {i < 3 && <span style={{ color: '#D0C0C0', margin: '0 2px' }}>·</span>}
              </span>
            ))}
          </div>
        </div>

        {/* 하단 안내 — 원본 그대로 */}
        <div className="mt-8 flex items-center gap-2 justify-center animate-fade-in" style={{ animationDelay: '0.7s' }}>
          <Shield size={12} className="text-cream-deeper" />
          <p className="text-xs text-[#B0A0A0] text-center">
            본 서비스는 의료 진단이 아닌 라이프스타일 코칭 참고 자료입니다
          </p>
        </div>

        {/* 푸터 — 원본 그대로 */}
        <div className="mt-4 flex items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.8s' }}>
          <Link to="/privacy" className="text-xs text-[#B0A0A0] hover:text-rose-gold transition-colors underline underline-offset-2">
            개인정보처리방침
          </Link>
          <span className="text-xs text-[#D0C0C0]">·</span>
          <Link to="/terms" className="text-xs text-[#B0A0A0] hover:text-rose-gold transition-colors underline underline-offset-2">
            이용약관
          </Link>
        </div>
      </div>

      {/* 로그인 모달 — 원본 그대로 */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center modal-backdrop bg-black/40"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#3D2B2B]">
                {isLogin ? '로그인' : '회원가입'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-cream-dark rounded-full transition-colors">
                <X size={20} className="text-[#7A6060]" />
              </button>
            </div>
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-gold" />
                <input id="email-input" type="email" placeholder="이메일 주소" value={email}
                  onChange={(e) => setEmail(e.target.value)} className="input-field pl-10" required />
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-gold" />
                <input id="password-input" type={showPw ? 'text' : 'password'} placeholder="비밀번호 (6자 이상)"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10 pr-10" required minLength={6} />
                <button type="button" onClick={() => setShowPw((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9A8080]">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {error && (
                <div className="bg-red-50 text-red-500 text-sm rounded-xl px-4 py-3 border border-red-100">{error}</div>
              )}
              <button id="auth-submit-btn" type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? '처리 중...' : isLogin ? '로그인하고 시작하기' : '가입하고 시작하기'}
              </button>
            </form>
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-cream-deeper" />
              <span className="text-xs text-[#B0A0A0]">또는</span>
              <div className="flex-1 h-px bg-cream-deeper" />
            </div>
            <button id="guest-mode-btn" onClick={handleGuestMode} className="btn-secondary w-full text-sm">
              로그인 없이 체험하기
            </button>
            <p className="text-center text-sm text-[#9A8080] mt-4">
              {isLogin ? '아직 계정이 없으신가요?' : '이미 계정이 있으신가요?'}{' '}
              <button onClick={() => { setIsLogin((v) => !v); setError(''); }}
                className="text-rose-gold font-semibold hover:text-rose-gold-dark">
                {isLogin ? '회원가입' : '로그인'}
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
