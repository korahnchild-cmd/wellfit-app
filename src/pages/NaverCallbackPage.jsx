// src/pages/NaverCallbackPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithCustomToken } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

const FUNCTIONS_BASE = 'https://us-central1-wellfit-checkup.cloudfunctions.net';

function getReferralCode() {
  const code = localStorage.getItem('referralCode');
  if (!code) return null;
  const expiry = localStorage.getItem('referralCodeExpiry');
  if (expiry && Date.now() > Number(expiry)) {
    localStorage.removeItem('referralCode');
    localStorage.removeItem('referralCodeExpiry');
    return null;
  }
  return code;
}

function generateReferralCode(email) {
  const emailLocal = (email || '').split('@')[0];
  const letters = emailLocal.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || 'WF';
  const prefix = letters.length < 2 ? letters.padEnd(2, 'W') : letters;
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${num}`;
}

export default function NaverCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const processNaverLogin = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const state = params.get('state');
      const savedState = sessionStorage.getItem('naverState');

      if (!code) { setError('인증 코드가 없습니다.'); return; }
      if (state !== savedState) { setError('잘못된 접근입니다.'); return; }
      sessionStorage.removeItem('naverState');

      try {
        // 1. 네이버 액세스 토큰 발급 (CORS 우회 — Cloud Functions 경유)
        const customTokenRes = await fetch(`${FUNCTIONS_BASE}/naverCustomToken`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            state,
            clientId: import.meta.env.VITE_NAVER_CLIENT_ID,
            clientSecret: import.meta.env.VITE_NAVER_CLIENT_SECRET,
            redirectUri: window.location.origin + '/auth/naver',
          }),
        });
        const { customToken, uid, email, displayName, photoURL } = await customTokenRes.json();
        if (!customToken) throw new Error('네이버 토큰 발급 실패');

        // 2. Firebase 로그인
        await signInWithCustomToken(auth, customToken);

        // 3. Firestore 유저 문서 처리
        const userRef = doc(db, 'users', uid);
        const snap = await getDoc(userRef);
        const refCode = getReferralCode();

        if (!snap.exists()) {
          const newCode = generateReferralCode(email);
          await setDoc(userRef, {
            uid, email, displayName, photoURL,
            provider: 'naver',
            myReferralCode: newCode,
            referredBy: refCode || null,
            subscriptionStatus: 'free_trial',
            trialStartDate: new Date().toISOString(),
            analysisCount: 0,
            directPartners: 0,
            partnerCustomers: 0,
            totalEarnings: 0,
            thisMonthEarnings: 0,
            createdAt: new Date().toISOString(),
          });
          if (refCode) { localStorage.removeItem('referralCode'); localStorage.removeItem('referralCodeExpiry'); }
        } else {
          const d = snap.data();
          const updateData = { lastLoginAt: serverTimestamp() };
          if (refCode && !d.referredBy) { updateData.referredBy = refCode; localStorage.removeItem('referralCode'); localStorage.removeItem('referralCodeExpiry'); }
          if (!d.myReferralCode) updateData.myReferralCode = generateReferralCode(email);
          await updateDoc(userRef, updateData);
        }

        navigate('/');
      } catch (err) {
        console.error('네이버 로그인 오류:', err);
        setError('네이버 로그인 중 오류가 발생했습니다.');
      }
    };

    processNaverLogin();
  }, [navigate]);

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: 'Pretendard, sans-serif' }}>
      <div style={{ fontSize: 48 }}>😢</div>
      <p style={{ fontSize: 15, color: '#3D2B2B', fontWeight: 700 }}>{error}</p>
      <button onClick={() => navigate('/login')} style={{ padding: '12px 24px', background: 'linear-gradient(135deg,#C8956C,#8B5E83)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
        다시 로그인
      </button>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: 'Pretendard, sans-serif', background: '#FDFAF6' }}>
      <div className="spinner-rose" />
      <p style={{ fontSize: 14, color: '#9A8080' }}>네이버 로그인 처리 중...</p>
    </div>
  );
}
