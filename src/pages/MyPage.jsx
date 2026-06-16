// src/pages/MyPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useApp } from '../context/AppContext';
import { ChevronLeft, Copy, Check, Users, TrendingUp, Star, Share2 } from 'lucide-react';

// ── 수익 계산 상수
const DIRECT_RATE = 14950;    // 직접 추천 25%
const OVERRIDE_RATE = 2990;   // 오버라이딩 20%
const BASE_URL = 'https://korahnchild-cmd.github.io/wellfit-app';

export default function MyPage() {
  const navigate = useNavigate();
  const { user, myReferralCode } = useApp();

  // 탭 상태
  const [activeTab, setActiveTab] = useState('info');

  // 내 정보 탭
  const [referredBy, setReferredBy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  // 파트너 현황 탭
  const [partnerData, setPartnerData] = useState({
    directPartners: 0,
    partnerCustomers: 0,
    totalEarnings: 0,
    thisMonthEarnings: 0,
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user || user.isGuest) {
      navigate('/login');
      return;
    }
    (async () => {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        const data = snap.data();
        setReferredBy(data.referredBy || null);
        setPartnerData({
          directPartners: data.directPartners || 0,
          partnerCustomers: data.partnerCustomers || 0,
          totalEarnings: data.totalEarnings || 0,
          thisMonthEarnings: data.thisMonthEarnings || 0,
        });
      }
      setLoading(false);
    })();
  }, [user, navigate]);

  // 추천코드 저장
  const handleSave = async () => {
    if (!code.trim()) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { referredBy: code.trim() });
      setReferredBy(code.trim());
      showToast('추천코드가 등록되었습니다 ✓');
    } catch {
      showToast('저장 중 오류가 발생했습니다');
    } finally {
      setSaving(false);
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // 링크 복사
  const handleCopyLink = async () => {
    const link = `${BASE_URL}/?ref=${myReferralCode}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      showToast('추천 링크가 복사되었습니다 ✓');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('복사에 실패했습니다. 직접 선택해 복사해주세요');
    }
  };

  // 코드 복사
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(myReferralCode);
      showToast('추천코드가 복사되었습니다 ✓');
    } catch {
      showToast('복사 실패');
    }
  };

  // 공유하기
  const handleShare = async () => {
    const link = `${BASE_URL}/?ref=${myReferralCode}`;
    const text = `웰핏+ CHECK-UP — 셀카 한 장으로 호르몬·영양 상태를 AI로 분석해드려요. 14일 무료 체험해보세요!\n${link}`;
    if (navigator.share) {
      await navigator.share({ title: '웰핏+ CHECK-UP', text, url: link });
    } else {
      await navigator.clipboard.writeText(text);
      showToast('공유 텍스트가 복사되었습니다 ✓');
    }
  };

  // 수익 계산
  const directIncome = partnerData.directPartners * DIRECT_RATE;
  const overrideIncome = partnerData.directPartners * partnerData.partnerCustomers * OVERRIDE_RATE;
  const totalMonthly = directIncome + overrideIncome;

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center">
        <p className="text-sm text-[#9A8080]">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="page-container overflow-hidden">
      {/* 배경 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-br from-rose-gold/20 to-mauve/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-gradient-to-tr from-mauve/15 to-rose-gold/15 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen px-6 py-12">
        {/* 헤더 */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-[#9A8080] hover:text-rose-gold transition-colors mb-6"
        >
          <ChevronLeft size={16} />
          돌아가기
        </button>

        <h1 className="text-xl font-black text-[#3D2B2B] mb-5">마이페이지</h1>

        {/* 탭 */}
        <div className="flex gap-2 mb-6 p-1 bg-white/60 rounded-2xl border border-white/80">
          {[
            { id: 'info', label: '내 정보' },
            { id: 'partner', label: '파트너 현황' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-rose-gradient text-white shadow-rose'
                  : 'text-[#9A8080] hover:text-rose-gold'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── 내 정보 탭 ── */}
        {activeTab === 'info' && (
          <div className="space-y-4">
            {/* 계정 정보 */}
            <div className="card-glass p-5">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-full bg-rose-gradient flex items-center justify-center text-white font-bold text-base">
                  {(user.displayName || user.email || '?').slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#3D2B2B]">
                    {user.displayName || '사용자'}
                  </p>
                  <p className="text-xs text-[#9A8080]">{user.email}</p>
                </div>
              </div>
            </div>

            {/* 추천코드 입력 */}
            <div className="card-glass p-5">
              <h2 className="text-sm font-bold text-[#3D2B2B] mb-1">추천코드 등록</h2>
              <p className="text-xs text-[#9A8080] mb-4">
                친구에게 받은 추천코드를 입력하면 혜택이 적용됩니다.
              </p>
              {referredBy ? (
                <div className="bg-purple-50 rounded-xl px-4 py-3 text-center">
                  <p className="text-sm font-bold text-[#8B5E83]">추천코드가 등록되어 있습니다</p>
                  <p className="text-xs text-[#9A8080] mt-1">{referredBy}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="추천코드 입력"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
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
        )}

        {/* ── 파트너 현황 탭 ── */}
        {activeTab === 'partner' && (
          <div className="space-y-4">

            {/* 내 추천코드 + 링크 */}
            <div className="card-glass p-5">
              <div className="flex items-center gap-2 mb-3">
                <Star size={15} className="text-rose-gold" />
                <h2 className="text-sm font-bold text-[#3D2B2B]">내 추천코드</h2>
              </div>

              {/* 코드 표시 */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 bg-white rounded-xl px-4 py-3 border border-rose-gold/20 text-center">
                  <span className="text-xl font-black tracking-widest text-[#3D2B2B]">
                    {myReferralCode || '생성 중...'}
                  </span>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="w-11 h-11 rounded-xl bg-rose-gold/10 border border-rose-gold/20 flex items-center justify-center text-rose-gold hover:bg-rose-gold/20 transition-colors"
                >
                  <Copy size={16} />
                </button>
              </div>

              {/* 추천 링크 */}
              <div className="bg-white/60 rounded-xl px-3 py-2.5 border border-white/80 mb-3">
                <p className="text-[10px] text-[#9A8080] mb-0.5">내 추천 링크</p>
                <p className="text-xs text-[#7A6060] break-all leading-relaxed">
                  {BASE_URL}/?ref={myReferralCode}
                </p>
              </div>

              {/* 버튼 2개 */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleCopyLink}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                    copied
                      ? 'bg-green-50 border-green-200 text-green-600'
                      : 'bg-rose-gold/10 border-rose-gold/20 text-rose-gold hover:bg-rose-gold/20'
                  }`}
                >
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                  {copied ? '복사됨!' : '링크 복사'}
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-mauve/10 border border-mauve/20 text-mauve hover:bg-mauve/20 transition-colors"
                >
                  <Share2 size={15} />
                  공유하기
                </button>
              </div>
            </div>

            {/* 이번달 수익 */}
            <div className="card-glass p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={15} className="text-rose-gold" />
                <h2 className="text-sm font-bold text-[#3D2B2B]">이번달 예상 수익</h2>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white/70 rounded-xl p-3 border border-rose-gold/15 text-center">
                  <p className="text-[10px] text-[#9A8080] mb-1">직접 추천 수익</p>
                  <p className="text-base font-black text-[#C8956C]">
                    {directIncome.toLocaleString()}원
                  </p>
                  <p className="text-[10px] text-[#9A8080] mt-0.5">
                    {partnerData.directPartners}명 × 14,950원
                  </p>
                </div>
                <div className="bg-white/70 rounded-xl p-3 border border-mauve/15 text-center">
                  <p className="text-[10px] text-[#9A8080] mb-1">오버라이딩 수익</p>
                  <p className="text-base font-black text-[#8B5E83]">
                    {overrideIncome.toLocaleString()}원
                  </p>
                  <p className="text-[10px] text-[#9A8080] mt-0.5">
                    파트너 고객 × 2,990원
                  </p>
                </div>
              </div>

              {/* 합계 */}
              <div className="bg-rose-gradient rounded-xl p-4 text-center">
                <p className="text-xs text-white/70 mb-1">월 예상 총 수익</p>
                <p className="text-2xl font-black text-white">
                  {totalMonthly.toLocaleString()}원
                </p>
              </div>
            </div>

            {/* 파트너 현황 */}
            <div className="card-glass p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users size={15} className="text-rose-gold" />
                <h2 className="text-sm font-bold text-[#3D2B2B]">파트너 현황</h2>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white/70 rounded-xl p-3 border border-white/80 text-center">
                  <p className="text-[10px] text-[#9A8080] mb-1">내 구독고객</p>
                  <p className="text-2xl font-black text-[#3D2B2B]">
                    {partnerData.directPartners}
                    <span className="text-sm font-medium text-[#9A8080]">명</span>
                  </p>
                  <p className="text-[10px] text-[#9A8080] mt-0.5">직접 모집</p>
                </div>
                <div className="bg-white/70 rounded-xl p-3 border border-white/80 text-center">
                  <p className="text-[10px] text-[#9A8080] mb-1">파트너 고객</p>
                  <p className="text-2xl font-black text-[#3D2B2B]">
                    {partnerData.directPartners * partnerData.partnerCustomers}
                    <span className="text-sm font-medium text-[#9A8080]">명</span>
                  </p>
                  <p className="text-[10px] text-[#9A8080] mt-0.5">오버라이딩 발생</p>
                </div>
              </div>

              {/* 누적 수익 */}
              <div className="flex items-center justify-between px-4 py-3 bg-white/60 rounded-xl border border-white/80">
                <span className="text-xs text-[#9A8080]">누적 총 수익</span>
                <span className="text-base font-black text-[#3D2B2B]">
                  {partnerData.totalEarnings.toLocaleString()}원
                </span>
              </div>
            </div>

            {/* 안내 */}
            <div className="bg-white/40 rounded-2xl px-4 py-3 border border-white/60">
              <p className="text-[11px] text-[#9A8080] leading-relaxed">
                💡 수익은 매월 말 정산 후 익월 10일 입금됩니다.<br />
                구독고객 수·수익은 관리자가 월 1회 업데이트합니다.
              </p>
            </div>

          </div>
        )}
      </div>

      {/* 토스트 */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-[#3D2B2B] text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-lg whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  );
}
