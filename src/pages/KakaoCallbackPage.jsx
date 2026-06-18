// src/pages/KakaoCallbackPage.jsx
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

export default function KakaoCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const processKakaoLogin = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      if (!code) { setError('인증 코드가 없습니다.'); return; }

      try {
        // 1. 카카오 액세스 토큰 발급
        const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: import.meta.env.VITE_KAKAO_REST_API_KEY,
            redirect_uri: window.location.origin + '/auth/kakao',
            code,
          }),
        });
        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) throw new Error('카카오 토큰 발급 실패');

        // 2. Cloud Functions으로 Firebase 커스텀 토큰 발급
        const customTokenRes = await fetch(`${FUNCTIONS_BASE}/kakaoCustomToken`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: tokenData.access_token }),
        });
        const { customToken, uid, email, displayName, photoURL } = await customTokenRes.json();

        // 3. Firebase 로그인
        await signInWithCustomToken(auth, customToken);

        // 4. Firestore 유저 문서 처리
        const userRef = doc(db, 'users', uid);
        const snap = await getDoc(userRef);
        const refCode = getReferralCode();

        if (!snap.exists()) {
          const newCode = generateReferralCode(email);
          await setDoc(userRef, {
            uid, email, displayName, photoURL,
            provider: 'kakao',
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
        console.error('카카오 로그인 오류:', err);
        setError('카카오 로그인 중 오류가 발생했습니다.');
      }
    };

    processKakaoLogin();
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
      <p style={{ fontSize: 14, color: '#9A8080' }}>카카오 로그인 처리 중...</p>
    </div>
  );
}
