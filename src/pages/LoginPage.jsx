// src/pages/LoginPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Shield } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // URL ?ref=코드 를 localStorage에 저장 (비로그인 시작 시에도 유지)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      localStorage.setItem('referralCode', ref);
    }
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      const userRef = doc(db, 'users', firebaseUser.uid);
      const snap = await getDoc(userRef);
      const refCode = localStorage.getItem('referralCode');

      if (!snap.exists()) {
        await setDoc(userRef, {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          createdAt: serverTimestamp(),
          subscriptionStatus: 'free_trial',
          trialStartDate: serverTimestamp(),
          analysisCount: 0,
          ...(refCode && { referredBy: refCode }),
        });
        if (refCode) localStorage.removeItem('referralCode');
      } else {
        const existingData = snap.data();
        const updateData = { lastLoginAt: serverTimestamp() };
        // 기존 referredBy가 없는 경우에만 저장
        if (refCode && !existingData.referredBy) {
          updateData.referredBy = refCode;
          localStorage.removeItem('referralCode');
        }
        await updateDoc(userRef, updateData);
      }

      navigate('/');
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-br from-rose-gold/20 to-mauve/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-gradient-to-tr from-mauve/15 to-rose-gold/15 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen px-6 py-12 items-center justify-center">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-3xl bg-rose-gradient shadow-rose flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🌸</span>
            </div>
            <h1 className="text-2xl font-black text-gradient">웰핏+ CHECK-UP</h1>
            <p className="text-sm text-[#7A6060] mt-2">AI 건강 분석을 시작하려면 로그인하세요</p>
          </div>

          <div className="card-glass p-6 space-y-4">
            <div className="bg-purple-50 rounded-xl p-3 text-center">
              <p className="text-sm font-bold text-[#8B5E83]">
                로그인하면 기록 저장 + 레퍼럴 혜택을 받을 수 있어요
              </p>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded-2xl transition-all shadow-sm disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
                <path fill="#34A853" d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.565 24 12.255 24z" />
                <path fill="#FBBC05" d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z" />
                <path fill="#EA4335" d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
              </svg>
              {loading ? '로그인 중...' : 'Google로 시작하기'}
            </button>

            {error && (
              <div className="bg-red-50 text-red-500 text-sm rounded-xl px-4 py-3 border border-red-100 text-center">
                {error}
              </div>
            )}

            <button
              onClick={() => navigate('/upload')}
              className="w-full text-xs text-[#B0A0A0] hover:text-[#9A8080] transition-colors text-center py-1"
            >
              로그인 없이 시작하기
            </button>

            <button
              onClick={() => navigate('/')}
              className="w-full text-sm text-[#9A8080] hover:text-rose-gold transition-colors text-center py-2"
            >
              돌아가기
            </button>
          </div>

          <div className="flex items-center gap-2 justify-center mt-6">
            <Shield size={12} className="text-[#B0A0A0]" />
            <p className="text-xs text-[#B0A0A0] text-center">
              약 5분 소요 · 무료 · 안전한 데이터 보호
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
