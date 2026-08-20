// src/pages/AnalyzingPage.jsx
import { useEffect, useState, useRef } from 'react';
import { useNavigate, useNavigationType } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { analyzeHealth } from '../gemini';
import { storage, db } from '../firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';

const STEPS = [
  { text: '이미지 업로드 중...', emoji: '📤', duration: 1500 },
  { text: '얼굴 피부 상태 분석 중...', emoji: '🔍', duration: 2000 },
  { text: '손톱 영양 상태 분석 중...', emoji: '💅', duration: 1500 },
  { text: '설문 데이터 처리 중...', emoji: '📋', duration: 1500 },
  { text: 'AI 건강 패턴 학습 중...', emoji: '🧠', duration: 2000 },
  { text: '호르몬 참고 지수 산출 중...', emoji: '⚗️', duration: 1500 },
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
  const navigationType = useNavigationType();
  const { faceImage, nailImage, surveyAnswers, actualAge, gender, user, report, setReport } = useApp();
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

    // 2026.8.20 추가 — 뒤로가기 재분석 차단.
    // /report에서 브라우저 뒤로가기를 누르면 이 페이지가 새로 마운트되면서
    // analysisStarted ref가 false로 초기화되는데, AppContext에는 나이·설문·이미지가
    // 그대로 남아 있어 아래 가드를 통과해 버린다 → 유료 Gemini 호출이 한 번 더 나가고
    // 같은 내용의 리포트가 reports 컬렉션에 중복 저장됨.
    // 정상 진입(SurveyPage의 '분석 시작')은 항상 PUSH이므로, POP(뒤로/앞으로/새로고침)
    // 으로 들어온 경우에만 막는다. report 존재 여부만으로 판단하면
    // '홈 → 무료로 시작하기 → 새 분석' 흐름(resetAll을 거치지 않음)이 옛 리포트로
    // 튕기는 회귀가 생기므로 navigationType을 기준으로 삼는다.
    if (navigationType === 'POP') {
      navigate(report?.shareId ? '/report' : '/upload', { replace: true });
      return;
    }

    // 2026.8.12 — 진입 가드. 이 페이지에서 새로고침하거나 /analyzing으로 직접
    // 들어오면 AppContext가 초기화된 상태(actualAge='', 설문 전부 0)에서도 분석이
    // 그대로 실행돼, "실제 나이: NaN세" 프롬프트로 유료 Gemini 호출이 나가고
    // healthAge가 NaN인 쓰레기 문서가 reports 컬렉션에 저장됐음.
    // 설문 응답이 하나도 없으면 정상 흐름을 타지 않은 것으로 보고 업로드로 되돌린다.
    const answeredCount = Object.values(surveyAnswers || {}).filter(v => Number(v) > 0).length;
    if (!actualAge || answeredCount === 0) {
      navigate('/upload', { replace: true });
      return;
    }

    analysisStarted.current = true;

    const doAnalysis = async () => {
      console.log('분석 시작!');
      console.log('actualAge:', actualAge);
      console.log('gender:', gender);
      try {
        let faceUrl = null;
        let nailUrl = null;
        let faceStorageRef = null;
        let nailStorageRef = null;

        // 이미지 업로드 (20초 타임아웃 — 2026.7.3 실사용 테스트에서 10초 초과로
        // faceImageUrl/nailImageUrl이 null 저장되는 사례 확인되어 상향)
        if (user && !user.isGuest && faceImage?.file) {
          try {
            faceStorageRef = ref(storage, `users/${user.uid}/face_${Date.now()}.jpg`);
            await withTimeout(uploadBytes(faceStorageRef, faceImage.file), 20000, 'face upload');
            faceUrl = await withTimeout(getDownloadURL(faceStorageRef), 8000, 'face url');
          } catch (e) {
            console.warn('Face image upload failed:', e.message);
            faceStorageRef = null;
          }
        }

        if (user && !user.isGuest && nailImage?.file) {
          try {
            nailStorageRef = ref(storage, `users/${user.uid}/nail_${Date.now()}.jpg`);
            await withTimeout(uploadBytes(nailStorageRef, nailImage.file), 20000, 'nail upload');
            nailUrl = await withTimeout(getDownloadURL(nailStorageRef), 8000, 'nail url');
          } catch (e) {
            console.warn('Nail image upload failed:', e.message);
            nailStorageRef = null;
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

        // 로그인 사용자는 마이페이지에 저장된 이름/거주지를 리포트에 자동 반영
        // (2026.7.4 발견: 여태 하드코딩된 빈 문자열이라 매번 "리포트 보기" 모달에서
        // 재입력해야 했음 — MyPage.jsx 안내문구 "이름·거주지는 생성된 리포트에
        // 자동으로 반영됩니다"와 실제 동작이 어긋나 있던 부분을 연결)
        let profileName = '';
        let profileCity = '';
        if (user && !user.isGuest) {
          try {
            const userSnap = await getDoc(doc(db, 'users', user.uid));
            if (userSnap.exists()) {
              profileName = userSnap.data().userName || '';
              profileCity = userSnap.data().userCity || '';
            }
          } catch (e) {
            console.warn('프로필 이름/거주지 조회 실패:', e.message);
          }
        }

        // Firestore 저장 (15초 타임아웃, 1회 재시도 — 그래도 실패하면
        // saveFailures 컬렉션에 실패 사실만 기록하고 리포트는 그대로 보여줌)
        let shareId = null;
        const reportPayload = {
          userId: user?.uid || 'guest',
          email: user?.email || 'guest',
          reportData,
          surveyAnswers,
          gender: gender || 'female',
          isPublic: true,
          userName: profileName,
          userCity: profileCity,
          timestamp: serverTimestamp(),
        };

        const trySaveReport = () =>
          withTimeout(
            addDoc(collection(db, 'reports'), reportPayload),
            15000,
            'Firestore'
          );

        try {
          const docRef = await trySaveReport();
          shareId = docRef.id;
          localStorage.setItem('lastShareId', shareId);
          console.log('Firestore 저장 완료:', shareId);
        } catch (firstErr) {
          console.warn('Firestore 저장 1차 실패, 3초 후 재시도:', firstErr.message);
          await new Promise((r) => setTimeout(r, 3000));
          try {
            const docRef = await trySaveReport();
            shareId = docRef.id;
            localStorage.setItem('lastShareId', shareId);
            console.log('Firestore 저장 완료(재시도 성공):', shareId);
          } catch (secondErr) {
            // 재시도까지 실패 — 사용자 경험은 그대로 유지하되, 실패 자체는
            // console.error로 격상하고 saveFailures에 최소 정보만 베스트에포트로 남긴다.
            console.error(
              '❌ Firestore 리포트 저장 최종 실패 (재시도 포함) — reports 컬렉션에 이 분석 결과가 저장되지 않았습니다:',
              secondErr.message
            );
            try {
              await addDoc(collection(db, 'saveFailures'), {
                userId: user?.uid || 'guest',
                actualAge: parseInt(actualAge) || null,
                gender: gender || 'female',
                errorMessage: secondErr.message || String(secondErr),
                timestamp: serverTimestamp(),
              });
            } catch (logErr) {
              // 실패 로그조차 실패하면 콘솔에만 남긴다 (더 이상 할 수 있는 게 없음)
              console.error('saveFailures 기록도 실패:', logErr.message);
            }
          }
        }

        setReport({ ...reportData, shareId, userName: profileName, userCity: profileCity });

        // 분석 완료 후 Storage 이미지 삭제 (실패해도 리포트 이동 무관)
        if (faceStorageRef) deleteObject(faceStorageRef).catch(e => console.warn('Face delete failed:', e.message));
        if (nailStorageRef) deleteObject(nailStorageRef).catch(e => console.warn('Nail delete failed:', e.message));

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
        <button onClick={() => navigate('/')} className="text-sm text-[#7A6060] mt-3">홈으로 돌아가기</button>
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
        <p className="text-xs text-[#8A7A7A] mb-8">{Math.round(progressPct)}% 완료</p>
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
        <p className="text-xs text-[#8A7A7A] mt-6">잠시만 기다려 주세요 · 약 30초 소요</p>
      </div>
    </div>
  );
}