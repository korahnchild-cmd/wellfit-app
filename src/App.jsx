// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import HomePage from './pages/HomePage';
import UploadPage from './pages/UploadPage';
import SurveyPage from './pages/SurveyPage';
import AnalyzingPage from './pages/AnalyzingPage';
import ReportPage from './pages/ReportPage';
import SharedReportPage from './pages/SharedReportPage';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter basename="/wellfit-app">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/survey" element={<SurveyPage />} />
          <Route path="/analyzing" element={<AnalyzingPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/report/:reportId" element={<SharedReportPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
