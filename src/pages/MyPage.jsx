// src/pages/MyPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useApp } from '../context/AppContext';
import { ChevronLeft } from 'lucide-react';

export default function MyPage() {
  const navigate = useNavigate();
  const { user } = useApp();
  const [referredBy, setReferredBy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!user || user.isGuest) {
      navigate('/login');
      return;
    }
    (async () => {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        setReferredBy(snap.data().referredBy || null);
      }
      setLoading(false);
    })();
  }, [user, navigate]);

  const handleSave = async () => {
    if (!code.trim()) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { referredBy: code.trim() });
      setReferredBy(code.trim());
      setToast('추천코드가 등록되었습니다');
      setTimeout(() => setToast(''), 3000);
    } catch {
      setToast('저장 중 오류가 발생했습니다');
      setTimeout(() => setToast(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center">
        <p className="text-sm text-[#9A8080]">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="page-container overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-br from-rose-gold/20 to-mauve/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-gradient-to-tr from-mauve/15 to-rose-gold/15 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen px-6 py-12">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-[#9A8080] hover:text-rose-gold transition-colors mb-8"
        >
          <ChevronLeft size={16} />
          돌아가기
        </button>

        <h1 className="text-xl font-black text-[#3D2B2B] mb-6">마이페이지</h1>

        <div className="card-glass p-6">
          <h2 className="text-base font-bold text-[#3D2B2B] mb-1">추천코드 등록</h2>
          <p className="text-xs text-[#9A8080] mb-4">
            친구에게 받은 추천코드를 입력하면 혜택이 적용됩니다.
          </p>

          {referredBy ? (
            <div className="bg-purple-50 rounded-xl px-4 py-3 text-center">
              <p className="text-sm font-bold text-[#8B5E83]">
                이미 추천코드가 등록되어 있습니다
              </p>
              <p className="text-xs text-[#9A8080] mt-1">{referredBy}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="추천코드 입력"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="input-field w-full"
                maxLength={20}
              />
              <button
                onClick={handleSave}
                disabled={saving || !code.trim()}
                className="btn-primary w-full disabled:opacity-50"
              >
                {saving ? '등록 중...' : '확인'}
              </button>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-[#3D2B2B] text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
