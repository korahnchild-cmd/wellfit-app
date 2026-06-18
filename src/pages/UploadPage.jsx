// src/pages/UploadPage.jsx
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Camera, Fingerprint, ChevronRight, ChevronLeft, Check, Upload, Info } from 'lucide-react';
import faceGuide from '../assets/face_guide.jpg';
import nailGuide from '../assets/nail_guide.jpg';

function ImageUploadCard({ id, title, subtitle, icon: Icon, preview, onFile, hint, tips, guideImage, accentColor = '#C8956C' }) {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    onFile({ file, preview: url });
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* 카드 헤더 */}
      <div className="flex items-center gap-3 p-4 pb-0">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-rose"
          style={{ background: `linear-gradient(135deg, ${accentColor}, #8B5E83)` }}>
          <Icon size={18} className="text-white" />
        </div>
        <div>
          <h3 className="font-bold text-[#3D2B2B]">{title}</h3>
          <p className="text-xs text-[#9A8080]">{subtitle}</p>
        </div>
        {preview && (
          <div className="ml-auto w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <Check size={16} className="text-green-500" />
          </div>
        )}
      </div>

      {/* 촬영 영역 */}
      <div
        className={`relative cursor-pointer transition-all duration-300 mt-3 ${dragging ? 'opacity-80' : ''}`}
        style={{ height: '220px' }}
        onClick={() => inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <input
          id={id}
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />

        {preview ? (
          /* 촬영 완료 — 미리보기 */
          <div className="relative h-full">
            <img src={preview} alt={title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 active:opacity-100 transition-opacity">
              <div className="text-white text-sm font-bold flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center">
                  <Upload size={16} />
                </div>
                다시 촬영
              </div>
            </div>
          </div>
        ) : (
          /* 촬영 전 — 가이드 이미지 */
          <div className="relative h-full">
            {/* 가이드 이미지 */}
            <img
              src={guideImage}
              alt={`${title} 가이드`}
              className="w-full h-full object-cover"
              style={{ opacity: 0.85 }}
            />
            {/* 다크 오버레이 */}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.45) 100%)' }} />

            {/* 중앙 촬영 버튼 */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div
                className="flex items-center justify-center"
                style={{
                  width: 64, height: 64, borderRadius: '50%',
                  border: `2.5px solid ${accentColor}`,
                  background: 'rgba(0,0,0,0.3)',
                  backdropFilter: 'blur(4px)',
                }}
              >
                <div style={{ width: 46, height: 46, borderRadius: '50%', background: `linear-gradient(135deg, ${accentColor}, #8B5E83)` }} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', letterSpacing: '0.3px', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
                탭하여 촬영
              </span>
            </div>

            {/* 드래그 오버 표시 */}
            {dragging && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: `rgba(${accentColor === '#C8956C' ? '200,149,108' : '139,94,131'},0.3)`, border: `2px dashed ${accentColor}` }}>
                <p className="text-white font-bold text-sm">여기에 놓으세요</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 힌트 + 팁 */}
      <div className="p-4 pt-3 space-y-2">
        {hint && (
          <div className="flex items-start gap-2 p-3 bg-cream-dark rounded-2xl">
            <Info size={13} className="text-rose-gold mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[#7A6060] leading-relaxed">{hint}</p>
          </div>
        )}
        {tips && tips.length > 0 && (
          <div className="space-y-1.5">
            {tips.map((tip, i) => (
              <div key={i} className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-2xl">
                <p className="text-xs text-amber-800 leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function UploadPage() {
  const navigate = useNavigate();
  const { faceImage, setFaceImage, nailImage, setNailImage, actualAge, setActualAge, gender, setGender } = useApp();
  const [consentChecked, setConsentChecked] = useState(false);
  const [disclaimerChecked, setDisclaimerChecked] = useState(false);

  const canProceed =
    actualAge &&
    parseInt(actualAge) >= 20 &&
    parseInt(actualAge) <= 80 &&
    gender &&
    faceImage &&
    nailImage &&
    consentChecked &&
    disclaimerChecked;

  // 안내 메시지
  const getProceedHint = () => {
    if (!consentChecked || !disclaimerChecked) return '아래 필수 동의 항목을 모두 체크해주세요';
    if (!actualAge || parseInt(actualAge) < 20 || parseInt(actualAge) > 80) return '나이를 입력해주세요 (20~80세)';
    if (!gender) return '성별을 선택해주세요';
    if (!faceImage) return '얼굴 정면 사진을 업로드해주세요';
    if (!nailImage) return '손톱 사진을 업로드해주세요';
    return '';
  };

  return (
    <div className="page-container">
      {/* 헤더 */}
      <div className="bg-white/80 backdrop-blur-sm sticky top-0 z-10 px-4 py-4 border-b border-cream-deeper">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-cream-dark rounded-full transition-colors"
          >
            <ChevronLeft size={20} className="text-[#7A6060]" />
          </button>
          <div>
            <h2 className="font-bold text-[#3D2B2B]">사진 업로드</h2>
            <p className="text-xs text-[#9A8080]">Step 1 / 3</p>
          </div>
          <div className="ml-auto flex gap-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all duration-300 ${
                  s === 1 ? 'w-6 bg-rose-gradient' : 'w-2 bg-cream-deeper'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 pb-48">
        {/* 안내 배너 */}
        <div className="rounded-3xl bg-rose-gradient p-4 text-white">
          <p className="font-bold text-sm mb-1">📸 AI 이미지 분석</p>
          <p className="text-xs opacity-90 leading-relaxed">
            얼굴과 손톱 사진으로 피부 상태와 영양 결핍 징후를 분석합니다.
            사진 없이도 설문만으로 분석 가능합니다.
          </p>
        </div>

        {/* 나이 + 성별 입력 */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-mauve flex items-center justify-center shadow-mauve">
              <span className="text-white text-lg">👤</span>
            </div>
            <div>
              <h3 className="font-bold text-[#3D2B2B]">기본 정보 입력</h3>
              <p className="text-xs text-[#9A8080]">건강 나이 비교를 위해 필요합니다</p>
            </div>
          </div>

          {/* 나이 입력 */}
          <div className="flex items-center gap-3 mb-4">
            <input
              id="age-input"
              type="number"
              placeholder="만 나이 입력"
              value={actualAge}
              onChange={(e) => setActualAge(e.target.value)}
              min="20"
              max="80"
              className="input-field flex-1 text-center text-lg font-bold"
            />
            <span className="text-[#3D2B2B] font-semibold">세</span>
          </div>
          {actualAge && (parseInt(actualAge) < 20 || parseInt(actualAge) > 80) && (
            <p className="text-xs text-red-400 mb-3 pl-1">20~80세 사이로 입력해주세요</p>
          )}

          {/* 성별 선택 */}
          <div>
            <p className="text-sm font-semibold text-[#3D2B2B] mb-2">성별 선택</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setGender('female')}
                className={`py-3 rounded-2xl font-bold text-sm transition-all duration-200 border-2 ${
                  gender === 'female'
                    ? 'bg-rose-gradient text-white border-transparent shadow-rose'
                    : 'bg-cream-dark text-[#9A8080] border-cream-deeper hover:border-rose-gold'
                }`}
              >
                👩 여성
              </button>
              <button
                onClick={() => setGender('male')}
                className={`py-3 rounded-2xl font-bold text-sm transition-all duration-200 border-2 ${
                  gender === 'male'
                    ? 'bg-mauve text-white border-transparent shadow-mauve'
                    : 'bg-cream-dark text-[#9A8080] border-cream-deeper hover:border-mauve'
                }`}
              >
                👨 남성
              </button>
            </div>
            {!gender && actualAge && (
              <p className="text-xs text-[#B0A0A0] mt-2 pl-1">성별을 선택해주세요</p>
            )}
          </div>
        </div>

        {/* ── 필수 동의 2개 묶음 ── */}
        <div className="space-y-2">
          {/* 동의 1: 생체정보 수집 */}
          <label className="flex items-start gap-3 p-3 bg-cream-dark rounded-2xl border border-cream-deeper cursor-pointer hover:border-rose-gold/40 transition-colors">
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              className="mt-0.5 flex-shrink-0 w-4 h-4 rounded cursor-pointer"
              style={{ accentColor: '#C8956C' }}
            />
            <span className="text-xs text-[#7A6060] leading-relaxed">
              얼굴·손톱 이미지는 AI 분석 후 즉시 삭제되며, 제3자에게 제공되지 않습니다.
              생체정보 수집 및 이용에 동의합니다.{' '}
              <span className="font-semibold text-rose-gold">(필수)</span>
            </span>
          </label>

          {/* 동의 2: 의료 면책 고지 */}
          <label className="flex items-start gap-3 p-3 bg-cream-dark rounded-2xl border border-cream-deeper cursor-pointer hover:border-rose-gold/40 transition-colors">
            <input
              type="checkbox"
              checked={disclaimerChecked}
              onChange={(e) => setDisclaimerChecked(e.target.checked)}
              className="mt-0.5 flex-shrink-0 w-4 h-4 rounded cursor-pointer"
              style={{ accentColor: '#C8956C' }}
            />
            <span className="text-xs text-[#7A6060] leading-relaxed">
              본 서비스는 의료 진단을 대체하지 않으며, 라이프스타일 코칭 및 건강 관리 참고 자료를 제공합니다.{' '}
              <span className="font-semibold text-rose-gold">(필수)</span>
            </span>
          </label>
        </div>

        {/* 얼굴 업로드 */}
        <ImageUploadCard
          id="face-upload"
          title="얼굴 정면 사진"
          subtitle="피부 상태 · 혈색 분석"
          icon={Camera}
          preview={faceImage?.preview}
          onFile={setFaceImage}
          guideImage={faceGuide}
          accentColor="#C8956C"
          hint="밝은 곳에서 정면을 바라보고 찍어주세요. 화장이 없는 사진이 더 정확합니다."
          tips={["📸 후면 카메라로 촬영하면 분석 정확도가 높아집니다"]}
        />

        {/* 손톱 업로드 */}
        <ImageUploadCard
          id="nail-upload"
          title="손톱 사진"
          subtitle="손톱 색상 · 상태 분석"
          icon={Fingerprint}
          preview={nailImage?.preview}
          onFile={setNailImage}
          guideImage={nailGuide}
          accentColor="#8B5E83"
          hint="손등이 보이도록 손가락을 펴서 찍어주세요. 네일 아트가 없는 사진을 권장합니다."
          tips={[
            "📸 후면 카메라로 촬영해주세요",
            "✋ 세 손가락 이상 한 화면에 나오게 찍어주세요",
          ]}
        />

        <p className="text-xs text-center text-[#B0A0A0]">
          얼굴·손톱 사진 모두 필수입니다
        </p>
      </div>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pb-4 pt-4 bg-cream-gradient border-t border-cream-deeper">
        <button
          id="upload-next-btn"
          onClick={() => navigate('/survey')}
          disabled={!canProceed}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          다음 단계 (설문)
          <ChevronRight size={18} />
        </button>
        {!canProceed && (
          <p className="text-xs text-center text-[#B0A0A0] mt-2">
            {getProceedHint()}
          </p>
        )}
      </div>
    </div>
  );
}
