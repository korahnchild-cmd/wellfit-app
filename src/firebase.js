// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
// 2026.8.21 — getAnalytics()는 쿠키/스토리지가 막힌 환경, 지원하지 않는 브라우저,
// measurementId 누락 시 throw한다. 모듈 최상단에서 던지면 앱 전체가 로드에 실패하므로
// 방어한다(측정은 부가 기능, 서비스 동작을 막아선 안 됨).
export const analytics = (() => {
  try {
    return typeof window !== 'undefined' ? getAnalytics(app) : null;
  } catch (err) {
    console.warn('Analytics 초기화 실패(무시하고 계속):', err?.message);
    return null;
  }
})();

export default app;
