// src/pages/GeneratedReportPage.jsx
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { generateReportHTML } from '../utils/generateReport';

export default function GeneratedReportPage() {
  const { shareId } = useParams();
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(false);

  const shareUrl = `https://korahnchild-cmd.github.io/wellfit-app/report-view/${shareId}`;

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: '나의 웰핏 건강 리포트', url: shareUrl });
      } catch {
        // 사용자가 취소한 경우 등 무시
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setToast(true);
      setTimeout(() => setToast(false), 2500);
    }
  }, [shareUrl]);

  useEffect(() => {
    const MAX_RETRIES = 3;
    let retries = 0;

    const fetchReport = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'reports', shareId));
        if (docSnap.exists()) {
          const data = docSnap.data();
          const rd = data.reportData;
          const shareUrl = `https://korahnchild-cmd.github.io/wellfit-app/report-view/${shareId}`;
          const generated = generateReportHTML({
            report: rd,
            actualAge: rd.actualAge,
            gender: data.gender || rd.gender || 'female',
            userName: data.userName || '',
            userCity: data.userCity || '',
            shareId,
            shareUrl,
          });
          setHtml(generated);
          setLoading(false);
        } else if (retries < MAX_RETRIES) {
          retries++;
          setTimeout(fetchReport, 1500);
        } else {
          setError('리포트를 찾을 수 없습니다.');
          setLoading(false);
        }
      } catch {
        if (retries < MAX_RETRIES) {
          retries++;
          setTimeout(fetchReport, 1500);
        } else {
          setError('리포트를 불러오는 중 오류가 발생했습니다.');
          setLoading(false);
        }
      }
    };

    fetchReport();
  }, [shareId]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#FDFAF6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner-rose mx-auto mb-4" />
          <p style={{ fontSize: '14px', color: '#9A8080' }}>리포트 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !html) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#FDFAF6', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>😢</div>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#3D2B2B' }}>
          {error || '리포트를 찾을 수 없습니다.'}
        </h2>
      </div>
    );
  }

  return (
    <div>
      <div dangerouslySetInnerHTML={{ __html: html }} />

      {/* React 공유하기 버튼 */}
      <div style={{ padding: '0 20px 40px', backgroundColor: '#FDFAF6' }}>
        <button
          onClick={handleShare}
          style={{
            display: 'block',
            width: '100%',
            padding: '16px',
            background: 'linear-gradient(135deg, #C9967A 0%, #B8835A 100%)',
            color: '#fff',
            fontSize: '16px',
            fontWeight: '600',
            letterSpacing: '0.5px',
            border: 'none',
            borderRadius: '14px',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(184,131,90,0.35)',
          }}
        >
          🔗 공유하기
        </button>
      </div>

      {/* 클립보드 복사 토스트 */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '60px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(61,43,43,0.88)',
          color: '#fff',
          padding: '12px 24px',
          borderRadius: '24px',
          fontSize: '14px',
          fontWeight: '500',
          whiteSpace: 'nowrap',
          zIndex: 9999,
          pointerEvents: 'none',
        }}>
          링크가 복사되었습니다
        </div>
      )}
    </div>
  );
}
