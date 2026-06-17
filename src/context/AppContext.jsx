// src/context/AppContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AppContext = createContext(null);

export const SURVEY_QUESTIONS = [
  { id: 'sleep1', category: '수면', text: '잠들기 어렵다', emoji: '😴', categoryColor: 'text-blue-500' },
  { id: 'sleep2', category: '수면', text: '자다가 자주 깬다', emoji: '🌙', categoryColor: 'text-blue-500' },
  { id: 'sleep3', category: '수면', text: '아침에 일어나도 피곤하다', emoji: '☀️', categoryColor: 'text-blue-500' },
  { id: 'diet1', category: '식습관', text: '최근 식욕이 변했다', emoji: '🍽️', categoryColor: 'text-green-500' },
  { id: 'diet2', category: '식습관', text: '체중 변화가 생겼다', emoji: '⚖️', categoryColor: 'text-green-500' },
  { id: 'diet3', category: '식습관', text: '소화가 불편하다', emoji: '🫃', categoryColor: 'text-green-500' },
  { id: 'stress1', category: '스트레스', text: '집중력이 떨어진다', emoji: '🧠', categoryColor: 'text-orange-500' },
  { id: 'stress2', category: '스트레스', text: '감정 기복이 심하다', emoji: '🌊', categoryColor: 'text-orange-500' },
  { id: 'stress3', category: '스트레스', text: '만성 피로를 느낀다', emoji: '😮‍💨', categoryColor: 'text-orange-500' },
  { id: 'meno1', category: '갱년기', text: '얼굴이나 상체에 열감이 있다', emoji: '🔥', categoryColor: 'text-red-400' },
  { id: 'meno2', category: '갱년기', text: '식은땀이 난다', emoji: '💧', categoryColor: 'text-red-400' },
  { id: 'meno3', category: '갱년기', text: '관절이 불편하다', emoji: '🦴', categoryColor: 'text-red-400' },
  { id: 'meno4', category: '갱년기', text: '피부가 건조하거나 가렵다', emoji: '🌿', categoryColor: 'text-red-400' },
  { id: 'nutri1', category: '영양', text: '머리카락이 많이 빠진다', emoji: '💆', categoryColor: 'text-purple-500' },
  { id: 'nutri2', category: '영양', text: '손톱이 잘 부러지거나 변색되었다', emoji: '💅', categoryColor: 'text-purple-500' },
  { id: 'nutri3', category: '영양', text: '피부가 건조하고 윤기가 없다', emoji: '✨', categoryColor: 'text-purple-500' },
  { id: 'nutri4', category: '영양', text: '이유 없이 무기력하고 의욕이 없다', emoji: '🪴', categoryColor: 'text-purple-500' },
  { id: 'extra1', category: '영양', text: '운동을 주 1회 미만 한다', emoji: '🏃', categoryColor: 'text-purple-500' },
];

const initialSurvey = Object.fromEntries(SURVEY_QUESTIONS.map((q) => [q.id, 0]));

// ── 추천코드 자동생성: 이름 앞 2글자 + 숫자 4자리
function generateReferralCode(user) {
  // 이메일 앞부분에서 영문자만 추출 → 2자리 대문자 + 숫자 4자리
  const emailLocal = (user.email || '').split('@')[0];
  const letters = emailLocal.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || 'WF';
  const prefix = letters.length < 2 ? letters.padEnd(2, 'W') : letters;
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${num}`;
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [myReferralCode, setMyReferralCode] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const snap = await getDoc(userRef);
        const data = snap.exists() ? snap.data() : {};

        // ── 신규 유저: Firestore 문서 초기화
        if (!snap.exists()) {
          const newCode = generateReferralCode(firebaseUser);
          // localStorage에 저장된 레퍼럴코드 확인 (7일 내)
          const savedRef = localStorage.getItem('referralCode');
          const savedExpiry = parseInt(localStorage.getItem('referralCodeExpiry') || '0');
          const referredBy = (savedRef && Date.now() < savedExpiry) ? savedRef : null;

          await setDoc(userRef, {
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || '',
            myReferralCode: newCode,
            referredBy: referredBy,
            subscriptionStatus: 'free_trial',
            trialStartDate: new Date().toISOString(),
            analysisCount: 0,
            directPartners: 0,      // 직접 모집한 구독고객 수 (수동 업데이트)
            partnerCustomers: 0,    // 파트너들이 모집한 구독고객 수 (수동 업데이트)
            totalEarnings: 0,       // 누적 수익 (수동 업데이트)
            thisMonthEarnings: 0,   // 이번달 수익 (수동 업데이트)
            createdAt: new Date().toISOString(),
          });
          setMyReferralCode(newCode);
          // 사용된 레퍼럴코드 localStorage 정리
          if (referredBy) {
            localStorage.removeItem('referralCode');
            localStorage.removeItem('referralCodeExpiry');
          }
        } else {
          // ── 기존 유저: 코드가 없거나 한글 포함인 경우에만 재생성
          // 정상 코드(영문2+숫자4 = 6자리)면 절대 변경 안 함
          const existingCode = data.myReferralCode || '';
          const isValidCode = /^[A-Z]{2}[0-9]{4}$/.test(existingCode);
          if (!isValidCode) {
            const newCode = generateReferralCode(firebaseUser);
            await updateDoc(userRef, { myReferralCode: newCode });
            setMyReferralCode(newCode);
          } else {
            setMyReferralCode(existingCode);
          }
        }

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          subscriptionStatus: data.subscriptionStatus || 'free_trial',
          trialStartDate: data.trialStartDate || null,
          analysisCount: data.analysisCount || 0,
          referredBy: data.referredBy || null,
          directPartners: data.directPartners || 0,
          partnerCustomers: data.partnerCustomers || 0,
          totalEarnings: data.totalEarnings || 0,
          thisMonthEarnings: data.thisMonthEarnings || 0,
        });
      } else {
        setUser((prev) => (prev?.isGuest ? prev : null));
        setMyReferralCode('');
      }
    });
    return () => unsubscribe();
  }, []);

  // ?ref= 파라미터 처리 (7일 보관)
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

  const [faceImage, setFaceImage] = useState(null);
  const [nailImage, setNailImage] = useState(null);
  const [surveyAnswers, setSurveyAnswers] = useState(initialSurvey);
  const [actualAge, setActualAge] = useState('');
  const [gender, setGender] = useState('');
  const [report, setReport] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const setAnswer = (id, value) => {
    setSurveyAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const resetAll = () => {
    setFaceImage(null);
    setNailImage(null);
    setSurveyAnswers(initialSurvey);
    setActualAge('');
    setGender('');
    setReport(null);
  };

  return (
    <AppContext.Provider
      value={{
        user, setUser,
        myReferralCode, setMyReferralCode,
        faceImage, setFaceImage,
        nailImage, setNailImage,
        surveyAnswers, setAnswer,
        actualAge, setActualAge,
        gender, setGender,
        report, setReport,
        isAnalyzing, setIsAnalyzing,
        resetAll,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
