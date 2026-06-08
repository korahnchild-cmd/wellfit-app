// src/pages/GeneratedReportPage.jsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { generateReportHTML } from '../utils/generateReport';

export default function GeneratedReportPage() {
  const { shareId } = useParams();
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
