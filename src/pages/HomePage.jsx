// src/pages/HomePage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../firebase';
import { useApp } from '../context/AppContext';
import { X, Mail, Lock, Eye, EyeOff, Sparkles, Heart, Shield } from 'lucide-react';

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
      {/* 배경 장식 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-br from-rose-gold/20 to-mauve/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-gradient-to-tr from-mauve/15 to-rose-gold/15 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-cream-deeper/50 blur-2xl" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen px-6 py-12">
        {/* 상단 배지 */}
        <div className="flex justify-center mb-8 animate-fade-in">
          <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm border border-white/80">
            <Sparkles size={14} className="text-rose-gold" />
            <span className="text-xs font-medium text-mauve">AI 건강 분석 서비스</span>
          </div>
        </div>

        {/* 메인 로고 */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="animate-float mb-6">
            <div className="relative">
              <div className="w-28 h-28 rounded-3xl bg-rose-gradient shadow-rose flex items-center justify-center mx-auto">
                <span className="text-5xl">🌸</span>
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-mauve rounded-2xl flex items-center justify-center shadow-mauve">
                <Heart size={18} className="text-white fill-white" />
              </div>
            </div>
          </div>

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

          {/* 특징 카드들 */}
          <div className="grid grid-cols-3 gap-3 w-full mb-10 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            {[
              { icon: '📸', label: '셀카 분석' },
              { icon: '📋', label: '18문항 설문' },
              { icon: '📊', label: 'AI 리포트' },
            ].map((item) => (
              <div key={item.label} className="card-glass py-4 px-2 text-center">
                <div className="text-2xl mb-1">{item.icon}</div>
                <div className="text-xs font-semibold text-mauve">{item.label}</div>
              </div>
            ))}
          </div>

          {/* CTA 버튼 */}
          <button
            id="start-button"
            onClick={handleStart}
            className="btn-primary w-full text-lg shadow-rose animate-slide-up"
            style={{ animationDelay: '0.5s' }}
          >
            ✨ 시작하기
          </button>

          <p className="text-xs text-[#9A8080] mt-4 animate-slide-up" style={{ animationDelay: '0.6s' }}>
            약 5분 소요 · 무료 · 안전한 데이터 보호
          </p>
        </div>

        {/* 하단 안내 */}
        <div className="mt-8 flex items-center gap-2 justify-center animate-fade-in" style={{ animationDelay: '0.7s' }}>
          <Shield size={12} className="text-cream-deeper" />
          <p className="text-xs text-[#B0A0A0] text-center">
            본 서비스는 의료 진단이 아닌 라이프스타일 코칭 참고 자료입니다
          </p>
        </div>

        {user && !user.isGuest && (
          <div className="mt-3 flex justify-center animate-fade-in" style={{ animationDelay: '0.8s' }}>
            <button
              onClick={() => navigate('/mypage')}
              className="text-xs text-[#B0A0A0] hover:text-rose-gold transition-colors"
            >
              마이페이지
            </button>
          </div>
        )}
      </div>

      {/* 로그인 모달 */}
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
                <input
                  id="email-input"
                  type="email"
                  placeholder="이메일 주소"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  required
                />
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-gold" />
                <input
                  id="password-input"
                  type={showPw ? 'text' : 'password'}
                  placeholder="비밀번호 (6자 이상)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10 pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9A8080]"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {error && (
                <div className="bg-red-50 text-red-500 text-sm rounded-xl px-4 py-3 border border-red-100">
                  {error}
                </div>
              )}

              <button
                id="auth-submit-btn"
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? '처리 중...' : isLogin ? '로그인하고 시작하기' : '가입하고 시작하기'}
              </button>
            </form>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-cream-deeper" />
              <span className="text-xs text-[#B0A0A0]">또는</span>
              <div className="flex-1 h-px bg-cream-deeper" />
            </div>

            <button
              id="guest-mode-btn"
              onClick={handleGuestMode}
              className="btn-secondary w-full text-sm"
            >
              로그인 없이 체험하기
            </button>

            <p className="text-center text-sm text-[#9A8080] mt-4">
              {isLogin ? '아직 계정이 없으신가요?' : '이미 계정이 있으신가요?'}{' '}
              <button
                onClick={() => { setIsLogin((v) => !v); setError(''); }}
                className="text-rose-gold font-semibold hover:text-rose-gold-dark"
              >
                {isLogin ? '회원가입' : '로그인'}
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
