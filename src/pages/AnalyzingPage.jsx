// src/pages/AnalyzingPage.jsx
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { analyzeHealth } from '../gemini';
import { storage, db } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const STEPS = [
  { text: '이미지 업로드 중...', emoji: '📤', duration: 1500 },
  { text: '얼굴 피부 상태 분석 중...', emoji: '🔍', duration: 2000 },
  { text: '손톱 영양 상태 분석 중...', emoji: '💅', duration: 1500 },
  { text: '설문 데이터 처리 중...', emoji: '📋', duration: 1500 },
  { text: 'AI 건강 패턴 학습 중...', emoji: '🧠', duration: 2000 },
  { text: '호르몬 위험도 계산 중...', emoji: '⚗️', duration: 1500 },
  { text: '영양 결핍 지수 산출 중...', emoji: '🔬', duration: 1500 },
  { text: '14일 맞춤 플랜 생성 중...', emoji: '📅', duration: 2000 },
  { text: '리포트 최종 완성 중...', emoji: '✨', duration: 1000 },
];

const withTimeout = (promise, ms, label) => {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`${label} timeout`)), ms)
  );
  return Promise.race([promise, timeout]);
};

export default function AnalyzingPage() {
  const navigate = useNavigate();
  const { faceImage, nailImage, surveyAnswers, actualAge, gender, user, setReport } = useApp();
  const [stepIdx, setStepIdx] = useState(0);
  const [dots, setDots] = useState('');
  const [error, setError] = useState('');
  const analysisStarted = useRef(false);

  useEffect(() => {
    const iv = setInterval(() => setDots((d) => (d.length >= 3 ? '' : d + '.')), 400);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (stepIdx < STEPS.length - 1) {
      const t = setTimeout(() => setStepIdx((s) => s + 1), STEPS[stepIdx]?.duration || 1500);
      return () => clearTimeout(t);
    }
  }, [stepIdx]);

  useEffect(() => {
    if (analysisStarted.current) return;
    analysisStarted.current = true;

    const doAnalysis = async () => {
      console.log('분석 시작!');
      console.log('actualAge:', actualAge);
      console.log('gender:', gender);
      try {
        let faceUrl = null;
        let nailUrl = null;

        // 이미지 업로드 (10초 타임아웃)
        if (user && !user.isGuest && faceImage?.file) {
          try {
            const faceRef = ref(storage, `users/${user.uid}/face_${Date.now()}.jpg`);
            await withTimeout(uploadBytes(faceRef, faceImage.file), 10000, 'face upload');
            faceUrl = await withTimeout(getDownloadURL(faceRef), 5000, 'face url');
          } catch (e) {
            console.warn('Face image upload failed:', e.message);
          }
        }

        if (user && !user.isGuest && nailImage?.file) {
          try {
            const nailRef = ref(storage, `users/${user.uid}/nail_${Date.now()}.jpg`);
            await withTimeout(uploadBytes(nailRef, nailImage.file), 10000, 'nail upload');
            nailUrl = await withTimeout(getDownloadURL(nailRef), 5000, 'nail url');
          } catch (e) {
            console.warn('Nail image upload failed:', e.message);
          }
        }

        const result = await analyzeHealth({
          surveyData: surveyAnswers,
          faceImage: faceImage?.file || null,
          nailImage: nailImage?.file || null,
          actualAge: parseInt(actualAge),
          gender: gender || 'female',
        });

        if (!result.success) throw new Error(result.error || 'AI 분석 실패');

        const reportData = {
          ...result.data,
          actualAge: parseInt(actualAge),
          gender: gender || 'female',
          createdAt: new Date().toISOString(),
          faceImageUrl: faceUrl,
          nailImageUrl: nailUrl,
        };

        // Firestore 저장 (5초 타임아웃 — 실패해도 리포트는 보여줌)
        let shareId = null;
        try {
          const docRef = await withTimeout(
            addDoc(collection(db, 'reports'), {
              userId: user?.uid || 'guest',
              email: user?.email || 'guest',
              reportData,
              surveyAnswers,
              gender: gender || 'female',
              isPublic: true,
              timestamp: serverTimestamp(),
            }),
            5000,
            'Firestore'
          );
          shareId = docRef.id;
          localStorage.setItem('lastShareId', shareId);
          console.log('Firestore 저장 완료:', shareId);
        } catch (e) {
          console.warn('Firestore save failed (타임아웃 포함):', e.message);
        }

        setReport({ ...reportData, shareId });
        setStepIdx(STEPS.length - 1);
        setTimeout(() => navigate('/report'), 1500);
      } catch (err) {
        console.error('Analysis error:', err);
        setError(err.message || '분석 중 오류가 발생했습니다.');
      }
    };

    doAnalysis();
  }, []);

  const progressPct = ((stepIdx + 1) / STEPS.length) * 100;
  const currentStep = STEPS[stepIdx] || STEPS[STEPS.length - 1];

  if (error) {
    return (
      <div className="page-container flex flex-col items-center justify-center p-8 text-center">
        <div className="text-5xl mb-4">😢</div>
        <h2 className="text-xl font-bold text-[#3D2B2B] mb-2">분석 중 오류가 발생했습니다</h2>
        <p className="text-sm text-[#7A6060] mb-6 leading-relaxed">{error}</p>
        <button onClick={() => navigate('/survey')} className="btn-primary">다시 시도</button>
        <button onClick={() => navigate('/')} className="text-sm text-[#9A8080] mt-3">홈으로 돌아가기</button>
      </div>
    );
  }

  return (
    <div className="page-container flex flex-col items-center justify-center min-h-screen p-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-rose-gold/10 blur-3xl animate-pulse-soft" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-mauve/10 blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
      </div>
      <div className="relative z-10 text-center w-full max-w-sm">
        <div className="relative flex items-center justify-center mb-8">
          <div className="absolute w-32 h-32 rounded-full border-4 border-rose-gold/20" style={{ animation: 'spin 8s linear infinite reverse' }} />
          <div className="absolute w-24 h-24 rounded-full border-4 border-dashed border-mauve/30" style={{ animation: 'spin 5s linear infinite' }} />
          <div className="spinner-large" />
          <div className="absolute w-16 h-16 rounded-full bg-rose-gradient flex items-center justify-center shadow-rose">
            <span className="text-2xl">{currentStep.emoji}</span>
          </div>
        </div>
        <h2 className="text-2xl font-black text-gradient mb-2">AI 분석 중{dots}</h2>
        <p className="text-[#7A6060] text-sm mb-8 min-h-[20px] transition-all duration-300">{currentStep.text}</p>
        <div className="bg-cream-deeper rounded-full h-3 mb-3 overflow-hidden">
          <div className="h-full bg-rose-gradient rounded-full transition-all duration-700 ease-out" style={{ width: `${progressPct}%` }} />
        </div>
        <p className="text-xs text-[#B0A0A0] mb-8">{Math.round(progressPct)}% 완료</p>
        <div className="space-y-2 text-left bg-white/60 backdrop-blur-sm rounded-3xl p-4 border border-white/80">
          {STEPS.slice(0, Math.min(stepIdx + 1, STEPS.length)).map((step, i) => (
            <div key={i} className="flex items-center gap-3 text-xs text-[#7A6060] animate-fade-in">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${i < stepIdx ? 'bg-green-100 text-green-500' : i === stepIdx ? 'bg-rose-gold/20 text-rose-gold' : 'bg-cream-deeper text-[#C0B0B0]'}`}>
                {i < stepIdx ? '✓' : i === stepIdx ? '●' : '○'}
              </div>
              <span className={i === stepIdx ? 'text-[#3D2B2B] font-semibold' : ''}>{step.text}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-[#B0A0A0] mt-6">잠시만 기다려 주세요 · 약 30초 소요</p>
      </div>
    </div>
  );
}