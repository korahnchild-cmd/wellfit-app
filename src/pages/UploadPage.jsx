// src/pages/UploadPage.jsx
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Camera, Fingerprint, ChevronRight, ChevronLeft, Check, Upload, Info } from 'lucide-react';

function ImageUploadCard({ id, title, subtitle, emoji, icon: Icon, preview, onFile, hint }) {
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
    <div className="card">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-rose-gradient flex items-center justify-center shadow-rose">
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

      <div
        className={`upload-zone relative cursor-pointer transition-all duration-300 ${dragging ? 'drag-over' : ''}`}
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
          capture="user"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />

        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt={title}
              className="w-full h-52 object-cover rounded-3xl"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-3xl opacity-0 hover:opacity-100 transition-opacity">
              <div className="text-white text-sm font-semibold flex items-center gap-2">
                <Upload size={16} />
                다시 선택
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <span className="text-5xl animate-float">{emoji}</span>
            <p className="text-sm font-semibold text-mauve">탭하여 사진 선택</p>
            <p className="text-xs text-[#B0A0A0]">또는 여기에 드래그&드롭</p>
          </div>
        )}
      </div>

      {hint && (
        <div className="flex items-start gap-2 mt-3 p-3 bg-cream-dark rounded-2xl">
          <Info size={13} className="text-rose-gold mt-0.5 flex-shrink-0" />
          <p className="text-xs text-[#7A6060] leading-relaxed">{hint}</p>
        </div>
      )}
    </div>
  );
}

export default function UploadPage() {
  const navigate = useNavigate();
  const { faceImage, setFaceImage, nailImage, setNailImage, actualAge, setActualAge, gender, setGender } = useApp();

  const canProceed = actualAge && parseInt(actualAge) >= 20 && parseInt(actualAge) <= 80 && gender;

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
          {/* 진행 표시 */}
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

      <div className="p-4 space-y-4 pb-32">
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

        {/* 얼굴 업로드 */}
        <ImageUploadCard
          id="face-upload"
          title="얼굴 정면 사진"
          subtitle="피부 상태 · 혈색 분석"
          emoji="🤳"
          icon={Camera}
          preview={faceImage?.preview}
          onFile={setFaceImage}
          hint="밝은 곳에서 정면을 바라보고 찍어주세요. 화장이 없는 사진이 더 정확합니다."
        />

        {/* 손톱 업로드 */}
        <ImageUploadCard
          id="nail-upload"
          title="손톱 사진"
          subtitle="손톱 색상 · 상태 분석"
          emoji="💅"
          icon={Fingerprint}
          preview={nailImage?.preview}
          onFile={setNailImage}
          hint="손톱 여러 개가 보이도록 손을 펴서 찍어주세요. 네일 아트가 없는 사진을 권장합니다."
        />

        {/* 건너뛰기 안내 */}
        <p className="text-xs text-center text-[#B0A0A0]">
          사진은 선택사항입니다 · 나이·성별 입력 후 다음 단계로 진행 가능
        </p>
      </div>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pb-6 pt-4 bg-cream-gradient border-t border-cream-deeper">
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
            나이와 성별을 입력해주세요 (20~80세)
          </p>
        )}
      </div>
    </div>
  );
}
