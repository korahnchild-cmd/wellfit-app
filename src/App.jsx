// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import HomePage from './pages/HomePage';
import UploadPage from './pages/UploadPage';
import SurveyPage from './pages/SurveyPage';
import AnalyzingPage from './pages/AnalyzingPage';
import ReportPage from './pages/ReportPage';
import SharedReportPage from './pages/SharedReportPage';
import GeneratedReportPage from './pages/GeneratedReportPage';
import LoginPage from './pages/LoginPage';
import MyPage from './pages/MyPage';
import PartnerDashboard from './pages/PartnerDashboard';
import BottomNav from './components/BottomNav';
import PrivacyPage from './pages/PrivacyPage';
import KakaoCallbackPage from './pages/KakaoCallbackPage';
import NaverCallbackPage from './pages/NaverCallbackPage';
import TermsPage from './pages/TermsPage';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/survey" element={<SurveyPage />} />
          <Route path="/analyzing" element={<AnalyzingPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/shared/:shareId" element={<SharedReportPage />} />
          <Route path="/report-view/:shareId" element={<GeneratedReportPage />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/partner-dashboard" element={<PartnerDashboard />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/auth/kakao" element={<KakaoCallbackPage />} />
          <Route path="/auth/naver" element={<NaverCallbackPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <BottomNav />
      </BrowserRouter>
    </AppProvider>
  );
}
