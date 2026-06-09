// src/context/AppContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
const AppContext = createContext(null);
export const SURVEY_QUESTIONS = [
  // 수면 (3문항)
  { id: 'sleep1', category: '수면', text: '잠들기 어렵다', emoji: '😴', categoryColor: 'text-blue-500' },
  { id: 'sleep2', category: '수면', text: '자다가 자주 깬다', emoji: '🌙', categoryColor: 'text-blue-500' },
  { id: 'sleep3', category: '수면', text: '아침에 일어나도 피곤하다', emoji: '☀️', categoryColor: 'text-blue-500' },
  // 식습관 (3문항)
  { id: 'diet1', category: '식습관', text: '최근 식욕이 변했다', emoji: '🍽️', categoryColor: 'text-green-500' },
  { id: 'diet2', category: '식습관', text: '체중 변화가 생겼다', emoji: '⚖️', categoryColor: 'text-green-500' },
  { id: 'diet3', category: '식습관', text: '소화가 불편하다', emoji: '🫃', categoryColor: 'text-green-500' },
  // 스트레스 (3문항)
  { id: 'stress1', category: '스트레스', text: '집중력이 떨어진다', emoji: '🧠', categoryColor: 'text-orange-500' },
  { id: 'stress2', category: '스트레스', text: '감정 기복이 심하다', emoji: '🌊', categoryColor: 'text-orange-500' },
  { id: 'stress3', category: '스트레스', text: '만성 피로를 느낀다', emoji: '😮‍💨', categoryColor: 'text-orange-500' },
  // 갱년기 (4문항)
  { id: 'meno1', category: '갱년기', text: '얼굴이나 상체에 열감이 있다', emoji: '🔥', categoryColor: 'text-red-400' },
  { id: 'meno2', category: '갱년기', text: '식은땀이 난다', emoji: '💧', categoryColor: 'text-red-400' },
  { id: 'meno3', category: '갱년기', text: '관절이 불편하다', emoji: '🦴', categoryColor: 'text-red-400' },
  { id: 'meno4', category: '갱년기', text: '피부가 건조하거나 가렵다', emoji: '🌿', categoryColor: 'text-red-400' },
  // 영양 (5문항)
  { id: 'nutri1', category: '영양', text: '머리카락이 많이 빠진다', emoji: '💆', categoryColor: 'text-purple-500' },
  { id: 'nutri2', category: '영양', text: '손톱이 잘 부러지거나 변색되었다', emoji: '💅', categoryColor: 'text-purple-500' },
  { id: 'nutri3', category: '영양', text: '피부가 건조하고 윤기가 없다', emoji: '✨', categoryColor: 'text-purple-500' },
  { id: 'nutri4', category: '영양', text: '이유 없이 무기력하고 의욕이 없다', emoji: '🪴', categoryColor: 'text-purple-500' },
  { id: 'extra1', category: '영양', text: '운동을 주 1회 미만 한다', emoji: '🏃', categoryColor: 'text-purple-500' },
];
const initialSurvey = Object.fromEntries(SURVEY_QUESTIONS.map((q) => [q.id, 0]));
export function AppProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
        const firestoreData = snap.exists() ? snap.data() : {};
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          subscriptionStatus: firestoreData.subscriptionStatus || 'free_trial',
          trialStartDate: firestoreData.trialStartDate || null,
          analysisCount: firestoreData.analysisCount || 0,
        });
      } else {
        setUser((prev) => (prev?.isGuest ? prev : null));
      }
    });
    return () => unsubscribe();
  }, []);

  const [faceImage, setFaceImage] = useState(null);
  const [nailImage, setNailImage] = useState(null);
  const [surveyAnswers, setSurveyAnswers] = useState(initialSurvey);
  const [actualAge, setActualAge] = useState('');
  const [gender, setGender] = useState(''); // 'female' | 'male'
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
